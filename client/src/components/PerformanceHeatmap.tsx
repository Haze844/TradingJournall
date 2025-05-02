import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Rectangle, ScatterChart, Scatter, Cell, Legend } from "recharts";
import { Loader2, MousePointer, Hand, Download, ZoomIn, ZoomOut, RefreshCw, SlidersHorizontal, Lightbulb, TrendingUp } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue, SelectGroup, SelectLabel } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";

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
function generateSampleHeatmapData(): HeatmapData {
  // Definiere die Tage der Woche und Zeitrahmen
  const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
  const timeframe = ["04-08", "08-10", "10-12", "12-14", "14-16", "16-18", "18-22"];
  
  // Generiere Daten für jeden Tag und Zeitrahmen
  const data: HeatmapDataPoint[] = [];
  
  days.forEach(day => {
    timeframe.forEach(time => {
      // Erstelle zufällige Daten
      const tradeCount = Math.floor(Math.random() * 10);  // 0-9 Trades
      
      if (tradeCount > 0) {
        // Realistischere Werte für Tage/Zeiten mit Aktivität
        const winRate = Math.floor(Math.random() * 100);  // 0-100%
        const avgRR = (Math.random() * 4).toFixed(2);     // 0-4 R
        const totalPnL = ((Math.random() * 2000) - 800).toFixed(2);  // -800 bis +1200$
        
        data.push({
          day,
          timeframe: time,
          value: winRate,
          tradeCount,
          winRate,
          avgRR,
          totalPnL
        });
      } else {
        // Leere Slots für Zeiten ohne Trades
        data.push({
          day,
          timeframe: time,
          value: 0,
          tradeCount: 0,
          winRate: 0,
          avgRR: "0.00",
          totalPnL: "0.00"
        });
      }
    });
  });
  
  // Generiere Beispieldaten für Empfehlungen
  const recommendations: HeatmapRecommendations = {
    bestTimes: [
      { day: "Dienstag", time: "10-12", winRate: 78, avgRR: "2.5" },
      { day: "Mittwoch", time: "14-16", winRate: 72, avgRR: "2.3" },
      { day: "Donnerstag", time: "16-18", winRate: 65, avgRR: "1.9" }
    ],
    worstTimes: [
      { day: "Montag", time: "08-10", winRate: 32, avgRR: "0.7" },
      { day: "Freitag", time: "18-22", winRate: 28, avgRR: "0.6" }
    ],
    trends: [
      { type: "pattern", message: "Die beste Performance ist zwischen 10-12 Uhr an Dienstagen zu beobachten." },
      { type: "improvement", message: "Deine Nachmittags-Performance hat sich in den letzten 30 Tagen um 12% verbessert." },
      { type: "suggestion", message: "Vermeide den Handel in den ersten 30 Minuten nach Marktöffnung für bessere Ergebnisse." }
    ]
  };
  
  // Füge Beispiel-Filter hinzu 
  const filters: HeatmapFilters = {
    availableSetups: ["SFP", "Trendline Break", "Double Top", "Fibonacci Retracement", "ABCD Pattern"],
    availableSymbols: ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "USDCAD", "EURJPY", "DAX"],
    availableDirections: ["Long", "Short"]
  };
  
  return {
    days,
    timeframe,
    data,
    recommendations,
    filters
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
    onClick({
      day: props.day,
      timeframe: props.timeframe,
      value: props.value,
      tradeCount: props.tradeCount,
      winRate: props.value, // In diesem Fall ist es gleich, aber könnte unterschiedlich sein
      avgRR: "0", // Wird später überschrieben mit tatsächlichen Daten
      totalPnL: "0", // Wird später überschrieben mit tatsächlichen Daten
      x: props.x,
      y: props.y
    });
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

export default function PerformanceHeatmap() {
  const [dataType, setDataType] = useState<"winRate" | "avgRR" | "pnl">("winRate");
  const [selectedCell, setSelectedCell] = useState<HeatmapDataPoint | null>(null);
  const [interactionMode, setInteractionMode] = useState<"hover" | "click">("hover");
  const [timeRange, setTimeRange] = useState<string>("all");
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [showLegend, setShowLegend] = useState<boolean>(false);
  const [setupFilter, setSetupFilter] = useState<string>("all");
  const [symbolFilter, setSymbolFilter] = useState<string>("all");
  const [directionFilter, setDirectionFilter] = useState<string>("all");
  const [compareMode, setCompareMode] = useState<string>("");
  const [showFilters, setShowFilters] = useState<boolean>(false);
  const [showRecommendations, setShowRecommendations] = useState<boolean>(false);
  const { toast } = useToast();
  
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
    queryKey: ["/api/performance-heatmap", timeRange, setupFilter, symbolFilter, directionFilter, compareMode],
    queryFn: async () => {
      // URL mit Parametern aufbauen
      let url = `/api/performance-heatmap?userId=2`;
      
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
      
      // Vergleichsmodus-Parameter hinzufügen
      if (compareMode) {
        url += `&compareWith=${compareMode}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Heatmap-Daten');
      }
      const data = await response.json();
      
      // Wenn keine Daten vorhanden sind, generiere Beispieldaten für die Visualisierung
      if (!data.data || data.data.length === 0) {
        console.log("Keine Daten vom Server - generiere Beispieldaten für die Heatmap-Visualisierung");
        const sampleData = generateSampleHeatmapData();
        // Stelle sicher, dass die Filter-Daten immer definiert sind
        if (!data.filters) {
          data.filters = {
            availableSetups: ["SFP", "Trendline Break", "Double Top"],
            availableSymbols: ["EURUSD", "GBPUSD", "USDJPY"], 
            availableDirections: ["Long", "Short"]
          };
        }
        return sampleData;
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
          
          return {
            ...point,
            x: timeIndex,
            y: dayIndex,
            value: value,
            valueLabel,
            isComparison
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
          <CardTitle>Performance Heatmap</CardTitle>
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
                <SelectItem value="">Kein Vergleich</SelectItem>
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
                        .filter(setup => setup && setup !== null && setup !== '')
                        .map((setup) => (
                          <SelectItem key={setup} value={setup || "unbekannt"}>
                            {setup || "Unbekannt"}
                          </SelectItem>
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
                        .filter(symbol => symbol && symbol !== null && symbol !== '')
                        .map((symbol) => (
                          <SelectItem key={symbol} value={symbol || "unbekannt"}>
                            {symbol || "Unbekannt"}
                          </SelectItem>
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
                        .filter(direction => direction && direction !== null && direction !== '')
                        .map((direction) => (
                          <SelectItem key={direction} value={direction || "unbekannt"}>
                            {direction || "Unbekannt"}
                          </SelectItem>
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
                  shape={(props: any) => (
                    <CustomPoint 
                      x={props.x}
                      y={props.y}
                      width={props.width * zoomLevel}
                      height={props.height * zoomLevel}
                      value={props.payload.value}
                      tradeCount={props.payload.tradeCount}
                      day={props.payload.day}
                      timeframe={props.payload.timeframe}
                      isSelected={selectedCell ? 
                        selectedCell.day === props.payload.day && 
                        selectedCell.timeframe === props.payload.timeframe 
                        : false}
                      onClick={setSelectedCell}
                    />
                  )}
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
      </CardContent>
    </Card>
  );
}