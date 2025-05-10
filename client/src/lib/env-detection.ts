/**
 * Umgebungserkennung-Hilfsfunktionen
 * 
 * Zentrale Stelle für alle Umgebungserkennungen, um Konsistenz zu gewährleisten
 */

/**
 * Erkennt ob die Anwendung in einer Render-Umgebung läuft
 * Berücksichtigt mehrere Methoden für eine zuverlässige Erkennung
 */
export function isRenderEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  
  // 1. Direkte Hostname-Erkennung
  const isRenderHost = window.location.hostname.includes('onrender.com');
  
  // 2. APP_CONFIG Erkennung - wenn explizit als Render konfiguriert
  const isRenderConfig = (window as any)?.APP_CONFIG?.isRender === true;
  
  // 3. Manuell gesetzte localStorage-Erkennung (für Debug-Zwecke)
  const isRenderManual = localStorage.getItem('debug_isRender') === 'true';
  
  // 4. Meta Tag Erkennung
  const metaRender = document.querySelector('meta[name="render-environment"]');
  const isRenderMeta = metaRender?.getAttribute('content') === 'true';
  
  // 5. Subdomain-basierte Heuristik für benutzerdefinierte Domains
  const isRenderSubdomain = /^[a-z0-9\-]+\.onrender\.com$/.test(window.location.hostname);
  
  // Debug-Logging für Umgebungserkennung
  try {
    console.debug('[ENV-DETECTION] Render-Umgebung Erkennung:', {
      isRenderHost,
      isRenderConfig,
      isRenderManual,
      isRenderMeta,
      isRenderSubdomain,
      hostname: window.location.hostname,
      result: isRenderHost || isRenderConfig || isRenderManual || isRenderMeta || isRenderSubdomain
    });
  } catch (e) {
    // Ignoriere Fehler beim Logging
  }
  
  return isRenderHost || isRenderConfig || isRenderManual || isRenderMeta || isRenderSubdomain;
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