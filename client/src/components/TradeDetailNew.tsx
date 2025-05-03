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

// Komponente für Button-Gruppen mit Tastaturnavigation
const ButtonGroupWrapper = ({ 
  children, 
  className, 
  tabIndex, 
  onKeyDown, 
  inputRef 
}: { 
  children: React.ReactNode, 
  className?: string, 
  tabIndex?: number, 
  onKeyDown?: (e: React.KeyboardEvent) => void,
  inputRef?: (el: HTMLDivElement | null) => void
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    // Wenn der übergeordnete Handler existiert, zuerst ausführen
    if (onKeyDown) {
      onKeyDown(e);
    }
    
    // Nur innerhalb der Button-Gruppe navigieren
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      e.preventDefault();
      
      const buttons = containerRef.current?.querySelectorAll('button');
      if (!buttons || buttons.length === 0) return;
      
      // Aktuellen Button finden
      const activeElement = document.activeElement;
      let currentIndex = -1;
      
      buttons.forEach((button, index) => {
        if (button === activeElement) {
          currentIndex = index;
        }
      });
      
      // Nächsten/vorherigen Button bestimmen
      let newIndex = currentIndex;
      if (e.key === 'ArrowRight') {
        newIndex = currentIndex < buttons.length - 1 ? currentIndex + 1 : 0;
      } else if (e.key === 'ArrowLeft') {
        newIndex = currentIndex > 0 ? currentIndex - 1 : buttons.length - 1;
      }
      
      // Fokus setzen
      if (newIndex >= 0 && newIndex < buttons.length) {
        (buttons[newIndex] as HTMLButtonElement).focus();
      }
    }
  };
  
  return (
    <div 
      className={className}
      ref={(el) => {
        containerRef.current = el;
        if (inputRef) inputRef(el);
      }}
      tabIndex={tabIndex || 0}
      onKeyDown={handleKeyDown}
    >
      {children}
    </div>
  );
};

interface TradeDetailProps {
  selectedTrade: Trade | null;
  onTradeSelected: (trade: Trade) => void;
}

// Hilfsfunktion zum Erkennen des Block-Typs anhand des Titels
const getBlockTypeFromTitle = (title: string): string => {
  title = title.toLowerCase();
  if (title.includes('setup') || title.includes('einstieg')) {
    return 'setup';
  } else if (title.includes('trend')) {
    return 'trends';
  } else if (title.includes('position') || title.includes('struktur')) {
    return 'position';
  } else if (title.includes('marktzonen')) {
    return 'marktzonen';
  } else if (title.includes('ergebnis') || title.includes('rr')) {
    return 'ergebnis';
  } else if (title.includes('risk') || title.includes('reward') || title.includes('r/r')) {
    return 'risk';
  }
  return 'unknown';
};

