import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

// Hilfsfunktion zur Bestimmung der Basis-URL für API-Anfragen
function getApiBaseUrl() {
  // Lokale Entwicklung in Replit
  if (window.location.hostname.includes('replit.dev') || window.location.hostname.includes('replit.app')) {
    return '';
  }
  
  // Netlify Umgebung - Verwende /.netlify/functions/api für Serverless-Funktionen
  if (window.location.hostname.includes('netlify.app')) {
    return '/.netlify/functions/api';
  }
  
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
  
  const res = await fetch(apiUrl, {
    method,
    headers: data ? { "Content-Type": "application/json" } : {},
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
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
    
    const res = await fetch(apiUrl, {
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
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