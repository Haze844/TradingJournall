import { useEffect, useRef } from "react";
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
} from "recharts";
import { format } from "date-fns";
import { PerformanceData, SetupWinRate } from "@shared/schema";

// Performance Chart Component
interface PerformanceChartProps {
  data: PerformanceData[];
}

export function PerformanceChart({ data }: PerformanceChartProps) {
  // Format data for the chart
  const chartData = data.map(item => ({
    date: format(new Date(item.date), "dd.MM"),
    performance: item.performance,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis 
          dataKey="date" 
          stroke="#9CA3AF"
          tick={{ fill: "#9CA3AF" }}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: "#9CA3AF" }}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "#262626", 
            border: "none",
            borderRadius: "4px",
            color: "#F3F4F6"
          }}
          labelStyle={{ color: "#F3F4F6" }}
        />
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
    </ResponsiveContainer>
  );
}

// Setup Win Rate Chart Component
interface SetupWinRateChartProps {
  data: SetupWinRate[];
}

export function SetupWinRateChart({ data }: SetupWinRateChartProps) {
  // Choose different colors for each setup
  const getBarColor = (index: number) => {
    const colors = ["#4F46E5", "#F59E0B", "#10B981", "#EC4899", "#8B5CF6"];
    return colors[index % colors.length];
  };

  // Format data for the chart
  const chartData = data.map(item => ({
    setup: item.setup,
    winRate: item.winRate,
  }));

  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart
        data={chartData}
        margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255, 255, 255, 0.05)" />
        <XAxis 
          dataKey="setup" 
          stroke="#9CA3AF"
          tick={{ fill: "#9CA3AF" }}
        />
        <YAxis 
          stroke="#9CA3AF"
          tick={{ fill: "#9CA3AF" }}
          tickFormatter={(value) => `${value}%`}
        />
        <Tooltip 
          contentStyle={{ 
            backgroundColor: "#262626", 
            border: "none",
            borderRadius: "4px",
            color: "#F3F4F6"
          }}
          labelStyle={{ color: "#F3F4F6" }}
          formatter={(value) => [`${value}%`, "Trefferquote"]}
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
    </ResponsiveContainer>
  );
}
