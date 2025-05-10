/**
 * RENDER-DEBUGGING-TOOL
 * 
 * Dieses Tool sammelt Debug-Logs und sendet sie regelmäßig
 * an einen Server-Endpunkt, der sie in der Render-Konsole anzeigt.
 * 
 * WICHTIG: Dieses Tool ist nur für die Render-Umgebung gedacht!
 */

import { isRenderEnvironment } from './env-detection';

// Globale Log-Sammlung
const DEBUG_LOGS: string[] = [];
const ERROR_LOGS: string[] = [];
const MAX_LOGS = 1000; // Maximale Anzahl der Logs

// Senden von Logs alle X Millisekunden
const LOG_SEND_INTERVAL = 5000; // 5 Sekunden
let lastSendTime = 0;

/**
 * Fügt einen Debug-Log hinzu
 */
export function debugLog(context: string, ...args: any[]) {
  try {
    if (!isRenderEnvironment()) return; // Nur in Render-Umgebung aktiv
    
    // Formatiere die Log-Nachricht
    const timestamp = new Date().toISOString();
    const argString = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return `[Nicht serialisierbar: ${typeof arg}]`;
        }
      }
      return String(arg);
    }).join(' ');
    
    const message = `[${timestamp}] [${context}] ${argString}`;
    
    // Log zur Sammlung hinzufügen
    DEBUG_LOGS.push(message);
    if (DEBUG_LOGS.length > MAX_LOGS) {
      DEBUG_LOGS.shift(); // Älteste Logs entfernen wenn Maximum erreicht
    }
    
    // Auch in der Konsole ausgeben
    console.log(`[RENDER-DEBUG] ${message}`);
    
    // Automatisches Senden der Logs, aber nur alle LOG_SEND_INTERVAL
    const now = Date.now();
    if (now - lastSendTime > LOG_SEND_INTERVAL) {
      sendLogsToServer();
      lastSendTime = now;
    }
  } catch (e) {
    console.error('Fehler in debugLog:', e);
  }
}

/**
 * Fügt einen Error-Log hinzu
 */
export function errorLog(context: string, ...args: any[]) {
  try {
    if (!isRenderEnvironment()) return; // Nur in Render-Umgebung aktiv
    
    // Formatiere die Error-Nachricht
    const timestamp = new Date().toISOString();
    const argString = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack || 'Kein Stack verfügbar'}`;
      } else if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg);
        } catch (e) {
          return `[Nicht serialisierbar: ${typeof arg}]`;
        }
      }
      return String(arg);
    }).join(' ');
    
    const message = `[${timestamp}] [ERROR] [${context}] ${argString}`;
    
    // Log zur Sammlung hinzufügen
    ERROR_LOGS.push(message);
    if (ERROR_LOGS.length > MAX_LOGS) {
      ERROR_LOGS.shift(); // Älteste Logs entfernen wenn Maximum erreicht
    }
    
    // Auch in der Konsole ausgeben
    console.error(`[RENDER-ERROR] ${message}`);
    
    // Fehler sofort senden
    sendLogsToServer();
    lastSendTime = Date.now();
  } catch (e) {
    console.error('Fehler in errorLog:', e);
  }
}

/**
 * Sendet gesammelte Logs an den Server
 */
async function sendLogsToServer() {
  try {
    if (DEBUG_LOGS.length === 0 && ERROR_LOGS.length === 0) return;
    
    // Kopien der aktuellen Logs erstellen und Listen leeren
    const debugLogs = [...DEBUG_LOGS];
    const errorLogs = [...ERROR_LOGS];
    DEBUG_LOGS.length = 0;
    ERROR_LOGS.length = 0;
    
    // An API senden
    await fetch('/api/debug-logs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        debugLogs,
        errorLogs,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href,
        hostname: window.location.hostname,
        isRender: isRenderEnvironment(),
      }),
    });
  } catch (e) {
    console.error('Fehler beim Senden der Debug-Logs:', e);
  }
}

// Globale Fehlerbehandlung
window.addEventListener('error', (event) => {
  errorLog('WINDOW.ONERROR', {
    message: event.message,
    source: event.filename,
    lineno: event.lineno,
    colno: event.colno,
    error: event.error ? (event.error.stack || event.error.toString()) : 'Keine Details verfügbar'
  });
});

// Unbehandelte Promise-Fehler abfangen
window.addEventListener('unhandledrejection', (event) => {
  errorLog('UNHANDLED_PROMISE', {
    reason: event.reason instanceof Error 
      ? `${event.reason.name}: ${event.reason.message}\n${event.reason.stack || 'Kein Stack'}`
      : String(event.reason)
  });
});

// Startup-Meldung
console.log('[RENDER-DEBUG] Debug-System initialisiert. Umgebung:', isRenderEnvironment() ? 'RENDER' : 'NICHT-RENDER');

// Exportiere auch eine Funktion, um den aktuellen Status zu zeigen
export function getDebugState() {
  return {
    inRenderEnvironment: isRenderEnvironment(),
    pendingDebugLogs: DEBUG_LOGS.length,
    pendingErrorLogs: ERROR_LOGS.length,
  };
}

// Integriere eine Diagnose-Funktion, die den Status der App und wichtiger Variablen überprüft
export function diagnoseRenderState() {
  try {
    const appInfo = {
      location: window.location.href,
      useLocalStorage: !!localStorage.getItem('tradingjournal_user'),
      localUser: localStorage.getItem('tradingjournal_user') 
        ? JSON.parse(localStorage.getItem('tradingjournal_user') || '{}') 
        : null,
      storageKeys: Object.keys(localStorage),
      redirectAfterLogin: localStorage.getItem('redirectAfterLogin'),
      cookies: document.cookie,
      hasCookies: document.cookie.length > 0,
      appConfig: (window as any).APP_CONFIG || {},
      navigator: {
        userAgent: navigator.userAgent,
        language: navigator.language,
      },
      screenSize: {
        width: window.innerWidth,
        height: window.innerHeight,
      },
    };
    
    debugLog('RENDER-DIAGNOSE', appInfo);
    return appInfo;
  } catch (e) {
    errorLog('RENDER-DIAGNOSE-FEHLER', e);
    return { error: String(e) };
  }
}