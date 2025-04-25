import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import TradeTable from "@/components/TradeTable";
import WeeklySummary from "@/components/WeeklySummary";
import TradeDetail from "@/components/TradeDetail";
import TradeImport from "@/components/TradeImport";
import AddTradeForm from "@/components/AddTradeForm";
import TradingPatterns from "@/components/TradingPatterns";
import AdvancedTradeAnalysis from "@/components/AdvancedTradeAnalysis";
import RiskManagementDashboard from "@/components/RiskManagementDashboard";
import MarketPhaseAnalysis from "@/components/MarketPhaseAnalysis";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getWeekDates, formatDate } from "@/lib/utils";
import { Trade } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, TrendingDown, DollarSign, AlertCircle, Image as ImageIcon
} from "lucide-react";
import { Link } from "wouter";

export default function SimpleHome() {
  const { user } = useAuth();
  const userId = user?.id || 1; // Fallback to 1 only if user object isn't loaded yet
  const { toast } = useToast();
  const [selectedTrade, setSelectedTrade] = useState<Trade | null>(null);
  
  const [filters, setFilters] = useState({
    startDate: getWeekDates().weekStart,
    endDate: getWeekDates().weekEnd,
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
          <TabsList className="w-full justify-start mb-4 overflow-x-auto bg-black/40 p-1 rounded-xl">
            <TabsTrigger value="trades" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap">
              <BarChart2 className="mr-2 h-4 w-4 md:inline hidden" />
              Trades
            </TabsTrigger>
            <TabsTrigger value="ai-analysis" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary whitespace-nowrap">
              <Brain className="mr-2 h-4 w-4 md:inline hidden" />
              Analyse
            </TabsTrigger>
          </TabsList>
        </div>
        
        {/* Trades Tab */}
        <TabsContent value="trades" className="mt-0">
          <div className="space-y-6">
            {/* Main Trade Table Section - Full Width */}
            <div className="w-full space-y-4">
              {/* Ein gemeinsames Element für Filter und Tabelle */}
              <div className="rocket-card rounded-xl p-0 overflow-hidden">
                {/* Filter Bar als integrierter Teil des Elementes */}
                <FilterBar filters={filters} onFilterChange={handleFilterChange} />
                
                {/* Trade Table direkt angeschlossen */}
                <div className="px-6 py-6">
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
            </div>

            {/* Two Column Grid for Details and Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* TradingView Chart Display - Mobile: Volle Breite, Desktop: 2 Spalten */}
              {selectedTrade && selectedTrade.chartImage && (
                <div className="rocket-card rounded-xl p-2 sm:p-4 col-span-1 md:col-span-2">
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
              )}

              {/* Placeholder für andere Elemente - Mobile: Volle Breite wenn kein Chart, sonst unsichtbar */}
              {!selectedTrade?.chartImage && (
                <div className="rocket-card rounded-xl p-2 sm:p-4 col-span-1 md:col-span-2">
                  <h3 className="text-lg font-bold moon-text mb-2 sm:mb-3">Chart Analyse</h3>
                  <p className="text-muted-foreground">Wähle einen Trade aus, um Details und Charts anzuzeigen.</p>
                </div>
              )}

              {/* Tools Panel - Mobile: Volle Breite, Desktop: 1 Spalte rechts */}
              <div className="col-span-1">
                <div className="rocket-card rounded-xl">
                  <Tabs defaultValue="add" className="p-2 sm:p-4">
                    <TabsList className="grid grid-cols-2 mb-2 sm:mb-4 bg-black/60">
                      <TabsTrigger value="add" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Hinzufügen
                      </TabsTrigger>
                      <TabsTrigger value="import" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                        Import
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="add" className="mt-0">
                      <AddTradeForm userId={userId} onAddSuccess={refetchTrades} />
                    </TabsContent>
                    
                    <TabsContent value="import" className="mt-0">
                      <TradeImport userId={userId} onImport={refetchTrades} />
                    </TabsContent>
                  </Tabs>
                </div>
              </div>
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
                <AdvancedTradeAnalysis userId={userId} />
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