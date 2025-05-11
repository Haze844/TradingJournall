/**
 * Lokale PostgreSQL-Datenbank-Konfiguration
 * 
 * Diese Datei ermöglicht die Verbindung zu einer lokalen PostgreSQL-Datenbank in Replit
 * oder einer anderen lokalen Entwicklungsumgebung.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";
import { logger } from './logger';

// WebSocket-Konfiguration für Neon PostgreSQL
neonConfig.webSocketConstructor = ws;

// Überprüfe, ob die Umgebungsvariable vorhanden ist
if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL muss gesetzt sein. Lokale DB nicht konfiguriert."
  );
}

logger.info('Verbinde mit der lokalen Datenbank');

// Pool-Konfiguration für die lokale Datenbank
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL 
});

// Drizzle ORM mit dem Schema initialisieren
export const db = drizzle(pool, { schema });

// Testfunktion für die Datenbankverbindung
export async function testDatabaseConnection() {
  try {
    const result = await pool.query('SELECT NOW()');
    logger.info(`Datenbank-Verbindung erfolgreich: ${result.rows[0].now}`);
    return true;
  } catch (error) {
    logger.error('Fehler bei der Verbindung zur Datenbank:', error);
    return false;
  }
}