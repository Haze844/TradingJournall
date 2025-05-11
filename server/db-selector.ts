/**
 * Datenbank-Selektor mit RENDER-INTERNER DATENBANK PRIORISIERUNG
 * 
 * Diese Datei ermöglicht das Umschalten zwischen verschiedenen Datenbankanbindungen
 * basierend auf Umgebungsvariablen und bietet Hilfsfunktionen für sichere Datenbankaufrufe.
 * 
 * WICHTIG: In Render-Umgebung wird nun ausschließlich die interne Datenbank verwendet.
 */

// Nur Standard-PostgreSQL-Pool verwenden (keine Neon-Verbindung)
import { Pool } from 'pg';  // Standard PostgreSQL für alle Umgebungen
import { logger } from "./logger";
import { isRenderEnvironment } from './render-integration';

// Import der verschiedenen Datenbankkonfigurationen
import * as localDb from './db-local';
import * as renderInternalDb from './db-render-internal';

// Definition der Datenbank-Typ-Schnittstelle für bessere Typsicherheit
interface DatabaseModule {
  pool: any; // Ermöglicht verschiedene Pool-Typen
  db: any;   // Drizzle-Instanz
  testDatabaseConnection?: () => Promise<boolean>;
}

// Bestimmen der zu verwendenden Datenbankverbindung
export function selectDatabaseConnection(): DatabaseModule {
  // Umgebungsvariable für Datenbankauswahl prüfen
  const provider = process.env.DATABASE_PROVIDER || 'local';
  const environment = process.env.NODE_ENV || 'development';
  const isRender = isRenderEnvironment();
  
  logger.info(`Datenbank-Konfiguration: Provider=${provider}, Umgebung=${environment}, Render=${isRender}`);

  // Spezielle Behandlung für die interne Render-Datenbank
  // Wenn wir in der Render-Umgebung sind und PGHOST gesetzt ist, verwenden wir die interne Datenbank
  if (isRender && process.env.PGHOST && provider === 'render_internal') {
    logger.info('Verwende Render-interne PostgreSQL-Datenbank (trading_journal_db)');
    return renderInternalDb as DatabaseModule;
  }
  
  // Wir verwenden nur noch die Render-interne Datenbank oder lokale Datenbank
  if (isRender || provider === 'render_internal') {
    logger.info('Verwende Render-interne Datenbank als Fallback');
    return renderInternalDb as DatabaseModule;
  } else {
    logger.info('Verwende lokale Datenbank');
    return localDb as DatabaseModule;
  }
}

// Ausgewählte Datenbankverbindung
const selectedDb = selectDatabaseConnection();

// Exportieren der Pool- und db-Instanzen aus der ausgewählten Datenbankverbindung
export const pool = selectedDb.pool;
export const db = selectedDb.db;

/**
 * Führt eine Datenbank-Anfrage sicher aus und handhabt Fehler
 * 
 * @param operation Die auszuführende Datenbankoperation (Funktion)
 * @param fallbackValue Der Wert, der bei einem Fehler zurückgegeben wird (optional)
 * @param errorMessage Eine benutzerdefinierte Fehlermeldung (optional)
 * @returns Das Ergebnis der Operation oder den Fallback-Wert
 */
export async function executeSafely<T>(
  operation: () => Promise<T>,
  fallbackValue?: T,
  errorMessage: string = "Fehler bei Datenbankoperation"
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    logger.error(`${errorMessage}:`, error);
    
    if (fallbackValue !== undefined) {
      return fallbackValue;
    }
    
    throw error;
  }
}

// Führe einen Test der Datenbankverbindung durch
export async function testConnection() {
  try {
    if (selectedDb && 'testDatabaseConnection' in selectedDb && typeof selectedDb.testDatabaseConnection === 'function') {
      return await selectedDb.testDatabaseConnection();
    } else {
      const result = await pool.query('SELECT NOW()');
      logger.info(`Datenbank-Verbindungstest erfolgreich: ${result.rows[0].now}`);
      return true;
    }
  } catch (error) {
    logger.error('Fehler beim Datenbank-Verbindungstest:', error);
    return false;
  }
}