import { useState } from "react";
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend,
  Cell,
  AreaChart,
  Area
} from "recharts";
import { format } from "date-fns";
import { PerformanceData, SetupWinRate } from "@shared/schema";
import { ChartTypeSelector, type ChartType } from "@/components/ui/chart-type-selector";

// Performance Chart Component
interface PerformanceChartProps {
  data: PerformanceData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  const [chartType, setChartType] = useState<ChartType>("line");
  
  // Formatiere Daten für das Chart und erweitere für Candlestick
  const chartData = data.map((item, index, array) => {
    const performance = item.performance;
    const date = format(new Date(item.date), "dd.MM");
    
    // Bei Kerzendiagramm benötigen wir Open, High, Low, Close-Werte
    // Für Performance können wir simulierte Werte basierend auf performance erstellen
    let open = performance;
    let close = performance;
    let high = performance * 1.1; // 10% höher für den Höchstwert
    let low = performance * 0.9;  // 10% niedriger für den Tiefstwert

    // Wenn vorheriger Datenpunkt existiert, setze Open zum vorherigen Close-Wert
    if (index > 0) {
      open = array[index - 1].performance;
    }
    
    return {
      date,
      performance,
      open,
      high,
      close,
      low
    };
  });

  // Gemeinsame Eigenschaften für alle Diagramme
  const commonCartesianProps = {
    data: chartData,
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  // Gemeinsame Achsen-Eigenschaften
  const xAxisProps = {
    dataKey: "date",
    stroke: "#9CA3AF",
    tick: { fill: "#9CA3AF" },
  };

  const yAxisProps = {
    stroke: "#9CA3AF",
    tick: { fill: "#9CA3AF" },
  };

  // Gemeinsame Tooltip-Eigenschaften
  const tooltipProps = {
    contentStyle: {
      backgroundColor: "#262626",
      border: "none",
      borderRadius: "4px",
      color: "#F3F4F6",
    },
    labelStyle: { color: "#F3F4F6" },
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-primary">Performance</h3>
        <ChartTypeSelector value={chartType} onChange={setChartType} />
      </div>
      
      <div className="flex-1 min-h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            // Liniendiagramm
            <LineChart {...commonCartesianProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip {...tooltipProps} />
              <Line
                type="monotone"
                dataKey="performance"
                stroke="#4F46E5"
                fill="rgba(79, 70, 229, 0.1)"
                activeDot={{ r: 8 }}
                name="Ergebnis (RR)"
                strokeWidth={2}
              />
            </LineChart>
          ) : (
            // Kerzendiagramm (als kombiniertes Diagramm umgesetzt)
            <BarChart {...commonCartesianProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip 
                {...tooltipProps} 
                formatter={(value, name) => {
                  const formattedValue = Number(value).toFixed(2);
                  switch (name) {
                    case "open": return ["Eröffnung: " + formattedValue, ""];
                    case "close": return ["Schluss: " + formattedValue, ""];
                    case "high": return ["Hoch: " + formattedValue, ""];
                    case "low": return ["Tief: " + formattedValue, ""];
                    default: return [formattedValue, name];
                  }
                }}
              />
              {/* Candlestick-Darstellung mit Bars */}
              <Bar
                dataKey="low"
                fill="transparent"
                stroke="#8884d8"
                name="low"
              />
              <Bar
                dataKey="high"
                fill="transparent"
                stroke="#8884d8"
                name="high"
              />
              {/* Dieser Block wurde entfernt, da wir die Zellen direkt in der Bar definieren */}
              <Bar
                dataKey={(entry: any) => Math.abs(entry.open - entry.close)}
                name="Body"
                fill="#10B981" // Standardfarbe, wir nutzen stattdessen Cell für die dynamische Färbung
                stroke="#10B981"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`body-${index}`}
                    fill={entry.close >= entry.open ? '#10B981' : '#EF4444'} 
                    stroke={entry.close >= entry.open ? '#10B981' : '#EF4444'}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Setup Win Rate Chart Component
interface SetupWinRateChartProps {
  data: SetupWinRate[];
}

export function SetupWinRateChart({ data }: SetupWinRateChartProps) {
  const [chartType, setChartType] = useState<ChartType>("line");
  
  // Choose different colors for each setup
  const getBarColor = (index: number) => {
    const colors = ["#4F46E5", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6"];
    return colors[index % colors.length];
  };

  // Format data for the chart
  const chartData = data.map(item => ({
    setup: item.setup,
    winRate: item.winRate,
    // Für Kerzendiagramm generierte Werte
    open: item.winRate * 0.95, // 5% niedriger
    close: item.winRate,
    high: item.winRate * 1.05, // 5% höher
    low: item.winRate * 0.9   // 10% niedriger
  }));

  // Gemeinsame Eigenschaften für alle Diagramme
  const commonCartesianProps = {
    data: chartData,
    margin: { top: 5, right: 30, left: 0, bottom: 5 },
  };

  // Gemeinsame Achsen-Eigenschaften
  const xAxisProps = {
    dataKey: "setup",
    stroke: "#9CA3AF",
    tick: { fill: "#9CA3AF" },
  };

  const yAxisProps = {
    stroke: "#9CA3AF",
    tick: { fill: "#9CA3AF" },
    tickFormatter: (value: number) => `${value}%`
  };

  // Gemeinsame Tooltip-Eigenschaften
  const tooltipProps = {
    contentStyle: {
      backgroundColor: "#262626",
      border: "none",
      borderRadius: "4px",
      color: "#F3F4F6",
    },
    labelStyle: { color: "#F3F4F6" },
  };

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-primary">Trefferquote pro Setup</h3>
        <ChartTypeSelector value={chartType} onChange={setChartType} />
      </div>
      
      <div className="flex-1 min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          {chartType === "line" ? (
            // Balkendiagramm (Standard)
            <BarChart {...commonCartesianProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip 
                {...tooltipProps} 
                formatter={(value: number) => [`${value}%`, "Trefferquote"]}
              />
              <Bar 
                dataKey="winRate" 
                name="Trefferquote"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getBarColor(index)} />
                ))}
              </Bar>
            </BarChart>
          ) : (
            // Kerzendiagramm-Darstellung
            <BarChart {...commonCartesianProps}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
              <XAxis {...xAxisProps} />
              <YAxis {...yAxisProps} />
              <Tooltip 
                {...tooltipProps} 
                formatter={(value: number, name: string) => {
                  const formattedValue = value.toFixed(1) + "%";
                  switch (name) {
                    case "open": return ["Eröffnung: " + formattedValue, ""];
                    case "close": return ["Schluss: " + formattedValue, ""];
                    case "high": return ["Hoch: " + formattedValue, ""];
                    case "low": return ["Tief: " + formattedValue, ""];
                    default: return [formattedValue, name];
                  }
                }}
              />
              {/* Low/High Linien */}
              <Bar dataKey="low" fill="transparent" stroke="#8884d8" name="low" />
              <Bar dataKey="high" fill="transparent" stroke="#8884d8" name="high" />
              
              {/* Body des Kerzendiagramms */}
              <Bar
                dataKey={(entry: any) => Math.abs(entry.open - entry.close)}
                name="Body"
                fill="#4F46E5"
              >
                {chartData.map((entry, index) => (
                  <Cell 
                    key={`body-${index}`}
                    fill={getBarColor(index)} 
                    stroke={getBarColor(index)}
                  />
                ))}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  );
}