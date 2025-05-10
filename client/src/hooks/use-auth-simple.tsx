import { createContext, ReactNode, useContext } from "react";
import {
  useQuery,
  useMutation,
} from "@tanstack/react-query";
import { insertUserSchema, User as SelectUser, InsertUser } from "../shared/schema";
import { getQueryFn, apiRequest, queryClient } from "../lib/queryClient";
import { useToast } from "./use-toast";
import { useLocation } from "wouter";

type AuthContextType = {
  user: SelectUser | null;
  isLoading: boolean;
  error: Error | null;
  loginMutation: any;
  logoutMutation: any;
  registerMutation: any;
};

type LoginData = Pick<InsertUser, "username" | "password"> & { rememberMe?: boolean };

export const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const [, navigate] = useLocation();
  
  // User-Daten abfragen
  const {
    data: user,
    error,
    isLoading,
  } = useQuery<SelectUser | undefined, Error>({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
  });

  // Login-Mutation
  const loginMutation = useMutation({
    mutationFn: async (credentials: LoginData) => {
      console.log("Login-Versuch für:", credentials.username);
      const res = await apiRequest("POST", "/api/login", credentials);
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Erfolgreich angemeldet",
        description: `Willkommen zurück, ${userData.username}!`,
      });
      
      // Navigiere zur Hauptseite
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Login-Fehler:", error);
      
      toast({
        title: "Anmeldung fehlgeschlagen",
        description: error.message || "Ungültige Anmeldedaten.",
        variant: "destructive",
      });
    },
  });

  // Registrierungs-Mutation
  const registerMutation = useMutation({
    mutationFn: async (userData: InsertUser) => {
      console.log("Registrierungs-Versuch für:", userData.username);
      const res = await apiRequest("POST", "/api/register", userData);
      return await res.json();
    },
    onSuccess: (userData: SelectUser) => {
      queryClient.setQueryData(["/api/user"], userData);
      
      toast({
        title: "Registrierung erfolgreich",
        description: `Willkommen, ${userData.username}!`,
      });
      
      // Navigiere zur Hauptseite
      navigate("/");
    },
    onError: (error: Error) => {
      console.error("Registrierungs-Fehler:", error);
      
      toast({
        title: "Registrierung fehlgeschlagen",
        description: error.message || "Fehler bei der Registrierung.",
        variant: "destructive",
      });
    },
  });

  // Logout-Mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      console.log("Logout-Versuch");
      await apiRequest("POST", "/api/logout");
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/user"], null);
      
      toast({
        title: "Erfolgreich abgemeldet",
        description: "Auf Wiedersehen!",
      });
      
      // Navigiere zur Auth-Seite
      navigate("/auth");
    },
    onError: (error: Error) => {
      console.error("Logout-Fehler:", error);
      
      toast({
        title: "Abmeldung fehlgeschlagen",
        description: error.message || "Fehler bei der Abmeldung.",
        variant: "destructive",
      });
    },
  });

  // Debug-Endpunkt für Session-Informationen
  const getAuthDebug = async () => {
    try {
      const res = await fetch("/api/auth-debug");
      const data = await res.json();
      console.log("Auth-Debug:", data);
      return data;
    } catch (error) {
      console.error("Fehler beim Abrufen der Auth-Debug-Daten:", error);
      return null;
    }
  };

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