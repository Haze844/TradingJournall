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
  level: number;
  badges: string[];
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
        break;
      default:
        icon = <Award className="h-5 w-5" />;
        color = "bg-gray-500";
        label = "Unbekanntes Badge";
    }
    
    return (
      <div className="tooltip" data-tip={label}>
        <div className={`${color} p-2 rounded-full text-white flex items-center justify-center mr-2 mb-2`}>
          {icon}
        </div>
      </div>
    );
  };
  
  // Wenn keine Trading Streak vorhanden ist, zeigen wir einen Erst-Einstieg an
  if (!isLoading && !streak) {
    return (
      <Card className="w-full bg-card/30 backdrop-blur-sm border border-muted/30">
        <CardHeader>
          <CardTitle className="flex items-center">
            <Zap className="mr-2 h-6 w-6 text-yellow-500" />
            Trading Streak Tracker
          </CardTitle>
          <CardDescription>
            Starte deine erste Trading Streak und sammle Auszeichnungen!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="py-4 text-center">
            <p>Du hast noch keine Trading Streak gestartet.</p>
            <p className="text-sm text-muted-foreground mt-2">
              Füge deinen ersten Trade hinzu, um deine Streak zu beginnen!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  if (isLoading) {
    return (
      <Card className="w-full bg-card/30 backdrop-blur-sm border border-muted/30">
        <CardHeader>
          <CardTitle>Trading Streak Tracker</CardTitle>
          <CardDescription>Lädt...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Nächstes Level XP
  const nextLevelXP = getNextLevelXP(streak?.level || 1);
  const currentXP = streak?.experiencePoints || 0;
  const progressToNextLevel = getProgress(currentXP, nextLevelXP);

  return (
    <Card className="w-full bg-card/30 backdrop-blur-sm border border-muted/30">
      <CardHeader>
        <CardTitle className="flex items-center">
          <Flame className="mr-2 h-6 w-6 text-yellow-500" />
          Trading Streak Tracker
        </CardTitle>
        <CardDescription>
          Level {streak?.level} Trader
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium">Aktuelle Streak</h3>
            <p className="text-2xl font-bold">{streak?.currentStreak}</p>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium">Längste Streak</h3>
            <p className="text-2xl font-bold">{streak?.longestStreak}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium">Gesamt-Gewinne</h3>
            <p className="text-2xl font-bold text-green-500">{streak?.totalWins}</p>
          </div>
          <div className="flex flex-col items-center">
            <h3 className="text-sm font-medium">Gesamt-Verluste</h3>
            <p className="text-2xl font-bold text-red-500">{streak?.totalLosses}</p>
          </div>
        </div>
        
        <div className="mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm">XP: {currentXP}/{nextLevelXP}</span>
            <Badge variant="outline">Level {streak?.level}</Badge>
          </div>
          <Progress value={progressToNextLevel} className="h-2" />
        </div>
        
        {streak?.badges && streak.badges.length > 0 && (
          <div>
            <h3 className="text-sm font-medium mb-2">Errungenschaften</h3>
            <div className="flex flex-wrap">
              {streak.badges.map((badge, idx) => (
                <BadgeIcon key={idx} type={badge} />
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}