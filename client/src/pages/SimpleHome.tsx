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
import { getWeekDates } from "@/lib/utils";
import { Trade } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  FileUp, Settings, Brain, BarChart2, Activity, Trophy, Calendar,
  Users, Download, TrendingDown, DollarSign, AlertCircle
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

  // Toggle function removed

  return (
    <div className="container mx-auto px-4 py-6 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-purple-500/10 rounded-full blur-3xl"></div>
      
      {/* Header */}
      <Header />

      {/* Filter Bar - Wrapped in a styled card */}
      <div className="rocket-card rounded-xl p-4 mb-6">
        <FilterBar filters={filters} onFilterChange={handleFilterChange} />
      </div>

      {/* Main Content Tabs - Vereinfacht und fokussiert */}
      <Tabs defaultValue="trades" className="mb-6">
        <TabsList className="w-full justify-start mb-4 overflow-x-auto bg-black/40 p-1 rounded-xl">
          <TabsTrigger value="trades" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <BarChart2 className="mr-2 h-4 w-4" />
            Trades
          </TabsTrigger>
          <TabsTrigger value="ai-analysis" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
            <Brain className="mr-2 h-4 w-4" />
            Analyse
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
                  <TabsList className="grid grid-cols-3 mb-4 bg-black/60">
                    <TabsTrigger value="details" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                      Trade Details
                    </TabsTrigger>
                    <TabsTrigger value="add" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                      Hinzufügen
                    </TabsTrigger>
                    <TabsTrigger value="import" className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary">
                      Import
                    </TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="details" className="mt-0">
                    <TradeDetail selectedTrade={selectedTrade} />
                  </TabsContent>
                  
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
        </TabsContent>
        
        {/* AI Analysis Tab - Neu organisiert mit allen wichtigen Analyse-Tools */}
        <TabsContent value="ai-analysis" className="mt-0">
          {/* Unternavigation für verschiedene Analysetools */}
          <div className="mb-4 flex justify-start gap-2 overflow-x-auto">
            <Button variant="outline" size="sm" className="flex items-center" onClick={() => document.getElementById('trading-patterns')?.scrollIntoView({behavior: 'smooth'})}>
              <Brain className="w-3 h-3 mr-1" />
              Muster
            </Button>
            <Button variant="outline" size="sm" className="flex items-center" onClick={() => document.getElementById('advanced-analysis')?.scrollIntoView({behavior: 'smooth'})}>
              <Activity className="w-3 h-3 mr-1" />
              KI-Analyse
            </Button>
            <Button variant="outline" size="sm" className="flex items-center" onClick={() => document.getElementById('risk-management')?.scrollIntoView({behavior: 'smooth'})}>
              <AlertCircle className="w-3 h-3 mr-1" />
              Risiko
            </Button>
            <Button variant="outline" size="sm" className="flex items-center" onClick={() => document.getElementById('market-phases')?.scrollIntoView({behavior: 'smooth'})}>
              <Activity className="w-3 h-3 mr-1" />
              Marktphasen
            </Button>
          </div>
          
          {/* Trading Patterns und Advanced Analysis */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            <div>
              <div id="trading-patterns" className="rocket-card rounded-xl p-4 h-full">
                <h2 className="text-lg font-bold mb-3 flex items-center"><Brain className="w-4 h-4 mr-2" /> Trading Muster</h2>
                <TradingPatterns userId={userId} />
              </div>
            </div>
            <div>
              <div id="advanced-analysis" className="rocket-card rounded-xl p-4 h-full">
                <h2 className="text-lg font-bold mb-3 flex items-center"><Activity className="w-4 h-4 mr-2" /> KI-Analyse</h2>
                <AdvancedTradeAnalysis userId={userId} />
              </div>
            </div>
          </div>
          
          {/* Risk Management */}
          <div id="risk-management" className="rocket-card rounded-xl p-4 mb-6">
            <h2 className="text-lg font-bold mb-3 flex items-center"><AlertCircle className="w-4 h-4 mr-2" /> Risikomanagement</h2>
            <RiskManagementDashboard userId={userId} />
          </div>
          
          {/* Market Phases */}
          <div id="market-phases" className="rocket-card rounded-xl p-4">
            <h2 className="text-lg font-bold mb-3 flex items-center"><Activity className="w-4 h-4 mr-2" /> Marktphasen-Analyse</h2>
            <MarketPhaseAnalysis userId={userId} />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}