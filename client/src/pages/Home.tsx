import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import FilterBar from "@/components/FilterBar";
import TradeTable from "@/components/TradeTable";
import WeeklySummary from "@/components/WeeklySummary";
import TradeDetail from "@/components/TradeDetail";
import { synchronizeTrades } from "@/lib/tradovate";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { getWeekDates } from "@/lib/utils";
import { Trade } from "@shared/schema";

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
    <div className="container mx-auto px-4 py-6">
      {/* Header */}
      <header className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-white text-black font-bold p-1 text-xs">
            LVL<br />UP
          </div>
          <h1 className="text-xl font-bold">LvlUp Tradingtagebuch</h1>
        </div>
        <div className="flex gap-4">
          <Button onClick={handleSyncTrades} className="flex items-center gap-2">
            <i className="fas fa-sync-alt"></i> Trades synchronisieren
          </Button>
          <Button variant="outline" size="icon">
            <i className="fas fa-cog"></i>
          </Button>
        </div>
      </header>

      {/* Filter Bar */}
      <FilterBar filters={filters} onFilterChange={handleFilterChange} />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Trade Table Section */}
        <div className="lg:col-span-2">
          {/* Trade Table */}
          <TradeTable
            trades={trades}
            isLoading={tradesLoading}
            onTradeSelect={handleTradeSelect}
          />

          {/* Weekly Summary */}
          <WeeklySummary
            userId={userId}
            weekStart={filters.startDate}
            weekEnd={filters.endDate}
          />
        </div>

        {/* Side Panel */}
        <div className="lg:col-span-1">
          <TradeDetail selectedTrade={selectedTrade} />
        </div>
      </div>
    </div>
  );
}
