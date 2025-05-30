import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trade } from "../shared/schema";
import {
  BarChart,
  Bar,
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  ResponsiveContainer,
  Cell,
  Pie,
  PieChart,
  Area
} from 'recharts';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { 
  BarChart2, 
  PieChart as PieChartIcon, 
  Activity, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Calendar, 
  Clock,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  CalendarRange,
  RotateCcw
} from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { format, subDays, subMonths, parseISO, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";

// Konstanten für Zeitraumfilterung
type TimeRangeOption = {
  label: string;
  value: string;
  days: number;
};

// Hilfsfunktion zur Formatierung von Datum im deutschen Format
const formatDateDE = (date: Date): string => {
  return format(date, 'dd.MM.yyyy', { locale: de });
};

// Parst ein Datum aus deutschem Format (TT.MM.YYYY) oder ISO-Format
const parseDateInput = (dateString: string): Date | null => {
  if (!dateString) return null;
  
  // Versuche zuerst als deutsches Datumsformat zu parsen (DD.MM.YYYY)
  const parts = dateString.split('.');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1; // Monate in JS sind 0-basiert
    const year = parseInt(parts[2], 10);
    
    const date = new Date(year, month, day);
    if (!isNaN(date.getTime())) {
      return date;
    }
  }
  
  // Alternativ versuche als ISO-Format zu parsen
  try {
    const date = parseISO(dateString);
    if (isValid(date)) {
      return date;
    }
  } catch (e) {
    // Ignoriere Fehler beim Parsen
  }
  
  return null;
};

interface TradeDashboardProps {
  trades: Trade[];
}

