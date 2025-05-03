import React, { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "../hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Rocket, TrendingUp, BarChart3, BrainCircuit, Lock, User, Loader2, Shield, Eye, EyeOff } from "lucide-react";
import { NxtLvlLogo } from "@/components/Header";
import { saveLoginCredentials, getSavedLoginCredentials, clearSavedLoginCredentials } from "@/lib/utils";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Nutze einen useEffect Hook für Redirects
  useEffect(() => {
    // Redirect if already logged in
    if (user) {
      navigate("/");
    }
  }, [user, navigate]);

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
        <div className="hidden md:flex flex-col justify-center space-y-8">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold">
              <span className="moon-text">Trade Smarter</span> <br />
              Not Harder
            </h1>
            <p className="text-xl text-muted-foreground">
              Unleash your inner diamond hands with AI-powered insights 💎
            </p>
          </div>

          <div className="space-y-6 mt-4">
            <div className="rocket-card p-4 rounded-xl flex items-center gap-4 backdrop-blur-md">
              <div className="bg-gradient-to-br from-primary to-primary/60 p-3 rounded-xl">
                <Rocket className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-white">One-Click CSV Import</h3>
                <p className="text-sm text-muted-foreground">
                  Import your trades directly from CSV files
                </p>
              </div>
            </div>
            
            <div className="rocket-card p-4 rounded-xl flex items-center gap-4 backdrop-blur-md">
              <div className="bg-gradient-to-br from-primary to-primary/60 p-3 rounded-xl">
                <TrendingUp className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-white">Track Performance</h3>
                <p className="text-sm text-muted-foreground">
                  Chart your journey to the moon in real-time
                </p>
              </div>
            </div>
            
            <div className="rocket-card p-4 rounded-xl flex items-center gap-4 backdrop-blur-md">
              <div className="bg-gradient-to-br from-primary to-primary/60 p-3 rounded-xl">
                <BrainCircuit className="h-6 w-6 text-black" />
              </div>
              <div>
                <h3 className="font-bold text-white">AI-Powered Insights</h3>
                <p className="text-sm text-muted-foreground">
                  GPT feedback to maximize those gains 📈
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
    
    // Anmeldedaten speichern, wenn "Eingeloggt bleiben" aktiviert ist
    if (formData.rememberMe) {
      saveLoginCredentials(formData.username, formData.password);
    } else {
      // Gespeicherte Daten löschen, wenn die Option deaktiviert wurde
      clearSavedLoginCredentials();
    }
    
    loginMutation.mutate(formData);
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwörter stimmen nicht überein",
        description: "Bitte überprüfe deine Eingaben",
        variant: "destructive",
      });
      return;
    }

    registerMutation.mutate({
      username: formData.username,
      password: formData.password,
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