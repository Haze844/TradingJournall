import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import TradeTable from "@/components/TradeTable";
import WeeklySummary from "@/components/WeeklySummary";
import TradeDetail from "@/components/TradeDetail";
import TradeImport from "@/components/TradeImport";
import AddTradeForm from "@/components/AddTradeForm";
import TradingPatterns from "@/components/TradingPatterns";
import AdvancedTradeAnalysisWrapper from "@/components/AdvancedTradeAnalysisWrapper";
import RiskManagementDashboard from "@/components/RiskManagementDashboard";
import MarketPhaseAnalysis from "@/components/MarketPhaseAnalysis";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getWeekDates, getTodayDates, formatDate } from "@/lib/utils";
import { Trade } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, TrendingDown, DollarSign, AlertCircle, Image as ImageIcon,
  Plus, X
} from "lucide-react";

import { Link } from "wouter";

export default function SimpleHome() {
  const { user } = useAuth();
  const userId = user?.id || 1; // Fallback to 1 only if user object isn't loaded yet
  const { toast } = useToast();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  // State für die Sichtbarkeit des Add-Formulars
  const [isAddTradeVisible, setIsAddTradeVisible] = useState(false);
  
  // Debug-Ausgabe bei Änderung der Sichtbarkeit
  useEffect(() => {
    console.log("isAddTradeVisible geändert:", isAddTradeVisible);
    
    // Wenn der Dialog geöffnet wird, scrolle zum Anfang und verhindere Scrollen im Hintergrund
    if (isAddTradeVisible) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    
    // Cleanup beim Unmount
    return () => {
      document.body.style.overflow = '';
    };
  }, [isAddTradeVisible]);
  
  const [filters, setFilters] = useState({
    startDate: getTodayDates().startDate,
    endDate: getTodayDates().endDate,
    symbol: "all",
    setup: "all",
    mainTrendM15: "all",
    internalTrendM5: "all",
    entryType: "all",
  });

  // Fetch trades with filters
  const {
    data: trades = [],
    isLoading: tradesLoading,
    refetch: refetchTrades,
  } = useQuery({
    queryKey: ["/api/trades", userId, filters],
    queryFn: async () => {
      const queryParams = new URLSearchParams();
      queryParams.append("userId", userId.toString());
      
      if (filters.symbol && filters.symbol !== "all") queryParams.append("symbol", filters.symbol);
      if (filters.setup && filters.setup !== "all") queryParams.append("setup", filters.setup);
      if (filters.mainTrendM15 && filters.mainTrendM15 !== "all") queryParams.append("mainTrendM15", filters.mainTrendM15);
      if (filters.internalTrendM5 && filters.internalTrendM5 !== "all") queryParams.append("internalTrendM5", filters.internalTrendM5);
      if (filters.entryType && filters.entryType !== "all") queryParams.append("entryType", filters.entryType);
      
      const response = await fetch(`/api/trades?${queryParams.toString()}`);
      if (!response.ok) {
        throw new Error("Failed to fetch trades");
      }
      return response.json();
    },
  });

  // Handle trade selection
  const handleTradeSelect = (trade: Trade) => {
    setSelectedTrade(trade);
  };

  // Berechne Statistiken für die angezeigten Trades
  const tradeStats = useMemo(() => {
    if (!trades || trades.length === 0) {
      return {
        count: 0,
        wins: 0,
        losses: 0,
        winRate: 0,
        totalPL: 0,
        totalRR: 0,
        avgRR: 0
      };
    }

    const wins = trades.filter(trade => trade.isWin).length;
    const losses = trades.length - wins;
    const winRate = (wins / trades.length) * 100;
    const totalPL = trades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0);
    const totalRR = trades.reduce((sum, trade) => sum + (trade.rrAchieved || 0), 0);
    const avgRR = totalRR / trades.length;

    return {
      count: trades.length,
      wins,
      losses,
      winRate,
      totalPL,
      totalRR,
      avgRR
    };
  }, [trades]);

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <div className="container max-w-[1400px] mx-auto px-2 sm:px-4 py-3 sm:py-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <Header />

      {/* Main Content Tabs - Vereinfacht und fokussiert */}
      <Tabs defaultValue="trades" className="mb-4 sm:mb-6">
        <div className="overflow-x-auto">
          <TabsList className="mb-6 bg-black/40 p-1 rounded-xl w-full flex flex-nowrap justify-start sm:justify-center">
            <TabsTrigger value="trades" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap">
              <DollarSign className="mr-2 h-4 w-4 md:inline hidden" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap">
              <Brain className="mr-2 h-4 w-4 md:inline hidden" />
              Analyse
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Main Trades Tab */}
        <TabsContent value="trades" className="mt-0">
          <div className="space-y-4 sm:space-y-6">
            {/* FilterBar und "Trade hinzufügen" Button in einem Card */}
            <div className="flex flex-col space-y-4 sm:space-y-6">
              <div className="rocket-card rounded-xl p-2 sm:p-4">
                <div className="flex flex-col space-y-2 sm:space-y-3 mb-2 sm:mb-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold moon-text flex items-center">
                      <DollarSign className="w-4 h-4 mr-2" /> Trades
                      {trades.length > 0 && (
                        <span className="ml-2 text-xs px-2 py-0.5 bg-primary/20 text-primary rounded-full">
                          {formatDate(filters.startDate)}
                        </span>
                      )}
                    </h3>
                  </div>
                  
                  {/* Statistiken */}
                  {trades.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        Trades: {tradeStats.count}
                      </Badge>
                      <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10">
                        Gewinne: {tradeStats.wins}
                      </Badge>
                      <Badge variant="outline" className="bg-red-500/5 text-red-400 hover:bg-red-500/10">
                        Verluste: {tradeStats.losses}
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        Win Rate: {tradeStats.winRate.toFixed(1)}%
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        P&L: ${tradeStats.totalPL.toFixed(2)}
                      </Badge>
                      <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
                        Ø RR: {tradeStats.avgRR.toFixed(2)}
                      </Badge>
                    </div>
                  )}
                </div>
                
                <div className="relative">
                  {/* Filter */}
                  <FilterBar
                    userId={userId}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                  />
                  
                  {/* Trade Tabelle */}
                  <TradeTable
                    trades={trades}
                    isLoading={tradesLoading}
                    onTradeSelect={handleTradeSelect}
                  />
                  
                </div>
                
                {/* Manuelles Modal mit absoluter Positionierung */}
                {isAddTradeVisible && (
                  <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-[9999]">
                    <div className="absolute inset-0 bg-black/70" onClick={() => setIsAddTradeVisible(false)}></div>
                    <div className="relative z-[10000] bg-black/90 backdrop-blur-sm border border-primary/30 rounded-lg shadow-xl max-w-[520px] w-full mx-4">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="text-lg font-bold text-primary">Trade hinzufügen</h3>
                          <button 
                            onClick={() => setIsAddTradeVisible(false)}
                            className="h-8 w-8 rounded-md hover:bg-primary/20 flex items-center justify-center text-gray-400 hover:text-white"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                        <Tabs defaultValue="link" className="w-full">
                          <TabsList className="grid w-full grid-cols-2 mb-4">
                            <TabsTrigger value="link">TradingView Link</TabsTrigger>
                            <TabsTrigger value="manual">Manuell eingeben</TabsTrigger>
                          </TabsList>
                          
                          <TabsContent value="link" className="mt-0">
                            <TradeImport userId={userId} onImport={() => {
                              console.log("TradeImport completed callback - fetching new trades");
                              // Explizites refetch mit Wartezeit
                              setTimeout(() => {
                                refetchTrades();
                                setIsAddTradeVisible(false);
                              }, 300);
                            }} />
                          </TabsContent>
                          
                          <TabsContent value="manual" className="mt-0">
                            <AddTradeForm userId={userId} onAddSuccess={() => {
                              // Trades neu laden und Dialog schließen
                              refetchTrades();
                              setIsAddTradeVisible(false);
                            }} />
                          </TabsContent>
                        </Tabs>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Trade Details - Erscheint unter der Tabelle, wenn ein Trade ausgewählt ist */}
              {selectedTrade && (
                <div className="rocket-card rounded-xl p-2 sm:p-4">
                  <h3 className="text-lg font-bold moon-text mb-2 sm:mb-3">Trade Details</h3>
                  <TradeDetail selectedTrade={selectedTrade} />
                </div>
              )}
            </div>

            {/* TradingView Chart Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* TradingView Chart Display mit Tools darunter */}
              {selectedTrade && selectedTrade.chartImage ? (
                <div className="col-span-1 md:col-span-3 space-y-4">
                  {/* Chart Image */}
                  <div className="rocket-card rounded-xl p-2 sm:p-4">
                    <h3 className="text-lg font-bold mb-2 sm:mb-4 flex items-center">
                      <ImageIcon className="w-4 h-4 mr-2" /> 
                      Chart für {selectedTrade.symbol} ({formatDate(selectedTrade.date)})
                    </h3>
                    <div className="rounded-lg overflow-hidden border border-border">
                      {selectedTrade.chartImage.startsWith('http') ? (
                        // Externe URL (TradingView Link)
                        <a href={selectedTrade.chartImage} target="_blank" rel="noopener noreferrer" className="block">
                          <img 
                            src={selectedTrade.chartImage} 
                            alt={`Chart für ${selectedTrade.symbol}`}
                            className="w-full h-auto max-h-[500px] object-contain"
                          />
                        </a>
                      ) : (
                        // Base64 Bild
                        <img 
                          src={selectedTrade.chartImage} 
                          alt={`Chart für ${selectedTrade.symbol}`}
                          className="w-full h-auto max-h-[500px] object-contain"
                        />
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                <>
                  {/* Placeholder für Chartanzeige, wenn kein Chart ausgewählt ist */}
                  <div className="rocket-card rounded-xl p-2 sm:p-4 col-span-1 md:col-span-3">
                    <h3 className="text-lg font-bold moon-text mb-2 sm:mb-3">Chart Analyse</h3>
                    <p className="text-muted-foreground">Wähle einen Trade aus, um Details und Charts anzuzeigen.</p>
                  </div>
                </>
              )}
            </div>
          </div>
        </TabsContent>
        
        {/* AI Analysis Tab - Mit Sub-Navigation */}
        <TabsContent value="ai-analysis" className="mt-0">
          {/* Unternavigation für Analyse mit Tabs */}
          <Tabs defaultValue="patterns" className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="mb-4 bg-black/40 p-1 rounded-xl w-full flex flex-nowrap justify-start sm:justify-center">
                <TabsTrigger value="patterns" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap">
                  <Brain className="mr-2 h-4 w-4 md:inline hidden" />
                  Muster
                </TabsTrigger>
                <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap">
                  <Activity className="mr-2 h-4 w-4 md:inline hidden" />
                  KI-Analyse
                </TabsTrigger>
                <TabsTrigger value="risk" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap">
                  <AlertCircle className="mr-2 h-4 w-4 md:inline hidden" />
                  Risiko
                </TabsTrigger>
                <TabsTrigger value="market-phases" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap">
                  <BarChart2 className="mr-2 h-4 w-4 md:inline hidden" />
                  Marktphasen
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap">
                  <Trophy className="mr-2 h-4 w-4 md:inline hidden" />
                  Performance
                </TabsTrigger>
              </TabsList>
            </div>
            
            {/* Trading Patterns Tab */}
            <TabsContent value="patterns" className="mt-0">
              <div className="rocket-card rounded-xl p-2 sm:p-4">
                <h2 className="text-lg font-bold mb-2 sm:mb-3 flex items-center"><Brain className="w-4 h-4 mr-2" /> Trading Muster</h2>
                <TradingPatterns userId={userId} />
              </div>
            </TabsContent>
            
            {/* KI-Analyse Tab */}
            <TabsContent value="ai-assistant" className="mt-0">
              <div className="rocket-card rounded-xl p-2 sm:p-4">
                <h2 className="text-lg font-bold mb-2 sm:mb-3 flex items-center"><Activity className="w-4 h-4 mr-2" /> KI-Analyse</h2>
                <AdvancedTradeAnalysisWrapper userId={userId} />
              </div>
            </TabsContent>
            
            {/* Risikomanagement Tab */}
            <TabsContent value="risk" className="mt-0">
              <div className="rocket-card rounded-xl p-2 sm:p-4">
                <h2 className="text-lg font-bold mb-2 sm:mb-3 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Risikomanagement</h2>
                <RiskManagementDashboard userId={userId} />
              </div>
            </TabsContent>
            
            {/* Marktphasen Tab */}
            <TabsContent value="market-phases" className="mt-0">
              <div className="rocket-card rounded-xl p-2 sm:p-4">
                <h2 className="text-lg font-bold mb-2 sm:mb-3 flex items-center"><BarChart2 className="w-4 h-4 mr-2" /> Marktphasen-Analyse</h2>
                <MarketPhaseAnalysis userId={userId} />
              </div>
            </TabsContent>
            
            {/* Performance Tab mit Wochenanalyse */}
            <TabsContent value="performance" className="mt-0">
              <div className="rocket-card rounded-xl p-2 sm:p-4">
                <h2 className="text-lg font-bold mb-2 sm:mb-3 flex items-center"><Trophy className="w-4 h-4 mr-2" /> Performance-Analyse</h2>
                <WeeklySummary
                  userId={userId}
                  weekStart={filters.startDate}
                  weekEnd={filters.endDate}
                />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}