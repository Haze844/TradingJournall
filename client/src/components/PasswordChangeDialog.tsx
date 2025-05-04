import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Lock, AlertCircle, CheckCircle2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type PasswordChangeDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function PasswordChangeDialog({ open, onOpenChange }: PasswordChangeDialogProps) {
  const { toast } = useToast();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Passwortstärke validieren
  const validatePassword = (password: string): boolean => {
    // Mind. 8 Zeichen, mind. ein Buchstabe und eine Zahl
    return password.length >= 8 && /[A-Za-z]/.test(password) && /[0-9]/.test(password);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validierungen
    if (!currentPassword || !newPassword || !confirmPassword) {
      setError("Bitte fülle alle Felder aus.");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Die neuen Passwörter stimmen nicht überein.");
      return;
    }

    if (!validatePassword(newPassword)) {
      setError("Das neue Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Buchstaben und eine Zahl enthalten.");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Fehler beim Ändern des Passworts');
      }

      // Erfolgreich geändert
      toast({
        title: "Passwort erfolgreich geändert",
        description: "Dein Passwort wurde erfolgreich aktualisiert.",
        variant: "success",
      });
      
      // Dialog schließen und Formular zurücksetzen
      onOpenChange(false);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (err: any) {
      setError(err.message || 'Ein unbekannter Fehler ist aufgetreten.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md backdrop-blur-xl bg-blue-950/90 border-blue-400/30 text-blue-50">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-blue-50">
            <Lock className="h-5 w-5 text-blue-300" />
            Passwort ändern
          </DialogTitle>
          <DialogDescription className="text-blue-200">
            Bitte gib dein aktuelles Passwort und zweimal dein neues Passwort ein.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {error && (
            <div className="bg-red-900/30 border border-red-500/50 text-red-200 p-3 rounded-md flex items-start gap-2 text-sm">
              <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="currentPassword" className="text-blue-200">
              Aktuelles Passwort
            </Label>
            <Input 
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="bg-blue-900/50 border-blue-400/30 text-blue-50"
              placeholder="••••••••"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="newPassword" className="text-blue-200">
              Neues Passwort
            </Label>
            <Input 
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="bg-blue-900/50 border-blue-400/30 text-blue-50"
              placeholder="••••••••"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-blue-200">
              Neues Passwort bestätigen
            </Label>
            <Input 
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-blue-900/50 border-blue-400/30 text-blue-50"
              placeholder="••••••••"
            />
            
            {newPassword && confirmPassword && newPassword === confirmPassword ? (
              <div className="text-sm text-green-300 flex items-center gap-1 mt-1">
                <CheckCircle2 className="h-4 w-4" /> Passwörter stimmen überein
              </div>
            ) : null}
            
            {newPassword && (
              <div className="text-xs text-blue-300 mt-1">
                Das Passwort muss mindestens 8 Zeichen lang sein und mindestens einen Buchstaben und eine Zahl enthalten.
              </div>
            )}
          </div>
          
          <DialogFooter className="pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="border-blue-500/30 text-blue-200 hover:bg-blue-800/50"
            >
              Abbrechen
            </Button>
            <Button 
              type="submit" 
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-500 text-white"
            >
              {isSubmitting ? "Ändere..." : "Passwort ändern"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}