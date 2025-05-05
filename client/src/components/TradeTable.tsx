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
  
  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Toggle filter for a value
  const toggleFilter = (filterType: keyof typeof filters, value: string) => {
    const newFilters = { ...filters };
    const filterSet = new Set(filters[filterType] as Set<string>);
    
    if (filterSet.has(value)) {
      filterSet.delete(value);
    } else {
      filterSet.add(value);
    }
    
    // Reset to first page when applying filter
    setCurrentPage(1);
    
    // @ts-ignore - This is fine because we know the type
    newFilters[filterType] = filterSet;
    setFilters(newFilters);
  };
  
  // Toggle win/loss filter
  const toggleWinLossFilter = (value: boolean | null) => {
    setFilters(prev => ({
      ...prev,
      isWin: prev.isWin === value ? null : value
    }));
  };
  
  // Reset all filters
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
      riskSumRanges: new Set<string>(), // Risiko Summe Filter zurücksetzen
      isWin: null,
      // Neue Filter zurücksetzen
      trends: new Set<string>(),
      internalTrendsNew: new Set<string>(),
      microTrends: new Set<string>(),
      structures: new Set<string>(),
      timeframeEntries: new Set<string>(),
      liquidations: new Set<string>(),
      locations: new Set<string>(),
      unmitZones: new Set<string>(),
      marketPhases: new Set<string>(),
      // SL Filter zurücksetzen
      slTypes: new Set<string>(),
      slPointsRanges: new Set<string>(),
      // Datum zurücksetzen
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31')
    });
    setCurrentPage(1);
  };
  
  // Type für die Filter-Buttons verbessert
  const renderFilterButtons = (filterType: 'accountTypes' | 'setups' | 'mainTrends' | 'internalTrends' | 'entryTypes' | 'sessions', options: string[], label: string) => {
    return (
      <div className="mb-3">
        <div className="font-medium text-sm mb-1">{label}</div>
        <div className="flex flex-wrap gap-1">
          {options.map(option => {
            const isActive = (filters[filterType] as Set<string>).has(option);
            
            return (
              <Button
                key={option}
                variant={isActive ? "default" : "outline"}
                size="sm"
                className={`text-xs ${isActive ? 'bg-primary text-primary-foreground' : 'bg-background'}`}
                onClick={() => toggleFilter(filterType, option)}
              >
                {filterType === 'mainTrends' || filterType === 'internalTrends' 
                  ? <BadgeTrend trend={option} className="text-xs py-0 px-1" />
                  : option
                }
              </Button>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative w-full">
      <Card className="bg-black/40 backdrop-blur-sm border-primary/10 shadow-xl h-[70vh]">
        <CardHeader className="pb-0 pt-3 px-3">
          <div className="flex flex-wrap items-start justify-between gap-1 w-full">
            {/* Account Balance Progress mit gefilterten Trades - über die volle Breite */}
            <AccountBalanceProgressNew 
              className="w-full flex-grow" 
              filteredTrades={filteredTrades} 
            />
            
            {/* Filter Buttons */}
            <div className="flex flex-col sm:flex-row gap-2 items-center w-full">
              <div className="flex-1 order-2 sm:order-1 flex justify-center">
                <Button 
                  variant="default" 
                  size="sm"
                  className="text-xs h-9 bg-blue-600/80 hover:bg-blue-500 text-white font-medium border-blue-700/50 shadow-md shadow-blue-900/20 transition-all duration-200 ease-in-out transform hover:scale-105 rounded-lg"
                  onClick={() => {
                    // Ein neues Event erstellen und dispatchen
                    const event = new CustomEvent('add-trade-clicked');
                    window.dispatchEvent(event);
                  }}
                >
                  <LayoutDashboard className="h-4 w-4 mr-2 animate-pulse" />
                  Trade Hinzufügen
                </Button>
              </div>
              <div className="order-1 sm:order-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="text-xs h-8 bg-black/30 hover:bg-red-500/20 hover:text-red-500 border-primary/10"
                  onClick={resetFilters}
                >
                  <X className="h-3 w-3 mr-1" />
                  Filter zurücksetzen
                </Button>
              </div>
            </div>
          </div>
        </CardHeader>
        
        <div className="overflow-x-visible overflow-y-auto max-h-[70vh]">
          <table className="w-full text-xs">
            <thead className="bg-gradient-to-r from-blue-900/20 to-black/30 border-y border-primary/20 sticky top-0 z-10">
              <tr>
                <th className="p-3 text-left whitespace-nowrap">
                  <Popover>
                    <PopoverTrigger asChild>
                      <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                        Datum
                        <CalendarDays className="h-3 w-3 ml-1" />
                      </div>
                    </PopoverTrigger>
                  <PopoverContent className="w-auto p-4 bg-black/95 border-primary/20 backdrop-blur-md" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm text-primary">Zeitraum filtern</h4>
                      <div className="grid gap-2">
                        <div className="grid gap-1">
                          <Label htmlFor="date-from" className="text-xs">Von</Label>
                          <Input
                            id="date-from"
                            type="date"
                            className="h-8 bg-black/50 border-primary/10"
                            value={filters.startDate.toISOString().split('T')[0]}
                            onChange={(e) => {
                              const newDate = e.target.value ? new Date(e.target.value) : new Date();
                              setFilters({...filters, startDate: newDate});
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                        <div className="grid gap-1">
                          <Label htmlFor="date-to" className="text-xs">Bis</Label>
                          <Input
                            id="date-to"
                            type="date"
                            className="h-8 bg-black/50 border-primary/10"
                            value={filters.endDate.toISOString().split('T')[0]}
                            onChange={(e) => {
                              const newDate = e.target.value ? new Date(e.target.value) : new Date();
                              setFilters({...filters, endDate: newDate});
                              setCurrentPage(1);
                            }}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs bg-black/30 hover:bg-primary/20 hover:text-primary border-primary/10"
                          onClick={() => {
                            const {startDate, endDate} = getLastMonthDates();
                            setFilters({...filters, startDate, endDate});
                            setCurrentPage(1);
                          }}
                        >
                          Letzter Monat
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs bg-black/30 hover:bg-primary/20 hover:text-primary border-primary/10"
                          onClick={() => {
                            const {weekStart, weekEnd} = getWeekDates();
                            setFilters({...filters, startDate: weekStart, endDate: weekEnd});
                            setCurrentPage(1);
                          }}
                        >
                          Diese Woche
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs bg-black/30 hover:bg-primary/20 hover:text-primary border-primary/10"
                          onClick={() => {
                            const {startDate, endDate} = getTodayDates();
                            setFilters({...filters, startDate, endDate});
                            setCurrentPage(1);
                          }}
                        >
                          Heute
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-xs bg-black/30 hover:bg-primary/20 hover:text-primary border-primary/10"
                          onClick={() => {
                            setFilters({
                              ...filters, 
                              startDate: new Date('2020-01-01'), 
                              endDate: new Date('2030-12-31')
                            });
                            setCurrentPage(1);
                          }}
                        >
                          Alle Trades
                        </Button>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Kontoart
                      <Wallet className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Kontoart filtern</h4>
                      <div className="space-y-2 px-1">
                        {accountTypes.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`account-${type}`} 
                              checked={filters.accountTypes.has(type)}
                              onCheckedChange={() => toggleFilter('accountTypes', type)}
                            />
                            <Label htmlFor={`account-${type}`} className="text-sm cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.accountTypes.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, accountTypes: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Session
                      <Clock className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Session filtern</h4>
                      <div className="space-y-2 px-1">
                        {sessionTypes.map(session => (
                          <div key={session} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`session-${session}`} 
                              checked={filters.sessions.has(session)}
                              onCheckedChange={() => toggleFilter('sessions', session)}
                            />
                            <Label htmlFor={`session-${session}`} className="text-sm cursor-pointer">
                              {session}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.sessions.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, sessions: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Symbol
                      <BarChart4 className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Symbol filtern</h4>
                      <ScrollArea className="h-48">
                        <div className="space-y-2 px-1">
                          {uniqueValues.symbols.map(symbol => (
                            <div key={symbol} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`symbol-${symbol}`} 
                                checked={filters.symbols.has(symbol)}
                                onCheckedChange={() => toggleFilter('symbols', symbol)}
                              />
                              <Label htmlFor={`symbol-${symbol}`} className="text-sm cursor-pointer">
                                {symbol}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {filters.symbols.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, symbols: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Setup
                      <LineChart className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Setup filtern</h4>
                      <ScrollArea className="h-48">
                        <div className="space-y-2 px-1">
                          {setupTypes.map(setup => (
                            <div key={setup} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`setup-${setup}`} 
                                checked={filters.setups.has(setup)}
                                onCheckedChange={() => toggleFilter('setups', setup)}
                              />
                              <Label htmlFor={`setup-${setup}`} className="text-sm cursor-pointer">
                                {setup}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {filters.setups.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, setups: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Trend
                      <TrendingUp className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Trend filtern</h4>
                      <div className="space-y-2 px-1">
                        {simpleTrendTypes.map(trend => (
                          <div key={trend} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`trend-${trend}`} 
                              checked={filters.trends.has(trend)}
                              onCheckedChange={() => toggleFilter('trends', trend)}
                            />
                            <Label htmlFor={`trend-${trend}`} className="text-sm cursor-pointer">
                              <BadgeTrend trend={trend} className="text-xs py-0 px-1" />
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.trends.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, trends: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Int. Trend
                      <TrendingUp className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Internen Trend filtern</h4>
                      <div className="space-y-2 px-1">
                        {simpleTrendTypes.map(trend => (
                          <div key={trend} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`int-trend-${trend}`} 
                              checked={filters.internalTrendsNew.has(trend)}
                              onCheckedChange={() => toggleFilter('internalTrendsNew', trend)}
                            />
                            <Label htmlFor={`int-trend-${trend}`} className="text-sm cursor-pointer">
                              <BadgeTrend trend={trend} className="text-xs py-0 px-1" />
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.internalTrendsNew.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, internalTrendsNew: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Micro Trend
                      <TrendingUp className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Micro Trend filtern</h4>
                      <div className="space-y-2 px-1">
                        {simpleTrendTypes.map(trend => (
                          <div key={trend} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`micro-trend-${trend}`} 
                              checked={filters.microTrends.has(trend)}
                              onCheckedChange={() => toggleFilter('microTrends', trend)}
                            />
                            <Label htmlFor={`micro-trend-${trend}`} className="text-sm cursor-pointer">
                              <BadgeTrend trend={trend} className="text-xs py-0 px-1" />
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.microTrends.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, microTrends: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Struktur
                      <Award className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Struktur filtern</h4>
                      <ScrollArea className="h-48">
                        <div className="space-y-2 px-1">
                          {structureTypes.map(structure => (
                            <div key={structure} className="flex items-center space-x-2">
                              <Checkbox 
                                id={`structure-${structure}`} 
                                checked={filters.structures.has(structure)}
                                onCheckedChange={() => toggleFilter('structures', structure)}
                              />
                              <Label htmlFor={`structure-${structure}`} className="text-sm cursor-pointer">
                                {structure}
                              </Label>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                      {filters.structures.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, structures: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      TF Entry
                      <Clock className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">TF Entry filtern</h4>
                      <div className="space-y-2 px-1">
                        {timeframeTypes.map(tf => (
                          <div key={tf} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`timeframe-${tf}`} 
                              checked={filters.timeframeEntries.has(tf)}
                              onCheckedChange={() => toggleFilter('timeframeEntries', tf)}
                            />
                            <Label htmlFor={`timeframe-${tf}`} className="text-sm cursor-pointer">
                              {tf}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.timeframeEntries.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, timeframeEntries: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Location
                      <Target className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Location filtern</h4>
                      <div className="space-y-2 px-1">
                        {uniqueValues.locations.length > 0 ? uniqueValues.locations.map(location => (
                          <div key={location} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`location-${location}`} 
                              checked={filters.locations.has(location)}
                              onCheckedChange={() => toggleFilter('locations', location)}
                            />
                            <Label htmlFor={`location-${location}`} className="text-sm cursor-pointer">
                              {location}
                            </Label>
                          </div>
                        )) : (
                          <div className="text-sm text-muted-foreground">
                            Keine Locations verfügbar
                          </div>
                        )}
                      </div>
                      {filters.locations.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, locations: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Liquidation
                      <Target className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Liquidation filtern</h4>
                      <div className="space-y-2 px-1">
                        {liquidationTypes.map(liq => (
                          <div key={liq} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`liquidation-${liq}`} 
                              checked={filters.liquidations.has(liq)}
                              onCheckedChange={() => toggleFilter('liquidations', liq)}
                            />
                            <Label htmlFor={`liquidation-${liq}`} className="text-sm cursor-pointer">
                              {liq}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.liquidations.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, liquidations: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Unmit. Zone
                      <Target className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Unmit. Zone filtern</h4>
                      <div className="space-y-2 px-1">
                        {unmitZoneTypes.map(zone => (
                          <div key={zone} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`unmitZone-${zone}`} 
                              checked={filters.unmitZones.has(zone)}
                              onCheckedChange={() => toggleFilter('unmitZones', zone)}
                            />
                            <Label htmlFor={`unmitZone-${zone}`} className="text-sm cursor-pointer">
                              {zone}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.unmitZones.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, unmitZones: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                  Range Pkt.
                </div>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Marktphase
                      <BarChart4 className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Marktphase filtern</h4>
                      <div className="space-y-2 px-1">
                        {marketPhaseTypes.map(phase => (
                          <div key={phase} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`marketPhase-${phase}`} 
                              checked={filters.marketPhases.has(phase)}
                              onCheckedChange={() => toggleFilter('marketPhases', phase)}
                            />
                            <Label htmlFor={`marketPhase-${phase}`} className="text-sm cursor-pointer">
                              {phase}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.marketPhases.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, marketPhases: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Einstieg
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Einstieg filtern</h4>
                      <div className="space-y-2 px-1">
                        {simpleTrendTypes.map(entry => (
                          <div key={entry} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`entry-${entry}`} 
                              checked={filters.entryTypes.has(entry)}
                              onCheckedChange={() => toggleFilter('entryTypes', entry)}
                            />
                            <Label htmlFor={`entry-${entry}`} className="text-sm cursor-pointer">
                              <BadgeTrend trend={entry} className="text-xs py-0 px-1" />
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.entryTypes.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, entryTypes: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      RR
                      <Target className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Risk/Reward filtern</h4>
                      <div className="space-y-2 px-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="rr-lt-1" 
                            checked={filters.rrRanges.has('< 1')}
                            onCheckedChange={() => toggleFilter('rrRanges', '< 1')}
                          />
                          <Label htmlFor="rr-lt-1" className="text-sm cursor-pointer">
                            &lt; 1R
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="rr-1-2" 
                            checked={filters.rrRanges.has('1-2')}
                            onCheckedChange={() => toggleFilter('rrRanges', '1-2')}
                          />
                          <Label htmlFor="rr-1-2" className="text-sm cursor-pointer">
                            1R - 2R
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="rr-2-3" 
                            checked={filters.rrRanges.has('2-3')}
                            onCheckedChange={() => toggleFilter('rrRanges', '2-3')}
                          />
                          <Label htmlFor="rr-2-3" className="text-sm cursor-pointer">
                            2R - 3R
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="rr-3-plus" 
                            checked={filters.rrRanges.has('3+')}
                            onCheckedChange={() => toggleFilter('rrRanges', '3+')}
                          />
                          <Label htmlFor="rr-3-plus" className="text-sm cursor-pointer">
                            3R+
                          </Label>
                        </div>
                      </div>
                      {filters.rrRanges.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, rrRanges: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Risiko Summe ($)
                      <Wallet className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Risiko Summe filtern</h4>
                      <div className="space-y-2 px-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="risk-sum-0-100" 
                            checked={filters.riskSumRanges.has('0-100')}
                            onCheckedChange={() => toggleFilter('riskSumRanges', '0-100')}
                          />
                          <Label htmlFor="risk-sum-0-100" className="text-sm cursor-pointer">
                            $0 - $100
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="risk-sum-100-200" 
                            checked={filters.riskSumRanges.has('100-200')}
                            onCheckedChange={() => toggleFilter('riskSumRanges', '100-200')}
                          />
                          <Label htmlFor="risk-sum-100-200" className="text-sm cursor-pointer">
                            $100 - $200
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="risk-sum-200-300" 
                            checked={filters.riskSumRanges.has('200-300')}
                            onCheckedChange={() => toggleFilter('riskSumRanges', '200-300')}
                          />
                          <Label htmlFor="risk-sum-200-300" className="text-sm cursor-pointer">
                            $200 - $300
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="risk-sum-300-plus" 
                            checked={filters.riskSumRanges.has('>300')}
                            onCheckedChange={() => toggleFilter('riskSumRanges', '>300')}
                          />
                          <Label htmlFor="risk-sum-300-plus" className="text-sm cursor-pointer">
                            &gt; $300
                          </Label>
                        </div>
                      </div>
                      {filters.riskSumRanges.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, riskSumRanges: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      P/L ($)
                      <DollarSign className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">P/L filtern</h4>
                      <div className="space-y-2 px-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="pl-neg-1000" 
                            checked={filters.plRanges.has('< -1000')}
                            onCheckedChange={() => toggleFilter('plRanges', '< -1000')}
                          />
                          <Label htmlFor="pl-neg-1000" className="text-sm cursor-pointer text-red-500">
                            &lt; -$1000
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="pl-neg-500-1000" 
                            checked={filters.plRanges.has('-1000 to -500')}
                            onCheckedChange={() => toggleFilter('plRanges', '-1000 to -500')}
                          />
                          <Label htmlFor="pl-neg-500-1000" className="text-sm cursor-pointer text-red-400">
                            -$1000 bis -$500
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="pl-neg-500-0" 
                            checked={filters.plRanges.has('-500 to 0')}
                            onCheckedChange={() => toggleFilter('plRanges', '-500 to 0')}
                          />
                          <Label htmlFor="pl-neg-500-0" className="text-sm cursor-pointer text-red-300">
                            -$500 bis $0
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="pl-0-500" 
                            checked={filters.plRanges.has('0 to 500')}
                            onCheckedChange={() => toggleFilter('plRanges', '0 to 500')}
                          />
                          <Label htmlFor="pl-0-500" className="text-sm cursor-pointer text-green-300">
                            $0 bis $500
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="pl-500-1000" 
                            checked={filters.plRanges.has('500 to 1000')}
                            onCheckedChange={() => toggleFilter('plRanges', '500 to 1000')}
                          />
                          <Label htmlFor="pl-500-1000" className="text-sm cursor-pointer text-green-400">
                            $500 bis $1000
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="pl-1000-plus" 
                            checked={filters.plRanges.has('> 1000')}
                            onCheckedChange={() => toggleFilter('plRanges', '> 1000')}
                          />
                          <Label htmlFor="pl-1000-plus" className="text-sm cursor-pointer text-green-500">
                            &gt; $1000
                          </Label>
                        </div>
                      </div>
                      {filters.plRanges.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, plRanges: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Status
                      <Filter className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Status filtern</h4>
                      <div className="space-y-2 px-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="win-status" 
                            checked={filters.isWin === true}
                            onCheckedChange={() => toggleWinLossFilter(true)}
                          />
                          <Label htmlFor="win-status" className="text-sm cursor-pointer">
                            <span className="text-green-500">Win</span>
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="loss-status" 
                            checked={filters.isWin === false}
                            onCheckedChange={() => toggleWinLossFilter(false)}
                          />
                          <Label htmlFor="loss-status" className="text-sm cursor-pointer">
                            <span className="text-red-500">Loss</span>
                          </Label>
                        </div>
                      </div>
                      {filters.isWin !== null && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, isWin: null});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      SL
                      <Filter className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">SL-Typ filtern</h4>
                      <div className="space-y-2 px-1">
                        {slTypes.map(type => (
                          <div key={type} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`sl-type-${type}`} 
                              checked={filters.slTypes.has(type)}
                              onCheckedChange={() => toggleFilter('slTypes', type)}
                            />
                            <Label htmlFor={`sl-type-${type}`} className="text-sm cursor-pointer">
                              {type}
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.slTypes.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, slTypes: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      SL Punkte
                      <Target className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">SL-Punkte filtern</h4>
                      <div className="space-y-2 px-1">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="sl-points-1-10" 
                            checked={filters.slPointsRanges.has('1-10')}
                            onCheckedChange={() => toggleFilter('slPointsRanges', '1-10')}
                          />
                          <Label htmlFor="sl-points-1-10" className="text-sm cursor-pointer">
                            1-10
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="sl-points-11-20" 
                            checked={filters.slPointsRanges.has('11-20')}
                            onCheckedChange={() => toggleFilter('slPointsRanges', '11-20')}
                          />
                          <Label htmlFor="sl-points-11-20" className="text-sm cursor-pointer">
                            11-20
                          </Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="sl-points-21-30" 
                            checked={filters.slPointsRanges.has('21-30')}
                            onCheckedChange={() => toggleFilter('slPointsRanges', '21-30')}
                          />
                          <Label htmlFor="sl-points-21-30" className="text-sm cursor-pointer">
                            21-30
                          </Label>
                        </div>
                      </div>
                      {filters.slPointsRanges.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, slPointsRanges: new Set()});
                            setCurrentPage(1);
                          }}
                        >
                          Filter zurücksetzen
                        </Button>
                      )}
                    </div>
                  </PopoverContent>
                </Popover>
              </th>
              <th className="sticky top-0 bg-background">
                <div className="text-center text-xs font-medium flex items-center justify-center px-3 py-2 bg-background">
                  Aktion
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              // Loading state
              Array(5).fill(0).map((_, index) => (
                <tr key={index} className="border-b border-border">
                  <td className="p-3"><Skeleton className="h-5 w-24" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-10" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-14" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-8" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-12" /></td>
                  <td className="p-3"><Skeleton className="h-5 w-16" /></td>
                </tr>
              ))
            ) : currentTrades.length > 0 ? (
              // Trades list
              currentTrades.map((trade) => (
                <tr 
                  key={trade.id} 
                  className="border-b border-border hover:bg-muted/50 cursor-pointer" 
                  onClick={() => onTradeSelect(trade)}
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
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                      onClick={(e) => {
                        e.stopPropagation(); // Verhindert, dass der Trade ausgewählt wird
                        setTradeToDelete(trade);
                        setDeleteDialogOpen(true);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            ) : (
              // Empty state
              <tr>
                <td colSpan={20} className="p-6 text-center text-muted-foreground">
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
            disabled={deleteTradeMutation.isPending}
          >
            {deleteTradeMutation.isPending ? "Wird gelöscht..." : "Löschen"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  </div>
  );
}