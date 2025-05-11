/**
 * SUPABASE DATENBANK-KONFIGURATION mit FEHLERBEHANDLUNG für RENDER
 * 
 * Diese Datei wurde optimiert, um mit häufigen Datenbankproblemen
 * in der Render-Umgebung zuverlässig umzugehen. Bei Verbindungsproblemen
 * wird automatisch ein Reconnect versucht.
 * 
 * WICHTIG: Für die Verbindung von Render zu Supabase muss der IPv4-Parameter verwendet werden.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { isRenderEnvironment } from './render-integration';
import { logger } from './logger';

neonConfig.webSocketConstructor = ws;

// IPv4-Optimierung für Render (wichtig für die Verbindung zu Supabase)
function getOptimizedDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error("DATABASE_URL fehlt in den Umgebungsvariablen");
  }

  // Füge den IP-Typ-Parameter nur in der Render-Umgebung hinzu
  if (isRenderEnvironment()) {
    logger.info("IPv4-Optimierung für Supabase-Verbindung in Render aktiviert");
    
    // Überprüfen, ob die URL bereits den Parameter enthält
    if (dbUrl.includes('?')) {
      // Es gibt bereits Parameter
      if (!dbUrl.includes('ip_type=')) {
        return `${dbUrl}&ip_type=ipv4`;
      }
      return dbUrl;
    } else {
      // Es gibt noch keine Parameter
      return `${dbUrl}?ip_type=ipv4`;
    }
  }
  
  return dbUrl;
}

// Verbesserte Verbindung mit Fehlerbehandlung
const optimizedUrl = getOptimizedDatabaseUrl();
logger.info("Datenbankverbindung mit Supabase wird hergestellt...");

// Variablen für Reconnect-Management
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 Sekunden
let isReconnecting = false;

export const pool = new Pool({ 
  connectionString: optimizedUrl,
  max: 20, // Erhöhte Poolgrößen für bessere Leistung
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

/**
 * Prüft, ob ein Fehler ein Verbindungsfehler ist, der ein Reconnect rechtfertigt
 */
function isConnectionError(err: any): boolean {
  // Typische Verbindungsfehler mit Neon
  const connectionErrorCodes = [
    '57P01', // Termination aufgrund Inaktivität
    '08006', // Verbindung geschlossen
    '08001', // Verbindung abgelehnt
    '08004', // Verbindung zurückgewiesen
    'ECONNRESET', // Zurückgesetzte Verbindung
    'EPIPE', // Broken Pipe
    'ETIMEDOUT', // Timeout
    'ENETUNREACH' // Network unreachable (IPv6-Problem)
  ];

  // Prüfen auf PostgreSQL-Fehlercode
  if (err.code && connectionErrorCodes.includes(err.code)) {
    return true;
  }

  // Prüfen auf Netzwerkfehler
  if (err.message && (
    err.message.includes('connection') || 
    err.message.includes('timeout') ||
    err.message.includes('socket') ||
    err.message.includes('network')
  )) {
    return true;
  }

  return false;
}

/**
 * Stellt die Datenbankverbindung automatisch wieder her
 */
function reconnect() {
  if (isReconnecting) return;
  
  isReconnecting = true;
  reconnectAttempts++;

  logger.info(`Versuche Datenbankverbindung wiederherzustellen (Versuch ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

  // Verzögerter Reconnect-Versuch
  setTimeout(() => {
    try {
      // Alten Pool schließen
      try {
        pool.end().catch(e => 
          logger.error("Fehler beim Schließen des alten Pools:", e)
        );
      } catch (e) {
        logger.error("Fehler beim Schließen des alten Pools:", e);
      }
      
      isReconnecting = false;
      logger.info('Verbindung zurückgesetzt, versuche mit bestehendem Pool weiterzuarbeiten');
    } catch (error) {
      logger.error(`Reconnect-Versuch ${reconnectAttempts} fehlgeschlagen:`, error);
      isReconnecting = false;
      
      // Weitere Versuche, wenn Maximum nicht erreicht
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnect();
      } else {
        logger.error(`Maximale Anzahl von Reconnect-Versuchen (${MAX_RECONNECT_ATTEMPTS}) erreicht.`);
      }
    }
  }, RECONNECT_DELAY);
}

// Überwache Pool-Fehler und versuche Reconnect bei schwerwiegenden Fehlern
pool.on('error', (err) => {
  logger.error('Unerwarteter Fehler am Datenbankpool:', err);
  
  // Bei Verbindungsfehlern Reconnect versuchen
  if (isConnectionError(err)) {
    logger.info('Verbindungsfehler erkannt, versuche Reconnect...');
    reconnect();
  }
});

export const db = drizzle(pool, { schema });

// Testfunktion für die Datenbankverbindung
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info(`Supabase-Datenbankverbindung erfolgreich: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('Fehler bei der Verbindung zur Supabase-Datenbank:', error);
    return false;
  }
}