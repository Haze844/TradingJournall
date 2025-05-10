/**
 * RENDER-DEBUG-LOGS
 * 
 * Dieses Modul sammelt alle Debug-Logs vom Client und stellt
 * sie in der Render-Konsole dar. Besonders nützlich, um
 * Fehler im Render-Deployment zu finden und zu beheben.
 */

import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

// Log-Sammlung im Speicher
let clientDebugLogs: string[] = [];
let clientErrorLogs: string[] = [];
const MAX_LOGS = 1000;

// Gibt an, ob wir in der Render-Umgebung sind
const isRenderEnvironment = process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL;

// Pfad für persistente Log-Datei
const logDir = path.join(process.cwd(), 'logs');
const debugLogFile = path.join(logDir, 'render-debug.log');
const errorLogFile = path.join(logDir, 'render-error.log');

// Stelle sicher, dass der Logs-Ordner existiert
try {
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
  }
} catch (err) {
  console.error('Konnte Logs-Verzeichnis nicht erstellen:', err);
}

/**
 * Handler für eingehende Debug-Logs vom Client
 */
export function handleDebugLogs(req: Request, res: Response) {
  try {
    const { debugLogs, errorLogs, timestamp, userAgent, url, hostname } = req.body;
    
    // Wenn Logs vorhanden, speichern und loggen
    if (Array.isArray(debugLogs) && debugLogs.length > 0) {
      // Logs hinzufügen und auf maximale Anzahl begrenzen
      clientDebugLogs = [...clientDebugLogs, ...debugLogs];
      if (clientDebugLogs.length > MAX_LOGS) {
        clientDebugLogs = clientDebugLogs.slice(-MAX_LOGS);
      }
      
      // In Konsole ausgeben für Render-Logs
      if (isRenderEnvironment) {
        console.log(`\n[RENDER-CLIENT-DEBUG] ${debugLogs.length} Einträge von ${url}`);
        for (const log of debugLogs) {
          console.log(log);
        }
      }
      
      // In Datei speichern
      try {
        fs.appendFileSync(debugLogFile, debugLogs.join('\n') + '\n');
      } catch (error) {
        console.error('Debug-Log-Datei konnte nicht geschrieben werden:', error);
      }
    }
    
    // Error-Logs separat behandeln
    if (Array.isArray(errorLogs) && errorLogs.length > 0) {
      // Logs hinzufügen und auf maximale Anzahl begrenzen
      clientErrorLogs = [...clientErrorLogs, ...errorLogs];
      if (clientErrorLogs.length > MAX_LOGS) {
        clientErrorLogs = clientErrorLogs.slice(-MAX_LOGS);
      }
      
      // In Konsole ausgeben für Render-Logs
      console.error(`\n[RENDER-CLIENT-ERROR] ${errorLogs.length} Fehler von ${url}`);
      for (const log of errorLogs) {
        console.error(log);
      }
      
      // In Datei speichern
      try {
        fs.appendFileSync(errorLogFile, errorLogs.join('\n') + '\n');
      } catch (error) {
        console.error('Error-Log-Datei konnte nicht geschrieben werden:', error);
      }
    }
    
    // Antwort senden
    res.status(200).json({ 
      received: {
        debug: debugLogs?.length || 0,
        error: errorLogs?.length || 0,
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Debug-Logs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
}

/**
 * Gibt eine Übersicht der letzten Logs zurück
 */
export function getDebugLogs(req: Request, res: Response) {
  try {
    const limit = parseInt(req.query.limit as string) || 100;
    
    // Aktuellen Status und Logs zurückgeben
    res.status(200).json({
      status: 'ok',
      environment: {
        isRender: isRenderEnvironment,
        nodeEnv: process.env.NODE_ENV,
        renderInstanceId: process.env.RENDER_INSTANCE_ID || 'nicht verfügbar',
      },
      stats: {
        debugLogCount: clientDebugLogs.length,
        errorLogCount: clientErrorLogs.length,
        logDirExists: fs.existsSync(logDir),
        logFileExists: fs.existsSync(debugLogFile),
        errorFileExists: fs.existsSync(errorLogFile),
      },
      recentDebugLogs: clientDebugLogs.slice(-limit),
      recentErrorLogs: clientErrorLogs.slice(-limit),
    });
  } catch (error) {
    console.error('Fehler beim Abrufen der Debug-Logs:', error);
    res.status(500).json({ error: 'Interner Serverfehler' });
  }
}

/**
 * Direktes Ausgeben eines Logs 
 */
export function serverDebugLog(context: string, ...args: any[]) {
  try {
    // Formatiere die Log-Nachricht
    const timestamp = new Date().toISOString();
    const argString = args.map(arg => {
      if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return `[Nicht serialisierbar: ${typeof arg}]`;
        }
      }
      return String(arg);
    }).join(' ');
    
    const message = `[${timestamp}] [SERVER] [${context}] ${argString}`;
    
    // Log zur Sammlung hinzufügen
    clientDebugLogs.push(message);
    if (clientDebugLogs.length > MAX_LOGS) {
      clientDebugLogs.shift(); // Älteste Logs entfernen wenn Maximum erreicht
    }
    
    // Auch in der Konsole ausgeben
    console.log(`[RENDER-SERVER-DEBUG] ${message}`);
    
    // In Datei speichern
    try {
      fs.appendFileSync(debugLogFile, message + '\n');
    } catch (e) {
      // Ignoriere Fehler beim Schreiben
    }
  } catch (e) {
    console.error('Fehler in serverDebugLog:', e);
  }
}

/**
 * Direktes Ausgeben eines Fehlers
 */
export function serverErrorLog(context: string, ...args: any[]) {
  try {
    // Formatiere die Error-Nachricht
    const timestamp = new Date().toISOString();
    const argString = args.map(arg => {
      if (arg instanceof Error) {
        return `${arg.name}: ${arg.message}\n${arg.stack || 'Kein Stack verfügbar'}`;
      } else if (typeof arg === 'object') {
        try {
          return JSON.stringify(arg, null, 2);
        } catch (e) {
          return `[Nicht serialisierbar: ${typeof arg}]`;
        }
      }
      return String(arg);
    }).join(' ');
    
    const message = `[${timestamp}] [SERVER-ERROR] [${context}] ${argString}`;
    
    // Log zur Sammlung hinzufügen
    clientErrorLogs.push(message);
    if (clientErrorLogs.length > MAX_LOGS) {
      clientErrorLogs.shift(); // Älteste Logs entfernen wenn Maximum erreicht
    }
    
    // Auch in der Konsole ausgeben
    console.error(`[RENDER-SERVER-ERROR] ${message}`);
    
    // In Datei speichern
    try {
      fs.appendFileSync(errorLogFile, message + '\n');
    } catch (e) {
      // Ignoriere Fehler beim Schreiben
    }
  } catch (e) {
    console.error('Fehler in serverErrorLog:', e);
  }
}

// Initialisierung - erste Log-Nachricht
serverDebugLog('INIT', 'Server Debug-Logging gestartet, Umgebung:', {
  isRender: isRenderEnvironment,
  nodeEnv: process.env.NODE_ENV,
  platform: process.platform,
  renderInstanceId: process.env.RENDER_INSTANCE_ID || 'nicht verfügbar',
});