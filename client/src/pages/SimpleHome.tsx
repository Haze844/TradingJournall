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
      setIsAddTradeVisible(true);
    };
    
    window.addEventListener('add-trade-clicked', handleAddTradeClick);
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
      {/* Trade Form Modal Component - COMPLETELY OUTSIDE MAIN CONTAINER */}
      <TradeFormModal />
      
      {/* Background Elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <Header />

      {/* Main Content */}
      <Tabs defaultValue="trades" className="w-full">
        <TabsContent value="trades">
          <div className="rocket-card rounded-xl p-2 sm:p-4">
            {/* Tabs innerhalb der Card statt Überschrift */}
            <div className="flex justify-center items-center mb-5">
              <TabsList className="bg-black/60 p-1.5 rounded-xl shadow-lg border border-primary/10">
                <TabsTrigger 
                  id="trades-tab"
                  value="trades" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-md px-5 py-1.5 transition-all duration-200 rounded-lg"
                >
                  <DollarSign className="w-4 h-4 mr-1.5" /> Trades
                </TabsTrigger>
                <TabsTrigger 
                  id="ai-analysis-tab"
                  value="ai-analysis" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary data-[state=active]:shadow-md px-5 py-1.5 transition-all duration-200 rounded-lg"
                >
                  <Activity className="w-4 h-4 mr-1.5" /> Analyse
                </TabsTrigger>
              </TabsList>
            </div>
            
            <div className="mb-2 sm:mb-3">
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
          </div>
          
          {/* Trade Details - Erscheint unter der Tabelle, wenn ein Trade ausgewählt ist */}
          {selectedTrade && (
            <div className="rocket-card rounded-xl p-2 sm:p-4">
              <h3 className="text-lg font-bold moon-text mb-2 sm:mb-3">Trade Details</h3>
              <TradeDetail selectedTrade={selectedTrade} />
            </div>
          )}

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
        </TabsContent>
        
        {/* AI Analysis Tab - Mit Sub-Navigation */}
        <TabsContent value="ai-analysis" className="mt-0">
          {/* Unternavigation für Analyse mit Tabs */}
          <Tabs defaultValue="patterns" className="w-full">
            <div className="overflow-x-auto pb-2">
              <TabsList className="mb-4 bg-black/40 p-1 rounded-xl w-full flex justify-center">
                {/* Trades Tab an erster Stelle - Direkt zur Trades Tabelle zurückkehren */}
                <TabsTrigger 
                  value="back-to-trades" 
                  className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2"
                  onClick={(e) => {
                    e.preventDefault(); // Verhindern, dass die Tabs-Aktion ausgeführt wird
                    
                    // Erst den "trades" Tab der Hauptnavigation aktivieren
                    const tradesTab = document.getElementById('trades-tab') as HTMLElement;
                    if (tradesTab) {
                      tradesTab.click();
                    }
                    
                    // Sicherstellen, dass wir zur Trades-Tabelle zurückkehren
                    setTimeout(() => {
                      const contentElement = document.querySelector('.rocket-card') as HTMLElement;
                      if (contentElement) {
                        contentElement.scrollIntoView({ behavior: 'smooth' });
                      }
                    }, 50);
                  }}
                >
                  <DollarSign className="mr-1.5 h-4 w-4 md:inline hidden" />
                  Trades
                </TabsTrigger>
                <TabsTrigger value="patterns" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2">
                  <Brain className="mr-1.5 h-4 w-4 md:inline hidden" />
                  Muster
                </TabsTrigger>
                <TabsTrigger value="ai-assistant" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2">
                  <Activity className="mr-1.5 h-4 w-4 md:inline hidden" />
                  KI-Analyse
                </TabsTrigger>
                <TabsTrigger value="risk" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2">
                  <AlertCircle className="mr-1.5 h-4 w-4 md:inline hidden" />
                  Risiko
                </TabsTrigger>
                <TabsTrigger value="market-phases" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2">
                  <BarChart2 className="mr-1.5 h-4 w-4 md:inline hidden" />
                  Marktphasen
                </TabsTrigger>
                <TabsTrigger value="performance" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary px-2">
                  <Trophy className="mr-1.5 h-4 w-4 md:inline hidden" />
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