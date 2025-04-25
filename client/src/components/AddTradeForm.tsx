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
  entryLevelTypes,
  timeframeTypes,
  locationTypes
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
      setup: setupTypes[0],
      mainTrendM15: trendTypes[0],
      internalTrendM5: trendTypes[0],
      entryType: trendTypes[0],
      entryLevel: entryLevelTypes[0],
      liquidation: timeframeTypes[0],
      location: locationTypes[0],
      rrAchieved: 0,
      rrPotential: 0,
      isWin: false,
      date: format(new Date(), "yyyy-MM-dd"),
      time: format(new Date(), "HH:mm")
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
        setup: setupTypes[0],
        mainTrendM15: trendTypes[0],
        internalTrendM5: trendTypes[0],
        entryType: trendTypes[0],
        entryLevel: entryLevelTypes[0],
        liquidation: timeframeTypes[0],
        location: locationTypes[0],
        rrAchieved: 0,
        rrPotential: 0,
        isWin: false,
        date: format(new Date(), "yyyy-MM-dd"),
        time: format(new Date(), "HH:mm")
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
    <Card className="w-full mb-6">
      <CardHeader>
        <CardTitle>Neuen Trade hinzufügen</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
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
          <div className="grid grid-cols-2 gap-4">
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
                defaultValue={setupTypes[0]}
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="mainTrendM15">Haupttrend M15</Label>
              <Select
                defaultValue={trendTypes[0]}
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
                defaultValue={trendTypes[0]}
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
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="entryType">Einstiegstyp</Label>
              <Select
                defaultValue={trendTypes[0]}
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
                defaultValue={entryLevelTypes[0]}
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
                defaultValue={timeframeTypes[0]}
                onValueChange={(value) => setValue("liquidation", value)}
              >
                <SelectTrigger className={errors.liquidation ? "border-red-500" : ""}>
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
              {errors.liquidation && (
                <p className="text-xs text-red-500 mt-1">{errors.liquidation.message}</p>
              )}
            </div>
          </div>

          {/* Location */}
          <div>
            <Label htmlFor="location">Location</Label>
            <Select
              defaultValue={locationTypes[0]}
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

          {/* R:R Informationen */}
          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="rrAchieved">R:R Erreicht</Label>
              <Input
                id="rrAchieved"
                type="number"
                step="0.1"
                {...register("rrAchieved", { valueAsNumber: true })}
                className={errors.rrAchieved ? "border-red-500" : ""}
              />
              {errors.rrAchieved && (
                <p className="text-xs text-red-500 mt-1">{errors.rrAchieved.message}</p>
              )}
            </div>
            <div>
              <Label htmlFor="rrPotential">R:R Potenzial</Label>
              <Input
                id="rrPotential"
                type="number"
                step="0.1"
                {...register("rrPotential", { valueAsNumber: true })}
                className={errors.rrPotential ? "border-red-500" : ""}
              />
              {errors.rrPotential && (
                <p className="text-xs text-red-500 mt-1">{errors.rrPotential.message}</p>
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
          <div className="mb-4">
            <Label htmlFor="chartImage">TradingView Chart</Label>
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
      </CardContent>
    </Card>
  );
}