export default function TradeDetail({ selectedTrade, onTradeSelected }: TradeDetailProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Refs für alle Eingabefelder, um Navigation per Enter zu ermöglichen
  const inputRefs = useRef<Array<HTMLElement | null>>([]);
  
  // Type Definition für blockRefs mit korrekter Definition von blockSequence
  type BlockRefs = {
    setup: HTMLElement | null;
    trends: HTMLElement | null;
    position: HTMLElement | null;
    risk: HTMLElement | null;
    marktzonen: HTMLElement | null;
    ergebnis: HTMLElement | null;
    elements: { [key: string]: Array<HTMLElement | null> };
    blockSequence?: string[];
  };
  
  // Refs für Blockkategorien zur besseren Navigation zwischen Blöcken
  const blockRefs = useRef<BlockRefs>({
    setup: null,       // Setup & Einstieg Block
    trends: null,      // Trends Block
    position: null,    // Position & Struktur Block
    risk: null,        // R/R Block
    marktzonen: null,  // Marktzonen Block
    ergebnis: null,    // Ergebnis & RR Block
    elements: {
      setup: [],
      trends: [],
      position: [],
      risk: [],
      marktzonen: [],
      ergebnis: []
    }
  });
  
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

  // Funktion zum Navigieren zum nächsten oder vorherigen Eingabefeld
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    // Navigation mit Enter-Taste zum nächsten Feld - barrierefrei durch alle Blöcke
    if (event.key === 'Enter') {
      event.preventDefault();
      
      // Wenn das aktuelle Element ein Dropdown oder eine Schaltfläche ist, überprüfe zuerst, 
      // ob es bereits geöffnet ist
      const isDropdown = event.target instanceof HTMLElement && 
                        (event.target.getAttribute('role') === 'combobox' || 
                        event.target.getAttribute('aria-haspopup') === 'listbox');
      
      const isButton = event.target instanceof HTMLButtonElement;
      const isDropdownOpen = document.querySelector('[role="listbox"]');
      
      // Wenn es ein geschlossenes Dropdown ist, öffne es
      if (isDropdown && !isDropdownOpen) {
        if (event.target instanceof HTMLElement) {
          event.target.click(); // Öffne das Dropdown
          return; // Stoppe hier, damit der Benutzer zuerst eine Option auswählen kann
        }
      }
      
      // Wenn es ein Button ist, klicke ihn
      if (isButton && event.target instanceof HTMLButtonElement) {
        event.target.click();
        // Trotzdem zum nächsten Element navigieren (falls es existiert)
      }
      
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
          
          // Für SelectTrigger: automatisch öffnen
          if (nextElement.getAttribute('role') === 'combobox') {
            // Nicht sofort öffnen, um Benutzern die Möglichkeit zu geben, weiterzutabben
            console.log("Nächstes Feld ist ein Dropdown: fokussiert aber nicht geöffnet");
          }
        }
      } else {
        // Automatisch speichern, wenn das letzte Feld erreicht wurde
        saveChanges();
      }
    }
    
    // Navigation mit Pfeiltasten (hoch/runter)
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      
      // Suche nach dem vorherigen verfügbaren Eingabefeld
      let prevIndex = index - 1;
      while (prevIndex >= 0 && !inputRefs.current[prevIndex]) {
        prevIndex--;
      }
      
      // Wenn ein vorheriges Feld existiert, fokussiere es
      if (prevIndex >= 0 && inputRefs.current[prevIndex]) {
        const prevElement = inputRefs.current[prevIndex];
        
        if (prevElement instanceof HTMLButtonElement || 
            prevElement instanceof HTMLInputElement || 
            prevElement instanceof HTMLSelectElement) {
          prevElement.focus();
        }
      }
    }
    
    if (event.key === 'ArrowDown') {
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
        }
      }
    }
    
    // Navigation mit Pfeiltasten (links/rechts) für alle Felder
    // Verbesserte Implementierung, die die Block-Struktur berücksichtigt
    if (event.key === 'ArrowRight') {
      event.preventDefault();
      
      // 1. Element im aktuellen Block finden
      const currentElement = inputRefs.current[index];
      if (!currentElement) return;
      
      // 2. Block finden, zu dem das aktuelle Element gehört
      let currentBlockType: string = 'unknown';
      const block = currentElement.closest('.bg-muted\\/30');
      if (block) {
        const titleEl = block.querySelector('.text-xs.font-medium');
        if (titleEl) {
          const titleText = titleEl.textContent?.toLowerCase() || '';
          currentBlockType = getBlockTypeFromTitle(titleText);
        }
      }
      
      console.log(`Navigiere von Block: ${currentBlockType}, Element-Index: ${index}`);
      
      // 3. Nächstes Element im gleichen Block suchen
      const rightIndex = index + 1;
      if (rightIndex < inputRefs.current.length && inputRefs.current[rightIndex]) {
        const rightElement = inputRefs.current[rightIndex];
        const rightBlock = rightElement.closest('.bg-muted\\/30');
        
        // Prüfen, ob das nächste Element zum gleichen Block gehört
        if (block === rightBlock) {
          if (rightElement instanceof HTMLButtonElement || 
              rightElement instanceof HTMLInputElement || 
              rightElement instanceof HTMLSelectElement) {
            rightElement.focus();
            return;
          }
        }
      }
      
      // 4. Wenn kein nächstes Element im aktuellen Block oder wir sind am Ende des Blocks,
      // versuche zum nächsten Block zu springen
      
      // Reihenfolge der Blöcke: setup -> trends -> position -> marktzonen -> ergebnis
      let nextBlockType = '';
      if (currentBlockType === 'setup') nextBlockType = 'trends';
      else if (currentBlockType === 'trends') nextBlockType = 'position';
      else if (currentBlockType === 'position') nextBlockType = 'marktzonen';
      else if (currentBlockType === 'marktzonen') nextBlockType = 'ergebnis';
      
      console.log(`Springe zum nächsten Block: ${nextBlockType}`);
      
      // Erstes Element im nächsten Block finden
      if (nextBlockType && blockRefs.current.elements[nextBlockType]?.length > 0) {
        const firstElementInNextBlock = blockRefs.current.elements[nextBlockType][0];
        if (firstElementInNextBlock instanceof HTMLButtonElement || 
            firstElementInNextBlock instanceof HTMLInputElement || 
            firstElementInNextBlock instanceof HTMLSelectElement) {
          firstElementInNextBlock.focus();
          return;
        }
      }
      
      // 5. Fallback: Wenn alles andere fehlschlägt, versuche zum nächsten Element zu navigieren
      if (rightIndex < inputRefs.current.length && inputRefs.current[rightIndex]) {
        const nextElement = inputRefs.current[rightIndex];
        if (nextElement instanceof HTMLButtonElement || 
            nextElement instanceof HTMLInputElement || 
            nextElement instanceof HTMLSelectElement) {
          nextElement.focus();
        }
      }
    }
    
    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      
      // 1. Element im aktuellen Block finden
      const currentElement = inputRefs.current[index];
      if (!currentElement) return;
      
      // 2. Block finden, zu dem das aktuelle Element gehört mit unserer Hilfsfunktion
      let currentBlockType: string = 'unknown';
      const block = currentElement.closest('.bg-muted\\/30');
      if (block) {
        const titleEl = block.querySelector('.text-xs.font-medium');
        if (titleEl) {
          const titleText = titleEl.textContent?.toLowerCase() || '';
          currentBlockType = getBlockTypeFromTitle(titleText);
        }
      }
      
      console.log(`Navigiere von Block: ${currentBlockType}, Element-Index: ${index}`);
      
      // 3. Vorheriges Element im gleichen Block suchen
      const leftIndex = index - 1;
      if (leftIndex >= 0 && inputRefs.current[leftIndex]) {
        const leftElement = inputRefs.current[leftIndex];
        const leftBlock = leftElement.closest('.bg-muted\\/30');
        
        // Prüfen, ob das vorherige Element zum gleichen Block gehört
        if (block === leftBlock) {
          if (leftElement instanceof HTMLButtonElement || 
              leftElement instanceof HTMLInputElement || 
              leftElement instanceof HTMLSelectElement) {
            leftElement.focus();
            return;
          }
        }
      }
      
      // 4. Wenn kein vorheriges Element im aktuellen Block oder wir sind am Anfang des Blocks,
      // versuche zum vorherigen Block zu springen
      
      // Reihenfolge der Blöcke: setup <- trends <- position <- marktzonen <- ergebnis
      let prevBlockType = '';
      if (currentBlockType === 'trends') prevBlockType = 'setup';
      else if (currentBlockType === 'position') prevBlockType = 'trends';
      else if (currentBlockType === 'marktzonen') prevBlockType = 'position';
      else if (currentBlockType === 'ergebnis') prevBlockType = 'marktzonen';
      
      console.log(`Springe zum vorherigen Block: ${prevBlockType}`);
      
      // Letztes Element im vorherigen Block finden
      if (prevBlockType && blockRefs.current.elements[prevBlockType]?.length > 0) {
        const lastElementIndex = blockRefs.current.elements[prevBlockType].length - 1;
        const lastElementInPrevBlock = blockRefs.current.elements[prevBlockType][lastElementIndex];
        if (lastElementInPrevBlock instanceof HTMLButtonElement || 
            lastElementInPrevBlock instanceof HTMLInputElement || 
            lastElementInPrevBlock instanceof HTMLSelectElement) {
          lastElementInPrevBlock.focus();
          return;
        }
      }
      
      // 5. Fallback: Wenn alles andere fehlschlägt, versuche zum vorherigen Element zu navigieren
      if (leftIndex >= 0 && inputRefs.current[leftIndex]) {
        const prevElement = inputRefs.current[leftIndex];
        if (prevElement instanceof HTMLButtonElement || 
            prevElement instanceof HTMLInputElement || 
            prevElement instanceof HTMLSelectElement) {
          prevElement.focus();
        }
      }
    }
    
    // Escape-Taste zum Abbrechen der Bearbeitung
    if (event.key === 'Escape') {
      event.preventDefault();
      cancelEditMode();
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
        riskPoints: selectedTrade.riskPoints ?? 10,
        riskAmount: selectedTrade.riskAmount ?? calculateRiskAmount(selectedTrade.riskPoints, selectedTrade.size),
        entryPoints: selectedTrade.entryPoints,
        session: selectedTrade.session || ''
      });
      
      // Initialisiere die inputRefs-Array mit leeren Elementen
      inputRefs.current = Array(30).fill(null); // Erhöht auf 30 für mehr Elemente
      
      // Zurücksetzen der Block-Referenzen mit definierten Block-Sequenzen für verbesserte Navigation
      blockRefs.current = {
        setup: null,
        trends: null,
        position: null,
        risk: null,
        marktzonen: null,
        ergebnis: null,
        elements: {
          setup: [],
          trends: [],
          position: [],
          risk: [],
          marktzonen: [],
          ergebnis: []
        },
        // Definierte Reihenfolge der Blöcke für die Navigation
        blockSequence: ["setup", "trends", "position", "marktzonen", "ergebnis"]
      };
      
      // Identifiziere die verschiedenen Blöcke und deren Elemente
      setTimeout(() => {
        if (cardRef.current) {
          // Finde interaktive Elemente
          const interactiveElements = cardRef.current.querySelectorAll(
            'button, input, select, [role="combobox"]'
          );
          
          // Fülle die Refs mit den gefundenen Elementen
          interactiveElements.forEach((el, index) => {
            const element = el as HTMLElement;
            inputRefs.current[index] = element;
            
            // Identifiziere Blöcke basierend auf dem Inhalt
            const block = element.closest('.bg-muted\\/30');
            if (block) {
              const titleEl = block.querySelector('.text-xs.font-medium');
              if (titleEl) {
                const titleText = titleEl.textContent?.toLowerCase() || '';
                
                // Verwende die getBlockTypeFromTitle-Funktion für konsistente Erkennung
                const blockType = getBlockTypeFromTitle(titleText);
                
                // Sicherstellen, dass blockType einer der gültigen Block-Typen ist
                if (blockType === 'setup' || blockType === 'trends' || 
                    blockType === 'position' || blockType === 'marktzonen' || 
                    blockType === 'ergebnis' || blockType === 'risk') {
                    
                  // Setze den Block-Referenz
                  blockRefs.current[blockType] = block as HTMLElement;
                  // Füge das Element zur Liste der Elemente dieses Blocks hinzu
                  blockRefs.current.elements[blockType].push(element);
                }
              }
            }
          });
          
          console.log('Block-Elemente identifiziert:', {
            setup: blockRefs.current.elements.setup.length,
            trends: blockRefs.current.elements.trends.length,
            position: blockRefs.current.elements.position.length,
            marktzonen: blockRefs.current.elements.marktzonen.length,
            ergebnis: blockRefs.current.elements.ergebnis.length,
            risk: blockRefs.current.elements.risk.length,
            totalInputs: inputRefs.current.filter(Boolean).length
          });
        }
        
        // Fokussiere auf das erste Eingabefeld
        if (inputRefs.current[0]) {
          const firstElement = inputRefs.current[0];
          if (firstElement instanceof HTMLElement) {
            firstElement.focus();
          }
        }
      }, 100);
    }
  }, [selectedTrade, editMode]);

  // Berechnet die Risikosumme basierend auf der Formel: (Risiko Punkte * 4 * 0.5) * Size
  const calculateRiskAmount = (riskPoints: number | undefined, size: number | undefined): number | undefined => {
    if (riskPoints === undefined || size === undefined) return undefined;
    
    // Risiko Punkte * 4 = Ticks, dann (Ticks * 0.5) * Size = Risikosumme
    const ticks = riskPoints * 4;
    const riskAmount = (ticks * 0.5) * size;
    return parseFloat(riskAmount.toFixed(2)); // Auf 2 Nachkommastellen runden
  };

  // Update-Funktion für Felder
  const updateField = <K extends keyof Trade>(field: K, value: Trade[K]) => {
    setEditData(prev => {
      const newState = { ...prev, [field]: value };
      
      // Wenn Risiko Punkte oder Size geändert werden, berechne die Risikosumme neu
      if (field === 'riskPoints' || field === 'size') {
        const riskPoints = field === 'riskPoints' ? value as number : prev.riskPoints;
        const size = field === 'size' ? value as number : prev.size;
        
        // Automatische Berechnung der Risikosumme
        const riskAmount = calculateRiskAmount(riskPoints, size);
        if (riskAmount !== undefined) {
          newState.riskAmount = riskAmount;
        }
      }
      
      return newState;
    });
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
                        <div>
                          <Input
                            type="number"
                            value={editData.riskPoints === undefined ? "" : editData.riskPoints}
                            onChange={(e) => {
                              const inputValue = e.target.value === "" ? undefined : parseFloat(e.target.value);
                              updateField('riskPoints', inputValue);
                            }}
                            className="h-7 text-xs mt-0.5"
                            min="0"
                            placeholder="0"
                            ref={(el) => { inputRefs.current[3] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 3)}
                          />
                          {editData.riskPoints !== undefined && editData.size !== undefined && (
                            <div className="text-xs text-muted-foreground mt-1">
                              <span className="font-medium text-primary">
                                Risikosumme: ${calculateRiskAmount(editData.riskPoints, editData.size)}
                              </span>
                              <br />
                              <span className="text-[10px]">
                                ({editData.riskPoints} Punkte = {editData.riskPoints * 4} Ticks)
                              </span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="font-medium text-sm mt-0.5">
                          {selectedTrade.riskPoints !== undefined && selectedTrade.riskPoints !== null ? (
                            <div>
                              <div>{selectedTrade.riskPoints} Punkte</div>
                              {selectedTrade.size && (
                                <div className="text-xs text-muted-foreground">
                                  Risikosumme: ${calculateRiskAmount(selectedTrade.riskPoints, selectedTrade.size)}
                                </div>
                              )}
                            </div>
                          ) : (
                            '-'
                          )}
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
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[15] = el; }} 
                            onKeyDown={(e) => handleKeyDown(e, 15)}
                          >
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
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[16] = el; }} 
                            onKeyDown={(e) => handleKeyDown(e, 16)}
                          >
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
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[17] = el; }} 
                            onKeyDown={(e) => handleKeyDown(e, 17)}
                          >
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
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[18] = el; }} 
                            onKeyDown={(e) => handleKeyDown(e, 18)}
                          >
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
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[27] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 27)}
                          >
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
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[28] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 28)}
                          >
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
                        <ButtonGroupWrapper 
                          className="flex gap-1 flex-wrap mt-0.5"
                          tabIndex={0}
                          inputRef={(el) => { inputRefs.current[19] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 19)}
                        >
                          {["London", "London Neverland", "NY AM", "NY AM Neverland", "NY PM"].map((session) => (
                            <Button
                              key={session}
                              type="button"
                              variant={editData.session === session ? "default" : "outline"}
                              size="sm"
                              className="p-1 h-6 text-[10px]"
                              onClick={() => updateField('session', session)}
                              tabIndex={-1} // Buttons in der Gruppe sind über die Gruppe fokussierbar
                            >
                              {session}
                            </Button>
                          ))}
                        </ButtonGroupWrapper>
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
                        <ButtonGroupWrapper 
                          className="flex gap-1 flex-wrap mt-0.5"
                          tabIndex={0}
                          inputRef={(el) => { inputRefs.current[21] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 21)}
                        >
                          {[-1, ...[1, 2, 3, 4, 5, 6, 7]].map((val) => (
                            <Button
                              key={val}
                              type="button"
                              variant={editData.rrAchieved === val ? "default" : "outline"}
                              size="sm"
                              className={`p-1 h-6 text-[10px] flex-1 ${val === -1 ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : ''}`}
                              onClick={() => updateField('rrAchieved', val)}
                              tabIndex={-1}
                            >
                              {val}R
                            </Button>
                          ))}
                        </ButtonGroupWrapper>
                      ) : (
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.rrAchieved ? `${selectedTrade.rrAchieved}R` : '-'}</div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">RR Potential</div>
                      {editMode ? (
                        <ButtonGroupWrapper 
                          className="flex gap-1 flex-wrap mt-0.5"
                          tabIndex={0}
                          inputRef={(el) => { inputRefs.current[23] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 23)}
                        >
                          {[1, 2, 3, 4, 5, 6, 7].map((val) => (
                            <Button
                              key={val}
                              type="button"
                              variant={editData.rrPotential === val ? "default" : "outline"}
                              size="sm"
                              className="p-1 h-6 text-[10px] flex-1"
                              onClick={() => updateField('rrPotential', val)}
                              tabIndex={-1}
                            >
                              {val}R
                            </Button>
                          ))}
                        </ButtonGroupWrapper>
                      ) : (
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.rrPotential ? `${selectedTrade.rrPotential}R` : '-'}</div>
                      )}
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">SL Typ</div>
                      {editMode ? (
                        <ButtonGroupWrapper 
                          className="flex gap-1 flex-wrap mt-0.5"
                          tabIndex={0}
                          inputRef={(el) => { inputRefs.current[25] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 25)}
                        >
                          {["Sweep", "zerstört"].map((type) => (
                            <Button
                              key={type}
                              type="button"
                              variant={editData.slType === type ? "default" : "outline"}
                              size="sm"
                              className="p-1 h-6 text-[10px] flex-1"
                              onClick={() => updateField('slType', type)}
                              tabIndex={-1}
                            >
                              {type}
                            </Button>
                          ))}
                        </ButtonGroupWrapper>
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