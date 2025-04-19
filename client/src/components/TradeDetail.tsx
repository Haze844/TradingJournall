import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trade } from "@shared/schema";
import { BadgeWinLoss } from "@/components/ui/badge-win-loss";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeDetailProps {
  selectedTrade: Trade | null;
}

export default function TradeDetail({ selectedTrade }: TradeDetailProps) {
  // Trend text color class
  const getTrendColorClass = (trend: string) => {
    return trend === "Long" ? "text-green-500" : "text-red-500";
  };

  return (
    <Card className="bg-card overflow-hidden mb-6 sticky top-4">
      <CardHeader className="border-b border-border">
        <CardTitle>Trade Details</CardTitle>
      </CardHeader>

      {!selectedTrade ? (
        // Empty state
        <div className="p-6 text-center text-muted-foreground">
          <i className="fas fa-mouse-pointer text-3xl mb-2"></i>
          <p>Wähle einen Trade aus, um Details zu sehen</p>
        </div>
      ) : (
        // Trade details
        <CardContent className="p-4">
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Datum</div>
              <div className="font-bold">{formatDate(selectedTrade.date)}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Symbol</div>
              <div className="font-bold">{selectedTrade.symbol}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Setup</div>
              <div className="font-bold">{selectedTrade.setup}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Einstieg</div>
              <div className={`font-bold ${getTrendColorClass(selectedTrade.entryType)}`}>
                {selectedTrade.entryType}
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Haupttrend M15</div>
              <div className={`font-bold ${getTrendColorClass(selectedTrade.mainTrendM15)}`}>
                {selectedTrade.mainTrendM15}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Interner Trend M5</div>
              <div className={`font-bold ${getTrendColorClass(selectedTrade.internalTrendM5)}`}>
                {selectedTrade.internalTrendM5}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Einstiegslvl</div>
              <div className="font-bold">{selectedTrade.entryLevel}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Liquidation</div>
              <div className="font-bold">{selectedTrade.liquidation}</div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-1">Location</div>
            <div className="font-bold">{selectedTrade.location}</div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">RR Erreicht</div>
              <div className="font-bold">{selectedTrade.rrAchieved}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">RR Potenzial</div>
              <div className="font-bold">{selectedTrade.rrPotential}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Status</div>
              <BadgeWinLoss isWin={selectedTrade.isWin} />
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">GPT Feedback</div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              {selectedTrade.gptFeedback || "Kein Feedback verfügbar."}
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}
