/**
 * LOGGER-MODUL FÜR TRADING JOURNAL
 * 
 * Erweitertes Logging-System für bessere Diagnose von Authentifizierungsproblemen
 * und anderen Fehlern in der Anwendung.
 */

import { Request, Response, NextFunction } from 'express';
import * as fs from 'fs';
import * as path from 'path';

// Logging-Levels
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR'
}

// Log-Farben für Terminal-Ausgabe
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
};

// Globaler In-Memory-Log-Buffer für Render-Diagnose
if (!global.renderLogs) {
  global.renderLogs = [];
}

// Max. Anzahl der gespeicherten Log-Einträge
const MAX_LOG_ENTRIES = 100;

// Log-Verzeichnis erstellen, falls es nicht existiert
const LOG_DIR = path.join(process.cwd(), 'logs');
if (!fs.existsSync(LOG_DIR)) {
  try {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  } catch (err) {
    console.error('Konnte Log-Verzeichnis nicht erstellen:', err);
  }
}

// Log-Datei-Pfad
const LOG_FILE = path.join(LOG_DIR, `tradingjournal-${new Date().toISOString().split('T')[0]}.log`);

/**
 * Log-Funktion, die sowohl in Konsole als auch in Datei schreibt
 * @param level Log-Level
 * @param message Nachricht
 * @param meta Optionale Metadaten
 */
export function log(level: LogLevel, message: string, meta?: any) {
  const timestamp = new Date().toISOString();
  let coloredLevel = '';
  
  // Farbauswahl basierend auf Level
  switch(level) {
    case LogLevel.DEBUG:
      coloredLevel = `${colors.cyan}${level}${colors.reset}`;
      break;
    case LogLevel.INFO:
      coloredLevel = `${colors.green}${level}${colors.reset}`;
      break;
    case LogLevel.WARN:
      coloredLevel = `${colors.yellow}${level}${colors.reset}`;
      break;
    case LogLevel.ERROR:
      coloredLevel = `${colors.red}${level}${colors.reset}`;
      break;
  }

  // Log-String für Konsole
  const consoleLog = `${timestamp} [${coloredLevel}] ${message}`;
  
  // Log-String für Datei (ohne Farben)
  const fileLog = `${timestamp} [${level}] ${message}`;
  
  // Metadaten formatieren, wenn vorhanden
  let metaString = '';
  if (meta) {
    try {
      metaString = typeof meta === 'string' ? meta : JSON.stringify(meta, null, 2);
    } catch (err) {
      metaString = '[Nicht serialisierbare Daten]';
    }
  }

  // In die Konsole loggen
  console.log(consoleLog + (metaString ? `\n${metaString}` : ''));
  
  // In globalen Log-Buffer speichern (für Render-Diagnose)
  global.renderLogs.push(`${fileLog}${metaString ? ` ${metaString}` : ''}`);
  
  // Buffer auf maximale Größe begrenzen
  if (global.renderLogs.length > MAX_LOG_ENTRIES) {
    global.renderLogs = global.renderLogs.slice(-MAX_LOG_ENTRIES);
  }

  // In Datei loggen (asynchron, ohne auf Ergebnis zu warten)
  try {
    fs.appendFile(
      LOG_FILE, 
      fileLog + (metaString ? `\n${metaString}` : '') + '\n', 
      { encoding: 'utf8' }, 
      (err) => {
        if (err) {
          console.error('Fehler beim Schreiben ins Log-File:', err);
        }
      }
    );
  } catch (err) {
    console.error('Fehler beim Zugriff auf Log-File:', err);
  }
}

// Wrapper-Funktionen für verschiedene Log-Levels
export const logger = {
  debug: (message: string, meta?: any) => log(LogLevel.DEBUG, message, meta),
  info: (message: string, meta?: any) => log(LogLevel.INFO, message, meta),
  warn: (message: string, meta?: any) => log(LogLevel.WARN, message, meta),
  error: (message: string, meta?: any) => log(LogLevel.ERROR, message, meta),
};

/**
 * Express-Middleware zur Protokollierung von Anfragen
 */
export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const start = Date.now();
  
  // Anfrage-Infos sammeln
  const requestInfo = {
    method: req.method,
    path: req.path,
    query: req.query,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    cookies: req.cookies ? Object.keys(req.cookies) : [],
    sessionId: req.session?.id,
    authenticated: req.isAuthenticated?.() || false,
  };
  
  logger.info(`➡️ ${req.method} ${req.path}`, requestInfo);
  
  // Antwort abfangen, um Status-Code zu protokollieren
  const originalEnd = res.end;
  // @ts-ignore - Type-Casting für die Response-End-Funktion
  res.end = function(chunk: any, encoding: BufferEncoding) {
    const duration = Date.now() - start;
    
    logger.info(
      `⬅️ ${req.method} ${req.path} ${res.statusCode} in ${duration}ms`,
      {
        statusCode: res.statusCode,
        responseTime: duration,
        userAuth: requestInfo.authenticated
      }
    );
    
    // Original-Funktion aufrufen
    // @ts-ignore - Type-Casting für die Response-End-Funktion
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

/**
 * Express-Middleware zur Fehlerbehandlung und -protokollierung
 */
export function errorLogger(err: Error, req: Request, res: Response, next: NextFunction) {
  logger.error(`❌ Fehler bei ${req.method} ${req.path}`, {
    error: {
      message: err.message,
      stack: err.stack,
      name: err.name
    },
    request: {
      method: req.method,
      path: req.path,
      query: req.query,
      sessionId: req.session?.id,
      authenticated: req.isAuthenticated?.() || false
    }
  });
  
  next(err);
}

export default logger;