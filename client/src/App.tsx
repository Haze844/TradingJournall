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
import ClientDiagnosticPage from "./pages/client-diagnostic";
import DebugPage from "./pages/debug-page";
import { ProtectedRoute } from "./lib/protected-route";
import PersonalCoach from "./components/PersonalCoach";
import MacroEconomicCalendar from "./components/MacroEconomicCalendar";
import SocialTrading from "./components/SocialTrading";
import Booklet from "./components/Booklet";
import { useEffect } from "react";

// Komponenten für direkte Weiterleitungen wurden entfernt

// Statische Login-Seite - nicht mehr in Verwendung
function StaticLoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex flex-col">
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="bg-slate-800/70 backdrop-blur-md rounded-xl p-8 max-w-3xl w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-blue-400 mb-2">LvlUp Tradingtagebuch</h1>
            <p className="text-slate-300">Bitte melden Sie sich an, um Ihre Handelsaktivitäten zu verfolgen</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-slate-900/50 p-6 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-300 mb-4">Demo-Zugangsdaten</h2>
              <div className="space-y-3 text-white">
                <div className="p-3 bg-slate-800/60 rounded-md">
                  <p><strong>Admin-Konto:</strong></p>
                  <p>Benutzername: admin</p>
                  <p>Passwort: admin123</p>
                </div>
                <div className="p-3 bg-slate-800/60 rounded-md">
                  <p><strong>Benutzer-Konto:</strong></p>
                  <p>Benutzername: mo</p>
                  <p>Passwort: mo123</p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col justify-between">
              <div>
                <h2 className="text-xl font-semibold text-blue-300 mb-4">Funktionen</h2>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center">
                    <div className="bg-blue-500/20 p-1 rounded-full mr-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Umfassende Trade-Verfolgung
                  </li>
                  <li className="flex items-center">
                    <div className="bg-blue-500/20 p-1 rounded-full mr-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Statistische Analyse
                  </li>
                  <li className="flex items-center">
                    <div className="bg-blue-500/20 p-1 rounded-full mr-2">
                      <svg className="w-4 h-4 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    Performance-Überwachung
                  </li>
                </ul>
              </div>
              
              <Link href="/auth" className="mt-6 bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-md text-center font-medium transition-colors">
                Zum Login
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      <footer className="bg-slate-900/80 py-4 text-center text-slate-400 text-sm">
        &copy; 2025 LvlUp Tradingtagebuch | Alle Rechte vorbehalten
      </footer>
    </div>
  );
}

