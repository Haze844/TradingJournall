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
          
          const trades = data.map((row: any) => {
            try {
              // Konvertiere String-Werte in richtigen Datentyp
              return {
                symbol: row.symbol || "",
                setup: row.setup || "",
                mainTrendM15: row.mainTrendM15 || row.main_trend_m15 || "",
                internalTrendM5: row.internalTrendM5 || row.internal_trend_m5 || "",
                entryType: row.entryType || row.entry_type || "",
                entryLevel: row.entryLevel || row.entry_level || "",
                liquidation: row.liquidation || "",
                location: row.location || "",
                rrAchieved: parseFloat(row.rrAchieved || row.rr_achieved || "0"),
                rrPotential: parseFloat(row.rrPotential || row.rr_potential || "0"),
                isWin: row.isWin === "true" || row.is_win === "true" || row.isWin === true || row.is_win === true,
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
        <h3 className="text-xl font-bold moon-text">🚀 Boost Your Portfolio</h3>
        <p className="text-sm text-muted-foreground">
          Import your trades and watch them moon! 📈
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
          <p className="text-sm font-medium">Drag CSV file here or click to browse</p>
          <p className="text-xs text-muted-foreground mt-1">Support for CSV files only</p>
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
      
      <div className="text-center space-y-1 pt-2">
        <p className="text-xs text-muted-foreground">Your trade data is stored locally</p>
        <p className="text-xs text-primary/80">Diamond hands required 💎🙌</p>
      </div>
    </div>
  );
}