import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import LoginForm from "@/components/LoginForm";

export default function AuthPage() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    // Wenn ein User existiert und nicht geladen wird, weiterleiten
    if (!isLoading && user) {
      navigate("/simplehome", { replace: true });
    }
  }, [user, isLoading, navigate]);

  // Während des Ladens nichts anzeigen
  if (isLoading) return <div className="text-center mt-8 text-gray-400">Lade Authentifizierung...</div>;

  // Wenn kein User -> Login-Formular anzeigen
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="w-full max-w-md p-6 bg-neutral-900 rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold mb-4 text-center">Login</h1>
        <LoginForm />
      </div>
    </div>
  );
}