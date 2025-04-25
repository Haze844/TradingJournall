import React from "react";
import { Button } from "@/components/ui/button";
import { BarChart, CandlestickChart } from "lucide-react";

export type ChartType = "line" | "candlestick";

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (type: ChartType) => void;
}

export default function ChartTypeSelector({ value, onChange }: ChartTypeSelectorProps) {
  return (
    <div className="inline-flex items-center p-1 rounded-lg bg-muted/50">
      <Button
        variant={value === "line" ? "default" : "ghost"}
        size="sm"
        className={`h-8 ${value === "line" ? "bg-white text-primary" : "text-muted-foreground"}`}
        onClick={() => onChange("line")}
      >
        <BarChart className="h-4 w-4 mr-2" />
        Linie
      </Button>
      <Button
        variant={value === "candlestick" ? "default" : "ghost"}
        size="sm"
        className={`h-8 ${value === "candlestick" ? "bg-white text-primary" : "text-muted-foreground"}`}
        onClick={() => onChange("candlestick")}
      >
        <CandlestickChart className="h-4 w-4 mr-2" />
        Kerzen
      </Button>
    </div>
  );
}