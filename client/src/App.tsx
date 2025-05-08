import { Switch, Route, Link, useLocation } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "./components/ui/tooltip";
import { Toaster } from "./components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";

import NotFound from "./pages/not-found";
// import Home from "./pages/Home";
import SimpleHome from "./pages/SimpleHome";
import AuthPage from "./pages/auth-page";
import { ProtectedRoute } from "./lib/protected-route";
import PersonalCoach from "./components/PersonalCoach";
import MacroEconomicCalendar from "./components/MacroEconomicCalendar";
import SocialTrading from "./components/SocialTrading";
import Booklet from "./components/Booklet";
import { useEffect } from "react";

function Router() {
  // Erkennen, ob wir in Netlify-Umgebung sind
  const isNetlify = window.location.hostname.includes('netlify') || 
                    window.location.hostname.includes('aquamarine-lolly-174f9a');
  console.log("Router geladen, Netlify-Umgebung erkannt:", isNetlify);
  
  // Direkt zur Auth-Seite umleiten in Netlify-Umgebung (temporär zum Testen)
  if (isNetlify) {
    return (
      <Switch>
        <Route path="/auth" component={AuthPage} />
        <Route path="/booklet" component={Booklet} />
        <Route path="*">
          {/* Manuelle Umleitung zur Auth-Seite */}
          <NetlifyFallback />
        </Route>
      </Switch>
    );
  }
  
// Hilfsfunktion für Umleitung in Netlify-Umgebung
function NetlifyFallback() {
  const [, setLocation] = useLocation();
  
  useEffect(() => {
    console.log("Leite um zur Auth-Seite...");
    setTimeout(() => {
      setLocation("/auth");
    }, 100);
  }, [setLocation]);
  
  return (
    <div className="p-6 max-w-md mx-auto bg-black/30 backdrop-blur-md rounded-lg mt-10">
      <h2 className="text-xl font-bold text-blue-300 mb-4">Weiterleitung...</h2>
      <p className="text-white mb-4">Sie werden zur Login-Seite weitergeleitet.</p>
      <Link href="/auth" className="text-blue-400 hover:text-blue-300 underline">
        Falls keine automatische Umleitung erfolgt, hier klicken
      </Link>
    </div>
  );
}
  
  // Standard-Router für normale Umgebung
  return (
    <Switch>
      <ProtectedRoute path="/" component={SimpleHome} />
      <ProtectedRoute path="/coach" component={PersonalCoach} />
      <ProtectedRoute path="/calendar" component={MacroEconomicCalendar} />
      <ProtectedRoute path="/social" component={SocialTrading} />
      <Route path="/booklet" component={Booklet} />
      <Route path="/auth" component={AuthPage} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Log Umgebungsinformationen zur Fehlersuche
    const isNetlify = window.location.hostname.includes('netlify') || 
                      window.location.hostname.includes('aquamarine-lolly-174f9a');
                      
    const apiBaseUrl = isNetlify ? '/.netlify/functions/api' : '';
    
    console.log("App Umgebung:", {
      host: window.location.hostname,
      href: window.location.href,
      isNetlify,
      apiBaseUrl,
      userAgent: navigator.userAgent
    });
    
    // Prüfe API-Verfügbarkeit durch einfachen Aufruf
    fetch(`${apiBaseUrl}/api/health`)
      .then(response => {
        if (!response.ok) {
          throw new Error(`API nicht verfügbar: ${response.status}`);
        }
        return response.json();
      })
      .then(data => {
        console.log("API Health Check erfolgreich:", data);
      })
      .catch(error => {
        console.error("API Health Check fehlgeschlagen:", error);
        
        // Bei Fehler auf Netlify zusätzliche Debug-Anfrage versuchen
        if (isNetlify) {
          console.log("Versuche zusätzlichen Netlify-Debug-Endpunkt...");
          fetch('/.netlify/functions/api/debug')
            .then(res => res.ok ? res.json() : Promise.reject(new Error(`Debug-Endpunkt nicht verfügbar: ${res.status}`)))
            .then(data => console.log("Netlify Debug-Endpunkt Antwort:", data))
            .catch(err => console.error("Netlify Debug-Anfrage fehlgeschlagen:", err));
        }
      });
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <Router />
          <Toaster />
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
