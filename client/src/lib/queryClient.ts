import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Verbesserte Fehlerbehandlung für API-Anfragen
/**
 * Prüft, ob die API-Antwort erfolgreich war und wirft einen Fehler, wenn nicht
 * @param res Die Antwort vom Server
 */
async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    // Versuche, den Antworttext zu analysieren
    let errorMessage = res.statusText || `Fehler (${res.status})`;
    let errorDetails: any = null;
    
    // Erweiterte Debug-Informationen für die aktuelle Session
    console.log("API-Fehlerantwort Details:", {
      url: res.url,
      method: res.type,
      status: res.status,
      statusText: res.statusText,
      type: res.type,
      redirected: res.redirected,
      hasBody: !!res.body,
      contentType: res.headers.get('content-type'),
      cookies: document.cookie ? "vorhanden" : "keine",
      timestamp: new Date().toISOString()
    });
    
    try {
      // Versuche, die Antwort als JSON zu parsen
      const contentType = res.headers.get('content-type');
      const clonedRes = res.clone(); // Klonen für mehrfaches Lesen
      
      if (contentType && contentType.includes('application/json')) {
        try {
          const errorJson = await clonedRes.json();
          console.log("Fehler-JSON:", errorJson);
          errorMessage = errorJson.message || errorJson.error || JSON.stringify(errorJson);
          errorDetails = errorJson;
        } catch (jsonError) {
          console.error("JSON-Parsing fehlgeschlagen:", jsonError);
          // Wenn JSON-Parsing fehlschlägt, als Text lesen
          const text = await res.text();
          console.log("Fehler-Text (nach JSON-Fehler):", text);
          if (text) errorMessage = text;
        }
      } else {
        // Andernfalls als Text lesen
        const text = await res.text();
        console.log("Fehler-Text (nicht-JSON):", text);
        if (text) errorMessage = text;
      }
    } catch (parseError) {
      console.error('Fehler beim Parsen der Fehlermeldung:', parseError);
      // Behalte die ursprüngliche Fehlermeldung bei, wenn das Parsen fehlschlägt
    }
    
    // Benutzerfreundliche Fehlermeldungen basierend auf Statuscode
    if (res.status === 401) {
      console.warn(`Authentifizierungsfehler (401): ${errorMessage}`, {
        url: res.url,
        statusText: res.statusText,
        headers: Array.from(res.headers.entries())
          .filter(([key]) => !key.includes('cookie') && !key.includes('set-cookie'))
          .reduce((obj, [key, val]) => ({ ...obj, [key]: val }), {})
      });
      errorMessage = "Du bist nicht angemeldet oder deine Sitzung ist abgelaufen. Bitte melde dich erneut an.";
    } else if (res.status === 403) {
      console.error(`Berechtigungsfehler (403): ${errorMessage}`, errorDetails);
      errorMessage = "Du hast keine Berechtigung für diese Aktion.";
    } else if (res.status === 404) {
      console.error(`Ressource nicht gefunden (404): ${errorMessage}`, errorDetails);
      errorMessage = "Die angeforderte Ressource wurde nicht gefunden.";
    } else if (res.status >= 500) {
      console.error(`Serverfehler (${res.status}): ${errorMessage}`, errorDetails);
      errorMessage = "Ein Serverfehler ist aufgetreten. Bitte versuche es später erneut.";
    } else {
      console.error(`API-Fehler (${res.status}): ${errorMessage}`, errorDetails);
    }
    
    throw new Error(errorMessage);
  }
}

