import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar
} from 'recharts';
import { TrendingUp, Activity, ArrowLeftRight, AlertCircle } from 'lucide-react';

// Marktphasen-Typen
export type MarketPhase = 'trend' | 'range' | 'volatile';

// Datentypen
interface MarketPhaseDistribution {
  phase: string;
  count: number;
  percentage: number;
  color: string;
}

interface MarketPhasePerformance {
  phase: string;
  winRate: number;
  avgRR: number;
  totalTrades: number;
  color: string;
}

interface MarketPhaseSetupPerformance {
  setup: string;
  trend: number;
  range: number;
  volatile: number;
}

interface MarketPhaseRecommendation {
  id: string;
  phase: MarketPhase;
  recommendation: string;
  explanation: string;
}

export default function MarketPhaseAnalysis({ userId }: { userId: number }) {
  const [activeTab, setActiveTab] = useState('distribution');

  // Farben für die verschiedenen Marktphasen
  const phaseColors = {
    trend: '#4F46E5',   // Indigo
    range: '#10B981',   // Grün
    volatile: '#F59E0B', // Gelb
  };

  // Abfrage der Marktphasen-Verteilung
  const { data: distribution = [], isLoading: distributionLoading } = useQuery({
    queryKey: ['/api/market-phases/distribution', userId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/market-phases/distribution?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch market phase distribution');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching market phase distribution:', error);
        return [];
      }
    },
  });

  // Abfrage der Marktphasen-Performance
  const { data: performance = [], isLoading: performanceLoading } = useQuery({
    queryKey: ['/api/market-phases/performance', userId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/market-phases/performance?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch market phase performance');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching market phase performance:', error);
        return [];
      }
    },
  });

  // Abfrage der Setup-Performance pro Marktphase
  const { data: setupPerformance = [], isLoading: setupPerformanceLoading } = useQuery({
    queryKey: ['/api/market-phases/setup-performance', userId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/market-phases/setup-performance?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch setup performance by market phase');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching setup performance by market phase:', error);
        return [];
      }
    },
  });

  // Abfrage der Marktphasen-Empfehlungen
  const { data: recommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/market-phases/recommendations', userId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/market-phases/recommendations?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch market phase recommendations');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching market phase recommendations:', error);
        return [];
      }
    },
  });

  // RADIAN für Kreisdiagramm-Label
  const RADIAN = Math.PI / 180;
  const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent, index }: any) => {
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central">
        {`${(percent * 100).toFixed(0)}%`}
      </text>
    );
  };

  // Tooltip für Charts
  const tooltipProps = {
    contentStyle: {
      backgroundColor: '#262626',
      border: 'none',
      borderRadius: '4px',
      color: '#F3F4F6',
    },
    labelStyle: { color: '#F3F4F6' },
  };

  // Phasen-Icon
  const getPhaseIcon = (phase: string) => {
    switch (phase) {
      case 'trend':
        return <TrendingUp className="h-4 w-4 mr-1" />;
      case 'range':
        return <ArrowLeftRight className="h-4 w-4 mr-1" />;
      case 'volatile':
        return <Activity className="h-4 w-4 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Marktphasen-Analyse</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="distribution" className="text-xs md:text-sm">
              Verteilung
            </TabsTrigger>
            <TabsTrigger value="performance" className="text-xs md:text-sm">
              Performance
            </TabsTrigger>
            <TabsTrigger value="setups" className="text-xs md:text-sm">
              Setup-Analyse
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs md:text-sm">
              Empfehlungen
            </TabsTrigger>
          </TabsList>

          {/* Verteilungs-Tab */}
          <TabsContent value="distribution">
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-medium">Verteilung deiner Trades nach Marktphasen</h3>

              {distributionLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : distribution.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Daten verfügbar
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={distribution}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={renderCustomizedLabel}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="count"
                      >
                        {distribution.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value, name, props) => [
                          `${value} Trades (${props.payload.percentage}%)`,
                          name === "count" ? "Anzahl" : name,
                        ]}
                        {...tooltipProps}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {distributionLoading ? (
                  <>
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                    <Skeleton className="h-20" />
                  </>
                ) : distribution.length === 0 ? (
                  <div className="col-span-3 text-center text-muted-foreground">
                    Keine Phasenverteilung verfügbar
                  </div>
                ) : (
                  distribution.map((phase) => (
                    <div
                      key={phase.phase}
                      className="border border-border rounded-md p-3 flex flex-col"
                    >
                      <div className="flex items-center mb-2">
                        {getPhaseIcon(phase.phase)}
                        <span className="font-medium capitalize">{phase.phase}-Phase</span>
                      </div>
                      <div className="text-2xl font-bold" style={{ color: phase.color }}>
                        {phase.count}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {phase.percentage}% aller Trades
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Performance-Tab */}
          <TabsContent value="performance">
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-medium">Performance nach Marktphasen</h3>

              {performanceLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : performance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Performance-Daten verfügbar
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performance}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis dataKey="phase" />
                      <YAxis yAxisId="left" orientation="left" label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft' }} />
                      <YAxis yAxisId="right" orientation="right" label={{ value: 'Avg RR', angle: 90, position: 'insideRight' }} />
                      <Tooltip {...tooltipProps} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="winRate" name="Win Rate (%)" radius={[4, 4, 0, 0]}>
                        {performance.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                      <Bar yAxisId="right" dataKey="avgRR" name="Avg RR" radius={[4, 4, 0, 0]} fill="#8884d8" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                {performanceLoading ? (
                  <>
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                    <Skeleton className="h-24" />
                  </>
                ) : performance.length === 0 ? (
                  <div className="col-span-3 text-center text-muted-foreground">
                    Keine Performance-Daten verfügbar
                  </div>
                ) : (
                  performance.map((phase) => (
                    <div
                      key={phase.phase}
                      className="border border-border rounded-md p-3 flex flex-col"
                    >
                      <div className="flex items-center mb-2">
                        {getPhaseIcon(phase.phase)}
                        <span className="font-medium capitalize">{phase.phase}-Phase</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <div className="text-xs text-muted-foreground">Win Rate</div>
                          <div className="text-lg font-bold" style={{ color: phase.color }}>
                            {phase.winRate}%
                          </div>
                        </div>
                        <div>
                          <div className="text-xs text-muted-foreground">Avg RR</div>
                          <div className="text-lg font-bold">
                            {phase.avgRR.toFixed(2)}
                          </div>
                        </div>
                        <div className="col-span-2">
                          <div className="text-xs text-muted-foreground">Trades</div>
                          <div className="text-sm">
                            {phase.totalTrades}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </TabsContent>

          {/* Setup-Analyse Tab */}
          <TabsContent value="setups">
            <div className="flex flex-col gap-6">
              <h3 className="text-lg font-medium">Setup-Analyse nach Marktphasen</h3>

              {setupPerformanceLoading ? (
                <Skeleton className="h-72 w-full" />
              ) : setupPerformance.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Keine Setup-Performance-Daten verfügbar
                </div>
              ) : (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={setupPerformance}>
                      <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                      <PolarAngleAxis dataKey="setup" />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} />
                      <Radar name="Trend" dataKey="trend" stroke={phaseColors.trend} fill={phaseColors.trend} fillOpacity={0.6} />
                      <Radar name="Range" dataKey="range" stroke={phaseColors.range} fill={phaseColors.range} fillOpacity={0.6} />
                      <Radar name="Volatil" dataKey="volatile" stroke={phaseColors.volatile} fill={phaseColors.volatile} fillOpacity={0.6} />
                      <Tooltip {...tooltipProps} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 gap-4">
                <div className="border border-border rounded-md p-4">
                  <h4 className="font-medium mb-2">Beste Setup-Phase Kombinationen</h4>
                  {setupPerformanceLoading ? (
                    <Skeleton className="h-16 w-full" />
                  ) : setupPerformance.length === 0 ? (
                    <div className="text-center py-2 text-muted-foreground">
                      Keine Setup-Performance-Daten verfügbar
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {Object.entries(phaseColors).map(([phase, color]) => {
                        // Finde das beste Setup für diese Phase
                        const bestSetup = setupPerformance.reduce(
                          (best, current) => (current[phase as keyof typeof current] as number > (best[phase as keyof typeof best] as number) ? current : best),
                          setupPerformance[0]
                        );
                        
                        return (
                          <div key={phase} className="flex items-center space-x-2">
                            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
                            <div>
                              <div className="text-sm font-medium capitalize">{phase}</div>
                              <div className="text-xs text-muted-foreground">
                                Bestes Setup: {bestSetup.setup} ({bestSetup[phase as keyof typeof bestSetup]}%)
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Empfehlungen-Tab */}
          <TabsContent value="recommendations">
            <div className="flex flex-col gap-4">
              <h3 className="text-lg font-medium">Empfehlungen für Marktphasen</h3>

              {recommendationsLoading ? (
                <>
                  <Skeleton className="h-24 w-full mb-2" />
                  <Skeleton className="h-24 w-full mb-2" />
                  <Skeleton className="h-24 w-full" />
                </>
              ) : recommendations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <AlertCircle className="mx-auto h-12 w-12 mb-4 text-muted-foreground/50" />
                  <p>Keine Empfehlungen verfügbar. Füge mehr Trades hinzu für eine detaillierte Analyse.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {recommendations.map((rec) => (
                    <div 
                      key={rec.id} 
                      className="border border-border rounded-md p-4"
                      style={{ borderLeftColor: phaseColors[rec.phase], borderLeftWidth: '4px' }}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        {getPhaseIcon(rec.phase)}
                        <h4 className="font-medium">{rec.recommendation}</h4>
                      </div>
                      <p className="text-sm text-muted-foreground">{rec.explanation}</p>
                      <Badge className="mt-2 capitalize" variant="outline">
                        {rec.phase}-Phase
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}