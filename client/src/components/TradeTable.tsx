import { useState, useEffect, useRef } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import AccountBalanceProgressNew from "@/components/AccountBalanceProgressNew";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  Trade, 
  accountTypes, 
  sessionTypes, 
  simpleTrendTypes,
  structureTypes,
  timeframeTypes,
  liquidationTypes,
  unmitZoneTypes,
  marketPhaseTypes,
  slTypes,
  rrValues,
  setupTypes
} from "@shared/schema";
import { formatDate, formatTime, getTodayDates, getWeekDates, getLastMonthDates } from "@/lib/utils";
import { BadgeWinLoss } from "@/components/ui/badge-win-loss";
import { BadgeTrend } from "@/components/ui/badge-trend";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Filter, 
  CalendarDays, 
  Wallet, 
  BarChart4, 
  LineChart, 
  TrendingUp, 
  ArrowUpDown, 
  Award,
  Target,
  DollarSign,
  Clock,
  Plus,
  X,
  Shield,
  CircleDot,
  PlusCircle,
  FilePlus,
  ListPlus,
  LayoutDashboard,
  Trash2
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface TradeTableProps {
  trades: Trade[];
  isLoading: boolean;
  onTradeSelect: (trade: Trade) => void;
  onFilteredTradesChange?: (filteredTrades: Trade[]) => void;
  onActiveFiltersChange?: (activeFilters: any) => void; // Hinzugefügt für Heatmap-Kommunikation
}

