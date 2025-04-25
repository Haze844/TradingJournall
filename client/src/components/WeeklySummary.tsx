import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PerformanceChart, SetupWinRateChart } from "@/components/Charts";
import { formatDate } from "@/lib/utils";

interface WeeklySummaryProps {
  userId: number;
  weekStart: Date;
  weekEnd: Date;
}

export default function WeeklySummary({ userId, weekStart, weekEnd }: WeeklySummaryProps) {
  // Fetch weekly summary
  const { 
    data: summary,
    isLoading: summaryLoading,
  } = useQuery({
    queryKey: ["/api/weekly-summary", userId, weekStart, weekEnd],
    queryFn: async () => {
      const response = await fetch(
        `/api/weekly-summary?userId=${userId}&weekStart=${weekStart.toISOString()}&weekEnd=${weekEnd.toISOString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch weekly summary");
      }
      return response.json();
    },
  });

  // Fetch performance data
  const {
    data: performanceData = [],
    isLoading: performanceLoading,
  } = useQuery({
    queryKey: ["/api/performance-data", userId, weekStart, weekEnd],
    queryFn: async () => {
      const response = await fetch(
        `/api/performance-data?userId=${userId}&startDate=${weekStart.toISOString()}&endDate=${weekEnd.toISOString()}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch performance data");
      }
      return response.json();
    },
  });

  // Fetch setup win rates
  const {
    data: setupWinRates = [],
    isLoading: setupWinRatesLoading,
  } = useQuery({
    queryKey: ["/api/setup-win-rates", userId],
    queryFn: async () => {
      const response = await fetch(`/api/setup-win-rates?userId=${userId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch setup win rates");
      }
      return response.json();
    },
  });

  return (
    <Card className="bg-card">
      <CardHeader className="border-b border-border">
        <CardTitle>Wochenzusammenfassung</CardTitle>
        <span className="text-sm text-muted-foreground">
          {formatDate(weekStart)} bis {formatDate(weekEnd)}
        </span>
      </CardHeader>
      
      <CardContent className="pt-4">
        <div className="grid grid-cols-3 gap-4 mb-4">
          <div className="bg-muted rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">RR Gesamt</div>
            {summaryLoading ? (
              <Skeleton className="h-7 w-14" />
            ) : (
              <div className="font-bold text-lg">{summary?.totalRR?.toFixed(1) || "0.0"}</div>
            )}
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">Anzahl Trades</div>
            {summaryLoading ? (
              <Skeleton className="h-7 w-8" />
            ) : (
              <div className="font-bold text-lg">{summary?.tradeCount || 0}</div>
            )}
          </div>
          
          <div className="bg-muted rounded-lg p-3">
            <div className="text-sm text-muted-foreground mb-1">Trefferquote</div>
            {summaryLoading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <div className="font-bold text-lg">{(summary?.winRate || 0).toFixed(1)}%</div>
            )}
          </div>
        </div>
        
        <div className="bg-muted p-4 rounded-lg mb-4">
          {performanceLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="h-64">
              <PerformanceChart data={performanceData} />
            </div>
          )}
        </div>
        
        <div className="bg-muted p-4 rounded-lg">
          {setupWinRatesLoading ? (
            <div className="h-48 flex items-center justify-center">
              <Skeleton className="h-40 w-full" />
            </div>
          ) : (
            <div className="h-64">
              <SetupWinRateChart data={setupWinRates} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
