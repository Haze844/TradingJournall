import { useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import Loader from "@/components/ui/loader";
import { LoginForm } from "@/components/auth/login-form";
import { RegisterForm } from "@/components/auth/register-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AuthPage() {
  const { user, isLoading, error } = useAuth();

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

  if (error) {
    console.error("❌ Fehler beim Abrufen des Benutzers:", error.message);
    return (
      <div className="flex h-screen items-center justify-center text-red-600">
        <p>Fehler: {error.message}</p>
      </div>
    );
  }

  return (
    <div className="flex h-screen items-center justify-center bg-gray-100">
      <div className="w-full max-w-md space-y-6 rounded-xl bg-white p-8 shadow-lg">
        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="login">Login</TabsTrigger>
            <TabsTrigger value="register">Registrieren</TabsTrigger>
          </TabsList>
          <TabsContent value="login">
            <LoginForm />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}