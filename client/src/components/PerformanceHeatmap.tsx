import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Rectangle, ScatterChart, Scatter, Cell, Legend } from "recharts";
import { Loader2, MousePointer, Hand, Download, ZoomIn, ZoomOut, RefreshCw, SlidersHorizontal, Lightbulb, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { SafeSelectItem } from "@/components/ui/safe-select-item";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// Define a simplified trade interface for the heatmap
type HeatmapTrade = {
  id: number;
  symbol: string;
  setup: string;
  isWin: boolean;
  profitLoss: number;
  rrAchieved: number;
  accountType: string;
  date: string;
  size: number;
  direction: string;
  session: string;
  location: string;
  [key: string]: any; // For any other properties
};

type HeatmapDataPoint = {
  day: string;
  timeframe: string;
  value: number;
  tradeCount: number;
  winRate: number;
  avgRR: string;
  totalPnL: string;
  x?: number;
  y?: number;
  isComparison?: boolean;
  valueLabel?: string;
  trades: HeatmapTrade[]; // Explizite Liste der Trades für diese Zelle
};

type HeatmapRecommendation = {
  day: string;
  time: string;
  winRate: number;
  avgRR: string;
};

type HeatmapTrend = {
  type: string;
  message: string;
};

type HeatmapRecommendations = {
  bestTimes: HeatmapRecommendation[];
  worstTimes: HeatmapRecommendation[];
  trends: HeatmapTrend[];
};

type HeatmapFilters = {
  availableSetups: string[];
  availableSymbols: string[];
  availableDirections: string[];
};

type HeatmapData = {
  days: string[];
  timeframe: string[];
  data: HeatmapDataPoint[];
  comparison?: HeatmapDataPoint[];
  recommendations?: HeatmapRecommendations;
  filters?: HeatmapFilters;
};

interface CustomTooltipProps {
  active?: boolean;
  payload?: any[];
  label?: string;
}

// Benutzerdefinierter Tooltip für die Heatmap
// Funktion zur Generierung von Beispieldaten für die Heatmap
// Die Beispieldaten-Funktion wird nicht mehr benötigt, da wir die Daten direkt zurückgeben
// Für die Typisierung behalten wir die Funktion, aber sie wird nicht mehr verwendet
function generateSampleHeatmapData(): HeatmapData {
  // Dummy-Return, wird nicht verwendet
  return {
    days: [],
    timeframe: [],
    data: [],
    filters: {
      availableSetups: [],
      availableSymbols: [],
      availableDirections: []
    }
  };
}

const CustomTooltip = ({ active, payload }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-card text-card-foreground border p-2 rounded-md shadow-md">
        <p className="font-bold">{data.day}, {data.timeframe} Uhr</p>
        <p className="text-sm">Trades: {data.tradeCount}</p>
        <p className="text-sm">Win-Rate: {data.winRate}%</p>
        <p className="text-sm">Durchschn. RR: {data.avgRR}</p>
        <p className="text-sm">Gesamt P/L: {data.totalPnL}$</p>
      </div>
    );
  }

  return null;
};

// Benutzerdefinierter Punkt (Rechteck) für die Heatmap
interface CustomPointProps {
  x: number;
  y: number;
  width: number;
  height: number;
  value: number;
  tradeCount: number;
  day: string;
  timeframe: string;
  isSelected: boolean;
  winRate?: number;
  avgRR?: string;
  totalPnL?: string;
  trades?: HeatmapTrade[]; // Use our defined type
  onClick: (data: HeatmapDataPoint) => void;
}

const CustomPoint = (props: CustomPointProps) => {
  const { x, y, width, height, value, isSelected, onClick } = props;
  
  // Farbskala für die Heatmap 
  // Grün für gute Performance, Rot für schlechte, Grau für keine Daten
  const getColor = (value: number, tradeCount: number) => {
    if (tradeCount === 0) return "#374151"; // Grau für keine Daten
    
    if (value >= 80) return "#059669"; // Dunkelgrün für sehr gut
    if (value >= 60) return "#10b981"; // Grün für gut
    if (value >= 50) return "#a3e635"; // Hellgrün für durchschnittlich
    if (value >= 40) return "#facc15"; // Gelb für passabel
    if (value >= 30) return "#f97316"; // Orange für schlecht
    return "#ef4444"; // Rot für sehr schlecht
  };

  // Intensität basierend auf der Anzahl der Trades
  const getOpacity = (tradeCount: number) => {
    if (tradeCount === 0) return 0.15;
    if (tradeCount <= 2) return 0.4;
    if (tradeCount <= 5) return 0.6;
    if (tradeCount <= 10) return 0.8;
    return 1;
  };

  const handleClick = () => {
    console.log("CustomPoint clicked - original props:", props);
    // Alle Eigenschaften der Zelle an den Handler übergeben
    const cellData = {
      day: props.day,
      timeframe: props.timeframe,
      value: props.value,
      tradeCount: props.tradeCount,
      winRate: props.winRate || props.value, // Korrekte Win-Rate verwenden
      avgRR: props.avgRR || "0", // Durchschnittliches RR verwenden
      totalPnL: props.totalPnL || "0", // Korrekten P/L-Wert verwenden
      x: props.x,
      y: props.y,
      trades: props.trades || [] // Liste der dazugehörigen Trades weitergeben
    };
    
    console.log("Passing cell data to onClick handler:", cellData);
    console.log("Trade data being passed:", cellData.trades);
    
    onClick(cellData);
  };

  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={getColor(value, props.tradeCount)}
      opacity={getOpacity(props.tradeCount)}
      stroke={isSelected ? "#ffffff" : "none"}
      strokeWidth={isSelected ? 2 : 0}
      style={{ cursor: 'pointer' }}
      onClick={handleClick}
    />
  );
};

