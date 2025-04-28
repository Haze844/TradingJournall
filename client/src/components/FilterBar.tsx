import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { setupTypes, trendTypes } from "@shared/schema";

interface FilterBarProps {
  userId?: number; // Optional userId für spätere Features
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

  // Funktion zum Zurücksetzen aller Filter
  const resetAllFilters = () => {
    onFilterChange({
      startDate: new Date(),
      endDate: new Date(),
      symbol: "all",
      setup: "all",
      mainTrendM15: "all",
      internalTrendM5: "all",
      entryType: "all"
    });
  };

  return (
    <div className="px-6 pt-5 pb-4 mb-0 border-b border-border/30 bg-gradient-to-b from-background/90 to-background/50 rounded-t-lg">
      <div className="flex justify-between items-center mb-4">
        <div className="w-full flex justify-end">
          <button 
            onClick={resetAllFilters}
            className="text-xs px-2 py-1 text-primary hover:text-primary/80 hover:bg-primary/10 rounded flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Alle Filter zurücksetzen
          </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-3">
        <div>
          <div className="flex justify-between">
            <Label className="text-sm text-muted-foreground mb-1">Zeitraum</Label>
            <span className="text-xs text-primary hover:text-primary/80 cursor-pointer" 
                 onClick={() => onFilterChange({ 
                   startDate: new Date(), 
                   endDate: new Date() 
                 })}>
              Heute
            </span>
          </div>
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
          <div className="relative">
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
            <span className="absolute -top-6 right-0 text-xs text-primary hover:text-primary/80 cursor-pointer" 
                 onClick={() => onFilterChange({ symbol: "all" })}>
              Zurücksetzen
            </span>
          </div>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Setup</Label>
          <div className="relative">
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
            <span className="absolute -top-6 right-0 text-xs text-primary hover:text-primary/80 cursor-pointer" 
                 onClick={() => onFilterChange({ setup: "all" })}>
              Zurücksetzen
            </span>
          </div>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Haupttrend M15</Label>
          <div className="relative">
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
            <span className="absolute -top-6 right-0 text-xs text-primary hover:text-primary/80 cursor-pointer" 
                 onClick={() => onFilterChange({ mainTrendM15: "all" })}>
              Zurücksetzen
            </span>
          </div>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Interner Trend M5</Label>
          <div className="relative">
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
            <span className="absolute -top-6 right-0 text-xs text-primary hover:text-primary/80 cursor-pointer" 
                 onClick={() => onFilterChange({ internalTrendM5: "all" })}>
              Zurücksetzen
            </span>
          </div>
        </div>
        
        <div>
          <Label className="text-sm text-muted-foreground mb-1">Einstieg</Label>
          <div className="relative">
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
            <span className="absolute -top-6 right-0 text-xs text-primary hover:text-primary/80 cursor-pointer" 
                 onClick={() => onFilterChange({ entryType: "all" })}>
              Zurücksetzen
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}