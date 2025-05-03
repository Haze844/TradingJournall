import React, { useState, useRef, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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

export default function AccountBalanceProgressNew({ 
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
        const response = await apiRequest("GET", "/api/settings");
        if (response.ok) {
          const data = await response.json();
          return data;
        } else {
          return { 
            accountBalance: 2500, 
            goalBalance: 5000,
            evaAccountBalance: 1500,
            evaGoalBalance: 5000
          };
        }
      } catch (err) {
        return { 
          accountBalance: 2500, 
          goalBalance: 7500,
          evaAccountBalance: 1500,
          evaGoalBalance: 7500,
        };
      }
    },
    enabled: true,
  });

  // Berechne Kontostände basierend auf gefilterten Trades
  useEffect(() => {
    if (settings && Array.isArray(filteredTrades)) {
      // PA Konto Berechnung
      const paProfit = filteredTrades
        .filter(trade => trade.accountType === "PA")
        .reduce((sum, trade) => {
          return sum + (Number(trade.profitLoss) || 0);
        }, 0);
      
      // EVA Konto Berechnung
      const evaProfit = filteredTrades
        .filter(trade => trade.accountType === "EVA")
        .reduce((sum, trade) => {
          return sum + (Number(trade.profitLoss) || 0);
        }, 0);
      
      // Aktualisiere die berechneten Kontostände
      setCalculatedPaBalance(Number(settings.accountBalance) + paProfit);
      setCalculatedEvaBalance(Number(settings.evaAccountBalance) + evaProfit);
    } else {
      // Wenn keine gefilterten Trades, setze auf null zurück
      setCalculatedPaBalance(null);
      setCalculatedEvaBalance(null);
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
    mutationFn: async (data: { accountType: 'PA' | 'EVA', goalBalance: number }) => {
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

  // Extrahiere Basiswerte aus den Settings
  const basePaBalance = settings ? settings.accountBalance : 0;
  const baseEvaBalance = settings ? settings.evaAccountBalance : 0;
  const paGoal = settings ? settings.goalBalance : 0;
  const evaGoal = settings ? settings.evaGoalBalance : 0;

  // Verwende entweder die berechneten Werte oder die Basiswerte
  const paBalance = calculatedPaBalance !== null ? calculatedPaBalance : basePaBalance;
  const evaBalance = calculatedEvaBalance !== null ? calculatedEvaBalance : baseEvaBalance;

  // Berechne Fortschritt in Prozent
  const paBalanceProgress = paGoal > 0 ? Math.min(100, Math.round((paBalance / paGoal) * 100)) : 0;
  const evaBalanceProgress = evaGoal > 0 ? Math.min(100, Math.round((evaBalance / evaGoal) * 100)) : 0;

  return (
    <div className={`space-y-3 border border-primary/20 px-3 py-2 rounded-lg bg-black/30 shadow-lg backdrop-blur-md ${className}`}>
      <div className="flex flex-col">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-bold flex items-center">
            <Wallet className="mr-1 h-4 w-4 text-primary" />
            Kontoentwicklung
            {paBalanceProgress >= 100 && 
              <div className="ml-2 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full font-medium flex items-center">
                <TrendingUp className="mr-1 h-3 w-3" />
                Ziel erreicht
              </div>
            }
          </h3>
          <p className="text-xs text-muted-foreground">
            {filteredTrades.length} Trade{filteredTrades.length !== 1 ? 's' : ''}
          </p>
        </div>
        
        <div className="mt-2">
          <Tabs 
            defaultValue="pa" 
            value={activeTab} 
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="w-full bg-black/20 border border-primary/10">
              <TabsTrigger value="pa" className="flex-1 data-[state=active]:bg-primary/70">
                <PiggyBank className="h-3.5 w-3.5 mr-1" />
                PA Konto
              </TabsTrigger>
              <TabsTrigger value="eva" className="flex-1 data-[state=active]:bg-primary/70">
                <PiggyBank className="h-3.5 w-3.5 mr-1" />
                EVA Konto
              </TabsTrigger>
            </TabsList>
            
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
                  <div className="w-full bg-black/50 rounded-full h-5 border border-primary/20">
                    <div 
                      className="bg-gradient-to-r from-primary/70 to-primary h-full rounded-full transition-all duration-500 ease-in-out flex items-center justify-end pr-2"
                      style={{ width: `${paBalanceProgress}%` }}
                    >
                      {paBalanceProgress > 15 && (
                        <span className="text-[12px] text-white font-medium">
                          {paBalanceProgress}%
                        </span>
                      )}
                    </div>
                  </div>
                  {paBalanceProgress <= 15 && (
                    <span className="absolute right-1 top-1 text-[12px] text-white font-medium">
                      {paBalanceProgress}%
                    </span>
                  )}
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
                  <div className="w-full bg-black/50 rounded-full h-5 border border-primary/20">
                    <div 
                      className="bg-gradient-to-r from-primary/70 to-primary h-full rounded-full transition-all duration-500 ease-in-out flex items-center justify-end pr-2"
                      style={{ width: `${evaBalanceProgress}%` }}
                    >
                      {evaBalanceProgress > 15 && (
                        <span className="text-[12px] text-white font-medium">
                          {evaBalanceProgress}%
                        </span>
                      )}
                    </div>
                  </div>
                  {evaBalanceProgress <= 15 && (
                    <span className="absolute right-1 top-1 text-[12px] text-white font-medium">
                      {evaBalanceProgress}%
                    </span>
                  )}
                </div>
              </div>
            )}
          </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}