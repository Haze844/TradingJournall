/**
 * DATENBANK-KONFIGURATION für INTERNE RENDER-DATENBANK
 * 
 * Diese Datei wurde aktualisiert, um ausschließlich mit der internen Render-Datenbank
 * zu arbeiten und alle Verbindungen zu externen Neon-Datenbanken zu entfernen.
 *
 * WICHTIG: Es wird nur die interne Render-PostgreSQL-Datenbank verwendet (keine Neon-Verbindung).
 */

import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "../shared/schema";
import { logger } from './logger';

// Keine Neon-Datenbank wird verwendet
logger.info("DB-Konfiguration: Verwende nur die interne Render-Datenbank (keine Neon-Verbindung)");

// Einfache Prüfung auf vorhandene Datenbankverbindung
function getDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    logger.error("KRITISCHER FEHLER: DATABASE_URL fehlt - Datenbankverbindung unmöglich");
    throw new Error("DATABASE_URL muss gesetzt sein.");
  }

  // Erkennen der Render-Umgebung
  const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL;
  
  if (isRender) {
    logger.info("Render-Umgebung erkannt - verwende interne PostgreSQL-Datenbank");
  }
  
  return dbUrl;
}

// Datenbankverbindungsstring
const dbUrl = getDatabaseUrl();
logger.info("Verbindung zur Datenbank wird hergestellt...");

// Variablen für Reconnect-Management
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 Sekunden
let isReconnecting = false;

// Pool-Konfiguration mit verbesserter Fehlerbehandlung - nur für Standard-PG
export const pool = new Pool({ 
  connectionString: dbUrl,
  max: 20, // Erhöhte Poolgrößen für bessere Leistung
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  // SSL-Konfiguration für Produktionsumgebung
  ssl: process.env.NODE_ENV === 'production' ? {
    rejectUnauthorized: false // Akzeptiere auch selbstsignierte Zertifikate in Render
  } : undefined
});

/**
 * Prüft, ob ein Fehler ein Verbindungsfehler ist, der ein Reconnect rechtfertigt
 */
function isConnectionError(err: any): boolean {
  // Typische PostgreSQL-Verbindungsfehler
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
      
      // Neuen Pool erstellen
      const newDbUrl = getDatabaseUrl();
      logger.info("Erstelle neuen Datenbankpool...");
      
      // Aktualisiere die exportierte Pool-Referenz
      Object.defineProperty(exports, 'pool', {
        value: new Pool({ 
          connectionString: newDbUrl,
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
