import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { ResponsiveContainer, LineChart, Line, BarChart, Bar, CartesianGrid, XAxis, YAxis, Cell, Tooltip as RechartsTooltip } from 'recharts';
import { ChartTypeSelector, type ChartType } from '@/components/ui/chart-type-selector';
import { format } from 'date-fns';
import { AlertCircle, TrendingDown, BarChart2, DollarSign, PieChart, RefreshCcw, Wallet, PiggyBank } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { accountTypeValues } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

// Gemeinsame Stilkonfiguration für professionellere Diagramme
const chartConfig = {
  strokeWidth: 2,          // Deutlichere Linien
  barSize: 20,             // Ausgewogenere Balkenbreite
  dotSize: 0,              // Keine Punkte auf Linien für glatteres Aussehen
  activeDotSize: 7,        // Größere aktive Punkte beim Hover
  fontSize: 11,            // Bessere Lesbarkeit für Labels
  labelOffset: 5,          // Abstand der Labels
  cornerRadius: 4,         // Stärker abgerundete Ecken für Balken
  animationDuration: 1000, // Längere Animation für flüssigeren Eindruck
  gridOpacity: 0.07,       // Subtileres aber sichtbareres Raster
  areaOpacity: 0.15,       // Transparenz für Area-Charts
  curveBasis: true,        // Glattere Kurven statt eckiger Linien
  // Premium-Farben für Business-Anmutung
  colors: {
    primary: '#3b82f6',    // Blau
    secondary: '#10b981',  // Grün
    accent: '#8b5cf6',     // Lila
    danger: '#ef4444',     // Rot
    warning: '#f59e0b',    // Orange
    success: '#10b981',    // Grün
    info: '#0ea5e9'        // Hellblau
  }
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
      // Da req.user in isAuthenticated nicht gesetzt ist, muss userId explizit übergeben werden
      // userId kommt aus den Props der Komponente
      console.log('Speichere Einstellungen:', { userId, accountBalance, accountType });
      
      const response = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          userId: userId, 
          accountBalance: accountBalance, 
          accountType: accountType 
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('API Fehler:', errorText);
        throw new Error('Fehler beim Speichern der Einstellungen');
      }
      
      return await response.json();
    },
    onSuccess: () => {
      // Invalidiere alle relevanten Abfragen, damit die Daten mit dem neuen accountType neu geladen werden
      queryClient.invalidateQueries({ queryKey: ['/api/risk/drawdown'] });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/per-trade'] });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/position-size'] });
      queryClient.invalidateQueries({ queryKey: ['/api/risk/recommendations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/trades'] });
      
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
    let params = '';
    
    // Kontotyp-Filter hinzufügen, außer wenn "all" ausgewählt ist
    if (accountType !== 'all') {
      params += `&accountType=${accountType}`;
    }
    
    // Weitere Filter aus activeFilters hinzufügen
    if (!activeFilters) return params;
    
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
    queryKey: ['/api/risk/drawdown', userId, activeFilters, accountType],
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
    queryKey: ['/api/risk/per-trade', userId, activeFilters, accountType],
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
    queryKey: ['/api/risk/position-size', userId, activeFilters, accountType],
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
    queryKey: ['/api/risk/recommendations', userId, activeFilters, accountType],
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
  
  // Fetch all trades für die Risikosummenberechnung
  const { data: allTrades = [], isLoading: tradesLoading } = useQuery({
    queryKey: ['/api/trades', userId, activeFilters, accountType],
    queryFn: async () => {
      try {
        const filterParams = buildFilterParams();
        const response = await fetch(`/api/trades?userId=${userId}${filterParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        const data = await response.json();
        console.log('Trades for risk sum calculation received:', data.length, 'items');
        return data;
      } catch (error) {
        console.error('Error fetching trades:', error);
        return [];
      }
    },
  });
  
  // Berechne Risikopunkte nach Kontotyp und filtere nach ausgewähltem Kontotyp
  const riskSumByAccountType = React.useMemo(() => {
    const result = {
      PA: { count: 0, sum: 0 },
      EVA: { count: 0, sum: 0 },
      total: { count: 0, sum: 0 }
    };
    
    if (!allTrades || allTrades.length === 0) return result;
    
    // Filtere Trades nach ausgewähltem Kontotyp (wenn nicht "all")
    const filteredTrades = accountType === 'all' 
      ? allTrades 
      : allTrades.filter(trade => (trade.accountType || 'PA') === accountType);
    
    // Log für Debugging
    console.log(`Trades gefiltert nach Kontotyp ${accountType}:`, 
      `Total: ${allTrades.length}, Gefiltert: ${filteredTrades.length}`);
    
    // Berechnung der Risikopunkte (riskSum * 4)
    filteredTrades.forEach(trade => {
      if (trade.riskSum) {
        const type = trade.accountType || 'PA'; // Default to PA if not specified
        result[type] = result[type] || { count: 0, sum: 0 }; // Ensure the type exists
        result[type].count += 1;
        // Risikopunkte = Risikosumme * 4
        result[type].sum += Number(trade.riskSum) * 4;
        result.total.count += 1;
        result.total.sum += Number(trade.riskSum) * 4;
      }
    });
    
    return result;
  }, [allTrades, accountType]);

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
              
              {/* Risikosummen nach Kontotyp */}
              {tradesLoading ? (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                  {/* PA Konto */}
                  <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border border-blue-500/20 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">PA Risiko Punkte</p>
                          <h3 className="text-2xl font-bold">{riskSumByAccountType.PA.sum.toFixed(2)}</h3>
                          <p className="text-xs text-muted-foreground">{riskSumByAccountType.PA.count} Trades</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-blue-500/10 flex items-center justify-center border border-blue-500/20">
                          <Wallet className="h-5 w-5 text-blue-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* EVA Konto */}
                  <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">EVA Risiko Punkte</p>
                          <h3 className="text-2xl font-bold">{riskSumByAccountType.EVA.sum.toFixed(2)}</h3>
                          <p className="text-xs text-muted-foreground">{riskSumByAccountType.EVA.count} Trades</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center border border-purple-500/20">
                          <Wallet className="h-5 w-5 text-purple-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {/* Gesamt */}
                  <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border border-green-500/20 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-sm text-muted-foreground mb-1">Gesamt Risiko Punkte</p>
                          <h3 className="text-2xl font-bold">{riskSumByAccountType.total.sum.toFixed(2)}</h3>
                          <p className="text-xs text-muted-foreground">{riskSumByAccountType.total.count} Trades</p>
                        </div>
                        <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center border border-green-500/20">
                          <PiggyBank className="h-5 w-5 text-green-500" />
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}
              
              {drawdownLoading ? (
                <Skeleton className="h-64 w-full" />
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    {chartType === 'line' ? (
                      <LineChart
                        data={drawdownData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                        className="mt-2"
                      >
                        <defs>
                          <linearGradient id="drawdownFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartConfig.colors.danger} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={chartConfig.colors.danger} stopOpacity={0.01} />
                          </linearGradient>
                          <linearGradient id="maxDrawdownFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartConfig.colors.primary} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={chartConfig.colors.primary} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 6" 
                          vertical={false} 
                          stroke="rgba(255, 255, 255, 0.07)" 
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dy={10}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          tickFormatter={(value) => `${value}%`}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dx={-10}
                        />
                        <RechartsTooltip 
                          content={CustomTooltip} 
                          cursor={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                        />
                        <Line
                          type={chartConfig.curveBasis ? "basis" : "monotone"}
                          dataKey="drawdown"
                          stroke={chartConfig.colors.danger}
                          strokeWidth={chartConfig.strokeWidth}
                          name="Drawdown"
                          dot={false}
                          activeDot={{ r: chartConfig.activeDotSize, stroke: chartConfig.colors.danger, strokeWidth: 1 }}
                          animationDuration={chartConfig.animationDuration}
                          fill="url(#drawdownFill)"
                        />
                        <Line
                          type={chartConfig.curveBasis ? "basis" : "monotone"}
                          dataKey="maxDrawdown"
                          stroke={chartConfig.colors.primary}
                          name="Max Drawdown"
                          strokeWidth={chartConfig.strokeWidth}
                          dot={false}
                          activeDot={{ r: chartConfig.activeDotSize, stroke: chartConfig.colors.primary, strokeWidth: 1 }}
                          animationDuration={chartConfig.animationDuration}
                          fill="url(#maxDrawdownFill)"
                        />
                      </LineChart>
                    ) : (
                      <BarChart
                        data={drawdownData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                        className="mt-2"
                        barGap={3}
                        barCategoryGap={20}
                      >
                        <defs>
                          <linearGradient id="drawdownBarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartConfig.colors.danger} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={chartConfig.colors.danger} stopOpacity={0.6} />
                          </linearGradient>
                          <linearGradient id="maxDrawdownBarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartConfig.colors.primary} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={chartConfig.colors.primary} stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 6"
                          vertical={false}
                          stroke="rgba(255, 255, 255, 0.07)"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dy={10}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          tickFormatter={(value) => `${value}%`}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dx={-10}
                        />
                        <RechartsTooltip
                          content={CustomTooltip}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar
                          dataKey="drawdown"
                          name="Drawdown"
                          fill="url(#drawdownBarFill)"
                          stroke={chartConfig.colors.danger}
                          strokeWidth={1}
                          radius={[chartConfig.cornerRadius, chartConfig.cornerRadius, 0, 0]}
                          barSize={chartConfig.barSize}
                          animationDuration={chartConfig.animationDuration}
                        />
                        <Bar
                          dataKey="maxDrawdown"
                          name="Max Drawdown"
                          fill="url(#maxDrawdownBarFill)"
                          stroke={chartConfig.colors.primary}
                          strokeWidth={1}
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
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                        className="mt-2"
                      >
                        <defs>
                          <linearGradient id="riskPercentFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartConfig.colors.primary} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={chartConfig.colors.primary} stopOpacity={0.01} />
                          </linearGradient>
                          <linearGradient id="riskDollarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={chartConfig.colors.success} stopOpacity={0.2} />
                            <stop offset="95%" stopColor={chartConfig.colors.success} stopOpacity={0.01} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid 
                          strokeDasharray="3 6" 
                          vertical={false} 
                          stroke="rgba(255, 255, 255, 0.07)" 
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dy={10}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          tickFormatter={(value) => `${value}%`}
                          yAxisId="left"
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dx={-10}
                        />
                        <YAxis
                          orientation="right"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          tickFormatter={(value) => `$${value}`}
                          yAxisId="right"
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dx={10}
                        />
                        <RechartsTooltip 
                          content={CustomTooltip} 
                          cursor={{ stroke: 'rgba(255, 255, 255, 0.2)' }}
                        />
                        <Line
                          type={chartConfig.curveBasis ? "basis" : "monotone"}
                          dataKey="riskPercent"
                          yAxisId="left"
                          stroke={chartConfig.colors.primary}
                          name="Risiko %"
                          strokeWidth={chartConfig.strokeWidth}
                          dot={false}
                          activeDot={{ r: chartConfig.activeDotSize, stroke: chartConfig.colors.primary, strokeWidth: 1 }}
                          animationDuration={chartConfig.animationDuration}
                          fill="url(#riskPercentFill)"
                        />
                        <Line
                          type={chartConfig.curveBasis ? "basis" : "monotone"}
                          dataKey="riskDollar"
                          yAxisId="right"
                          stroke={chartConfig.colors.success}
                          name="Risiko $"
                          strokeWidth={chartConfig.strokeWidth}
                          dot={false}
                          activeDot={{ r: chartConfig.activeDotSize, stroke: chartConfig.colors.success, strokeWidth: 1 }}
                          animationDuration={chartConfig.animationDuration}
                          fill="url(#riskDollarFill)"
                        />
                      </LineChart>
                    ) : (
                      <BarChart
                        data={riskPerTradeData}
                        margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                        className="mt-2"
                        barGap={3}
                        barCategoryGap={20}
                      >
                        <defs>
                          <linearGradient id="riskPercentBarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartConfig.colors.primary} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={chartConfig.colors.primary} stopOpacity={0.6} />
                          </linearGradient>
                          <linearGradient id="riskDollarBarFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor={chartConfig.colors.success} stopOpacity={0.9} />
                            <stop offset="100%" stopColor={chartConfig.colors.success} stopOpacity={0.6} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid
                          strokeDasharray="3 6"
                          vertical={false}
                          stroke="rgba(255, 255, 255, 0.07)"
                        />
                        <XAxis
                          dataKey="date"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dy={10}
                        />
                        <YAxis
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          tickFormatter={(value) => `${value}%`}
                          yAxisId="left"
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dx={-10}
                        />
                        <YAxis
                          orientation="right"
                          stroke="#9CA3AF"
                          tick={{ fill: '#9CA3AF', fontSize: 10 }}
                          tickFormatter={(value) => `$${value}`}
                          yAxisId="right"
                          axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                          dx={10}
                        />
                        <RechartsTooltip
                          content={CustomTooltip}
                          cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        />
                        <Bar
                          dataKey="riskPercent"
                          name="Risiko %"
                          yAxisId="left"
                          fill="url(#riskPercentBarFill)"
                          stroke={chartConfig.colors.primary}
                          strokeWidth={1}
                          radius={[chartConfig.cornerRadius, chartConfig.cornerRadius, 0, 0]}
                          barSize={chartConfig.barSize}
                          animationDuration={chartConfig.animationDuration}
                        />
                        <Bar
                          dataKey="riskDollar"
                          name="Risiko $"
                          yAxisId="right"
                          fill="url(#riskDollarBarFill)"
                          stroke={chartConfig.colors.success}
                          strokeWidth={1}
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
                      margin={{ top: 20, right: 30, left: 10, bottom: 5 }}
                      className="mt-2"
                      barGap={3}
                    >
                      <defs>
                        <linearGradient id="positionSizeBarFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartConfig.colors.primary} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={chartConfig.colors.primary} stopOpacity={0.6} />
                        </linearGradient>
                        <linearGradient id="optimalPositionBarFill" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={chartConfig.colors.success} stopOpacity={0.9} />
                          <stop offset="100%" stopColor={chartConfig.colors.success} stopOpacity={0.6} />
                        </linearGradient>
                        <filter id="glow" height="300%" width="300%" x="-100%" y="-100%">
                          <feGaussianBlur stdDeviation="3" result="coloredBlur" />
                          <feMerge>
                            <feMergeNode in="coloredBlur" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 6"
                        vertical={false}
                        stroke="rgba(255, 255, 255, 0.07)"
                      />
                      <XAxis
                        dataKey="positionSize"
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        dy={10}
                        label={{ 
                          value: 'Positionsgröße ($)', 
                          position: 'insideBottom', 
                          fill: '#9CA3AF', 
                          offset: 0,
                          style: { fontSize: 11 }
                        }}
                      />
                      <YAxis
                        stroke="#9CA3AF"
                        tick={{ fill: '#9CA3AF', fontSize: 10 }}
                        tickFormatter={(value) => `${value}%`}
                        axisLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        tickLine={{ stroke: 'rgba(255, 255, 255, 0.1)' }}
                        dx={-10}
                        label={{ 
                          value: 'Win-Rate (%)', 
                          angle: -90, 
                          position: 'insideLeft', 
                          fill: '#9CA3AF',
                          offset: 10,
                          style: { fontSize: 11 }
                        }}
                      />
                      <RechartsTooltip 
                        content={CustomTooltip} 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      />
                      <Bar 
                        dataKey="winRate" 
                        name="Win-Rate"
                        barSize={chartConfig.barSize}
                        animationDuration={chartConfig.animationDuration}
                        radius={[chartConfig.cornerRadius, chartConfig.cornerRadius, 0, 0]}
                      >
                        {positionSizeData.map((entry, index) => {
                          const isOptimal = entry.positionSize === optimalPositionSize.positionSize;
                          return (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={isOptimal ? 'url(#optimalPositionBarFill)' : 'url(#positionSizeBarFill)'}
                              stroke={isOptimal ? chartConfig.colors.success : chartConfig.colors.primary}
                              strokeWidth={1}
                              style={{ filter: isOptimal ? 'url(#glow)' : 'none' }}
                            />
                          );
                        })}
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