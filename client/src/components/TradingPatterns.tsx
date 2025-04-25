import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Lightbulb, TrendingUp, Clock, Calendar, BarChart2 } from 'lucide-react';

interface Pattern {
  id: string;
  title: string;
  description: string;
  confidence: number;
  category: 'setup' | 'timeOfDay' | 'dayOfWeek' | 'market' | 'psychology';
  impact: 'positive' | 'negative' | 'neutral';
}

export default function TradingPatterns({ userId }: { userId: number }) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);

  // Fetch AI-identified patterns
  const {
    data: patterns = [],
    isLoading,
    refetch
  } = useQuery<Pattern[]>({
    queryKey: ['/api/trading-patterns', userId],
    queryFn: async () => {
      try {
        const response = await fetch(`/api/trading-patterns?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch trading patterns');
        }
        return response.json();
      } catch (error) {
        console.error('Error fetching patterns:', error);
        return [];
      }
    },
  });

  const generatePatterns = async () => {
    setIsGenerating(true);
    try {
      const response = await fetch('/api/trading-patterns/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate patterns');
      }

      toast({
        title: 'Analyse abgeschlossen',
        description: 'Neue Handelsmuster wurden erfolgreich identifiziert.',
      });
      
      // Daten aktualisieren
      refetch();
    } catch (error) {
      toast({
        title: 'Fehler',
        description: 'Die Musteranalyse konnte nicht durchgeführt werden.',
        variant: 'destructive',
      });
    } finally {
      setIsGenerating(false);
    }
  };

  // Automatische Analyse deaktiviert, da sie in Endlosschleife läuft
  // Wenn der Benutzer Trades hat, kann er manuell die Analyse starten

  // Kategorie-Icons und Farben
  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'setup':
        return <TrendingUp className="h-4 w-4 mr-1" />;
      case 'timeOfDay':
        return <Clock className="h-4 w-4 mr-1" />;
      case 'dayOfWeek':
        return <Calendar className="h-4 w-4 mr-1" />;
      case 'market':
        return <BarChart2 className="h-4 w-4 mr-1" />;
      case 'psychology':
        return <Lightbulb className="h-4 w-4 mr-1" />;
      default:
        return <Lightbulb className="h-4 w-4 mr-1" />;
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'setup':
        return 'Setup';
      case 'timeOfDay':
        return 'Tageszeit';
      case 'dayOfWeek':
        return 'Wochentag';
      case 'market':
        return 'Marktbedingung';
      case 'psychology':
        return 'Psychologie';
      default:
        return category;
    }
  };
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'positive':
        return 'bg-green-500/10 text-green-500 border-green-500/20';
      case 'negative':
        return 'bg-red-500/10 text-red-500 border-red-500/20';
      case 'neutral':
      default:
        return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    }
  };

  const getConfidenceLabel = (confidence: number) => {
    if (confidence >= 0.8) return 'Sehr hoch';
    if (confidence >= 0.6) return 'Hoch';
    if (confidence >= 0.4) return 'Mittel';
    if (confidence >= 0.2) return 'Niedrig';
    return 'Sehr niedrig';
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>KI-Handelsmuster-Analyse</CardTitle>
          <CardDescription>Identifizierte Muster in deinen Trades</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="border rounded-md p-4">
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-full mb-1" />
                <Skeleton className="h-4 w-5/6" />
                <div className="flex gap-2 mt-3">
                  <Skeleton className="h-6 w-20" />
                  <Skeleton className="h-6 w-24" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle>KI-Handelsmuster-Analyse</CardTitle>
            <CardDescription>Identifizierte Muster in deinen Trades</CardDescription>
          </div>
          <button
            className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md inline-flex items-center"
            onClick={generatePatterns}
            disabled={isGenerating}
          >
            {isGenerating ? 'Analysiere...' : 'Neu analysieren'}
          </button>
        </div>
      </CardHeader>
      <CardContent>
        {patterns.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            {isGenerating ? (
              <div className="flex flex-col items-center">
                <Skeleton className="h-16 w-16 rounded-full mb-4" />
                <p>KI analysiert deine Handelsdaten...</p>
              </div>
            ) : (
              <p>Keine Handelsmuster gefunden. Klicke auf "Neu analysieren", um eine Analyse zu starten.</p>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {patterns.map((pattern) => (
              <div 
                key={pattern.id} 
                className="border border-border rounded-md p-4 transition-all bg-card hover:shadow-md"
              >
                <h3 className="font-medium text-foreground mb-2">{pattern.title}</h3>
                <p className="text-sm text-muted-foreground mb-3">{pattern.description}</p>
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline" className={getImpactColor(pattern.impact)}>
                    {pattern.impact === 'positive' ? 'Positiver Einfluss' : 
                     pattern.impact === 'negative' ? 'Negativer Einfluss' : 'Neutraler Einfluss'}
                  </Badge>
                  <Badge variant="outline" className="inline-flex items-center">
                    {getCategoryIcon(pattern.category)}
                    {getCategoryLabel(pattern.category)}
                  </Badge>
                  <Badge variant="outline">
                    Konfidenz: {getConfidenceLabel(pattern.confidence)}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}