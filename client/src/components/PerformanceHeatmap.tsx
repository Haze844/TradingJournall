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
const CustomPoint = (props: any) => {
  const { x, y, width, height, value } = props;
  
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

  return (
    <Rectangle
      x={x}
      y={y}
      width={width}
      height={height}
      fill={getColor(value, props.tradeCount)}
      opacity={getOpacity(props.tradeCount)}
    />
  );
};

export default function PerformanceHeatmap() {
  const [dataType, setDataType] = useState<"winRate" | "avgRR" | "pnl">("winRate");
  const { toast } = useToast();
  
  // Daten aus der API abrufen
  const { data: heatmapData, isLoading, error } = useQuery<HeatmapData>({
    queryKey: ["/api/performance-heatmap"],
    queryFn: async () => {
      const response = await fetch(`/api/performance-heatmap?userId=2`);
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Heatmap-Daten');
      }
      return response.json();
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
        <div className="relative h-[350px] w-full">
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
              <RechartsTooltip content={<CustomTooltip />} />
              <Scatter 
                data={transformedData.current} 
                shape={<CustomPoint />}
              >
                {transformedData.current.map((entry, index) => (
                  <Cell key={`cell-${index}`} />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1">
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