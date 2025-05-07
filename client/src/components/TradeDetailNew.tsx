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
} from "../shared/schema";
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

// Funktion zum Finden eines Elements, das sich in einer bestimmten Richtung vom aktuellen Element befindet
const findElementInDirection = (
  currentIndex: number, 
  direction: 'up' | 'down' | 'left' | 'right',
  inputRefs: React.MutableRefObject<Array<HTMLElement | null>>,
  blockRefs: React.MutableRefObject<BlockRefs>
): HTMLElement | null => {
  // Der aktuelle Referenzpunkt
  const currentElement = inputRefs.current[currentIndex];
  if (!currentElement) return null;
  
  // Bestimme den Block, in dem sich das aktuelle Element befindet
  const currentBlock = currentElement.closest('.bg-muted\\/30');
  if (!currentBlock) return null;
  
  // Ermittle den Typ des aktuellen Blocks
  const titleEl = currentBlock.querySelector('.text-xs.font-medium');
  if (!titleEl) return null;
  
  const titleText = titleEl.textContent?.toLowerCase() || '';
  const currentBlockType = getBlockTypeFromTitle(titleText);
  
  console.log(`Navigationssuch-Start von Block: ${currentBlockType}, Element-Index: ${currentIndex}, Richtung: ${direction}`);
  
  // Räumliches Verständnis der Elemente herstellen
  const elementPositions = new Map<number, DOMRect>();
  
  // Positions-Informationen für alle Elemente sammeln
  inputRefs.current.forEach((el, idx) => {
    if (!el) return;
    elementPositions.set(idx, el.getBoundingClientRect());
  });
  
  // Position des aktuellen Elements
  const currentRect = elementPositions.get(currentIndex);
  if (!currentRect) return null;
  
  let bestMatchIndex = -1;
  let bestMatchScore = Number.MAX_VALUE;
  
  // Die gesamte Block-Sequenz
  const blockSequence = blockRefs.current.blockSequence || ["setup", "trends", "position", "marktzonen", "ergebnis"];
  
  // Wenn wir den Block wechseln müssen, mache dies basierend auf der Reihenfolge
  let targetBlockType = currentBlockType;
  
  if ((direction === 'right' || direction === 'down') && currentBlockType !== 'unknown') {
    // Zum nächsten Block in der Sequenz
    const currentIdx = blockSequence.indexOf(currentBlockType);
    if (currentIdx >= 0 && currentIdx < blockSequence.length - 1) {
      targetBlockType = blockSequence[currentIdx + 1];
    }
  } else if ((direction === 'left' || direction === 'up') && currentBlockType !== 'unknown') {
    // Zum vorherigen Block in der Sequenz
    const currentIdx = blockSequence.indexOf(currentBlockType);
    if (currentIdx > 0 && currentIdx < blockSequence.length) {
      targetBlockType = blockSequence[currentIdx - 1];
    }
  }
  
  // Durchlaufe alle Elemente und finde das am besten passende Element in der gewünschten Richtung
  inputRefs.current.forEach((el, idx) => {
    if (!el || idx === currentIndex) return;
    
    const rect = elementPositions.get(idx);
    if (!rect) return;
    
    // Feststellen, ob dieses Element im selben oder im Ziel-Block ist
    const elBlock = el.closest('.bg-muted\\/30');
    if (!elBlock) return;
    
    const elTitleEl = elBlock.querySelector('.text-xs.font-medium');
    if (!elTitleEl) return;
    
    const elTitleText = elTitleEl.textContent?.toLowerCase() || '';
    const elBlockType = getBlockTypeFromTitle(elTitleText);
    
    // Prüfen, ob das Element im gewünschten Block ist (innerhalb des Blocks oder im Ziel-Block)
    const inTargetBlock = 
      (direction === 'left' || direction === 'right') ? 
        // Für horizontale Navigation: Bevorzugen Sie Elemente im selben Block
        elBlockType === currentBlockType || 
        // Bei Bedarf wechseln Sie zum nächsten/vorherigen Block
        (currentBlockType !== targetBlockType && elBlockType === targetBlockType)
      : 
        // Für vertikale Navigation: Bevorzugen Sie Elemente im gleichen oder Ziel-Block
        elBlockType === currentBlockType || elBlockType === targetBlockType;
    
    if (!inTargetBlock) return;
    
    // Berechnungen für horizontale Navigation
    if (direction === 'right' && rect.left <= currentRect.right) return; // Muss rechts sein
    if (direction === 'left' && rect.right >= currentRect.left) return;  // Muss links sein
    
    // Berechnungen für vertikale Navigation
    if (direction === 'down' && rect.top <= currentRect.bottom) return; // Muss unten sein
    if (direction === 'up' && rect.bottom >= currentRect.top) return;   // Muss oben sein
    
    // Berechnung eines Näherungswerts für verschiedene Richtungen
    let score = 0;
    
    if (direction === 'right') {
      // Horizontaler Abstand: je kleiner, desto besser
      score = rect.left - currentRect.right;
      // Vertikaler Unterschied (quadriert für stärkere Gewichtung)
      score += Math.pow(Math.abs(rect.top - currentRect.top), 2) * 0.1;
    } else if (direction === 'left') {
      // Horizontaler Abstand: je kleiner, desto besser
      score = currentRect.left - rect.right;
      // Vertikaler Unterschied (quadriert für stärkere Gewichtung)
      score += Math.pow(Math.abs(rect.top - currentRect.top), 2) * 0.1;
    } else if (direction === 'down') {
      // Vertikaler Abstand: je kleiner, desto besser
      score = rect.top - currentRect.bottom;
      // Horizontaler Unterschied (quadriert für stärkere Gewichtung)
      score += Math.pow(Math.abs(rect.left - currentRect.left), 2) * 0.1;
    } else if (direction === 'up') {
      // Vertikaler Abstand: je kleiner, desto besser
      score = currentRect.top - rect.bottom;
      // Horizontaler Unterschied (quadriert für stärkere Gewichtung)
      score += Math.pow(Math.abs(rect.left - currentRect.left), 2) * 0.1;
    }
    
    // Wenn wir zwischen Blöcken wechseln, fügen wir eine Bevorzugung für das erste oder letzte Element hinzu
    if (elBlockType !== currentBlockType) {
      // Bevorzugung für das erste Element des nächsten Blocks (nach rechts/unten)
      if ((direction === 'right' || direction === 'down') && 
          blockRefs.current.elements[elBlockType] && 
          blockRefs.current.elements[elBlockType][0] === el) {
        score -= 1000; // Starke Bevorzugung für das erste Element
      }
      // Bevorzugung für das letzte Element des vorherigen Blocks (nach links/oben)
      else if ((direction === 'left' || direction === 'up') && 
              blockRefs.current.elements[elBlockType] && 
              blockRefs.current.elements[elBlockType][blockRefs.current.elements[elBlockType].length - 1] === el) {
        score -= 1000; // Starke Bevorzugung für das letzte Element
      }
    }
    
    // Speichern Sie das Element mit dem besten Score
    if (score < bestMatchScore) {
      bestMatchScore = score;
      bestMatchIndex = idx;
    }
  });
  
  if (bestMatchIndex !== -1 && inputRefs.current[bestMatchIndex]) {
    return inputRefs.current[bestMatchIndex];
  }
  
  // Fallback für verschiedene Szenarien
  
  // Wenn kein passendes Element gefunden wurde, versuche zum nächsten/vorherigen Block zu springen
  if (targetBlockType !== currentBlockType) {
    if (blockRefs.current.elements[targetBlockType]?.length > 0) {
      if (direction === 'right' || direction === 'down') {
        // Erstes Element im Ziel-Block
        return blockRefs.current.elements[targetBlockType][0] as HTMLElement;
      } else {
        // Letztes Element im Ziel-Block
        const lastIdx = blockRefs.current.elements[targetBlockType].length - 1;
        return blockRefs.current.elements[targetBlockType][lastIdx] as HTMLElement;
      }
    }
  }
  
  return null;
};