function Router() {
  // Erkennen, ob wir in einer bestimmten Umgebung sind
  const isNetlify = window.location.hostname.includes('netlify') || 
                    window.location.hostname.includes('aquamarine-lolly-174f9a');
  const isRender = window.location.hostname.includes('onrender.com');
  const isReplit = window.location.hostname.includes('replit') || 
                   window.location.hostname.includes('repl.co');
  
  console.log("Router geladen, Umgebung erkannt:", { 
    isNetlify, 
    isRender,
    isReplit,
    hostname: window.location.hostname 
  });

  if (isReplit) {
    console.log("Replit-Umgebung erkannt - verwende leere Basis-URL");
  }
  
  // Einheitliches Routing für alle Umgebungen ohne Weiterleitungen
  // KEINE speziellen Weiterleitungen mehr für Netlify/Render
  if (isNetlify || isRender) {
    console.log("Netlify/Render Umgebung: Verwende Standard-Routing ohne Weiterleitungen");
  }
  
  // WICHTIG: Direkter Hard-Fix für das Routing-Problem
  // Wenn wir auf der Root-Seite sind, zeigen wir einen Login-Link ohne Weiterleitung
  const [location] = useLocation();
  
  // Debug-Logging
  console.log("Aktuelle Router-Location:", location);
  
  // ABSOLUT DIREKTE Navigation ohne Zwischenseiten für SimpleHome
  // WICHTIG: Keine Umwege oder Zwischenseiten bei der Navigation
  if (location === "/") {
    console.log("Root-Pfad erkannt - prüfe für direkte Navigation zu SimpleHome");
    
    // Prüfen, ob Benutzer angemeldet ist (über lokalen Storage)
    const localUser = localStorage.getItem('tradingjournal_user');
    
    if (localUser) {
      console.log("Benutzer im LocalStorage gefunden, direkte Weiterleitung zu SimpleHome");
      
      // Direkte Weiterleitung zu SimpleHome ohne jegliche Zwischenseiten
      // ABSOLUT DIREKTE NAVIGATION OHNE UMWEGE
      localStorage.setItem("directNavigation", "true");
      
      // Direkte Weiterleitung ohne jegliche Zwischenseiten
      // Verwende window.location für harten Redirect ohne Client-Routing
      setTimeout(() => {
        window.location.href = "/SimpleHome"; 
      }, 50);
    } else {
      console.log("Kein Benutzer im LocalStorage - ProtectedRoute übernimmt Weiterleitung zur Auth-Seite");
    }
  }
  
  // Standard-Router für alle anderen Pfade
  return (
    <Switch>
      <ProtectedRoute path="/" component={SimpleHome} />
      {/* Direkte Route für SimpleHome ohne Umwege - absolute direkte Navigation */}
      <ProtectedRoute path="/SimpleHome" component={SimpleHome} />
      <ProtectedRoute path="/coach" component={PersonalCoach} />
      <ProtectedRoute path="/calendar" component={MacroEconomicCalendar} />
      <ProtectedRoute path="/social" component={SocialTrading} />
      <Route path="/booklet" component={Booklet} />
      <Route path="/auth" component={AuthPage} />
      <Route path="/diagnostic" component={ClientDiagnosticPage} />
      <Route path="/debug" component={DebugPage} />
      <Route path="*" component={NotFound} />
    </Switch>
  );
}

function App() {
  useEffect(() => {
    // Log Umgebungsinformationen zur Fehlersuche
    const isNetlify = window.location.hostname.includes('netlify') || 
                      window.location.hostname.includes('aquamarine-lolly-174f9a');
    const isRender = window.location.hostname.includes('onrender.com');
    
    // Bestimme die Basis-URL für API-Anfragen basierend auf der Umgebung
    let apiBaseUrl = '';
    if (isNetlify) {
      apiBaseUrl = '/.netlify/functions/api';
    } else if (isRender) {
      apiBaseUrl = '/api';
    }
    
    console.log("App Umgebung:", {
      host: window.location.hostname,
      href: window.location.href,
      isNetlify,
      isRender,
      apiBaseUrl,
      userAgent: navigator.userAgent
    });
    
    // Prüfe API-Verfügbarkeit durch einfachen Aufruf
    fetch(`/api/health`)
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
        
        // Bei Fehler zusätzliche Debug-Anfragen versuchen, je nach Umgebung
        if (isNetlify) {
          console.log("Versuche zusätzlichen Netlify-Debug-Endpunkt...");
          fetch('/.netlify/functions/api/debug')
            .then(res => res.ok ? res.json() : Promise.reject(new Error(`Debug-Endpunkt nicht verfügbar: ${res.status}`)))
            .then(data => console.log("Netlify Debug-Endpunkt Antwort:", data))
            .catch(err => console.error("Netlify Debug-Anfrage fehlgeschlagen:", err));
        } else {
          console.log("Versuche zusätzlichen Debug-Endpunkt...");
          fetch('/api/debug')
            .then(res => res.ok ? res.json() : Promise.reject(new Error(`Debug-Endpunkt nicht verfügbar: ${res.status}`)))
            .then(data => console.log("Debug-Endpunkt Antwort:", data))
            .catch(err => console.error("Debug-Anfrage fehlgeschlagen:", err));
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
