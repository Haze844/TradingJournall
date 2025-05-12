// client/src/components/auth/login-form.tsx
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { loginMutation } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie Benutzername und Passwort ein",
        variant: "destructive"
      });
      return;
    }

    try {
      await loginMutation.mutateAsync({ username, password });
      console.log("Login erfolgreich");
    } catch (error: any) {
      console.error("Login Fehler:", error);
      toast({
        title: "Login fehlgeschlagen",
        description: error.message || "Bitte versuchen Sie es erneut",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <Button 
        type="submit" 
        className="w-full"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Anmelden..." : "Anmelden"}
      </Button>
    </form>
  );
}