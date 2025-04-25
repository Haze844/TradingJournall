import { useState } from "react";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trade } from "@shared/schema";
import { formatDate, formatTime } from "@/lib/utils";
import { BadgeWinLoss } from "@/components/ui/badge-win-loss";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeTableProps {
  trades: Trade[];
  isLoading: boolean;
  onTradeSelect: (trade: Trade) => void;
}

export default function TradeTable({ trades = [], isLoading, onTradeSelect }: TradeTableProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const tradesPerPage = 5;
  
  // Calculate pagination
  const indexOfLastTrade = currentPage * tradesPerPage;
  const indexOfFirstTrade = indexOfLastTrade - tradesPerPage;
  const currentTrades = trades.slice(indexOfFirstTrade, indexOfLastTrade);
  const totalPages = Math.ceil(trades.length / tradesPerPage);
  
  // Handle page change
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);
  
  // Trend text color class
  const getTrendColorClass = (trend: string) => {
    return trend === "Long" ? "text-green-500" : "text-red-500";
  };
  
  return (
    <Card className="mb-6 bg-card overflow-hidden">
      <CardHeader className="flex-row justify-between items-center py-4 border-b border-border">
        <CardTitle>Trades</CardTitle>
        <div className="flex gap-2">
          <Button variant="secondary" size="icon">
            <i className="fas fa-filter"></i>
          </Button>
          <Button variant="secondary" size="icon">
            <i className="fas fa-download"></i>
          </Button>
        </div>
      </CardHeader>
      
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 sticky top-0 z-10">
            <tr>
              <th className="p-3 text-left">Datum</th>
              <th className="p-3 text-left">Symbol</th>
              <th className="p-3 text-left">Setup</th>
              <th className="p-3 text-left">M15 Trend</th>
              <th className="p-3 text-left">M5 Trend</th>
              <th className="p-3 text-left">Einstieg</th>
              <th className="p-3 text-left">RR</th>
              <th className="p-3 text-left">P/L ($)</th>
              <th className="p-3 text-left">Status</th>
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
                    <span className={getTrendColorClass(trade.mainTrendM15)}>{trade.mainTrendM15}</span>
                  </td>
                  <td className="p-3">
                    <span className={getTrendColorClass(trade.internalTrendM5)}>{trade.internalTrendM5}</span>
                  </td>
                  <td className="p-3">
                    <span className={getTrendColorClass(trade.entryType)}>{trade.entryType}</span>
                  </td>
                  <td className="p-3">{trade.rrAchieved}</td>
                  <td className="p-3">
                    <span className={`${trade.profitLoss > 0 ? 'text-green-500' : trade.profitLoss < 0 ? 'text-red-500' : ''}`}>
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
                <td colSpan={8} className="p-6 text-center text-muted-foreground">
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
