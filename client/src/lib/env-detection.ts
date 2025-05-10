/**
 * Umgebungserkennung-Hilfsfunktionen
 * 
 * Zentrale Stelle für alle Umgebungserkennungen, um Konsistenz zu gewährleisten
 */

/**
 * Erkennt ob die Anwendung in einer Render-Umgebung läuft
 * Berücksichtigt sowohl Hostname-Erkennung als auch APP_CONFIG-Einstellungen
 */
export function isRenderEnvironment(): boolean {
  // 1. Direkte Hostname-Erkennung
  const isRenderHost = typeof window !== 'undefined' && 
    window.location.hostname.includes('onrender.com');
  
  // 2. APP_CONFIG Erkennung - wenn explizit als Render konfiguriert
  const isRenderConfig = typeof window !== 'undefined' && 
    (window as any)?.APP_CONFIG?.isRender === true;
  
  return isRenderHost || isRenderConfig;
}

/**
 * Erkennt ob die Anwendung in einer Netlify-Umgebung läuft
 */
export function isNetlifyEnvironment(): boolean {
  return typeof window !== 'undefined' && 
    (window.location.hostname.includes('netlify.app') || 
     window.location.hostname.includes('netlify.com'));
}

/**
 * Erkennt ob die Anwendung in einer Replit-Umgebung läuft
 */
export function isReplitEnvironment(): boolean {
  return typeof window !== 'undefined' && 
    (window.location.hostname.includes('replit.dev') || 
     window.location.hostname.includes('repl.co'));
}

/**
 * Erkennt die aktuelle Umgebung und gibt ein Objekt mit allen Umgebungsflags zurück
 */
export function detectEnvironment() {
  return {
    isRender: isRenderEnvironment(),
    isNetlify: isNetlifyEnvironment(),
    isReplit: isReplitEnvironment(),
    hostname: typeof window !== 'undefined' ? window.location.hostname : 'unknown',
    appConfig: typeof window !== 'undefined' ? (window as any)?.APP_CONFIG || {} : {}
  };
}