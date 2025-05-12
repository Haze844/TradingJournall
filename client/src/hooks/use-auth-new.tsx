import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getQueryFn } from "@/lib/api";
import { isRender, sleep } from "@/lib/utils";
import { User } from "../shared/schema";

type AuthContextType = {
  user?: User | null;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType>({
  user: undefined,
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [localUser, setLocalUser] = useState<User | null | undefined>(() => {
    if (typeof localStorage === "undefined") return;
    const stored = localStorage.getItem("auth_user");
    return stored ? (JSON.parse(stored) as User) : undefined;
  });

  const isOnRender = typeof window !== "undefined" && isRender();

  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ["/api/user"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 5,
  });

  useEffect(() => {
    // Speichere in localStorage, wenn ein Nutzer geladen wurde (nicht undefined)
    if (user !== undefined) {
      localStorage.setItem("auth_user", JSON.stringify(user ?? ""));
      setLocalUser(user);
    }
  }, [user]);

  useEffect(() => {
    // Verhindere Redirect-Loop bei Render, indem der Versuch gezählt wird
    if (isOnRender && window.location.pathname === "/auth") {
      const redirectCount = parseInt(sessionStorage.getItem("render_redirect_count") || "0");

      const shouldRedirect = !user && !localUser && redirectCount < 3;

      if (shouldRedirect) {
        sessionStorage.setItem("render_redirect_count", `${redirectCount + 1}`);
        console.warn("🔁 Render redirect count increased:", redirectCount + 1);
      } else if (redirectCount >= 3) {
        console.warn("🛑 Render redirect loop detected. Aborting auto-redirect.");
        // Optional: Zeige dem Nutzer eine Fehlermeldung oder fallback
      }
    }
  }, [user, localUser, isOnRender]);

  const value = useMemo(
    () => ({
      user: user ?? localUser,
      isLoading: isUserLoading,
    }),
    [user, localUser, isUserLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);