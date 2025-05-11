/**
 * DATENBANK-KONFIGURATION mit RENDER IPv6-FIX und FEHLERBEHANDLUNG
 * 
 * Diese Datei wurde optimiert, um mit den IPv6-Verbindungsproblemen
 * speziell bei Render-zu-Supabase-Verbindungen umzugehen.
 * 
 * WICHTIG: Der ipv4-Parameter wurde hinzugefügt, um ENETUNREACH-Fehler zu vermeiden.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";
import { logger } from './logger';

// WebSocket-Unterstützung für Neon/Supabase
neonConfig.webSocketConstructor = ws;

// Keine Neon-Konfiguration, da wir die interne Render-Datenbank verwenden
logger.info("DB-Konfiguration: Verwende interne Render-Datenbank (keine Neon-Verbindung)");

// IPv4-Optimierung für Render (kritisch für die Verbindung zu Supabase)
function getOptimizedDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    logger.error("KRITISCHER FEHLER: DATABASE_URL fehlt - Datenbankverbindung unmöglich");
    throw new Error("DATABASE_URL muss gesetzt sein.");
  }

  // Erkennen der Render-Umgebung
  const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL;
  
  if (isRender) {
    logger.info("Render-Umgebung erkannt - verwende IPv4-Optimierung für Datenbankverbindung");
    
    // IPv4-Parameter hinzufügen, wenn nicht bereits vorhanden
    if (dbUrl.includes('?')) {
      // URL hat bereits Parameter
      if (!dbUrl.includes('ip_type=')) {
        return `${dbUrl}&ip_type=ipv4`;
      }
    } else {
      // URL hat noch keine Parameter
      return `${dbUrl}?ip_type=ipv4`;
    }
  }
  
  return dbUrl;
}

// Optimierte Verbindungs-URL mit IPv4-Fix für Render
const optimizedUrl = getOptimizedDatabaseUrl();
logger.info("Verbindung zur Datenbank wird hergestellt...");

// Variablen für Reconnect-Management
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 Sekunden
let isReconnecting = false;

// Pool-Konfiguration mit verbesserter Fehlerbehandlung
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
  // Typische Verbindungsfehler mit Neon/Supabase
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

  // Prüfen auf Netzwerkfehler-Meldungen
  if (err.message && (
    err.message.includes('connection') || 
    err.message.includes('timeout') ||
    err.message.includes('socket') ||
    err.message.includes('network') ||
    err.message.includes('unreachable')
  )) {
    return true;
  }

  return false;
}

/**
 * Stellt die Datenbankverbindung automatisch wieder her
 */
async function reconnect() {
  if (isReconnecting) return;
  
  isReconnecting = true;
  reconnectAttempts++;

  logger.info(`Versuche Datenbankverbindung wiederherzustellen (Versuch ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

  // Verzögerter Reconnect-Versuch
  setTimeout(async () => {
    try {
      // Alten Pool schließen, falls vorhanden
      try {
        await pool.end().catch(e => 
          logger.error("Fehler beim Schließen des alten Pools:", e)
        );
      } catch (e) {
        logger.error("Fehler beim Schließen des alten Pools:", e);
      }
      
      // Neuen Pool mit optimierter URL erstellen
      const newOptimizedUrl = getOptimizedDatabaseUrl();
      logger.info("Erstelle neuen Datenbankpool mit optimierter URL...");
      
      // Aktualisiere die exportierte Pool-Referenz
      Object.defineProperty(exports, 'pool', {
        value: new Pool({ 
          connectionString: newOptimizedUrl,
          max: 20,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 10000
        }),
        writable: true,
        configurable: true
      });
      
      // Aktualisiere die db-Referenz mit dem neuen Pool
      Object.defineProperty(exports, 'db', {
        value: drizzle(exports.pool, { schema }),
        writable: true,
        configurable: true
      });
      
      // Neu erstellten Pool testen
      await exports.pool.query('SELECT 1');
      
      logger.info('✅ Datenbankverbindung erfolgreich wiederhergestellt');
      isReconnecting = false;
      reconnectAttempts = 0;
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

logger.info("✅ Datenbankverbindung initialisiert - Optimierungen für Render aktiv");

// Testfunktion für die Datenbankverbindung
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info(`Datenbankverbindungstest erfolgreich: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('⚠️ Fehler bei der Datenbankverbindung:', error);
    return false;
  }
}
