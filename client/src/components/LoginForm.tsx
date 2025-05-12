import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export default function LoginForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const { loginMutation } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();

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
      toast({
        title: "Login erfolgreich",
        description: "Sie werden weitergeleitet...",
      });
      navigate("/simplehome", { replace: true });
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
        <Label htmlFor="username" className="block text-sm font-medium mb-1">
          Benutzername
        </Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white"
          placeholder="Benutzername eingeben"
        />
      </div>
      
      <div>
        <Label htmlFor="password" className="block text-sm font-medium mb-1">
          Passwort
        </Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full bg-neutral-800 border border-neutral-700 rounded-md p-2 text-white"
          placeholder="Passwort eingeben"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? "Anmelden..." : "Anmelden"}
      </Button>
    </form>
  );
}