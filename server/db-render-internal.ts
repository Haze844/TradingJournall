/**
 * RENDER INTERNE DATENBANK-KONFIGURATION
 * 
 * Diese Datei stellt die Verbindung zur internen Render-Postgres-Datenbank her
 * und ist optimiert für die Nutzung innerhalb der Render-Infrastruktur.
 * 
 * Konfiguration: trading-journal-db (Frankfurt)
 * Benutzer: trading_journal_user
 * Datenbank: trading_journal
 */

import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import { logger } from './logger';

const { Pool } = pg;

// Diese Funktion wird nicht mehr benötigt, da wir den nativen PostgreSQL-Treiber verwenden

// Optimierte Erkennung der Render-Umgebung
export function isRenderEnvironment(): boolean {
  return process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL;
}

// Verbindungsparameter für Render-interne Datenbank
export function getInternalDatabaseConfig() {
  // Umgebungsvariable für die Datenbankverbindung (höchste Priorität)
  const envConnectionString = process.env.DATABASE_URL;
  
  // Wenn die Umgebungsvariable existiert, verwenden wir diese direkt
  if (envConnectionString) {
    logger.info('Verwende DATABASE_URL für Render-interne Datenbank');
    return {
      connectionString: envConnectionString,
      // SSL-Verbindung basierend auf der URL konfigurieren
      ssl: envConnectionString.includes('ssl=true') || {
        rejectUnauthorized: false // Weniger strikt für Entwicklungsumgebungen
      }
    };
  }
  
  // Fallback auf einzelne Parameter mit Umgebungsvariablen
  logger.info('Verwende einzelne Parameter für Render-interne Datenbank');
  return {
    database: process.env.PGDATABASE || 'trading_journal',
    user: process.env.PGUSER || 'trading_journal_user',
    password: process.env.PGPASSWORD,
    host: process.env.PGHOST || 'localhost',
    port: parseInt(process.env.PGPORT || '5432'),
    // SSL-Konfiguration für verschiedene Umgebungen
    ssl: {
      rejectUnauthorized: false // Erlaubt selbstsignierte Zertifikate
    }
  };
}

logger.info("Verbindung zur internen Render-Datenbank wird hergestellt...");

// Pool-Konfiguration für bessere Leistung und Fehlertoleranz
export const pool = new Pool({
  ...getInternalDatabaseConfig(),
  max: 20,                     // Maximale Anzahl gleichzeitiger Verbindungen
  idleTimeoutMillis: 30000,    // Verbindung nach 30s Inaktivität schließen
  connectionTimeoutMillis: 5000, // 5s Timeout beim Verbindungsaufbau
});

// Fehlerbehandlung für den Pool
pool.on('error', (err: Error) => {
  logger.error('Unerwarteter Fehler am Datenbankpool (Render-intern):', err);
});

// Verwende direkt node-postgres Drizzle Adapter für den PostgreSQL-Pool
export const db = drizzle(pool, { schema });

// Testfunktion für die Datenbankverbindung
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info(`Render-interne Datenbankverbindung erfolgreich: ${result.rows[0].now}`);
    
    // Zusätzliche Informationen zur Datenbank ausgeben
    const dbInfoResult = await pool.query(
      "SELECT current_database() as db, current_user as user"
    );
    logger.info('Datenbank-Informationen:', dbInfoResult.rows[0]);
    
    return true;
  } catch (error) {
    logger.error('⚠️ Fehler bei der Verbindung zur Render-internen Datenbank:', error);
    return false;
  }
}