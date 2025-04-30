import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
  rrValues
} from "@shared/schema";
import { formatDate, formatTime, getTodayDates, getWeekDates, getLastMonthDates } from "@/lib/utils";
import { BadgeWinLoss } from "@/components/ui/badge-win-loss";
import { BadgeTrend } from "@/components/ui/badge-trend";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Filter, 
  SlidersHorizontal, 
  RefreshCw, 
  Plus, 
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
  Layers,
  LayoutList
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

interface TradeTableProps {
  trades: Trade[];
  isLoading: boolean;
  onTradeSelect: (trade: Trade) => void;
}

export default function TradeTable({ trades = [], isLoading, onTradeSelect }: TradeTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 5;
  
  // Effekt zum Optimieren der Tabellenbreiten
  useEffect(() => {
    // Spaltenbreiten optimieren
    const optimizeColumnWidths = () => {
      // Spaltenbreiten festlegen
      const columnWidths: Record<string, string> = {
        '0': '80px',  // Datum
        '1': '60px',  // Account
        '2': '60px',  // Session
        '3': '60px',  // Symbol
        '4': '70px',  // Setup
        '5': '50px',  // Trend
        '6': '50px',  // Int. Trend
        '7': '50px',  // Micro Trend
        '8': '60px',  // Struktur
        '9': '60px',  // Location
        '10': '50px', // TF Entry
        '11': '40px', // RR
        '12': '50px', // P/L
        '13': '50px'  // Status
      };
      
      // Spaltenbreiten anwenden
      document.querySelectorAll('th').forEach((el, index) => {
        const indexKey = index.toString();
        if (columnWidths[indexKey]) {
          el.style.width = columnWidths[indexKey];
          el.style.maxWidth = columnWidths[indexKey];
        }
      });
    };
    
    // Ausführen nach dem Rendern
    setTimeout(optimizeColumnWidths, 500);
  }, []);
  
  // Filter state
  const [filters, setFilters] = useState({
    symbols: new Set<string>(),
    setups: new Set<string>(),
    mainTrends: new Set<string>(),
    internalTrends: new Set<string>(),
    entryTypes: new Set<string>(),
    accountTypes: new Set<string>(),
    sessions: new Set<string>(),  // Neuer Filter für Sessions
    rrRanges: new Set<string>(),  // Neuer Filter für Risk/Reward-Ranges
    plRanges: new Set<string>(),  // Neuer Filter für Profit/Loss-Ranges
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
    marketPhases: Array.from(new Set(trades.map(t => t.marketPhase).filter(Boolean))) as string[]
  };
  
  // Apply filters
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
    
    // Date range filter
    if (trade.date) {
      const tradeDate = new Date(trade.date);
      
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
  
  // Calculate pagination for filtered trades
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = filteredTrades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(filteredTrades.length / tradesPerPage);
  
  // Reset page when filters change (for now without useEffect)
  
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
      // Datum zurücksetzen
      startDate: new Date('2020-01-01'),
      endDate: new Date('2030-12-31')
    });
    setCurrentPage(1);
  };
  
  // Die Funktion für Trend-Farben wurde zugunsten der BadgeTrend-Komponente entfernt
  
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
    <Card className="mb-6 bg-card overflow-hidden w-full mx-auto">
      <CardHeader className="flex-row justify-between items-center py-4 border-b border-border">
        <div className="flex-1 flex items-center">
          {/* Statistik-Panel */}
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
              Trades: {filteredTrades.length}
            </Badge>
            <Badge variant="outline" className="bg-emerald-500/5 text-emerald-400 hover:bg-emerald-500/10">
              Gewinne: {filteredTrades.filter(t => t.isWin).length}
            </Badge>
            <Badge variant="outline" className="bg-red-500/5 text-red-400 hover:bg-red-500/10">
              Verluste: {filteredTrades.filter(t => t.isWin === false).length}
            </Badge>
            <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
              Win Rate: {filteredTrades.length > 0 ? ((filteredTrades.filter(t => t.isWin).length / filteredTrades.length) * 100).toFixed(1) : '0.0'}%
            </Badge>
            <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
              P&L: ${calculateTotalPL(filteredTrades).toFixed(2)}
            </Badge>
            <Badge variant="outline" className="bg-primary/5 hover:bg-primary/10">
              Ø RR: {calculateAverageRR(filteredTrades).toFixed(2)}
            </Badge>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex items-center gap-1 text-xs bg-primary/20 hover:bg-primary/30 text-primary border-0"
            onClick={() => {
              const event = new CustomEvent('add-trade-clicked');
              window.dispatchEvent(event);
            }}
          >
            <Plus className="h-3 w-3" />
            Trade hinzufügen
          </Button>
          
          <Button 
            variant="outline" 
            size="sm"
            className="flex items-center gap-1 text-xs bg-primary/10 hover:bg-primary/20 text-primary border-0"
            onClick={resetFilters}
          >
            <RefreshCw className="h-3 w-3" />
            Filter zurücksetzen
          </Button>
        </div>
      </CardHeader>
      
      {/* Kompakte Ansicht-Schalter */}
      <div className="px-4 py-2 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <div className="flex flex-col">
            <div className="text-xs font-medium text-muted-foreground mb-1">Tabellenansicht</div>
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="text-xs h-8"
                onClick={() => {
                  // Kompakte Ansicht
                  document.querySelectorAll('.trade-table').forEach(el => {
                    el.classList.toggle('compact-mode');
                  });
                  
                  // Klassische Spalten ein-/ausblenden
                  document.querySelectorAll('th:nth-child(n+7), td:nth-child(n+7)').forEach(el => {
                    const display = (el as HTMLElement).style.display;
                    (el as HTMLElement).style.display = 
                      display === 'none' ? '' : 'none';
                  });
                }}
              >
                <LayoutList className="h-3 w-3 mr-1" />
                Kompakte Ansicht
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="text-xs h-8"
                onClick={() => {
                  // Multi-Zeilen Ansicht aktivieren
                  const table = document.querySelector('.trade-table');
                  if (table) {
                    table.classList.toggle('multi-row-mode');
                    
                    // Multirow-Klassen umschalten
                    document.querySelectorAll('tr.trade-row').forEach(tr => {
                      tr.classList.toggle('grid');
                      tr.classList.toggle('grid-cols-4');
                      tr.classList.toggle('gap-2');
                    });
                    
                    // TD-Styling umschalten
                    document.querySelectorAll('td.trade-cell').forEach(td => {
                      td.classList.toggle('flex');
                      td.classList.toggle('flex-col');
                      td.classList.toggle('border');
                      td.classList.toggle('rounded');
                      td.classList.toggle('p-2');
                      td.classList.toggle('mb-2');
                    });
                  }
                }}
              >
                <Layers className="h-3 w-3 mr-1" />
                Multi-Zeilen Ansicht
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <div className="overflow-x-auto">
        <table className="w-full text-xs table-fixed trade-table">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left whitespace-nowrap w-24" style={{width: "90px", maxWidth: "90px"}}>
                <Popover>
                  <PopoverTrigger asChild>
                    <div className="flex items-center gap-1 cursor-pointer hover:text-primary transition-colors">
                      Datum
                      <CalendarDays className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-4" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Zeitraum filtern</h4>
                      <div className="grid gap-2">
                        <div className="grid gap-1">
                          <Label htmlFor="date-from" className="text-xs">Von</Label>
                          <Input
                            id="date-from"
                            type="date"
                            className="h-8"
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
                            className="h-8"
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
                          className="text-xs"
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
                          className="text-xs"
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
                          className="text-xs"
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
                          className="text-xs"
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
                          {uniqueValues.setups.map(setup => (
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
              {/* Trendspalten in logischer Reihenfolge */}
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
                        {uniqueValues.trends.length > 0 ? uniqueValues.trends.map(trend => (
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
                        )) : simpleTrendTypes.map(trend => (
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
                      <h4 className="font-medium text-sm">Int. Trend filtern</h4>
                      <div className="space-y-2 px-1">
                        {uniqueValues.internalTrendsNew.length > 0 ? uniqueValues.internalTrendsNew.map(trend => (
                          <div key={trend} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`internNew-${trend}`} 
                              checked={filters.internalTrendsNew.has(trend)}
                              onCheckedChange={() => toggleFilter('internalTrendsNew', trend)}
                            />
                            <Label htmlFor={`internNew-${trend}`} className="text-sm cursor-pointer">
                              <BadgeTrend trend={trend} className="text-xs py-0 px-1" />
                            </Label>
                          </div>
                        )) : simpleTrendTypes.map(trend => (
                          <div key={trend} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`internNew-${trend}`} 
                              checked={filters.internalTrendsNew.has(trend)}
                              onCheckedChange={() => toggleFilter('internalTrendsNew', trend)}
                            />
                            <Label htmlFor={`internNew-${trend}`} className="text-sm cursor-pointer">
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
                      Mic. Trend
                      <TrendingUp className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Mic. Trend filtern</h4>
                      <div className="space-y-2 px-1">
                        {uniqueValues.microTrends.length > 0 ? uniqueValues.microTrends.map(trend => (
                          <div key={trend} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`micro-${trend}`} 
                              checked={filters.microTrends.has(trend)}
                              onCheckedChange={() => toggleFilter('microTrends', trend)}
                            />
                            <Label htmlFor={`micro-${trend}`} className="text-sm cursor-pointer">
                              <BadgeTrend trend={trend} className="text-xs py-0 px-1" />
                            </Label>
                          </div>
                        )) : simpleTrendTypes.map(trend => (
                          <div key={trend} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`micro-${trend}`} 
                              checked={filters.microTrends.has(trend)}
                              onCheckedChange={() => toggleFilter('microTrends', trend)}
                            />
                            <Label htmlFor={`micro-${trend}`} className="text-sm cursor-pointer">
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
                      M15 Trend
                      <TrendingUp className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">M15 Trend filtern</h4>
                      <div className="space-y-2 px-1">
                        {uniqueValues.mainTrends.map(trend => (
                          <div key={trend} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`main-${trend}`} 
                              checked={filters.mainTrends.has(trend)}
                              onCheckedChange={() => toggleFilter('mainTrends', trend)}
                            />
                            <Label htmlFor={`main-${trend}`} className="text-sm cursor-pointer">
                              <BadgeTrend trend={trend} className="text-xs py-0 px-1" />
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.mainTrends.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, mainTrends: new Set()});
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
                      M5 Trend
                      <TrendingUp className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">M5 Trend filtern</h4>
                      <div className="space-y-2 px-1">
                        {uniqueValues.internalTrends.map(trend => (
                          <div key={trend} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`intern-${trend}`} 
                              checked={filters.internalTrends.has(trend)}
                              onCheckedChange={() => toggleFilter('internalTrends', trend)}
                            />
                            <Label htmlFor={`intern-${trend}`} className="text-sm cursor-pointer">
                              <BadgeTrend trend={trend} className="text-xs py-0 px-1" />
                            </Label>
                          </div>
                        ))}
                      </div>
                      {filters.internalTrends.size > 0 && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="w-full text-xs"
                          onClick={() => {
                            setFilters({...filters, internalTrends: new Set()});
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
                      <LineChart className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Struktur filtern</h4>
                      <div className="space-y-2 px-1">
                        {uniqueValues.structures.length > 0 ? uniqueValues.structures.map(structure => (
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
                        )) : structureTypes.map(structure => (
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
                      Location
                      <BarChart4 className="h-3 w-3 ml-1" />
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
                        )) : ['FVG', 'FVG Sweep', 'Micro FVG', 'Micro FVG Sweep', 'Wick', 'BOS', 'Delivery'].map(location => (
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
                        ))}
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
                      TF Entry
                      <Clock className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Timeframe Entry filtern</h4>
                      <div className="space-y-2 px-1">
                        {uniqueValues.timeframeEntries.length > 0 ? uniqueValues.timeframeEntries.map(tf => (
                          <div key={tf} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`tf-${tf}`} 
                              checked={filters.timeframeEntries.has(tf)}
                              onCheckedChange={() => toggleFilter('timeframeEntries', tf)}
                            />
                            <Label htmlFor={`tf-${tf}`} className="text-sm cursor-pointer">
                              {tf}
                            </Label>
                          </div>
                        )) : timeframeTypes.map(tf => (
                          <div key={tf} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`tf-${tf}`} 
                              checked={filters.timeframeEntries.has(tf)}
                              onCheckedChange={() => toggleFilter('timeframeEntries', tf)}
                            />
                            <Label htmlFor={`tf-${tf}`} className="text-sm cursor-pointer">
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
                      Liquidation
                      <Target className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Liquidation filtern</h4>
                      <div className="space-y-2 px-1">
                        {uniqueValues.liquidations.length > 0 ? uniqueValues.liquidations.map(liq => (
                          <div key={liq} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`liq-${liq}`} 
                              checked={filters.liquidations.has(liq)}
                              onCheckedChange={() => toggleFilter('liquidations', liq)}
                            />
                            <Label htmlFor={`liq-${liq}`} className="text-sm cursor-pointer">
                              {liq}
                            </Label>
                          </div>
                        )) : liquidationTypes.map(liq => (
                          <div key={liq} className="flex items-center space-x-2">
                            <Checkbox 
                              id={`liq-${liq}`} 
                              checked={filters.liquidations.has(liq)}
                              onCheckedChange={() => toggleFilter('liquidations', liq)}
                            />
                            <Label htmlFor={`liq-${liq}`} className="text-sm cursor-pointer">
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
                      Einstieg
                      <ArrowUpDown className="h-3 w-3 ml-1" />
                    </div>
                  </PopoverTrigger>
                  <PopoverContent className="w-56" align="start">
                    <div className="space-y-2">
                      <h4 className="font-medium text-sm">Einstieg filtern</h4>
                      <div className="space-y-2 px-1">
                        {uniqueValues.entryTypes.map(entry => (
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
                      <Award className="h-3 w-3 ml-1" />
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
                  <td className="p-1.5 text-xs">
                    <div className="flex flex-col">
                      <span>{formatDate(trade.date)}</span>
                      <span className="text-[10px] text-muted-foreground">{formatTime(trade.date)}</span>
                    </div>
                  </td>
                  <td className="p-1.5 text-xs">{trade.accountType || '-'}</td>
                  <td className="p-1.5 text-xs">{trade.session || '-'}</td>
                  <td className="p-1.5 text-xs">{trade.symbol}</td>
                  <td className="p-1.5 text-xs">{trade.setup}</td>
                  <td className="p-1.5 text-xs">
                    {trade.trend ? <BadgeTrend trend={trade.trend} size="xs" /> : '-'}
                  </td>
                  <td className="p-1.5 text-xs">
                    {trade.internalTrend ? <BadgeTrend trend={trade.internalTrend} size="xs" /> : '-'}
                  </td>
                  <td className="p-1.5 text-xs">
                    {trade.microTrend ? <BadgeTrend trend={trade.microTrend} size="xs" /> : '-'}
                  </td>
                  <td className="p-1.5 text-xs">
                    {trade.mainTrendM15 ? <BadgeTrend trend={trade.mainTrendM15} size="xs" /> : '-'}
                  </td>
                  <td className="p-1.5 text-xs">
                    {trade.internalTrendM5 ? <BadgeTrend trend={trade.internalTrendM5} size="xs" /> : '-'}
                  </td>
                  <td className="p-1.5 text-xs">
                    {trade.structure || '-'}
                  </td>
                  <td className="p-1.5 text-xs">
                    {trade.location || '-'}
                  </td>
                  <td className="p-1.5 text-xs">
                    {trade.timeframeEntry || '-'}
                  </td>
                  <td className="p-1.5 text-xs">
                    {trade.liquidation || '-'}
                  </td>
                  <td className="p-1.5 text-xs">
                    {trade.entryType ? <BadgeTrend trend={trade.entryType} size="xs" /> : '-'}
                  </td>
                  <td className="p-1.5 text-xs">{trade.rrAchieved}</td>
                  <td className="p-1.5 text-xs">
                    <span className={`${trade.profitLoss && trade.profitLoss > 0 ? 'text-green-500' : trade.profitLoss && trade.profitLoss < 0 ? 'text-red-500' : ''}`}>
                      {trade.profitLoss ? `${trade.profitLoss > 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}` : '-'}
                    </span>
                  </td>
                  <td className="p-1.5 text-xs">
                    <BadgeWinLoss isWin={trade.isWin} size="xs" />
                  </td>
                </tr>
              ))
            ) : (
              // Empty state
              <tr>
                <td colSpan={10} className="p-6 text-center text-muted-foreground">
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
            Zeige {indexOfFirstTrade + 1}-{Math.min(indexOfLastTrade, trades.length)} von {trades.length} Trades
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
  );
}
