import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon, CheckCircle2, Circle, Goal, LucideIcon, Megaphone, PlusCircle, Sparkles, Target, Trophy, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";

// Formschema für Coaching-Ziele
const goalFormSchema = z.object({
  goalType: z.enum(["daily", "weekly", "monthly"]),
  description: z.string().min(5, "Beschreibung muss mindestens 5 Zeichen lang sein"),
  targetValue: z.number().min(1, "Zielwert muss mindestens 1 sein"),
  currentValue: z.number().default(0),
  completed: z.boolean().default(false),
  dueDate: z.date(),
  userId: z.number()
});

type GoalFormValues = z.infer<typeof goalFormSchema>;

// Komponente für die Anzeige der Coaching-Ziele
const GoalsList = ({ type, userId }: { type: "daily" | "weekly" | "monthly", userId: number }) => {
  const [isAddGoalOpen, setIsAddGoalOpen] = useState(false);
  
  const { data: goals, isLoading } = useQuery({
    queryKey: ["/api/coaching/goals", userId, type],
    queryFn: () => apiRequest("GET", `/api/coaching/goals?userId=${userId}&goalType=${type}`)
      .then(res => res.json())
  });
  
  const { toast } = useToast();
  
  const form = useForm<GoalFormValues>({
    resolver: zodResolver(goalFormSchema),
    defaultValues: {
      goalType: type,
      description: "",
      targetValue: 1,
      currentValue: 0,
      completed: false,
      dueDate: new Date(),
      userId: userId
    }
  });
  
  const createGoalMutation = useMutation({
    mutationFn: async (values: GoalFormValues) => {
      const res = await apiRequest("POST", "/api/coaching/goals", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/goals"] });
      setIsAddGoalOpen(false);
      form.reset();
      toast({
        title: "Ziel erstellt",
        description: "Dein Trading-Ziel wurde erfolgreich hinzugefügt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Ziel konnte nicht erstellt werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
    }
  });
  
  const updateGoalMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: Partial<GoalFormValues> }) => {
      const res = await apiRequest("PUT", `/api/coaching/goals/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/goals"] });
      toast({
        title: "Ziel aktualisiert",
        description: "Dein Trading-Ziel wurde erfolgreich aktualisiert.",
      });
    }
  });
  
  const deleteGoalMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/coaching/goals/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/goals"] });
      toast({
        title: "Ziel gelöscht",
        description: "Dein Trading-Ziel wurde erfolgreich gelöscht.",
      });
    }
  });
  
  const onSubmit = (values: GoalFormValues) => {
    createGoalMutation.mutate(values);
  };
  
  const handleUpdateProgress = (goal: any, newValue: number) => {
    updateGoalMutation.mutate({
      id: goal.id,
      data: {
        currentValue: newValue,
        completed: newValue >= goal.targetValue
      }
    });
  };
  
  const handleToggleComplete = (goal: any) => {
    updateGoalMutation.mutate({
      id: goal.id,
      data: {
        completed: !goal.completed,
        currentValue: goal.completed ? goal.currentValue : goal.targetValue
      }
    });
  };
  
  if (isLoading) {
    return <div className="py-6 text-center text-muted-foreground">Lade Ziele...</div>;
  }
  
  return (
    <div className="space-y-4">
      {(!goals || goals.length === 0) ? (
        <div className="py-10 text-center text-muted-foreground">
          <Trophy className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Keine Ziele vorhanden. Erstelle dein erstes Ziel!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {goals.map((goal: any) => (
            <Card key={goal.id} className={cn("transition-opacity", goal.completed ? "opacity-70" : "")}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="line-clamp-1 text-md flex gap-2 items-center">
                      {goal.completed ? (
                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                      ) : (
                        <Circle className="h-5 w-5 text-amber-500" />
                      )}
                      {goal.description}
                    </CardTitle>
                    <CardDescription>
                      Fällig am {format(new Date(goal.dueDate), "dd.MM.yyyy")}
                    </CardDescription>
                  </div>
                  <div className="flex gap-1">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleToggleComplete(goal)}
                    >
                      {goal.completed ? <X className="h-4 w-4" /> : <CheckCircle2 className="h-4 w-4" />}
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => deleteGoalMutation.mutate(goal.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pb-2">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{goal.currentValue} / {goal.targetValue}</span>
                    <span className="text-muted-foreground">
                      {Math.round((goal.currentValue / goal.targetValue) * 100)}%
                    </span>
                  </div>
                  <Progress value={(goal.currentValue / goal.targetValue) * 100} className="h-2" />
                </div>
              </CardContent>
              <CardFooter className="flex justify-between pt-1">
                <div className="flex gap-1">
                  {goal.currentValue > 0 && (
                    <Button variant="outline" size="sm" onClick={() => handleUpdateProgress(goal, Math.max(0, goal.currentValue - 1))}>
                      -
                    </Button>
                  )}
                  <Button variant="outline" size="sm" onClick={() => handleUpdateProgress(goal, goal.currentValue + 1)}>
                    +
                  </Button>
                </div>
                <Badge variant="outline">{goal.goalType}</Badge>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
      
      <Button 
        className="w-full" 
        variant="outline" 
        onClick={() => setIsAddGoalOpen(true)}
      >
        <PlusCircle className="mr-2 h-4 w-4" />
        Neues Ziel erstellen
      </Button>
      
      <Dialog open={isAddGoalOpen} onOpenChange={setIsAddGoalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Neues Trading-Ziel</DialogTitle>
            <DialogDescription>
              Erstelle ein neues Ziel für deine Trading-Aktivitäten
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="goalType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Zieltyp</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Wähle einen Zieltyp" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="daily">Täglich</SelectItem>
                        <SelectItem value="weekly">Wöchentlich</SelectItem>
                        <SelectItem value="monthly">Monatlich</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Beschreibung</FormLabel>
                    <FormControl>
                      <Textarea placeholder="z.B. Profitable Trades durchführen" {...field} />
                    </FormControl>
                  </FormItem>
                )}
              />
              
              <div className="flex gap-4">
                <FormField
                  control={form.control}
                  name="targetValue"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Zielwert</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min={1} 
                          placeholder="5" 
                          {...field}
                          onChange={e => field.onChange(parseInt(e.target.value))}
                        />
                      </FormControl>
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="dueDate"
                  render={({ field }) => (
                    <FormItem className="flex-1">
                      <FormLabel>Fälligkeitsdatum</FormLabel>
                      <Popover>
                        <PopoverTrigger asChild>
                          <FormControl>
                            <Button
                              variant={"outline"}
                              className={cn(
                                "pl-3 text-left font-normal",
                                !field.value && "text-muted-foreground"
                              )}
                            >
                              {field.value ? (
                                format(field.value, "dd.MM.yyyy")
                              ) : (
                                <span>Wähle ein Datum</span>
                              )}
                              <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                          </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={field.value}
                            onSelect={field.onChange}
                            initialFocus
                          />
                        </PopoverContent>
                      </Popover>
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddGoalOpen(false)}
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  disabled={createGoalMutation.isPending}
                >
                  {createGoalMutation.isPending ? "Speichern..." : "Ziel erstellen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// Komponente für die Anzeige des Coaching-Feedbacks
const FeedbackList = ({ userId }: { userId: number }) => {
  const { data: feedback, isLoading } = useQuery({
    queryKey: ["/api/coaching/feedback", userId],
    queryFn: () => apiRequest("GET", `/api/coaching/feedback?userId=${userId}`)
      .then(res => res.json())
  });
  
  const { toast } = useToast();
  
  const generateFeedbackMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/coaching/feedback/generate", { userId });
      return await res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/feedback"] });
      toast({
        title: `${data.length} Feedback-Einträge generiert`,
        description: "Die KI hat deine Trades analysiert und Feedback erstellt."
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Feedback konnte nicht generiert werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
    }
  });
  
  const acknowledgeFeedbackMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await apiRequest("PUT", `/api/coaching/feedback/${id}/acknowledge`, {});
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/coaching/feedback"] });
    }
  });
  
  if (isLoading) {
    return <div className="py-6 text-center text-muted-foreground">Lade Feedback...</div>;
  }
  
  const getCategoryIcon = (category: string): LucideIcon => {
    switch (category) {
      case "strategy": return Sparkles;
      case "psychology": return Target;
      case "risk": return Goal;
      case "discipline": return Megaphone;
      default: return Megaphone;
    }
  };
  
  const getCategoryColor = (category: string): string => {
    switch (category) {
      case "strategy": return "text-blue-500";
      case "psychology": return "text-purple-500";
      case "risk": return "text-red-500";
      case "discipline": return "text-amber-500";
      default: return "text-gray-500";
    }
  };
  
  const getImportanceText = (importance: number): string => {
    switch (importance) {
      case 5: return "Kritisch";
      case 4: return "Wichtig";
      case 3: return "Mittel";
      case 2: return "Niedrig";
      case 1: return "Info";
      default: return "Info";
    }
  };
  
  return (
    <div className="space-y-4">
      {(!feedback || feedback.length === 0) ? (
        <div className="py-10 text-center text-muted-foreground">
          <Megaphone className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p>Kein Feedback verfügbar. Generiere dein erstes Feedback basierend auf deinen Trades!</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {feedback.map((item: any) => (
            <Card key={item.id} className={item.acknowledged ? "opacity-60" : ""}>
              <CardHeader className="pb-2">
                <div className="flex justify-between">
                  <div className="flex gap-2 items-center">
                    {React.createElement(getCategoryIcon(item.category), {
                      className: cn("h-5 w-5", getCategoryColor(item.category))
                    })}
                    <div>
                      <Badge variant="outline" className="mb-1">
                        {item.category.charAt(0).toUpperCase() + item.category.slice(1)} - {getImportanceText(item.importance)}
                      </Badge>
                      <CardDescription className="text-xs">
                        {format(new Date(item.createdAt), "dd.MM.yyyy")}
                      </CardDescription>
                    </div>
                  </div>
                  {!item.acknowledged && (
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => acknowledgeFeedbackMutation.mutate(item.id)}
                    >
                      Verstanden
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{item.message}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <Button 
        className="w-full" 
        onClick={() => generateFeedbackMutation.mutate()}
        disabled={generateFeedbackMutation.isPending}
      >
        <Sparkles className="mr-2 h-4 w-4" />
        {generateFeedbackMutation.isPending ? "Generiere Feedback..." : "KI-Feedback generieren"}
      </Button>
    </div>
  );
};

// Hauptkomponente für den persönlichen Trading Coach
export default function PersonalCoach() {
  const { user } = useAuth();
  
  if (!user) {
    return <div className="text-center py-20">Bitte melde dich an, um diese Funktion zu nutzen.</div>;
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Dein persönlicher Trading Coach</h1>
        <p className="text-muted-foreground">
          Setze Ziele, erhalte Feedback und verbessere deine Trading-Performance
        </p>
      </div>
      
      <Tabs defaultValue="daily" className="w-full">
        <TabsList className="grid grid-cols-5 mb-6">
          <TabsTrigger value="daily">Tägliche Ziele</TabsTrigger>
          <TabsTrigger value="weekly">Wöchentliche Ziele</TabsTrigger>
          <TabsTrigger value="monthly">Monatliche Ziele</TabsTrigger>
          <TabsTrigger value="feedback">Coaching Feedback</TabsTrigger>
          <TabsTrigger value="progress">Fortschritt</TabsTrigger>
        </TabsList>
        
        <TabsContent value="daily" className="mt-0">
          <GoalsList type="daily" userId={user.id} />
        </TabsContent>
        
        <TabsContent value="weekly" className="mt-0">
          <GoalsList type="weekly" userId={user.id} />
        </TabsContent>
        
        <TabsContent value="monthly" className="mt-0">
          <GoalsList type="monthly" userId={user.id} />
        </TabsContent>
        
        <TabsContent value="feedback" className="mt-0">
          <FeedbackList userId={user.id} />
        </TabsContent>
        
        <TabsContent value="progress" className="mt-0">
          <div className="bg-muted/30 border rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium mb-4">Persönliche Statistiken</h3>
            <p className="text-muted-foreground mb-10">
              Diese Funktion wird in Kürze verfügbar sein. Sie wird dir einen detaillierten Überblick über deinen Trading-Fortschritt geben.
            </p>
            
            <div className="grid grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-md">Erledigte Ziele</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2 text-center">
                  <p className="text-3xl font-bold">0/0</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-md">Win-Rate Trend</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2 text-center">
                  <p className="text-3xl font-bold">--</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="pb-2 text-center">
                  <CardTitle className="text-md">Verbesserungen</CardTitle>
                </CardHeader>
                <CardContent className="pt-0 pb-2 text-center">
                  <p className="text-3xl font-bold">--</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}