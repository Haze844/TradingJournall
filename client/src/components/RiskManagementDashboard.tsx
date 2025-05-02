import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { ChartTypeSelector, type ChartType } from '@/components/ui/chart-type-selector';
import { format } from 'date-fns';
import { AlertCircle, TrendingDown, BarChart2, DollarSign, PieChart, RefreshCcw, Wallet } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { accountTypeValues } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// Gemeinsame Stilkonfiguration für elegantere Diagramme
const chartConfig = {
  strokeWidth: 1.5,       // Dünnere Linien
  barSize: 12,            // Schmalere Balken
  dotSize: 4,             // Kleinere Punkte
  activeDotSize: 6,       // Kleinere aktive Punkte
  fontSize: 10,           // Kleinere Schriftgröße für Labels
  labelOffset: 5,         // Abstand der Labels
  cornerRadius: 2,        // Leicht abgerundete Ecken für Balken
  animationDuration: 800, // Längere Animation für flüssigeren Eindruck
  gridOpacity: 0.04       // Subtileres Raster
};

interface DrawdownData {
  date: string;
  drawdown: number;
  maxDrawdown: number;
}

interface RiskPerTradeData {
  date: string;
  riskPercent: number;
  riskDollar: number;
}

interface PositionSizeData {
  positionSize: number;
  winRate: number;
  count: number;
}

interface RiskRecommendation {
  id: string;
  recommendation: string;
  explanation: string;
  impact: number;
}