// Hilfsfunktion zur Bestimmung der Basis-URL für API-Anfragen
function getApiBaseUrl() {
  const isSecure = window.location.protocol === 'https:';
  const host = window.location.host;
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  
  // Debug-Informationen zur Umgebungserkennung
  const environment = {
    host,
    hostname,
    protocol: window.location.protocol,
    isSecure,
    href: window.location.href,
    pathname: window.location.pathname,
    isLocalhost,
    isNetlify: hostname.includes("netlify") || hostname.includes("aquamarine-lolly-174f9a"),
    isRender: hostname.includes("onrender.com"),
    isReplit: hostname.includes("replit.dev") || hostname.includes("replit.app"),
    userAgent: navigator.userAgent
  };
  
  console.log("App Umgebung:", environment);
  
  // Auf Render-Umgebung prüfen
  if (environment.isRender) {
    console.log('Render-Umgebung erkannt - verwende /api als Basis-URL');
    return '/api';
  }
  
  // Auf Netlify-Umgebung prüfen (falls noch relevant)
  if (environment.isNetlify) {
    console.log('Netlify-Umgebung erkannt - verwende /.netlify/functions/api als Basis-URL');
    return '/.netlify/functions/api';
  }
  
  // Lokale Entwicklung in Replit
  if (environment.isReplit) {
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
  
  // Log-Informationen sammeln
  const startTime = Date.now();
  const headers: HeadersInit = {
    // Benutzerdefinierte Header für Debug-Informationen
    'X-Client-Info': `App:TradingJournal|${window.location.hostname}|${navigator.userAgent.substring(0, 50)}`,
  };
  
  // Content-Type-Header nur hinzufügen, wenn Daten gesendet werden
  if (data) {
    headers['Content-Type'] = 'application/json';
  }
  
  console.log(`API-Anfrage an: ${apiUrl} [${method}]`);
  
  try {
    const requestConfig: RequestInit = {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
      // Sorgt dafür, dass Cookies immer über CORS-Anfragen gesendet werden
      mode: 'cors',
      cache: 'no-cache',
    };
    
    // For debugging
    console.log('Request Config:', {
      url: apiUrl,
      method: requestConfig.method,
      headers: headers,
      hasBody: !!requestConfig.body,
      credentials: requestConfig.credentials,
      mode: requestConfig.mode
    });

    const res = await fetch(apiUrl, requestConfig);
    
    const responseTime = Date.now() - startTime;
    
    // Verbesserte Protokollierung für alle Umgebungen
    console.log(`API-Antwort von ${apiUrl} [${method}] nach ${responseTime}ms:`, {
      status: res.status,
      ok: res.ok,
      statusText: res.statusText,
      headers: Object.fromEntries(
        Array.from(res.headers.entries())
          .filter(([key]) => !key.includes('set-cookie')) // Keine Cookies im Log
      )
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error(`Fehler bei API-Anfrage an ${apiUrl} [${method}]:`, error);
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
    
    // Log-Informationen sammeln
    const startTime = Date.now();
    const headers: HeadersInit = {
      // Benutzerdefinierte Header für Debug-Informationen
      'X-Client-Info': `App:TradingJournal|${window.location.hostname}|${navigator.userAgent.substring(0, 50)}`,
    };
    
    console.log(`Query-Anfrage an: ${apiUrl}`);
    
    try {
      const requestConfig: RequestInit = {
        headers,
        credentials: "include",
        // Sorgt dafür, dass Cookies immer über CORS-Anfragen gesendet werden
        mode: 'cors',
        cache: 'no-cache',
      };
      
      // For debugging
      console.log('Query Config:', {
        url: apiUrl,
        headers: headers,
        credentials: requestConfig.credentials,
        mode: requestConfig.mode
      });
      
      const res = await fetch(apiUrl, requestConfig);
      
      const responseTime = Date.now() - startTime;
      
      // Verbesserte Protokollierung für alle Umgebungen
      console.log(`Query-Antwort von ${apiUrl} nach ${responseTime}ms:`, {
        status: res.status,
        ok: res.ok,
        statusText: res.statusText,
        headers: Object.fromEntries(
          Array.from(res.headers.entries())
            .filter(([key]) => !key.includes('set-cookie')) // Keine Cookies im Log
        )
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        console.log('Nicht authentifiziert (401), Verhalten: return null');
        return null;
      }

      await throwIfResNotOk(res);
      
      try {
        const data = await res.json();
        return data;
      } catch (jsonError) {
        console.error(`Fehler beim Parsen der JSON-Antwort von ${apiUrl}:`, jsonError);
        // Wenn es ein JSON-Parsing-Fehler ist, versuchen wir, den Text zu lesen
        const text = await res.text();
        console.error(`Antworttext: ${text.substring(0, 500)}${text.length > 500 ? '...' : ''}`);
        throw new Error(`JSON-Parsing-Fehler: ${jsonError.message}`);
      }
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
