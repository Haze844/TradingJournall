import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { setupTypes, trendTypes } from "@shared/schema";

interface FilterBarProps {
  filters: {
    startDate: Date;
    endDate: Date;
    symbol: string;
    setup: string;
    mainTrendM15: string;
    internalTrendM5: string;
    entryType: string;
  };
  onFilterChange: (filters: any) => void;
}

export default function FilterBar({ filters, onFilterChange }: FilterBarProps) {
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    onFilterChange({ [name]: new Date(value) });
  };

  const handleSelectChange = (name: string, value: string) => {
    onFilterChange({ [name]: value });
  };

  return (
    <div className="pb-4">
      <div className="grid grid-cols-1 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Zeitraum</Label>
          <div className="flex gap-2">
            <Input
              type="date"
              name="startDate"
              value={filters.startDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="text-sm bg-muted"
            />
            <Input
              type="date"
              name="endDate"
              value={filters.endDate.toISOString().split('T')[0]}
              onChange={handleDateChange}
              className="text-sm bg-muted"
            />
          </div>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Symbol</Label>
          <Select 
            value={filters.symbol} 
            onValueChange={(value) => handleSelectChange("symbol", value)}
          >
            <SelectTrigger className="bg-muted text-sm">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              <SelectItem value="ES">ES</SelectItem>
              <SelectItem value="NQ">NQ</SelectItem>
              <SelectItem value="CL">CL</SelectItem>
              <SelectItem value="GC">GC</SelectItem>
              <SelectItem value="EUR/USD">EUR/USD</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Setup</Label>
          <Select 
            value={filters.setup} 
            onValueChange={(value) => handleSelectChange("setup", value)}
          >
            <SelectTrigger className="bg-muted text-sm">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {setupTypes.map((setup) => (
                <SelectItem key={setup} value={setup}>{setup}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Haupttrend M15</Label>
          <Select 
            value={filters.mainTrendM15} 
            onValueChange={(value) => handleSelectChange("mainTrendM15", value)}
          >
            <SelectTrigger className="bg-muted text-sm">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {trendTypes.map((trend) => (
                <SelectItem key={trend} value={trend}>{trend}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Interner Trend M5</Label>
          <Select 
            value={filters.internalTrendM5} 
            onValueChange={(value) => handleSelectChange("internalTrendM5", value)}
          >
            <SelectTrigger className="bg-muted text-sm">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {trendTypes.map((trend) => (
                <SelectItem key={trend} value={trend}>{trend}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Einstieg</Label>
          <Select 
            value={filters.entryType} 
            onValueChange={(value) => handleSelectChange("entryType", value)}
          >
            <SelectTrigger className="bg-muted text-sm">
              <SelectValue placeholder="Alle" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle</SelectItem>
              {trendTypes.map((trend) => (
                <SelectItem key={trend} value={trend}>{trend}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}