import { useState, useEffect } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  Popover,
  PopoverContent,
  PopoverTrigger
} from "@/components/ui/popover";
import { Trade, accountTypes } from "@shared/schema";
import { formatDate, formatTime, getTodayDates } from "@/lib/utils";
import { BadgeWinLoss } from "@/components/ui/badge-win-loss";
import { BadgeTrend } from "@/components/ui/badge-trend";
import { Skeleton } from "@/components/ui/skeleton";
import { Filter, SlidersHorizontal, RefreshCw } from "lucide-react";
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
  
  // Filter state
  const [filters, setFilters] = useState({
    symbols: new Set<string>(),
    setups: new Set<string>(),
    mainTrends: new Set<string>(),
    internalTrends: new Set<string>(),
    entryTypes: new Set<string>(),
    accountTypes: new Set<string>(),
    isWin: null as boolean | null,
    startDate: new Date(),
    endDate: new Date()
  });
  
  // Unique values for filters
  const uniqueValues = {
    symbols: Array.from(new Set(trades.map(t => t.symbol).filter(Boolean))) as string[],
    setups: Array.from(new Set(trades.map(t => t.setup).filter(Boolean))) as string[],
    mainTrends: Array.from(new Set(trades.map(t => t.mainTrendM15).filter(Boolean))) as string[],
    internalTrends: Array.from(new Set(trades.map(t => t.internalTrendM5).filter(Boolean))) as string[],
    entryTypes: Array.from(new Set(trades.map(t => t.entryType).filter(Boolean))) as string[]
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
    
    // Win/Loss filter
    if (filters.isWin !== null && trade.isWin !== filters.isWin) {
      return false;
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
      isWin: null,
      startDate: new Date(),
      endDate: new Date()
    });
  };
  
  // Die Funktion für Trend-Farben wurde zugunsten der BadgeTrend-Komponente entfernt
  
  return (
    <Card className="mb-6 bg-card overflow-hidden">
      <CardHeader className="flex-row justify-between items-center py-4 border-b border-border">
        <CardTitle>Trades</CardTitle>
        <div className="flex gap-2">
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
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left whitespace-nowrap">
                Datum
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <div className="flex items-center gap-1">
                  Kontoart
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1">
                        <Filter className="h-3 w-3" />
                      </Button>
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
                </div>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <div className="flex items-center gap-1">
                  Symbol
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1">
                        <Filter className="h-3 w-3" />
                      </Button>
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
                </div>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <div className="flex items-center gap-1">
                  Setup
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1">
                        <Filter className="h-3 w-3" />
                      </Button>
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
                </div>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <div className="flex items-center gap-1">
                  M15 Trend
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1">
                        <Filter className="h-3 w-3" />
                      </Button>
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
                </div>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <div className="flex items-center gap-1">
                  M5 Trend
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1">
                        <Filter className="h-3 w-3" />
                      </Button>
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
                </div>
              </th>
              <th className="p-3 text-left whitespace-nowrap">
                <div className="flex items-center gap-1">
                  Einstieg
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1">
                        <Filter className="h-3 w-3" />
                      </Button>
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
                </div>
              </th>
              <th className="p-3 text-left whitespace-nowrap">RR</th>
              <th className="p-3 text-left whitespace-nowrap">P/L ($)</th>
              <th className="p-3 text-left whitespace-nowrap">
                <div className="flex items-center gap-1">
                  Status
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-6 w-6 p-0 ml-1">
                        <Filter className="h-3 w-3" />
                      </Button>
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
                  <td className="p-3">
                    {formatDate(trade.date)} <span className="text-muted-foreground text-xs">{formatTime(trade.date)}</span>
                  </td>
                  <td className="p-3">{trade.symbol}</td>
                  <td className="p-3">{trade.setup}</td>
                  <td className="p-3">
                    {trade.mainTrendM15 ? <BadgeTrend trend={trade.mainTrendM15} /> : '-'}
                  </td>
                  <td className="p-3">
                    {trade.internalTrendM5 ? <BadgeTrend trend={trade.internalTrendM5} /> : '-'}
                  </td>
                  <td className="p-3">
                    {trade.entryType ? <BadgeTrend trend={trade.entryType} /> : '-'}
                  </td>
                  <td className="p-3">{trade.rrAchieved}</td>
                  <td className="p-3">
                    <span className={`${trade.profitLoss && trade.profitLoss > 0 ? 'text-green-500' : trade.profitLoss && trade.profitLoss < 0 ? 'text-red-500' : ''}`}>
                      {trade.profitLoss ? `${trade.profitLoss > 0 ? '+' : ''}${trade.profitLoss.toFixed(2)}` : '-'}
                    </span>
                  </td>
                  <td className="p-3">
                    <BadgeWinLoss isWin={trade.isWin} />
                  </td>
                </tr>
              ))
            ) : (
              // Empty state
              <tr>
                <td colSpan={9} className="p-6 text-center text-muted-foreground">
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
