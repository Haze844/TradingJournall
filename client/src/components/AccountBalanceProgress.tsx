import React, { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Wallet, PiggyBank, TrendingUp, Edit, Check, X } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

interface AccountBalanceProgressProps {
  className?: string;
  filteredTrades?: any[];
}

export default function AccountBalanceProgress({ className, filteredTrades = [] }: AccountBalanceProgressProps) {
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

  // Benutzereinstellungen abrufen mit mehr Debugging-Ausgaben
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
  
  // Berechne Kontostände basierend auf gefilterten Trades
  useEffect(() => {
    if (settings && Array.isArray(filteredTrades)) {
      // Debug-Output
      console.log("Berechne Kontostände aus", filteredTrades.length, "gefilterten Trades");
      console.log("Basis PA:", settings.accountBalance, "EVA:", settings.evaAccountBalance);
      
      // PA Konto Berechnung
      const paProfit = filteredTrades
        .filter(trade => trade.accountType === "PA")
        .reduce((sum, trade) => {
          // Berechne den Gewinn/Verlust
          let profit = 0;
          
          // Verwende profitLoss wenn vorhanden, sonst berechne aus riskPoints und rrAchieved
          if (trade.profitLoss !== null && trade.profitLoss !== undefined) {
            profit = Number(trade.profitLoss);
          } else if (trade.riskSum !== null && trade.riskSum !== undefined && 
                     trade.rrAchieved !== null && trade.rrAchieved !== undefined) {
            profit = Number(trade.riskSum) * Number(trade.rrAchieved);
          }
          
          console.log("PA Trade:", trade.id, "P/L:", profit);
          return sum + profit;
        }, 0);
      
      // EVA Konto Berechnung
      const evaProfit = filteredTrades
        .filter(trade => trade.accountType === "EVA")
        .reduce((sum, trade) => {
          // Berechne den Gewinn/Verlust
          let profit = 0;
          
          // Verwende profitLoss wenn vorhanden, sonst berechne aus riskPoints und rrAchieved
          if (trade.profitLoss !== null && trade.profitLoss !== undefined) {
            profit = Number(trade.profitLoss);
          } else if (trade.riskSum !== null && trade.riskSum !== undefined && 
                     trade.rrAchieved !== null && trade.rrAchieved !== undefined) {
            profit = Number(trade.riskSum) * Number(trade.rrAchieved);
          }
          
          console.log("EVA Trade:", trade.id, "P/L:", profit);
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

  // Berechne Werte
  const basePaBalance = settings?.accountBalance || 2500;
  const paBalance = calculatedPaBalance !== null ? calculatedPaBalance : basePaBalance;
  const paGoal = settings?.goalBalance || 7500;
  const paBalanceProgress = Math.min(Math.round((paBalance / paGoal) * 100), 100);
  
  const baseEvaBalance = settings?.evaAccountBalance || 1500;
  const evaBalance = calculatedEvaBalance !== null ? calculatedEvaBalance : baseEvaBalance;
  const evaGoal = settings?.evaGoalBalance || 7500;
  const evaBalanceProgress = Math.min(Math.round((evaBalance / evaGoal) * 100), 100);

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

  return (
    <div className={`bg-gradient-to-r from-black/40 to-black/20 rounded-lg border border-primary/10 overflow-hidden backdrop-blur-sm shadow-md ${className}`}>
      <div className="p-1.5 px-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[11px] flex items-center gap-1 text-muted-foreground">
            <TrendingUp className="h-3 w-3 text-primary/70" />
            <span>Kontoentwicklung</span>
          </span>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="ml-auto">
            <TabsList className="grid grid-cols-2 h-6 bg-black/40 p-0.5">
              <TabsTrigger value="pa" className="flex items-center justify-center gap-1 text-[10px] px-1 py-0.5 h-5">
                <Wallet className="h-2.5 w-2.5" />
                <span>PA</span>
              </TabsTrigger>
              <TabsTrigger value="eva" className="flex items-center justify-center gap-1 text-[10px] px-1 py-0.5 h-5">
                <PiggyBank className="h-2.5 w-2.5" />
                <span>EVA</span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
        
        <div className="mt-1.5">
          <TabsContent value="pa" className="mt-0 space-y-1">
            {isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <div className="space-y-1">
                {/* Balance info & edit */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Aktuell:</span>
                    
                    {isEditingPA ? (
                      <div className="flex gap-0.5 items-center">
                        <Input
                          ref={paBalanceInputRef}
                          defaultValue={paBalance}
                          className="h-5 w-14 text-[10px] px-1"
                          type="number"
                          min="0"
                        />
                        <button 
                          className="p-0.5 hover:bg-primary/20 rounded-sm"
                          onClick={handlePABalanceSubmit}
                        >
                          <Check className="h-2 w-2 text-primary" />
                        </button>
                        <button 
                          className="p-0.5 hover:bg-destructive/20 rounded-sm"
                          onClick={() => setIsEditingPA(false)}
                        >
                          <X className="h-2 w-2 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium text-[11px]">${paBalance.toLocaleString()}</span>
                        <button
                          className="p-0.5 hover:bg-primary/10 rounded-sm ml-0.5"
                          onClick={() => setIsEditingPA(true)}
                        >
                          <Edit className="h-2 w-2 text-muted-foreground/70" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Ziel:</span>
                    
                    {isEditingPAGoal ? (
                      <div className="flex gap-0.5 items-center">
                        <Input
                          ref={paGoalInputRef}
                          defaultValue={paGoal}
                          className="h-5 w-14 text-[10px] px-1"
                          type="number"
                          min="1"
                        />
                        <button 
                          className="p-0.5 hover:bg-primary/20 rounded-sm"
                          onClick={handlePAGoalSubmit}
                        >
                          <Check className="h-2 w-2 text-primary" />
                        </button>
                        <button 
                          className="p-0.5 hover:bg-destructive/20 rounded-sm"
                          onClick={() => setIsEditingPAGoal(false)}
                        >
                          <X className="h-2 w-2 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium text-[11px]">${paGoal.toLocaleString()}</span>
                        <button
                          className="p-0.5 hover:bg-primary/10 rounded-sm ml-0.5"
                          onClick={() => setIsEditingPAGoal(true)}
                        >
                          <Edit className="h-2 w-2 text-muted-foreground/70" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress bar with percentage */}
                <div className="relative mt-0.5">
                  <Progress value={paBalanceProgress} className="h-1 bg-black/40" />
                  <span className="absolute right-0 top-1.5 text-[9px] text-muted-foreground">{paBalanceProgress}%</span>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="eva" className="mt-0 space-y-1">
            {isLoading ? (
              <Skeleton className="h-6 w-full" />
            ) : (
              <div className="space-y-1">
                {/* Balance info & edit */}
                <div className="flex items-center justify-between gap-1">
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Aktuell:</span>
                    
                    {isEditingEVA ? (
                      <div className="flex gap-0.5 items-center">
                        <Input
                          ref={evaBalanceInputRef}
                          defaultValue={evaBalance}
                          className="h-5 w-14 text-[10px] px-1"
                          type="number"
                          min="0"
                        />
                        <button 
                          className="p-0.5 hover:bg-primary/20 rounded-sm"
                          onClick={handleEVABalanceSubmit}
                        >
                          <Check className="h-2 w-2 text-primary" />
                        </button>
                        <button 
                          className="p-0.5 hover:bg-destructive/20 rounded-sm"
                          onClick={() => setIsEditingEVA(false)}
                        >
                          <X className="h-2 w-2 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium text-[11px]">${evaBalance.toLocaleString()}</span>
                        <button
                          className="p-0.5 hover:bg-primary/10 rounded-sm ml-0.5"
                          onClick={() => setIsEditingEVA(true)}
                        >
                          <Edit className="h-2 w-2 text-muted-foreground/70" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">Ziel:</span>
                    
                    {isEditingEVAGoal ? (
                      <div className="flex gap-0.5 items-center">
                        <Input
                          ref={evaGoalInputRef}
                          defaultValue={evaGoal}
                          className="h-5 w-14 text-[10px] px-1"
                          type="number"
                          min="1"
                        />
                        <button 
                          className="p-0.5 hover:bg-primary/20 rounded-sm"
                          onClick={handleEVAGoalSubmit}
                        >
                          <Check className="h-2 w-2 text-primary" />
                        </button>
                        <button 
                          className="p-0.5 hover:bg-destructive/20 rounded-sm"
                          onClick={() => setIsEditingEVAGoal(false)}
                        >
                          <X className="h-2 w-2 text-destructive" />
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <span className="font-medium text-[11px]">${evaGoal.toLocaleString()}</span>
                        <button
                          className="p-0.5 hover:bg-primary/10 rounded-sm ml-0.5"
                          onClick={() => setIsEditingEVAGoal(true)}
                        >
                          <Edit className="h-2 w-2 text-muted-foreground/70" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Progress bar with percentage */}
                <div className="relative mt-0.5">
                  <Progress value={evaBalanceProgress} className="h-1 bg-black/40" />
                  <span className="absolute right-0 top-1.5 text-[9px] text-muted-foreground">{evaBalanceProgress}%</span>
                </div>
              </div>
            )}
          </TabsContent>
        </div>
      </div>
    </div>
  );
}