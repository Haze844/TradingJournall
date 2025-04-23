import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload } from "lucide-react";
import Papa from "papaparse";
import { Trade, insertTradeSchema } from "@shared/schema";
import { z } from "zod";

export default function TradeImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const importMutation = useMutation({
    mutationFn: async (trades: any[]) => {
      const res = await apiRequest("POST", "/api/import-csv", { trades });
      return await res.json();
    },
    onSuccess: () => {
      toast({
        title: "Import erfolgreich",
        description: "Ihre Trades wurden erfolgreich importiert.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/setup-win-rates"] });
      setFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Import fehlgeschlagen",
        description: error.message,
        variant: "destructive",
      });
    }
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!file) return;
    
    setImporting(true);
    
    try {
      const text = await file.text();
      Papa.parse(text, {
        header: true,
        skipEmptyLines: true,
        complete: (results: Papa.ParseResult<any>) => {
          const { data, errors } = results;
          
          if (errors.length > 0) {
            toast({
              title: "Fehler beim Parsen der CSV-Datei",
              description: "Bitte überprüfen Sie das Format Ihrer Datei.",
              variant: "destructive",
            });
            setImporting(false);
            return;
          }
          
          // TradingView Feldnamen erkennen
          const mapTradingViewFields = (row: any) => {
            // TradingView Exportfelder auf unsere Datenfelder mappen
            const mappings: Record<string, string[]> = {
              symbol: ["Symbol", "Ticker", "symbol", "instrument", "Instrument"],
              setup: ["Setup", "Strategy", "setup", "Strategy Name", "strategy", "Trade Setup"],
              mainTrendM15: ["Main Trend", "mainTrendM15", "main_trend_m15", "Main Direction", "Trend M15"],
              internalTrendM5: ["Internal Trend", "internalTrendM5", "internal_trend_m5", "Sub Direction", "Trend M5"],
              entryType: ["Entry Type", "entryType", "entry_type", "Entry", "Order Type"],
              entryLevel: ["Entry Level", "entryLevel", "entry_level", "Entry Price", "Price"],
              liquidation: ["Liquidation", "Stop Loss", "SL", "liquidation", "Stop"],
              location: ["Location", "location", "Entry Zone", "Zone"],
              rrAchieved: ["RR Achieved", "R:R", "Risk/Reward Achieved", "rrAchieved", "rr_achieved", "Actual R:R", "Real R:R"],
              rrPotential: ["RR Potential", "Potential R:R", "Target R:R", "rrPotential", "rr_potential", "Expected R:R"],
              isWin: ["Result", "Win", "isWin", "is_win", "Profit", "Trade Result", "Success"]
            };

            // Überprüfe für jedes unserer Felder, ob ein TradingView-Feld existiert
            const result: Record<string, any> = {};
            
            Object.entries(mappings).forEach(([ourField, possibleTvFields]) => {
              // Suche in der Zeile nach einem passenden Feld
              const matchedField = possibleTvFields.find(field => row[field] !== undefined);
              
              if (matchedField) {
                result[ourField] = row[matchedField];
              } else {
                // Wenn kein Feld gefunden wurde, setze Default-Wert
                result[ourField] = ourField === 'rrAchieved' || ourField === 'rrPotential' ? 0 : "";
              }
            });
            
            return result;
          };

          const trades = data.map((row: any) => {
            try {
              // Zuerst TradingView-Feldnamen mappen
              const mappedRow = mapTradingViewFields(row);
              
              // Konvertiere String-Werte in richtigen Datentyp
              return {
                symbol: mappedRow.symbol || "",
                setup: mappedRow.setup || "",
                mainTrendM15: mappedRow.mainTrendM15 || "",
                internalTrendM5: mappedRow.internalTrendM5 || "",
                entryType: mappedRow.entryType || "",
                entryLevel: mappedRow.entryLevel || "",
                liquidation: mappedRow.liquidation || "",
                location: mappedRow.location || "",
                rrAchieved: parseFloat(String(mappedRow.rrAchieved || "0")),
                rrPotential: parseFloat(String(mappedRow.rrPotential || "0")),
                // Für den isWin-Wert prüfen wir verschiedene Möglichkeiten
                isWin: typeof mappedRow.isWin === 'boolean' ? mappedRow.isWin : 
                       String(mappedRow.isWin).toLowerCase() === 'true' || 
                       String(mappedRow.isWin).toLowerCase() === 'win' ||
                       String(mappedRow.isWin).toLowerCase() === 'yes' ||
                       String(mappedRow.isWin).toLowerCase() === 'profit',
                date: row.Date || row.date || row.Time || row.time || new Date().toISOString(),
              };
            } catch (error) {
              console.error("Fehler beim Verarbeiten der Zeile:", row, error);
              return null;
            }
          }).filter(Boolean);
          
          if (trades.length === 0) {
            toast({
              title: "Keine gültigen Daten gefunden",
              description: "Die CSV-Datei enthält keine gültigen Trade-Daten.",
              variant: "destructive",
            });
            setImporting(false);
            return;
          }
          
          importMutation.mutate(trades);
          setImporting(false);
        },
        error: (error: Error) => {
          toast({
            title: "Fehler beim Parsen der CSV-Datei",
            description: error.message,
            variant: "destructive",
          });
          setImporting(false);
        }
      });
    } catch (error) {
      toast({
        title: "Fehler beim Lesen der Datei",
        description: error instanceof Error ? error.message : "Unbekannter Fehler",
        variant: "destructive",
      });
      setImporting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h3 className="text-xl font-bold moon-text">🚀 TradingView CSV-Import</h3>
        <p className="text-sm text-muted-foreground">
          Importiere Trades direkt aus TradingView-Exporten 📈
        </p>
      </div>
      
      <div className="space-y-6 relative">
        <div className="w-full h-36 rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center p-4 hover:border-primary/60 transition-colors">
          <Upload className="h-8 w-8 text-primary/60 mb-2" />
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={importing}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <p className="text-sm font-medium">CSV von TradingView ziehen oder klicken</p>
          <p className="text-xs text-muted-foreground mt-1">Erkennt automatisch gängige Spalten aus TradingView</p>
        </div>
        
        {file && (
          <div className="rocket-card p-3 rounded-lg">
            <div className="flex items-center space-x-2">
              <div className="bg-primary/20 rounded-full p-2">
                <Upload className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Ready to import:</p>
                <p className="text-xs text-muted-foreground">{file.name}</p>
              </div>
            </div>
          </div>
        )}
        
        <Button
          onClick={handleImport}
          disabled={!file || importing}
          className="w-full pulse-btn bg-gradient-to-r from-primary to-blue-400 hover:from-primary hover:to-blue-300 text-black font-bold"
        >
          {importing ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Launching to Moon...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-5 w-5" />
              Launch Trades 🚀
            </>
          )}
        </Button>
      </div>
      
      <div className="space-y-3 pt-2">
        <div className="rocket-card p-3 rounded-lg">
          <p className="text-xs font-medium text-primary/80 mb-1">Erkannte Felder aus TradingView:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            <p className="text-xs text-muted-foreground">• Symbol / Ticker</p>
            <p className="text-xs text-muted-foreground">• Setup / Strategy</p>
            <p className="text-xs text-muted-foreground">• Main Trend / Direction</p>
            <p className="text-xs text-muted-foreground">• Internal Trend / Sub Direction</p>
            <p className="text-xs text-muted-foreground">• Entry Type / Order Type</p>
            <p className="text-xs text-muted-foreground">• Entry Level / Price</p>
            <p className="text-xs text-muted-foreground">• Result / Win / Profit</p>
            <p className="text-xs text-muted-foreground">• R:R / Risk-Reward</p>
          </div>
        </div>
        
        <div className="text-center space-y-1">
          <p className="text-xs text-muted-foreground">Deine Trade-Daten werden lokal gespeichert</p>
          <p className="text-xs text-primary/80">Diamond hands required 💎🙌</p>
        </div>
      </div>
    </div>
  );
}