import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Loader2 } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ChartImageUpload from "./ChartImageUpload";
import {
  insertTradeSchema,
  setupTypes,
  trendTypes,
  simpleTrendTypes,
  entryLevelTypes,
  timeframeTypes,
  locationTypes,
  accountTypes,
  structureTypes,
  unmitZoneTypes,
  marketPhaseTypes,
  rrValues,
  liquidationTypes,
  sessionTypes
} from "@shared/schema";

// Erweitere das Schema für clientseitige Validierung
const addTradeSchema = insertTradeSchema.extend({
  date: z.string().min(1, "Datum ist erforderlich"),
  time: z.string().min(1, "Uhrzeit ist erforderlich"),
  profitLoss: z.number().optional(),
  chartImage: z.string().optional()
});

type AddTradeFormData = z.infer<typeof addTradeSchema> & { time: string };

interface AddTradeFormProps {
  userId: number;
  onAddSuccess?: () => void;
}

export default function AddTradeForm({ userId, onAddSuccess }: AddTradeFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddTradeFormData>({
    resolver: zodResolver(addTradeSchema),
    defaultValues: {
      symbol: "",
      setup: "",
      mainTrendM15: "",
      internalTrendM5: "",
      entryType: "",
      entryLevel: "",
      liquidation: "",
      location: "",
      session: "",
      rrAchieved: 0,
      rrPotential: 0,
      isWin: false,
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm"),
      // Neue Felder
      trend: "",
      internalTrend: "",
      microTrend: "",
      structure: "",
      timeframeEntry: "",
      unmitZone: "",
      rangePoints: 0,
      marketPhase: "",
      riskSum: 200,
      size: 0
    }
  });

  const addTradeMutation = useMutation({
    mutationFn: async (data: AddTradeFormData) => {
      // Kombiniere Datum und Uhrzeit
      const dateTime = new Date(`${data.date}T${data.time}`);
      
      // Bereite die Daten für die API vor und entferne das time-Feld, da es nur clientseitig ist
      const { time, ...tradeData } = data;
      
      const response = await apiRequest("POST", "/api/trades", {
        ...tradeData,
        date: dateTime.toISOString(),
        rrAchieved: tradeData.rrAchieved ? parseFloat(tradeData.rrAchieved.toString()) : 0,
        rrPotential: tradeData.rrPotential ? parseFloat(tradeData.rrPotential.toString()) : 0,
        userId
      });
      
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade hinzugefügt",
        description: "Der Trade wurde erfolgreich gespeichert."
      });
      
      // Formular zurücksetzen
      reset({
        symbol: "",
        setup: "",
        mainTrendM15: "",
        internalTrendM5: "",
        entryType: "",
        entryLevel: "",
        liquidation: "",
        location: "",
        accountType: "",
        session: "",
        rrAchieved: 0,
        rrPotential: 0,
        isWin: false,
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "HH:mm"),
        // Neue Felder
        trend: "",
        internalTrend: "",
        microTrend: "",
        structure: "",
        timeframeEntry: "",
        unmitZone: "",
        rangePoints: 0,
        marketPhase: "",
        riskSum: 200, // Eigentlicher Wert, der auf der Datenbank-Seite gespeichert wird
        size: 0
      });
      
      // Cache invalidieren
      queryClient.invalidateQueries({ queryKey: ["/api/trades"] });
      queryClient.invalidateQueries({ queryKey: ["/api/weekly-summary"] });
      queryClient.invalidateQueries({ queryKey: ["/api/performance-data"] });
      queryClient.invalidateQueries({ queryKey: ["/api/setup-win-rates"] });
      
      // Benachrichtige Parent-Komponente (falls benötigt)
      if (onAddSuccess) onAddSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Fehler beim Speichern",
        description: error.message,
        variant: "destructive"
      });
    }
  });

  const onSubmit = async (data: AddTradeFormData) => {
    setIsSubmitting(true);
    try {
      await addTradeMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-none overflow-visible">
      <div className="overflow-visible">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            {/* Datum und Uhrzeit */}
            <div>
              <Label htmlFor="date">Datum</Label>
              <Input
                id="date"
                type="date"
                {...register("date")}
                className={errors.date ? "border-red-500" : ""}
              />
              {errors.date && (
                <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="time">Uhrzeit</Label>
              <Input
                id="time"
                type="time"
                {...register("time")}
                className={errors.time ? "border-red-500" : ""}
              />
              {errors.time && (
                <p className="text-xs text-red-500 mt-1">{errors.time.message}</p>
              )}
            </div>
          </div>

          {/* Symbol und Setup */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="symbol">Symbol</Label>
              <Input
                id="symbol"
                {...register("symbol")}
                className={errors.symbol ? "border-red-500" : ""}
              />
              {errors.symbol && (
                <p className="text-xs text-red-500 mt-1">{errors.symbol.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="setup">Setup</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("setup", value)}
              >
                <SelectTrigger className={errors.setup ? "border-red-500" : ""}>
                  <SelectValue placeholder="Setup auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {setupTypes.map((setup) => (
                    <SelectItem key={setup} value={setup}>
                      {setup}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.setup && (
                <p className="text-xs text-red-500 mt-1">{errors.setup.message}</p>
              )}
            </div>
          </div>

          {/* Trend Informationen */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label htmlFor="mainTrendM15">Haupttrend M15</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("mainTrendM15", value)}
              >
                <SelectTrigger className={errors.mainTrendM15 ? "border-red-500" : ""}>
                  <SelectValue placeholder="Trend auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {trendTypes.map((trend) => (
                    <SelectItem key={trend} value={trend}>
                      {trend}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.mainTrendM15 && (
                <p className="text-xs text-red-500 mt-1">{errors.mainTrendM15.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="internalTrendM5">Interner Trend M5</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("internalTrendM5", value)}
              >
                <SelectTrigger className={errors.internalTrendM5 ? "border-red-500" : ""}>
                  <SelectValue placeholder="Trend auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {trendTypes.map((trend) => (
                    <SelectItem key={trend} value={trend}>
                      {trend}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.internalTrendM5 && (
                <p className="text-xs text-red-500 mt-1">{errors.internalTrendM5.message}</p>
              )}
            </div>
          </div>

          {/* Entry Informationen */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="entryType">Einstiegstyp</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("entryType", value)}
              >
                <SelectTrigger className={errors.entryType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Typ auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {trendTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entryType && (
                <p className="text-xs text-red-500 mt-1">{errors.entryType.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="entryLevel">Einstiegslevel</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("entryLevel", value)}
              >
                <SelectTrigger className={errors.entryLevel ? "border-red-500" : ""}>
                  <SelectValue placeholder="Level auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {entryLevelTypes.map((level) => (
                    <SelectItem key={level} value={level}>
                      {level}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.entryLevel && (
                <p className="text-xs text-red-500 mt-1">{errors.entryLevel.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="liquidation">Liquidation</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("liquidation", value)}
              >
                <SelectTrigger className={errors.liquidation ? "border-red-500" : ""}>
                  <SelectValue placeholder="Timeframe auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {liquidationTypes.filter(liq => liq !== "M5" && liq !== "M15").map((liq) => (
                    <SelectItem key={liq} value={liq}>
                      {liq}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.liquidation && (
                <p className="text-xs text-red-500 mt-1">{errors.liquidation.message}</p>
              )}
            </div>
          </div>

          {/* Location, Session und Kontoart */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="location">Location</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("location", value)}
              >
                <SelectTrigger className={errors.location ? "border-red-500" : ""}>
                  <SelectValue placeholder="Location auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {locationTypes.map((location) => (
                    <SelectItem key={location} value={location}>
                      {location}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.location && (
                <p className="text-xs text-red-500 mt-1">{errors.location.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="session">Session</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("session", value)}
              >
                <SelectTrigger className={errors.session ? "border-red-500" : ""}>
                  <SelectValue placeholder="Session auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {sessionTypes.map((session) => (
                    <SelectItem key={session} value={session}>
                      {session}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.session && (
                <p className="text-xs text-red-500 mt-1">{errors.session.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="accountType">Kontoart</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("accountType", value)}
              >
                <SelectTrigger className={errors.accountType ? "border-red-500" : ""}>
                  <SelectValue placeholder="Kontoart auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {accountTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.accountType && (
                <p className="text-xs text-red-500 mt-1">{errors.accountType.message}</p>
              )}
            </div>
          </div>

          {/* Neue Trend-Spalten */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="trend">Trend</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("trend", value)}
              >
                <SelectTrigger className={errors.trend ? "border-red-500" : ""}>
                  <SelectValue placeholder="Trend auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {simpleTrendTypes.map((trend) => (
                    <SelectItem key={trend} value={trend}>
                      {trend}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.trend && (
                <p className="text-xs text-red-500 mt-1">{errors.trend.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="internalTrend">Int. Trend</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("internalTrend", value)}
              >
                <SelectTrigger className={errors.internalTrend ? "border-red-500" : ""}>
                  <SelectValue placeholder="Trend auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {simpleTrendTypes.map((trend) => (
                    <SelectItem key={trend} value={trend}>
                      {trend}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.internalTrend && (
                <p className="text-xs text-red-500 mt-1">{errors.internalTrend.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="microTrend">Mic. Trend</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("microTrend", value)}
              >
                <SelectTrigger className={errors.microTrend ? "border-red-500" : ""}>
                  <SelectValue placeholder="Trend auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {simpleTrendTypes.map((trend) => (
                    <SelectItem key={trend} value={trend}>
                      {trend}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.microTrend && (
                <p className="text-xs text-red-500 mt-1">{errors.microTrend.message}</p>
              )}
            </div>
          </div>

          {/* Struktur und Timeframe Entry */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="structure">Struktur</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("structure", value)}
              >
                <SelectTrigger className={errors.structure ? "border-red-500" : ""}>
                  <SelectValue placeholder="Struktur auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {structureTypes.map((structure) => (
                    <SelectItem key={structure} value={structure}>
                      {structure}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.structure && (
                <p className="text-xs text-red-500 mt-1">{errors.structure.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="timeframeEntry">Timeframe Entry</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("timeframeEntry", value)}
              >
                <SelectTrigger className={errors.timeframeEntry ? "border-red-500" : ""}>
                  <SelectValue placeholder="Timeframe auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {timeframeTypes.map((tf) => (
                    <SelectItem key={tf} value={tf}>
                      {tf}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.timeframeEntry && (
                <p className="text-xs text-red-500 mt-1">{errors.timeframeEntry.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="unmitZone">Unmetigierte Zone</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("unmitZone", value)}
              >
                <SelectTrigger className={errors.unmitZone ? "border-red-500" : ""}>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {unmitZoneTypes.map((zone) => (
                    <SelectItem key={zone} value={zone}>
                      {zone}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.unmitZone && (
                <p className="text-xs text-red-500 mt-1">{errors.unmitZone.message}</p>
              )}
            </div>
          </div>

          {/* Marktphase und Range Punkte */}
          <div className="grid grid-cols-3 gap-2">
            <div>
              <Label htmlFor="marketPhase">Marktphase</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("marketPhase", value)}
              >
                <SelectTrigger className={errors.marketPhase ? "border-red-500" : ""}>
                  <SelectValue placeholder="Phase auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {marketPhaseTypes.map((phase) => (
                    <SelectItem key={phase} value={phase}>
                      {phase}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.marketPhase && (
                <p className="text-xs text-red-500 mt-1">{errors.marketPhase.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rangePoints">Range Punkte</Label>
              <Input
                id="rangePoints"
                type="number"
                min="0"
                max="300"
                {...register("rangePoints", { valueAsNumber: true })}
                className={errors.rangePoints ? "border-red-500" : ""}
              />
              {errors.rangePoints && (
                <p className="text-xs text-red-500 mt-1">{errors.rangePoints.message}</p>
              )}
            </div>
          </div>

          {/* R:R Informationen */}
          <div className="grid grid-cols-5 gap-2">
            <div>
              <Label htmlFor="rrAchieved">R:R Erreicht</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("rrAchieved", parseInt(value))}
              >
                <SelectTrigger className={errors.rrAchieved ? "border-red-500" : ""}>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {rrValues.map((rr) => (
                    <SelectItem key={rr} value={rr.toString()}>
                      {rr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rrAchieved && (
                <p className="text-xs text-red-500 mt-1">{errors.rrAchieved.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rrPotential">R:R Potenzial</Label>
              <Select
                defaultValue=""
                onValueChange={(value) => setValue("rrPotential", parseInt(value))}
              >
                <SelectTrigger className={errors.rrPotential ? "border-red-500" : ""}>
                  <SelectValue placeholder="Auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {rrValues.map((rr) => (
                    <SelectItem key={rr} value={rr.toString()}>
                      {rr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.rrPotential && (
                <p className="text-xs text-red-500 mt-1">{errors.rrPotential.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="size">Size</Label>
              <Input
                id="size"
                type="number"
                defaultValue={0}
                {...register("size", { valueAsNumber: true })}
                className={errors.size ? "border-red-500" : ""}
                placeholder="0"
              />
              {errors.size && (
                <p className="text-xs text-red-500 mt-1">{errors.size.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="riskSum">Risiko Punkte</Label>
              <Input
                id="riskSum"
                type="number"
                defaultValue={800}
                onBlur={(e) => {
                  const value = e.target.value === "" ? 0 : parseFloat(e.target.value);
                  // Teile durch 4, um den eigentlichen Risiko-Wert zu speichern
                  setValue("riskSum", value / 4);
                }}
                className={errors.riskSum ? "border-red-500" : ""}
                placeholder="0"
              />
              {errors.riskSum && (
                <p className="text-xs text-red-500 mt-1">{errors.riskSum.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="profitLoss">Ergebnis in $</Label>
              <Input
                id="profitLoss"
                type="number"
                step="0.01"
                {...register("profitLoss", { valueAsNumber: true })}
                className={errors.profitLoss ? "border-red-500" : ""}
                placeholder="0.00"
              />
              {errors.profitLoss && (
                <p className="text-xs text-red-500 mt-1">{errors.profitLoss.message}</p>
              )}
            </div>
          </div>

          {/* Win/Loss Status */}
          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="isWin"
              {...register("isWin")}
              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <Label htmlFor="isWin">Trade gewonnen</Label>
          </div>

          {/* Chart Image Upload */}
          <div className="mb-2">
            <ChartImageUpload 
              existingImage={null} 
              onChange={(base64Image) => setValue("chartImage", base64Image || "")}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-blue-400 hover:from-primary hover:to-blue-300 text-black font-bold"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Speichern...
              </>
            ) : (
              "Trade speichern"
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}