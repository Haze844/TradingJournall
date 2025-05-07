import React, { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Wallet, 
  PiggyBank, 
  TrendingUp, 
  Edit, 
  Check, 
  X, 
  Settings, 
  TrendingDown, 
  AlertTriangle, 
  ArrowUp, 
  ArrowDown, 
  BadgeCheck,
  Award,
  Lightbulb
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { queryClient } from "../lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface AccountBalanceProgressProps {
  className?: string;
  filteredTrades?: any[];
  userId?: number;
  activeFilters?: any;
  onBalanceUpdate?: (paBalance: number, evaBalance: number, ekBalance: number) => void;
}

export default function AccountBalanceProgressNew({ 
  className, 
  filteredTrades = [],
  userId,
  activeFilters,
  onBalanceUpdate
}: AccountBalanceProgressProps) {
  const [activeTab, setActiveTab] = useState<string>("pa");
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // Formular-States
  const [isEditingPA, setIsEditingPA] = useState(false);
  const [isEditingPAGoal, setIsEditingPAGoal] = useState(false);
  const [isEditingEVA, setIsEditingEVA] = useState(false);
  const [isEditingEVAGoal, setIsEditingEVAGoal] = useState(false);
  const [isEditingEK, setIsEditingEK] = useState(false);
  const [isEditingEKGoal, setIsEditingEKGoal] = useState(false);
  
  // Refs für Input-Felder
  const paBalanceInputRef = useRef<HTMLInputElement>(null);
  const paGoalInputRef = useRef<HTMLInputElement>(null);
  const evaBalanceInputRef = useRef<HTMLInputElement>(null);
  const evaGoalInputRef = useRef<HTMLInputElement>(null);
  const ekBalanceInputRef = useRef<HTMLInputElement>(null);
  const ekGoalInputRef = useRef<HTMLInputElement>(null);
  
  // State für berechnete Kontostände aus gefilterten Trades
  const [calculatedPaBalance, setCalculatedPaBalance] = useState<number | null>(null);
  const [calculatedEvaBalance, setCalculatedEvaBalance] = useState<number | null>(null);
  const [calculatedEkBalance, setCalculatedEkBalance] = useState<number | null>(null);

  // Benutzereinstellungen abrufen
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings', user?.id],
    queryFn: async () => {
      try {
        console.log("Rufe Einstellungen für userId:", user?.id);
        // Wichtig: userId als Parameter hinzufügen
        const response = await apiRequest("GET", `/api/settings?userId=${user?.id}`);
        if (response.ok) {
          const data = await response.json();
          console.log("Einstellungen erfolgreich abgerufen:", data);
          return data;
        } else {
          console.warn("Fallback zu Default-Einstellungen, API-Antwort nicht ok");
          return { 
            accountBalance: 2500, 
            goalBalance: 7500,
            evaAccountBalance: 1500,
            evaGoalBalance: 7500,
            ekAccountBalance: 1000,
            ekGoalBalance: 5000
          };
        }
      } catch (err) {
        console.error("Fehler beim Abrufen der Einstellungen:", err);
        return { 
          accountBalance: 2500, 
          goalBalance: 7500,
          evaAccountBalance: 1500,
          evaGoalBalance: 7500,
          ekAccountBalance: 1000,
          ekGoalBalance: 5000
        };
      }
    },
    enabled: !!user?.id, // Nur aktivieren, wenn user.id existiert
  });

  // Hilfsfunktion zum Erstellen von URL-Parametern für Filter
  const buildFilterParams = () => {
    let params = '';
    
    if (!activeFilters) return params;
    
    // Datumsfilter
    if (activeFilters.startDate && activeFilters.endDate) {
      const startDate = new Date(activeFilters.startDate).toISOString().split('T')[0];
      const endDate = new Date(activeFilters.endDate).toISOString().split('T')[0];
      params += `&startDate=${startDate}&endDate=${endDate}`;
    }
    
    // Symbole
    if (activeFilters.symbols && activeFilters.symbols.length > 0) {
      params += `&symbols=${encodeURIComponent(JSON.stringify(activeFilters.symbols))}`;
    }
    
    // Setups
    if (activeFilters.setups && activeFilters.setups.length > 0) {
      params += `&setups=${encodeURIComponent(JSON.stringify(activeFilters.setups))}`;
    }
    
    // Win/Loss
    if (activeFilters.isWin !== null && activeFilters.isWin !== undefined) {
      params += `&isWin=${activeFilters.isWin}`;
    }
    
    // Marktphasen
    if (activeFilters.marketPhases && activeFilters.marketPhases.length > 0) {
      params += `&marketPhases=${encodeURIComponent(JSON.stringify(activeFilters.marketPhases))}`;
    }
    
    // Zeitzonen/Sessions
    if (activeFilters.sessions && activeFilters.sessions.length > 0) {
      params += `&sessions=${encodeURIComponent(JSON.stringify(activeFilters.sessions))}`;
    }
    
    return params;
  };
  
  // Trades basierend auf userId und activeFilters laden
  const { data: loadedTrades = [] } = useQuery({
    queryKey: ['/api/trades', userId, activeFilters],
    queryFn: async () => {
      try {
        const effectiveUserId = userId || user?.id;
        if (!effectiveUserId) return [];
        
        const filterParams = buildFilterParams();
        const response = await fetch(`/api/trades?userId=${effectiveUserId}${filterParams}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trades');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching trades:', error);
        return [];
      }
    },
    enabled: !!(userId || user?.id), // Nur aktivieren, wenn userId oder user.id existiert
  });
  
  // Verwende entweder die übergebenen filteredTrades oder die geladenen Trades
  const effectiveTrades = filteredTrades.length > 0 ? filteredTrades : loadedTrades;
  
  // Berechne Kontostände basierend auf gefilterten Trades
  useEffect(() => {
    if (settings && Array.isArray(effectiveTrades)) {
      // PA Konto Berechnung
      const paProfit = effectiveTrades
        .filter(trade => trade.accountType === "PA")
        .reduce((sum, trade) => {
          return sum + (Number(trade.profitLoss) || 0);
        }, 0);
      
      // EVA Konto Berechnung
      const evaProfit = effectiveTrades
        .filter(trade => trade.accountType === "EVA")
        .reduce((sum, trade) => {
          return sum + (Number(trade.profitLoss) || 0);
        }, 0);
      
      // EK Konto Berechnung
      const ekProfit = effectiveTrades
        .filter(trade => trade.accountType === "EK")
        .reduce((sum, trade) => {
          return sum + (Number(trade.profitLoss) || 0);
        }, 0);
      
      // Aktualisiere die berechneten Kontostände
      setCalculatedPaBalance(Number(settings.accountBalance) + paProfit);
      setCalculatedEvaBalance(Number(settings.evaAccountBalance) + evaProfit);
      setCalculatedEkBalance(Number(settings.ekAccountBalance || 0) + ekProfit);
    } else {
      // Wenn keine gefilterten Trades, setze auf null zurück
      setCalculatedPaBalance(null);
      setCalculatedEvaBalance(null);
      setCalculatedEkBalance(null);
    }
  }, [effectiveTrades, settings]);

  // Mutation zum Aktualisieren des Kontostands
  const updateBalanceMutation = useMutation({
    mutationFn: async (data: { accountType: 'PA' | 'EVA' | 'EK', balance: number }) => {
      if (!user) throw new Error('Benutzer nicht eingeloggt');
      return apiRequest('PUT', '/api/account-balance', { 
        userId: user.id, 
        accountType: data.accountType, 
        balance: data.balance 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Kontostand aktualisiert",
        description: "Dein Basis-Kontostand wurde erfolgreich aktualisiert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren des Kontostands: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Mutation zum Aktualisieren des Zielwerts
  const updateGoalMutation = useMutation({
    mutationFn: async (data: { accountType: 'PA' | 'EVA' | 'EK', goalBalance: number }) => {
      if (!user) throw new Error('Benutzer nicht eingeloggt');
      
      return apiRequest('PUT', '/api/goal-balance', { 
        userId: user.id,
        accountType: data.accountType,
        goalBalance: data.goalBalance
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/settings'] });
      toast({
        title: "Zielwert aktualisiert",
        description: "Dein Zielwert wurde erfolgreich aktualisiert",
      });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren des Zielwerts: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Handler-Funktionen
  const handlePABalanceSubmit = () => {
    if (paBalanceInputRef.current) {
      const value = Number(paBalanceInputRef.current.value);
      if (!isNaN(value) && value >= 0) {
        updateBalanceMutation.mutate({ accountType: 'PA', balance: value });
        setIsEditingPA(false);
      }
    }
  };

  const handlePAGoalSubmit = () => {
    if (paGoalInputRef.current) {
      const value = Number(paGoalInputRef.current.value);
      if (!isNaN(value) && value > 0) {
        updateGoalMutation.mutate({ accountType: 'PA', goalBalance: value });
        setIsEditingPAGoal(false);
      }
    }
  };

  const handleEVABalanceSubmit = () => {
    if (evaBalanceInputRef.current) {
      const value = Number(evaBalanceInputRef.current.value);
      if (!isNaN(value) && value >= 0) {
        updateBalanceMutation.mutate({ accountType: 'EVA', balance: value });
        setIsEditingEVA(false);
      }
    }
  };

  const handleEVAGoalSubmit = () => {
    if (evaGoalInputRef.current) {
      const value = Number(evaGoalInputRef.current.value);
      if (!isNaN(value) && value > 0) {
        updateGoalMutation.mutate({ accountType: 'EVA', goalBalance: value });
        setIsEditingEVAGoal(false);
      }
    }
  };
  
  const handleEKBalanceSubmit = () => {
    if (ekBalanceInputRef.current) {
      const value = Number(ekBalanceInputRef.current.value);
      if (!isNaN(value) && value >= 0) {
        updateBalanceMutation.mutate({ accountType: 'EK', balance: value });
        setIsEditingEK(false);
      }
    }
  };

  const handleEKGoalSubmit = () => {
    if (ekGoalInputRef.current) {
      const value = Number(ekGoalInputRef.current.value);
      if (!isNaN(value) && value > 0) {
        updateGoalMutation.mutate({ accountType: 'EK', goalBalance: value });
        setIsEditingEKGoal(false);
      }
    }
  };

  // Extrahiere Basiswerte aus den Settings
  const basePaBalance = settings ? Number(settings.accountBalance || 0) : 0;
  const baseEvaBalance = settings ? Number(settings.evaAccountBalance || 0) : 0;
  const baseEkBalance = settings ? Number(settings.ekAccountBalance || 0) : 0;
  const paGoal = settings ? Number(settings.goalBalance || 0) : 0;
  const evaGoal = settings ? Number(settings.evaGoalBalance || 0) : 0;
  const ekGoal = settings ? Number(settings.ekGoalBalance || 0) : 0;
  
  console.log("Gespeicherte Werte:", { 
    basePaBalance, baseEvaBalance, baseEkBalance, 
    paGoal, evaGoal, ekGoal 
  });

  // Verwende entweder die berechneten Werte oder die Basiswerte
  const paBalance = calculatedPaBalance !== null ? calculatedPaBalance : basePaBalance;
  const evaBalance = calculatedEvaBalance !== null ? calculatedEvaBalance : baseEvaBalance;
  const ekBalance = calculatedEkBalance !== null ? calculatedEkBalance : baseEkBalance;

  // Berechne Fortschritt in Prozent
  const paBalanceProgress = paGoal > 0 && paBalance > basePaBalance 
    ? Math.min(100, Math.round(((paBalance - basePaBalance) / (paGoal - basePaBalance)) * 100)) 
    : 0;
  const evaBalanceProgress = evaGoal > 0 && evaBalance > baseEvaBalance 
    ? Math.min(100, Math.round(((evaBalance - baseEvaBalance) / (evaGoal - baseEvaBalance)) * 100)) 
    : 0;
  const ekBalanceProgress = ekGoal > 0 && ekBalance > baseEkBalance 
    ? Math.min(100, Math.round(((ekBalance - baseEkBalance) / (ekGoal - baseEkBalance)) * 100)) 
    : 0;
    
  // Berechne Wachstum/Verlust gegenüber Basiswert
  const paGrowth = paBalance - basePaBalance;
  const evaGrowth = evaBalance - baseEvaBalance;
  const ekGrowth = ekBalance - baseEkBalance;
  
  // Berechne Wachstumsrate in Prozent
  const paGrowthRate = basePaBalance > 0 ? (paGrowth / basePaBalance) * 100 : 0;
  const evaGrowthRate = baseEvaBalance > 0 ? (evaGrowth / baseEvaBalance) * 100 : 0;
  const ekGrowthRate = baseEkBalance > 0 ? (ekGrowth / baseEkBalance) * 100 : 0;
  
  // Übergebe die aktuellen Kontostände an den parent-Component über onBalanceUpdate
  useEffect(() => {
    if (onBalanceUpdate && !isNaN(paBalance) && !isNaN(evaBalance) && !isNaN(ekBalance)) {
      onBalanceUpdate(paBalance, evaBalance, ekBalance);
    }
  }, [paBalance, evaBalance, ekBalance, onBalanceUpdate]);
  
  // Funktion zur Generierung dynamischer Empfehlungshinweise basierend auf Trading-Erfolg
  const getRecommendation = (accountType: 'PA' | 'EVA' | 'EK', growth: number, growthRate: number, progress: number) => {
    // Analysiere die gefilterten Trades für diesen Account-Typ
    const accountTrades = effectiveTrades.filter(trade => trade.accountType === accountType);
    const totalTrades = accountTrades.length;
    
    // RR-Analysen
    const avgRR = totalTrades > 0 
      ? accountTrades.reduce((sum, trade) => sum + (Number(trade.rrAchieved) || 0), 0) / totalTrades 
      : 0;
    
    // Risikomanagement-Analyse
    const riskSum = totalTrades > 0 
      ? accountTrades.reduce((sum, trade) => sum + (Number(trade.riskSum) || 0), 0) 
      : 0;
    const avgRisk = totalTrades > 0 ? riskSum / totalTrades : 0;
    
    // Win/Loss-Analyse
    const winTrades = accountTrades.filter(trade => trade.isWin === true || (trade.profitLoss !== undefined && Number(trade.profitLoss) > 0)).length;
    const winRate = totalTrades > 0 ? (winTrades / totalTrades) * 100 : 0;
    
    // Messung der Kontovolatilität
    const pnlValues = accountTrades.map(trade => Number(trade.profitLoss) || 0);
    const volatility = totalTrades > 1 
      ? Math.sqrt(pnlValues.reduce((sum, val) => sum + Math.pow(val - (growth / totalTrades), 2), 0) / totalTrades)
      : 0;
    
    // Setups und Bewertung der Setup-Qualität
    const setupPerformance = new Map();
    accountTrades.forEach(trade => {
      if (trade.setup) {
        const setup = trade.setup;
        if (!setupPerformance.has(setup)) {
          setupPerformance.set(setup, { count: 0, profit: 0 });
        }
        const data = setupPerformance.get(setup);
        data.count++;
        data.profit += Number(trade.profitLoss) || 0;
        setupPerformance.set(setup, data);
      }
    });
    
    // Ermittle das profitabelste Setup
    let bestSetup = '';
    let bestSetupProfit = 0;
    setupPerformance.forEach((data, setup) => {
      if (data.profit > bestSetupProfit) {
        bestSetupProfit = data.profit;
        bestSetup = setup;
      }
    });
    
    // Ermittle das unrentabelste Setup
    let worstSetup = '';
    let worstSetupProfit = 0;
    setupPerformance.forEach((data, setup) => {
      if (data.profit < worstSetupProfit) {
        worstSetupProfit = data.profit;
        worstSetup = setup;
      }
    });
    
    if (growth < 0) {
      // Verluste analysieren
      if (growthRate < -20) {
        return {
          icon: <AlertTriangle className="h-4 w-4 text-red-500" />,
          message: totalTrades > 0 
            ? `Kritischer Verlust! ${winRate < 40 ? 'Deine Win-Rate von ' + winRate.toFixed(0) + '% ist zu niedrig. ' : ''}${avgRisk > 2 ? 'Reduziere dein Risiko pro Trade (aktuell $' + avgRisk.toFixed(0) + '). ' : ''}Mache eine Handelspause.`
            : "Kritischer Verlust! Überprüfe deine Risikomanagement-Strategie umgehend.",
          color: "red"
        };
      } else if (growthRate < -10) {
        return {
          icon: <TrendingDown className="h-4 w-4 text-orange-500" />, 
          message: totalTrades > 0
            ? `Verluste überwiegen. ${worstSetup ? 'Vermeide das Setup "' + worstSetup + '". ' : ''}${volatility > Math.abs(growth/2) ? 'Deine Trades sind zu volatil. ' : ''}Achte auf bessere Einstiege.`
            : "Bedeutender Verlust. Reduziere die Position und überdenke deine Strategie.",
          color: "orange"
        };
      } else {
        return {
          icon: <ArrowDown className="h-4 w-4 text-yellow-500" />,
          message: totalTrades > 0
            ? `Leichter Verlust. ${avgRR < 1 ? 'Erhöhe dein Risk/Reward-Verhältnis (aktuell ' + avgRR.toFixed(1) + 'R). ' : ''}Mehr Geduld bei Gewinnmitnahmen.`
            : "Leichter Verlust. Analysiere deine letzten Trades genauer.",
          color: "yellow"
        };
      }
    } else if (growth === 0 || totalTrades === 0) {
      return {
        icon: <Lightbulb className="h-4 w-4 text-blue-400" />,
        message: accountType === 'PA' 
          ? "Starte mit kleinen Positionen im PA-Konto und teste verschiedene Setups."
          : accountType === 'EVA' 
            ? "EVA-Konto ideal für das Testen neuer Strategien mit kontrolliertem Risiko."
            : "EK-Konto bereit für den Einsatz. Starte mit einem strukturierten Tradingplan.",
        color: "blue"
      };
    } else {
      // Gewinne analysieren
      if (progress >= 100) {
        return {
          icon: <Award className="h-4 w-4 text-green-500" />,
          message: totalTrades > 0
            ? `Ziel erreicht! ${bestSetup ? 'Das Setup "' + bestSetup + '" war besonders profitabel. ' : ''}${winRate > 60 ? 'Win-Rate von ' + winRate.toFixed(0) + '% beibehalten. ' : ''}Erhöhe nun dein Ziel.`
            : "Ziel erreicht! Setze dir ein neues, höheres Ziel und bleibe konsequent.",
          color: "green"
        };
      } else if (progress >= 75) {
        return {
          icon: <BadgeCheck className="h-4 w-4 text-emerald-500" />,
          message: totalTrades > 0
            ? `Ausgezeichneter Fortschritt! ${avgRR > 1.5 ? 'Dein R/R von ' + avgRR.toFixed(1) + ' ist stark. ' : ''}${bestSetup ? 'Fokussiere auf Setup "' + bestSetup + '". ' : ''}Bleib konsistent.`
            : "Ausgezeichneter Fortschritt! Du bist auf dem besten Weg zum Ziel.",
          color: "emerald"
        };
      } else if (progress >= 50) {
        return {
          icon: <TrendingUp className="h-4 w-4 text-green-400" />,
          message: totalTrades > 0
            ? `Guter Fortschritt. ${winRate > 50 ? 'Win-Rate von ' + winRate.toFixed(0) + '% beibehalten. ' : ''}${volatility < growth/3 ? 'Deine Trades sind sehr konsistent. ' : ''}Setze klare SL und TP.`
            : "Guter Fortschritt. Bleib bei deiner erfolgreichen Strategie und optimiere sie.",
          color: "green"
        };
      } else if (progress >= 25) {
        return {
          icon: <ArrowUp className="h-4 w-4 text-teal-400" />,
          message: totalTrades > 0
            ? `Positive Entwicklung. ${avgRR < 1 ? 'Verbessere dein R/R (aktuell ' + avgRR.toFixed(1) + '). ' : ''}${bestSetup ? 'Setup "' + bestSetup + '" funktioniert gut. ' : ''}Dokumentiere Erfolge.`
            : "Positive Entwicklung. Halte an deinem Plan fest und verbessere deine Einträge.",
          color: "teal"
        };
      } else {
        return {
          icon: <Lightbulb className="h-4 w-4 text-blue-400" />,
          message: totalTrades > 0
            ? `Guter Start. ${winRate < 50 ? 'Verbessere deine Win-Rate von ' + winRate.toFixed(0) + '%. ' : ''}${avgRisk > 0 ? 'Risiko von $' + avgRisk.toFixed(0) + ' pro Trade angemessen. ' : ''}Weiter so!`
            : "Guter Start. Analysiere erfolgreiche Trades und wiederhole ihre Muster.",
          color: "blue"
        };
      }
    }
  };
  
  // Empfehlungen für jede Kontoart
  const paRecommendation = getRecommendation('PA', paGrowth, paGrowthRate, paBalanceProgress);
  const evaRecommendation = getRecommendation('EVA', evaGrowth, evaGrowthRate, evaBalanceProgress);
  const ekRecommendation = getRecommendation('EK', ekGrowth, ekGrowthRate, ekBalanceProgress);

  return (
    <div className={`space-y-2 border border-primary/10 px-2 py-1 rounded-lg bg-black/10 shadow-sm backdrop-blur-sm ${className}`}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <h3 className="text-[14px] font-bold flex items-center">
              <Wallet className="mr-1 h-4 w-4 text-primary" />
              Kontoentwicklung
              {paBalanceProgress >= 100 && 
                <div className="ml-1 text-[11px] bg-primary/10 text-primary px-1 py-0.5 rounded-full font-medium flex items-center">
                  <TrendingUp className="mr-0.5 h-3 w-3" />
                  Ziel
                </div>
              }
            </h3>
          </div>
          
          <div className="flex items-center space-x-2">
            <p className="text-[11px] text-muted-foreground flex items-center">
              {effectiveTrades.length} Trade{effectiveTrades.length !== 1 ? 's' : ''}
            </p>
            
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center gap-0.5 bg-primary/5 hover:bg-primary/15 transition-colors p-1 px-1.5 rounded-md">
                  <Settings className="h-3 w-3 text-primary" />
                  <span className="text-[11px] text-primary font-medium">Einst.</span>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-4 bg-black/95 border-primary/20 backdrop-blur-md">
                <div className="space-y-3">
                  <h4 className="font-medium text-sm mb-2 text-primary">Kontostand Einstellungen</h4>
                  
                  {/* PA Konto Einstellungen */}
                  <div className="space-y-2 border-b border-primary/10 pb-3">
                    <h5 className="text-xs font-medium text-primary/90 flex items-center">
                      <PiggyBank className="h-3.5 w-3.5 mr-1" />
                      PA Konto
                    </h5>
                    
                    {/* Basis Kontostand */}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Basis-Kontostand:</span>
                      {isEditingPA ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            ref={paBalanceInputRef}
                            defaultValue={basePaBalance}
                            className="h-7 w-24 text-[13px] px-2"
                            type="number"
                            min="0"
                          />
                          <button 
                            className="p-1 hover:bg-primary/20 rounded-md"
                            onClick={handlePABalanceSubmit}
                          >
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </button>
                          <button 
                            className="p-1 hover:bg-destructive/20 rounded-md"
                            onClick={() => setIsEditingPA(false)}
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="font-medium text-[13px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                            ${basePaBalance.toLocaleString()}
                          </span>
                          <button
                            className="p-1 hover:bg-primary/10 rounded-md ml-1"
                            onClick={() => setIsEditingPA(true)}
                          >
                            <Edit className="h-3.5 w-3.5 text-primary/70" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Ziel Kontostand */}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Ziel-Kontostand:</span>
                      {isEditingPAGoal ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            ref={paGoalInputRef}
                            defaultValue={paGoal}
                            className="h-7 w-24 text-[13px] px-2"
                            type="number"
                            min="1"
                          />
                          <button 
                            className="p-1 hover:bg-primary/20 rounded-md"
                            onClick={handlePAGoalSubmit}
                          >
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </button>
                          <button 
                            className="p-1 hover:bg-destructive/20 rounded-md"
                            onClick={() => setIsEditingPAGoal(false)}
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="font-medium text-[13px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                            ${paGoal.toLocaleString()}
                          </span>
                          <button
                            className="p-1 hover:bg-primary/10 rounded-md ml-1"
                            onClick={() => setIsEditingPAGoal(true)}
                          >
                            <Edit className="h-3.5 w-3.5 text-primary/70" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* EVA Konto Einstellungen */}
                  <div className="space-y-2 border-b border-primary/10 pb-3">
                    <h5 className="text-xs font-medium text-primary/90 flex items-center">
                      <PiggyBank className="h-3.5 w-3.5 mr-1" />
                      EVA Konto
                    </h5>
                    
                    {/* Basis Kontostand */}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Basis-Kontostand:</span>
                      {isEditingEVA ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            ref={evaBalanceInputRef}
                            defaultValue={baseEvaBalance}
                            className="h-7 w-24 text-[13px] px-2"
                            type="number"
                            min="0"
                          />
                          <button 
                            className="p-1 hover:bg-primary/20 rounded-md"
                            onClick={handleEVABalanceSubmit}
                          >
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </button>
                          <button 
                            className="p-1 hover:bg-destructive/20 rounded-md"
                            onClick={() => setIsEditingEVA(false)}
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="font-medium text-[13px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                            ${baseEvaBalance.toLocaleString()}
                          </span>
                          <button
                            className="p-1 hover:bg-primary/10 rounded-md ml-1"
                            onClick={() => setIsEditingEVA(true)}
                          >
                            <Edit className="h-3.5 w-3.5 text-primary/70" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Ziel Kontostand */}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Ziel-Kontostand:</span>
                      {isEditingEVAGoal ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            ref={evaGoalInputRef}
                            defaultValue={evaGoal}
                            className="h-7 w-24 text-[13px] px-2"
                            type="number"
                            min="1"
                          />
                          <button 
                            className="p-1 hover:bg-primary/20 rounded-md"
                            onClick={handleEVAGoalSubmit}
                          >
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </button>
                          <button 
                            className="p-1 hover:bg-destructive/20 rounded-md"
                            onClick={() => setIsEditingEVAGoal(false)}
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="font-medium text-[13px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                            ${evaGoal.toLocaleString()}
                          </span>
                          <button
                            className="p-1 hover:bg-primary/10 rounded-md ml-1"
                            onClick={() => setIsEditingEVAGoal(true)}
                          >
                            <Edit className="h-3.5 w-3.5 text-primary/70" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* EK Konto Einstellungen */}
                  <div className="space-y-2 pb-1">
                    <h5 className="text-xs font-medium text-primary/90 flex items-center">
                      <PiggyBank className="h-3.5 w-3.5 mr-1" />
                      EK Konto
                    </h5>
                    
                    {/* Basis Kontostand */}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Basis-Kontostand:</span>
                      {isEditingEK ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            ref={ekBalanceInputRef}
                            defaultValue={baseEkBalance}
                            className="h-7 w-24 text-[13px] px-2"
                            type="number"
                            min="0"
                          />
                          <button 
                            className="p-1 hover:bg-primary/20 rounded-md"
                            onClick={handleEKBalanceSubmit}
                          >
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </button>
                          <button 
                            className="p-1 hover:bg-destructive/20 rounded-md"
                            onClick={() => setIsEditingEK(false)}
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="font-medium text-[13px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                            ${baseEkBalance.toLocaleString()}
                          </span>
                          <button
                            className="p-1 hover:bg-primary/10 rounded-md ml-1"
                            onClick={() => setIsEditingEK(true)}
                          >
                            <Edit className="h-3.5 w-3.5 text-primary/70" />
                          </button>
                        </div>
                      )}
                    </div>
                    
                    {/* Ziel Kontostand */}
                    <div className="flex items-center justify-between">
                      <span className="text-[13px] text-muted-foreground">Ziel-Kontostand:</span>
                      {isEditingEKGoal ? (
                        <div className="flex gap-1 items-center">
                          <Input
                            ref={ekGoalInputRef}
                            defaultValue={ekGoal}
                            className="h-7 w-24 text-[13px] px-2"
                            type="number"
                            min="1"
                          />
                          <button 
                            className="p-1 hover:bg-primary/20 rounded-md"
                            onClick={handleEKGoalSubmit}
                          >
                            <Check className="h-3.5 w-3.5 text-primary" />
                          </button>
                          <button 
                            className="p-1 hover:bg-destructive/20 rounded-md"
                            onClick={() => setIsEditingEKGoal(false)}
                          >
                            <X className="h-3.5 w-3.5 text-destructive" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <span className="font-medium text-[13px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                            ${ekGoal.toLocaleString()}
                          </span>
                          <button
                            className="p-1 hover:bg-primary/10 rounded-md ml-1"
                            onClick={() => setIsEditingEKGoal(true)}
                          >
                            <Edit className="h-3.5 w-3.5 text-primary/70" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
        
        <div className="mt-2">
          <Tabs 
            defaultValue="pa" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <div className="flex flex-col gap-3">
              <div className="w-full flex justify-center">
                <TabsList className="w-auto h-8 bg-black/20 border border-primary/5 p-0.5 flex justify-center gap-2 mx-auto">
                  <TabsTrigger 
                    value="pa" 
                    className="text-[13px] h-7 rounded-md w-20 data-[state=active]:bg-primary/70 data-[state=active]:shadow-none"
                  >
                    <PiggyBank className="h-3.5 w-3.5 mr-1" />
                    PA
                  </TabsTrigger>
                  <TabsTrigger 
                    value="eva" 
                    className="text-[13px] h-7 rounded-md w-20 data-[state=active]:bg-primary/70 data-[state=active]:shadow-none"
                  >
                    <PiggyBank className="h-3.5 w-3.5 mr-1" />
                    EVA
                  </TabsTrigger>
                  <TabsTrigger 
                    value="ek" 
                    className="text-[13px] h-7 rounded-md w-20 data-[state=active]:bg-primary/70 data-[state=active]:shadow-none"
                  >
                    <PiggyBank className="h-3.5 w-3.5 mr-1" />
                    EK
                  </TabsTrigger>
                </TabsList>
              </div>
            
              <div className="flex-grow w-full">
                <TabsContent value="pa" className="m-0 p-0">
                  {isLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-grow">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] text-primary/80">PA Konto: </span>
                            <span className="font-medium text-[15px] text-primary">${paBalance.toLocaleString()}</span>
                          </div>
                          <span className="text-[13px] text-primary/80 font-medium">{paBalanceProgress}%</span>
                        </div>
                        
                        <div className="w-full bg-black/30 rounded-full h-3 border border-primary/10 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-blue-500/70 to-blue-400 h-full rounded-full transition-all duration-1000 ease-out animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                            style={{ width: `${paBalanceProgress}%` }}
                          ></div>
                        </div>

                        <div className="mt-2 px-2 py-1.5 bg-gradient-to-r from-black/30 to-black/10 rounded-md border border-primary/10 flex items-start gap-2">
                          {paRecommendation.icon}
                          <span className={`text-xs text-${paRecommendation.color}-500`}>
                            {paRecommendation.message}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="eva" className="m-0 p-0">
                  {isLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-grow">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] text-primary/80">EVA Konto: </span>
                            <span className="font-medium text-[15px] text-primary">${evaBalance.toLocaleString()}</span>
                          </div>
                          <span className="text-[13px] text-primary/80 font-medium">{evaBalanceProgress}%</span>
                        </div>
                        
                        <div className="w-full bg-black/30 rounded-full h-3 border border-primary/10 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-indigo-500/70 to-indigo-400 h-full rounded-full transition-all duration-1000 ease-out animate-pulse shadow-[0_0_8px_rgba(99,102,241,0.5)]"
                            style={{ width: `${evaBalanceProgress}%` }}
                          ></div>
                        </div>

                        <div className="mt-2 px-2 py-1.5 bg-gradient-to-r from-black/30 to-black/10 rounded-md border border-primary/10 flex items-start gap-2">
                          {evaRecommendation.icon}
                          <span className={`text-xs text-${evaRecommendation.color}-500`}>
                            {evaRecommendation.message}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                
                <TabsContent value="ek" className="m-0 p-0">
                  {isLoading ? (
                    <Skeleton className="h-12 w-full" />
                  ) : (
                    <div className="flex items-center gap-2">
                      <div className="flex-grow">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1">
                            <span className="text-[13px] text-primary/80">EK Konto: </span>
                            <span className="font-medium text-[15px] text-primary">${ekBalance.toLocaleString()}</span>
                          </div>
                          <span className="text-[13px] text-primary/80 font-medium">{ekBalanceProgress}%</span>
                        </div>
                        
                        <div className="w-full bg-black/30 rounded-full h-3 border border-primary/10 overflow-hidden">
                          <div 
                            className="bg-gradient-to-r from-cyan-500/70 to-cyan-400 h-full rounded-full transition-all duration-1000 ease-out animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.5)]"
                            style={{ width: `${ekBalanceProgress}%` }}
                          ></div>
                        </div>
                        
                        <div className="mt-2 px-2 py-1.5 bg-gradient-to-r from-black/30 to-black/10 rounded-md border border-primary/10 flex items-start gap-2">
                          {ekRecommendation.icon}
                          <span className={`text-xs text-${ekRecommendation.color}-500`}>
                            {ekRecommendation.message}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
              </div>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
}