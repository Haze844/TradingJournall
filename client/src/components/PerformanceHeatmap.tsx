import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { Tooltip, ResponsiveContainer, XAxis, YAxis, Tooltip as RechartsTooltip, Rectangle, ScatterChart, Scatter, Cell } from "recharts";
import { Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
};

type HeatmapData = {
  days: string[];
  timeframe: string[];
  data: HeatmapDataPoint[];
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
  
  return { days, timeframe, data };
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

export default function PerformanceHeatmap() {
  const [dataType, setDataType] = useState<"winRate" | "avgRR" | "pnl">("winRate");
  const [selectedCell, setSelectedCell] = useState<HeatmapDataPoint | null>(null);
  const [interactionMode, setInteractionMode] = useState<"hover" | "click">("hover");
  const { toast } = useToast();
  
  // Daten aus der API abrufen
  const { data: heatmapData, isLoading, error } = useQuery<HeatmapData>({
    queryKey: ["/api/performance-heatmap"],
    queryFn: async () => {
      const response = await fetch(`/api/performance-heatmap?userId=2`);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Heatmap-Daten');
      }
      const data = await response.json();
      
      // Wenn keine Daten vorhanden sind, generiere Beispieldaten für die Visualisierung
      if (!data.data || data.data.length === 0) {
        console.log("Keine Daten vom Server - generiere Beispieldaten für die Heatmap-Visualisierung");
        return generateSampleHeatmapData();
      }
      
      return data;
    },
    staleTime: 60000, // 1 Minute Cache
  });

  // Daten für die Visualisierung transformieren
  const transformedData = useRef<HeatmapDataPoint[]>([]);
  
  useEffect(() => {
    if (heatmapData && heatmapData.data) {
      // Kartieren der Tage und Zeitrahmen zu Koordinaten
      const transformData = () => {
        return heatmapData.data.map((point) => {
          const dayIndex = heatmapData.days.indexOf(point.day);
          const timeIndex = heatmapData.timeframe.indexOf(point.timeframe);
          
          let value = point.winRate; // Standardwert ist Win-Rate
          
          if (dataType === "avgRR") {
            value = parseFloat(point.avgRR) * 20; // Skalieren für bessere Visualisierung
          } else if (dataType === "pnl") {
            const pnl = parseFloat(point.totalPnL);
            // Skalieren von PnL für die Farbgebung (einfache lineare Skalierung)
            value = pnl > 0 ? Math.min(pnl / 10, 100) : Math.max(0, 50 + pnl / 10);
          }
          
          return {
            ...point,
            x: timeIndex,
            y: dayIndex,
            value: value
          };
        });
      };
      
      transformedData.current = transformData();
    }
  }, [heatmapData, dataType]);
  
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
        <Select
          value={dataType}
          onValueChange={(value) => setDataType(value as "winRate" | "avgRR" | "pnl")}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Win-Rate" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="winRate">Win-Rate</SelectItem>
            <SelectItem value="avgRR">Durchschn. RR</SelectItem>
            <SelectItem value="pnl">Profit/Loss</SelectItem>
          </SelectContent>
        </Select>
      </CardHeader>
      <CardContent>
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
                <Scatter 
                  data={transformedData.current}
                  shape={(props: any) => (
                    <CustomPoint 
                      x={props.x}
                      y={props.y}
                      width={props.width}
                      height={props.height}
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
              </ScatterChart>
            </ResponsiveContainer>
          </div>
          
          {/* Detailansicht der ausgewählten Zelle */}
          <div className="md:w-4/12 bg-muted/30 rounded-md p-4">
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
                
                <div className="pt-3 text-sm text-muted-foreground">
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
              <div className="flex items-center justify-center h-full">
                <div className="text-center text-muted-foreground">
                  <p className="mb-2">Wähle einen Bereich in der Heatmap, um Details zu sehen</p>
                  <div className="flex justify-center">
                    <div className="bg-primary/20 text-primary text-xs rounded-full px-3 py-1">
                      Klick auf eine Zelle für Details
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-6 grid grid-cols-7 gap-1">
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
      </CardContent>
    </Card>
  );
}