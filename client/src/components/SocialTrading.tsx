import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import { Ban, Eye, Heart, MessageSquare, PencilLine, Plus, Search, Share2, Star, ThumbsUp, Trash, User } from "lucide-react";
import { cn } from "../lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";

// Formschema für Handelsstrategien
const strategyFormSchema = z.object({
  name: z.string().min(3, "Name muss mindestens 3 Zeichen lang sein"),
  description: z.string().min(20, "Beschreibung muss mindestens 20 Zeichen lang sein"),
  setupType: z.string().min(3, "Setup-Typ muss mindestens 3 Zeichen lang sein"),
  entryRules: z.string().min(10, "Einstiegsregeln müssen mindestens 10 Zeichen lang sein"),
  exitRules: z.string().min(10, "Ausstiegsregeln müssen mindestens 10 Zeichen lang sein"),
  riskManagement: z.string().min(10, "Risikomanagement muss mindestens 10 Zeichen lang sein"),
  timeframes: z.string().min(2, "Zeitrahmen muss mindestens 2 Zeichen lang sein"),
  markets: z.string().min(2, "Märkte müssen mindestens 2 Zeichen lang sein"),
  public: z.boolean().default(false),
  userId: z.number()
});

type StrategyFormValues = z.infer<typeof strategyFormSchema>;

// Formschema für Kommentare
const commentFormSchema = z.object({
  content: z.string().min(3, "Kommentar muss mindestens 3 Zeichen lang sein")
});

type CommentFormValues = z.infer<typeof commentFormSchema>;

