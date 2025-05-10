/**
 * Render-spezifische Routing-Anpassungen
 * Diese Datei enthält Funktionen zur Verbesserung des Routings in Render-Deployments
 */

// Erkennt die aktuelle Umgebung
export function detectEnvironment() {
  const isRender = typeof window !== 'undefined' && 
    (window.location.hostname.includes('render.com') || 
     window.location.hostname.includes('onrender.com'));
  
  const isReplit = typeof window !== 'undefined' && 
    (window.location.hostname.includes('replit.dev') || 
     window.location.hostname.includes('repl.co'));
    
  const isNetlify = typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     window.location.hostname.includes('netlify.com'));

  const isLocalhost = typeof window !== 'undefined' && 
    (window.location.hostname === 'localhost' || 
     window.location.hostname === '127.0.0.1');

  return {
    isRender,
    isReplit,
    isNetlify,
    isLocalhost
  };
}

// Erstellt Basis-URL basierend auf Umgebung
export function getBaseUrl() {
  const { isRender, isReplit, isNetlify } = detectEnvironment();
  
  // Spezielles Handling für Render
  if (isRender) {
    return '/'; // Keine Basis-URL auf Render, aber alle Links relativ
  }
  
  return '';
}

// Passt URLs für die Render-Umgebung an
export function fixRenderUrls(url: string): string {
  const { isRender } = detectEnvironment();
  
  if (!isRender) {
    return url;
  }
  
  // Stellt sicher, dass URLs mit / beginnen
  if (!url.startsWith('/') && url !== '') {
    url = '/' + url;
  }
  
  return url;
}

// Erstellt einen korrekten externen Link für die aktuelle Umgebung
export function createExternalLink(path: string): string {
  const { isRender, isReplit, isNetlify, isLocalhost } = detectEnvironment();
  
  // Entferne führenden Slash für die Verkettung
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  if (typeof window === 'undefined') {
    return path;
  }
  
  let baseUrl = window.location.origin;
  
  // Spezialfall für Render: Wir verwenden die absolute URL
  if (isRender) {
    return `${baseUrl}/${cleanPath}`;
  }
  
  return path; // In anderen Umgebungen den Pfad unverändert zurückgeben
}

// Überprüfe, ob die aktuelle Umgebung HTTPS erfordert
export function requiresHttps(): boolean {
  const { isRender, isReplit, isNetlify, isLocalhost } = detectEnvironment();
  
  // In Produktionsumgebungen immer HTTPS verwenden
  return isRender || isReplit || isNetlify;
}

// Spezielle Korrektur für Render-Redirects nach Login/Logout
export function handleRenderRedirect(intendedPath: string): string {
  const { isRender } = detectEnvironment();
  
  if (!isRender) {
    return intendedPath;
  }
  
  // Stellt sicher, dass Redirects auf Render absolute URLs verwenden
  if (typeof window !== 'undefined') {
    const baseUrl = window.location.origin;
    // Entferne führenden Slash für die Verkettung, wenn vorhanden
    const cleanPath = intendedPath.startsWith('/') ? intendedPath.substring(1) : intendedPath;
    return `${baseUrl}/${cleanPath}`;
  }
  
  return intendedPath;
}

// Debug-Funktion für Routing-Probleme
export function logRoutingInfo(message: string, data?: any) {
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[Routing] ${message}`, data);
  }
  
  // In Produktionsumgebungen nur bei Render loggen
  const { isRender } = detectEnvironment();
  if (isRender && process.env.NODE_ENV === 'production') {
    console.log(`[Render Routing] ${message}`, data);
  }
}