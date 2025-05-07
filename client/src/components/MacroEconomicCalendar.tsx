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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, addMonths, subMonths } from "date-fns";
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, Edit, Plus, Trash } from "lucide-react";
import { cn } from "../lib/utils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Calendar } from "@/components/ui/calendar";

// Formschema für Makroökonomische Ereignisse
const eventFormSchema = z.object({
  title: z.string().min(3, "Titel muss mindestens 3 Zeichen lang sein"),
  description: z.string().min(5, "Beschreibung muss mindestens 5 Zeichen lang sein"),
  impact: z.enum(["high", "medium", "low"]),
  date: z.date(),
  time: z.string().regex(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/, "Zeit muss im Format HH:MM sein"),
  actual: z.string().optional(),
  forecast: z.string().optional(),
  previous: z.string().optional(),
  country: z.string().min(2, "Land muss mindestens 2 Zeichen lang sein"),
  currency: z.string().min(3, "Währung muss mindestens 3 Zeichen lang sein")
});

type EventFormValues = z.infer<typeof eventFormSchema>;

// Hauptkomponente für den Makroökonomischen Kalender
export default function MacroEconomicCalendar() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [isAddEventOpen, setIsAddEventOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  
  const startOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1);
  const endOfMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0);
  
  const { data: events, isLoading } = useQuery({
    queryKey: ["/api/macro-events", startOfMonth.toISOString(), endOfMonth.toISOString()],
    queryFn: () => apiRequest("GET", `/api/macro-events?startDate=${startOfMonth.toISOString()}&endDate=${endOfMonth.toISOString()}`)
      .then(res => res.json())
  });
  
  const { toast } = useToast();
  
  const defaultValues: Partial<EventFormValues> = {
    title: "",
    description: "",
    impact: "medium",
    date: new Date(),
    time: "12:00",
    actual: "",
    forecast: "",
    previous: "",
    country: "",
    currency: ""
  };
  
  const form = useForm<EventFormValues>({
    resolver: zodResolver(eventFormSchema),
    defaultValues
  });
  
  const createEventMutation = useMutation({
    mutationFn: async (values: EventFormValues) => {
      const res = await apiRequest("POST", "/api/macro-events", values);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/macro-events"] });
      setIsAddEventOpen(false);
      form.reset(defaultValues);
      toast({
        title: "Ereignis erstellt",
        description: "Das makroökonomische Ereignis wurde erfolgreich hinzugefügt.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Ereignis konnte nicht erstellt werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
    }
  });
  
  const updateEventMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number, data: EventFormValues }) => {
      const res = await apiRequest("PUT", `/api/macro-events/${id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/macro-events"] });
      setIsAddEventOpen(false);
      setSelectedEvent(null);
      setIsEditMode(false);
      form.reset(defaultValues);
      toast({
        title: "Ereignis aktualisiert",
        description: "Das makroökonomische Ereignis wurde erfolgreich aktualisiert.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Ereignis konnte nicht aktualisiert werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
    }
  });
  
  const deleteEventMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/macro-events/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/macro-events"] });
      setSelectedEvent(null);
      toast({
        title: "Ereignis gelöscht",
        description: "Das makroökonomische Ereignis wurde erfolgreich gelöscht.",
      });
    },
    onError: () => {
      toast({
        title: "Fehler",
        description: "Das Ereignis konnte nicht gelöscht werden. Bitte versuche es später erneut.",
        variant: "destructive"
      });
    }
  });
  
  const onSubmit = (values: EventFormValues) => {
    if (isEditMode && selectedEvent) {
      updateEventMutation.mutate({ id: selectedEvent.id, data: values });
    } else {
      createEventMutation.mutate(values);
    }
  };
  
  const handleEdit = (event: any) => {
    setSelectedEvent(event);
    setIsEditMode(true);
    form.reset({
      ...event,
      date: new Date(event.date),
    });
    setIsAddEventOpen(true);
  };
  
  const getImpactColor = (impact: string) => {
    switch (impact) {
      case "high": return "bg-red-500";
      case "medium": return "bg-amber-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };
  
  const goToPreviousMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  const goToNextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };
  
  if (!user) {
    return <div className="text-center py-20">Bitte melde dich an, um diese Funktion zu nutzen.</div>;
  }
  
  // Gruppiere Ereignisse nach Datum
  const groupedEvents: Record<string, any[]> = {};
  
  if (events) {
    events.forEach((event: any) => {
      const dateString = format(new Date(event.date), "yyyy-MM-dd");
      if (!groupedEvents[dateString]) {
        groupedEvents[dateString] = [];
      }
      groupedEvents[dateString].push(event);
    });
  }
  
  return (
    <div className="container mx-auto p-4 max-w-4xl">
      <div className="mb-6 text-center">
        <h1 className="text-3xl font-bold mb-2">Makroökonomischer Kalender</h1>
        <p className="text-muted-foreground">
          Verfolge wichtige wirtschaftliche Ereignisse und ihre Auswirkung auf die Märkte
        </p>
      </div>
      
      <div className="mb-6 flex justify-between items-center">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousMonth}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="px-2 py-1 rounded border bg-background min-w-[140px] text-center">
            {format(currentDate, "MMMM yyyy")}
          </div>
          <Button variant="outline" size="icon" onClick={goToNextMonth}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        
        <Button onClick={() => {
          setIsEditMode(false);
          form.reset(defaultValues);
          setIsAddEventOpen(true);
        }}>
          <Plus className="mr-2 h-4 w-4" />
          Ereignis hinzufügen
        </Button>
      </div>
      
      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground">Lade Ereignisse...</div>
      ) : (
        <>
          {Object.keys(groupedEvents).length === 0 ? (
            <div className="py-20 text-center text-muted-foreground">
              <p>Keine Ereignisse in diesem Monat gefunden.</p>
              <p className="mt-2">Füge ein neues makroökonomisches Ereignis hinzu!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedEvents)
                .sort(([dateA], [dateB]) => new Date(dateA).getTime() - new Date(dateB).getTime())
                .map(([dateString, dateEvents]) => (
                  <div key={dateString} className="border rounded-lg overflow-hidden">
                    <div className="bg-muted p-3 font-medium">
                      {format(new Date(dateString), "EEEE, d. MMMM yyyy")}
                    </div>
                    <div className="divide-y">
                      {dateEvents
                        .sort((a, b) => a.time.localeCompare(b.time))
                        .map((event) => (
                          <div key={event.id} className="p-4 hover:bg-muted/30 transition-colors">
                            <div className="flex justify-between items-start">
                              <div className="flex gap-3">
                                <div className={cn("w-2 h-full rounded-full self-stretch", getImpactColor(event.impact))}></div>
                                <div>
                                  <div className="flex gap-2 items-center mb-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    <span className="text-sm">{event.time}</span>
                                    <Badge className="ml-1">{event.country}</Badge>
                                    <Badge variant="outline">{event.currency}</Badge>
                                  </div>
                                  <h3 className="font-medium">{event.title}</h3>
                                  <p className="text-sm text-muted-foreground mt-1">{event.description}</p>
                                  
                                  {(event.actual || event.forecast || event.previous) && (
                                    <div className="grid grid-cols-3 gap-4 mt-3">
                                      {event.actual && (
                                        <div>
                                          <p className="text-xs text-muted-foreground">Tatsächlich</p>
                                          <p className="font-medium">{event.actual}</p>
                                        </div>
                                      )}
                                      {event.forecast && (
                                        <div>
                                          <p className="text-xs text-muted-foreground">Prognose</p>
                                          <p className="font-medium">{event.forecast}</p>
                                        </div>
                                      )}
                                      {event.previous && (
                                        <div>
                                          <p className="text-xs text-muted-foreground">Vorherig</p>
                                          <p className="font-medium">{event.previous}</p>
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" onClick={() => handleEdit(event)}>
                                  <Edit className="h-4 w-4" />
                                </Button>
                                <Button 
                                  variant="ghost" 
                                  size="icon" 
                                  onClick={() => deleteEventMutation.mutate(event.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                ))}
            </div>
          )}
        </>
      )}
      
      <Dialog open={isAddEventOpen} onOpenChange={(open) => {
        setIsAddEventOpen(open);
        if (!open) {
          setIsEditMode(false);
          form.reset(defaultValues);
        }
      }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Ereignis bearbeiten" : "Neues makroökonomisches Ereignis"}</DialogTitle>
            <DialogDescription>
              {isEditMode 
                ? "Bearbeite die Daten des makroökonomischen Ereignisses" 
                : "Füge ein neues makroökonomisches Ereignis zum Kalender hinzu"}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Titel</FormLabel>
                    <FormControl>
                      <Input placeholder="z.B. EZB Zinsentscheidung" {...field} />
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
                      <Textarea placeholder="Kurze Beschreibung des Ereignisses" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Datum</FormLabel>
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
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="time"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Zeit (HH:MM)</FormLabel>
                      <FormControl>
                        <Input placeholder="14:30" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="impact"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Wichtigkeit</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Wähle die Wichtigkeit" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="high">Hoch</SelectItem>
                          <SelectItem value="medium">Mittel</SelectItem>
                          <SelectItem value="low">Niedrig</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="country"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Land</FormLabel>
                      <FormControl>
                        <Input placeholder="Deutschland" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="currency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Währung</FormLabel>
                      <FormControl>
                        <Input placeholder="EUR" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="forecast"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Prognose</FormLabel>
                      <FormControl>
                        <Input placeholder="Optionale Prognose" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="actual"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Tatsächlicher Wert</FormLabel>
                      <FormControl>
                        <Input placeholder="Optionaler tatsächlicher Wert" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="previous"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vorheriger Wert</FormLabel>
                      <FormControl>
                        <Input placeholder="Optionaler vorheriger Wert" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <DialogFooter>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => {
                    setIsAddEventOpen(false);
                    setIsEditMode(false);
                    form.reset(defaultValues);
                  }}
                >
                  Abbrechen
                </Button>
                <Button 
                  type="submit" 
                  disabled={createEventMutation.isPending || updateEventMutation.isPending}
                >
                  {createEventMutation.isPending || updateEventMutation.isPending 
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