import { useAuth } from "../hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";
import { useEffect, useState } from "react";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();
  const [renderTimeout, setRenderTimeout] = useState(false);
  
  // Zeige den Loading-Indikator nach kurzem Timeout
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setRenderTimeout(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  console.log("Protected Route Status:", { path, isLoading, hasUser: !!user, renderTimeout });

  // Zeige Loading-Indikator während der Authentifizierungsprüfung
  if (isLoading || renderTimeout) {
    return (
      <Route path={path}>
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black to-slate-900 p-4">
          <div className="text-blue-400 mb-4 text-center">
            <Loader2 className="h-16 w-16 animate-spin mx-auto mb-4" />
            <h2 className="text-xl font-bold">Lade Trading Journal...</h2>
            <p className="text-sm text-blue-300 mt-2">Verbindung zum Profil wird hergestellt</p>
          </div>
        </div>
      </Route>
    );
  }

  // Wenn nicht eingeloggt, zum Auth-Formular weiterleiten
  if (!user) {
    console.log("Not authenticated, redirecting to /auth");
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Geschützte Komponente rendern
  console.log("User authenticated, rendering protected component");
  return <Route path={path} component={Component} />;
}