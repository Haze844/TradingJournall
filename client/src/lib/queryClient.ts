import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Hilfsfunktion zur Bestimmung der Basis-URL für API-Anfragen
function getApiBaseUrl() {
  // Auf Render-Umgebung prüfen
  if (window.location.hostname.includes('onrender.com')) {
    console.log('Render-Umgebung erkannt - verwende /api als Basis-URL');
    return '/api';
  }
  
  // Auf Netlify-Umgebung prüfen (falls noch relevant)
  if (window.location.hostname.includes('netlify') || 
      window.location.hostname.includes('aquamarine-lolly-174f9a')) {
    console.log('Netlify-Umgebung erkannt - verwende /.netlify/functions/api als Basis-URL');
    return '/.netlify/functions/api';
  }
  
  // Lokale Entwicklung in Replit
  if (window.location.hostname.includes('replit.dev') || 
      window.location.hostname.includes('replit.app')) {
    console.log('Replit-Umgebung erkannt - verwende leere Basis-URL');
    return '';
  }
  
  console.log('Standard-Umgebung - verwende leere Basis-URL');
  return '';
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Füge die Basis-URL für API-Anfragen hinzu
  const apiUrl = getApiBaseUrl() + url;
  console.log(`API-Anfrage an: ${apiUrl}`);
  
  try {
    const res = await fetch(apiUrl, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    // In speziellen Umgebungen wie Render oder Netlify zusätzliches Logging hinzufügen
    if (window.location.hostname.includes('netlify') || 
        window.location.hostname.includes('onrender.com') || 
        window.location.hostname.includes('aquamarine-lolly-174f9a')) {
      console.log(`API-Antwort von ${apiUrl}:`, {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText
      });
    }

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Fehler bei API-Anfrage an ${apiUrl}:`, error);
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Füge die Basis-URL für API-Anfragen hinzu
    const apiUrl = getApiBaseUrl() + (queryKey[0] as string);
    console.log(`Query-Anfrage an: ${apiUrl}`);
    
    try {
      const res = await fetch(apiUrl, {
        credentials: "include",
      });
      
      // In speziellen Umgebungen wie Render oder Netlify zusätzliches Logging hinzufügen
      if (window.location.hostname.includes('netlify') || 
          window.location.hostname.includes('onrender.com') ||
          window.location.hostname.includes('aquamarine-lolly-174f9a')) {
        console.log(`Query-Antwort von ${apiUrl}:`, {
          status: res.status,
          ok: res.ok,
          statusText: res.statusText
        });
      }

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      
      const data = await res.json();
      return data;
    } catch (error) {
      console.error(`Fehler bei Query-Anfrage an ${apiUrl}:`, error);
      
      // Bei Netlify-Umgebung: Wenn es sich um eine Auth-Anfrage handelt,
      // können wir für Debugging-Zwecke Default-Benutzer zurückgeben
      if (window.location.hostname.includes('netlify') && queryKey[0] === '/api/user') {
        console.warn('Verwende temporären Test-Benutzer für Netlify-Umgebung');
        return null; // Kein Benutzer, damit die Login-Seite angezeigt wird
      }
      
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