export default function RiskManagementDashboard({ userId, activeFilters }: { userId: number, activeFilters?: any }) {
  const [chartType, setChartType] = useState<ChartType>('line');
  const [activeTab, setActiveTab] = useState<'drawdown' | 'risk-per-trade' | 'position-size' | 'recommendations'>('drawdown');
  const [accountBalance, setAccountBalance] = useState<number>(2500); // Standard-Kontostand: 2500$
  const [accountType, setAccountType] = useState<string>('all'); // Standard: alle Konten
  const { toast } = useToast();
  
  // Abruf der Benutzereinstellungen
  const { data: userSettings } = useQuery({
    queryKey: ['/api/settings', userId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/settings?userId=${userId}`);
        if (!response.ok) {
          return { accountBalance: 2500, accountType: 'all' };
        }
        const data = await response.json();
        return data;
      } catch (error) {
        console.error('Fehler beim Abrufen der Benutzereinstellungen:', error);
        return { accountBalance: 2500, accountType: 'all' };
      }
    },
  });
  
  // Einstellungen aktualisieren, wenn sie geladen werden
  useEffect(() => {
    if (userSettings?.accountBalance) {
      setAccountBalance(userSettings.accountBalance);
    }
    if (userSettings?.accountType) {
      setAccountType(userSettings.accountType);
    }
  }, [userSettings]);
  
  // Mutation zum Aktualisieren der Benutzereinstellungen
  const updateSettingsMutation = useMutation({
    mutationFn: async ({ accountBalance, accountType }: { accountBalance: number; accountType: string }) => {
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, accountBalance, accountType }),
      });
      
      if (!response.ok) {
        throw new Error('Fehler beim Speichern der Einstellungen');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Einstellungen aktualisiert',
        description: 'Deine Risikodaten wurden erfolgreich aktualisiert.',
      });
    },
    onError: () => {
      toast({
        title: 'Fehler',
        description: 'Die Einstellungen konnten nicht gespeichert werden.',
        variant: 'destructive',
      });
    },
  });
  
  // Hilfsfunktion zum Erstellen der Filter-URL-Parameter
  const buildFilterParams = () => {
    if (!activeFilters) return '';
    
    let params = '';
    
    // Datumsfilter
    if (activeFilters.startDate && activeFilters.endDate) {
      const startDate = new Date(activeFilters.startDate).toISOString().split('T')[0];
      const endDate = new Date(activeFilters.endDate).toISOString().split('T')[0];
      params += `&startDate=${startDate}&endDate=${endDate}`;
    }
    
    // Symbole
    if (activeFilters.symbols && activeFilters.symbols.length > 0) {
      params += `&symbols=${encodeURIComponent(JSON.stringify(activeFilters.symbols))}`;
    }
    
    // Setups
    if (activeFilters.setups && activeFilters.setups.length > 0) {
      params += `&setups=${encodeURIComponent(JSON.stringify(activeFilters.setups))}`;
    }
    
    // Win/Loss
    if (activeFilters.isWin !== null && activeFilters.isWin !== undefined) {
      params += `&isWin=${activeFilters.isWin}`;
    }
    
    // Marktphasen
    if (activeFilters.marketPhases && activeFilters.marketPhases.length > 0) {
      params += `&marketPhases=${encodeURIComponent(JSON.stringify(activeFilters.marketPhases))}`;
    }
    
    // Zeitzonen/Sessions
    if (activeFilters.sessions && activeFilters.sessions.length > 0) {
      params += `&sessions=${encodeURIComponent(JSON.stringify(activeFilters.sessions))}`;
    }
    
    return params;
  };

  // Fetch drawdown data
  const { data: drawdownData = [], isLoading: drawdownLoading } = useQuery({
    queryKey: ['/api/risk/drawdown', userId, activeFilters],
    queryFn: async () => {
      try {
        const filterParams = buildFilterParams();
        console.log('Drawdown request with filters:', filterParams);
        const response = await fetch(`/api/risk/drawdown?userId=${userId}${filterParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch drawdown data');
        }
        const data = await response.json();
        console.log('Drawdown data received:', data.length, 'items');
        return data;
      } catch (error) {
        console.error('Error fetching drawdown data:', error);
        return [];
      }
    },
  });

  // Fetch risk per trade data
  const { data: riskPerTradeData = [], isLoading: riskPerTradeLoading } = useQuery({
    queryKey: ['/api/risk/per-trade', userId, activeFilters],
    queryFn: async () => {
      try {
        const filterParams = buildFilterParams();
        console.log('Risk per trade request with filters:', filterParams);
        const response = await fetch(`/api/risk/per-trade?userId=${userId}${filterParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch risk per trade data');
        }
        const data = await response.json();
        console.log('Risk per trade data received:', data.length, 'items');
        return data;
      } catch (error) {
        console.error('Error fetching risk per trade data:', error);
        return [];
      }
    },
  });

  // Fetch position size correlation data
  const { data: positionSizeData = [], isLoading: positionSizeLoading } = useQuery({
    queryKey: ['/api/risk/position-size', userId, activeFilters],
    queryFn: async () => {
      try {
        const filterParams = buildFilterParams();
        const response = await fetch(`/api/risk/position-size?userId=${userId}${filterParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch position size data');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching position size data:', error);
        return [];
      }
    },
  });

  // Fetch risk recommendations
  const { data: riskRecommendations = [], isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/risk/recommendations', userId, activeFilters],
    queryFn: async () => {
      try {
        const filterParams = buildFilterParams();
        const response = await fetch(`/api/risk/recommendations?userId=${userId}${filterParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch risk recommendations');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching risk recommendations:', error);
        return [];
      }
    },
  });

  // Calculate optimal position size
  const optimalPositionSize = positionSizeData.reduce((optimal, current) => {
    return current.winRate > optimal.winRate ? current : optimal;
  }, { positionSize: 0, winRate: 0, count: 0 });

  // Benutzerdefinierter, moderner Tooltip ohne weiße Flächen beim Hover
  const CustomTooltip = ({ active, payload, label, ...props }: any) => {
    if (!active || !payload || !payload.length) return null;
    
    return (
      <div className="rounded-md bg-background/95 backdrop-blur-sm border border-border shadow-lg p-2 text-xs">
        <p className="text-muted-foreground mb-1">{label}</p>
        {payload.map((entry: any, index: number) => (
          <div key={index} className="flex items-center gap-1.5 my-0.5">
            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs font-medium">
              {entry.name}: {typeof entry.value === 'number' 
                ? entry.dataKey.includes('Dollar')
                  ? `$${entry.value}`
                  : `${entry.value}%`
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    );
  };
  
  // Label-Eigenschaften für die direkte Anzeige von Werten ohne Hover
  const labelProps = {
    position: "top",
    fontSize: 11,
    fill: "#F3F4F6",
    formatter: (value: number) => `${value}%`
  };

  const getImpactColor = (impact: number) => {
    if (impact > 0.7) return { bg: 'bg-red-500/10', text: 'text-red-500', border: 'border-red-500/20' };
    if (impact > 0.4) return { bg: 'bg-amber-500/10', text: 'text-amber-500', border: 'border-amber-500/20' };
    return { bg: 'bg-blue-500/10', text: 'text-blue-500', border: 'border-blue-500/20' };
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Risikomanagement-Dashboard
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Konto-Einstellungen für Risikomanagement */}
        <div className="mb-6 p-4 bg-muted rounded-lg">
          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="w-full sm:w-1/3">
              <Label htmlFor="accountBalance" className="text-sm font-medium mb-1.5 block">Kontostand ($)</Label>
              <div className="flex items-center">
                <Input 
                  id="accountBalance"
                  type="number" 
                  value={accountBalance} 
                  onChange={(e) => setAccountBalance(parseFloat(e.target.value) || 0)}
                  className="flex-grow"
                />
              </div>
            </div>
            
            <div className="w-full sm:w-1/3">
              <Label htmlFor="accountType" className="text-sm font-medium mb-1.5 block">Kontotyp filtern</Label>
              <Select 
                value={accountType} 
                onValueChange={setAccountType}
              >
                <SelectTrigger id="accountType">
                  <SelectValue placeholder="Kontotyp wählen" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle Konten</SelectItem>
                  {accountTypeValues.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="w-full sm:w-1/3">
              <Button 
                onClick={() => {
                  // Speichere die Einstellungen
                  updateSettingsMutation.mutate({ 
                    accountBalance, 
                    accountType 
                  });
                }}
                className="w-full flex items-center justify-center gap-2"
              >
                <RefreshCcw className="h-4 w-4" />
                Risikodaten aktualisieren
              </Button>
            </div>
          </div>
        </div>
        
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-4 mb-6">
            <TabsTrigger value="drawdown" className="text-xs md:text-sm flex items-center gap-1">
              <TrendingDown className="h-4 w-4" />
              <span className="hidden sm:inline">Drawdowns</span>
            </TabsTrigger>
            <TabsTrigger value="risk-per-trade" className="text-xs md:text-sm flex items-center gap-1">
              <DollarSign className="h-4 w-4" />
              <span className="hidden sm:inline">Risiko pro Trade</span>
            </TabsTrigger>
            <TabsTrigger value="position-size" className="text-xs md:text-sm flex items-center gap-1">
              <BarChart2 className="h-4 w-4" />
              <span className="hidden sm:inline">Positionsgröße</span>
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="text-xs md:text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              <span className="hidden sm:inline">Empfehlungen</span>
            </TabsTrigger>
          </TabsList>

          {/* Drawdown Tab */}
          <TabsContent value="drawdown">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Drawdown-Analyse</h3>
                <ChartTypeSelector value={chartType} onChange={setChartType} />
              </div>

              {drawdownLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <LineChart
                        data={drawdownData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <RechartsTooltip content={CustomTooltip} />
                        <Line
                          type="monotone"
                          dataKey="drawdown"
                          stroke="#EF4444"
                          name="Drawdown"
                          strokeWidth={chartConfig.strokeWidth}
                          dot={{ r: chartConfig.dotSize }}
                          activeDot={{ r: chartConfig.activeDotSize }}
                          animationDuration={chartConfig.animationDuration}
                          label={{
                            position: "top",
                            fontSize: chartConfig.fontSize,
                            fill: "#EF4444",
                            formatter: (value: number) => `${value}%`
                          }}
                        />
                        <Line
                          type="monotone"
                          dataKey="maxDrawdown"
                          stroke="#3B82F6"
                          name="Max Drawdown"
                          strokeWidth={chartConfig.strokeWidth}
                          dot={{ r: chartConfig.dotSize }}
                          activeDot={{ r: chartConfig.activeDotSize }}
                          animationDuration={chartConfig.animationDuration}
                        />
                      </LineChart>
                    ) : (
                      <BarChart
                        data={drawdownData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(value) => `${value}%`}
                        />
                        <RechartsTooltip content={CustomTooltip} />
                        <Bar
                          dataKey="drawdown"
                          name="Drawdown"
                          fill="#EF4444"
                          radius={[chartConfig.cornerRadius, chartConfig.cornerRadius, 0, 0]}
                          barSize={chartConfig.barSize}
                          animationDuration={chartConfig.animationDuration}
                        />
                        <Bar
                          dataKey="maxDrawdown"
                          name="Max Drawdown"
                          fill="#3B82F6"
                          radius={[chartConfig.cornerRadius, chartConfig.cornerRadius, 0, 0]}
                          barSize={chartConfig.barSize}
                          animationDuration={chartConfig.animationDuration}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Erkenntnisse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <span>
                          Maximaler Drawdown: 
                          <span className="font-semibold ml-1">
                            {Math.max(...drawdownData.map(d => d.maxDrawdown), 0)}%
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            ${(accountBalance * Math.max(...drawdownData.map(d => d.maxDrawdown), 0) / 100).toFixed(2)}
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <TrendingDown className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          Durchschnittlicher Drawdown: 
                          <span className="font-semibold ml-1">
                            {drawdownData.length > 0 ? (drawdownData.reduce((acc, item) => acc + item.drawdown, 0) / drawdownData.length).toFixed(2) : 0}%
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <Wallet className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          Absoluter Verlust im schlimmsten Szenario: 
                          <span className="font-semibold ml-1">
                            ${(accountBalance * Math.max(...drawdownData.map(d => d.maxDrawdown), 0) / 100).toFixed(2)}
                          </span>
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Empfehlungen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          Maximales Risiko pro Trade sollte 
                          <span className="font-semibold mx-1">
                            {Math.round(100 / (Math.max(...drawdownData.map(d => d.maxDrawdown), 10) / 2))}%
                          </span>
                          deines Drawdowns nicht überschreiten.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <RefreshCcw className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>
                          Nach einem Drawdown von 
                          <span className="font-semibold mx-1">
                            {Math.round(Math.max(...drawdownData.map(d => d.maxDrawdown), 0) / 2)}%
                          </span>
                          solltest du die Positionsgröße reduzieren oder eine Pause einlegen.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Risk per Trade Tab */}
          <TabsContent value="risk-per-trade">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Risiko pro Trade</h3>
                <ChartTypeSelector value={chartType} onChange={setChartType} />
              </div>

              {riskPerTradeLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <LineChart
                        data={riskPerTradeData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(value) => `${value}%`}
                          yAxisId="left"
                        />
                        <YAxis
                          orientation="right"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(value) => `$${value}`}
                          yAxisId="right"
                        />
                        <RechartsTooltip content={CustomTooltip} />
                        <Line
                          type="monotone"
                          dataKey="riskPercent"
                          yAxisId="left"
                          stroke="#3B82F6"
                          name="Risiko %"
                          strokeWidth={chartConfig.strokeWidth}
                          dot={{ r: chartConfig.dotSize }}
                          activeDot={{ r: chartConfig.activeDotSize }}
                          animationDuration={chartConfig.animationDuration}
                        />
                        <Line
                          type="monotone"
                          dataKey="riskDollar"
                          yAxisId="right"
                          stroke="#10B981"
                          name="Risiko $"
                          strokeWidth={chartConfig.strokeWidth}
                          dot={{ r: chartConfig.dotSize }}
                          activeDot={{ r: chartConfig.activeDotSize }}
                          animationDuration={chartConfig.animationDuration}
                        />
                      </LineChart>
                    ) : (
                      <BarChart
                        data={riskPerTradeData}
                        margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(value) => `${value}%`}
                          yAxisId="left"
                        />
                        <YAxis
                          orientation="right"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF' }}
                          tickFormatter={(value) => `$${value}`}
                          yAxisId="right"
                        />
                        <RechartsTooltip content={CustomTooltip} />
                        <Bar
                          dataKey="riskPercent"
                          name="Risiko %"
                          yAxisId="left"
                          fill="#3B82F6"
                          radius={[chartConfig.cornerRadius, chartConfig.cornerRadius, 0, 0]}
                          barSize={chartConfig.barSize}
                          animationDuration={chartConfig.animationDuration}
                        />
                        <Bar
                          dataKey="riskDollar"
                          name="Risiko $"
                          yAxisId="right"
                          fill="#10B981"
                          radius={[chartConfig.cornerRadius, chartConfig.cornerRadius, 0, 0]}
                          barSize={chartConfig.barSize}
                          animationDuration={chartConfig.animationDuration}
                        />
                      </BarChart>
                    )}
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Analysezusammenfassung</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          Durchschnittliches Risiko pro Trade: 
                          <span className="font-semibold ml-1">
                            {riskPerTradeData.length > 0 ? (riskPerTradeData.reduce((acc, item) => acc + item.riskPercent, 0) / riskPerTradeData.length).toFixed(2) : 0}%
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            ${riskPerTradeData.length > 0 ? (riskPerTradeData.reduce((acc, item) => acc + item.riskDollar, 0) / riskPerTradeData.length).toFixed(2) : 0}
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-red-500 shrink-0 mt-0.5" />
                        <span>
                          Maximales Risiko in einem Trade: 
                          <span className="font-semibold ml-1">
                            {Math.max(...riskPerTradeData.map(d => d.riskPercent), 0).toFixed(2)}%
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            ${Math.max(...riskPerTradeData.map(d => d.riskDollar), 0).toFixed(2)}
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <DollarSign className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>
                          Empfohlenes maximal Risiko (2%): 
                          <span className="font-semibold ml-1">
                            ${(accountBalance * 0.02).toFixed(2)}
                          </span>
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Empfehlungen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-amber-500 shrink-0 mt-0.5" />
                        <span>
                          Begrenze dein Risiko auf
                          <span className="font-semibold mx-1">
                            ${(accountBalance * 0.02).toFixed(0)}
                          </span>
                          pro Trade (2% des Kapitals)
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          Bei aufeinanderfolgenden Verlusten:
                          <span className="block text-xs mt-1">
                            Senke das Risiko auf 1% (${(accountBalance * 0.01).toFixed(0)}) bis du wieder profitabel bist
                          </span>
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Position Size Tab */}
          <TabsContent value="position-size">
            <div className="flex flex-col gap-6">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Positionsgrößen-Analyse</h3>
              </div>

              {positionSizeLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={positionSizeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
                      <XAxis
                        dataKey="positionSize"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        label={{ 
                          value: 'Positionsgröße ($)', 
                          position: 'insideBottom', 
                          fill: '#9CA3AF', 
                          offset: 0 
                        }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF' }}
                        tickFormatter={(value) => `${value}%`}
                        label={{ 
                          value: 'Win-Rate (%)', 
                          angle: -90, 
                          position: 'insideLeft', 
                          fill: '#9CA3AF',
                          offset: 10 
                        }}
                      />
                      <RechartsTooltip content={CustomTooltip} />
                      <Bar 
                        dataKey="winRate" 
                        name="Win-Rate"
                        fill="#3B82F6"
                        radius={[chartConfig.cornerRadius, chartConfig.cornerRadius, 0, 0]}
                        barSize={chartConfig.barSize}
                        animationDuration={chartConfig.animationDuration}
                      >
                        {positionSizeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.positionSize === optimalPositionSize.positionSize ? '#10B981' : '#3B82F6'} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Positionsgrößen-Erkenntnisse</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <PieChart className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>
                          Optimale Positionsgröße: 
                          <span className="font-semibold ml-1">
                            ${optimalPositionSize.positionSize}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            Win-Rate: {optimalPositionSize.winRate}% ({optimalPositionSize.count} Trades)
                          </span>
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <PieChart className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          Durchschnittliche Win-Rate: 
                          <span className="font-semibold ml-1">
                            {positionSizeData.length > 0 ? 
                              (positionSizeData.reduce((acc, item) => acc + (item.winRate * item.count), 0) / 
                               positionSizeData.reduce((acc, item) => acc + item.count, 0)).toFixed(2) : 0}%
                          </span>
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>

                <Card className="bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base">Empfehlungen</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-2 text-sm">
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                        <span>
                          Verwende bevorzugt eine Positionsgröße von 
                          <span className="font-semibold mx-1">
                            ${optimalPositionSize.positionSize}
                          </span>
                          für die beste Performance.
                        </span>
                      </li>
                      <li className="flex items-start gap-2">
                        <AlertCircle className="h-4 w-4 text-blue-500 shrink-0 mt-0.5" />
                        <span>
                          Meide Positionen 
                          {positionSizeData
                            .filter(d => d.winRate < (optimalPositionSize.winRate * 0.8))
                            .slice(0, 2)
                            .map(d => (
                              <span className="font-semibold mx-1 whitespace-nowrap" key={d.positionSize}>
                                ${d.positionSize}
                              </span>
                            ))
                          }
                          mit niedrigen Win-Raten.
                        </span>
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Risikomanagement-Empfehlungen</h3>
              </div>

              {recommendationsLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {riskRecommendations.map((rec) => {
                    const impactColor = getImpactColor(rec.impact);
                    return (
                      <div 
                        key={rec.id} 
                        className={`p-4 rounded-lg border ${impactColor.border} ${impactColor.bg}`}
                      >
                        <div className="flex flex-col gap-2">
                          <div className="flex items-start justify-between">
                            <h4 className={`font-medium ${impactColor.text}`}>{rec.recommendation}</h4>
                            <div className="rounded-full px-2 py-0.5 text-xs border bg-background/50 backdrop-blur-sm">
                              Priorität: {rec.impact > 0.7 ? 'Hoch' : rec.impact > 0.4 ? 'Mittel' : 'Niedrig'}
                            </div>
                          </div>
                          <p className="text-sm">{rec.explanation}</p>
                        </div>
                      </div>
                    );
                  })}

                  {riskRecommendations.length === 0 && (
                    <div className="text-center py-12 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-3 opacity-20" />
                      <p>Keine Risiko-Empfehlungen verfügbar. Füge mehr Trades hinzu, um aussagekräftige Empfehlungen zu erhalten.</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}