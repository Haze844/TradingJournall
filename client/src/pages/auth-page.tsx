import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Loader from "@/components/ui/loader";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    if (user) {
      console.log("✅ Authentifizierter Benutzer gefunden, leite weiter:", user.username);
      window.location.href = "/SimpleHome"; // Direktweiterleitung
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <Loader />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    if (!username || !password) {
      setError("Bitte geben Sie Benutzername und Passwort ein");
      return;
    }
    
    try {
      // Hier würde die Logik für Login/Register stehen
      console.log(isLogin ? "Login mit:" : "Registrierung mit:", { username, password });
    } catch (err: any) {
      setError(err.message || "Ein Fehler ist aufgetreten");
    }
  };

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg">
        <Tabs defaultValue="login" className="w-full" onValueChange={(value) => setIsLogin(value === "login")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registrieren</TabsTrigger>
          </TabsList>
          
          <TabsContent value="login" className="pt-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="username">Benutzername</Label>
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <Button type="submit" className="w-full">
                  Anmelden
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="register" className="pt-4">
            <form onSubmit={handleSubmit}>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="reg-username">Benutzername</Label>
                  <Input
                    id="reg-username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="reg-password">Passwort</Label>
                  <Input
                    id="reg-password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                  />
                </div>
                {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
                <Button type="submit" className="w-full">
                  Registrieren
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}