export default function TradeDashboard({ trades }: TradeDashboardProps) {
  const [winLossData, setWinLossData] = useState<any[]>([]);
  const [symbolPerformanceData, setSymbolPerformanceData] = useState<any[]>([]);
  const [performanceByDay, setPerformanceByDay] = useState<any[]>([]);
  const [performanceByTime, setPerformanceByTime] = useState<any[]>([]);
  const [riskRewardData, setRiskRewardData] = useState<any[]>([]);
  const [profitLossDistribution, setProfitLossDistribution] = useState<any[]>([]);
  const [tradeTypeData, setTradeTypeData] = useState<any[]>([]);
  const [setupPerformance, setSetupPerformance] = useState<any[]>([]);
  const [selectedSetup, setSelectedSetup] = useState<string>("all");
  
  // Für benutzerdefinierte Datumsfilterung
  const [startDateInput, setStartDateInput] = useState<string>("");
  const [endDateInput, setEndDateInput] = useState<string>("");
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  
  // Verfügbare Setups aus den Trades extrahieren
  const availableSetups = useMemo(() => {
    const setups = new Set<string>();
    trades.forEach((trade) => {
      if (trade.setup) {
        setups.add(trade.setup);
      }
    });
    return Array.from(setups);
  }, [trades]);
  
  // Generiere Beispielzeitraum-Optionen für die vordefinierten Filter
  const timeRangeOptions: TimeRangeOption[] = [
    { label: "Alle Daten", value: "all", days: 0 },
    { label: "Letzte Woche", value: "last_week", days: 7 },
    { label: "Letzter Monat", value: "last_month", days: 30 },
    { label: "Letztes Quartal", value: "last_quarter", days: 90 },
    { label: "Letztes Jahr", value: "last_year", days: 365 }
  ];
  
  // State für vordefinierte Zeiträume
  const [selectedTimeRange, setSelectedTimeRange] = useState<string>("all");
  
  // Verarbeite Datumsfilter, wenn Start- und/oder Enddatum eingegeben wurde
  useEffect(() => {
    if (startDateInput) {
      const parsedDate = parseDateInput(startDateInput);
      if (parsedDate) {
        // Setze Startzeit auf 00:00:00
        parsedDate.setHours(0, 0, 0, 0);
        setStartDate(parsedDate);
        // Wenn ein benutzerdefiniertes Datum ausgewählt wird, den vordefinierten Filter zurücksetzen
        setSelectedTimeRange("all");
      }
    } else {
      setStartDate(null);
    }
  }, [startDateInput]);

  useEffect(() => {
    if (endDateInput) {
      const parsedDate = parseDateInput(endDateInput);
      if (parsedDate) {
        // Setze Endzeit auf 23:59:59
        parsedDate.setHours(23, 59, 59, 999);
        setEndDate(parsedDate);
        // Wenn ein benutzerdefiniertes Datum ausgewählt wird, den vordefinierten Filter zurücksetzen
        setSelectedTimeRange("all");
      }
    } else {
      setEndDate(null);
    }
  }, [endDateInput]);
  
  // Effekt für vordefinierten Zeitraumfilter
  useEffect(() => {
    if (selectedTimeRange !== "all") {
      // Wenn ein vordefinierter Zeitraum ausgewählt wird, die benutzerdefinierten Datumseingaben zurücksetzen
      setStartDateInput("");
      setEndDateInput("");
      setStartDate(null);
      setEndDate(null);
    }
  }, [selectedTimeRange]);

  // Filtere Trades nach Zeitraum (vordefiniert oder benutzerdefiniert)
  const timeFilteredTrades = useMemo(() => {
    // Wenn ein vordefinierter Zeitraum ausgewählt ist
    if (selectedTimeRange !== "all") {
      const option = timeRangeOptions.find(opt => opt.value === selectedTimeRange);
      if (!option) return trades;
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - option.days);
      
      return trades.filter(trade => {
        if (!trade.date) return false;
        const tradeDate = new Date(trade.date);
        return tradeDate >= cutoffDate;
      });
    }
    
    // Wenn ein benutzerdefinierter Zeitraum ausgewählt ist
    if (startDate || endDate) {
      return trades.filter(trade => {
        if (!trade.date) return false;
        
        const tradeDate = new Date(trade.date);
        
        if (startDate && tradeDate < startDate) return false;
        if (endDate && tradeDate > endDate) return false;
        
        return true;
      });
    }
    
    // Wenn kein Filter aktiv ist
    return trades;
  }, [trades, startDate, endDate, selectedTimeRange, timeRangeOptions]);
  
  // Gefilterte Trades basierend auf ausgewähltem Setup und Zeitraum
  const filteredTrades = useMemo(() => {
    if (selectedSetup === "all") {
      return timeFilteredTrades;
    }
    return timeFilteredTrades.filter(trade => trade.setup === selectedSetup);
  }, [timeFilteredTrades, selectedSetup]);
  
  // Statistik-Werte basierend auf gefilterten Trades
  const totalTrades = filteredTrades.length;
  const winningTrades = filteredTrades.filter(t => t.isWin).length;
  const losingTrades = filteredTrades.filter(t => t.isWin === false).length;
  const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
  
  const totalPL = filteredTrades.reduce((sum, trade) => {
    return sum + (trade.profitLoss || 0);
  }, 0);
  
  const averageWin = winningTrades > 0 
    ? filteredTrades.filter(t => t.isWin).reduce((sum, t) => sum + (t.profitLoss || 0), 0) / winningTrades 
    : 0;
    
  const averageLoss = losingTrades > 0 
    ? Math.abs(filteredTrades.filter(t => !t.isWin).reduce((sum, t) => sum + (t.profitLoss || 0), 0)) / losingTrades 
    : 0;
    
  const profitFactor = averageLoss > 0 ? averageWin / averageLoss : 0;
  
  const averageRR = filteredTrades.length > 0 
    ? filteredTrades.reduce((sum, trade) => sum + (trade.rrAchieved || 0), 0) / filteredTrades.length 
    : 0;
  
  const consecutiveWins = getMaxConsecutiveCount(filteredTrades, true);
  const consecutiveLosses = getMaxConsecutiveCount(filteredTrades, false);
  
  // Profitable Tage berechnen
  const dayPerformance = trades.reduce((acc, trade) => {
    if (!trade.date) return acc;
    
    const date = new Date(trade.date);
    const dateStr = date.toISOString().split('T')[0];
    
    if (!acc[dateStr]) {
      acc[dateStr] = {
        profit: 0,
        trades: 0,
        wins: 0,
        losses: 0
      };
    }
    
    acc[dateStr].profit += trade.profitLoss || 0;
    acc[dateStr].trades += 1;
    
    if (trade.isWin) {
      acc[dateStr].wins += 1;
    } else {
      acc[dateStr].losses += 1;
    }
    
    return acc;
  }, {} as Record<string, { profit: number, trades: number, wins: number, losses: number }>);
  
  const profitableDays = Object.values(dayPerformance).filter(day => day.profit > 0).length;
  const losingDays = Object.values(dayPerformance).filter(day => day.profit < 0).length;
  
  const bestDay = Object.entries(dayPerformance).reduce((best, [date, data]) => {
    if (!best || data.profit > best.profit) {
      return { date, profit: data.profit };
    }
    return best;
  }, null as { date: string, profit: number } | null);
  
  const worstDay = Object.entries(dayPerformance).reduce((worst, [date, data]) => {
    if (!worst || data.profit < worst.profit) {
      return { date, profit: data.profit };
    }
    return worst;
  }, null as { date: string, profit: number } | null);

  useEffect(() => {
    // Win/Loss-Verhältnis
    setWinLossData([
      { name: 'Gewonnen', value: winningTrades, color: COLORS.profit },
      { name: 'Verloren', value: losingTrades, color: COLORS.loss }
    ]);
    
    // Performance nach Symbol
    const symbolData = filteredTrades.reduce((acc, trade) => {
      const symbol = trade.symbol || 'Unbekannt';
      
      if (!acc[symbol]) {
        acc[symbol] = {
          symbol,
          profit: 0,
          trades: 0,
          wins: 0
        };
      }
      
      acc[symbol].profit += trade.profitLoss || 0;
      acc[symbol].trades += 1;
      
      if (trade.isWin) {
        acc[symbol].wins += 1;
      }
      
      return acc;
    }, {} as Record<string, { symbol: string, profit: number, trades: number, wins: number }>);
    
    setSymbolPerformanceData(Object.values(symbolData)
      .sort((a, b) => b.profit - a.profit)
      .map(data => ({
        ...data,
        winRate: data.wins / data.trades * 100
      }))
    );
    
    // Performance nach Tag
    const dayData = filteredTrades.reduce((acc, trade) => {
      if (!trade.date) return acc;
      
      const date = new Date(trade.date);
      const day = date.toLocaleDateString('de-DE', { weekday: 'short' });
      
      if (!acc[day]) {
        acc[day] = {
          day,
          profit: 0,
          trades: 0
        };
      }
      
      acc[day].profit += trade.profitLoss || 0;
      acc[day].trades += 1;
      
      return acc;
    }, {} as Record<string, { day: string, profit: number, trades: number }>);
    
    const daysOrder = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
    setPerformanceByDay(
      daysOrder
        .filter(day => dayData[day])
        .map(day => ({
          day,
          profit: dayData[day].profit,
          trades: dayData[day].trades,
          avgProfit: dayData[day].profit / dayData[day].trades
        }))
    );
    
    // Performance nach Uhrzeit
    const timeData = filteredTrades.reduce((acc, trade) => {
      if (!trade.date) return acc;
      
      const date = new Date(trade.date);
      const hour = date.getHours();
      const timeSlot = `${hour}:00`;
      
      if (!acc[timeSlot]) {
        acc[timeSlot] = {
          timeSlot,
          profit: 0,
          trades: 0
        };
      }
      
      acc[timeSlot].profit += trade.profitLoss || 0;
      acc[timeSlot].trades += 1;
      
      return acc;
    }, {} as Record<string, { timeSlot: string, profit: number, trades: number }>);
    
    setPerformanceByTime(
      Object.values(timeData)
        .sort((a, b) => {
          const hourA = parseInt(a.timeSlot.split(':')[0]);
          const hourB = parseInt(b.timeSlot.split(':')[0]);
          return hourA - hourB;
        })
        .map(data => ({
          ...data,
          avgProfit: data.profit / data.trades
        }))
    );
    
    // Risk/Reward-Verteilung
    const rrGroups = filteredTrades.reduce((acc, trade) => {
      if (trade.rrAchieved === undefined || trade.rrAchieved === null) return acc;
      
      let group;
      if (trade.rrAchieved <= 0) group = '≤ 0';
      else if (trade.rrAchieved <= 0.5) group = '0 - 0.5';
      else if (trade.rrAchieved <= 1) group = '0.5 - 1';
      else if (trade.rrAchieved <= 1.5) group = '1 - 1.5';
      else if (trade.rrAchieved <= 2) group = '1.5 - 2';
      else if (trade.rrAchieved <= 3) group = '2 - 3';
      else group = '> 3';
      
      if (!acc[group]) {
        acc[group] = {
          group,
          count: 0,
          totalProfit: 0
        };
      }
      
      acc[group].count += 1;
      acc[group].totalProfit += trade.profitLoss || 0;
      
      return acc;
    }, {} as Record<string, { group: string, count: number, totalProfit: number }>);
    
    const rrOrder = ['≤ 0', '0 - 0.5', '0.5 - 1', '1 - 1.5', '1.5 - 2', '2 - 3', '> 3'];
    setRiskRewardData(
      rrOrder
        .filter(group => rrGroups[group])
        .map(group => ({
          ...rrGroups[group],
          avgProfit: rrGroups[group].totalProfit / rrGroups[group].count
        }))
    );
    
    // Profit/Loss-Verteilung
    const plGroups = filteredTrades.reduce((acc, trade) => {
      if (trade.profitLoss === undefined || trade.profitLoss === null) return acc;
      
      let group;
      if (trade.profitLoss <= -500) group = '< -500';
      else if (trade.profitLoss <= -250) group = '-500 bis -250';
      else if (trade.profitLoss <= -100) group = '-250 bis -100';
      else if (trade.profitLoss <= 0) group = '-100 bis 0';
      else if (trade.profitLoss <= 100) group = '0 bis 100';
      else if (trade.profitLoss <= 250) group = '100 bis 250';
      else if (trade.profitLoss <= 500) group = '250 bis 500';
      else group = '> 500';
      
      if (!acc[group]) {
        acc[group] = {
          group,
          count: 0,
          totalProfit: 0
        };
      }
      
      acc[group].count += 1;
      acc[group].totalProfit += trade.profitLoss;
      
      return acc;
    }, {} as Record<string, { group: string, count: number, totalProfit: number }>);
    
    const plOrder = ['< -500', '-500 bis -250', '-250 bis -100', '-100 bis 0', '0 bis 100', '100 bis 250', '250 bis 500', '> 500'];
    setProfitLossDistribution(
      plOrder
        .filter(group => plGroups[group])
        .map(group => ({
          ...plGroups[group],
          avgProfit: plGroups[group].totalProfit / plGroups[group].count
        }))
    );
    
    // Long vs. Short Performance
    const typeData = filteredTrades.reduce((acc, trade) => {
      const type = trade.entryType || 'Unbekannt';
      
      if (!acc[type]) {
        acc[type] = {
          type,
          count: 0,
          profit: 0,
          wins: 0
        };
      }
      
      acc[type].count += 1;
      acc[type].profit += trade.profitLoss || 0;
      
      if (trade.isWin) {
        acc[type].wins += 1;
      }
      
      return acc;
    }, {} as Record<string, { type: string, count: number, profit: number, wins: number }>);
    
    setTradeTypeData(
      Object.values(typeData).map(data => ({
        ...data,
        winRate: data.wins / data.count * 100,
        avgProfit: data.profit / data.count
      }))
    );
    
    // Setup Performance (immer alle anzeigen, unabhängig vom Filter)
    const setupData = trades.reduce((acc, trade) => {
      const setup = trade.setup || 'Unbekannt';
      
      if (!acc[setup]) {
        acc[setup] = {
          setup,
          count: 0,
          profit: 0,
          wins: 0
        };
      }
      
      acc[setup].count += 1;
      acc[setup].profit += trade.profitLoss || 0;
      
      if (trade.isWin) {
        acc[setup].wins += 1;
      }
      
      return acc;
    }, {} as Record<string, { setup: string, count: number, profit: number, wins: number }>);
    
    setSetupPerformance(
      Object.values(setupData)
        .sort((a, b) => b.profit - a.profit)
        .map(data => ({
          ...data,
          winRate: data.wins / data.count * 100,
          avgProfit: data.profit / data.count
        }))
    );
    
  }, [filteredTrades, trades, winningTrades, losingTrades, selectedSetup]);

  // Hilfsfunktion für maximale Folge von Gewinnen/Verlusten
  function getMaxConsecutiveCount(trades: Trade[], isWin: boolean): number {
    const chronologicalTrades = [...trades].sort((a, b) => {
      const dateA = a.date ? new Date(a.date).getTime() : 0;
      const dateB = b.date ? new Date(b.date).getTime() : 0;
      return dateA - dateB;
    });
    
    let maxCount = 0;
    let currentCount = 0;
    
    for (const trade of chronologicalTrades) {
      if (trade.isWin === isWin) {
        currentCount++;
        maxCount = Math.max(maxCount, currentCount);
      } else {
        currentCount = 0;
      }
    }
    
    return maxCount;
  }

  // Erweiterte Farbpalette für Diagramme
  const COLORS = {
    // Hauptfarben
    profit: '#10b981',      // Grün für Gewinn/positive Werte
    loss: '#ef4444',        // Rot für Verlust/negative Werte
    primary: '#3b82f6',     // Blau (Primary)
    secondary: '#8b5cf6',   // Lila (Secondary)
    accent: '#f59e0b',      // Orange (Accent)
    
    // Erweiterte Palette
    series1: '#0ea5e9',     // Hellblau
    series2: '#ec4899',     // Pink
    series3: '#14b8a6',     // Türkis
    series4: '#a855f7',     // Lila
    series5: '#f97316',     // Orange
    
    // Helligkeitsvarianten
    primaryLight: '#60a5fa',
    primaryDark: '#2563eb'
  };

  // Zurücksetzen der Filter-Funktionen
  const resetAllFilters = () => {
    setSelectedSetup("all");
    setSelectedTimeRange("all");
    setStartDate(null);
    setEndDate(null);
    setStartDateInput("");
    setEndDateInput("");
  };

  return (
    <div className="space-y-6">
      {/* Filter Options */}
      <div className="bg-black/30 border border-primary/10 rounded-xl p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">Dashboard filtern:</span>
          </div>
          
          {/* Setup Filter */}
          <Select 
            value={selectedSetup} 
            onValueChange={setSelectedSetup}
          >
            <SelectTrigger className="w-[180px] bg-black/50">
              <SelectValue placeholder="Setup auswählen" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle Setups</SelectItem>
              {availableSetups.map((setup) => (
                <SelectItem key={setup} value={setup}>
                  {setup || "Unbekannt"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Zeitraumfilter (vordefinierte Optionen) */}
          <Select
            value={selectedTimeRange}
            onValueChange={setSelectedTimeRange}
          >
            <SelectTrigger className="w-[180px] bg-black/50">
              <SelectValue placeholder="Zeitraum" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {/* Benutzerdefinierter Datumsbereich mit Kalender-Popover */}
          <div className="flex gap-2 items-center">
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative cursor-pointer group">
                  <CalendarRange className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <Input
                    className="pl-8 w-[140px] bg-black/50 border-border cursor-pointer group-hover:border-primary/50 transition-colors"
                    placeholder="TT.MM.JJJJ"
                    value={startDateInput}
                    readOnly
                  />
                  <div className="absolute inset-0" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-black/80 border-blue-500/30 backdrop-blur-md">
                <CalendarComponent
                  mode="single"
                  selected={startDate}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(date);
                      setStartDateInput(formatDateDE(date));
                    }
                  }}
                  initialFocus
                  className="rounded-md border-blue-500/20"
                />
              </PopoverContent>
            </Popover>
            
            <span className="text-muted-foreground">-</span>
            
            <Popover>
              <PopoverTrigger asChild>
                <div className="relative cursor-pointer group">
                  <CalendarRange className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  <Input
                    className="pl-8 w-[140px] bg-black/50 border-border cursor-pointer group-hover:border-primary/50 transition-colors"
                    placeholder="TT.MM.JJJJ"
                    value={endDateInput}
                    readOnly
                  />
                  <div className="absolute inset-0" />
                </div>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-black/80 border-blue-500/30 backdrop-blur-md">
                <CalendarComponent
                  mode="single"
                  selected={endDate}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(date);
                      setEndDateInput(formatDateDE(date));
                    }
                  }}
                  initialFocus
                  className="rounded-md border-blue-500/20"
                />
              </PopoverContent>
            </Popover>
          </div>
          
          {/* Reset Button */}
          <Button 
            variant="outline" 
            size="sm" 
            onClick={resetAllFilters}
            className="bg-blue-950/40 hover:bg-blue-900/50 border-blue-500/30 hover:border-blue-400/40 text-blue-200"
          >
            <RotateCcw className="h-4 w-4 mr-1.5" />
            Zurücksetzen
          </Button>
          
          {/* Filter Badges */}
          <div className="flex flex-wrap gap-2">
            {selectedSetup !== "all" && (
              <Badge className="px-2 py-1 bg-primary/20 text-primary" variant="outline">
                {filteredTrades.length} Trades mit Setup: {selectedSetup || "Unbekannt"}
              </Badge>
            )}
            
            {selectedTimeRange !== "all" && (
              <Badge className="px-2 py-1 bg-primary/20 text-primary" variant="outline">
                <CalendarRange className="h-3 w-3 mr-1 inline" />
                {timeRangeOptions.find(opt => opt.value === selectedTimeRange)?.label || "Gefiltert"}
              </Badge>
            )}
            
            {startDate && selectedTimeRange === "all" && (
              <Badge className="px-2 py-1 bg-primary/20 text-primary" variant="outline">
                <CalendarRange className="h-3 w-3 mr-1 inline" />
                Von: {formatDateDE(startDate)}
              </Badge>
            )}
            
            {endDate && selectedTimeRange === "all" && (
              <Badge className="px-2 py-1 bg-primary/20 text-primary" variant="outline">
                <CalendarRange className="h-3 w-3 mr-1 inline" />
                Bis: {formatDateDE(endDate)}
              </Badge>
            )}
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gesamtergebnis</CardTitle>
            <DollarSign className={`h-4 w-4 ${totalPL >= 0 ? 'text-emerald-500' : 'text-red-500'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalPL.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              {totalTrades} Trades ({winRate.toFixed(1)}% Win Rate)
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Win/Loss Ratio</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {winningTrades}:{losingTrades}
            </div>
            <p className="text-xs text-muted-foreground">
              Profit Faktor: {profitFactor.toFixed(2)}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschnitt Gewinn/Verlust</CardTitle>
            <BarChart2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <div>
                <div className="text-sm font-medium text-emerald-500">+${averageWin.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Gewinn</p>
              </div>
              <div>
                <div className="text-sm font-medium text-red-500">-${averageLoss.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground">Verlust</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Durchschnitt RR</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{averageRR.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Risk/Reward Verhältnis
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Längste Gewinnsträhne</CardTitle>
            <TrendingUp className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consecutiveWins}</div>
            <p className="text-xs text-muted-foreground">
              Aufeinanderfolgende Gewinne
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Längste Verluststrähne</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{consecutiveLosses}</div>
            <p className="text-xs text-muted-foreground">
              Aufeinanderfolgende Verluste
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profitable Tage</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {profitableDays}/{profitableDays + losingDays}
            </div>
            <p className="text-xs text-muted-foreground">
              {((profitableDays / (profitableDays + losingDays)) * 100).toFixed(1)}% profitable Tage
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Beste/Schlechteste Tage</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="flex justify-between">
              <div>
                <div className="text-sm font-medium text-emerald-500">
                  +${bestDay?.profit.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Bester</p>
              </div>
              <div>
                <div className="text-sm font-medium text-red-500">
                  ${worstDay?.profit.toFixed(2) || '0.00'}
                </div>
                <p className="text-xs text-muted-foreground">Schlechtester</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="symbol">Symbole</TabsTrigger>
          <TabsTrigger value="time">Zeitanalyse</TabsTrigger>
          <TabsTrigger value="risk-reward">Risk/Reward</TabsTrigger>
          <TabsTrigger value="setup">Setups</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <PieChartIcon className="h-4 w-4 mr-2" />
                  Win/Loss Verhältnis
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winLossData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                      >
                        {winLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => [`${value} Trades`, '']} />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Profit/Loss Verteilung
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={profitLossDistribution}
                      margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="group" 
                        tick={{ fill: '#e5e7eb', fontSize: 11 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        tick={{ fill: '#e5e7eb', fontSize: 11 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <Tooltip 
                        formatter={(value, name) => [
                          name === 'count' ? `${value} Trades` : `$${Number(value).toFixed(2)}`, 
                          name === 'count' ? 'Anzahl' : 'Durchschnitt'
                        ]} 
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          borderColor: COLORS.primaryLight,
                          borderRadius: '8px' 
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#e5e7eb' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: 15 }}
                        iconType="circle"
                      />
                      <Bar 
                        dataKey="count" 
                        name="Anzahl Trades" 
                        fill={COLORS.primary}
                        radius={[4, 4, 0, 0]}
                      />
                      <Bar 
                        dataKey="avgProfit" 
                        name="Durchschnitt P&L" 
                        radius={[4, 4, 0, 0]}
                      >
                        {profitLossDistribution.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.avgProfit >= 0 ? COLORS.profit : COLORS.loss} 
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Activity className="h-4 w-4 mr-2" />
                  Long vs. Short Performance
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={tradeTypeData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="type" 
                        tick={{ fill: '#e5e7eb', fontSize: 12 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                      />
                      <YAxis 
                        yAxisId="left" 
                        orientation="left" 
                        stroke={COLORS.primary}
                        tick={{ fill: '#e5e7eb', fontSize: 11 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        label={{ 
                          value: 'Gewinn/Verlust ($)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: '#e5e7eb', fontSize: 12 }
                        }}
                      />
                      <YAxis 
                        yAxisId="right" 
                        orientation="right" 
                        stroke={COLORS.profit}
                        tick={{ fill: '#e5e7eb', fontSize: 11 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        label={{ 
                          value: 'Win Rate (%)', 
                          angle: 90, 
                          position: 'insideRight',
                          style: { textAnchor: 'middle', fill: '#e5e7eb', fontSize: 12 }
                        }}
                      />
                      <Tooltip 
                        formatter={(value, name) => {
                          if (name === 'profit') return [`$${Number(value).toFixed(2)}`, 'Gesamtgewinn'];
                          if (name === 'winRate') return [`${Number(value).toFixed(1)}%`, 'Win Rate'];
                          return [value, name];
                        }}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          borderColor: COLORS.primaryLight,
                          borderRadius: '8px' 
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#e5e7eb' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: 15 }}
                        iconType="circle"
                      />
                      <Bar 
                        yAxisId="left" 
                        dataKey="profit" 
                        name="Gesamtgewinn" 
                        radius={[4, 4, 0, 0]}
                      >
                        {tradeTypeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={entry.profit >= 0 ? COLORS.profit : COLORS.loss} 
                          />
                        ))}
                      </Bar>
                      <Bar 
                        yAxisId="right" 
                        dataKey="winRate" 
                        name="Win Rate (%)" 
                        fill={COLORS.secondary}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  P&L nach Trade Nummer
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={filteredTrades.map((trade, index) => {
                        const totalUpToIndex = filteredTrades
                          .slice(0, index + 1)
                          .reduce((sum, t) => sum + (t.profitLoss || 0), 0);
                          
                        return {
                          index: index + 1,
                          totalPL: totalUpToIndex,
                          tradeResult: trade.profitLoss,
                          isWin: trade.isWin
                        };
                      })}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis 
                        dataKey="index" 
                        tick={{ fill: '#e5e7eb', fontSize: 11 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        label={{ 
                          value: 'Trade Nummer', 
                          position: 'insideBottom',
                          offset: -5,
                          style: { textAnchor: 'middle', fill: '#e5e7eb', fontSize: 12 }
                        }}
                      />
                      <YAxis 
                        tick={{ fill: '#e5e7eb', fontSize: 11 }}
                        tickLine={{ stroke: '#e5e7eb' }}
                        label={{ 
                          value: 'Profit/Loss ($)', 
                          angle: -90, 
                          position: 'insideLeft',
                          style: { textAnchor: 'middle', fill: '#e5e7eb', fontSize: 12 }
                        }}
                      />
                      <Tooltip 
                        formatter={(value) => [`$${Number(value).toFixed(2)}`, '']}
                        contentStyle={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.8)', 
                          borderColor: COLORS.primaryLight,
                          borderRadius: '8px' 
                        }}
                        labelStyle={{ fontWeight: 'bold', color: '#e5e7eb' }}
                      />
                      <Legend 
                        wrapperStyle={{ paddingTop: 15 }}
                        iconType="circle"
                      />
                      <defs>
                        <linearGradient id="colorPL" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor={COLORS.primaryLight} stopOpacity={0.8}/>
                          <stop offset="95%" stopColor={COLORS.primary} stopOpacity={0.2}/>
                        </linearGradient>
                      </defs>
                      <Line 
                        type="monotone" 
                        dataKey="totalPL" 
                        name="Gesamt P&L"
                        stroke={COLORS.primary}
                        strokeWidth={3} 
                        dot={{ r: 2 }} 
                        activeDot={{ r: 5, strokeWidth: 1 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="tradeResult" 
                        name="Trade Ergebnis"
                        stroke={COLORS.accent}
                        strokeWidth={2}
                        dot={(props) => {
                          const { cx, cy, payload } = props;
                          const isWin = payload.isWin;
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={4} 
                              fill={isWin ? COLORS.profit : COLORS.loss}
                              stroke="none"
                            />
                          );
                        }}
                        activeDot={(props) => {
                          const { cx, cy, payload } = props;
                          const isWin = payload.isWin;
                          return (
                            <circle 
                              cx={cx} 
                              cy={cy} 
                              r={6} 
                              fill={isWin ? COLORS.profit : COLORS.loss}
                              stroke="white"
                              strokeWidth={2}
                            />
                          );
                        }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="symbol" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Symbol Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={symbolPerformanceData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="symbol" type="category" width={80} />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'profit') return [`$${value.toFixed(2)}`, 'Gewinn/Verlust'];
                        if (name === 'winRate') return [`${value.toFixed(1)}%`, 'Win Rate'];
                        return [value, name];
                      }} />
                      <Legend />
                      <Bar dataKey="profit" fill="#3b82f6" name="Gewinn/Verlust">
                        {symbolPerformanceData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                      <Bar dataKey="winRate" fill="#8b5cf6" name="Win Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Symbol Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Symbol</th>
                          <th className="px-3 py-3.5 text-right text-sm font-semibold text-foreground">Trades</th>
                          <th className="px-3 py-3.5 text-right text-sm font-semibold text-foreground">Win Rate</th>
                          <th className="px-3 py-3.5 text-right text-sm font-semibold text-foreground">P&L</th>
                          <th className="px-3 py-3.5 text-right text-sm font-semibold text-foreground">Durchschnitt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-transparent">
                        {symbolPerformanceData.map((item, index) => (
                          <tr key={index}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">{item.symbol}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-right">{item.trades}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-right">{item.winRate.toFixed(1)}%</td>
                            <td className={`whitespace-nowrap px-3 py-4 text-sm text-right ${item.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              ${item.profit.toFixed(2)}
                            </td>
                            <td className={`whitespace-nowrap px-3 py-4 text-sm text-right ${(item.profit / item.trades) >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              ${(item.profit / item.trades).toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="time" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Performance nach Wochentag
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceByDay}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
                      <Legend />
                      <Bar dataKey="profit" fill="#3b82f6" name="Profit/Loss">
                        {performanceByDay.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                      <Bar dataKey="avgProfit" fill="#8b5cf6" name="Durchschnitt" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Clock className="h-4 w-4 mr-2" />
                  Performance nach Uhrzeit
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={performanceByTime}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="timeSlot" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value.toFixed(2)}`, '']} />
                      <Legend />
                      <Bar dataKey="profit" fill="#3b82f6" name="Profit/Loss">
                        {performanceByTime.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                      <Bar dataKey="avgProfit" fill="#8b5cf6" name="Durchschnitt pro Trade" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Tagesperformance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={Object.entries(dayPerformance).map(([date, data]) => ({
                        date,
                        profit: data.profit,
                        winRate: (data.wins / data.trades) * 100
                      }))}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" angle={-45} textAnchor="end" height={80} />
                      <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                      <YAxis yAxisId="right" orientation="right" stroke="#10b981" />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'profit') return [`$${value.toFixed(2)}`, 'P&L'];
                        if (name === 'winRate') return [`${value.toFixed(1)}%`, 'Win Rate'];
                        return [value, name];
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="profit" fill="#3b82f6" name="P&L">
                        {Object.entries(dayPerformance).map(([date, data], index) => (
                          <Cell key={`cell-${index}`} fill={data.profit >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                      <Bar yAxisId="right" dataKey="winRate" fill="#8b5cf6" name="Win Rate %" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="risk-reward" className="space-y-4">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Target className="h-4 w-4 mr-2" />
                  Risk/Reward Verteilung
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={riskRewardData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="group" />
                      <YAxis yAxisId="left" orientation="left" stroke="#3b82f6" />
                      <YAxis yAxisId="right" orientation="right" stroke="#ef4444" />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'count') return [`${value} Trades`, 'Anzahl'];
                        return [`$${value.toFixed(2)}`, 'Durchschnitt P&L'];
                      }} />
                      <Legend />
                      <Bar yAxisId="left" dataKey="count" fill="#3b82f6" name="Anzahl Trades" />
                      <Bar yAxisId="right" dataKey="avgProfit" fill="#ef4444" name="Durchschnitt P&L" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Risk/Reward vs. Win Rate
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart
                      data={riskRewardData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="group" />
                      <YAxis />
                      <Tooltip formatter={(value) => [`$${value}`, '']} />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="totalProfit" 
                        stroke="#3b82f6" 
                        name="Gesamtgewinn" 
                        activeDot={{ r: 8 }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="avgProfit" 
                        stroke="#10b981" 
                        name="Durchschnitt pro Trade" 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        
        <TabsContent value="setup" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Setup Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-8">
                <div className="h-[400px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={setupPerformance.slice(0, 10)} // Begrenzen auf Top 10
                      margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" />
                      <YAxis dataKey="setup" type="category" width={100} />
                      <Tooltip formatter={(value, name) => {
                        if (name === 'profit') return [`$${value.toFixed(2)}`, 'Gewinn/Verlust'];
                        if (name === 'winRate') return [`${value.toFixed(1)}%`, 'Win Rate'];
                        return [value, name];
                      }} />
                      <Legend />
                      <Bar dataKey="profit" fill="#3b82f6" name="Gewinn/Verlust">
                        {setupPerformance.slice(0, 10).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.profit >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                      <Bar dataKey="winRate" fill="#8b5cf6" name="Win Rate (%)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                
                <div>
                  <h3 className="text-lg font-medium mb-2">Setup Details</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-border">
                      <thead>
                        <tr>
                          <th className="px-3 py-3.5 text-left text-sm font-semibold text-foreground">Setup</th>
                          <th className="px-3 py-3.5 text-right text-sm font-semibold text-foreground">Trades</th>
                          <th className="px-3 py-3.5 text-right text-sm font-semibold text-foreground">Win Rate</th>
                          <th className="px-3 py-3.5 text-right text-sm font-semibold text-foreground">P&L</th>
                          <th className="px-3 py-3.5 text-right text-sm font-semibold text-foreground">Durchschnitt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border bg-transparent">
                        {setupPerformance.map((item, index) => (
                          <tr key={index}>
                            <td className="whitespace-nowrap px-3 py-4 text-sm">{item.setup}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-right">{item.count}</td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-right">{item.winRate.toFixed(1)}%</td>
                            <td className={`whitespace-nowrap px-3 py-4 text-sm text-right ${item.profit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              ${item.profit.toFixed(2)}
                            </td>
                            <td className={`whitespace-nowrap px-3 py-4 text-sm text-right ${item.avgProfit >= 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                              ${item.avgProfit.toFixed(2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}