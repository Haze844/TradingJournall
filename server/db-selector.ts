/**
 * DATENBANKAUSWAHL
 * 
 * Diese Datei ermöglicht das einfache Umschalten zwischen verschiedenen
 * Datenbankanbietern wie Neon, Supabase oder lokalem PostgreSQL, ohne
 * dass Änderungen am Code vorgenommen werden müssen.
 * 
 * Die Auswahl erfolgt automatisch basierend auf den Umgebungsvariablen:
 * - Wenn DATABASE_PROVIDER=supabase gesetzt ist, wird Supabase verwendet
 * - Wenn DATABASE_PROVIDER=neon gesetzt ist, wird Neon verwendet
 * - Standardmäßig wird die Standardkonfiguration verwendet (abhängig von DATABASE_URL)
 */

import * as neonDb from './db';
import * as supabaseDb from './db-supabase';

// Typ für exportierte Datenbank-Module
interface DatabaseModule {
  db: typeof neonDb.db;
  pool: typeof neonDb.pool;
  executeWithRetry?: <T>(
    operation: (db: typeof neonDb.db) => Promise<T>,
    maxRetries?: number
  ) => Promise<T>;
}

// Prüfen, welche Datenbank verwendet werden soll
const databaseProvider = process.env.DATABASE_PROVIDER?.toLowerCase() || 'auto';

// Datenbank-Modul basierend auf der Konfiguration auswählen
let selectedDb: DatabaseModule;

if (databaseProvider === 'supabase') {
  console.log('Verwende Supabase als Datenbankanbieter (explizit konfiguriert)');
  selectedDb = supabaseDb;
} else if (databaseProvider === 'neon') {
  console.log('Verwende Neon als Datenbankanbieter (explizit konfiguriert)');
  selectedDb = neonDb;
} else {
  // Automatische Erkennung basierend auf der DATABASE_URL
  if (process.env.DATABASE_URL?.includes('supabase.co')) {
    console.log('Supabase-Datenbank-URL erkannt, verwende Supabase-Konfiguration');
    selectedDb = supabaseDb;
  } else if (process.env.DATABASE_URL?.includes('neon.tech')) {
    console.log('Neon-Datenbank-URL erkannt, verwende Neon-Konfiguration');
    selectedDb = neonDb;
  } else {
    console.log('Verwende Standard-Datenbankkonfiguration');
    selectedDb = neonDb;
  }
}

// Exportiere die ausgewählte Datenbankkonfiguration
export const db = selectedDb.db;
export const pool = selectedDb.pool;
export const executeWithRetry = selectedDb.executeWithRetry;

// Hilfsfunktion zum Ausführen einer Datenbankoperation
export async function executeSafely<T>(
  operation: (db: typeof neonDb.db) => Promise<T>
): Promise<T> {
  if (executeWithRetry) {
    return await executeWithRetry(operation);
  } else {
    try {
      return await operation(db);
    } catch (error) {
      console.error('Fehler bei Datenbankoperation ohne Retry-Mechanismus:', error);
      throw error;
    }
  }
}