export default function TradeDetail({ selectedTrade, onTradeSelected }: TradeDetailProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [editMode, setEditMode] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  
  // Refs für alle Eingabefelder, um Navigation per Enter zu ermöglichen
  const inputRefs = useRef<Array<HTMLElement | null>>([]);
  
  // Type Definition für blockRefs mit korrekter Definition von blockSequence
  interface BlockRefs {
    setup: HTMLElement | null;
    trends: HTMLElement | null;
    position: HTMLElement | null;
    risk: HTMLElement | null;
    marktzonen: HTMLElement | null;
    ergebnis: HTMLElement | null;
    elements: { [key: string]: Array<HTMLElement | null> };
    blockSequence?: string[];
  }
  
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
  
  // State für Felder, auf die einmal geklickt wurde (erste Klick)
  const [firstClickFields, setFirstClickFields] = useState<Record<string, boolean>>({});
  
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

  // KOMPLETT NEUE, VEREINFACHTE IMPLEMENTATION DER TASTATURNAVIGATION
  const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>, index: number) => {
    // Das aktuelle Element finden
    const currentElement = inputRefs.current[index];
    if (!currentElement) return;

    // Die Block-Sequenz definieren
    const blockSequence = ["setup", "trends", "position", "marktzonen", "ergebnis"];
    
    // Bei Pfeil-Tasten: Navigation zwischen Elementen
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown' || 
        event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();

      // 1. Alle Interaktiven Elemente sammeln und nach Position sortieren
      const elements = inputRefs.current
        .filter(Boolean)
        .map((el, idx) => ({
          element: el,
          rect: el.getBoundingClientRect(),
          index: idx
        }));

      // Die aktuelle Position merken
      const currentRect = currentElement.getBoundingClientRect();

      // Das Ziel-Element basierend auf Richtung finden
      let bestMatch = null;
      
      // HOCH/RUNTER NAVIGATION
      if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
        // Vertikal sortieren für einfachere Navigation
        const sortedByVertical = [...elements].sort((a, b) => 
          event.key === 'ArrowDown' 
            ? a.rect.top - b.rect.top  // Für ArrowDown: von oben nach unten
            : b.rect.bottom - a.rect.bottom  // Für ArrowUp: von unten nach oben
        );
        
        // Das aktuelle Element in der sortierten Liste finden
        const currentIndex = sortedByVertical.findIndex(item => item.index === index);
        
        // Wenn gefunden, zum nächsten/vorherigen Element gehen
        if (currentIndex !== -1) {
          const targetIndex = event.key === 'ArrowDown' ? currentIndex + 1 : currentIndex - 1;
          
          // Sicherstellen, dass wir innerhalb der Grenzen sind
          if (targetIndex >= 0 && targetIndex < sortedByVertical.length) {
            bestMatch = sortedByVertical[targetIndex];
          }
        }
      }
      
      // LINKS/RECHTS NAVIGATION
      if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
        // Horizontal sortieren für einfachere Navigation
        const sortedByHorizontal = [...elements].sort((a, b) => 
          event.key === 'ArrowRight' 
            ? a.rect.left - b.rect.left  // Für ArrowRight: von links nach rechts
            : b.rect.right - a.rect.right  // Für ArrowLeft: von rechts nach links
        );
        
        // Das aktuelle Element in der sortierten Liste finden
        const currentIndex = sortedByHorizontal.findIndex(item => item.index === index);
        
        // Wenn gefunden, zum nächsten/vorherigen Element gehen
        if (currentIndex !== -1) {
          const targetIndex = event.key === 'ArrowRight' ? currentIndex + 1 : currentIndex - 1;
          
          // Sicherstellen, dass wir innerhalb der Grenzen sind
          if (targetIndex >= 0 && targetIndex < sortedByHorizontal.length) {
            bestMatch = sortedByHorizontal[targetIndex];
          }
        }
      }
      
      // Wenn ein gültiges Ziel gefunden wurde, dorthin navigieren
      if (bestMatch && bestMatch.element) {
        bestMatch.element.focus();
      }
    }
    
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

  // Prüft, ob ein Feld leer ist
  const isEmptyField = (value: any): boolean => {
    if (value === undefined || value === null || value === '') return true;
    if (typeof value === 'number' && isNaN(value)) return true;
    return false;
  };

  // Update-Funktion für Felder
  const updateField = <K extends keyof Trade>(field: K, value: Trade[K]) => {
    // Prüfe, ob das Feld leer ist und zuvor noch nicht angeklickt wurde
    const isEmpty = isEmptyField(value);
    const fieldId = String(field);
    
    if (isEmpty) {
      // Wenn das Feld zum ersten Mal angeklickt wird (und leer ist)
      if (!firstClickFields[fieldId]) {
        console.log(`Erster Klick auf leeres Feld: ${fieldId}`);
        
        // Markiere das Feld als "einmal angeklickt"
        setFirstClickFields(prev => ({
          ...prev,
          [fieldId]: true
        }));
        
        // Nicht in editData speichern beim ersten Klick
        return;
      }
      
      // Beim zweiten Klick auf das leere Feld, zurücksetzen und speichern
      console.log(`Zweiter Klick auf leeres Feld: ${fieldId} - wird gespeichert`);
      setFirstClickFields(prev => {
        const newState = { ...prev };
        delete newState[fieldId]; // Zurücksetzen des "ersten Klicks"
        return newState;
      });
    } else {
      // Wenn das Feld nicht leer ist, setze den ersten Klick zurück
      if (firstClickFields[fieldId]) {
        setFirstClickFields(prev => {
          const newState = { ...prev };
          delete newState[fieldId];
          return newState;
        });
      }
    }
    
    // Aktualisiere die editData
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
    setFirstClickFields({}); // Reset der Klick-Zustände
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
    
    // Alle "ersten Klick"-Status zurücksetzen
    setFirstClickFields({});
    
    // Hinweis für den Benutzer einblenden
    if (Object.keys(firstClickFields).length > 0) {
      toast({
        title: "Hinweis",
        description: "Leere Felder werden erst nach dem zweiten Klick gespeichert.",
        duration: 3000
      });
    }
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
      chartImage: base64Image,
      ...editData // Füge alle aktuellen bearbeiteten Daten hinzu
    };
    
    // API-Aufruf mit allen Trade-Details
    updateTradeMutation.mutate({
      id: selectedTrade.id,
      chartImage: base64Image,
      ...editData, // Speichere alle Änderungen, nicht nur das Chart-Bild
      userId: selectedTrade.userId || 2
    });
    
    // Sofort die UI mit den aktuellen Daten aktualisieren
    onTradeSelected(updatedTradeData);
    
    // Feedback für den Benutzer
    toast({
      title: "Trade gespeichert",
      description: "Der Chart und alle Trade-Details wurden erfolgreich gespeichert."
    });
  };

  // State um zu verfolgen, ob einmal auf den Hintergrund geklickt wurde
  const [backgroundClicked, setBackgroundClicked] = useState(false);
  
  // Zurücksetzen des Background-Click-Status, wenn der Edit-Modus beendet wird
  useEffect(() => {
    if (!editMode) {
      setBackgroundClicked(false);
    }
  }, [editMode]);

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
        // Beim ersten Klick auf den Hintergrund
        if (!backgroundClicked) {
          // Nur markieren, dass einmal geklickt wurde
          setBackgroundClicked(true);
          toast({
            title: "Hinweis",
            description: "Klicken Sie erneut, um die Bearbeitung zu speichern.",
            duration: 3000
          });
          return;
        }
        
        // Beim zweiten Klick auf den Hintergrund
        // Speichere vorhandene Änderungen und beende den Edit-Modus
        saveChanges();
        setBackgroundClicked(false); // Zurücksetzen für nächste Bearbeitung
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
              {backgroundClicked 
                ? "Klicken Sie erneut auf den Hintergrund, um zu speichern" 
                : "Bearbeitungsmodus aktiv - Doppelklick zum Speichern"}
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
                  {/* M15 und M5 Spalten wurden entfernt */}
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
                            ref={(el) => { inputRefs.current[13] = el; }} 
                            onKeyDown={(e) => handleKeyDown(e, 13)}
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
                      <div className="text-xs text-muted-foreground font-medium">Liquidation Entry</div>
                      {editMode ? (
                        <Select 
                          value={editData.liquidationEntry || ''}
                          onValueChange={val => updateField('liquidationEntry', val)}
                        >
                          <SelectTrigger 
                            className="h-7 text-xs mt-0.5"
                            ref={(el) => { inputRefs.current[14] = el; }} 
                            onKeyDown={(e) => handleKeyDown(e, 14)}
                          >
                            <SelectValue placeholder="TF Auswählen" />
                          </SelectTrigger>
                          <SelectContent>
                            {["M1", "M5", "M15", "H1"].map((tf) => (
                              <SelectItem key={tf} value={tf}>
                                {tf}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <div className="font-medium text-sm mt-0.5">{selectedTrade.liquidationEntry || '-'}</div>
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
                            ref={(el) => { inputRefs.current[15] = el; }} 
                            onKeyDown={(e) => handleKeyDown(e, 15)}
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
                            ref={(el) => { inputRefs.current[16] = el; }} 
                            onKeyDown={(e) => handleKeyDown(e, 16)}
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
                            ref={(el) => { inputRefs.current[25] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 25)}
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
                            ref={(el) => { inputRefs.current[26] = el; }}
                            onKeyDown={(e) => handleKeyDown(e, 26)}
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
                          inputRef={(el) => { inputRefs.current[17] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 17)}
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
                          inputRef={(el) => { inputRefs.current[19] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 19)}
                        >
                          {[-1, 0, ...[1, 2, 3, 4, 5, 6, 7]].map((val) => (
                            <Button
                              key={val}
                              type="button"
                              variant={editData.rrAchieved === val ? "default" : "outline"}
                              size="sm"
                              className={`p-1 h-6 text-[10px] flex-1 ${
                                val === -1 ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 
                                val === 0 ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400' : ''
                              }`}
                              onClick={() => updateField('rrAchieved', val)}
                              tabIndex={-1}
                            >
                              {val === 0 ? 'BE' : `${val}R`}
                            </Button>
                          ))}
                        </ButtonGroupWrapper>
                      ) : (
                        <div className="font-medium text-sm mt-0.5">
                          {selectedTrade.rrAchieved !== null ? 
                            (selectedTrade.rrAchieved === 0 ? 'BE' : `${selectedTrade.rrAchieved}R`) 
                            : '-'}
                        </div>
                      )}
                    </div>
                    <div className="bg-background/50 rounded-sm p-1.5">
                      <div className="text-xs text-muted-foreground font-medium">RR Potential</div>
                      {editMode ? (
                        <ButtonGroupWrapper 
                          className="flex gap-1 flex-wrap mt-0.5"
                          tabIndex={0}
                          inputRef={(el) => { inputRefs.current[21] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 21)}
                        >
                          {[-1, 0, ...[1, 2, 3, 4, 5, 6, 7]].map((val) => (
                            <Button
                              key={val}
                              type="button"
                              variant={editData.rrPotential === val ? "default" : "outline"}
                              size="sm"
                              className={`p-1 h-6 text-[10px] flex-1 ${
                                val === -1 ? 'bg-red-500/10 hover:bg-red-500/20 text-red-400' : 
                                val === 0 ? 'bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-400' : ''
                              }`}
                              onClick={() => updateField('rrPotential', val)}
                              tabIndex={-1}
                            >
                              {val === 0 ? 'BE' : `${val}R`}
                            </Button>
                          ))}
                        </ButtonGroupWrapper>
                      ) : (
                        <div className="font-medium text-sm mt-0.5">
                          {selectedTrade.rrPotential !== null ? 
                            (selectedTrade.rrPotential === 0 ? 'BE' : `${selectedTrade.rrPotential}R`) 
                            : '-'}
                        </div>
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
                          inputRef={(el) => { inputRefs.current[23] = el; }}
                          onKeyDown={(e) => handleKeyDown(e, 23)}
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