import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
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
  rrValues,
  slTypes
} from "@shared/schema";
import { BadgeWinLoss } from "@/components/ui/badge-win-loss";
import { BadgeTrend } from "@/components/ui/badge-trend";
import { formatDate } from "@/lib/utils";
import ChartImageUpload from "./ChartImageUpload";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Save, X, Check } from "lucide-react";
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
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Nur ein einziger State für alle Bearbeitungen
  const [editData, setEditData] = useState<Partial<Trade>>({});
  
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

  // Initialisierung der Edit-Daten, wenn der Edit-Modus gestartet wird
  useEffect(() => {
    if (selectedTrade && editMode) {
      // Kopiere alle relevanten Werte aus selectedTrade
      setEditData({
        setup: selectedTrade.setup || '',
        mainTrendM15: selectedTrade.mainTrendM15 || '',
        internalTrendM5: selectedTrade.internalTrendM5 || '',
        entryLevel: selectedTrade.entryLevel || '',
        profitLoss: selectedTrade.profitLoss || 0,
        trend: selectedTrade.trend || '',
        internalTrend: selectedTrade.internalTrend || '',
        microTrend: selectedTrade.microTrend || '',
        structure: selectedTrade.structure || '',
        timeframeEntry: selectedTrade.timeframeEntry || '',
        liquidation: selectedTrade.liquidation || '',
        unmitZone: selectedTrade.unmitZone || '',
        rangePoints: selectedTrade.rangePoints,
        marketPhase: selectedTrade.marketPhase || '',
        rrAchieved: selectedTrade.rrAchieved ?? 0,
        rrPotential: selectedTrade.rrPotential ?? 0,
        location: selectedTrade.location || '',
        slType: selectedTrade.slType || '',
        slPoints: selectedTrade.slPoints
      });
    }
  }, [selectedTrade, editMode]);

  // Update-Funktion für Felder
  const updateField = <K extends keyof Trade>(field: K, value: Trade[K]) => {
    setEditData(prev => ({ ...prev, [field]: value }));
  };

  // Start Edit Mode
  const startEditMode = () => {
    if (!selectedTrade) return;
    setEditMode(true);
  };

  // Abbrechen des Edit-Modus
  const cancelEditMode = () => {
    setEditMode(false);
    setEditData({});
  };

  // Speichern der Änderungen
  const saveChanges = () => {
    if (!selectedTrade) return;
    
    console.log("Speichere Änderungen:", {
      id: selectedTrade.id,
      ...editData
    });
    
    updateTradeMutation.mutate({
      id: selectedTrade.id,
      ...editData,
      userId: selectedTrade.userId || 2
    });
  };

  // Chart-Upload Mutation
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
      userId: selectedTrade.userId || 2
    });
  };

  // Klick-Handler zum Starten des Edit-Modus (wenn nicht bereits im Edit-Modus)
  const handleCardClick = (e: React.MouseEvent) => {
    if (editMode || 
        e.target instanceof HTMLButtonElement || 
        e.target instanceof HTMLInputElement || 
        e.target instanceof HTMLSelectElement ||
        (e.target as HTMLElement).closest('button') ||
        (e.target as HTMLElement).closest('select') ||
        (e.target as HTMLElement).closest('input')) {
      return;
    }
    
    startEditMode();
  };

  return (
    <Card className="bg-card overflow-hidden mb-6 sticky top-4">
      <CardHeader className="border-b border-border flex flex-row items-center justify-between">
        <CardTitle>Trade Details</CardTitle>
        
        {/* Edit-Buttons in der Kopfzeile */}
        {selectedTrade && !editMode && (
          <Button variant="ghost" size="sm" onClick={startEditMode}>
            <Pencil className="h-4 w-4 mr-1" />
            Bearbeiten
          </Button>
        )}
        
        {selectedTrade && editMode && (
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={cancelEditMode}>
              <X className="h-4 w-4 mr-1" />
              Abbrechen
            </Button>
            <Button variant="default" size="sm" onClick={saveChanges}>
              <Save className="h-4 w-4 mr-1" />
              Speichern
            </Button>
          </div>
        )}
      </CardHeader>

      {!selectedTrade ? (
        // Empty state
        <div className="p-6 text-center text-muted-foreground">
          <i className="fas fa-mouse-pointer text-3xl mb-2"></i>
          <p>Wähle einen Trade aus, um Details zu sehen</p>
        </div>
      ) : (
        // Trade details
        <CardContent className="p-4" ref={cardRef} onClick={handleCardClick}>
          
          {/* Entfernt: Hauptinformationen in einer Zeile */}
          
          {/* Drei Spalten für die wichtigsten Informationen (auf Mobilgeräten 1 Spalte) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Spalte 1: Setup und Einstieg */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Setup &amp; Einstieg</div>
                <div className="space-y-1.5">
                  <div className="flex justify-between items-center mb-1">
                    <BadgeWinLoss isWin={selectedTrade.isWin} />
                    <span className={`font-bold text-xs ${selectedTrade.profitLoss && selectedTrade.profitLoss > 0 ? 'text-green-500' : selectedTrade.profitLoss && selectedTrade.profitLoss < 0 ? 'text-red-500' : ''}`}>
                      {selectedTrade.profitLoss ? `${selectedTrade.profitLoss > 0 ? '+' : ''}$${selectedTrade.profitLoss.toFixed(2)}` : '-'}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Datum</div>
                      <div className="font-bold text-xs">{formatDate(selectedTrade.date)}</div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Symbol</div>
                      <div className="font-bold text-xs">{selectedTrade.symbol}</div>
                    </div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Setup</div>
                    {editMode ? (
                      <Select 
                        value={editData.setup} 
                        onValueChange={val => updateField('setup', val)}
                      >
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
                      <Select 
                        value={editData.entryLevel} 
                        onValueChange={val => updateField('entryLevel', val)}
                      >
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
                        <Select 
                          value={editData.trend} 
                          onValueChange={val => updateField('trend', val)}
                        >
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
                        <Select 
                          value={editData.internalTrend} 
                          onValueChange={val => updateField('internalTrend', val)}
                        >
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
                        <Select 
                          value={editData.microTrend} 
                          onValueChange={val => updateField('microTrend', val)}
                        >
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
                        <Select 
                          value={editData.mainTrendM15} 
                          onValueChange={val => updateField('mainTrendM15', val)}
                        >
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
                        <Select 
                          value={editData.internalTrendM5} 
                          onValueChange={val => updateField('internalTrendM5', val)}
                        >
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
            
            {/* Spalte 3: Location und Struktur */}
            <div>
              <div className="bg-muted/30 rounded-md p-2 mb-2">
                <div className="text-xs font-medium mb-1 border-b border-border pb-1">Position &amp; Struktur</div>
                <div className="space-y-1.5">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">Location</div>
                      {editMode ? (
                        <Select 
                          value={editData.location} 
                          onValueChange={val => updateField('location', val)}
                        >
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
                        <Select 
                          value={editData.structure} 
                          onValueChange={val => updateField('structure', val)}
                        >
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
                        <Select 
                          value={editData.liquidation} 
                          onValueChange={val => updateField('liquidation', val)}
                        >
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
                        <Select 
                          value={editData.timeframeEntry} 
                          onValueChange={val => updateField('timeframeEntry', val)}
                        >
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
                        <Select 
                          value={editData.marketPhase} 
                          onValueChange={val => updateField('marketPhase', val)}
                        >
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
                        <Select 
                          value={editData.unmitZone} 
                          onValueChange={val => updateField('unmitZone', val)}
                        >
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
                        value={editData.rangePoints === undefined ? "" : editData.rangePoints}
                        onChange={(e) => {
                          const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                          updateField('rangePoints', value);
                        }}
                        className="h-7 text-xs"
                        min="0"
                      />
                    ) : (
                      <div className="font-medium text-sm">{(selectedTrade.rangePoints !== undefined && selectedTrade.rangePoints !== null) ? `${selectedTrade.rangePoints}` : '-'}</div>
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
                          {[-1, ...[1, 2, 3, 4, 5, 6, 7]].map(val => (
                            <Button
                              key={val}
                              type="button"
                              variant={editData.rrAchieved === val ? "default" : "outline"}
                              size="sm"
                              className={`p-1 h-6 text-[10px] flex-1 ${val === -1 ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : ''}`}
                              onClick={() => updateField('rrAchieved', val)}
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
                              variant={editData.rrPotential === val ? "default" : "outline"}
                              size="sm"
                              className="p-1 h-6 text-[10px] flex-1"
                              onClick={() => updateField('rrPotential', val)}
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
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <div className="text-xs text-muted-foreground">SL Typ</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap">
                          {["Sweep", "zerstört"].map((type) => (
                            <Button
                              key={type}
                              type="button"
                              variant={editData.slType === type ? "default" : "outline"}
                              size="sm"
                              className="p-1 h-6 text-[10px] flex-1"
                              onClick={() => updateField('slType', type)}
                            >
                              {type}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.slType || '-'}</div>
                      )}
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">SL Punkte</div>
                      {editMode ? (
                        <Input
                          type="number"
                          value={editData.slPoints === undefined ? "" : editData.slPoints}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                            updateField('slPoints', value);
                          }}
                          className="h-7 text-xs"
                          min="0"
                          max="30"
                        />
                      ) : (
                        <div className="font-medium text-sm">{selectedTrade.slPoints !== undefined ? selectedTrade.slPoints : '-'}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* TradingView Chart Upload */}
          <div className="mt-4">
            <h3 className="text-sm font-medium mb-2">TradingView Chart</h3>
            <ChartImageUpload 
              existingImage={selectedTrade.chartImage} 
              onChange={handleChartImageChange} 
            />
          </div>
          
          {/* Aktionsleiste am Ende des Dialogs */}
          {editMode && (
            <div className="mt-4 flex justify-end gap-2">
              <Button variant="outline" onClick={cancelEditMode}>
                <X className="h-4 w-4 mr-1" />
                Abbrechen
              </Button>
              <Button variant="default" onClick={saveChanges}>
                <Check className="h-4 w-4 mr-1" />
                Speichern
              </Button>
            </div>
          )}
        </CardContent>
      )}
    </Card>
  );
}