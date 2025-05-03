import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Wallet, PiggyBank, TrendingUp } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/hooks/use-auth";

interface AccountBalanceProgressProps {
  className?: string;
}

export default function AccountBalanceProgress({ className }: AccountBalanceProgressProps) {
  const [activeTab, setActiveTab] = useState<string>("pa");
  const goalBalance = 7500; // $7500 Zielwert
  const { user } = useAuth();

  // Benutzereinstellungen abrufen
  const { data: settings, isLoading } = useQuery({
    queryKey: ['/api/settings', user?.id],
    queryFn: async () => {
      try {
        if (!user) {
          return { accountBalance: 2500, evaAccountBalance: 1500 };
        }
        
        const response = await fetch(`/api/settings?userId=${user.id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch account settings');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching account settings:', error);
        return { accountBalance: 2500, evaAccountBalance: 1500 };
      }
    },
    enabled: !!user,
  });

  // Berechne für die PA-Fortschrittsanzeige
  const paBalance = settings?.accountBalance || 2500;
  const paBalanceProgress = Math.min(Math.round((paBalance / goalBalance) * 100), 100);
  
  // Berechne für die EVA-Fortschrittsanzeige
  const evaBalance = settings?.evaAccountBalance || 1500;
  const evaBalanceProgress = Math.min(Math.round((evaBalance / goalBalance) * 100), 100);

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          Kontoentwicklung
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
          <TabsList className="grid grid-cols-2">
            <TabsTrigger value="pa" className="flex items-center gap-2">
              <Wallet className="h-4 w-4" />
              <span>PA Konto</span>
            </TabsTrigger>
            <TabsTrigger value="eva" className="flex items-center gap-2">
              <PiggyBank className="h-4 w-4" />
              <span>EVA Konto</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pa" className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Aktueller Stand:</span>
                  <span className="font-bold">${paBalance.toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <Progress value={paBalanceProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>Ziel: $7,500</span>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-500/10 border border-blue-500/20 p-3 text-sm">
                  <div className="font-medium mb-1 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    <span>
                      {paBalanceProgress}% zum Ziel
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {paBalanceProgress < 100 
                      ? `Noch $${(goalBalance - paBalance).toLocaleString()} bis zum Ziel von $7,500!`
                      : "Glückwunsch! Du hast dein Ziel erreicht! 🎉"}
                  </p>
                </div>
              </div>
            )}
          </TabsContent>

          <TabsContent value="eva" className="space-y-4">
            {isLoading ? (
              <Skeleton className="h-10 w-full" />
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="font-medium text-muted-foreground">Aktueller Stand:</span>
                  <span className="font-bold">${evaBalance.toLocaleString()}</span>
                </div>
                <div className="space-y-2">
                  <Progress value={evaBalanceProgress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>$0</span>
                    <span>Ziel: $7,500</span>
                  </div>
                </div>
                <div className="rounded-lg bg-purple-500/10 border border-purple-500/20 p-3 text-sm">
                  <div className="font-medium mb-1 flex items-center gap-1.5">
                    <TrendingUp className="h-4 w-4 text-purple-500" />
                    <span>
                      {evaBalanceProgress}% zum Ziel
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {evaBalanceProgress < 100 
                      ? `Noch $${(goalBalance - evaBalance).toLocaleString()} bis zum Ziel von $7,500!`
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