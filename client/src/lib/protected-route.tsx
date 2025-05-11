import { useAuth } from "../hooks/use-auth";
import { isRenderEnvironment, isReplitEnvironment } from "@/lib/env-detection";
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
  // Für Render-spezifischen Bypass: Prüfe direkt auf userId-Parameter
  const url = new URL(window.location.href);
  const userIdParam = url.searchParams.get('userId');
  const hasBypassParam = userIdParam === '2'; // Mo's ID
  
  // Hole den aktuellen Authentifizierungsstatus mit lokalem Fallback
  const { user, isLoading } = useAuth();
  
  // Wenn der userId-Parameter auf 2 gesetzt ist, erstellen wir einen "Mo"-Benutzer
  const effectiveUser = hasBypassParam 
    ? { id: 2, username: 'mo', createdAt: new Date().toISOString() } 
    : user;
  
  // Erweiterte Debug-Info für geschützte Route
  console.log("Protected Route Check:", { 
    path, 
    isLoading, 
    userIdParam,
    hasBypassParam, 
    isAuthenticated: !!(effectiveUser || user),
    username: (effectiveUser || user)?.username || "none",
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

  // Wenn nicht authentifiziert, prüfen ob wir den userId-Parameter haben
  if (!effectiveUser) {
    console.log("Nicht authentifiziert, Weiterleitungen:", redirectCounter);
    
    // Wenn wir den userId=2 Parameter haben, zeigen wir die Komponente trotzdem an
    if (hasBypassParam) {
      console.log("Render/Netlify-Umgebung: Authentifizierung via userId=2 Parameter");
      
      // Benutzer im localStorage für spätere Anfragen speichern
      const mockUser = { id: 2, username: 'mo', createdAt: new Date().toISOString() };
      localStorage.setItem('tradingjournal_user', JSON.stringify(mockUser));
      
      // Direkt die Komponente anzeigen und Auth-Bypass aktivieren
      return <Route path={path} component={Component} />;
    }
    
    // Überprüfe zuerst, ob wir einen lokalen Benutzer haben und in der Render/Replit-Umgebung sind
    const isRender = isRenderEnvironment();
    const isReplit = isReplitEnvironment();
    const localUserString = localStorage.getItem('tradingjournal_user');
    
    if ((isRender || isReplit) && localUserString) {
      // In Render/Replit-Umgebung mit lokalem Benutzer - versuche lokale Authentifizierung
      try {
        const localUser = JSON.parse(localUserString);
        console.log(`Lokaler Benutzer in ${isReplit ? 'Replit' : 'Render'}-Umgebung gefunden:`, localUser.username);
        
        // Für Render/Replit-Umgebung: Komponente direkt rendern mit lokalem Benutzer
        console.log(`${isReplit ? 'Replit' : 'Render'}-Umgebung: Verwende lokale Authentifizierung ohne Weiterleitung`);
        return <Route path={path} component={Component} />;
      } catch (e) {
        console.error("Fehler beim Verarbeiten des lokalen Benutzers:", e);
      }
    }
    
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
    
    // OPTIMIERTE WEITERLEITUNG: Nur einmal zählen und aktuellen Pfad für Rückkehr speichern
    redirectCounter++;
    
    // Ziel-Pfad für spätere Weiterleitung nach Login speichern
    // aber nur wenn es kein Auth-Pfad ist (würde sonst Endlosschleife verursachen)
    if (path !== "/auth" && path !== "/") {
      console.log(`Speichere ursprüngliches Ziel für Weiterleitung nach Login: ${path}`);
      localStorage.setItem("redirectAfterLogin", path);
    }
    
    // Spezielle Behandlung für Render/Replit-Umgebung
    if (isRender || isReplit) {
      console.log(`${isReplit ? 'Replit' : 'Render'}-Umgebung: Verwende direkte window.location Navigation für maximale Stabilität`);
      // Normalisiere URL: Stelle sicher, dass wir nur '/auth' verwenden (ohne Slash am Ende)
      const authPath = window.location.pathname.endsWith('/auth/') ? '/auth' : '/auth';
      window.location.href = authPath;
      return <div></div>; // Leeres Div während Weiterleitung
    }
    
    // Für andere Umgebungen: Normale wouter-Navigation verwenden
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