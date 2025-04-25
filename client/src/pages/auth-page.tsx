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
import { Rocket, TrendingUp, BarChart3, BrainCircuit, Lock, User, Loader2 } from "lucide-react";

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
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-white text-black font-bold p-2 rounded-xl text-lg meme-logo">
                LVL<br />UP
              </div>
              <div>
                <h1 className="text-2xl font-extrabold moon-text">LvlUp Tradingtagebuch</h1>
                <p className="text-xs text-gray-400">Trading-Performance optimieren</p>
              </div>
            </div>
            <p className="text-muted-foreground">
              Sign in to track your trades and prepare for liftoff! 🚀
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

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loginMutation.mutate(formData);
  };

  return (
    <TabsContent value="login">
      <form onSubmit={handleSubmit}>
        <CardContent className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="username">Benutzername</Label>
            <Input 
              id="username" 
              name="username" 
              value={formData.username}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Passwort</Label>
            <Input 
              id="password" 
              name="password" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="flex items-center space-x-2 mt-3">
            <Checkbox 
              id="rememberMe" 
              name="rememberMe"
              checked={formData.rememberMe}
              onCheckedChange={(checked) => {
                setFormData(prev => ({ ...prev, rememberMe: !!checked }));
              }}
            />
            <Label 
              htmlFor="rememberMe" 
              className="text-sm font-medium cursor-pointer"
            >
              Eingeloggt bleiben
            </Label>
          </div>
        </CardContent>
        <div className="px-6 py-4">
          <Button 
            type="submit" 
            className="w-full pulse-btn bg-gradient-to-r from-primary to-blue-400 hover:from-primary hover:to-blue-300 text-black font-bold" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Preparing for Launch...
              </>
            ) : (
              <>
                <Lock className="mr-2 h-4 w-4" />
                Launch to Dashboard 🚀
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
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwörter stimmen nicht überein",
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
            <Label htmlFor="username-register">Benutzername</Label>
            <Input 
              id="username-register" 
              name="username" 
              value={formData.username}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password-register">Passwort</Label>
            <Input 
              id="password-register" 
              name="password" 
              type="password" 
              value={formData.password}
              onChange={handleChange}
              required 
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirm-password">Passwort bestätigen</Label>
            <Input 
              id="confirm-password" 
              name="confirmPassword" 
              type="password" 
              value={formData.confirmPassword}
              onChange={handleChange}
              required 
            />
          </div>
        </CardContent>
        <div className="px-6 py-4">
          <Button 
            type="submit" 
            className="w-full pulse-btn bg-gradient-to-r from-primary to-blue-400 hover:from-primary hover:to-blue-300 text-black font-bold" 
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Konto wird erstellt...
              </>
            ) : (
              <>
                <User className="mr-2 h-4 w-4" />
                Konto erstellen
              </>
            )}
          </Button>
        </div>
      </form>
    </TabsContent>
  );
}