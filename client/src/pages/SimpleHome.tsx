import { useState } from "react";
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
      <header className="mb-8 backdrop-blur-sm p-4 rocket-card rounded-xl">
        <div className="flex justify-between items-center max-w-7xl mx-auto">
          {/* Logo Section */}
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-extrabold text-lg shadow-lg">
              LVL<br />UP
            </div>
            <div>
              <h1 className="text-2xl font-extrabold moon-text">LvlUp Trading</h1>
              <p className="text-xs text-gray-400">Trading-Performance optimieren</p>
            </div>
          </div>

          {/* Navigation & Actions */}
          <div className="flex gap-3 items-center">
            {/* Main Navigation - Desktop */}
            <div className="hidden md:flex gap-2 mr-2">
              <Link href="/">
                <Button variant="ghost" className="text-sm py-2 px-3 flex items-center hover:bg-primary/10 hover:text-primary">
                  <Activity className="h-4 w-4 mr-2" />
                  Dashboard
                </Button>
              </Link>
              
              {/* Navigation Links - Direct Links statt Dropdown */}
              <div className="flex space-x-1">
                <Button 
                  variant="ghost" 
                  className="text-sm py-2 px-3 flex items-center hover:bg-primary/10 hover:text-primary"
                  onClick={() => {
                    const tab = document.querySelector('[value="ai-analysis"]') as HTMLElement;
                    if (tab) tab.click();
                  }}
                >
                  <Brain className="h-4 w-4 mr-2" />
                  KI-Analyse
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-sm py-2 px-3 flex items-center hover:bg-primary/10 hover:text-primary"
                  onClick={() => {
                    const tab = document.querySelector('[value="risk"]') as HTMLElement;
                    if (tab) tab.click();
                  }}
                >
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Risiko
                </Button>
                <Button 
                  variant="ghost" 
                  className="text-sm py-2 px-3 flex items-center hover:bg-primary/10 hover:text-primary"
                  onClick={() => {
                    const tab = document.querySelector('[value="market-phases"]') as HTMLElement;
                    if (tab) tab.click();
                  }}
                >
                  <Activity className="h-4 w-4 mr-2" />
                  Phasen
                </Button>
              </div>
            </div>
            
            {/* Action Buttons */}
            <Button 
              onClick={() => {
                const importTab = document.querySelector('[value="import"]') as HTMLElement;
                if (importTab) importTab.click();
              }} 
              className="flex items-center gap-2 pulse-btn bg-gradient-to-r from-primary to-primary/80"
            >
              <FileUp className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">CSV Import</span>
            </Button>
            
            <Button variant="outline" size="icon" className="border-primary/40 hover:border-primary/80">
              <Settings className="h-4 w-4" />
            </Button>
            
            {/* Mobile menu button - would expand to show full menu on mobile */}
            <Button variant="ghost" size="icon" className="md:hidden">
              <svg width="15" height="15" viewBox="0 0 15 15" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-5 w-5">
                <path d="M1.5 3C1.22386 3 1 3.22386 1 3.5C1 3.77614 1.22386 4 1.5 4H13.5C13.7761 4 14 3.77614 14 3.5C14 3.22386 13.7761 3 13.5 3H1.5ZM1 7.5C1 7.22386 1.22386 7 1.5 7H13.5C13.7761 7 14 7.22386 14 7.5C14 7.77614 13.7761 8 13.5 8H1.5C1.22386 8 1 7.77614 1 7.5ZM1 11.5C1 11.2239 1.22386 11 1.5 11H13.5C13.7761 11 14 11.2239 14 11.5C14 11.7761 13.7761 12 13.5 12H1.5C1.22386 12 1 11.7761 1 11.5Z" fill="currentColor" fillRule="evenodd" clipRule="evenodd"></path>
              </svg>
            </Button>
          </div>
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
                    <TradeDetail trade={selectedTrade} />
                  </TabsContent>
                  
                  <TabsContent value="import" className="mt-0">
                    <TradeImport userId={userId} onImport={refetchTrades} />
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
                <AdvancedTradeAnalysis userId={userId} />
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