import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Trade, setupTypes, trendTypes, entryLevelTypes } from "@shared/schema";
import { BadgeWinLoss } from "@/components/ui/badge-win-loss";
import { BadgeTrend } from "@/components/ui/badge-trend";
import { formatDate } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import ChartImageUpload from "./ChartImageUpload";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pencil, Save, X } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TradeDetailProps {
  selectedTrade: Trade | null;
}

export default function TradeDetail({ selectedTrade }: TradeDetailProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const [editingSetup, setEditingSetup] = useState("");
  const [editingMainTrend, setEditingMainTrend] = useState("");
  const [editingInternalTrend, setEditingInternalTrend] = useState("");
  const [editingEntryLevel, setEditingEntryLevel] = useState("");
  const [editingProfitLoss, setEditingProfitLoss] = useState<number | undefined>(undefined);

  // Mutation für das Update der Trade-Daten
  const updateTradeMutation = useMutation({
    mutationFn: async (updateData: Partial<Trade> & { id: number }) => {
      const { id, ...data } = updateData;
      await apiRequest("PUT", `/api/trades/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Trade aktualisiert",
        description: "Die Trade-Daten wurden erfolgreich aktualisiert."
      });
      setEditMode(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Aktualisieren",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Starte den Edit-Modus
  const startEditMode = () => {
    if (!selectedTrade) return;
    
    setEditingSetup(selectedTrade.setup || '');
    setEditingMainTrend(selectedTrade.mainTrendM15 || '');
    setEditingInternalTrend(selectedTrade.internalTrendM5 || '');
    setEditingEntryLevel(selectedTrade.entryLevel || '');
    setEditingProfitLoss(selectedTrade.profitLoss || 0);
    setEditMode(true);
  };

  // Cancel Edit Mode
  const cancelEditMode = () => {
    setEditMode(false);
  };

  // Speichern der Änderungen
  const saveChanges = () => {
    if (!selectedTrade) return;
    
    updateTradeMutation.mutate({
      id: selectedTrade.id,
      setup: editingSetup,
      mainTrendM15: editingMainTrend,
      internalTrendM5: editingInternalTrend,
      entryLevel: editingEntryLevel,
      profitLoss: editingProfitLoss
    });
  };

  // Mutation für das Update des Charts
  const updateChartImageMutation = useMutation({
    mutationFn: async ({ id, chartImage }: { id: number, chartImage: string | null }) => {
      await apiRequest("PUT", `/api/trades/${id}`, { chartImage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      toast({
        title: "Chart aktualisiert",
        description: "Der TradingView-Chart wurde erfolgreich gespeichert."
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Speichern des Charts",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  // Handler für Chart-Änderungen
  const handleChartImageChange = (base64Image: string | null) => {
    if (!selectedTrade) return;
    
    updateChartImageMutation.mutate({
      id: selectedTrade.id,
      chartImage: base64Image
    });
  };

  // Funktion entfernt, da wir jetzt BadgeTrend verwenden

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
          {/* Action Buttons */}
          <div className="flex justify-end mb-4">
            {!editMode ? (
              <Button variant="outline" size="sm" onClick={startEditMode} className="flex items-center">
                <Pencil className="h-4 w-4 mr-1" />
                Bearbeiten
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="default" size="sm" onClick={saveChanges} className="flex items-center">
                  <Save className="h-4 w-4 mr-1" />
                  Speichern
                </Button>
                <Button variant="outline" size="sm" onClick={cancelEditMode} className="flex items-center">
                  <X className="h-4 w-4 mr-1" />
                  Abbrechen
                </Button>
              </div>
            )}
          </div>
          
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
              {editMode ? (
                <Select value={editingSetup} onValueChange={setEditingSetup}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Setup auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {setupTypes.map((setup) => (
                      <SelectItem key={setup} value={setup}>
                        {setup}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-bold">{selectedTrade.setup}</div>
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Einstieg</div>
              <BadgeTrend trend={selectedTrade.entryType || '-'} />
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Haupttrend M15</div>
              {editMode ? (
                <Select value={editingMainTrend} onValueChange={setEditingMainTrend}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Trend auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {trendTypes.map((trend) => (
                      <SelectItem key={trend} value={trend}>
                        {trend}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <BadgeTrend trend={selectedTrade.mainTrendM15 || '-'} />
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Interner Trend M5</div>
              {editMode ? (
                <Select value={editingInternalTrend} onValueChange={setEditingInternalTrend}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Trend auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {trendTypes.map((trend) => (
                      <SelectItem key={trend} value={trend}>
                        {trend}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <BadgeTrend trend={selectedTrade.internalTrendM5 || '-'} />
              )}
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Einstiegslvl</div>
              {editMode ? (
                <Select value={editingEntryLevel} onValueChange={setEditingEntryLevel}>
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Level auswählen" />
                  </SelectTrigger>
                  <SelectContent>
                    {entryLevelTypes.map((level) => (
                      <SelectItem key={level} value={level}>
                        {level}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                <div className="font-bold">{selectedTrade.entryLevel}</div>
              )}
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
            <div>
              <div className="text-sm text-muted-foreground mb-1">Ergebnis in $</div>
              {editMode ? (
                <Input
                  type="number"
                  step="0.01"
                  className="h-8"
                  value={editingProfitLoss}
                  onChange={(e) => setEditingProfitLoss(parseFloat(e.target.value))}
                  placeholder="0.00"
                />
              ) : (
                <div className={`font-bold ${selectedTrade.profitLoss && selectedTrade.profitLoss > 0 ? 'text-green-500' : selectedTrade.profitLoss && selectedTrade.profitLoss < 0 ? 'text-red-500' : ''}`}>
                  {selectedTrade.profitLoss ? `${selectedTrade.profitLoss > 0 ? '+' : ''}${selectedTrade.profitLoss.toFixed(2)} $` : '-'}
                </div>
              )}
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm text-muted-foreground mb-2">GPT Feedback</div>
            <div className="bg-muted p-3 rounded-lg text-sm">
              {selectedTrade.gptFeedback || "Kein Feedback verfügbar."}
            </div>
          </div>
          
          {/* TradingView Chart Upload */}
          <div className="border-t border-border pt-4 mt-6">
            <ChartImageUpload 
              existingImage={selectedTrade.chartImage || null} 
              onChange={handleChartImageChange}
            />
          </div>
        </CardContent>
      )}
    </Card>
  );
}
