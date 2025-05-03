import { useState, useRef, useEffect, createRef } from "react";
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
import { formatDate, formatDateTime } from "@/lib/utils";
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
  onTradeSelected: (trade: Trade) => void;
}

export default function TradeDetail({ selectedTrade, onTradeSelected }: TradeDetailProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Refs für alle Eingabefelder, um Navigation per Enter zu ermöglichen
  const inputRefs = useRef<Array<HTMLElement | null>>([]);
  
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

  // Funktion zum Navigieren zum nächsten Eingabefeld
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Suche nach dem nächsten verfügbaren Eingabefeld
      let nextIndex = index + 1;
      while (nextIndex < inputRefs.current.length && !inputRefs.current[nextIndex]) {
        nextIndex++;
      }
      
      // Wenn ein nächstes Feld existiert, fokussiere es
      if (nextIndex < inputRefs.current.length && inputRefs.current[nextIndex]) {
        const nextElement = inputRefs.current[nextIndex];
        
        if (nextElement instanceof HTMLButtonElement || 
            nextElement instanceof HTMLInputElement || 
            nextElement instanceof HTMLSelectElement) {
          nextElement.focus();
          
          // Für SelectTrigger muss ein Klick simuliert werden
          if (nextElement.classList.contains('SelectTrigger')) {
            nextElement.click();
          }
        }
      } else {
        // Kein weiteres Feld gefunden, beende den Bearbeitungsmodus
        saveChanges();
      }
    }
  };
  
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
        slPoints: selectedTrade.slPoints,
        accountType: selectedTrade.accountType || 'PA', 
        riskSum: selectedTrade.riskSum ?? 200,
        entryPoints: selectedTrade.entryPoints,
        session: selectedTrade.session || ''
      });
      
      // Initialisiere die inputRefs-Array mit leeren Elementen
      // Diese werden im JSX durch die ref-Attribute gefüllt
      inputRefs.current = Array(20).fill(null);
      
      // Fokussiere auf das erste Eingabefeld, wenn der Edit-Modus gestartet wird
      setTimeout(() => {
        if (inputRefs.current[0]) {
          const firstElement = inputRefs.current[0];
          if (firstElement instanceof HTMLElement) {
            firstElement.focus();
          }
        }
      }, 100);
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
    
    // Aktualisierte Trade-Daten
    const updatedTradeData = {
      ...selectedTrade,
      ...editData
    };
    
    // API-Aufruf
    updateTradeMutation.mutate({
      id: selectedTrade.id,
      ...editData,
      userId: selectedTrade.userId || 2
    });
    
    // Sofort die UI mit den aktuellen Daten aktualisieren
    onTradeSelected(updatedTradeData);
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
    
    // Aktualisierte Trade-Daten mit neuem Chart-Bild
    const updatedTradeData = {
      ...selectedTrade,
      chartImage: base64Image
    };
    
    // API-Aufruf
    updateChartImageMutation.mutate({
      id: selectedTrade.id,
      chartImage: base64Image,
      userId: selectedTrade.userId || 2
    });
    
    // Sofort die UI mit den aktuellen Daten aktualisieren
    onTradeSelected(updatedTradeData);
  };

  // Klick-Handler zum Starten oder Beenden des Edit-Modus
  const handleCardClick = (e: React.MouseEvent) => {
    // Prüfe, ob auf ein Interaktionselement geklickt wurde
    const isInteractiveElement = 
      e.target instanceof HTMLButtonElement || 
      e.target instanceof HTMLInputElement || 
      e.target instanceof HTMLSelectElement ||
      (e.target as HTMLElement).closest('button') ||
      (e.target as HTMLElement).closest('select') ||
      (e.target as HTMLElement).closest('input');
    
    // Wenn im Edit-Modus und auf den Hintergrund geklickt wurde
    if (editMode && !isInteractiveElement) {
      // Prüfe, ob das Klick-Element der Hintergrund selbst ist oder direkt darunter
      const isBackgroundClick = 
        e.target === e.currentTarget || 
        (e.target as HTMLElement).tagName === 'DIV';
      
      if (isBackgroundClick) {
        // Speichere vorhandene Änderungen
        saveChanges();
        return;
      }
    }
    
    // Ansonsten starte den Edit-Modus (wenn nicht bereits im Edit-Modus und kein Interaktionselement)
    if (!editMode && !isInteractiveElement) {
      startEditMode();
    }
  };

  return (
    <Card className="bg-card overflow-hidden mb-6 sticky top-4 w-full max-w-[90vw] mx-auto shadow-lg">
      <CardHeader className="border-b border-border flex flex-col py-3">
        <div className="flex flex-col items-center justify-center mb-2">
          <CardTitle className="text-sm font-medium mb-1">Trade Details</CardTitle>
          
          {/* Hinweis zur Bearbeitung im Edit-Modus */}
          {selectedTrade && editMode && (
            <div className="text-xs text-muted-foreground flex items-center">
              <Pencil className="h-3 w-3 mr-1" />
              Bearbeitungsmodus aktiv - Klicke zum Speichern
            </div>
          )}
        </div>
        
        {/* Datum, Symbol, Einstieg und Profit/Loss in der Titelleiste */}
        {selectedTrade && (
          <div className="grid grid-cols-4 gap-2">
            <div className="bg-background/50 rounded-sm p-1.5">
              <div className="text-xs text-muted-foreground font-medium">Datum</div>
              <div className="font-bold text-xs mt-0.5">{formatDateTime(selectedTrade.date)}</div>
            </div>
            <div className="bg-background/50 rounded-sm p-1.5">
              <div className="text-xs text-muted-foreground font-medium">Symbol</div>
              <div className="font-bold text-xs mt-0.5">{selectedTrade.symbol}</div>
            </div>
            <div className="bg-background/50 rounded-sm p-1.5">
              <div className="text-xs text-muted-foreground font-medium">Einstieg</div>
              <div className="font-bold text-xs mt-0.5">
                <BadgeTrend trend={selectedTrade.entryType || '-'} size="sm" />
              </div>
            </div>
            <div className="bg-background/50 rounded-sm p-1.5">
              <div className="flex justify-between items-center">
                <div className="text-xs text-muted-foreground font-medium">Profit/Loss</div>
                {selectedTrade && <BadgeWinLoss isWin={selectedTrade.isWin} />}
              </div>
              <span className={`font-bold text-xs ${selectedTrade.profitLoss && selectedTrade.profitLoss > 0 ? 'text-green-500' : selectedTrade.profitLoss && selectedTrade.profitLoss < 0 ? 'text-red-500' : ''}`}>
                {selectedTrade.profitLoss ? `${selectedTrade.profitLoss > 0 ? '+' : ''}$${selectedTrade.profitLoss.toFixed(2)}` : '-'}
              </span>
            </div>
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
        <CardContent 
          className={`p-4 px-6 ${editMode ? 'cursor-pointer' : ''} max-h-[80vh] overflow-auto`} 
          ref={cardRef} 
          onClick={handleCardClick}>
          
          {/* Entfernt: Hauptinformationen in einer Zeile */}
          
          {/* Drei Spalten für die wichtigsten Informationen (auf Mobilgeräten 1 Spalte) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            {/* Spalte 1: Setup und Einstieg */}
            <div className="flex flex-col h-full">
              <div className="bg-muted/30 rounded-md p-3 mb-2 h-full">
                <div className="text-xs font-medium mb-2 border-b border-border pb-1">Setup &amp; Einstieg</div>
                <div className="space-y-2">
                  {/* Kontotyp und Setup nebeneinander, Risiko Punkte darunter */}
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Kontotyp</div>
                      {editMode ? (
                        <Select 
                          value={editData.accountType || 'PA'} 
                          onValueChange={val => updateField('accountType', val)}
                        >
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[0] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 0)}
                          >
                            <SelectValue placeholder="Kontotyp" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="PA">PA</SelectItem>
                            <SelectItem value="EVA">EVA</SelectItem>
                            <SelectItem value="EK">EK</SelectItem>
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.accountType && selectedTrade.accountType !== '' ? selectedTrade.accountType : '-'}</div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Setup</div>
                      {editMode ? (
                        <Select 
                          value={editData.setup} 
                          onValueChange={val => updateField('setup', val)}
                        >
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[1] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 1)}
                          >
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.setup || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Size</div>
                      {editMode ? (
                        <Input
                          type="number"
                          value={editData.size === undefined ? "" : editData.size}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                            updateField('size', value);
                          }}
                          className="h-7 text-xs mt-0.5"
                          min="0"
                          placeholder="Position Size"
                          ref={(el) => { inputRefs.current[2] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 2)}
                        />
                      ) : (
                        <div className="font-medium text-sm mt-0.5">
                          {selectedTrade.size !== undefined && selectedTrade.size !== null && selectedTrade.size !== '' ? selectedTrade.size : '-'}
                        </div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Risiko Punkte</div>
                      {editMode ? (
                        <Input
                          type="number"
                          value={editData.riskSum === undefined ? "" : editData.riskSum}
                          onChange={(e) => {
                            const inputValue = e.target.value === "" ? undefined : parseFloat(e.target.value);
                            // Direkt den eingegebenen Wert als Risiko-Punkte speichern
                            updateField('riskSum', inputValue);
                          }}
                          className="h-7 text-xs mt-0.5"
                          min="0"
                          placeholder="0"
                          ref={(el) => { inputRefs.current[3] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 3)}
                        />
                      ) : (
                        <div className="font-medium text-sm mt-0.5">
                          {selectedTrade.riskSum !== undefined && selectedTrade.riskSum !== null && selectedTrade.riskSum !== '' ? selectedTrade.riskSum : '-'}
                        </div>
                      )}
                    </div>
                  </div>
                  {/* Entfernt: Einstieg-Feld wird im Header angezeigt */}
                </div>
              </div>
            </div>
            
            {/* Spalte 2: Trends */}
            <div className="flex flex-col h-full">
              <div className="bg-muted/30 rounded-md p-3 mb-2 h-full">
                <div className="text-xs font-medium mb-2 border-b border-border pb-1">Trends</div>
                <div className="space-y-2">
                  <div className="grid grid-cols-3 gap-2 mb-1">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Trend</div>
                      {editMode ? (
                        <Select 
                          value={editData.trend} 
                          onValueChange={val => updateField('trend', val)}
                        >
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[4] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 4)}
                          >
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
                        <div className="mt-0.5">
                          <BadgeTrend trend={selectedTrade.trend || '-'} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Int.</div>
                      {editMode ? (
                        <Select 
                          value={editData.internalTrend} 
                          onValueChange={val => updateField('internalTrend', val)}
                        >
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[5] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 5)}
                          >
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
                        <div className="mt-0.5">
                          <BadgeTrend trend={selectedTrade.internalTrend || '-'} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Micro</div>
                      {editMode ? (
                        <Select 
                          value={editData.microTrend} 
                          onValueChange={val => updateField('microTrend', val)}
                        >
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[6] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 6)}
                          >
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
                        <div className="mt-0.5">
                          <BadgeTrend trend={selectedTrade.microTrend || '-'} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">M15</div>
                      {editMode ? (
                        <Select 
                          value={editData.mainTrendM15} 
                          onValueChange={val => updateField('mainTrendM15', val)}
                        >
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[7] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 7)}
                          >
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
                        <div className="mt-0.5">
                          <BadgeTrend trend={selectedTrade.mainTrendM15 || '-'} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">M5</div>
                      {editMode ? (
                        <Select 
                          value={editData.internalTrendM5} 
                          onValueChange={val => updateField('internalTrendM5', val)}
                        >
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[8] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 8)}
                          >
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
                        <div className="mt-0.5">
                          <BadgeTrend trend={selectedTrade.internalTrendM5 || '-'} size="sm" />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Spalte 3: Location und Struktur */}
            <div className="flex flex-col h-full">
              <div className="bg-muted/30 rounded-md p-3 mb-2 h-full">
                <div className="text-xs font-medium mb-2 border-b border-border pb-1">Position &amp; Struktur</div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Location</div>
                      {editMode ? (
                        <Select 
                          value={editData.location} 
                          onValueChange={val => updateField('location', val)}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5">
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.location || '-'}</div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Struktur</div>
                      {editMode ? (
                        <Select 
                          value={editData.structure} 
                          onValueChange={val => updateField('structure', val)}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5">
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.structure || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Liquidation</div>
                      {editMode ? (
                        <Select 
                          value={editData.liquidation} 
                          onValueChange={val => updateField('liquidation', val)}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5">
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.liquidation || '-'}</div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">TF Entry</div>
                      {editMode ? (
                        <Select 
                          value={editData.timeframeEntry} 
                          onValueChange={val => updateField('timeframeEntry', val)}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5">
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.timeframeEntry || '-'}</div>
                      )}
                    </div>
                  </div>

                </div>
              </div>
            </div>
          </div>

          {/* Weitere Details in 2 Spalten */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Linke Spalte - Marktzonen */}
            <div className="flex flex-col h-full">
              <div className="bg-muted/30 rounded-md p-3 mb-2 h-full">
                <div className="text-xs font-medium mb-2 border-b border-border pb-1">Marktzonen</div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Marktphase</div>
                      {editMode ? (
                        <Select 
                          value={editData.marketPhase} 
                          onValueChange={val => updateField('marketPhase', val)}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5">
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.marketPhase || '-'}</div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Unmit. Zone</div>
                      {editMode ? (
                        <Select 
                          value={editData.unmitZone} 
                          onValueChange={val => updateField('unmitZone', val)}
                        >
                          <SelectTrigger className="h-7 text-xs mt-0.5">
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.unmitZone || '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Range Punkte</div>
                      {editMode ? (
                        <Input
                          type="number"
                          value={editData.rangePoints === undefined ? "" : editData.rangePoints}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                            updateField('rangePoints', value);
                          }}
                          className="h-7 text-xs mt-0.5"
                          min="0"
                          ref={(el) => { inputRefs.current[9] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 9)}
                        />
                      ) : (
                        <div className="font-medium text-sm mt-0.5">{(selectedTrade.rangePoints !== undefined && selectedTrade.rangePoints !== null) ? `${selectedTrade.rangePoints}` : '-'}</div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">Session</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap mt-0.5">
                          {["London", "London Neverland", "NY AM", "NY AM Neverland", "NY PM"].map((session) => (
                            <Button
                              key={session}
                              type="button"
                              variant={editData.session === session ? "default" : "outline"}
                              size="sm"
                              className="p-1 h-6 text-[10px]"
                              onClick={() => updateField('session', session)}
                            >
                              {session}
                            </Button>
                          ))}
                        </div>
                      ) : (
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.session || '-'}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Rechte Spalte - Ergebnis */}
            <div className="flex flex-col h-full">
              <div className="bg-muted/30 rounded-md p-3 mb-2 h-full">
                <div className="text-xs font-medium mb-2 border-b border-border pb-1">Ergebnis &amp; RR</div>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2 mb-1">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">RR Achieved</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap mt-0.5">
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.rrAchieved ? `${selectedTrade.rrAchieved}R` : '-'}</div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">RR Potential</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap mt-0.5">
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.rrPotential ? `${selectedTrade.rrPotential}R` : '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">SL Typ</div>
                      {editMode ? (
                        <div className="flex gap-1 flex-wrap mt-0.5">
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
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.slType || '-'}</div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">SL Punkte</div>
                      {editMode ? (
                        <Input
                          type="number"
                          value={editData.slPoints === undefined ? "" : editData.slPoints}
                          onChange={(e) => {
                            const value = e.target.value === "" ? undefined : parseInt(e.target.value);
                            updateField('slPoints', value);
                          }}
                          className="h-7 text-xs mt-0.5"
                          min="0"
                          max="30"
                          ref={(el) => { inputRefs.current[10] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 10)}
                        />
                      ) : (
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.slPoints !== undefined ? selectedTrade.slPoints : '-'}</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* TradingView Chart Upload */}
          <div className="mt-4">
            <ChartImageUpload 
              existingImage={selectedTrade.chartImage} 
              onChange={handleChartImageChange} 
            />
          </div>
          
          {/* Aktionsleiste entfernt, da automatisches Speichern bei Klick auf leere Fläche */}
        </CardContent>
      )}
    </Card>
  );
}