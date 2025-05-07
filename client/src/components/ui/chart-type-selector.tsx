import React from 'react';
import { BarChart, LineChart } from 'lucide-react';
import { ToggleGroup, ToggleGroupItem } from './toggle-group';

export type ChartType = 'line' | 'candle';

interface ChartTypeSelectorProps {
  value: ChartType;
  onChange: (value: ChartType) => void;
}

export function ChartTypeSelector({ value, onChange }: ChartTypeSelectorProps) {
  return (
    <ToggleGroup type="single" value={value} onValueChange={(val) => val && onChange(val as ChartType)}>
      <ToggleGroupItem value="line" aria-label="Liniendiagramm anzeigen" className="h-8 w-8">
        <LineChart className="h-4 w-4" />
      </ToggleGroupItem>
      <ToggleGroupItem value="candle" aria-label="Kerzendiagramm anzeigen" className="h-8 w-8">
        <BarChart className="h-4 w-4" />
      </ToggleGroupItem>
    </ToggleGroup>
  );
}