export default function TradeTable({ trades = [], isLoading, onTradeSelect, onFilteredTradesChange, onActiveFiltersChange }: TradeTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 20;
  const [tradeToDelete, setTradeToDelete] = useState<Trade | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  
  // Mutation für das Löschen eines Trades
  const deleteTradeMutation = useMutation({
    mutationFn: async (tradeId: number) => {
      await apiRequest('DELETE', `/api/trades/${tradeId}`);
    },
    onSuccess: () => {
      toast({
        title: "Trade gelöscht",
        description: "Der Trade wurde erfolgreich gelöscht.",
        variant: "default",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      setDeleteDialogOpen(false);
      setTradeToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Löschen",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Filter state
  const [filters, setFilters] = useState({
    symbols: new Set<string>(),
    setups: new Set<string>(),
    mainTrends: new Set<string>(),
    internalTrends: new Set<string>(),
    entryTypes: new Set<string>(),
    accountTypes: new Set<string>(),
    sessions: new Set<string>(),  // Filter für Sessions
    rrRanges: new Set<string>(),  // Filter für Risk/Reward-Ranges
    plRanges: new Set<string>(),  // Filter für Profit/Loss-Ranges
    isWin: null as boolean | null,
    // Neue Filter
    trends: new Set<string>(),
    internalTrendsNew: new Set<string>(),
    microTrends: new Set<string>(),
    structures: new Set<string>(),
    timeframeEntries: new Set<string>(),
    liquidations: new Set<string>(),
    locations: new Set<string>(),
    unmitZones: new Set<string>(),
    marketPhases: new Set<string>(),
    // SL Filter
    slTypes: new Set<string>(),
    slPointsRanges: new Set<string>(),
    // Risiko Summe Filter
    riskSumRanges: new Set<string>(),
    // Standarddatum auf einen weiten Bereich setzen, damit alle Trades angezeigt werden
    startDate: new Date('2020-01-01'),
    endDate: new Date('2030-12-31')
  });
  
  // Berechne den Gesamt-Profit/Loss
  const calculateTotalPL = (trades: Trade[]): number => {
    return trades.reduce((total, trade) => {
      // Prüfen, ob profitLoss ein Wert ist
      if (trade.profitLoss !== undefined && trade.profitLoss !== null) {
        return total + Number(trade.profitLoss);
      }
      return total;
    }, 0);
  };
  
  // Berechne den durchschnittlichen Risk/Reward-Wert
  const calculateAverageRR = (trades: Trade[]): number => {
    if (trades.length === 0) return 0;
    
    const totalRR = trades.reduce((sum, trade) => {
      // Prüfen, ob rrAchieved ein Wert ist
      if (trade.rrAchieved !== undefined && trade.rrAchieved !== null) {
        return sum + Number(trade.rrAchieved);
      }
      return sum;
    }, 0);
    
    return totalRR / trades.length;
  };
  
  // Unique values for filters
  const uniqueValues = {
    symbols: Array.from(new Set(trades.map(t => t.symbol).filter(Boolean))) as string[],
    setups: Array.from(new Set(trades.map(t => t.setup).filter(Boolean))) as string[],
    mainTrends: Array.from(new Set(trades.map(t => t.mainTrendM15).filter(Boolean))) as string[],
    internalTrends: Array.from(new Set(trades.map(t => t.internalTrendM5).filter(Boolean))) as string[],
    entryTypes: Array.from(new Set(trades.map(t => t.entryType).filter(Boolean))) as string[],
    sessions: Array.from(new Set(trades.map(t => t.session).filter(Boolean))) as string[],
    // Neue Filteroptionen
    trends: Array.from(new Set(trades.map(t => t.trend).filter(Boolean))) as string[],
    internalTrendsNew: Array.from(new Set(trades.map(t => t.internalTrend).filter(Boolean))) as string[],
    microTrends: Array.from(new Set(trades.map(t => t.microTrend).filter(Boolean))) as string[],
    structures: Array.from(new Set(trades.map(t => t.structure).filter(Boolean))) as string[],
    timeframeEntries: Array.from(new Set(trades.map(t => t.timeframeEntry).filter(Boolean))) as string[],
    liquidations: Array.from(new Set(trades.map(t => t.liquidation).filter(Boolean))) as string[],
    locations: Array.from(new Set(trades.map(t => t.location).filter(Boolean))) as string[],
    unmitZones: Array.from(new Set(trades.map(t => t.unmitZone).filter(Boolean))) as string[],
    marketPhases: Array.from(new Set(trades.map(t => t.marketPhase).filter(Boolean))) as string[],
    // SL-Werte
    slTypes: Array.from(new Set(trades.map(t => t.slType).filter(Boolean))) as string[]
  };
  
  // Apply filters and notify parent component of changes when filtered trades change
  const filteredTrades = trades.filter(trade => {
    // Symbol filter
    if (filters.symbols.size > 0 && trade.symbol && !filters.symbols.has(trade.symbol)) {
      return false;
    }
    
    // Setup filter
    if (filters.setups.size > 0 && trade.setup && !filters.setups.has(trade.setup)) {
      return false;
    }
    
    // Main trend filter
    if (filters.mainTrends.size > 0 && trade.mainTrendM15 && !filters.mainTrends.has(trade.mainTrendM15)) {
      return false;
    }
    
    // Internal trend filter
    if (filters.internalTrends.size > 0 && trade.internalTrendM5 && !filters.internalTrends.has(trade.internalTrendM5)) {
      return false;
    }
    
    // Neue Filter
    // Trend filter
    if (filters.trends.size > 0 && trade.trend && !filters.trends.has(trade.trend)) {
      return false;
    }
    
    // Internal trend neue Filter
    if (filters.internalTrendsNew.size > 0 && trade.internalTrend && !filters.internalTrendsNew.has(trade.internalTrend)) {
      return false;
    }
    
    // Micro trend filter
    if (filters.microTrends.size > 0 && trade.microTrend && !filters.microTrends.has(trade.microTrend)) {
      return false;
    }
    
    // Structure filter
    if (filters.structures.size > 0 && trade.structure && !filters.structures.has(trade.structure)) {
      return false;
    }
    
    // Timeframe Entry filter
    if (filters.timeframeEntries.size > 0 && trade.timeframeEntry && !filters.timeframeEntries.has(trade.timeframeEntry)) {
      return false;
    }
    
    // Location filter
    if (filters.locations.size > 0 && trade.location && !filters.locations.has(trade.location)) {
      return false;
    }
    
    // Liquidation filter
    if (filters.liquidations.size > 0 && trade.liquidation && !filters.liquidations.has(trade.liquidation)) {
      return false;
    }
    
    // Unmittelbare Zone filter
    if (filters.unmitZones.size > 0 && trade.unmitZone && !filters.unmitZones.has(trade.unmitZone)) {
      return false;
    }
    
    // Marktphase filter
    if (filters.marketPhases.size > 0 && trade.marketPhase && !filters.marketPhases.has(trade.marketPhase)) {
      return false;
    }
    
    // SL Type filter
    if (filters.slTypes.size > 0 && trade.slType && !filters.slTypes.has(trade.slType)) {
      return false;
    }
    
    // SL Points filter
    if (filters.slPointsRanges.size > 0 && trade.slPoints !== undefined) {
      const points = Number(trade.slPoints);
      let matchesAnyRange = false;
      
      if (filters.slPointsRanges.has('1-10') && points >= 1 && points <= 10) {
        matchesAnyRange = true;
      } else if (filters.slPointsRanges.has('11-20') && points >= 11 && points <= 20) {
        matchesAnyRange = true;
      } else if (filters.slPointsRanges.has('21-30') && points >= 21 && points <= 30) {
        matchesAnyRange = true;
      }
      
      if (!matchesAnyRange) {
        return false;
      }
    }
    
    // Entry type filter
    if (filters.entryTypes.size > 0 && trade.entryType && !filters.entryTypes.has(trade.entryType)) {
      return false;
    }
    
    // Account type filter
    if (filters.accountTypes.size > 0 && trade.accountType && !filters.accountTypes.has(trade.accountType)) {
      return false;
    }
    
    // Session filter
    if (filters.sessions.size > 0 && trade.session && !filters.sessions.has(trade.session)) {
      return false;
    }
    
    // Win/Loss filter
    if (filters.isWin !== null && trade.isWin !== filters.isWin) {
      return false;
    }
    
    // RR range filter
    if (filters.rrRanges.size > 0 && trade.rrAchieved !== undefined) {
      const rr = Number(trade.rrAchieved);
      let matchesAnyRange = false;
      
      if (filters.rrRanges.has('< 1') && rr < 1) {
        matchesAnyRange = true;
      } else if (filters.rrRanges.has('1-2') && rr >= 1 && rr < 2) {
        matchesAnyRange = true;
      } else if (filters.rrRanges.has('2-3') && rr >= 2 && rr < 3) {
        matchesAnyRange = true;
      } else if (filters.rrRanges.has('3+') && rr >= 3) {
        matchesAnyRange = true;
      }
      
      if (!matchesAnyRange) {
        return false;
      }
    }
    
    // P/L range filter
    if (filters.plRanges.size > 0 && trade.profitLoss !== undefined) {
      const pl = Number(trade.profitLoss);
      let matchesAnyRange = false;
      
      if (filters.plRanges.has('< -1000') && pl < -1000) {
        matchesAnyRange = true;
      } else if (filters.plRanges.has('-1000 to -500') && pl >= -1000 && pl < -500) {
        matchesAnyRange = true;
      } else if (filters.plRanges.has('-500 to 0') && pl >= -500 && pl < 0) {
        matchesAnyRange = true;
      } else if (filters.plRanges.has('0 to 500') && pl >= 0 && pl < 500) {
        matchesAnyRange = true;
      } else if (filters.plRanges.has('500 to 1000') && pl >= 500 && pl < 1000) {
        matchesAnyRange = true;
      } else if (filters.plRanges.has('> 1000') && pl >= 1000) {
        matchesAnyRange = true;
      }
      
      if (!matchesAnyRange) {
        return false;
      }
    }
    
    // Risiko Summe range filter
    if (filters.riskSumRanges.size > 0 && trade.riskSum !== undefined) {
      const riskSum = Number(trade.riskSum);
      let matchesAnyRange = false;
      
      if (filters.riskSumRanges.has('0-100') && riskSum >= 0 && riskSum <= 100) {
        matchesAnyRange = true;
      } else if (filters.riskSumRanges.has('100-200') && riskSum > 100 && riskSum <= 200) {
        matchesAnyRange = true;
      } else if (filters.riskSumRanges.has('200-300') && riskSum > 200 && riskSum <= 300) {
        matchesAnyRange = true;
      } else if (filters.riskSumRanges.has('>300') && riskSum > 300) {
        matchesAnyRange = true;
      }
      
      if (!matchesAnyRange) {
        return false;
      }
    }
    
    // Date range filter
    if (trade.date) {
      // Erstelle eine neue Date aus dem Trade-Datum
      let tradeDate: Date;
      
      // Prüfe, ob das Datum bereits ein Date-Objekt ist oder ein String
      if (typeof trade.date === 'string') {
        const dateString = trade.date;
        // Überprüfe, ob das Format MM/DD/YYYY ist (wie in 04/29/2025)
        if (dateString && /^\d{2}\/\d{2}\/\d{4}/.test(dateString)) {
          // Das Datum ist im Format MM/DD/YYYY
          // Zerteile es um das Datum zu extrahieren
          const parts = dateString.split(' ');
          const datePart = parts[0];
          const [month, day, year] = datePart.split('/');
          
          // Monat ist 0-basiert in JavaScript Date (Januar = 0)
          const monthIndex = parseInt(month, 10) - 1;
          const dayNum = parseInt(day, 10);
          const yearNum = parseInt(year, 10);
          
          tradeDate = new Date(yearNum, monthIndex, dayNum);
          
          // Wenn es eine Uhrzeit gibt, setze diese auch
          if (parts.length > 1) {
            const timePart = parts[1];
            const [hours, minutes, seconds] = (timePart || '').split(':').map(p => parseInt(p || '0', 10));
            tradeDate.setHours(hours || 0, minutes || 0, seconds || 0);
          }
        } else {
          // Versuche normale Konvertierung
          tradeDate = new Date(dateString);
        }
      } else {
        tradeDate = new Date(trade.date);
      }
      
      // Set time to midnight for pure date comparison
      const startDate = new Date(filters.startDate);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(filters.endDate);
      endDate.setHours(23, 59, 59, 999);
      
      if (tradeDate < startDate || tradeDate > endDate) {
        return false;
      }
    }
    
    return true;
  });
  
  // Benachrichtige übergeordnete Komponente über Änderungen an gefilterten Trades
  // Verwende useEffect mit einer Zustandsprüfung, um Endlosschleifen zu vermeiden
  const prevFilteredTradesRef = useRef<Trade[]>([]);
  
  useEffect(() => {
    // Nur benachrichtigen, wenn sich die Trades wirklich geändert haben (nicht bei jedem Render)
    if (onFilteredTradesChange && 
        (prevFilteredTradesRef.current.length !== filteredTrades.length || 
         JSON.stringify(prevFilteredTradesRef.current) !== JSON.stringify(filteredTrades))) {
      
      prevFilteredTradesRef.current = [...filteredTrades];
      onFilteredTradesChange(filteredTrades);
    }
  }, [filteredTrades, onFilteredTradesChange]);
  
  // Benachrichtige übergeordnete Komponente über Änderungen an den Filtern
  useEffect(() => {
    // Nur benachrichtigen, wenn der Handler existiert
    if (onActiveFiltersChange) {
      // Set-Objekte in Arrays umwandeln, damit sie über HTTP übertragen werden können
      const serializableFilters = {
        ...filters,
        symbols: Array.from(filters.symbols),
        setups: Array.from(filters.setups),
        mainTrends: Array.from(filters.mainTrends),
        internalTrends: Array.from(filters.internalTrends),
        entryTypes: Array.from(filters.entryTypes),
        accountTypes: Array.from(filters.accountTypes),
        sessions: Array.from(filters.sessions),
        rrRanges: Array.from(filters.rrRanges),
        plRanges: Array.from(filters.plRanges),
        riskSumRanges: Array.from(filters.riskSumRanges), // Neue Filter für Risiko Summe
        trends: Array.from(filters.trends),
        internalTrendsNew: Array.from(filters.internalTrendsNew),
        microTrends: Array.from(filters.microTrends),
        structures: Array.from(filters.structures),
        timeframeEntries: Array.from(filters.timeframeEntries),
        liquidations: Array.from(filters.liquidations),
        locations: Array.from(filters.locations),
        unmitZones: Array.from(filters.unmitZones),
        marketPhases: Array.from(filters.marketPhases),
        slTypes: Array.from(filters.slTypes),
        slPointsRanges: Array.from(filters.slPointsRanges),
        startDate: filters.startDate.toISOString(),
        endDate: filters.endDate.toISOString(),
        isWin: filters.isWin
      };
      onActiveFiltersChange(serializableFilters);
    }
  }, [filters, onActiveFiltersChange]);

  // Calculate pagination for filtered trades
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);
  
  // Pagination change handler
  const paginate = (pageNumber: number) => {
    if (pageNumber > 0 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };
  
  // Toggle filter for a set-based filter (symbols, setups, etc.)
  const toggleFilter = (filterType: string, value: string) => {
    // Create a new Set from the current filter values
    const filterSet = new Set(filters[filterType as keyof typeof filters] as Set<string>);
    
    // Toggle the value: if it exists, remove it; otherwise, add it
    if (filterSet.has(value)) {
      filterSet.delete(value);
    } else {
      filterSet.add(value);
    }
    
    // Update the filters state with the new Set
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      // Reset pagination when filters change
      setCurrentPage(1);
      
      // @ts-ignore - This is fine because we know the type
      newFilters[filterType] = filterSet;
      return newFilters;
    });
  };
  
  // Set filter for a non-set-based filter (isWin, dates)
  const setFilter = (filterType: string, value: any) => {
    setFilters(prevFilters => {
      const newFilters = { ...prevFilters };
      // Reset pagination when filters change
      setCurrentPage(1);
      
      // @ts-ignore - This is fine because we know the type
      newFilters[filterType] = value;
      return newFilters;
    });
  };
  
  // Clear all filters
  const resetFilters = () => {
    setFilters({
      symbols: new Set<string>(),
      setups: new Set<string>(),
      mainTrends: new Set<string>(),
      internalTrends: new Set<string>(),
      entryTypes: new Set<string>(),
      accountTypes: new Set<string>(),
      sessions: new Set<string>(),
      rrRanges: new Set<string>(),
      plRanges: new Set<string>(),
      isWin: null,
      
      // Neue Filter
      trends: new Set<string>(),
      internalTrendsNew: new Set<string>(),
      microTrends: new Set<string>(),
      structures: new Set<string>(),
      timeframeEntries: new Set<string>(),
      liquidations: new Set<string>(),
      locations: new Set<string>(),
      unmitZones: new Set<string>(),
      marketPhases: new Set<string>(),
      // SL Filter
      slTypes: new Set<string>(),
      slPointsRanges: new Set<string>(),
      
      // Risiko Summe Filter
      riskSumRanges: new Set<string>(),
      
      // Reset dates to show all trades
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31')
    });
    
    // Reset to first page
    setCurrentPage(1);
  };
  
  // Check if any filters are active
  const areFiltersActive = () => {
    return (
      filters.symbols.size > 0 ||
      filters.setups.size > 0 ||
      filters.mainTrends.size > 0 ||
      filters.internalTrends.size > 0 ||
      filters.entryTypes.size > 0 ||
      filters.accountTypes.size > 0 ||
      filters.sessions.size > 0 ||
      filters.rrRanges.size > 0 ||
      filters.plRanges.size > 0 ||
      filters.isWin !== null ||
      filters.trends.size > 0 ||
      filters.internalTrendsNew.size > 0 ||
      filters.microTrends.size > 0 ||
      filters.structures.size > 0 ||
      filters.timeframeEntries.size > 0 ||
      filters.liquidations.size > 0 ||
      filters.locations.size > 0 ||
      filters.unmitZones.size > 0 ||
      filters.marketPhases.size > 0 ||
      filters.slTypes.size > 0 ||
      filters.slPointsRanges.size > 0 ||
      filters.riskSumRanges.size > 0 ||
      // Check if date filter is different from the default
      filters.startDate.getTime() !== new Date('2020-01-01').getTime() ||
      filters.endDate.getTime() !== new Date('2030-12-31').getTime()
    );
  };
  
  // Pre-defined date ranges for quick filtering
  const setDateRange = (range: string) => {
    let { startDate, endDate } = filters;
    
    if (range === 'today') {
      const todayDates = getTodayDates();
      startDate = todayDates.startDate;
      endDate = todayDates.endDate;
    } else if (range === 'this-week') {
      const weekDates = getWeekDates();
      startDate = weekDates.startDate;
      endDate = weekDates.endDate;
    } else if (range === 'this-month') {
      const monthDates = getLastMonthDates();
      startDate = monthDates.startDate;
      endDate = monthDates.endDate;
    } else if (range === 'all-time') {
      startDate = new Date('2020-01-01');
      endDate = new Date('2030-12-31');
    }
    
    setFilters(prevFilters => ({ ...prevFilters, startDate, endDate }));
    setCurrentPage(1);
  };
  
  // Format count for display in filter chips
  const formatCount = (count: number): string => {
    if (count > 999) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };
  
  // Calculate the win rate from the filtered trades
  const calculateWinRate = (trades: Trade[]): number => {
    if (trades.length === 0) return 0;
    
    const winningTrades = trades.filter(trade => trade.isWin).length;
    return (winningTrades / trades.length) * 100;
  };
  
  // Handle Trade Deletion
  const handleDeleteClick = (trade: Trade, e: React.MouseEvent) => {
    e.stopPropagation();
    setTradeToDelete(trade);
    setDeleteDialogOpen(true);
  };
  
  return (
    <div>
      <Card className="rounded-md shadow-md bg-gradient-to-b from-black/70 via-blue-950/30 to-black/70 text-white overflow-visible">
        {/* Card header with filter section */}
        <CardHeader className="p-4 border-b border-border">
          <div className="flex flex-col space-y-4">
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg font-semibold">
                Trading Journal
              </CardTitle>
              
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDateRange('today')}
                  className={`text-xs ${filters.startDate.getTime() === getTodayDates().startDate.getTime() ? 'bg-primary/20' : ''}`}
                >
                  <CalendarDays className="w-3 h-3 mr-1" />
                  Heute
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDateRange('this-week')}
                  className={`text-xs ${filters.startDate.getTime() === getWeekDates().startDate.getTime() ? 'bg-primary/20' : ''}`}
                >
                  <CalendarDays className="w-3 h-3 mr-1" />
                  Woche
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setDateRange('this-month')}
                  className={`text-xs ${filters.startDate.getTime() === getLastMonthDates().startDate.getTime() ? 'bg-primary/20' : ''}`}
                >
                  <CalendarDays className="w-3 h-3 mr-1" />
                  Monat
                </Button>
                
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="text-xs">
                      <Filter className="w-3 h-3 mr-1" />
                      Filter
                      {areFiltersActive() && <span className="ml-1 text-xs px-1.5 py-0.5 rounded-full bg-primary/80">!</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-96 max-h-[500px] overflow-y-auto p-4" align="end">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <h3 className="font-semibold">Filter</h3>
                        {areFiltersActive() && (
                          <Button variant="ghost" size="sm" onClick={resetFilters} className="h-7 text-xs px-2">
                            <X className="h-3 w-3 mr-1" />
                            Zurücksetzen
                          </Button>
                        )}
                      </div>
                      
                      {/* Symbol Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Symbol</h4>
                        <div className="flex flex-wrap gap-1">
                          {uniqueValues.symbols.map(symbol => (
                            <Button
                              key={symbol}
                              variant={filters.symbols.has(symbol) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('symbols', symbol)}
                            >
                              {symbol}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Setup Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Setup</h4>
                        <div className="flex flex-wrap gap-1">
                          {setupTypes.map(setup => (
                            <Button
                              key={setup}
                              variant={filters.setups.has(setup) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('setups', setup)}
                            >
                              {setup}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Account Type Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Account</h4>
                        <div className="flex flex-wrap gap-1">
                          {accountTypes.map(accountType => (
                            <Button
                              key={accountType}
                              variant={filters.accountTypes.has(accountType) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('accountTypes', accountType)}
                            >
                              {accountType}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Session Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Session</h4>
                        <div className="flex flex-wrap gap-1">
                          {sessionTypes.map(session => (
                            <Button
                              key={session}
                              variant={filters.sessions.has(session) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('sessions', session)}
                            >
                              {session}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Entry Type Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Entry Type</h4>
                        <div className="flex flex-wrap gap-1">
                          {simpleTrendTypes.map(entryType => (
                            <Button
                              key={entryType}
                              variant={filters.entryTypes.has(entryType) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('entryTypes', entryType)}
                            >
                              {entryType}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Win/Loss Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Ergebnis</h4>
                        <div className="flex gap-1">
                          <Button
                            variant={filters.isWin === true ? "default" : "outline"}
                            className={`h-6 px-2 text-xs ${filters.isWin === true ? 'bg-green-500 hover:bg-green-600' : ''}`}
                            onClick={() => setFilter('isWin', filters.isWin === true ? null : true)}
                          >
                            Win
                          </Button>
                          <Button
                            variant={filters.isWin === false ? "default" : "outline"}
                            className={`h-6 px-2 text-xs ${filters.isWin === false ? 'bg-red-500 hover:bg-red-600' : ''}`}
                            onClick={() => setFilter('isWin', filters.isWin === false ? null : false)}
                          >
                            Loss
                          </Button>
                        </div>
                      </div>
                      
                      {/* Risk/Reward Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">R:R Ratio</h4>
                        <div className="flex flex-wrap gap-1">
                          {['< 1', '1-2', '2-3', '3+'].map(range => (
                            <Button
                              key={range}
                              variant={filters.rrRanges.has(range) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('rrRanges', range)}
                            >
                              {range}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Profit/Loss Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Profit/Loss ($)</h4>
                        <div className="flex flex-wrap gap-1">
                          {['< -1000', '-1000 to -500', '-500 to 0', '0 to 500', '500 to 1000', '> 1000'].map(range => (
                            <Button
                              key={range}
                              variant={filters.plRanges.has(range) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('plRanges', range)}
                            >
                              {range}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Risk Sum Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Risiko Summe ($)</h4>
                        <div className="flex flex-wrap gap-1">
                          {['0-100', '100-200', '200-300', '>300'].map(range => (
                            <Button
                              key={range}
                              variant={filters.riskSumRanges.has(range) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('riskSumRanges', range)}
                            >
                              {range}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Trend Filters */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Trends</h4>
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-xs text-muted-foreground w-full">Haupttrend</span>
                          {simpleTrendTypes.map(trend => (
                            <Button
                              key={`trend-${trend}`}
                              variant={filters.trends.has(trend) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('trends', trend)}
                            >
                              {trend}
                            </Button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1 mb-1">
                          <span className="text-xs text-muted-foreground w-full">Interner Trend</span>
                          {simpleTrendTypes.map(trend => (
                            <Button
                              key={`internal-${trend}`}
                              variant={filters.internalTrendsNew.has(trend) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('internalTrendsNew', trend)}
                            >
                              {trend}
                            </Button>
                          ))}
                        </div>
                        <div className="flex flex-wrap gap-1">
                          <span className="text-xs text-muted-foreground w-full">Mikrotrend</span>
                          {simpleTrendTypes.map(trend => (
                            <Button
                              key={`micro-${trend}`}
                              variant={filters.microTrends.has(trend) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('microTrends', trend)}
                            >
                              {trend}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Structure Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Struktur</h4>
                        <div className="flex flex-wrap gap-1">
                          {structureTypes.map(structure => (
                            <Button
                              key={structure}
                              variant={filters.structures.has(structure) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('structures', structure)}
                            >
                              {structure}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Timeframe Entry Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Timeframe Entry</h4>
                        <div className="flex flex-wrap gap-1">
                          {timeframeTypes.map(timeframe => (
                            <Button
                              key={timeframe}
                              variant={filters.timeframeEntries.has(timeframe) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('timeframeEntries', timeframe)}
                            >
                              {timeframe}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Location Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Location</h4>
                        <div className="flex flex-wrap gap-1">
                          {['Normal', 'With Trend', 'Counter Trend', 'Block Deviation'].map(location => (
                            <Button
                              key={location}
                              variant={filters.locations.has(location) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('locations', location)}
                            >
                              {location}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Liquidation Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Liquidation</h4>
                        <div className="flex flex-wrap gap-1">
                          {liquidationTypes.map(liquidation => (
                            <Button
                              key={liquidation}
                              variant={filters.liquidations.has(liquidation) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('liquidations', liquidation)}
                            >
                              {liquidation}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Unmittelbare Zone Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Unmittelbare Zone</h4>
                        <div className="flex flex-wrap gap-1">
                          {unmitZoneTypes.map(zone => (
                            <Button
                              key={zone}
                              variant={filters.unmitZones.has(zone) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('unmitZones', zone)}
                            >
                              {zone}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* Market Phase Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">Marktphase</h4>
                        <div className="flex flex-wrap gap-1">
                          {marketPhaseTypes.map(phase => (
                            <Button
                              key={phase}
                              variant={filters.marketPhases.has(phase) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('marketPhases', phase)}
                            >
                              {phase}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* SL Type Filter */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">SL Typ</h4>
                        <div className="flex flex-wrap gap-1">
                          {slTypes.map(type => (
                            <Button
                              key={type}
                              variant={filters.slTypes.has(type) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('slTypes', type)}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      </div>
                      
                      {/* SL Points Ranges */}
                      <div>
                        <h4 className="text-sm font-semibold mb-1">SL Punkte</h4>
                        <div className="flex flex-wrap gap-1">
                          {['1-10', '11-20', '21-30'].map(range => (
                            <Button
                              key={range}
                              variant={filters.slPointsRanges.has(range) ? "default" : "outline"}
                              className="h-6 px-2 text-xs"
                              onClick={() => toggleFilter('slPointsRanges', range)}
                            >
                              {range}
                            </Button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
                
                {areFiltersActive() && (
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={resetFilters}
                    className="text-xs"
                  >
                    <X className="w-3 h-3 mr-1" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
            
            {/* Active filters display */}
            {areFiltersActive() && (
              <div className="flex flex-wrap gap-1 mt-2">
                {[
                  { key: 'symbols', label: 'Symbol' },
                  { key: 'setups', label: 'Setup' },
                  { key: 'accountTypes', label: 'Account' },
                  { key: 'sessions', label: 'Session' },
                  { key: 'trends', label: 'Trend' },
                  { key: 'internalTrendsNew', label: 'Internal Trend' },
                  { key: 'microTrends', label: 'Micro Trend' },
                  { key: 'entryTypes', label: 'Entry Type' },
                  { key: 'structures', label: 'Structure' },
                  { key: 'timeframeEntries', label: 'Timeframe' },
                  { key: 'locations', label: 'Location' },
                  { key: 'liquidations', label: 'Liquidation' },
                  { key: 'unmitZones', label: 'Zone' },
                  { key: 'marketPhases', label: 'Market Phase' },
                  { key: 'slTypes', label: 'SL Type' },
                  { key: 'slPointsRanges', label: 'SL Points' },
                  { key: 'rrRanges', label: 'R:R' },
                  { key: 'plRanges', label: 'P/L' },
                  { key: 'riskSumRanges', label: 'Risk' }
                ].map(({ key, label }) => {
                  const filterSet = filters[key as keyof typeof filters] as Set<string>;
                  if (filterSet.size > 0) {
                    return (
                      <div key={key} className="flex items-center">
                        <span className="text-xs px-2 py-1 rounded-l-md bg-gray-800 text-white">
                          {label}
                        </span>
                        <span className="text-xs px-2 py-1 rounded-r-md bg-primary/20 text-white">
                          {filterSet.size === 1 ? Array.from(filterSet)[0] : `${formatCount(filterSet.size)} selected`}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })}
                
                {/* Win/Loss filter chip */}
                {filters.isWin !== null && (
                  <div className="flex items-center">
                    <span className="text-xs px-2 py-1 rounded-l-md bg-gray-800 text-white">
                      Result
                    </span>
                    <span className={`text-xs px-2 py-1 rounded-r-md ${filters.isWin ? 'bg-green-500/20' : 'bg-red-500/20'} text-white`}>
                      {filters.isWin ? 'Win' : 'Loss'}
                    </span>
                  </div>
                )}
                
                {/* Date range filter chip */}
                {(filters.startDate.getTime() !== new Date('2020-01-01').getTime() ||
                  filters.endDate.getTime() !== new Date('2030-12-31').getTime()) && (
                  <div className="flex items-center">
                    <span className="text-xs px-2 py-1 rounded-l-md bg-gray-800 text-white">
                      Date
                    </span>
                    <span className="text-xs px-2 py-1 rounded-r-md bg-primary/20 text-white">
                      {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardHeader>
        
        {/* Statistics Section */}
        <div className="grid grid-cols-6 gap-4 p-4 border-b border-border">
          <div className="flex flex-col items-center justify-center bg-black/20 p-2.5 rounded-md">
            <span className="text-xs text-muted-foreground">Trades</span>
            <span className="text-xl font-semibold">{filteredTrades.length}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-black/20 p-2.5 rounded-md">
            <span className="text-xs text-muted-foreground">Win Rate</span>
            <span className="text-xl font-semibold">{calculateWinRate(filteredTrades).toFixed(1)}%</span>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-black/20 p-2.5 rounded-md">
            <span className="text-xs text-muted-foreground">Avg R:R</span>
            <span className="text-xl font-semibold">{calculateAverageRR(filteredTrades).toFixed(2)}</span>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-black/20 p-2.5 rounded-md">
            <span className="text-xs text-muted-foreground">Profit/Loss</span>
            <span className={`text-xl font-semibold ${calculateTotalPL(filteredTrades) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${calculateTotalPL(filteredTrades).toFixed(2)}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-black/20 p-2.5 rounded-md">
            <span className="text-xs text-muted-foreground">Avg P/L</span>
            <span className={`text-xl font-semibold ${filteredTrades.length > 0 && calculateTotalPL(filteredTrades) / filteredTrades.length >= 0 ? 'text-green-500' : 'text-red-500'}`}>
              ${filteredTrades.length > 0 ? (calculateTotalPL(filteredTrades) / filteredTrades.length).toFixed(2) : '0.00'}
            </span>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-black/20 p-2.5 rounded-md">
            <span className="text-xs text-muted-foreground">Setups</span>
            <span className="text-xl font-semibold">
              {new Set(filteredTrades.map(t => t.setup).filter(Boolean)).size}
            </span>
          </div>
        </div>
        
        {/* Trade Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-black/30">
              <tr className="text-xs">
                <th className="p-3 text-left">Datum</th>
                <th className="p-3 text-left">Account</th>
                <th className="p-3 text-left">Session</th>
                <th className="p-3 text-left">Symbol</th>
                <th className="p-3 text-left">Setup</th>
                <th className="p-3 text-left">Trend</th>
                <th className="p-3 text-left">Intern</th>
                <th className="p-3 text-left">Mikro</th>
                <th className="p-3 text-left">Struct</th>
                <th className="p-3 text-left">TF</th>
                <th className="p-3 text-left">Location</th>
                <th className="p-3 text-left">Liquid</th>
                <th className="p-3 text-left">Zone</th>
                <th className="p-3 text-left">Range</th>
                <th className="p-3 text-left">Phase</th>
                <th className="p-3 text-left">Entry</th>
                <th className="p-3 text-left">R:R</th>
                <th className="p-3 text-left">Risiko</th>
                <th className="p-3 text-left">P/L</th>
                <th className="p-3 text-left">SL Typ</th>
                <th className="p-3 text-left">SL Punkte</th>
                <th className="p-3 text-left">Ergebnis</th>
                <th className="p-3 text-left">Aktion</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, index) => (
                  <tr key={index} className="border-b border-border opacity-50">
                    <td className="p-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-20" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                    <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                  </tr>
                ))
              ) : currentTrades.length > 0 ? (
                // Trades list
                currentTrades.map((trade) => (
                  <tr 
                    key={trade.id} 
                    className="border-b border-border hover:bg-muted/50 cursor-pointer" 
                    onClick={(e) => {
                      if (e.target instanceof HTMLElement && e.target.closest('.delete-button')) {
                        // Wenn der Klick auf den Löschbutton war, nicht den Trade öffnen
                        e.stopPropagation();
                        return;
                      }
                      onTradeSelect(trade);
                    }}
                  >
                    <td className="p-3 text-xs">
                      <div className="flex flex-col">
                        <span>{formatDate(trade.date)}</span>
                        <span className="text-[10px] text-muted-foreground">{formatTime(trade.date)}</span>
                      </div>
                    </td>
                    <td className="p-3 text-xs">{trade.accountType || '-'}</td>
                    <td className="p-3 text-xs">{trade.session || '-'}</td>
                    <td className="p-3 text-xs">{trade.symbol}</td>
                    <td className="p-3 text-xs">{trade.setup}</td>
                    <td className="p-3 text-xs">
                      {trade.trend ? <BadgeTrend trend={trade.trend} size="xs" /> : '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.internalTrend ? <BadgeTrend trend={trade.internalTrend} size="xs" /> : '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.microTrend ? <BadgeTrend trend={trade.microTrend} size="xs" /> : '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.structure || '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.timeframeEntry || '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.location || '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.liquidation || '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.unmitZone || '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.rangePoints || '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.marketPhase || '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.entryType ? <BadgeTrend trend={trade.entryType} size="xs" /> : '-'}
                    </td>
                    <td className="p-3 text-xs">{trade.rrAchieved}</td>
                    <td className="p-3 text-xs">{trade.riskSum ? `${trade.riskSum}$` : '-'}</td>
                    <td className="p-3 text-xs">
                      <span className={`${trade.profitLoss && trade.profitLoss > 0 ? 'text-green-500' : trade.profitLoss && trade.profitLoss < 0 ? 'text-red-500' : ''}`}>
                        {trade.profitLoss ? `${trade.profitLoss > 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}` : '-'}
                      </span>
                    </td>
                    <td className="p-3 text-xs">
                      {trade.slType || '-'}
                    </td>
                    <td className="p-3 text-xs">
                      {trade.slPoints || '-'}
                    </td>
                    <td className="p-3 text-xs">
                      <BadgeWinLoss isWin={trade.isWin} size="xs" />
                    </td>
                    <td className="p-3 text-xs">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-6 w-6 delete-button" 
                        onClick={(e) => handleDeleteClick(trade, e)}
                      >
                        <Trash2 className="h-3.5 w-3.5 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))
              ) : (
                // Empty state
                <tr>
                  <td colSpan={23} className="p-6 text-center text-muted-foreground">
                    Keine Trades gefunden
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        <div className="p-4 flex justify-between items-center border-t border-border">
          <div>
            <span className="text-sm text-muted-foreground">
              Zeige {indexOfFirstTrade + 1}-{Math.min(indexOfLastTrade, filteredTrades.length)} von {filteredTrades.length} Trades
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="icon"
              onClick={() => paginate(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <i className="fas fa-chevron-left"></i>
            </Button>
            
            {Array.from({ length: Math.min(totalPages, 3) }).map((_, index) => (
              <Button
                key={index}
                variant={currentPage === index + 1 ? "default" : "secondary"}
                onClick={() => paginate(index + 1)}
              >
                {index + 1}
              </Button>
            ))}
            
            <Button
              variant="secondary"
              size="icon"
              onClick={() => paginate(currentPage + 1)}
              disabled={currentPage === totalPages || totalPages === 0}
            >
              <i className="fas fa-chevron-right"></i>
            </Button>
          </div>
        </div>
      </Card>
  
    {/* Lösch-Bestätigungsdialog */}
    <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Trade löschen</AlertDialogTitle>
          <AlertDialogDescription>
            Möchten Sie diesen Trade wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.
            {tradeToDelete && (
              <div className="mt-2 p-3 bg-muted/30 rounded-md text-sm">
                <div><span className="font-semibold">Symbol:</span> {tradeToDelete.symbol}</div>
                <div><span className="font-semibold">Datum:</span> {formatDate(tradeToDelete.date)}</div>
                <div><span className="font-semibold">Ergebnis:</span> 
                  <span className={tradeToDelete.profitLoss && tradeToDelete.profitLoss > 0 ? 'text-green-500' : 
                    tradeToDelete.profitLoss && tradeToDelete.profitLoss < 0 ? 'text-red-500' : ''}>
                    {tradeToDelete.profitLoss ? `${tradeToDelete.profitLoss > 0 ? '+' : ''}${tradeToDelete.profitLoss.toFixed(2)}$` : '-'}
                  </span>
                </div>
              </div>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Abbrechen</AlertDialogCancel>
          <AlertDialogAction 
            onClick={() => {
              if (tradeToDelete) {
                deleteTradeMutation.mutate(tradeToDelete.id);
              }
            }}
            className="bg-red-500 hover:bg-red-600"
          >
            Löschen
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
  );
}