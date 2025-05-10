import { useAuth } from "../hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route, useLocation } from "wouter";
import { useEffect, useState } from "react";

// Maximale Anzahl erlaubter Weiterleitungen, um Endlosschleifen zu verhindern
const MAX_REDIRECTS = 2;

// Zähler für Weiterleitungen (wird über Komponenten-Neuinstanziierungen hinweg beibehalten)
let redirectCounter = 0;

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  // Hole den aktuellen Authentifizierungsstatus mit lokalem Fallback
  const { user, isLoading } = useAuth();
  
  // Erweiterte Debug-Info für geschützte Route
  console.log("Protected Route Check:", { 
    path, 
    isLoading, 
    isAuthenticated: !!user,
    username: user?.username || "none",
    localStorageUser: localStorage.getItem('tradingjournal_user') ? 'vorhanden' : 'nicht vorhanden'
  });
  
  // API Health-Check durchführen, um Session-Status zu prüfen
  useEffect(() => {
    if (!isLoading) {
      fetch('/api/health', { credentials: 'include' })
        .then(res => res.json())
        .then(data => {
          console.log("Session-Status von /api/health:", {
            authenticated: data.authenticated,
            sessionId: data.sessionId,
            hasCookies: data.hasCookies
          });
        })
        .catch(err => console.error("Health-Check fehlgeschlagen:", err));
    }
  }, [isLoading, path]);
  const [renderTimeout, setRenderTimeout] = useState(false);
  const [location] = useLocation();
  
  // Zeige den Loading-Indikator nach kurzem Timeout
  useEffect(() => {
    if (isLoading) {
      const timer = setTimeout(() => {
        setRenderTimeout(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);
  
  // Zähler zurücksetzen, wenn sich der Pfad ändert (nicht bei Weiterleitungsschleife)
  useEffect(() => {
    if (location !== "/auth" && location !== path) {
      console.log("Pfad geändert, setze Weiterleitungszähler zurück:", { location, path });
      redirectCounter = 0;
    }
  }, [location, path]);

  console.log("Protected Route Status:", { 
    path, 
    location,
    isLoading, 
    hasUser: !!user, 
    renderTimeout,
    redirectCounter 
  });

  // Zeige Loading-Indikator während der Authentifizierungsprüfung
  if (isLoading) {
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
    console.log("Nicht authentifiziert, Weiterleitungen:", redirectCounter);
    
    // Wenn wir die maximale Anzahl an Weiterleitungen erreicht haben, Fehlermeldung anzeigen
    if (redirectCounter >= MAX_REDIRECTS) {
      console.error("Maximale Anzahl an Weiterleitungen erreicht! Stoppe Weiterleitungsschleife.");
      return (
        <Route path={path}>
          <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-black to-slate-900 p-4">
            <div className="bg-red-500/20 text-white p-6 rounded-lg max-w-md text-center">
              <h2 className="text-xl font-bold mb-4">Weiterleitungsproblem erkannt</h2>
              <p className="mb-4">Es wurde eine mögliche Weiterleitungsschleife erkannt. Bitte versuche, dich manuell anzumelden.</p>
              <a href="/auth" className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md">
                Zur Anmeldeseite
              </a>
            </div>
          </div>
        </Route>
      );
    }
    
    // KRITISCHE ÄNDERUNG: Verwende window.location.href für harte Navigation 
    // statt wouter's Redirect, um Sitzungs-/Cookie-Probleme zu umgehen
    console.log("Verwende direkte window.location-Navigation zur Auth-Seite");
    
    // Bei Root-Route nicht mehr direkt zur Auth-Seite weiterleiten
    // ABSOLUT DIREKTE Navigation - keine Umwege beim Weiterleiten
    
    // Zähler erhöhen und zur Auth-Seite weiterleiten
    redirectCounter++;
    
    // Für die SimpleHome-Route eine spezielle Behandlung
    if (path === "/SimpleHome") {
      console.log("Spezielle Weiterleitung für /SimpleHome zur Auth-Seite");
      
      // Speichern, dass der Benutzer zu SimpleHome will, für spätere direkte Weiterleitung
      localStorage.setItem("redirectAfterLogin", "/SimpleHome");
    }
    
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }

  // Erfolg: Geschützte Komponente rendern
  console.log("Benutzer authentifiziert, zeige geschützte Komponente");
  return <Route path={path} component={Component} />;
}