// Komponente für eine einzelne Handelsstrategie
const StrategyDetail = ({ strategy, onClose }: { strategy: any, onClose: () => void }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [tab, setTab] = useState("overview");
  
  const { data: comments, isLoading: isLoadingComments } = useQuery({
    queryKey: ["/api/strategies", strategy.id, "comments"],
    queryFn: () => apiRequest("GET", `/api/strategies/${strategy.id}/comments`)
      .then(res => res.json())
  });
  
  const commentForm = useForm<CommentFormValues>({
    resolver: zodResolver(commentFormSchema),
    defaultValues: {
      content: ""
    }
  });
  
  const addCommentMutation = useMutation({
    mutationFn: async (values: CommentFormValues) => {
      const res = await apiRequest("POST", `/api/strategies/${strategy.id}/comments`, values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies", strategy.id, "comments"] });
      commentForm.reset();
      toast({
        title: "Kommentar hinzugefügt",
        description: "Dein Kommentar wurde erfolgreich hinzugefügt."
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Der Kommentar konnte nicht hinzugefügt werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
    }
  });
  
  const deleteCommentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/comments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies", strategy.id, "comments"] });
      toast({
        title: "Kommentar gelöscht",
        description: "Dein Kommentar wurde erfolgreich gelöscht."
      });
    }
  });
  
  const onSubmitComment = (values: CommentFormValues) => {
    addCommentMutation.mutate(values);
  };
  
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">{strategy.name}</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={strategy.public ? "default" : "outline"}>
              {strategy.public ? "Öffentlich" : "Privat"}
            </Badge>
            <div className="flex items-center text-amber-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="ml-1 text-sm">
                {strategy.rating} ({strategy.ratingCount} Bewertungen)
              </span>
            </div>
          </div>
        </div>
        
        <Button variant="outline" onClick={onClose}>
          Zurück
        </Button>
      </div>
      
      <Tabs defaultValue={tab} onValueChange={setTab} className="w-full">
        <TabsList className="grid grid-cols-3 mb-6">
          <TabsTrigger value="overview">Übersicht</TabsTrigger>
          <TabsTrigger value="rules">Handelsregeln</TabsTrigger>
          <TabsTrigger value="discussion">Diskussion ({comments?.length || 0})</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Strategie-Beschreibung</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{strategy.description}</p>
            </CardContent>
          </Card>
          
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Setup-Typ</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{strategy.setupType}</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-md">Zeitrahmen</CardTitle>
              </CardHeader>
              <CardContent>
                <p>{strategy.timeframes}</p>
              </CardContent>
            </Card>
          </div>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-md">Märkte</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{strategy.markets}</p>
            </CardContent>
          </Card>
          
          <div className="text-sm text-muted-foreground">
            Erstellt am {format(new Date(strategy.createdAt), "dd.MM.yyyy")}
            {strategy.updatedAt && strategy.updatedAt !== strategy.createdAt && 
              ` | Aktualisiert am ${format(new Date(strategy.updatedAt), "dd.MM.yyyy")}`}
          </div>
        </TabsContent>
        
        <TabsContent value="rules" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Einstiegsregeln</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{strategy.entryRules}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Ausstiegsregeln</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{strategy.exitRules}</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Risikomanagement</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-line">{strategy.riskManagement}</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="discussion" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Diskussion</CardTitle>
              <CardDescription>
                Teile deine Gedanken und Fragen zu dieser Handelsstrategie
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user ? (
                <Form {...commentForm}>
                  <form onSubmit={commentForm.handleSubmit(onSubmitComment)} className="space-y-4">
                    <FormField
                      control={commentForm.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Schreibe einen Kommentar..." 
                              className="min-h-[100px]"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      disabled={addCommentMutation.isPending}
                      className="ml-auto"
                    >
                      {addCommentMutation.isPending ? "Senden..." : "Kommentar senden"}
                    </Button>
                  </form>
                </Form>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  Melde dich an, um an der Diskussion teilzunehmen.
                </div>
              )}
              
              <Separator className="my-6" />
              
              {isLoadingComments ? (
                <div className="text-center py-4 text-muted-foreground">
                  Lade Kommentare...
                </div>
              ) : !comments || comments.length === 0 ? (
                <div className="text-center py-4 text-muted-foreground">
                  Noch keine Kommentare. Sei der Erste, der einen Kommentar hinterlässt!
                </div>
              ) : (
                <div className="space-y-6">
                  {comments.map((comment: any) => (
                    <div key={comment.id} className="flex gap-4">
                      <Avatar>
                        <AvatarFallback>{comment.userId.toString().substring(0, 2)}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">Nutzer {comment.userId}</div>
                          <div className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), "dd.MM.yyyy HH:mm")}
                          </div>
                        </div>
                        <p className="text-sm">{comment.content}</p>
                        
                        {user && user.id === comment.userId && (
                          <div className="flex justify-end">
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => deleteCommentMutation.mutate(comment.id)}
                              className="h-auto py-1 px-2 text-xs"
                            >
                              <Trash className="h-3 w-3 mr-1" />
                              Löschen
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

// Hauptkomponente für Social Trading
export default function SocialTrading() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddStrategyOpen, setIsAddStrategyOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  
  const { data: strategies, isLoading } = useQuery({
    queryKey: ["/api/strategies", showOnlyMine ? user?.id : undefined],
    queryFn: () => apiRequest("GET", showOnlyMine ? `/api/strategies?userId=${user?.id}` : "/api/strategies?publicOnly=true")
      .then(res => res.json()),
    enabled: !!user
  });
  
  const defaultValues: Partial<StrategyFormValues> = {
    name: "",
    description: "",
    setupType: "",
    entryRules: "",
    exitRules: "",
    riskManagement: "",
    timeframes: "",
    markets: "",
    public: false,
    userId: user?.id
  };
  
  const form = useForm<StrategyFormValues>({
    resolver: zodResolver(strategyFormSchema),
    defaultValues
  });
  
  const createStrategyMutation = useMutation({
    mutationFn: async (values: StrategyFormValues) => {
      const res = await apiRequest("POST", "/api/strategies", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      setIsAddStrategyOpen(false);
      form.reset(defaultValues);
      toast({
        title: "Strategie erstellt",
        description: "Deine Handelsstrategie wurde erfolgreich hinzugefügt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Strategie konnte nicht erstellt werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
    }
  });
  
  const updateStrategyMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: StrategyFormValues }) => {
      const res = await apiRequest("PUT", `/api/strategies/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      setIsAddStrategyOpen(false);
      setSelectedStrategy(null);
      setIsEditMode(false);
      form.reset(defaultValues);
      toast({
        title: "Strategie aktualisiert",
        description: "Deine Handelsstrategie wurde erfolgreich aktualisiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Strategie konnte nicht aktualisiert werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
    }
  });
  
  const deleteStrategyMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/strategies/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/strategies"] });
      setSelectedStrategy(null);
      toast({
        title: "Strategie gelöscht",
        description: "Deine Handelsstrategie wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Die Strategie konnte nicht gelöscht werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
    }
  });
  
  const onSubmit = (values: StrategyFormValues) => {
    if (isEditMode && selectedStrategy) {
      updateStrategyMutation.mutate({ id: selectedStrategy.id, data: values });
    } else {
      createStrategyMutation.mutate(values);
    }
  };
  
  const handleEdit = (strategy: any) => {
    setSelectedStrategy(strategy);
    setIsEditMode(true);
    form.reset({
      ...strategy,
      userId: user?.id
    });
    setIsAddStrategyOpen(true);
  };
  
  const filteredStrategies = strategies?.filter((strategy: any) => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      strategy.name.toLowerCase().includes(query) ||
      strategy.description.toLowerCase().includes(query) ||
      strategy.setupType.toLowerCase().includes(query) ||
      strategy.markets.toLowerCase().includes(query)
    );
  });
  
  if (!user) {
    return <div className="text-center py-20">Bitte melde dich an, um diese Funktion zu nutzen.</div>;
  }
  
  if (selectedStrategy) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <StrategyDetail 
          strategy={selectedStrategy} 
          onClose={() => setSelectedStrategy(null)} 
        />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Social Trading</h1>
        <p className="text-muted-foreground">
          Teile deine Handelsstrategien mit anderen Tradern und entdecke neue Strategien
        </p>
      </div>
      
      <div className="mb-6 space-y-4">
        <div className="flex justify-between items-center gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Strategien durchsuchen..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Button onClick={() => {
            setIsEditMode(false);
            form.reset({
              ...defaultValues,
              userId: user.id
            });
            setIsAddStrategyOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Strategie erstellen
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Checkbox
            id="showMine"
            checked={showOnlyMine}
            onCheckedChange={(checked) => {
              setShowOnlyMine(checked as boolean);
            }}
          />
          <label
            htmlFor="showMine"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            Nur meine Strategien anzeigen
          </label>
        </div>
      </div>
      
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Lade Strategien...</div>
      ) : (
        <>
          {!filteredStrategies || filteredStrategies.length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p>Keine Strategien gefunden.</p>
              <p className="mt-2">Erstelle deine erste Handelsstrategie!</p>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {filteredStrategies.map((strategy: any) => (
                <Card key={strategy.id} className="flex flex-col h-full">
                  <CardHeader className="pb-3">
                    <div className="flex justify-between">
                      <Badge variant={strategy.public ? "default" : "outline"}>
                        {strategy.public ? "Öffentlich" : "Privat"}
                      </Badge>
                      <div className="flex items-center text-amber-500">
                        <Star className="h-4 w-4 fill-current" />
                        <span className="ml-1 text-sm">{strategy.rating}</span>
                      </div>
                    </div>
                    <CardTitle className="mt-2">{strategy.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{strategy.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="grid grid-cols-2 gap-2 pb-0 text-sm flex-1">
                    <div>
                      <p className="text-muted-foreground">Setup-Typ</p>
                      <p className="font-medium">{strategy.setupType}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Zeitrahmen</p>
                      <p className="font-medium">{strategy.timeframes}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Märkte</p>
                      <p className="font-medium">{strategy.markets}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Erstellt am</p>
                      <p className="font-medium">{format(new Date(strategy.createdAt), "dd.MM.yyyy")}</p>
                    </div>
                  </CardContent>
                  <CardFooter className="flex gap-2 pt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setSelectedStrategy(strategy)}
                      className="flex-1"
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Ansehen
                    </Button>
                    
                    {user.id === strategy.userId && (
                      <>
                        <Button 
                          variant="outline" 
                          onClick={() => handleEdit(strategy)}
                        >
                          <PencilLine className="h-4 w-4" />
                        </Button>
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            if (confirm("Möchtest du diese Strategie wirklich löschen?")) {
                              deleteStrategyMutation.mutate(strategy.id);
                            }
                          }}
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
      
      <Dialog open={isAddStrategyOpen} onOpenChange={(open) => {
        setIsAddStrategyOpen(open);
        if (!open) {
          setIsEditMode(false);
          form.reset(defaultValues);
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Strategie bearbeiten" : "Neue Handelsstrategie"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Bearbeite deine Handelsstrategie" 
                : "Erstelle eine neue Handelsstrategie und teile sie mit anderen Tradern"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name der Strategie</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. Trendfolge-Strategie" {...field} />
                    </FormControl>
                    <FormMessage />
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
                      <Textarea 
                        placeholder="Beschreibe deine Handelsstrategie..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="setupType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Setup-Typ</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Breakout, Pullback" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="timeframes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zeitrahmen</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. 1H, 4H, Daily" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="markets"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Märkte</FormLabel>
                      <FormControl>
                        <Input placeholder="z.B. Forex, Aktien, Krypto" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="entryRules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Einstiegsregeln</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Beschreibe die Regeln für den Einstieg..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="exitRules"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ausstiegsregeln</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Beschreibe die Regeln für den Ausstieg..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="riskManagement"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Risikomanagement</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Beschreibe dein Risikomanagement..." 
                        className="min-h-[100px]"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="public"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4">
                    <FormControl>
                      <Checkbox
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                    <div className="space-y-1 leading-none">
                      <FormLabel>Öffentlich teilen</FormLabel>
                      <p className="text-sm text-muted-foreground">
                        Diese Strategie für alle Nutzer sichtbar machen
                      </p>
                    </div>
                  </FormItem>
                )}
              />
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddStrategyOpen(false);
                    setIsEditMode(false);
                    form.reset(defaultValues);
                  }}
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  disabled={createStrategyMutation.isPending || updateStrategyMutation.isPending}
                >
                  {createStrategyMutation.isPending || updateStrategyMutation.isPending 
                    ? "Speichern..." 
                    : isEditMode ? "Aktualisieren" : "Erstellen"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}