// Zeitraum-Optionen für Filter
type TimeRangeOption = {
  label: string;
  value: string;
  days: number;
};

const timeRangeOptions: TimeRangeOption[] = [
  { label: "Alle Daten", value: "all", days: 0 },
  { label: "Letzte Woche", value: "last_week", days: 7 },
  { label: "Letzter Monat", value: "last_month", days: 30 },
  { label: "Letztes Quartal", value: "last_quarter", days: 90 },
  { label: "Letztes Jahr", value: "last_year", days: 365 },
];

interface PerformanceHeatmapProps {
  activeFilters?: any;
}

export default function PerformanceHeatmap({ activeFilters }: PerformanceHeatmapProps) {
  const [dataType, setDataType] = useState<"winRate" | "avgRR" | "pnl">("winRate");
  const [selectedCell, setSelectedCell] = useState<HeatmapDataPoint | null>(null);
  const [interactionMode, setInteractionMode] = useState<"hover" | "click">("hover");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [setupFilter, setSetupFilter] = useState<string>("all");
  const [symbolFilter, setSymbolFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [compareMode, setCompareMode] = useState<string>("none");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const [showTradeDetails, setShowTradeDetails] = useState<boolean>(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Berechne Datumsgrenzen basierend auf dem ausgewählten Zeitraum
  const getDateRange = () => {
    const selectedOption = timeRangeOptions.find(option => option.value === timeRange);
    if (!selectedOption || selectedOption.value === 'all') {
      return null; // Kein Datumsfilter, wenn "Alle Daten" ausgewählt ist
    }
    
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - selectedOption.days);
    
    return {
      startDate: startDate.toISOString().split('T')[0], // Format: YYYY-MM-DD
      endDate: endDate.toISOString().split('T')[0]
    };
  };
  
  // Datumsbereich für die API-Anfrage
  const dateRange = getDateRange();

  // Daten aus der API abrufen
  const { data: heatmapData, isLoading, error } = useQuery<HeatmapData>({
    queryKey: ["/api/performance-heatmap", timeRange, setupFilter, symbolFilter, directionFilter, compareMode, activeFilters, user?.id],
    queryFn: async () => {
      // URL mit Parametern aufbauen - dynamische userId vom eingeloggten Benutzer verwenden
      let url = `/api/performance-heatmap?userId=${user?.id || ''}`;
      
      console.log("Fetching heatmap data with URL:", url);
      
      // Die activeFilters von der TradeTable übertragen, wenn sie existieren
      if (activeFilters) {
        console.log("Active filters from TradeTable:", activeFilters);
        // Nutze die Daten aus der TradeTable für eine präzisere Heatmap-Darstellung
        
        // Datumsfilter aus TradeTable
        if (activeFilters.startDate && activeFilters.endDate) {
          // Datums-Strings extrahieren
          const startDate = new Date(activeFilters.startDate).toISOString().split('T')[0];
          const endDate = new Date(activeFilters.endDate).toISOString().split('T')[0];
          url += `&startDate=${startDate}&endDate=${endDate}`;
        } 
        // Ansonsten den Datumsfilter aus der Heatmap verwenden
        else if (dateRange) {
          url += `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        }
        
        // Symbole aus TradeTable-Filter
        if (activeFilters.symbols && activeFilters.symbols.length > 0) {
          url += `&symbols=${encodeURIComponent(JSON.stringify(activeFilters.symbols))}`;
        } 
        // Ansonsten den Symbol-Filter aus der Heatmap verwenden
        else if (symbolFilter && symbolFilter !== "all") {
          url += `&symbol=${symbolFilter}`;
        }
        
        // Setups aus TradeTable-Filter
        if (activeFilters.setups && activeFilters.setups.length > 0) {
          url += `&setups=${encodeURIComponent(JSON.stringify(activeFilters.setups))}`;
        }
        // Ansonsten den Setup-Filter aus der Heatmap verwenden
        else if (setupFilter && setupFilter !== "all") {
          url += `&setup=${setupFilter}`;
        }
        
        // Füge weitere Filter hinzu (Win/Loss, Trends, Strukturen usw.)
        if (activeFilters.isWin !== null) {
          url += `&isWin=${activeFilters.isWin}`;
        }
        
        // Marktphasen
        if (activeFilters.marketPhases && activeFilters.marketPhases.length > 0) {
          url += `&marketPhases=${encodeURIComponent(JSON.stringify(activeFilters.marketPhases))}`;
        }
        
        // Zeitzonen/Sessions
        if (activeFilters.sessions && activeFilters.sessions.length > 0) {
          url += `&sessions=${encodeURIComponent(JSON.stringify(activeFilters.sessions))}`;
        }
      } 
      // Wenn keine activeFilters vorhanden sind, verwende die Filter der Heatmap
      else {
        // Zeitraum-Filter hinzufügen
        if (dateRange) {
          url += `&startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`;
        }
        
        // Setup-Filter hinzufügen
        if (setupFilter && setupFilter !== "all") {
          url += `&setup=${setupFilter}`;
        }
        
        // Symbol-Filter hinzufügen
        if (symbolFilter && symbolFilter !== "all") {
          url += `&symbol=${symbolFilter}`;
        }
        
        // Richtungs-Filter hinzufügen
        if (directionFilter && directionFilter !== "all") {
          url += `&direction=${directionFilter}`;
        }
      }
      
      // Vergleichsmodus-Parameter hinzufügen
      if (compareMode && compareMode !== "none") {
        url += `&compareWith=${compareMode}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Heatmap-Daten');
      }
      const data = await response.json();
      
      console.log("Heatmap API Response:", data);
      
      // Überprüfe, ob Trades in den Daten enthalten sind
      if (data.data && data.data.length > 0) {
        console.log("Stichprobe erster Datenpunkt:", data.data[0]);
        console.log("Trades in erstem Datenpunkt:", data.data[0].trades ? data.data[0].trades.length : "keine Trades");
        
        // Wenn Trades vorhanden sind, einen Trade zur Überprüfung ausgeben
        if (data.data[0].trades && data.data[0].trades.length > 0) {
          console.log("Beispiel-Trade:", data.data[0].trades[0]);
        }
      }
      
      // Stelle sicher, dass alle Daten valide sind, bereinige leere Werte
      // Reinige die Daten und entferne leere Werte aus den Filtern
      if (!data.filters) {
        data.filters = {
          availableSetups: [],
          availableSymbols: [],
          availableDirections: []
        };
      }
      
      // Bereite einen festen Satz an Fallback-Daten vor
      const hardcodedData = {
        days: ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"],
        timeframe: ["04-08", "08-10", "10-12", "12-14", "14-16", "16-18", "18-22"],
        data: [],
        recommendations: {
          bestTimes: [],
          worstTimes: [],
          trends: []
        },
        filters: {
          availableSetups: [],
          availableSymbols: [],
          availableDirections: []
        }
      };
      
      // Reinige die Filter-Arrays von leeren Werten
      if (data.filters) {
        data.filters.availableSetups = (data.filters.availableSetups || [])
          .filter(setup => setup && setup !== "" && setup !== null)
          .map(setup => String(setup).trim());
            
        data.filters.availableSymbols = (data.filters.availableSymbols || [])
          .filter(symbol => symbol && symbol !== "" && symbol !== null)
          .map(symbol => String(symbol).trim());
            
        data.filters.availableDirections = (data.filters.availableDirections || [])
          .filter(direction => direction && direction !== "" && direction !== null)
          .map(direction => String(direction).trim());
      }
      
      // Wenn keine Daten vorhanden sind, zeige leere Daten
      if (!data.data || data.data.length === 0) {
        console.log("Keine Daten vom Server - zeige leere Heatmap");
        return {
          ...hardcodedData,
          filters: data.filters // Behalte bereinigte Filter bei
        };
      }
      
      return data;
    },
    staleTime: 60000, // 1 Minute Cache
  });

  // Daten für die Visualisierung transformieren
  const transformedData = useRef<HeatmapDataPoint[]>([]);
  const transformedComparisonData = useRef<HeatmapDataPoint[]>([]);
  
  // Handling für Datentypänderungen - mit Animation
  useEffect(() => {
    if (heatmapData && heatmapData.data) {
      // Interaktivitätstyp-Label aktualisieren
      const modeText = interactionMode === 'hover' ? 'Hover-Modus aktiv' : 'Klick-Modus aktiv';
      
      // Funktion zum Transformieren von Daten für die Visualisierung
      const transformData = (data: HeatmapDataPoint[], isComparison = false) => {
        console.log("Transformiere Daten für Visualisierung:", data);
        
        // Prüfe, ob Trades in den Daten vorhanden sind
        const pointsWithTrades = data.filter(point => point.trades && point.trades.length > 0);
        console.log(`${pointsWithTrades.length} von ${data.length} Punkten haben Trades`);
        
        if (pointsWithTrades.length > 0) {
          console.log("Beispiel-Punkt mit Trades:", pointsWithTrades[0]);
        }
        
        return data.map((point) => {
          const dayIndex = heatmapData.days.indexOf(point.day);
          const timeIndex = heatmapData.timeframe.indexOf(point.timeframe);
          
          let value = point.winRate; // Standardwert ist Win-Rate
          let valueLabel = '%';
          
          if (dataType === "avgRR") {
            value = parseFloat(point.avgRR) * 20; // Skalieren für bessere Visualisierung
            valueLabel = 'R';
          } else if (dataType === "pnl") {
            const pnl = parseFloat(point.totalPnL);
            // Skalieren von PnL für die Farbgebung (einfache lineare Skalierung)
            value = pnl > 0 ? Math.min(pnl / 10, 100) : Math.max(0, 50 + pnl / 10);
            valueLabel = '$';
          }
          
          // Stelle sicher, dass trades übergeben werden
          if (!point.trades) {
            console.warn("Punkt ohne Trades gefunden:", point);
          }
          
          return {
            ...point,
            x: timeIndex,
            y: dayIndex,
            value: value,
            valueLabel,
            isComparison,
            // Sicherstellen, dass trades explizit kopiert wird
            trades: point.trades || []
          };
        });
      };
      
      // Hauptdaten transformieren
      const newData = transformData(heatmapData.data);
      
      // Vergleichsdaten transformieren, falls vorhanden
      if (heatmapData.comparison) {
        const comparisonData = transformData(heatmapData.comparison, true);
        setTimeout(() => {
          transformedComparisonData.current = comparisonData;
        }, 50);
      }
      
      // Animation bei Datentypwechsel 
      setTimeout(() => {
        transformedData.current = newData;
      }, 50);
    }
  }, [heatmapData, dataType, interactionMode, compareMode]);
  
  // Feedback beim Ändern des Interaktionsmodus
  useEffect(() => {
    if (interactionMode === 'hover') {
      toast({
        title: "Hover-Modus aktiviert",
        description: "Bewege den Mauszeiger über die Heatmap, um Details zu sehen.",
        variant: "default",
      });
    } else {
      toast({
        title: "Klick-Modus aktiviert", 
        description: "Klicke auf die Heatmap, um Details zu sehen.",
        variant: "default",
      });
    }
  }, [interactionMode, toast]);
  
  if (isLoading) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Performance Heatmap</CardTitle>
          <CardDescription>Analyse deiner Trading-Performance nach Wochentag und Uhrzeit</CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }
  
  if (error) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Performance Heatmap</CardTitle>
          <CardDescription>Analyse deiner Trading-Performance nach Wochentag und Uhrzeit</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-destructive">
            Fehler beim Laden der Heatmap-Daten. Bitte versuche es später erneut.
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Wenn keine Daten vorhanden sind
  if (!heatmapData || !heatmapData.data || heatmapData.data.length === 0) {
    return (
      <Card className="col-span-2">
        <CardHeader>
          <CardTitle>Performance Heatmap</CardTitle>
          <CardDescription>Analyse deiner Trading-Performance nach Wochentag und Uhrzeit</CardDescription>
        </CardHeader>
        <CardContent className="p-4">
          <div className="text-center text-muted-foreground">
            Keine Daten verfügbar. Füge Trades hinzu, um deine Performance-Heatmap zu sehen.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="col-span-2">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div>
          <CardTitle>Session Heatmap</CardTitle>
          <CardDescription>Analyse deiner Trading-Performance nach Wochentag und Uhrzeit</CardDescription>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select
            value={timeRange}
            onValueChange={setTimeRange}
          >
            <SelectTrigger className="w-[160px] bg-black/50">
              <SelectValue placeholder="Zeitraum" />
            </SelectTrigger>
            <SelectContent>
              {timeRangeOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Select
            value={dataType}
            onValueChange={(value) => setDataType(value as "winRate" | "avgRR" | "pnl")}
          >
            <SelectTrigger className="w-[160px] bg-black/50">
              <SelectValue placeholder="Win-Rate" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="winRate">Win-Rate</SelectItem>
              <SelectItem value="avgRR">Durchschn. RR</SelectItem>
              <SelectItem value="pnl">Profit/Loss</SelectItem>
            </SelectContent>
          </Select>
          
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-black/50 border-muted"
              onClick={() => setInteractionMode(interactionMode === 'hover' ? 'click' : 'hover')}
              title={interactionMode === 'hover' ? 'Auf Klickmodus umschalten' : 'Auf Hovermodus umschalten'}
            >
              {interactionMode === 'hover' ? <MousePointer className="h-4 w-4" /> : <Hand className="h-4 w-4" />}
            </Button>
            
            <Button
              variant="outline" 
              size="icon"
              className="h-9 w-9 bg-black/50 border-muted"
              onClick={() => setShowLegend(!showLegend)}
              title={showLegend ? 'Legende ausblenden' : 'Legende einblenden'}
            >
              <Badge className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-black/50 border-muted"
              onClick={() => {
                if (zoomLevel < 1.5) setZoomLevel(zoomLevel + 0.25);
              }}
              disabled={zoomLevel >= 1.5}
              title="Vergrößern"
            >
              <ZoomIn className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-black/50 border-muted"
              onClick={() => {
                if (zoomLevel > 0.5) setZoomLevel(zoomLevel - 0.25);
              }}
              disabled={zoomLevel <= 0.5}
              title="Verkleinern"
            >
              <ZoomOut className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-black/50 border-muted"
              onClick={() => {
                setZoomLevel(1);
                setSelectedCell(null);
                setShowLegend(false);
              }}
              title="Zurücksetzen"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              className="h-9 w-9 bg-black/50 border-muted"
              onClick={() => {
                if (!heatmapData || !heatmapData.data) return;
                
                // Daten für CSV-Export aufbereiten
                let csvContent = "Tag,Uhrzeit,Trades,Win-Rate,Durchschn. RR,Profit/Loss\n";
                
                heatmapData.data.forEach(point => {
                  if (point.tradeCount > 0) {
                    csvContent += `${point.day},${point.timeframe},${point.tradeCount},${point.winRate}%,${point.avgRR},${point.totalPnL}\n`;
                  }
                });
                
                // CSV-Datei erstellen und herunterladen
                const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.setAttribute('href', url);
                link.setAttribute('download', 'performance-heatmap.csv');
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                toast({
                  title: "Export erfolgreich",
                  description: "Die Heatmap-Daten wurden als CSV-Datei exportiert.",
                });
              }}
              title="Als CSV exportieren"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filter und Einstellungen */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 bg-black/50 border-muted"
              onClick={() => setShowFilters(!showFilters)}
            >
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
              Filter {showFilters ? 'ausblenden' : 'anzeigen'}
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              className="text-xs h-8 bg-black/50 border-muted"
              onClick={() => setShowRecommendations(!showRecommendations)}
            >
              <Lightbulb className="h-3.5 w-3.5 mr-1" />
              Empfehlungen {showRecommendations ? 'ausblenden' : 'anzeigen'}
            </Button>
          </div>
          
          <div className="flex items-center gap-2">
            <Select
              value={compareMode}
              onValueChange={setCompareMode}
            >
              <SelectTrigger className="w-[180px] h-8 text-xs bg-black/50 border-muted">
                <SelectValue placeholder="Vergleich deaktiviert" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Kein Vergleich</SelectItem>
                <SelectGroup>
                  <SelectLabel>Zeitraum-Vergleich</SelectLabel>
                  <SelectItem value="period:last30days">Mit letzten 30 Tagen</SelectItem>
                  <SelectItem value="period:last90days">Mit letzten 90 Tagen</SelectItem>
                  <SelectItem value="period:lastyear">Mit letztem Jahr</SelectItem>
                </SelectGroup>
                <SelectGroup>
                  <SelectLabel>Benutzer-Vergleich</SelectLabel>
                  <SelectItem value="user:1">Mit Mo vergleichen</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        {/* Erweiterte Filter */}
        {showFilters && heatmapData.filters && (
          <div className="mb-4 p-3 border border-border/40 rounded-md bg-muted/20">
            <h3 className="text-sm font-medium mb-2">Erweiterte Filter</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Setup-Filter */}
              <div>
                <Label htmlFor="setup-filter" className="text-xs mb-1">Setup</Label>
                <Select 
                  value={setupFilter}
                  onValueChange={setSetupFilter}
                >
                  <SelectTrigger id="setup-filter" className="h-8 text-xs bg-black/50">
                    <SelectValue placeholder="Alle Setups" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Setups</SelectItem>
                    {heatmapData.filters && heatmapData.filters.availableSetups && 
                      heatmapData.filters.availableSetups
                        .filter((setup: string | null) => setup && setup !== null && setup !== '')
                        .map((setup: string) => (
                          <SafeSelectItem key={setup} value={setup} fallbackValue="default_setup">
                            {setup}
                          </SafeSelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Symbol-Filter */}
              <div>
                <Label htmlFor="symbol-filter" className="text-xs mb-1">Symbol</Label>
                <Select 
                  value={symbolFilter}
                  onValueChange={setSymbolFilter}
                >
                  <SelectTrigger id="symbol-filter" className="h-8 text-xs bg-black/50">
                    <SelectValue placeholder="Alle Symbole" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Symbole</SelectItem>
                    {heatmapData.filters && heatmapData.filters.availableSymbols && 
                      heatmapData.filters.availableSymbols
                        .filter((symbol: string | null) => symbol && symbol !== null && symbol !== '')
                        .map((symbol: string) => (
                          <SafeSelectItem key={symbol} value={symbol} fallbackValue="default_symbol">
                            {symbol}
                          </SafeSelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
              
              {/* Richtungs-Filter */}
              <div>
                <Label htmlFor="direction-filter" className="text-xs mb-1">Richtung</Label>
                <Select 
                  value={directionFilter}
                  onValueChange={setDirectionFilter}
                >
                  <SelectTrigger id="direction-filter" className="h-8 text-xs bg-black/50">
                    <SelectValue placeholder="Alle Richtungen" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Richtungen</SelectItem>
                    {heatmapData.filters && heatmapData.filters.availableDirections && 
                      heatmapData.filters.availableDirections
                        .filter((direction: string | null) => direction && direction !== null && direction !== '')
                        .map((direction: string) => (
                          <SafeSelectItem key={direction} value={direction} fallbackValue="default_direction">
                            {direction}
                          </SafeSelectItem>
                        ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        )}
        
        {/* Empfehlungen-Panel */}
        {showRecommendations && heatmapData && heatmapData.recommendations && (
          <div className="mb-4 p-3 border border-border/40 rounded-md bg-muted/20">
            <h3 className="text-sm font-medium mb-2 flex items-center">
              <Lightbulb className="h-4 w-4 mr-1 text-yellow-400" />
              Trading Empfehlungen
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Beste Handelszeiten */}
              <div>
                <h4 className="text-xs font-medium mb-1 text-green-400">Top Handelszeiten:</h4>
                <div className="bg-black/40 rounded-sm p-2 text-xs">
                  <ul className="space-y-1">
                    {heatmapData.recommendations && heatmapData.recommendations.bestTimes && 
                      heatmapData.recommendations.bestTimes.map((time, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{time.day}, {time.time} Uhr</span>
                          <span className="text-green-400">{time.winRate}% Win-Rate</span>
                        </li>
                      ))}
                    {(!heatmapData.recommendations || !heatmapData.recommendations.bestTimes || heatmapData.recommendations.bestTimes.length === 0) && (
                      <li className="text-muted-foreground">Keine Daten verfügbar</li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Zu vermeidende Handelszeiten */}
              <div>
                <h4 className="text-xs font-medium mb-1 text-red-400">Zu vermeidende Zeiten:</h4>
                <div className="bg-black/40 rounded-sm p-2 text-xs">
                  <ul className="space-y-1">
                    {heatmapData.recommendations && heatmapData.recommendations.worstTimes && 
                      heatmapData.recommendations.worstTimes.map((time, idx) => (
                        <li key={idx} className="flex justify-between">
                          <span>{time.day}, {time.time} Uhr</span>
                          <span className="text-red-400">{time.winRate}% Win-Rate</span>
                        </li>
                      ))}
                    {(!heatmapData.recommendations || !heatmapData.recommendations.worstTimes || heatmapData.recommendations.worstTimes.length === 0) && (
                      <li className="text-muted-foreground">Keine Daten verfügbar</li>
                    )}
                  </ul>
                </div>
              </div>
              
              {/* Weitere Insights */}
              {heatmapData.recommendations && heatmapData.recommendations.trends && heatmapData.recommendations.trends.length > 0 && (
                <div className="md:col-span-2 mt-1">
                  <h4 className="text-xs font-medium mb-1 text-blue-400">Trading Insights:</h4>
                  <div className="bg-black/40 rounded-sm p-2 text-xs">
                    <ul className="space-y-1">
                      {heatmapData.recommendations.trends.map((trend, idx) => (
                        <li key={idx} className="flex items-start gap-1">
                          <TrendingUp className="h-3.5 w-3.5 mt-0.5 text-blue-400 flex-shrink-0" />
                          <span>{trend.message}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
        
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative h-[350px] w-full md:w-8/12">
            <ResponsiveContainer width="100%" height="100%">
              <ScatterChart
                margin={{ top: 20, right: 20, bottom: 20, left: 20 }}
              >
                <XAxis 
                  type="number" 
                  dataKey="x" 
                  name="Uhrzeit" 
                  domain={[0, heatmapData.timeframe.length - 1]} 
                  ticks={Array.from({ length: heatmapData.timeframe.length }, (_, i) => i)} 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => heatmapData.timeframe[value]}
                />
                <YAxis 
                  type="number" 
                  dataKey="y" 
                  name="Wochentag" 
                  domain={[0, heatmapData.days.length - 1]} 
                  ticks={Array.from({ length: heatmapData.days.length }, (_, i) => i)} 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => heatmapData.days[value]}
                />
                <RechartsTooltip content={interactionMode === 'hover' ? <CustomTooltip /> : <div className="hidden" />} />
                {showLegend && (
                  <Legend 
                    payload={[
                      { value: 'Sehr gut', color: '#059669', type: 'rect' },
                      { value: 'Gut', color: '#10b981', type: 'rect' },
                      { value: 'Durchschnitt', color: '#a3e635', type: 'rect' },
                      { value: 'Passabel', color: '#facc15', type: 'rect' },
                      { value: 'Schlecht', color: '#f97316', type: 'rect' },
                      { value: 'Sehr schlecht', color: '#ef4444', type: 'rect' }
                    ]}
                    layout="horizontal"
                    verticalAlign="bottom"
                    align="center"
                  />
                )}
                <Scatter 
                  data={transformedData.current}
                  shape={(props: any) => {
                    // Log the payload for debugging
                    if (props.payload.tradeCount > 0) {
                      console.log("Rendering cell with trades:", props.payload);
                    }
                    
                    return (
                      <CustomPoint 
                        x={props.x}
                        y={props.y}
                        width={props.width * zoomLevel}
                        height={props.height * zoomLevel}
                        value={props.payload.value}
                        tradeCount={props.payload.tradeCount}
                        day={props.payload.day}
                        timeframe={props.payload.timeframe}
                        trades={props.payload.trades}
                        winRate={props.payload.winRate}
                        avgRR={props.payload.avgRR}
                        totalPnL={props.payload.totalPnL}
                        isSelected={selectedCell ? 
                          selectedCell.day === props.payload.day && 
                          selectedCell.timeframe === props.payload.timeframe 
                          : false}
                        onClick={(data) => {
                          // Create a complete cell data object with all necessary properties
                          const cellData = {
                            ...data,
                            // Make sure to include trades from the original payload
                            trades: props.payload.trades || []
                          };
                          
                          console.log("Cell clicked - data:", cellData);
                          console.log("Original payload trades:", props.payload.trades);
                          console.log("Trade count:", cellData.tradeCount);
                          
                          // Set the cell with complete trades data
                          setSelectedCell(cellData);
                          
                          if (interactionMode === "click" && cellData.tradeCount > 0) {
                            if (cellData.trades && cellData.trades.length > 0) {
                              console.log("Trade details available, showing details");
                              setShowTradeDetails(true);
                            } else {
                              console.warn("Trade count > 0 but no trades array available:", cellData);
                              toast({
                                title: "Hinweis",
                                description: "Für diese Zelle sind keine detaillierten Trade-Daten verfügbar.",
                                variant: "destructive",
                              });
                            }
                          }
                        }}
                      />
                    );
                  }}
                >
                  {transformedData.current.map((entry, index) => (
                    <Cell key={`cell-${index}`} />
                  ))}
                </Scatter>
                
                {/* Vergleichsdaten anzeigen, falls vorhanden */}
                {compareMode && heatmapData.comparison && transformedComparisonData.current && transformedComparisonData.current.length > 0 && (
                  <Scatter 
                    name="Vergleichsdaten"
                    data={transformedComparisonData.current.map(point => ({
                      ...point,
                      // Sicherstellen, dass x und y definiert sind
                      x: typeof point.x === 'number' ? point.x + 0.4 : 0, // Leicht versetzt zum Vergleich
                      y: typeof point.y === 'number' ? point.y : 0
                    }))}
                    shape={(props: any) => (
                      <Rectangle
                        x={props.x - 0.2}
                        y={props.y - 0.2}
                        width={0.4}
                        height={0.4}
                        fill={props.payload.tradeCount > 0 ? "#60a5fa" : "#374151"}
                        opacity={props.payload.tradeCount > 0 ? 0.8 : 0.2}
                        stroke="none"
                        style={{ cursor: 'pointer' }}
                      />
                    )}
                  />
                )}
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          {/* Detailansicht der ausgewählten Zelle */}
          <div className="md:w-4/12 bg-muted/30 rounded-md p-4">
            <div className="flex justify-between items-center mb-3">
              <div className={`text-xs font-medium rounded-full px-3 py-1 ${interactionMode === 'hover' ? 'bg-blue-500/20 text-blue-500' : 'bg-amber-500/20 text-amber-500'}`}>
                {interactionMode === 'hover' ? 'Hover-Modus' : 'Klick-Modus'}
              </div>
              <div className="text-xs text-muted-foreground">
                Zoom: {Math.round(zoomLevel * 100)}%
              </div>
            </div>
            
            {selectedCell ? (
              <div className="space-y-3">
                <h3 className="font-bold text-primary">
                  {selectedCell.day}, {selectedCell.timeframe} Uhr
                </h3>
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-background/50 rounded-sm p-2">
                      <div className="text-xs text-muted-foreground font-medium">Trades</div>
                      <div className="font-medium">{selectedCell.tradeCount}</div>
                    </div>
                    <div className="bg-background/50 rounded-sm p-2">
                      <div className="text-xs text-muted-foreground font-medium">Win-Rate</div>
                      <div className="font-medium">{selectedCell.winRate}%</div>
                    </div>
                  </div>
                  
                  <div className="bg-background/50 rounded-sm p-2">
                    <div className="text-xs text-muted-foreground font-medium">Durchschn. RR</div>
                    <div className="font-medium">{selectedCell.avgRR}</div>
                  </div>
                  
                  <div className="bg-background/50 rounded-sm p-2">
                    <div className="text-xs text-muted-foreground font-medium">Gesamt P/L</div>
                    <div className={`font-medium ${parseFloat(selectedCell.totalPnL) > 0 ? 'text-green-500' : parseFloat(selectedCell.totalPnL) < 0 ? 'text-red-500' : ''}`}>
                      {parseFloat(selectedCell.totalPnL) > 0 ? '+' : ''}{selectedCell.totalPnL}$
                    </div>
                  </div>
                
                  {selectedCell.trades && selectedCell.trades.length > 0 && (
                    <div className="bg-background/50 rounded-sm p-3">
                      <div className="text-xs font-medium mb-2">Trade-Statistik</div>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        {/* Konto-Typen */}
                        <div className="flex flex-col gap-1">
                          <div className="text-muted-foreground">Konto-Typen:</div>
                          {Array.from(new Set(selectedCell.trades.map((t: any) => t.accountType || 'Unbekannt'))).map((type: string) => (
                            <div key={type} className="flex items-center justify-between">
                              <span>{type}:</span>
                              <span className="font-medium">
                                {selectedCell.trades.filter((t: any) => (t.accountType || 'Unbekannt') === type).length}
                              </span>
                            </div>
                          ))}
                        </div>
                        
                        {/* Setups und Symbole */}
                        <div className="flex flex-col gap-1">
                          <div className="text-muted-foreground">Setups:</div>
                          {Array.from(new Set(selectedCell.trades.map((t: any) => t.setup || 'Unbekannt'))).map((setup: string) => (
                            <div key={setup} className="flex items-center justify-between">
                              <span>{setup}:</span>
                              <span className="font-medium">
                                {selectedCell.trades.filter((t: any) => (t.setup || 'Unbekannt') === setup).length}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-2">
                        <button 
                          className="w-full bg-black/20 hover:bg-black/30 transition-colors text-xs text-primary font-medium py-1 rounded-sm"
                          onClick={() => setShowTradeDetails(true)}
                        >
                          Alle Trade-Details anzeigen
                        </button>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="pt-2 text-sm text-muted-foreground">
                  <p>Dies zeigt deine Performance für diesen Zeitraum. Klicke auf einen anderen Bereich der Heatmap, um weitere Zeitfenster zu untersuchen.</p>
                </div>
                
                <button 
                  className="w-full bg-background hover:bg-primary/10 transition-colors text-primary text-sm font-medium py-1.5 rounded-sm"
                  onClick={() => setSelectedCell(null)}
                >
                  Auswahl zurücksetzen
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[calc(100%-36px)]">
                <div className="text-center text-muted-foreground">
                  <p className="mb-3">Wähle einen Bereich in der Heatmap, um Details zu sehen</p>
                  <div className="flex justify-center mb-4">
                    <div className={`text-xs rounded-full px-3 py-1 ${interactionMode === 'hover' ? 'bg-primary/20 text-primary' : 'bg-amber-500/20 text-amber-500'}`}>
                      {interactionMode === 'hover' ? 'Bewege Mauszeiger über Zellen' : 'Klick auf eine Zelle für Details'}
                    </div>
                  </div>
                  
                  <Button
                    variant="outline"
                    size="sm"
                    className="bg-black/30 hover:bg-black/50 text-xs"
                    onClick={() => {
                      toast({
                        title: "Daten werden aktualisiert",
                        description: "Die Heatmap-Daten werden neu geladen.",
                      });
                      setTimeout(() => window.location.reload(), 1000);
                    }}
                  >
                    <RefreshCw className="h-3 w-3 mr-2" />
                    Daten aktualisieren
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6">
          <div className="grid grid-cols-7 gap-1 mb-2">
            <div className="text-xs text-center text-muted-foreground">Sehr schlecht</div>
            <div className="text-xs text-center text-muted-foreground">Schlecht</div>
            <div className="text-xs text-center text-muted-foreground">Mäßig</div>
            <div className="text-xs text-center text-muted-foreground">Durchschnitt</div>
            <div className="text-xs text-center text-muted-foreground">Gut</div>
            <div className="text-xs text-center text-muted-foreground">Sehr gut</div>
            <div className="text-xs text-center text-muted-foreground">Keine Daten</div>
            
            <div className="h-2 bg-[#ef4444] rounded"></div>
            <div className="h-2 bg-[#f97316] rounded"></div>
            <div className="h-2 bg-[#facc15] rounded"></div>
            <div className="h-2 bg-[#a3e635] rounded"></div>
            <div className="h-2 bg-[#10b981] rounded"></div>
            <div className="h-2 bg-[#059669] rounded"></div>
            <div className="h-2 bg-[#374151] rounded"></div>
          </div>
          
          {compareMode && (
            <div className="flex items-center justify-center space-x-4 mt-2 pt-2 border-t border-border/30">
              <div className="flex items-center">
                <div className="w-3 h-3 mr-1.5 bg-primary rounded-sm"></div>
                <span className="text-xs text-muted-foreground">Deine Daten</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 mr-1.5 bg-[#60a5fa] rounded-sm"></div>
                <span className="text-xs text-muted-foreground">Vergleichsdaten</span>
              </div>
            </div>
          )}
        </div>
        
        {/* Dialog zur Anzeige der Trade-Details */}
        {showTradeDetails && selectedCell && selectedCell.trades && (
          <Dialog open={showTradeDetails} onOpenChange={setShowTradeDetails}>
            <DialogContent className="max-w-4xl">
              <DialogHeader>
                <DialogTitle>
                  Trades für {selectedCell.day}, {selectedCell.timeframe} Uhr
                </DialogTitle>
                <DialogDescription>
                  {selectedCell.tradeCount} Trades mit einer Win-Rate von {selectedCell.winRate}%
                </DialogDescription>
              </DialogHeader>
              
              <div className="max-h-[500px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Setup</TableHead>
                      <TableHead>Richtung</TableHead>
                      <TableHead>Trend</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Session</TableHead>
                      <TableHead>P/L</TableHead>
                      <TableHead>RR</TableHead>
                      <TableHead>Size</TableHead>
                      <TableHead>Konto</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCell.trades.map((trade: any) => (
                      <TableRow key={trade.id}>
                        <TableCell>{typeof trade.date === 'string' ? trade.date : new Date(trade.date).toLocaleDateString()}</TableCell>
                        <TableCell>{trade.symbol}</TableCell>
                        <TableCell>{trade.setup}</TableCell>
                        <TableCell>
                          <span className={trade.entryType === 'Long' ? 'text-green-500' : 'text-red-500'}>
                            {trade.entryType}
                          </span>
                        </TableCell>
                        <TableCell>{trade.mainTrendM15 || '-'}</TableCell>
                        <TableCell>{trade.location || '-'}</TableCell>
                        <TableCell>{trade.session || '-'}</TableCell>
                        <TableCell className={parseFloat(trade.profitLoss) > 0 ? 'text-green-500' : 'text-red-500'}>
                          {parseFloat(trade.profitLoss) > 0 ? '+' : ''}{trade.profitLoss}$
                        </TableCell>
                        <TableCell>{trade.rrAchieved}</TableCell>
                        <TableCell>{trade.size || '-'}</TableCell>
                        <TableCell>{trade.accountType || '-'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
              
              <DialogFooter>
                <Button 
                  variant="outline" 
                  onClick={() => setShowTradeDetails(false)}
                >
                  Schließen
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </CardContent>
    </Card>
  );
}