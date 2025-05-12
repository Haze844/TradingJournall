// client/src/components/auth/register-form.tsx
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

export function RegisterForm() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const { registerMutation } = useAuth();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password || !passwordConfirm) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive"
      });
      return;
    }

    if (password !== passwordConfirm) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein",
        variant: "destructive"
      });
      return;
    }

    try {
      await registerMutation.mutateAsync({ username, password });
      console.log("Registrierung erfolgreich");
    } catch (error: any) {
      console.error("Registrierungsfehler:", error);
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message || "Bitte versuchen Sie es erneut",
        variant: "destructive"
      });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
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
      <div>
        <Label htmlFor="reg-password-confirm">Passwort bestätigen</Label>
        <Input
          id="reg-password-confirm"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          className="mt-1"
        />
      </div>
      <Button 
        type="submit" 
        className="w-full"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? "Registrieren..." : "Registrieren"}
      </Button>
    </form>
  );
}