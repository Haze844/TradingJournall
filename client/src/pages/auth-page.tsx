import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";

export default function AuthPage() {
  const { user, loginMutation, registerMutation } = useAuth();
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Redirect if already logged in
  if (user) {
    navigate("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-background flex items-center">
      <div className="container grid md:grid-cols-2 gap-12 max-w-6xl mx-auto p-6">
        {/* Form Side */}
        <Card className="w-full">
          <CardHeader>
            <div className="flex items-center gap-2 mb-2">
              <div className="bg-white text-black font-bold p-1 text-xs">
                LVL<br />UP
              </div>
              <CardTitle className="text-xl">LvlUp Tradingtagebuch</CardTitle>
            </div>
            <CardDescription>
              Melden Sie sich an, um Ihre Trading-Performance zu analysieren.
            </CardDescription>
          </CardHeader>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="login">Anmelden</TabsTrigger>
              <TabsTrigger value="register">Registrieren</TabsTrigger>
            </TabsList>
            <LoginForm loginMutation={loginMutation} />
            <RegisterForm registerMutation={registerMutation} />
          </Tabs>
        </Card>

        {/* Hero Side */}
        <div className="hidden md:flex flex-col justify-center space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Optimieren Sie Ihr Trading</h1>
            <p className="text-muted-foreground text-lg">
              Verfolgen Sie Ihre Trades, analysieren Sie Ihre Performance 
              und erhalten Sie KI-gestützte Verbesserungsvorschläge.
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><polyline points="22 12 16 12 14 15 10 15 8 12 2 12"></polyline><path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"></path></svg>
              </div>
              <div>
                <h3 className="font-bold">Automatischer Import</h3>
                <p className="text-sm text-muted-foreground">
                  Synchronisieren Sie Ihre Trades direkt aus Tradovate.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M12 2v20M2 6h20M2 12h20M2 18h20"></path></svg>
              </div>
              <div>
                <h3 className="font-bold">Detaillierte Analysen</h3>
                <p className="text-sm text-muted-foreground">
                  Aufschlüsselung nach Setup, Trend, Symbol und mehr.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <div className="bg-primary/10 p-2 rounded-full">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"></path><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"></path></svg>
              </div>
              <div>
                <h3 className="font-bold">KI-Feedback</h3>
                <p className="text-sm text-muted-foreground">
                  Personalisierte Verbesserungsvorschläge für jeden Trade.
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
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
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
        </CardContent>
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={loginMutation.isPending}
          >
            {loginMutation.isPending ? "Anmeldung..." : "Anmelden"}
          </Button>
        </CardFooter>
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
        <CardFooter>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={registerMutation.isPending}
          >
            {registerMutation.isPending ? "Registrierung..." : "Registrieren"}
          </Button>
        </CardFooter>
      </form>
    </TabsContent>
  );
}