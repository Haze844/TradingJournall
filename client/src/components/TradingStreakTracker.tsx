import { useMutation, useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Flame, Trophy, Award, Star, Zap, ArrowUp, Target } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type TradingStreak = {
  id: number;
  userId: number;
  currentStreak: number;
  longestStreak: number;
  totalWins: number;
  totalLosses: number;
  experiencePoints: number;
  lastTradeDate: string | null;
  streakLevel: number; // Angepasst an den Backend-Feld-Namen
  badges: string[];
  level?: number; // Für Abwärtskompatibilität
};

export default function TradingStreakTracker({ userId }: { userId: number }) {
  const { toast } = useToast();
  
  const {
    data: streak,
    isLoading,
    error
  } = useQuery({
    queryKey: ["/api/trading-streak", userId],
    queryFn: async () => {
      // Wenn kein User-ID angegeben wurde, abbrechen
      if (!userId) return null;
      
      try {
        const response = await fetch(`/api/trading-streak?userId=${userId}`);
        
        if (!response.ok) {
          throw new Error("Fehler beim Laden der Trading Streak");
        }
        
        return await response.json();
      } catch (error) {
        console.error("Fehler beim Laden der Trading Streak:", error);
        return null;
      }
    }
  });
  
  const updateStreakMutation = useMutation({
    mutationFn: async (streakUpdate: Partial<TradingStreak>) => {
      const response = await apiRequest("PUT", `/api/trading-streak/${userId}`, streakUpdate);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Streak aktualisiert",
        description: "Deine Trading Streak wurde erfolgreich aktualisiert."
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading-streak", userId] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Aktualisieren der Streak: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  const earnBadgeMutation = useMutation({
    mutationFn: async (badgeType: string) => {
      const response = await apiRequest("POST", `/api/trading-streak/${userId}/badge`, { badgeType });
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Badge verdient!",
        description: "Du hast ein neues Badge verdient. Herzlichen Glückwunsch!"
      });
      queryClient.invalidateQueries({ queryKey: ["/api/trading-streak", userId] });
    },
    onError: (error) => {
      toast({
        title: "Fehler",
        description: `Fehler beim Verdienen des Badges: ${error.message}`,
        variant: "destructive"
      });
    }
  });
  
  // Berechne, wie viele Erfahrungspunkte bis zum nächsten Level benötigt werden
  const getNextLevelXP = (level: number) => {
    return level * 100; // Einfache Formel: Jedes Level benötigt level * 100 XP
  };
  
  const getProgress = (current: number, next: number) => {
    return Math.min(100, Math.round((current / next) * 100));
  };
  
  // Badge anzeigen-Komponente mit Icon und Tooltip
  const BadgeIcon = ({ type }: { type: string }) => {
    let icon;
    let color;
    let label;
    let isLegendary = false;
    
    switch (type) {
      case "winning_streak_5":
        icon = <Flame className="h-5 w-5" />;
        color = "bg-orange-500";
        label = "5er Streak";
        break;
      case "winning_streak_10":
        icon = <Flame className="h-5 w-5" />;
        color = "bg-red-500";
        label = "10er Streak";
        break;
      case "winning_streak_20":
        icon = <Flame className="h-5 w-5" />;
        color = "bg-purple-500";
        label = "20er Streak";
        isLegendary = true;
        break;
      case "perfect_week":
        icon = <Star className="h-5 w-5" />;
        color = "bg-yellow-500";
        label = "Perfekte Woche";
        break;
      case "comeback_king":
        icon = <ArrowUp className="h-5 w-5" />;
        color = "bg-green-500";
        label = "Comeback König";
        break;
      case "first_trade":
        icon = <Target className="h-5 w-5" />;
        color = "bg-blue-500";
        label = "Erster Trade";
        break;
      case "trade_master_50":
        icon = <Trophy className="h-5 w-5" />;
        color = "bg-amber-500";
        label = "50 Trades";
        break;
      case "trade_master_100":
        icon = <Award className="h-5 w-5" />;
        color = "bg-emerald-500";
        label = "100 Trades";
        isLegendary = true;
        break;
      default:
        icon = <Award className="h-5 w-5" />;
        color = "bg-gray-500";
        label = "Unbekanntes Badge";
    }
    
    return (
      <div className="tooltip" data-tip={label}>
        <div className={`achievement-badge ${color} ${isLegendary ? 'legendary' : ''} p-2 rounded-full text-white flex items-center justify-center mr-2 mb-2`}>
          {icon}
        </div>
      </div>
    );
  };
  
  // Wenn keine Trading Streak vorhanden ist, zeigen wir einen Erst-Einstieg an
  if (!isLoading && !streak) {
    return (
      <Card className="streak-card w-full backdrop-blur-sm">
        <CardHeader className="pb-2">
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-6 w-6 text-yellow-500 animate-pulse" />
            <span className="level-title">Trading Streak Tracker</span>
          </CardTitle>
          <CardDescription className="text-blue-300">
            Starte deine erste Trading Streak und sammle Auszeichnungen!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-6 text-center">
            <div className="mb-4 flex justify-center">
              <div className="w-16 h-16 rounded-full bg-blue-800/30 flex items-center justify-center">
                <Trophy className="h-8 w-8 text-blue-400 opacity-50" />
              </div>
            </div>
            <p className="text-lg font-medium">Du hast noch keine Trading Streak gestartet.</p>
            <p className="text-sm text-blue-300/80 mt-2">
              Füge deinen ersten Trade hinzu, um deine Streak zu beginnen!
            </p>
            <div className="mt-6">
              <div className="w-full h-2 bg-blue-900/30 rounded-full overflow-hidden animate-pulse">
                <div className="h-full w-0 bg-gradient-to-r from-blue-500 to-blue-300 rounded-full"></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card className="streak-card w-full backdrop-blur-sm">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Flame className="mr-2 h-6 w-6 text-yellow-500" />
            <span className="level-title">Trading Streak Tracker</span>
          </CardTitle>
          <CardDescription className="text-blue-300">
            Lädt deine Trading Daten...
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-8 flex flex-col items-center justify-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-t-2 border-primary"></div>
            <p className="mt-4 text-sm text-blue-300/80">Bitte warten, die Streak-Daten werden geladen...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Nächstes Level XP
  const streakLevel = streak?.streakLevel || streak?.level || 1;
  const nextLevelXP = getNextLevelXP(streakLevel);
  const currentXP = streak?.experiencePoints || 0;
  const progressToNextLevel = getProgress(currentXP, nextLevelXP);

  return (
    <Card className="streak-card w-full backdrop-blur-sm">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center">
          <Flame className="mr-2 h-6 w-6 text-yellow-500" />
          <span className="level-title">Trading Streak Tracker</span>
        </CardTitle>
        <CardDescription className="text-blue-300">
          <span className="font-semibold">Level {streakLevel}</span> Trader
          {streak?.badges?.length ? ` · ${streak.badges.length} Abzeichen erzielt` : ''}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="streak-data-box flex flex-col items-center">
            <h3 className="text-sm font-medium text-blue-300 mb-1">Aktuelle Streak</h3>
            <p className="current-streak-value">{streak?.currentStreak}</p>
            <span className="text-xs text-blue-400/70 mt-1">
              Gewinn-Serie
            </span>
          </div>
          <div className="streak-data-box flex flex-col items-center">
            <h3 className="text-sm font-medium text-blue-300 mb-1">Längste Streak</h3>
            <p className="longest-streak-value">{streak?.longestStreak}</p>
            <span className="text-xs text-blue-400/70 mt-1">
              Bester Rekord
            </span>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-6 mb-6">
          <div className="streak-data-box flex flex-col items-center">
            <h3 className="text-sm font-medium text-blue-300 mb-1">Gesamt-Gewinne</h3>
            <p className="text-2xl font-bold text-green-500">{streak?.totalWins}</p>
            <span className="text-xs text-blue-400/70 mt-1">
              Erfolgreiche Trades
            </span>
          </div>
          <div className="streak-data-box flex flex-col items-center">
            <h3 className="text-sm font-medium text-blue-300 mb-1">Gesamt-Verluste</h3>
            <p className="text-2xl font-bold text-red-500">{streak?.totalLosses}</p>
            <span className="text-xs text-blue-400/70 mt-1">
              Fehlgeschlagene Trades
            </span>
          </div>
        </div>
        
        <div className="mb-8 bg-blue-900/20 p-4 rounded-xl">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm text-blue-300 font-medium">XP: {currentXP}/{nextLevelXP}</span>
            <Badge variant="outline" className="bg-blue-900/50 border-blue-500/30 text-blue-300">
              Level {streak?.level}
            </Badge>
          </div>
          <div className="progress-container">
            <Progress value={progressToNextLevel} className="h-2" />
          </div>
          <div className="mt-2 text-xs text-blue-400/70 text-center">
            {nextLevelXP - currentXP} XP bis zum nächsten Level
          </div>
        </div>
        
        {streak?.badges && streak.badges.length > 0 && (
          <div className="bg-blue-900/20 p-4 rounded-xl">
            <h3 className="text-sm font-medium text-blue-300 mb-3">Errungenschaften</h3>
            <div className="badge-container">
              {streak.badges.map((badge: string, idx: number) => (
                <BadgeIcon key={idx} type={badge} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}