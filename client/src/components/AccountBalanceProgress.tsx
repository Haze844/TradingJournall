import React, { useState, useRef } from "react";
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
}

export default function AccountBalanceProgress({ className }: AccountBalanceProgressProps) {
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

  // Benutzereinstellungen abrufen
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings', user?.id],
    queryFn: async () => {
      try {
        if (!user) {
          return { 
            accountBalance: 2500, 
            evaAccountBalance: 1500,
            goalBalance: 7500,
            evaGoalBalance: 7500,
          };
        }
        
        const response = await fetch(`/api/settings?userId=${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch account settings');
        }
        return response.json();
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
  const paBalance = settings?.accountBalance || 2500;
  const paGoal = settings?.goalBalance || 7500;
  const paBalanceProgress = Math.min(Math.round((paBalance / paGoal) * 100), 100);
  
  const evaBalance = settings?.evaAccountBalance || 1500;
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
    <Card className={`overflow-hidden shadow-lg border-primary/20 ${className}`}>
      <CardHeader className="pb-2 pt-3">
        <CardTitle className="text-sm flex items-center gap-2">
          <TrendingUp className="h-4 w-4 text-primary" />
          Kontoentwicklung
        </CardTitle>
      </CardHeader>
      <CardContent className="pb-3">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-3">
          <TabsList className="grid grid-cols-2 h-8">
            <TabsTrigger value="pa" className="flex items-center gap-1.5 text-xs py-1">
              <Wallet className="h-3 w-3" />
              <span>PA Konto</span>
            </TabsTrigger>
            <TabsTrigger value="eva" className="flex items-center gap-1.5 text-xs py-1">
              <PiggyBank className="h-3 w-3" />
              <span>EVA Konto</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pa" className="space-y-3 mt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Aktueller Stand:</span>
                  
                  {isEditingPA ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        ref={paBalanceInputRef}
                        defaultValue={paBalance}
                        className="h-7 w-20 text-xs"
                        type="number"
                        min="0"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={handlePABalanceSubmit}
                      >
                        <Check className="h-3 w-3 text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setIsEditingPA(false)}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm">${paBalance.toLocaleString()}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setIsEditingPA(true)}
                      >
                        <Edit className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Progress value={paBalanceProgress} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    
                    {isEditingPAGoal ? (
                      <div className="flex gap-1 items-center">
                        <span>$</span>
                        <Input
                          ref={paGoalInputRef}
                          defaultValue={paGoal}
                          className="h-6 w-16 text-xs"
                          type="number"
                          min="1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={handlePAGoalSubmit}
                        >
                          <Check className="h-3 w-3 text-primary" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => setIsEditingPAGoal(false)}
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>Ziel: ${paGoal.toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => setIsEditingPAGoal(true)}
                        >
                          <Edit className="h-2.5 w-2.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="rounded-lg bg-blue-500/5 border border-blue-500/20 p-2 text-xs">
                  <div className="font-medium mb-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-blue-500" />
                    <span>{paBalanceProgress}% zum Ziel</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {paBalanceProgress < 100 
                      ? `Noch $${(paGoal - paBalance).toLocaleString()} bis zum Ziel!`
                      : "Glückwunsch! Du hast dein Ziel erreicht! 🎉"}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="eva" className="space-y-3 mt-2">
            {isLoading ? (
              <Skeleton className="h-8 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Aktueller Stand:</span>
                  
                  {isEditingEVA ? (
                    <div className="flex gap-1 items-center">
                      <Input
                        ref={evaBalanceInputRef}
                        defaultValue={evaBalance}
                        className="h-7 w-20 text-xs"
                        type="number"
                        min="0"
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={handleEVABalanceSubmit}
                      >
                        <Check className="h-3 w-3 text-primary" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-6 w-6"
                        onClick={() => setIsEditingEVA(false)}
                      >
                        <X className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1">
                      <span className="font-bold text-sm">${evaBalance.toLocaleString()}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                        onClick={() => setIsEditingEVA(true)}
                      >
                        <Edit className="h-3 w-3 text-muted-foreground" />
                      </Button>
                    </div>
                  )}
                </div>
                
                <div className="space-y-1.5">
                  <Progress value={evaBalanceProgress} className="h-1.5" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    
                    {isEditingEVAGoal ? (
                      <div className="flex gap-1 items-center">
                        <span>$</span>
                        <Input
                          ref={evaGoalInputRef}
                          defaultValue={evaGoal}
                          className="h-6 w-16 text-xs"
                          type="number"
                          min="1"
                        />
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={handleEVAGoalSubmit}
                        >
                          <Check className="h-3 w-3 text-primary" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-5 w-5"
                          onClick={() => setIsEditingEVAGoal(false)}
                        >
                          <X className="h-3 w-3 text-destructive" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1">
                        <span>Ziel: ${evaGoal.toLocaleString()}</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-4 w-4"
                          onClick={() => setIsEditingEVAGoal(true)}
                        >
                          <Edit className="h-2.5 w-2.5 text-muted-foreground" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="rounded-lg bg-purple-500/5 border border-purple-500/20 p-2 text-xs">
                  <div className="font-medium mb-0.5 flex items-center gap-1">
                    <TrendingUp className="h-3 w-3 text-purple-500" />
                    <span>{evaBalanceProgress}% zum Ziel</span>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    {evaBalanceProgress < 100 
                      ? `Noch $${(evaGoal - evaBalance).toLocaleString()} bis zum Ziel!`
                      : "Glückwunsch! Du hast dein Ziel erreicht! 🎉"}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}