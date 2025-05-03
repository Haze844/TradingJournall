import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useQuery } from '@tanstack/react-query';
import { Sparkles, Wallet, ArrowRight } from 'lucide-react';

interface AccountBalanceProgressProps {
  className?: string;
}

export default function AccountBalanceProgress({ className }: AccountBalanceProgressProps) {
  const [activeAccount, setActiveAccount] = useState<'EVA' | 'PA'>('PA');
  const targetAmount = 7500; // Ziel: 7500$

  // Abfrage der Benutzereinstellungen für den aktuellen Benutzer
  const { data: settingsData, isLoading } = useQuery({
    queryKey: ['/api/settings'],
    queryFn: async () => {
      const response = await fetch('/api/settings');
      if (!response.ok) {
        throw new Error('Fehler beim Laden der Kontoeinstellungen');
      }
      return response.json();
    }
  });

  // Kontostand abrufen basierend auf dem aktiven Konto
  const accountBalance = settingsData?.[activeAccount === 'PA' ? 'accountBalance' : 'evaAccountBalance'] || 0;
  
  // Fortschritt berechnen (zwischen 0 und 100)
  const progress = Math.min(Math.round((accountBalance / targetAmount) * 100), 100);
  
  // Verbleibender Betrag bis zum Ziel
  const remaining = Math.max(targetAmount - accountBalance, 0);

  // Konto wechseln
  const toggleAccount = () => {
    setActiveAccount(activeAccount === 'PA' ? 'EVA' : 'PA');
  };

  return (
    <Card className={`bg-black/40 backdrop-blur-sm border-primary/10 shadow-xl overflow-hidden ${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            <span className="text-xs font-medium">{activeAccount} Kontostand: <span className="text-primary">${accountBalance.toLocaleString()}</span></span>
          </div>
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 px-2 text-xs hover:bg-primary/20 hover:text-primary"
            onClick={toggleAccount}
          >
            Zu {activeAccount === 'PA' ? 'EVA' : 'PA'}
            <ArrowRight className="ml-1 h-3 w-3" />
          </Button>
        </div>
        
        <div className="relative pt-1">
          <div className="flex mb-1 items-center justify-between">
            <div>
              <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-primary bg-primary/10">
                Fortschritt: {progress}%
              </span>
            </div>
            <div className="text-right">
              <span className="text-xs font-semibold inline-block text-muted-foreground">
                Ziel: ${targetAmount.toLocaleString()}
              </span>
            </div>
          </div>
          
          <div className="relative">
            <Progress value={progress} className="h-2" />
            {progress >= 100 && (
              <div className="absolute inset-0 bg-gradient-to-r from-primary/0 via-primary/30 to-primary/0 animate-pulse pointer-events-none" />
            )}
          </div>
          
          <div className="flex mt-1 text-xs justify-between text-muted-foreground">
            <span>Noch ${remaining.toLocaleString()} bis zum Ziel</span>
            {progress >= 100 && (
              <span className="text-primary flex items-center">
                <Sparkles className="h-3 w-3 mr-1" /> Ziel erreicht!
              </span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}