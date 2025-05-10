import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/ui/card";
import { Label } from "../components/ui/label";
import { Checkbox } from "../components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { useToast } from "../hooks/use-toast";
import { Rocket, TrendingUp, BarChart3, BrainCircuit, Lock, User, Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { NxtLvlLogo } from "../components/Header";
import { saveLoginCredentials, getSavedLoginCredentials, clearSavedLoginCredentials } from "../lib/utils";

export default function AuthPage() {
  const { user, isLoading, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Kombinierter useEffect für Logging und vereinfachte Weiterleitung
  useEffect(() => {
    // Log zum Debuggen
    console.log("Auth Page Status: User=", !!user, "isLoading=", isLoading);
    
    // Überprüfe die App-Umgebung für Debug-Zwecke
    const isNetlify = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com');
    const isRender = window.location.hostname.includes('onrender.com');
    
    if (isNetlify || isRender) {
      console.log("Deployment-Umgebung erkannt in Auth-Page:", { isNetlify, isRender });
      
      // In Render-Umgebung besonders vorsichtig mit Weiterleitungen sein
      if (isRender) {
        console.log("Render-spezifisches Verhalten für Auth-Seite aktiviert");
        
        // Prüfen auf lokalen Benutzer, auch ohne API-Benutzer
        try {
          const storedUserData = localStorage.getItem('tradingjournal_user');
          
          if (storedUserData && !user && !isLoading) {
            // Wir haben lokale Daten, aber keinen API-Benutzer
            const parsedUser = JSON.parse(storedUserData);
            console.log("Lokaler Benutzer in Render-Umgebung gefunden:", parsedUser.username);
            
            // Direkte manuelle Navigation (ohne wouter), um Probleme zu vermeiden
            console.log("Verwende direkte window.location Weiterleitung für stabile Navigation in Render");
            window.location.href = "/SimpleHome"; 
            return;
          }
        } catch (e) {
          console.error("Fehler beim Überprüfen lokaler Benutzerdaten:", e);
        }
      }
    }

    // Debug-Log für Authentifizierungsstatus
    if (user && !isLoading) {
      console.log("Benutzer bereits eingeloggt:", user.username);
      
      // Wenn es ein gespeichertes Weiterleitungsziel gibt, dorthin navigieren
      const savedRedirect = localStorage.getItem("redirectAfterLogin");
      const redirectTarget = savedRedirect || "/SimpleHome";
      
      console.log("Bereits eingeloggt - navigiere zu:", redirectTarget);
      
      // Weiterleitungsinfo aus dem LocalStorage entfernen
      localStorage.removeItem("redirectAfterLogin");
      
      // Kurze Verzögerung für stabilere Navigation
      if (isRender) {
        // In Render direkte Navigation verwenden für maximale Stabilität
        window.location.href = redirectTarget;
      } else {
        // Für andere Umgebungen normale wouter-Navigation verwenden
        setTimeout(() => {
          navigate(redirectTarget);
        }, 100);
      }
    } else if (!isLoading) {
      console.log("Nicht eingeloggt - zeige Login-Formular");
    }
  }, [user, isLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
      <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"></div>
      <div className="absolute top-1/3 left-1/3 w-40 h-40 bg-blue-500/10 rounded-full blur-3xl"></div>
      
      <div className="container grid md:grid-cols-2 gap-12 max-w-6xl mx-auto p-6 z-10">
        {/* Form Side */}
        <div className="rocket-card rounded-xl p-6 backdrop-blur-md">
          <div className="mb-8">
            <div className="mb-4">
              <NxtLvlLogo className="group" />
              <p className="text-xs text-blue-300 mt-2">Trading-Performance optimieren</p>
            </div>
            <p className="text-muted-foreground">
              Melde dich an, um deine Trades zu verfolgen! 🚀
            </p>
          </div>
          
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-black/40 mb-6">
              <TabsTrigger 
                value="login" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium"
              >
                Login
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="data-[state=active]:bg-primary/20 data-[state=active]:text-primary font-medium"
              >
                Register
              </TabsTrigger>
            </TabsList>
            <LoginForm loginMutation={loginMutation} />
            <RegisterForm registerMutation={registerMutation} />
          </Tabs>
        </div>

        {/* Hero Side */}
        <div className="hidden md:flex flex-col justify-center space-y-8 relative">
          {/* Animierte Hintergrundeffekte */}
          <div className="absolute -z-10 left-20 top-10 w-32 h-32 bg-blue-500/5 rounded-full blur-xl animate-pulse"></div>
          <div className="absolute -z-10 right-10 bottom-20 w-40 h-40 bg-primary/5 rounded-full blur-xl animate-pulse" style={{ animationDuration: '8s', animationDelay: '2s' }}></div>
          
          <div className="space-y-4 relative">
            <h1 className="text-5xl font-bold tracking-tight">
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-primary">Trade Smarter</span> <br />
              <span className="text-white">Gewinne maximieren</span>
            </h1>
            <p className="text-xl text-blue-200/80 max-w-md">
              Deine Trading-Performance auf ein neues Level bringen mit intelligenten Analysen und Erkenntnissen 🚀
            </p>
          </div>

          <div className="space-y-5 mt-4 relative z-10">
            <div className="rocket-card p-5 rounded-xl flex items-center gap-5 backdrop-blur-md border border-blue-500/10 transition-all duration-300 hover:border-blue-400/20 hover:shadow-lg hover:shadow-blue-900/10 group">
              <div className="bg-gradient-to-br from-blue-500 to-primary p-3 rounded-xl group-hover:shadow-md group-hover:shadow-blue-400/20 transition-all">
                <Rocket className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">CSV-Import mit einem Klick</h3>
                <p className="text-sm text-blue-200/70">
                  Importiere deine Trades direkt aus TradingView oder anderen Plattformen
                </p>
              </div>
            </div>
            
            <div className="rocket-card p-5 rounded-xl flex items-center gap-5 backdrop-blur-md border border-blue-500/10 transition-all duration-300 hover:border-blue-400/20 hover:shadow-lg hover:shadow-blue-900/10 group">
              <div className="bg-gradient-to-br from-blue-500 to-primary p-3 rounded-xl group-hover:shadow-md group-hover:shadow-blue-400/20 transition-all">
                <TrendingUp className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">Performance-Tracking</h3>
                <p className="text-sm text-blue-200/70">
                  Detaillierte Statistiken und Visualisierungen für bessere Trading-Entscheidungen
                </p>
              </div>
            </div>
            
            <div className="rocket-card p-5 rounded-xl flex items-center gap-5 backdrop-blur-md border border-blue-500/10 transition-all duration-300 hover:border-blue-400/20 hover:shadow-lg hover:shadow-blue-900/10 group">
              <div className="bg-gradient-to-br from-blue-500 to-primary p-3 rounded-xl group-hover:shadow-md group-hover:shadow-blue-400/20 transition-all">
                <BrainCircuit className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-white text-lg">KI-basierte Erkenntnisse</h3>
                <p className="text-sm text-blue-200/70">
                  Präzise Handlungsempfehlungen zur Steigerung deiner Erfolgsquote
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoginForm({ loginMutation }: { loginMutation: any }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false
  });
  const { toast } = useToast();
  const [, navigate] = useLocation();

  // Beim Start gespeicherte Anmeldedaten abrufen, falls vorhanden
  useEffect(() => {
    try {
      const savedCredentials = getSavedLoginCredentials();
      if (savedCredentials) {
        setFormData(prev => ({
          ...prev,
          username: savedCredentials.username,
          password: savedCredentials.password,
          rememberMe: true
        }));
        toast({
          title: "Gespeicherte Anmeldedaten geladen",
          description: "Deine Anmeldedaten wurden wiederhergestellt.",
          variant: "default",
        });
      }
    } catch (error) {
      console.error("Fehler beim Laden der gespeicherten Anmeldedaten:", error);
      // Bei Fehlern die gespeicherten Daten löschen
      clearSavedLoginCredentials();
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Debug-Informationen für Authentifizierungsprobleme
    console.log("Login-Versuch für:", formData.username, "mit rememberMe:", formData.rememberMe);
    console.log("Browser-Info:", {
      userAgent: navigator.userAgent,
      cookiesEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      host: window.location.host,
      protocol: window.location.protocol
    });
    
    // Anmeldedaten speichern, wenn "Eingeloggt bleiben" aktiviert ist
    if (formData.rememberMe) {
      saveLoginCredentials(formData.username, formData.password);
    } else {
      // Gespeicherte Daten löschen, wenn die Option deaktiviert wurde
      clearSavedLoginCredentials();
    }
    
    // Toast-Benachrichtigung vor dem Login
    toast({
      title: "Login wird verarbeitet",
      description: "Verbindung zum Server wird hergestellt...",
      variant: "default",
    });
    
    // Erweiterte Fehlerbehandlung für Login-Mutation
    loginMutation.mutate(formData, {
      onError: (error: any) => {
        console.error("Login-Fehler:", error);
        
        // Detaillierte Fehlermeldung für Benutzer
        toast({
          title: "Login fehlgeschlagen",
          description: error.message || "Verbindungsproblem mit dem Server. Bitte versuche es erneut.",
          variant: "destructive",
        });
      },
      onSuccess: (data: any) => {
        console.log("Login erfolgreich:", data);
        
        // Benutzer im localStorage speichern für Render-Umgebung
        try {
          localStorage.setItem('tradingjournal_user', JSON.stringify({
            id: data.id,
            username: data.username,
            timestamp: new Date().toISOString()
          }));
          console.log("Benutzer im localStorage gespeichert für Render-Fallback-Mechanismus");
        } catch (e) {
          console.error("Fehler beim Speichern im localStorage:", e);
        }
        
        toast({
          title: "Login erfolgreich",
          description: `Willkommen zurück, ${data.username}!`,
          variant: "default",
        });
        
        // Prüfen, ob ein spezifisches Weiterleitungsziel gespeichert ist
        const savedRedirect = localStorage.getItem("redirectAfterLogin");
        
        // ABSOLUT DIREKTE Navigation zu SimpleHome ohne Zwischenseite
        console.log("Login erfolgreich - DIREKTE Weiterleitung ohne Umwege", 
                   savedRedirect ? `zu gespeichertem Ziel: ${savedRedirect}` : "zu SimpleHome");
        
        // Gespeichertes Ziel verwenden oder direkt zu SimpleHome
        const redirectTarget = savedRedirect || "/SimpleHome";
        
        // Weiterleitungsinformation aus dem LocalStorage entfernen
        localStorage.removeItem("redirectAfterLogin");
        
        // Spezielle Behandlung für Render-Umgebung
        const isRender = window.location.hostname.includes('onrender.com');
        
        if (isRender) {
          console.log("Render-Umgebung: Verwende direkte window.location Navigation für maximale Stabilität");
          // Hardcoded Navigations-Fix für Render-Umgebung
          window.location.href = redirectTarget;
        } else {
          // Für andere Umgebungen normale wouter-Navigation verwenden
          navigate(redirectTarget);
        }
      }
    });
  };

  return (
    <TabsContent value="login">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-blue-100 font-medium">
              <User className="w-4 h-4 inline-block mr-2 opacity-70" />
              Benutzername
            </Label>
            <Input 
              id="username" 
              name="username" 
              value={formData.username}
              onChange={handleChange}
              required 
              className="bg-black/40 border-blue-500/20 focus:border-blue-400/50 focus:ring-blue-400/20 text-blue-50"
              placeholder="Gib deinen Benutzernamen ein"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password" className="text-blue-100 font-medium">
              <Lock className="w-4 h-4 inline-block mr-2 opacity-70" />
              Passwort
            </Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              required 
              className="bg-black/40 border-blue-500/20 focus:border-blue-400/50 focus:ring-blue-400/20 text-blue-50"
              placeholder="Gib dein Passwort ein"
            />
          </div>
          <div className="flex items-center space-x-2 mt-4 bg-blue-900/20 p-2 rounded-md border border-blue-500/10">
            <Checkbox 
              id="rememberMe" 
              name="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => {
                setFormData(prev => ({ ...prev, rememberMe: !!checked }));
              }}
              className="data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
            />
            <Label 
              htmlFor="rememberMe" 
              className="text-sm font-medium cursor-pointer text-blue-200"
            >
              Zugangsdaten merken
            </Label>
          </div>
        </CardContent>
        <div className="px-6 py-4">
          <Button 
            type="submit" 
            className="w-full pulse-btn bg-gradient-to-r from-primary to-blue-400 hover:from-primary hover:to-blue-300 text-black font-bold relative overflow-hidden group" 
            disabled={loginMutation.isPending}
          >
            <div className="absolute inset-0 bg-blue-300/20 w-1/3 h-full transform -skew-x-12 -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000"></div>
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Anmelden...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Trading Dashboard starten 🚀
              </>
            )}
          </Button>
        </div>
      </form>
    </TabsContent>
  );
}

function RegisterForm({ registerMutation }: { registerMutation: any }) {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const { toast } = useToast();
  const [, navigate] = useLocation();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Debug-Informationen für Registrierungsprobleme
    console.log("Registrierungsversuch für:", formData.username);
    console.log("Browser-Info:", {
      userAgent: navigator.userAgent,
      cookiesEnabled: navigator.cookieEnabled,
      language: navigator.language,
      platform: navigator.platform,
      host: window.location.host,
      protocol: window.location.protocol
    });

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwörter stimmen nicht überein",
        description: "Bitte überprüfe deine Eingaben",
        variant: "destructive",
      });
      return;
    }

    // Toast-Benachrichtigung vor der Registrierung
    toast({
      title: "Registrierung wird verarbeitet",
      description: "Dein Konto wird erstellt...",
      variant: "default",
    });
    
    // Erweiterte Fehlerbehandlung für Registrierungs-Mutation
    registerMutation.mutate({
      username: formData.username,
      password: formData.password,
    }, {
      onError: (error: any) => {
        console.error("Registrierungsfehler:", error);
        
        // Detaillierte Fehlermeldung für Benutzer
        toast({
          title: "Registrierung fehlgeschlagen",
          description: error.message || "Fehler bei der Kontoerstellung. Bitte versuche es erneut.",
          variant: "destructive",
        });
      },
      onSuccess: (data: any) => {
        console.log("Registrierung erfolgreich:", data);
        
        // Benutzer im localStorage speichern für Render-Umgebung
        try {
          localStorage.setItem('tradingjournal_user', JSON.stringify({
            id: data.id,
            username: data.username,
            timestamp: new Date().toISOString()
          }));
          console.log("Benutzer im localStorage gespeichert für Render-Fallback-Mechanismus");
        } catch (e) {
          console.error("Fehler beim Speichern im localStorage:", e);
        }
        
        toast({
          title: "Konto erstellt",
          description: `Willkommen bei TradingJournal, ${data.username}!`,
          variant: "default",
        });
        
        // Prüfen, ob ein spezifisches Weiterleitungsziel gespeichert ist
        const savedRedirect = localStorage.getItem("redirectAfterLogin");
        const redirectTarget = savedRedirect || "/SimpleHome";
        
        // Weiterleitungsinformation aus dem LocalStorage entfernen
        localStorage.removeItem("redirectAfterLogin");
        
        // Spezielle Behandlung für Render-Umgebung
        const isRender = window.location.hostname.includes('onrender.com');
        
        if (isRender) {
          console.log("Render-Umgebung: Verwende direkte window.location Navigation für maximale Stabilität");
          // Hardcoded Navigations-Fix für Render-Umgebung
          window.location.href = redirectTarget;
        } else {
          // Für andere Umgebungen normale wouter-Navigation verwenden
          navigate(redirectTarget);
        }
      }
    });
  };

  return (
    <TabsContent value="register">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="username-register" className="text-blue-100 font-medium">
              <User className="w-4 h-4 inline-block mr-2 opacity-70" />
              Wähle einen Benutzernamen
            </Label>
            <Input 
              id="username-register" 
              name="username" 
              value={formData.username}
              onChange={handleChange}
              required 
              className="bg-black/40 border-blue-500/20 focus:border-blue-400/50 focus:ring-blue-400/20 text-blue-50"
              placeholder="Dein gewünschter Benutzername"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password-register" className="text-blue-100 font-medium">
              <Shield className="w-4 h-4 inline-block mr-2 opacity-70" />
              Passwort
            </Label>
            <div className="relative">
              <Input 
                id="password-register" 
                name="password" 
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                required 
                className="bg-black/40 border-blue-500/20 focus:border-blue-400/50 focus:ring-blue-400/20 text-blue-50 pr-10"
                placeholder="Wähle ein sicheres Passwort"
                minLength={6}
              />
              <button 
                type="button" 
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-blue-200 hover:text-blue-100"
                onClick={togglePasswordVisibility}
              >
                {showPassword ? 
                  <EyeOff className="h-4 w-4" /> : 
                  <Eye className="h-4 w-4" />
                }
              </button>
            </div>
            <p className="text-xs text-blue-300/70">Mindestens 6 Zeichen empfohlen</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirm-password" className="text-blue-100 font-medium">
              <Lock className="w-4 h-4 inline-block mr-2 opacity-70" />
              Passwort bestätigen
            </Label>
            <Input 
              id="confirm-password" 
              name="confirmPassword" 
              type={showPassword ? "text" : "password"}
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
              className="bg-black/40 border-blue-500/20 focus:border-blue-400/50 focus:ring-blue-400/20 text-blue-50"
              placeholder="Passwort wiederholen"
            />
          </div>

          <div className="rounded-md p-3 bg-blue-900/20 border border-blue-500/10 mt-4">
            <p className="text-xs text-blue-200">
              Mit der Erstellung eines Kontos akzeptierst du unsere Nutzungsbedingungen und Datenschutzrichtlinien. Deine Trading-Daten werden vertraulich behandelt und nur zur Verbesserung deiner Performance verwendet.
            </p>
          </div>
        </CardContent>
        <div className="px-6 py-4">
          <Button 
            type="submit" 
            className="w-full pulse-btn bg-gradient-to-r from-primary to-blue-400 hover:from-primary hover:to-blue-300 text-black font-bold relative overflow-hidden group" 
            disabled={registerMutation.isPending}
          >
            <div className="absolute inset-0 bg-blue-300/20 w-1/3 h-full transform -skew-x-12 -translate-x-full group-hover:translate-x-[400%] transition-transform duration-1000"></div>
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Konto wird erstellt...
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Trading-Konto erstellen
              </>
            )}
          </Button>
        </div>
      </form>
    </TabsContent>
  );
}