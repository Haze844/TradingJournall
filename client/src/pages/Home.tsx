import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import TradeTable from "@/components/TradeTable";
import WeeklySummary from "@/components/WeeklySummary";
import TradeDetail from "@/components/TradeDetail";
import TradeImport from "@/components/TradeImport";
import TradingPatterns from "@/components/TradingPatterns";
import AdvancedTradeAnalysis from "@/components/AdvancedTradeAnalysis";
import RiskManagementDashboard from "@/components/RiskManagementDashboard";
import MarketPhaseAnalysis from "@/components/MarketPhaseAnalysis";
import { synchronizeTrades } from "@/lib/tradovate";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getWeekDates } from "@/lib/utils";
import { Trade } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar, Users, Download } from "lucide-react";
import { Link } from "wouter";

export default function Home() {
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

  // Handle trade synchronization
  const handleSyncTrades = async () => {
    toast({
      title: "Synchronizing trades...",
      description: "Please wait while we sync with Tradovate",
    });

    const result = await synchronizeTrades(userId);

    if (result.success) {
      toast({
        title: "Trades synchronized",
        description: result.message,
      });
      refetchTrades();
    } else {
      toast({
        title: "Synchronization failed",
        description: result.message,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <header className="flex justify-between items-center mb-8 backdrop-blur-sm p-4 rocket-card rounded-xl">
        <div className="flex items-center gap-3">
          <div className="bg-white text-black font-bold p-2 rounded-xl text-lg meme-logo">
            LVL<br />UP
          </div>
          <div>
            <h1 className="text-2xl font-extrabold moon-text">LvlUp Tradingtagebuch</h1>
            <p className="text-xs text-gray-400">Trading-Performance optimieren</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Button 
            onClick={() => {
              const importTab = document.querySelector('[value="import"]') as HTMLElement;
              if (importTab) importTab.click();
            }} 
            className="flex items-center gap-2 pulse-btn bg-gradient-to-r from-primary to-primary/80"
          >
            <FileUp className="h-4 w-4 mr-2" />
            CSV Import
          </Button>
          <Button variant="outline" size="icon" className="border-primary/40 hover:border-primary/80">
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Filter Bar - Wrapped in a styled card */}
      <div className="rocket-card rounded-xl p-4 mb-6">
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="trades" className="mb-6">
        <TabsList className="w-full justify-start mb-4 overflow-x-auto bg-black/40 p-1 rounded-xl">
          <TabsTrigger value="trades" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            Trades
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center">
            <Brain className="mr-2 h-4 w-4" />
            KI-Analyse
          </TabsTrigger>
          <TabsTrigger value="risk" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center">
            <BarChart2 className="mr-2 h-4 w-4" />
            Risikomanagement
          </TabsTrigger>
          <TabsTrigger value="market-phases" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary flex items-center">
            <Activity className="mr-2 h-4 w-4" />
            Marktphasen
          </TabsTrigger>
        </TabsList>
        
        {/* Trades Tab */}
        <TabsContent value="trades" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Trade Table Section */}
            <div className="lg:col-span-2 space-y-6">
              {/* Trade Table */}
              <div className="rocket-card rounded-xl p-4">
                <TradeTable
                  trades={trades}
                  isLoading={tradesLoading}
                  onTradeSelect={handleTradeSelect}
                />
              </div>

              {/* Weekly Summary */}
              <div className="rocket-card rounded-xl p-4">
                <WeeklySummary
                  userId={userId}
                  weekStart={filters.startDate}
                  weekEnd={filters.endDate}
                />
              </div>
            </div>

            {/* Side Panel */}
            <div className="lg:col-span-1">
              <div className="rocket-card rounded-xl">
                <Tabs defaultValue="details" className="p-4">
                  <TabsList className="grid grid-cols-2 mb-4 bg-black/60">
                    <TabsTrigger value="details" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                      Trade Details
                    </TabsTrigger>
                    <TabsTrigger value="import" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                      Import
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-0">
                    <TradeDetail selectedTrade={selectedTrade} />
                  </TabsContent>
                  
                  <TabsContent value="import" className="mt-0">
                    <TradeImport />
                  </TabsContent>
                </Tabs>
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* AI Analysis Tab */}
        <TabsContent value="ai-analysis" className="mt-0">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <div className="rocket-card rounded-xl p-4 h-full">
                <TradingPatterns userId={userId} />
              </div>
            </div>
            
            <div>
              <div className="rocket-card rounded-xl p-4 h-full">
                <AdvancedTradeAnalysis trade={selectedTrade} />
              </div>
            </div>
          </div>
        </TabsContent>
        
        {/* Risk Management Tab */}
        <TabsContent value="risk" className="mt-0">
          <div className="rocket-card rounded-xl p-4">
            <RiskManagementDashboard userId={userId} />
          </div>
        </TabsContent>
        
        {/* Market Phases Tab */}
        <TabsContent value="market-phases" className="mt-0">
          <div className="rocket-card rounded-xl p-4">
            <MarketPhaseAnalysis userId={userId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
