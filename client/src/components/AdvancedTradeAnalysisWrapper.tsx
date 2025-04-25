import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trade } from '@shared/schema';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import AdvancedTradeAnalysis from './AdvancedTradeAnalysis';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

// Diese Komponente dient als Wrapper für AdvancedTradeAnalysis
// Sie lädt Trades des Benutzers und ermöglicht die Auswahl eines Trades für die Analyse
export default function AdvancedTradeAnalysisWrapper({ userId }: { userId: number }) {
  const [selectedTradeId, setSelectedTradeId] = useState<number | null>(null);
  
  // Lade Trades des Benutzers
  const { data: trades = [], isLoading } = useQuery<Trade[]>({
    queryKey: ['/api/trades', userId],
    queryFn: async () => {
      const response = await fetch(`/api/trades?userId=${userId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trades');
      }
      return response.json();
    },
  });

  // Finde den ausgewählten Trade
  const selectedTrade = trades.find(trade => trade.id === selectedTradeId) || null;

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Lade-Information, wenn keine Trades vorhanden sind */}
      {trades.length === 0 ? (
        <div className="text-center py-4">
          <p className="text-muted-foreground">
            Keine Trades gefunden. Erstelle zuerst einen Trade für eine KI-Analyse.
          </p>
        </div>
      ) : (
        <>
          {/* Trade Auswahl */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Trade auswählen</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {trades.slice(0, 6).map((trade) => (
                  <div
                    key={trade.id}
                    className={`
                      border p-2 rounded-md cursor-pointer text-sm transition-all
                      ${selectedTradeId === trade.id ? 'border-primary bg-primary/5' : 'border-border'}
                    `}
                    onClick={() => setSelectedTradeId(trade.id)}
                  >
                    <div className="font-medium mb-1">
                      {trade.symbol || 'Kein Symbol'} 
                      {trade.setup && <span className="text-muted-foreground ml-1">({trade.setup})</span>}
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">
                        {trade.date ? new Date(trade.date).toLocaleDateString() : 'Kein Datum'}
                      </span>
                      <span className={trade.isWin ? 'text-green-500' : 'text-red-500'}>
                        {trade.isWin ? 'Gewinn' : 'Verlust'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              {trades.length > 6 && (
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Zeige die neuesten 6 von {trades.length} Trades
                </p>
              )}
            </CardContent>
          </Card>

          {/* Advanced Analysis */}
          <AdvancedTradeAnalysis trade={selectedTrade} />
        </>
      )}
    </div>
  );
}