import { Switch, Route } from "wouter";
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
    const isNetlify = window.location.hostname.includes('netlify.app') || window.location.hostname.includes('netlify.com');
    console.log("App Umgebung:", {
      host: window.location.hostname,
      href: window.location.href,
      isNetlify,
      apiBaseUrl: isNetlify ? '/.netlify/functions/api' : '',
      userAgent: navigator.userAgent
    });
    
    // Prüfe API-Verfügbarkeit durch einfachen Aufruf
    fetch(isNetlify ? '/.netlify/functions/api/api/health' : '/api/health')
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
