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

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: UseMutationResult<SelectUser, Error, LoginData>;
  logoutMutation: UseMutationResult<void, Error, void>;
  registerMutation: UseMutationResult<SelectUser, Error, InsertUser>;
};

type LoginData = Pick<InsertUser, "username" | "password"> & { rememberMe?: boolean };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [isDebugMode, setDebugMode] = useState(false);
  
  // Debug-Status für Netlify-Deployment aktivieren
  useEffect(() => {
    const isNetlify = window.location.hostname.includes('netlify');
    if (isNetlify) {
      setDebugMode(true);
      console.log("Debug-Modus für Netlify aktiviert");
      
      // Ab hier können wir bei Bedarf für Netlify spezifischen Code ausführen
      // Netlify-API-Health Check manuell durchführen
      fetch('/.netlify/functions/api/debug')
        .then(res => res.json())
        .then(data => console.log("Netlify API Debug:", data))
        .catch(err => console.error("Netlify API Debug Fehler:", err));
    }
  }, []);
  
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

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
      
      // DIREKTE NAVIGATION zur Hauptseite - WICHTIG FÜR KORREKTE WEITERLEITUNG
      // Wir verwenden window.location für einen vollständigen Reload und Navigation
      console.log("Login erfolgreich - navigiere zur Hauptseite über window.location");
      
      // Kurze Verzögerung, damit Toast angezeigt werden kann
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
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
      
      // DIREKTE NAVIGATION zur Hauptseite - WICHTIG FÜR KORREKTE WEITERLEITUNG
      // Gleicher Ansatz wie beim Login
      console.log("Registrierung erfolgreich - navigiere zur Hauptseite über window.location");
      
      // Kurze Verzögerung, damit Toast angezeigt werden kann
      setTimeout(() => {
        window.location.href = "/";
      }, 800);
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
      
      // Detaillierte Logs für erfolgreiche Abmeldung
      console.log("Logout erfolgreich, User-Daten zurückgesetzt");
      
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
      
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: error.message || "Die Abmeldung konnte nicht durchgeführt werden. Bitte versuche es erneut.",
        variant: "destructive",
      });
      
      // Trotz Fehler zur Auth-Seite navigieren, aber mit Verzögerung
      console.log("Trotz Fehler zur Auth-Seite navigieren");
      setTimeout(() => navigate("/auth"), 300);
    },
  });

  return (
    <AuthContext.Provider
      value={{
        user: user ?? null,
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
  return context;
}