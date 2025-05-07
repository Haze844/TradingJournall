import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Trade } from '../../shared/schema';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { AlertCircle, Check, X, BarChart, Brain, TrendingUp, Target } from 'lucide-react';

interface AdvancedAnalysisResponse {
  tradeId: number;
  strategyAdherence: {
    score: number;
    comments: string[];
    strengths: string[];
    weaknesses: string[];
  };
  psychologicalFactors: {
    identified: {
      name: string;
      description: string;
      impact: 'positive' | 'negative' | 'neutral';
    }[];
    suggestions: string[];
  };
  technicalAnalysis: {
    entryQuality: number;
    exitQuality: number;
    comments: string[];
    improvements: string[];
  };
  riskManagement: {
    score: number;
    comments: string[];
    optimalRR: number;
    suggestions: string[];
  };
}

interface AdvancedTradeAnalysisProps {
  trade: Trade | null;
}

export default function AdvancedTradeAnalysis({ trade }: AdvancedTradeAnalysisProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('strategy');

  const { mutate: generateAnalysis, isPending } = useMutation({
    mutationFn: async () => {
      if (!trade) return null;

      const response = await apiRequest(
        'POST',
        `/api/trades/${trade.id}/advanced-analysis`,
        { tradeId: trade.id }
      );
      
      if (!response.ok) {
        throw new Error('Failed to generate advanced analysis');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: 'Analyse erfolgreich',
        description: 'Die erweiterte Analyse wurde generiert.',
      });
      queryClient.invalidateQueries({ queryKey: [`/api/trades/${trade?.id}`] });
    },
    onError: (error: Error) => {
      toast({
        title: 'Fehler',
        description: `Die Analyse konnte nicht erstellt werden: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Abfrage der Analysedetails
  const { data: analysis, isPending: isAnalysisLoading } = useMutation({
    mutationFn: async () => {
      if (!trade) return null;

      const response = await fetch(`/api/trades/${trade.id}/advanced-analysis`);
      
      if (!response.ok) {
        // Wenn noch keine Analyse vorhanden ist, geben wir null zurück
        if (response.status === 404) {
          return null;
        }
        throw new Error('Failed to fetch advanced analysis');
      }
      
      return response.json() as Promise<AdvancedAnalysisResponse>;
    }
  });

  if (!trade) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erweiterte KI-Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">Bitte wähle einen Trade aus, um eine erweiterte Analyse zu erhalten.</p>
        </CardContent>
      </Card>
    );
  }

  if (isAnalysisLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Erweiterte KI-Analyse</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-5/6 mb-2" />
          <Skeleton className="h-4 w-4/6" />
        </CardContent>
      </Card>
    );
  }

  const hasAnalysis = Boolean(analysis);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Erweiterte KI-Analyse</CardTitle>
      </CardHeader>
      
      {!hasAnalysis ? (
        <>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Für diesen Trade wurde noch keine erweiterte Analyse durchgeführt. Die KI kann tiefere Einblicke zu deiner Strategie, psychologischen Faktoren, technischer Analyse und Risikomanagement liefern.
            </p>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => generateAnalysis()} 
              disabled={isPending}
              className="w-full"
            >
              {isPending ? 'Analysiere...' : 'Erweiterte KI-Analyse generieren'}
            </Button>
          </CardFooter>
        </>
      ) : (
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-4 mb-4">
              <TabsTrigger value="strategy" className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                <span className="hidden sm:inline">Strategie</span>
              </TabsTrigger>
              <TabsTrigger value="psychology" className="flex items-center gap-1">
                <Brain className="h-4 w-4" />
                <span className="hidden sm:inline">Psychologie</span>
              </TabsTrigger>
              <TabsTrigger value="technical" className="flex items-center gap-1">
                <TrendingUp className="h-4 w-4" />
                <span className="hidden sm:inline">Technik</span>
              </TabsTrigger>
              <TabsTrigger value="risk" className="flex items-center gap-1">
                <BarChart className="h-4 w-4" />
                <span className="hidden sm:inline">Risiko</span>
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="strategy" className="space-y-4">
              <div className="mb-3">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Einhaltung der Strategie</h3>
                  <Badge className={analysis?.strategyAdherence.score && analysis.strategyAdherence.score >= 0.7 ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}>
                    {Math.round((analysis?.strategyAdherence.score || 0) * 100)}%
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground mb-4">{analysis?.strategyAdherence.comments.join(' ')}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="border border-border rounded-md p-3">
                    <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                      <Check className="h-4 w-4 text-green-500" />
                      Stärken
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {analysis?.strategyAdherence.strengths.map((strength, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{strength}</li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="border border-border rounded-md p-3">
                    <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                      <X className="h-4 w-4 text-red-500" />
                      Schwächen
                    </h4>
                    <ul className="list-disc list-inside text-sm space-y-1">
                      {analysis?.strategyAdherence.weaknesses.map((weakness, i) => (
                        <li key={i} className="text-sm text-muted-foreground">{weakness}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="psychology" className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Psychologische Faktoren</h3>
                
                {analysis?.psychologicalFactors.identified.length === 0 ? (
                  <p className="text-sm text-muted-foreground mb-3">Keine spezifischen psychologischen Faktoren identifiziert.</p>
                ) : (
                  <div className="space-y-3 mb-4">
                    {analysis?.psychologicalFactors.identified.map((factor, i) => (
                      <div key={i} className="border border-border rounded-md p-3">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="text-sm font-medium">{factor.name}</h4>
                          <Badge 
                            className={`ml-2 ${
                              factor.impact === 'positive' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 
                              factor.impact === 'negative' ? 'bg-red-500/10 text-red-500 border-red-500/20' : ''
                            }`}
                          >
                            {factor.impact === 'positive' ? 'Positiv' : 
                             factor.impact === 'negative' ? 'Negativ' : 'Neutral'}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">{factor.description}</p>
                      </div>
                    ))}
                  </div>
                )}
                
                <div className="border border-border rounded-md p-3">
                  <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    Empfehlungen
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {analysis?.psychologicalFactors.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="technical" className="space-y-4">
              <div>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div className="border border-border rounded-md p-3">
                    <h4 className="text-sm text-muted-foreground mb-1">Entry-Qualität</h4>
                    <div className="font-medium text-lg">
                      {Math.round((analysis?.technicalAnalysis.entryQuality || 0) * 100)}%
                    </div>
                  </div>
                  
                  <div className="border border-border rounded-md p-3">
                    <h4 className="text-sm text-muted-foreground mb-1">Exit-Qualität</h4>
                    <div className="font-medium text-lg">
                      {Math.round((analysis?.technicalAnalysis.exitQuality || 0) * 100)}%
                    </div>
                  </div>
                </div>
                
                <div className="mb-3">
                  <h4 className="text-sm font-medium mb-1">Technische Analyse</h4>
                  <p className="text-sm text-muted-foreground">
                    {analysis?.technicalAnalysis.comments.join(' ')}
                  </p>
                </div>
                
                <div className="border border-border rounded-md p-3">
                  <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                    <TrendingUp className="h-4 w-4 text-blue-500" />
                    Verbesserungspotential
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {analysis?.technicalAnalysis.improvements.map((improvement, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{improvement}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="risk" className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-medium">Risikomanagement</h3>
                  <Badge variant={analysis?.riskManagement.score >= 0.7 ? 'success' : 'destructive'}>
                    {Math.round(analysis?.riskManagement.score * 100)}%
                  </Badge>
                </div>
                
                <p className="text-sm text-muted-foreground mb-3">
                  {analysis?.riskManagement.comments.join(' ')}
                </p>
                
                <div className="border border-border rounded-md p-3 mb-3">
                  <h4 className="text-sm text-muted-foreground mb-1">Optimales Risk/Reward</h4>
                  <div className="font-medium text-lg">{analysis?.riskManagement.optimalRR}:1</div>
                </div>
                
                <div className="border border-border rounded-md p-3">
                  <h4 className="text-sm font-medium flex items-center gap-1 mb-2">
                    <AlertCircle className="h-4 w-4 text-blue-500" />
                    Empfehlungen
                  </h4>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {analysis?.riskManagement.suggestions.map((suggestion, i) => (
                      <li key={i} className="text-sm text-muted-foreground">{suggestion}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      )}
    </Card>
  );
}