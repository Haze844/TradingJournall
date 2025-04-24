import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator"; 
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Upload, RefreshCw } from "lucide-react";
import Papa from "papaparse";
import { Trade, insertTradeSchema } from "@shared/schema";
import { z } from "zod";
import { synchronizeTrades } from "@/lib/tradovate";
import { useAuth } from "@/hooks/use-auth";

export default function TradeImport() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { user } = useAuth();

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
          
          // CSV-Format erkennen (TradingView oder Tradovate)
          const detectCSVFormat = (row: any): 'tradingview' | 'tradovate' | 'unknown' => {
            // Prüfen auf charakteristische Tradovate-Felder
            if (row['Contract'] !== undefined || 
                row['Account ID'] !== undefined || 
                row['P/L'] !== undefined ||
                row['Commission'] !== undefined) {
              return 'tradovate';
            }
            
            // Prüfen auf charakteristische TradingView-Felder
            if (row['Symbol'] !== undefined || 
                row['Setup'] !== undefined || 
                row['Strategy'] !== undefined) {
              return 'tradingview';
            }
            
            return 'unknown';
          };
          
          // Tradovate Felder mappen
          const mapTradovateFields = (row: any) => {
            // Hier konvertieren wir Tradovate-spezifische Felder in unser internes Format
            // P/L (Profit/Loss) bestimmt, ob der Trade gewonnen hat
            const profitLoss = parseFloat(String(row['P/L'] || "0").replace(/[^0-9.-]/g, ''));
            const isWin = profitLoss > 0;
            
            // Risk/Reward berechnen oder Default-Werte verwenden
            // Für Tradovate können wir R:R aus Initial Risk und P/L berechnen
            const initialRisk = parseFloat(String(row['Initial Risk'] || "1").replace(/[^0-9.-]/g, ''));
            const rrAchieved = initialRisk !== 0 ? Math.abs(profitLoss / initialRisk) : 0;
            
            return {
              symbol: row['Contract'] || row['Symbol'] || "",
              setup: row['Strategy'] || row['Setup Type'] || "",
              mainTrendM15: row['Market Direction'] || row['Trend'] || "",
              internalTrendM5: row['Internal Direction'] || "",
              entryType: row['Order Type'] || row['Action'] || (row['Side'] === 'Buy' ? 'Long' : 'Short') || "",
              entryLevel: row['Fill Price'] || row['Average Price'] || "",
              liquidation: row['Stop Price'] || row['Stop Loss'] || "",
              location: row['Entry Zone'] || row['Entry Location'] || "",
              rrAchieved: rrAchieved,
              rrPotential: parseFloat(String(row['Target RR'] || "0").replace(/[^0-9.-]/g, '')),
              isWin: isWin,
              date: row['Fill Time'] || row['Time'] || row['Order Time'] || new Date().toISOString(),
            };
          };
          
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
              // Format erkennen
              const csvFormat = detectCSVFormat(row);
              let processedRow: any;
              
              // Entsprechend dem Format die Daten verarbeiten
              if (csvFormat === 'tradovate') {
                processedRow = mapTradovateFields(row);
                console.log("Tradovate Format erkannt:", processedRow);
              } else {
                // Standardmäßig TradingView-Format annehmen
                processedRow = mapTradingViewFields(row);
                
                // Konvertiere String-Werte in richtigen Datentyp für TradingView
                processedRow = {
                  symbol: processedRow.symbol || "",
                  setup: processedRow.setup || "",
                  mainTrendM15: processedRow.mainTrendM15 || "",
                  internalTrendM5: processedRow.internalTrendM5 || "",
                  entryType: processedRow.entryType || "",
                  entryLevel: processedRow.entryLevel || "",
                  liquidation: processedRow.liquidation || "",
                  location: processedRow.location || "",
                  rrAchieved: parseFloat(String(processedRow.rrAchieved || "0")),
                  rrPotential: parseFloat(String(processedRow.rrPotential || "0")),
                  // Für den isWin-Wert prüfen wir verschiedene Möglichkeiten
                  isWin: typeof processedRow.isWin === 'boolean' ? processedRow.isWin : 
                         String(processedRow.isWin).toLowerCase() === 'true' || 
                         String(processedRow.isWin).toLowerCase() === 'win' ||
                         String(processedRow.isWin).toLowerCase() === 'yes' ||
                         String(processedRow.isWin).toLowerCase() === 'profit',
                  date: row.Date || row.date || row.Time || row.time || new Date().toISOString(),
                };
              }
              
              return processedRow;
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
        <h3 className="text-xl font-bold moon-text">🚀 CSV-Import</h3>
        <p className="text-sm text-muted-foreground">
          Importiere Trades aus TradingView oder Tradovate 📈
        </p>
      </div>
      
      <div className="space-y-3">
        <div className="w-full flex items-center justify-between gap-3 mb-2">
          <h4 className="text-sm font-semibold text-primary">CSV-Import</h4>
          <Separator className="flex-1" />
        </div>
        
        <div className="w-full h-36 rounded-xl border-2 border-dashed border-primary/40 flex flex-col items-center justify-center p-4 hover:border-primary/60 transition-colors">
          <Upload className="h-8 w-8 text-primary/60 mb-2" />
          <Input
            type="file"
            accept=".csv"
            onChange={handleFileChange}
            disabled={importing}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          <p className="text-sm font-medium">CSV-Datei ziehen oder klicken</p>
          <p className="text-xs text-muted-foreground mt-1">Unterstützt TradingView und Tradovate Exporte</p>
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
        
        <div className="w-full flex items-center justify-between gap-3 mt-6 mb-2">
          <h4 className="text-sm font-semibold text-primary">Tradovate API</h4>
          <Separator className="flex-1" />
        </div>
        
        <div className="rocket-card p-4 rounded-lg">
          <p className="text-xs text-muted-foreground mb-3">
            Verbinde dein Tradovate-Konto und importiere deine Trades automatisch
          </p>
          <Button
            onClick={async () => {
              if (!user) return;
              
              setSyncing(true);
              try {
                const result = await synchronizeTrades(user.id);
                
                if (result.success) {
                  toast({
                    title: "Synchronisation erfolgreich",
                    description: result.message,
                  });
                  
                  // Aktualisiere die Daten im UI
                  queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/weekly-summary"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/performance-data"] });
                  queryClient.invalidateQueries({ queryKey: ["/api/setup-win-rates"] });
                } else {
                  toast({
                    title: "Synchronisation fehlgeschlagen",
                    description: result.message,
                    variant: "destructive",
                  });
                }
              } catch (error) {
                toast({
                  title: "Fehler bei der Synchronisation",
                  description: error instanceof Error ? error.message : "Unbekannter Fehler",
                  variant: "destructive",
                });
              } finally {
                setSyncing(false);
              }
            }}
            disabled={syncing || !user}
            className="w-full pulse-btn bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white"
          >
            {syncing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Synchronisiere...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Mit Tradovate synchronisieren
              </>
            )}
          </Button>
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Benötigt API-Zugangsdaten in den Einstellungen
          </p>
        </div>
      </div>
      
      <div className="space-y-3 pt-2">
        <div className="rocket-card p-3 rounded-lg">
          <p className="text-xs font-medium text-primary/80 mb-1">Unterstützte Plattformen & Felder:</p>
          <div className="grid grid-cols-1 gap-1 mb-3">
            <div className="bg-primary/10 rounded-md p-2">
              <p className="text-xs font-medium text-primary mb-1">📊 TradingView:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <p className="text-xs text-muted-foreground">• Symbol / Ticker</p>
                <p className="text-xs text-muted-foreground">• Setup / Strategy</p>
                <p className="text-xs text-muted-foreground">• Main Trend / Direction</p>
                <p className="text-xs text-muted-foreground">• Result / Win / Profit</p>
              </div>
            </div>
            
            <div className="bg-primary/10 rounded-md p-2">
              <p className="text-xs font-medium text-primary mb-1">💹 Tradovate:</p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                <p className="text-xs text-muted-foreground">• Contract / Symbol</p>
                <p className="text-xs text-muted-foreground">• P/L (Profit/Loss)</p>
                <p className="text-xs text-muted-foreground">• Fill Price / Average Price</p>
                <p className="text-xs text-muted-foreground">• Side (Buy/Sell)</p>
              </div>
            </div>
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