import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import TradeTable from "@/components/TradeTable";
import WeeklySummary from "@/components/WeeklySummary";
import TradeDetail from "@/components/TradeDetailNew";
import TradeImport from "@/components/TradeImport";
import AddTradeForm from "@/components/AddTradeForm";
import TradingPatterns from "@/components/TradingPatterns";
import AdvancedTradeAnalysisWrapper from "@/components/AdvancedTradeAnalysisWrapper";
import RiskManagementDashboard from "@/components/RiskManagementDashboard";
import MarketPhaseAnalysis from "@/components/MarketPhaseAnalysis";
import TradeDashboard from "@/components/TradeDashboard";
import PerformanceHeatmap from "@/components/PerformanceHeatmap";
import TradingStreakTracker from "@/components/TradingStreakTracker";
import AccountBalanceProgress from "@/components/AccountBalanceProgress";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getWeekDates, getTodayDates, formatDate } from "@/lib/utils";
import { Trade } from "../shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, TrendingDown, DollarSign, AlertCircle, Image as ImageIcon,
  Plus, X, Flame, Target, ArrowUpRight, ArrowDownRight
} from "lucide-react";

import { Link } from "wouter";

export default function SimpleHome() {
  const { user } = useAuth();
  const userId = user?.id || 1; // Fallback to 1 only if user object isn't loaded yet
  const tradesSectionRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  // State für die Sichtbarkeit des Add-Formulars
  const [isAddTradeVisible, setIsAddTradeVisible] = useState(false);
  // State für aktiven Tab
  const [activeTab, setActiveTab] = useState("dashboard");
  
  // Globales Modal - außerhalb der Tabelle
  const TradeFormModal = () => {
    if (!isAddTradeVisible) return null;
    
    return (
      <div className="fixed top-0 left-0 right-0 bottom-0 flex items-center justify-center z-[9999]">
        <div className="absolute inset-0 bg-black/70" onClick={() => setIsAddTradeVisible(false)}></div>
        <div className="relative z-[10000] bg-black/90 backdrop-blur-sm border border-primary/30 rounded-lg shadow-xl max-w-[900px] w-full mx-4 max-h-[90vh] overflow-auto">
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
                <TabsTrigger value="link" className="text-base">TradingView Link</TabsTrigger>
                <TabsTrigger value="manual" className="text-base">Manuell eingeben</TabsTrigger>
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
                <div className="border-t border-border pt-2 mb-2">
                  <h3 className="text-sm font-medium text-gray-400 mb-2">Manuellen Trade eingeben</h3>
                  <p className="text-xs text-gray-500 mb-2">Bitte füllen Sie alle Felder aus. Nach dem Speichern wird der Trade in Ihrer Liste angezeigt.</p>
                </div>
                
                <div className="overflow-visible p-4">
                  <AddTradeForm userId={userId} onAddSuccess={() => {
                    // Trades neu laden und Dialog schließen
                    refetchTrades();
                    setIsAddTradeVisible(false);
                  }} />
                </div>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    );
  };
  
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
  
  // Event Listener für den "Trade hinzufügen" Button in der TradeTable
  useEffect(() => {
    const handleAddTradeClick = () => {
      console.log("Event: add-trade-clicked empfangen");
      // Verzögerung hinzufügen, um sicherzustellen, dass der Event nicht mehrfach verarbeitet wird
      setTimeout(() => {
        setIsAddTradeVisible(true);
      }, 10);
    };
    
    // Event-Listener registrieren
    window.addEventListener('add-trade-clicked', handleAddTradeClick);
    
    // Cleanup beim Unmount
    return () => {
      window.removeEventListener('add-trade-clicked', handleAddTradeClick);
    };
  }, []);
  
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

  // State für gefilterte Trades
  const [filteredTrades, setFilteredTrades] = useState<Trade[]>([]);
  
  // State für aktive Filter aus der TradeTable
  const [activeFilters, setActiveFilters] = useState<any>(null);

  // Handler für gefilterte Trades aus der TradeTable-Komponente
  const handleFilteredTradesChange = useCallback((newFilteredTrades: Trade[]) => {
    setFilteredTrades(newFilteredTrades);
  }, []);
  
  // Handler für aktive Filter aus der TradeTable-Komponente
  const handleActiveFiltersChange = useCallback((newActiveFilters: any) => {
    setActiveFilters(newActiveFilters);
  }, []);

  // Berechne Statistiken für die angezeigten Trades (basierend auf gefilterten Trades)
  const tradeStats = useMemo(() => {
    // Verwende die gefilterten Trades, wenn vorhanden, ansonsten alle Trades
    const tradesForStats = filteredTrades.length > 0 ? filteredTrades : trades;
    
    if (!tradesForStats || tradesForStats.length === 0) {
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

    const wins = tradesForStats.filter((trade: any) => trade.isWin).length;
    const losses = tradesForStats.length - wins;
    const winRate = (wins / tradesForStats.length) * 100;
    const totalPL = tradesForStats.reduce((sum: number, trade: any) => sum + (trade.profitLoss || 0), 0);
    const totalRR = tradesForStats.reduce((sum: number, trade: any) => sum + (trade.rrAchieved || 0), 0);
    const avgRR = totalRR / tradesForStats.length;

    return {
      count: tradesForStats.length,
      wins,
      losses,
      winRate,
      totalPL,
      totalRR,
      avgRR
    };
  }, [trades, filteredTrades]);

  // Handle filter changes
  const handleFilterChange = (newFilters: any) => {
    setFilters({ ...filters, ...newFilters });
  };

  return (
    <div className="container max-w-[1400px] mx-auto px-2 sm:px-4 py-3 sm:py-6 relative overflow-hidden">
      {/* Trade Form Modal Component - COMPLETELY OUTSIDE MAIN CONTAINER */}
      <TradeFormModal />
      
      {/* Background Elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Header mit integrierten Tabs */}
      <Header activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full" id="main-tabs">
        
        {/* Dashboard Tab - Umfassende Statistiken und Analysen */}
        <TabsContent value="dashboard">
          <div className="rocket-card rounded-xl p-2 sm:p-4">
            <h2 className="text-xl font-bold mb-4 flex items-center">
              <BarChart2 className="w-5 h-5 mr-2 text-primary" /> 
              Trading Performance Dashboard
            </h2>
            <TradeDashboard trades={trades} />
          </div>
        </TabsContent>
        
        <TabsContent value="trades">
          <div className="rocket-card rounded-xl p-2 sm:p-4 min-h-[140vh]" ref={tradesSectionRef}>
            
            {/* Hier war die Kontofortschritt-Komponente, die jetzt in TradeTable integriert ist */}
            
            {/* Statistik Panel - kompakter gestaltet */}
            <div className="mb-3 bg-gradient-to-r from-black/20 to-black/10 rounded-lg p-2 border border-primary/10 backdrop-blur-sm shadow-md">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="bg-black/20 p-2 rounded-md border border-primary/5 hover:border-primary/20 transition-all duration-200 flex flex-col">
                  <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
                    <BarChart2 className="w-3 h-3 mr-1 text-primary/70" />
                    Trades
                  </h3>
                  <div className="flex gap-2 items-center">
                    <span className="text-lg font-bold">{tradeStats.count}</span>
                    <div className="flex flex-col gap-0.5">
                      <div className="flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-emerald-500/5 text-emerald-400">
                        <ArrowUpRight className="w-2.5 h-2.5 mr-0.5" />
                        <span>{tradeStats.wins}W</span>
                      </div>
                      <div className="flex items-center text-[10px] px-1.5 py-0.5 rounded-sm bg-red-500/5 text-red-400">
                        <ArrowDownRight className="w-2.5 h-2.5 mr-0.5" />
                        <span>{tradeStats.losses}L</span>
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 p-2 rounded-md border border-primary/5 hover:border-primary/20 transition-all duration-200 flex flex-col">
                  <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
                    <Target className="w-3 h-3 mr-1 text-primary/70" />
                    Win Rate
                  </h3>
                  <div className="flex flex-col">
                    <div className="flex gap-2 items-center">
                      <span className={`text-lg font-bold ${tradeStats.winRate >= 50 ? 'text-emerald-400' : 'text-red-400'}`}>{tradeStats.winRate.toFixed(1)}%</span>
                      <div className={`flex items-center text-[10px] rounded-sm px-1.5 py-0.5 ${
                        tradeStats.winRate >= 65 ? 'bg-emerald-500/5 text-emerald-400' : 
                        tradeStats.winRate >= 50 ? 'bg-emerald-500/5 text-emerald-400' : 
                        tradeStats.winRate >= 40 ? 'bg-amber-500/5 text-amber-400' :
                        'bg-red-500/5 text-red-400'
                      }`}>
                        {
                          tradeStats.winRate >= 65 ? 'Exz.' :
                          tradeStats.winRate >= 50 ? 'Profit' :
                          tradeStats.winRate >= 40 ? 'Grenz' :
                          'Verlust'
                        }
                      </div>
                    </div>
                    <div className="w-full mt-1 bg-gray-800/30 rounded-full h-1">
                      <div className="h-1 rounded-full transition-all duration-300"
                        style={{
                          width: `${Math.min(100, Math.max(tradeStats.winRate, 5))}%`,
                          background: `${
                            tradeStats.winRate >= 65 ? 'linear-gradient(90deg, #10b981, #34d399)' : 
                            tradeStats.winRate >= 50 ? 'linear-gradient(90deg, #34d399, #6ee7b7)' : 
                            tradeStats.winRate >= 40 ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                            'linear-gradient(90deg, #ef4444, #f87171)'
                          }`
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 p-2 rounded-md border border-primary/5 hover:border-primary/20 transition-all duration-200 flex flex-col">
                  <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
                    <DollarSign className="w-3 h-3 mr-1 text-primary/70" />
                    Gesamt P/L
                  </h3>
                  <div className="flex gap-2 items-center">
                    <span className={`text-lg font-bold ${tradeStats.totalPL >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {tradeStats.totalPL >= 0 ? '+' : ''}{tradeStats.totalPL.toFixed(0)}$
                    </span>
                    <div className={`flex items-center text-[10px] rounded-sm px-1.5 py-0.5 ${tradeStats.totalPL >= 0 ? 'bg-emerald-500/5 text-emerald-400' : 'bg-red-500/5 text-red-400'}`}>
                      {tradeStats.totalPL > 1000 ? 'Sehr gut' :
                       tradeStats.totalPL > 0 ? 'Positiv' : 
                       'Negativ'}
                    </div>
                  </div>
                </div>
                
                <div className="bg-black/20 p-2 rounded-md border border-primary/5 hover:border-primary/20 transition-all duration-200 flex flex-col">
                  <h3 className="text-xs font-medium text-muted-foreground mb-0.5 flex items-center">
                    <Activity className="w-3 h-3 mr-1 text-primary/70" />
                    Durchschn. RR
                  </h3>
                  <div className="flex gap-2 items-center">
                    <span className={`text-lg font-bold ${tradeStats.avgRR >= 1.5 ? 'text-emerald-400' : 
                                                         tradeStats.avgRR >= 1 ? 'text-blue-400' : 
                                                         tradeStats.avgRR >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                      {tradeStats.avgRR.toFixed(2)}R
                    </span>
                    <div className={`flex items-center text-[10px] rounded-sm px-1.5 py-0.5 ${
                      tradeStats.avgRR >= 2 ? 'bg-emerald-500/5 text-emerald-400' : 
                      tradeStats.avgRR >= 1.5 ? 'bg-blue-500/5 text-blue-400' : 
                      tradeStats.avgRR >= 1 ? 'bg-amber-500/5 text-amber-400' : 
                      'bg-red-500/5 text-red-400'
                    }`}>
                      {
                        tradeStats.avgRR >= 2 ? 'Exz.' :
                        tradeStats.avgRR >= 1.5 ? 'Gut' :
                        tradeStats.avgRR >= 1 ? 'OK' :
                        'Niedrig'
                      }
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="relative w-full">
              {/* Filter */}
              <FilterBar
                userId={userId}
                filters={filters}
                onFilterChange={handleFilterChange}
              />
              
              {/* Trade Tabelle - verbreitert */}
              <div className="w-full">
                <TradeTable
                  trades={trades}
                  isLoading={tradesLoading}
                  onTradeSelect={handleTradeSelect}
                  onFilteredTradesChange={handleFilteredTradesChange}
                  onActiveFiltersChange={handleActiveFiltersChange}
                />
              </div>
            </div>
          </div>
          
          {/* Trade Details - Erscheint als Modal */}
          {selectedTrade && (
            <Dialog open={true} onOpenChange={(open) => !open && setSelectedTrade(null)}>
              <DialogContent className="max-w-7xl w-[90vw] max-h-[85vh] overflow-y-auto bg-black/95 border border-primary/30 shadow-xl p-0">
                <DialogTitle className="sr-only">Trade Details</DialogTitle>
                <DialogDescription className="sr-only">
                  Detailansicht eines ausgewählten Trades mit allen Parametern und Eigenschaften.
                </DialogDescription>
                <TradeDetail 
                  selectedTrade={selectedTrade} 
                  onTradeSelected={setSelectedTrade} 
                />
              </DialogContent>
            </Dialog>
          )}

          {/* TradingView Chart Display */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {/* Bereich für die Wochenanalyse, der Chart Bereich wurde auf Wunsch entfernt */}
          </div>
        </TabsContent>
        
        {/* AI Analysis Tab - Mit Sub-Navigation */}
        {/* Risk-Manager Tab in der Hauptnavigation */}
        <TabsContent value="risk" className="mt-0">
          <div className="rocket-card rounded-xl p-2 sm:p-4">
            <RiskManagementDashboard userId={userId} activeFilters={activeFilters} />
          </div>
        </TabsContent>
            
        <TabsContent value="ai-analysis" className="mt-0">
          {/* Unternavigation für Analyse mit Tabs */}
          <Tabs defaultValue="market-phases" className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="mb-4 bg-black/40 p-1 rounded-xl w-full flex justify-center">
                <TabsTrigger value="market-phases" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2">
                  <BarChart2 className="mr-1.5 h-4 w-4 md:inline hidden" />
                  Marktphasen
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2">
                  <Trophy className="mr-1.5 h-4 w-4 md:inline hidden" />
                  Performance
                </TabsTrigger>
                <TabsTrigger value="streaks" className="custom-tabs-trigger data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2 relative overflow-hidden group">
                  <Flame className="mr-1.5 h-4 w-4 md:inline hidden group-hover:text-blue-300 transition-colors" />
                  <span className="group-hover:text-blue-300 transition-colors">Streak Tracker</span>
                  <span className="absolute -bottom-0 left-0 w-full h-0.5 bg-gradient-to-r from-blue-500 to-blue-300 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left"></span>
                </TabsTrigger>
                <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2">
                  <Activity className="mr-1.5 h-4 w-4 md:inline hidden" />
                  KI-Analyse
                </TabsTrigger>
                <TabsTrigger value="patterns" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2">
                  <Brain className="mr-1.5 h-4 w-4 md:inline hidden" />
                  Muster
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
            

            
            {/* Marktphasen Tab */}
            <TabsContent value="market-phases" className="mt-0">
              <div className="rocket-card rounded-xl p-2 sm:p-4">
                <h2 className="text-lg font-bold mb-2 sm:mb-3 flex items-center"><BarChart2 className="w-4 h-4 mr-2" /> Marktphasen-Analyse</h2>
                <MarketPhaseAnalysis userId={userId} />
              </div>
            </TabsContent>
            
            {/* Performance Tab mit Wochenanalyse und Heatmap */}
            <TabsContent value="performance" className="mt-0">
              <div className="space-y-6">
                {/* Performance Heatmap */}
                <div>
                  <PerformanceHeatmap activeFilters={activeFilters} />
                </div>
              </div>
            </TabsContent>
            
            {/* Trading Streak Tracker Tab */}
            <TabsContent value="streaks" className="mt-0">
              <div className="bg-gradient-to-r from-blue-900/10 to-blue-800/5 backdrop-blur-md rounded-xl border border-blue-500/10 shadow-xl p-2 sm:p-4">
                <h2 className="text-lg font-bold mb-4 sm:mb-5 flex items-center">
                  <div className="bg-blue-900/30 p-2 rounded-full mr-3">
                    <Flame className="w-5 h-5 text-blue-400" />
                  </div>
                  <span className="bg-gradient-to-r from-blue-400 to-blue-500 bg-clip-text text-transparent">
                    Trading Streak Challenge
                  </span>
                </h2>
                <div className="mb-5">
                  <p className="text-sm text-blue-300/80 mb-3">
                    Baue deine Trading-Streak auf, sammle Erfahrungspunkte und verdiene einzigartige Badges,
                    während du deine Handelsleistung kontinuierlich verbesserst.
                  </p>
                </div>
                <TradingStreakTracker userId={userId} />
              </div>
            </TabsContent>
          </Tabs>
        </TabsContent>
      </Tabs>
    </div>
  );
}