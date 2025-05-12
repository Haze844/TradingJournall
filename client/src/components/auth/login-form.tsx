import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Lock, User } from "lucide-react";

export function LoginForm() {
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: false
  });
  const { loginMutation } = useAuth();
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.username || !formData.password) {
      toast({
        title: "Fehler",
        description: "Bitte geben Sie Benutzername und Passwort ein",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Login wird verarbeitet",
      description: "Verbindung zum Server wird hergestellt...",
    });

    loginMutation.mutate(formData, {
      onError: (error: any) => {
        console.error("Login-Fehler:", error);
        toast({
          title: "Login fehlgeschlagen",
          description: error.message || "Verbindungsproblem mit dem Server. Bitte versuche es erneut.",
          variant: "destructive",
        });
      },
      onSuccess: (data: any) => {
        console.log("Login erfolgreich:", data);
        toast({
          title: "Login erfolgreich",
          description: `Willkommen zurück, ${data.username}!`,
        });
        // Die Weiterleitung erfolgt automatisch über useEffect in der AuthPage
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 py-4">
      <div className="space-y-2">
        <Label htmlFor="username" className="font-medium">
          <User className="w-4 h-4 inline-block mr-2 opacity-70" />
          Benutzername
        </Label>
        <Input 
          id="username" 
          name="username" 
          value={formData.username}
          onChange={handleChange}
          required 
          placeholder="Benutzername eingeben"
        />
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="password" className="font-medium">
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
          placeholder="Passwort eingeben"
        />
      </div>
      
      <div className="flex items-center space-x-2 mt-4">
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
          Zugangsdaten merken
        </Label>
      </div>
      
      <Button 
        type="submit" 
        className="w-full mt-6"
        disabled={loginMutation.isPending}
      >
        {loginMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Anmelden...
          </>
        ) : (
          "Anmelden"
        )}
      </Button>
    </form>
  );
}