import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Trade, 
  setupTypes, 
  trendTypes, 
  entryLevelTypes,
  simpleTrendTypes,
  structureTypes,
  timeframeTypes,
  liquidationTypes,
  unmitZoneTypes,
  marketPhaseTypes,
  rrValues 
} from "@shared/schema";
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
  
  // Neue Felder
  const [editingTrend, setEditingTrend] = useState("");
  const [editingInternalTrendNew, setEditingInternalTrendNew] = useState("");
  const [editingMicroTrend, setEditingMicroTrend] = useState("");
  const [editingStructure, setEditingStructure] = useState("");
  const [editingTimeframeEntry, setEditingTimeframeEntry] = useState("");
  const [editingLiquidation, setEditingLiquidation] = useState("");
  const [editingUnmitZone, setEditingUnmitZone] = useState("");
  const [editingRangePoints, setEditingRangePoints] = useState<number | undefined>(undefined);
  const [editingMarketPhase, setEditingMarketPhase] = useState("");
  const [editingRRAchieved, setEditingRRAchieved] = useState<number>(0);
  const [editingLocation, setEditingLocation] = useState("");
  const [editingRRPotential, setEditingRRPotential] = useState<number>(0);

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
    
    // Bestehende Felder
    setEditingSetup(selectedTrade.setup || '');
    setEditingMainTrend(selectedTrade.mainTrendM15 || '');
    setEditingInternalTrend(selectedTrade.internalTrendM5 || '');
    setEditingEntryLevel(selectedTrade.entryLevel || '');
    setEditingProfitLoss(selectedTrade.profitLoss || 0);
    
    // Neue Felder
    setEditingTrend(selectedTrade.trend || '');
    setEditingInternalTrendNew(selectedTrade.internalTrend || '');
    setEditingMicroTrend(selectedTrade.microTrend || '');
    setEditingStructure(selectedTrade.structure || '');
    setEditingTimeframeEntry(selectedTrade.timeframeEntry || '');
    setEditingLiquidation(selectedTrade.liquidation || '');
    setEditingUnmitZone(selectedTrade.unmitZone || '');
    // Wichtig: Hier prüfen wir, ob rangePoints einen definierten Wert hat
    setEditingRangePoints(selectedTrade.rangePoints !== undefined && selectedTrade.rangePoints !== null ? selectedTrade.rangePoints : undefined);
    setEditingMarketPhase(selectedTrade.marketPhase || '');
    setEditingRRAchieved(selectedTrade.rrAchieved || 0);
    setEditingRRPotential(selectedTrade.rrPotential || 0);
    setEditingLocation(selectedTrade.location || '');
    
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
      // Bestehende Felder
      setup: editingSetup,
      mainTrendM15: editingMainTrend,
      internalTrendM5: editingInternalTrend,
      entryLevel: editingEntryLevel,
      profitLoss: editingProfitLoss,
      
      // Neue Felder
      trend: editingTrend,
      internalTrend: editingInternalTrendNew,
      microTrend: editingMicroTrend,
      structure: editingStructure,
      timeframeEntry: editingTimeframeEntry,
      liquidation: editingLiquidation,
      unmitZone: editingUnmitZone,
      rangePoints: editingRangePoints,
      marketPhase: editingMarketPhase,
      rrAchieved: editingRRAchieved,
      rrPotential: editingRRPotential,
      location: editingLocation
    });
  };

  // Mutation für das Update des Charts
  const updateChartImageMutation = useMutation({
    mutationFn: async ({ id, chartImage, userId }: { id: number, chartImage: string | null, userId: number | null }) => {
      await apiRequest("PUT", `/api/trades/${id}`, { chartImage, userId: userId || 2 });
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
      chartImage: base64Image,
      userId: selectedTrade.userId || 2 // Wichtig: userId hinzufügen, Fallback auf 2 (Mo) falls nicht gesetzt
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
          
          {/* Hauptinformationen in einer Zeile */}
          <div className="flex items-center justify-between border-b border-border pb-2 mb-3">
            <div className="flex items-center space-x-3">
              <div>
                <div className="text-xs text-muted-foreground">Datum</div>
                <div className="font-bold text-sm">{formatDate(selectedTrade.date)}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">Symbol</div>
                <div className="font-bold text-sm">{selectedTrade.symbol}</div>
              </div>
              <div>
                <div className="text-xs text-muted-foreground">RR</div>
                <div className="font-bold text-sm">{selectedTrade.rrAchieved || '-'}</div>
              </div>
            </div>
            <div>
              <BadgeWinLoss isWin={selectedTrade.isWin} />
              <span className={`ml-2 font-bold ${selectedTrade.profitLoss && selectedTrade.profitLoss > 0 ? 'text-green-500' : selectedTrade.profitLoss && selectedTrade.profitLoss < 0 ? 'text-red-500' : ''}`}>
                {selectedTrade.profitLoss ? `${selectedTrade.profitLoss > 0 ? '+' : ''}$${selectedTrade.profitLoss.toFixed(2)}` : '-'}
              </span>
            </div>
          </div>
          
          {/* Drei Spalten für die wichtigsten Informationen */}
          <div className="grid grid-cols-3 gap-3 mb-3">
            {/* Spalte 1: Setup und Trends */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Setup &amp; Einstieg</div>
                <div className="space-y-1.5">
                  <div>
                    <div className="text-xs text-muted-foreground">Setup</div>
                    {editMode ? (
                      <Select value={editingSetup} onValueChange={setEditingSetup}>
                        <SelectTrigger className="h-7 text-xs">
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
                      <div className="font-medium text-sm">{selectedTrade.setup}</div>
                    )}
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Einstieg</div>
                    {editMode ? (
                      <Select value={editingEntryLevel} onValueChange={setEditingEntryLevel}>
                        <SelectTrigger className="h-7 text-xs">
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
                      <div className="font-medium text-sm">
                        <BadgeTrend trend={selectedTrade.entryType || '-'} size="sm" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Spalte 2: Trends */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Trends</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">Trend</div>
                      {editMode ? (
                        <Select value={editingTrend} onValueChange={setEditingTrend}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Trend" />
                          </SelectTrigger>
                          <SelectContent>
                            {simpleTrendTypes.map((trend) => (
                              <SelectItem key={trend} value={trend}>
                                {trend}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <BadgeTrend trend={selectedTrade.trend || '-'} size="sm" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Int.</div>
                      {editMode ? (
                        <Select value={editingInternalTrendNew} onValueChange={setEditingInternalTrendNew}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Int." />
                          </SelectTrigger>
                          <SelectContent>
                            {simpleTrendTypes.map((trend) => (
                              <SelectItem key={trend} value={trend}>
                                {trend}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <BadgeTrend trend={selectedTrade.internalTrend || '-'} size="sm" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Micro</div>
                      {editMode ? (
                        <Select value={editingMicroTrend} onValueChange={setEditingMicroTrend}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Micro" />
                          </SelectTrigger>
                          <SelectContent>
                            {simpleTrendTypes.map((trend) => (
                              <SelectItem key={trend} value={trend}>
                                {trend}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <BadgeTrend trend={selectedTrade.microTrend || '-'} size="sm" />
                      )}
                    </div>
                  </div>
                  <div className="flex justify-between">
                    <div>
                      <div className="text-xs text-muted-foreground">M15</div>
                      {editMode ? (
                        <Select value={editingMainTrend} onValueChange={setEditingMainTrend}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="M15" />
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
                        <BadgeTrend trend={selectedTrade.mainTrendM15 || '-'} size="sm" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">M5</div>
                      {editMode ? (
                        <Select value={editingInternalTrend} onValueChange={setEditingInternalTrend}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="M5" />
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
                        <BadgeTrend trend={selectedTrade.internalTrendM5 || '-'} size="sm" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Spalte 3: Location und Liquidation */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Position &amp; Struktur</div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Location</div>
                      {editMode ? (
                        <Select value={editingLocation} onValueChange={setEditingLocation}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Location" />
                          </SelectTrigger>
                          <SelectContent>
                            {['FVG', 'FVG Sweep', 'Micro FVG', 'Micro FVG Sweep', 'Wick', 'BOS', 'Delivery'].map((loc) => (
                              <SelectItem key={loc} value={loc}>
                                {loc}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.location || '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Struktur</div>
                      {editMode ? (
                        <Select value={editingStructure} onValueChange={setEditingStructure}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Struktur" />
                          </SelectTrigger>
                          <SelectContent>
                            {structureTypes.map((structure) => (
                              <SelectItem key={structure} value={structure}>
                                {structure}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.structure || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Liquidation</div>
                      {editMode ? (
                        <Select value={editingLiquidation} onValueChange={setEditingLiquidation}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Liquidation" />
                          </SelectTrigger>
                          <SelectContent>
                            {liquidationTypes.map((liq) => (
                              <SelectItem key={liq} value={liq}>
                                {liq}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.liquidation || '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">TF Entry</div>
                      {editMode ? (
                        <Select value={editingTimeframeEntry} onValueChange={setEditingTimeframeEntry}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="TF Entry" />
                          </SelectTrigger>
                          <SelectContent>
                            {timeframeTypes.map((tf) => (
                              <SelectItem key={tf} value={tf}>
                                {tf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.timeframeEntry || '-'}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Weitere Details in 2 Spalten */}
          <div className="grid grid-cols-2 gap-3">
            {/* Linke Spalte - Marktzonen */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Marktzonen</div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Marktphase</div>
                      {editMode ? (
                        <Select value={editingMarketPhase} onValueChange={setEditingMarketPhase}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Phase" />
                          </SelectTrigger>
                          <SelectContent>
                            {marketPhaseTypes.map((phase) => (
                              <SelectItem key={phase} value={phase}>
                                {phase}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.marketPhase || '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Unmit. Zone</div>
                      {editMode ? (
                        <Select value={editingUnmitZone} onValueChange={setEditingUnmitZone}>
                          <SelectTrigger className="h-7 text-xs">
                            <SelectValue placeholder="Zone" />
                          </SelectTrigger>
                          <SelectContent>
                            {unmitZoneTypes.map((zone) => (
                              <SelectItem key={zone} value={zone}>
                                {zone}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.unmitZone || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Range Punkte</div>
                    {editMode ? (
                      <Input
                        type="number"
                        value={editingRangePoints === undefined ? "" : editingRangePoints}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                          setEditingRangePoints(value);
                        }}
                        className="h-7 text-xs"
                        min="0"
                      />
                    ) : (
                      <div className="font-medium text-sm">{selectedTrade.rangePoints !== undefined && selectedTrade.rangePoints !== null ? selectedTrade.rangePoints : '-'}</div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rechte Spalte - Ergebnis */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Ergebnis &amp; RR</div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">RR Achieved</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap">
                          {[-1, 1, 2, 3, 4, 5, 6, 7].map(val => (
                            <Button
                              key={val}
                              type="button"
                              variant={editingRRAchieved === val ? "default" : "outline"}
                              size="sm"
                              className={`p-1 h-6 text-[10px] flex-1 ${val === -1 ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : ''}`}
                              onClick={() => setEditingRRAchieved(val)}
                            >
                              {val}R
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.rrAchieved ? `${selectedTrade.rrAchieved}R` : '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">RR Potential</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap">
                          {[1, 2, 3, 4, 5, 6, 7].map(val => (
                            <Button
                              key={val}
                              type="button"
                              variant={editingRRPotential === val ? "default" : "outline"}
                              size="sm"
                              className="p-1 h-6 text-[10px] flex-1"
                              onClick={() => setEditingRRPotential(val)}
                            >
                              {val}R
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.rrPotential ? `${selectedTrade.rrPotential}R` : '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Ergebnis</div>
                      <div className={`font-medium text-sm ${selectedTrade.profitLoss && selectedTrade.profitLoss > 0 ? 'text-green-500' : selectedTrade.profitLoss && selectedTrade.profitLoss < 0 ? 'text-red-500' : ''}`}>
                        {selectedTrade.profitLoss ? `${selectedTrade.profitLoss > 0 ? '+' : ''}${selectedTrade.profitLoss.toFixed(2)} $` : '-'}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Status</div>
                      <BadgeWinLoss isWin={selectedTrade.isWin} size="sm" />
                    </div>
                  </div>
                </div>
              </div>
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
