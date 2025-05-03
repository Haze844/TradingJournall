import React, { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Wallet, PiggyBank, TrendingUp, Edit, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AccountBalanceProgressProps {
  className?: string;
  filteredTrades?: any[];
}

export default function AccountBalanceProgress({ 
  className, 
  filteredTrades = [] 
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
  
  // Refs für Input-Felder
  const paBalanceInputRef = useRef<HTMLInputElement>(null);
  const paGoalInputRef = useRef<HTMLInputElement>(null);
  const evaBalanceInputRef = useRef<HTMLInputElement>(null);
  const evaGoalInputRef = useRef<HTMLInputElement>(null);
  
  // State für berechnete Kontostände aus gefilterten Trades
  const [calculatedPaBalance, setCalculatedPaBalance] = useState<number | null>(null);
  const [calculatedEvaBalance, setCalculatedEvaBalance] = useState<number | null>(null);

  // Benutzereinstellungen abrufen
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings', user?.id],
    queryFn: async () => {
      try {
        if (!user) {
          console.log("Kein angemeldeter Benutzer, verwende Standardwerte");
          return { 
            accountBalance: 2500, 
            evaAccountBalance: 1500,
            goalBalance: 7500,
            evaGoalBalance: 7500,
          };
        }
        
        console.log(`Einstellungen abfragen für User-ID: ${user.id}`);
        const response = await fetch(`/api/settings?userId=${user.id}`);
        
        if (!response.ok) {
          throw new Error(`Failed to fetch account settings, status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log("Erhaltene Einstellungen:", data);
        
        // Sicherstellen, dass alle erforderlichen Werte vorhanden sind
        return {
          accountBalance: data.accountBalance || 2500,
          evaAccountBalance: data.evaAccountBalance || 1500,
          goalBalance: data.goalBalance || 7500,
          evaGoalBalance: data.evaGoalBalance || 7500,
          ...data
        };
      } catch (error) {
        console.error('Error fetching account settings:', error);
        return { 
          accountBalance: 2500, 
          evaAccountBalance: 1500,
          goalBalance: 7500,
          evaGoalBalance: 7500,
        };
      }
    },
    enabled: !!user,
  });
  
  // Detaillierte Debug-Funktion
  const logTradeDetails = (trade: any) => {
    console.log(`
      Trade ID: ${trade.id} 
      Symbol: ${trade.symbol}
      Konto: ${trade.accountType} 
      Profit/Loss: ${trade.profitLoss} 
      Risk: ${trade.riskSum} 
      RR: ${trade.rrAchieved}
    `);
  };

  // Berechne Kontostände basierend auf gefilterten Trades
  useEffect(() => {
    if (settings && Array.isArray(filteredTrades)) {
      // Debug-Output
      console.log("Berechne Kontostände aus", filteredTrades.length, "gefilterten Trades");
      console.log("Basis PA:", settings.accountBalance, "EVA:", settings.evaAccountBalance);
      
      // Detaillierter Log für Debugging
      console.log("DETAILLIERTE TRADE ANALYSE:");
      filteredTrades.forEach(trade => logTradeDetails(trade));
      
      // PA Konto Berechnung - nur mit profitLoss
      const paProfit = filteredTrades
        .filter(trade => trade.accountType === "PA")
        .reduce((sum, trade) => {
          // Direkt profitLoss verwenden
          const profit = trade.profitLoss !== null && trade.profitLoss !== undefined 
            ? Number(trade.profitLoss) 
            : 0;
            
          console.log(`PA Trade ${trade.id}: profitLoss = ${profit}`);
          return sum + profit;
        }, 0);
      
      // EVA Konto Berechnung - nur mit profitLoss
      const evaProfit = filteredTrades
        .filter(trade => trade.accountType === "EVA")
        .reduce((sum, trade) => {
          // Direkt profitLoss verwenden
          const profit = trade.profitLoss !== null && trade.profitLoss !== undefined 
            ? Number(trade.profitLoss) 
            : 0;
          
          console.log(`EVA Trade ${trade.id}: profitLoss = ${profit}`);
          return sum + profit;
        }, 0);
        
      console.log("Berechneter PA Profit:", paProfit, "EVA Profit:", evaProfit);
        
      // Aktualisiere die berechneten Balancen
      setCalculatedPaBalance(Number(settings.accountBalance) + paProfit);
      setCalculatedEvaBalance(Number(settings.evaAccountBalance) + evaProfit);
      
      console.log("Neue Kontostände - PA:", Number(settings.accountBalance) + paProfit, 
                 "EVA:", Number(settings.evaAccountBalance) + evaProfit);
    } else {
      // Wenn keine gefilterten Trades, setze auf null zurück
      setCalculatedPaBalance(null);
      setCalculatedEvaBalance(null);
      console.log("Keine Trades gefiltert oder Settings nicht geladen");
    }
  }, [filteredTrades, settings]);

  // Mutation zum Aktualisieren des Kontostands
  const updateBalanceMutation = useMutation({
    mutationFn: async (data: { accountType: 'PA' | 'EVA', balance: number }) => {
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
        description: "Dein Kontostand wurde erfolgreich aktualisiert",
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
    mutationFn: async (data: { accountType: 'PA' | 'EVA', goalBalance: number }) => {
      if (!user) throw new Error('Benutzer nicht eingeloggt');
      
      // Verwende den /api/goal-balance Endpunkt
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

  // Berechne Werte
  const basePaBalance = settings?.accountBalance || 2500;
  const paBalance = calculatedPaBalance !== null ? calculatedPaBalance : basePaBalance;
  const paGoal = settings?.goalBalance || 7500;
  const paBalanceProgress = Math.min(Math.round((paBalance / paGoal) * 100), 100);
  
  const baseEvaBalance = settings?.evaAccountBalance || 1500;
  const evaBalance = calculatedEvaBalance !== null ? calculatedEvaBalance : baseEvaBalance;
  const evaGoal = settings?.evaGoalBalance || 7500;
  const evaBalanceProgress = Math.min(Math.round((evaBalance / evaGoal) * 100), 100);

  return (
    <div className={`bg-gradient-to-r from-black/50 to-black/30 rounded-lg border border-primary/20 overflow-hidden backdrop-blur-md shadow-lg ${className}`}>
      <div className="p-2">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[12px] flex items-center gap-1 text-primary/80 font-medium">
            <TrendingUp className="h-3.5 w-3.5 text-primary/80" />
            <span>Kontoentwicklung</span>
          </span>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="ml-auto">
            <TabsList className="grid grid-cols-2 h-7 bg-black/50 p-0.5 border border-primary/10">
              <TabsTrigger value="pa" className="flex items-center justify-center gap-1 text-[11px] h-6">
                <Wallet className="h-3 w-3" />
                <span>PA</span>
              </TabsTrigger>
              <TabsTrigger value="eva" className="flex items-center justify-center gap-1 text-[11px] h-6">
                <PiggyBank className="h-3 w-3" />
                <span>EVA</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="mt-2">
          <TabsContent value="pa" className="mt-0 space-y-2">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-2">
                {/* PA Kontostand Einstellungen */}
                <div className="flex flex-col space-y-2">
                  {/* Basis-Kontostand */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-primary/90 font-medium">Basis-Kontostand:</span>
                    
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
                          <Check className="h-4 w-4 text-primary" />
                        </button>
                        <button 
                          className="p-1 hover:bg-destructive/20 rounded-md"
                          onClick={() => setIsEditingPA(false)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium text-[14px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                          ${basePaBalance.toLocaleString()}
                        </span>
                        <button
                          className="p-1 hover:bg-primary/10 rounded-md ml-1"
                          onClick={() => setIsEditingPA(true)}
                        >
                          <Edit className="h-4 w-4 text-primary/70" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Ziel-Kontostand */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-primary/90 font-medium">Ziel-Kontostand:</span>
                    
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
                          <Check className="h-4 w-4 text-primary" />
                        </button>
                        <button 
                          className="p-1 hover:bg-destructive/20 rounded-md"
                          onClick={() => setIsEditingPAGoal(false)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium text-[14px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                          ${paGoal.toLocaleString()}
                        </span>
                        <button
                          className="p-1 hover:bg-primary/10 rounded-md ml-1"
                          onClick={() => setIsEditingPAGoal(true)}
                        >
                          <Edit className="h-4 w-4 text-primary/70" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Aktueller berechneter Wert */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-primary/90 font-medium">Aktueller Wert:</span>
                    <span className="font-medium text-[15px] text-primary">${paBalance.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Fortschrittsbalken */}
                <div className="mt-2 mb-1 relative">
                  <div className="w-full bg-black/50 rounded-full h-3 border border-primary/10">
                    <div 
                      className="bg-gradient-to-r from-primary/70 to-primary h-full rounded-full transition-all duration-500 ease-in-out"
                      style={{ width: `${paBalanceProgress}%` }}
                    ></div>
                  </div>
                  <span className="absolute right-1 top-0 text-[12px] text-white font-medium">
                    {paBalanceProgress}%
                  </span>
                </div>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="eva" className="mt-0 space-y-2">
            {isLoading ? (
              <Skeleton className="h-24 w-full" />
            ) : (
              <div className="space-y-2">
                {/* EVA Kontostand Einstellungen */}
                <div className="flex flex-col space-y-2">
                  {/* Basis-Kontostand */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-primary/90 font-medium">Basis-Kontostand:</span>
                    
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
                          <Check className="h-4 w-4 text-primary" />
                        </button>
                        <button 
                          className="p-1 hover:bg-destructive/20 rounded-md"
                          onClick={() => setIsEditingEVA(false)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium text-[14px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                          ${baseEvaBalance.toLocaleString()}
                        </span>
                        <button
                          className="p-1 hover:bg-primary/10 rounded-md ml-1"
                          onClick={() => setIsEditingEVA(true)}
                        >
                          <Edit className="h-4 w-4 text-primary/70" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Ziel-Kontostand */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-primary/90 font-medium">Ziel-Kontostand:</span>
                    
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
                          <Check className="h-4 w-4 text-primary" />
                        </button>
                        <button 
                          className="p-1 hover:bg-destructive/20 rounded-md"
                          onClick={() => setIsEditingEVAGoal(false)}
                        >
                          <X className="h-4 w-4 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium text-[14px] bg-black/30 py-0.5 px-2 rounded border border-primary/10">
                          ${evaGoal.toLocaleString()}
                        </span>
                        <button
                          className="p-1 hover:bg-primary/10 rounded-md ml-1"
                          onClick={() => setIsEditingEVAGoal(true)}
                        >
                          <Edit className="h-4 w-4 text-primary/70" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {/* Aktueller berechneter Wert */}
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] text-primary/90 font-medium">Aktueller Wert:</span>
                    <span className="font-medium text-[15px] text-primary">${evaBalance.toLocaleString()}</span>
                  </div>
                </div>
                
                {/* Fortschrittsbalken */}
                <div className="mt-2 mb-1 relative">
                  <div className="w-full bg-black/50 rounded-full h-3 border border-primary/10">
                    <div 
                      className="bg-gradient-to-r from-primary/70 to-primary h-full rounded-full transition-all duration-500 ease-in-out"
                      style={{ width: `${evaBalanceProgress}%` }}
                    ></div>
                  </div>
                  <span className="absolute right-1 top-0 text-[12px] text-white font-medium">
                    {evaBalanceProgress}%
                  </span>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </div>
    </div>
  );
}