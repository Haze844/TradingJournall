import { createContext, ReactNode, useContext, useState, useEffect } from "react";
import {
  useQuery,
  useMutation,
  UseMutationResult,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "../shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { useLocation } from "wouter";

// Import der zentralen Umgebungserkennung
import { isRenderEnvironment, isReplitEnvironment } from '@/lib/env-detection';

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password"> & { rememberMe?: boolean };

// HINWEIS: Beim Ändern dieses Exports unbedingt Datenstruktur identisch halten
// sonst bekommt man Vite "Fast Refresh is not working" Fehler
export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDebugMode, setDebugMode] = useState(false);
  
  // Speziellen Modus für Render aktivieren
  useEffect(() => {
    const isOnRender = isRenderEnvironment();
    const isNetlify = window.location.hostname.includes('netlify');
    
    if (isNetlify) {
      setDebugMode(true);
      console.log("Debug-Modus für Netlify aktiviert");
      
      // Netlify-spezifische API-Prüfung
      fetch('/.netlify/functions/api/debug')
        .then(res => res.json())
        .then(data => console.log("Netlify API Debug:", data))
        .catch(err => console.error("Netlify API Debug Fehler:", err));
    }
    
    if (isOnRender) {
      setDebugMode(true);
      console.log("Render-Umgebung erkannt - Aktiviere speziellen Auth-Modus");
      
      // Prüfen, ob wir in einer Redirect-Schleife stecken
      const pathName = window.location.pathname;
      const redirectCount = parseInt(sessionStorage.getItem('render_redirect_count') || '0');
      
      if (pathName === '/auth' && redirectCount > 3) {
        console.warn("Mögliche Redirect-Schleife in Render erkannt. Versuche lokale Authentifizierung.");
        
        // Versuche, einen gespeicherten lokalen Benutzer zu laden
        try {
          const storedUser = localStorage.getItem('tradingjournal_user');
          if (storedUser) {
            console.log("Lokaler Benutzer gefunden, versuche direkte Navigation zu SimpleHome");
            window.location.href = "/SimpleHome";
            return;
          }
        } catch (e) {
          console.error("Fehler beim Überprüfen des lokalen Speichers:", e);
        }
      }
      
      // Zähler für Redirects erhöhen
      if (pathName === '/auth') {
        sessionStorage.setItem('render_redirect_count', (redirectCount + 1).toString());
      }
    }
  }, []);
  
  // Lokaler State für zusätzliche Persistenz (als Fallback)
  // Lokalen State für den Benutzer aus dem LocalStorage
  const [localUser, setLocalUser] = useState<SelectUser | null>(null);

  // Haupt-Query für Server-seitige Authentifizierung
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    // Verbesserte Einstellungen für konsistentere Authentifizierung
    retry: 1,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
    refetchOnReconnect: true,
    staleTime: 2 * 60 * 1000, // 2 Minuten
  });
  
  // Statt onSuccess im Query-Objekt verwenden wir useEffect
  useEffect(() => {
    if (user) {
      console.log("API User abgerufen, speichere in localStorage:", user.username);
      localStorage.setItem('tradingjournal_user', JSON.stringify(user));
      setLocalUser(user);
    }
  }, [user]);
  
  // Beim Laden der Komponente prüfen, ob wir bereits einen gespeicherten User haben
  useEffect(() => {
    if (!user && !isLoading) {
      // Lokalen Benutzer aus localStorage lesen
      try {
        const storedUser = localStorage.getItem('tradingjournal_user');
        if (storedUser) {
          const parsedUser = JSON.parse(storedUser) as SelectUser;
          console.log("Lokaler User aus localStorage verwendet:", parsedUser.username);
          setLocalUser(parsedUser);
        }
      } catch (error) {
        console.error("Fehler beim Lesen des lokalen Users:", error);
      }
    }
  }, [isLoading, user]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      // Debug-Informationen für Authentifizierung loggen
      console.log("Login-Anfrage wird gesendet für:", credentials.username);
      
      try {
        // Stelle sicher, dass keine doppelten /api/api Pfade verwendet werden
        const res = await apiRequest("POST", "/api/login", credentials);
        const data = await res.json();
        console.log("Login-Antwort erhalten:", {
          status: res.status,
          hasUser: !!data,
          username: data?.username
        });
        return data;
      } catch (error) {
        console.error("Login-Fehler:", error);
        throw error; // Fehler durchreichen für onError-Handler
      }
    },
    onSuccess: (data: any) => {
      // Handle user object inside wrapper if needed
      const userData = data.user || data;
      queryClient.setQueryData(["/api/user"], userData);
      
      // In localStorage speichern für Persistenz
      localStorage.setItem('tradingjournal_user', JSON.stringify(userData));
      setLocalUser(userData);
      
      // Detaillierte Logs für erfolgreiche Anmeldung
      console.log("Login erfolgreich, User-Daten aktualisiert:", {
        id: userData.id,
        username: userData.username,
        hasUser: !!userData
      });
      
      // Nutzer-Feedback 
      toast({
        title: "Erfolgreich angemeldet",
        description: `Willkommen zurück, ${userData.username}!`,
      });
      
      // WICHTIG: Keine automatische Navigation hier!
      // Die Navigation wird in auth-page.tsx behandelt, um Konflikte zu vermeiden
      console.log("Login erfolgreich - überlasse Navigation dem Login-Formular");
      
      // Hier KEINE navigate()-Aufrufe, um Konflikte mit auth-page.tsx zu vermeiden!
    },
    onError: (error: Error) => {
      // Detaillierte Fehlerinformationen
      console.error("Login-Mutation fehlgeschlagen:", error);
      
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message || "Verbindungsproblem mit dem Server. Bitte versuche es erneut.",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (credentials: InsertUser) => {
      // Debug-Informationen für Registrierung loggen
      console.log("Registrierungs-Anfrage wird gesendet für:", credentials.username);
      
      try {
        const res = await apiRequest("POST", "/api/register", credentials);
        const data = await res.json();
        console.log("Registrierungs-Antwort erhalten:", {
          status: res.status,
          hasUser: !!data,
          username: data?.username
        });
        return data;
      } catch (error) {
        console.error("Registrierungs-Fehler:", error);
        throw error; // Fehler durchreichen für onError-Handler
      }
    },
    onSuccess: (data: any) => {
      // Handle user object inside wrapper if needed
      const userData = data.user || data;
      queryClient.setQueryData(["/api/user"], userData);
      
      // In localStorage speichern für Persistenz (wie beim Login)
      localStorage.setItem('tradingjournal_user', JSON.stringify(userData));
      setLocalUser(userData);
      
      // Detaillierte Logs für erfolgreiche Registrierung
      console.log("Registrierung erfolgreich, User-Daten aktualisiert:", {
        id: userData.id,
        username: userData.username,
        hasUser: !!userData
      });
      
      // Nutzer-Feedback
      toast({
        title: "Registrierung erfolgreich",
        description: `Willkommen bei TradingJournal, ${userData.username}!`,
      });
      
      // WICHTIG: Keine automatische Navigation hier!
      // Die Navigation wird in auth-page.tsx behandelt, um Konflikte zu vermeiden
      console.log("Registrierung erfolgreich - überlasse Navigation dem Registrierungs-Formular");
      
      // Hier KEINE navigate()-Aufrufe, um Konflikte mit auth-page.tsx zu vermeiden!
    },
    onError: (error: Error) => {
      // Detaillierte Fehlerinformationen
      console.error("Registrierungs-Mutation fehlgeschlagen:", error);
      
      let errorMessage = error.message;
      
      // Verbesserte Fehlermeldungen für häufige Registrierungsprobleme
      if (errorMessage.includes("already exists") || errorMessage.includes("existiert bereits")) {
        errorMessage = "Ein Benutzer mit diesem Namen existiert bereits. Bitte wähle einen anderen Namen.";
      }
      
      toast({
        title: "Registrierung fehlgeschlagen",
        description: errorMessage || "Fehler bei der Kontoerstellung. Bitte versuche es erneut.",
        variant: "destructive",
      });
    },
  });

  const logoutMutation = useMutation<void, Error, void>({
    mutationFn: async () => {
      // Debug-Informationen für Abmeldung
      console.log("Logout-Anfrage wird gesendet");
      
      try {
        const response = await apiRequest("POST", "/api/logout");
        console.log("Logout-Antwort erhalten:", {
          status: response.status,
          ok: response.ok
        });
        return;
      } catch (error) {
        console.error("Logout-Fehler:", error);
        throw error;
      }
    },
    onSuccess: () => {
      // Benutzer-Session entfernen
      queryClient.setQueryData(["/api/user"], null);
      
      // Lokalen User zurücksetzen
      setLocalUser(null);
      
      // Lokale Speicherdaten löschen
      localStorage.removeItem('tradingjournal_user');
      
      // Health-Check aufrufen, um alte Cookies zu löschen
      fetch('/api/health').catch(e => console.error("Health-Check beim Logout fehlgeschlagen:", e));
      
      // Detaillierte Logs für erfolgreiche Abmeldung
      console.log("Logout erfolgreich, User-Daten zurückgesetzt und lokaler Speicher bereinigt");
      
      // Nutzer-Feedback
      toast({
        title: "Erfolgreich abgemeldet",
        description: "Deine Sitzung wurde beendet."
      });
      
      // Verzögerung für Redirect
      setTimeout(() => {
        // Nach Abmeldung zur Auth-Seite navigieren
        // Hier ist die Navigation in Ordnung, da wir zur Auth-Seite navigieren
        // was einer öffentlichen Route entspricht
        navigate("/auth");
      }, 300);
    },
    onError: (error: Error) => {
      // Detaillierte Fehlerinformationen
      console.error("Logout-Mutation fehlgeschlagen:", error);
      
      // Trotz Fehler lokale Daten löschen
      localStorage.removeItem('tradingjournal_user');
      setLocalUser(null);
      queryClient.setQueryData(["/api/user"], null);
      
      // Health-Check aufrufen, um alte Cookies zu löschen
      fetch('/api/health').catch(e => console.error("Health-Check beim Logout-Fehler-Fall fehlgeschlagen:", e));
      
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: "Lokale Daten wurden trotzdem bereinigt. Bitte versuche es erneut, falls nötig.",
        variant: "default",
      });
      
      // Trotz Fehler zur Auth-Seite navigieren, aber mit Verzögerung
      console.log("Logout-Bereinigung lokal durchgeführt - zur Auth-Seite navigieren");
      setTimeout(() => navigate("/auth"), 300);
    },
  });

  // Hybride Authentifizierung
  const effectiveUser = user || localUser;

  // Log für Debugging
  useEffect(() => {
    console.log('Auth Provider State:', {
      apiUser: user ? user.username : null,
      localUser: localUser ? localUser.username : null,
      effectiveUser: effectiveUser ? effectiveUser.username : null
    });
  }, [user, localUser, effectiveUser]);

  return (
    <AuthContext.Provider
      value={{
        user: effectiveUser,
        isLoading,
        error,
        loginMutation,
        logoutMutation,
        registerMutation,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  
  // Spezieller Fall für Render/Replit: Wenn kein API-Benutzer vorhanden ist, aber lokale Daten vorhanden,
  // ein Hybrid-Objekt zurückgeben, das auch den lokalen Benutzer enthält
  if ((isRenderEnvironment() || isReplitEnvironment()) && !context.user) {
    try {
      const storedUserString = localStorage.getItem('tradingjournal_user');
      if (storedUserString) {
        const localUser = JSON.parse(storedUserString);
        console.log(`Lokaler Benutzer für ${isReplitEnvironment() ? 'Replit' : 'Render'}-Fallback geladen:`, localUser.username);
        
        // Als effektiver Benutzer zählt der lokale Benutzer, wenn kein API-Benutzer verfügbar
        return {
          ...context,
          localUser,
          // Für ProtectedRoute: Wenn wir einen lokalen Benutzer haben, aber keinen API-Benutzer,
          // verwenden wir den lokalen Benutzer als Fallback für die Authentifizierung
          user: context.user || localUser
        };
      }
    } catch (e) {
      console.error("Fehler beim Laden des lokalen Benutzers:", e);
    }
  }
  
  return context;
}