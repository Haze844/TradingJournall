import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, User, UserPlus } from "lucide-react";

export function RegisterForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    passwordConfirm: "",
  });
  const { registerMutation } = useAuth();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password || !formData.passwordConfirm) {
      toast({
        title: "Fehler",
        description: "Bitte füllen Sie alle Felder aus",
        variant: "destructive"
      });
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      toast({
        title: "Fehler",
        description: "Die Passwörter stimmen nicht überein",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Registrierung wird verarbeitet",
      description: "Ihr Konto wird erstellt...",
    });

    registerMutation.mutate(
      { username: formData.username, password: formData.password },
      {
        onError: (error: any) => {
          console.error("Registrierungsfehler:", error);
          toast({
            title: "Registrierung fehlgeschlagen",
            description: error.message || "Bitte versuchen Sie es erneut",
            variant: "destructive",
          });
        },
        onSuccess: (data: any) => {
          console.log("Registrierung erfolgreich:", data);
          toast({
            title: "Registrierung erfolgreich",
            description: `Willkommen, ${data.username}!`,
          });
          // Die Weiterleitung erfolgt automatisch über useEffect in der AuthPage
        }
      }
    );
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="register-username" className="font-medium">
          <User className="w-4 h-4 inline-block mr-2 opacity-70" />
          Benutzername
        </Label>
        <Input 
          id="register-username" 
          name="username" 
          value={formData.username}
          onChange={handleChange}
          required 
          placeholder="Wählen Sie einen Benutzernamen"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-password" className="font-medium">
          <Lock className="w-4 h-4 inline-block mr-2 opacity-70" />
          Passwort
        </Label>
        <Input 
          id="register-password" 
          name="password" 
          type="password" 
          value={formData.password}
          onChange={handleChange}
          required 
          placeholder="Passwort festlegen"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="register-password-confirm" className="font-medium">
          <Lock className="w-4 h-4 inline-block mr-2 opacity-70" />
          Passwort bestätigen
        </Label>
        <Input 
          id="register-password-confirm" 
          name="passwordConfirm" 
          type="password" 
          value={formData.passwordConfirm}
          onChange={handleChange}
          required 
          placeholder="Passwort wiederholen"
        />
      </div>
      
      <Button 
        type="submit" 
        className="w-full mt-6"
        disabled={registerMutation.isPending}
      >
        {registerMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Registrieren...
          </>
        ) : (
          <>
            <UserPlus className="mr-2 h-4 w-4" />
            Registrieren
          </>
        )}
      </Button>
    </form>
  );
}