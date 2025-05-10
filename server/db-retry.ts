/**
 * DATENBANK-RETRY-MECHANISMUS
 * 
 * Dieses Modul implementiert eine robuste Fehlerbehandlung und
 * automatische Wiederverbindung für die Datenbankverbindung,
 * insbesondere für Neon Serverless PostgreSQL in Render.
 * 
 * Es löst häufige Probleme wie "57P01" (Termination aufgrund von Inaktivität)
 * und andere häufige Verbindungsprobleme.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "@shared/schema";

neonConfig.webSocketConstructor = ws;

// Globale Datenbankverbindung und Reconnect-Status
let pool: Pool | null = null;
let db: ReturnType<typeof drizzle> | null = null;
let isReconnecting = false;
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 Sekunden

/**
 * Erzeugt einen neuen Datenbankpool und stellt eine Verbindung her
 */
function createPool() {
  if (!process.env.DATABASE_URL) {
    throw new Error(
      "DATABASE_URL must be set. Did you forget to provision a database?",
    );
  }

  console.log("Datenbankverbindung mit Neon Serverless wird hergestellt...");
  
  try {
    // Bestehenden Pool schließen, falls vorhanden
    if (pool) {
      try {
        pool.end();
      } catch (e) {
        console.error("Fehler beim Schließen des bestehenden Pools:", e);
      }
    }

    // Neuen Pool erstellen
    pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      max: 20, // Maximal 20 Verbindungen im Pool
      idleTimeoutMillis: 30000, // 30 Sekunden Inaktivitätstimeout
      connectionTimeoutMillis: 10000, // 10 Sekunden Verbindungstimeout
    });

    // Event-Handler für Pool-Fehler
    pool.on('error', (err) => {
      console.error('Unerwarteter Datenbankfehler auf Pool-Ebene:', err);
      
      // Prüfen, ob Reconnect nötig ist
      if (!isReconnecting && isConnectionError(err)) {
        console.log('Starte Reconnect aufgrund eines Pool-Fehlers...');
        reconnect();
      }
    });

    // Drizzle-Instanz erstellen
    db = drizzle({ client: pool, schema });

    console.log("Datenbankverbindung erfolgreich initialisiert.");
    reconnectAttempts = 0;
    return { pool, db };
  } catch (error) {
    console.error("Fehler beim Initialisieren der Datenbankverbindung:", error);
    
    // Bei Verbindungsproblemen beim Start automatisch neu versuchen
    if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
      reconnect();
    }
    
    throw error;
  }
}

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
    'ETIMEDOUT' // Timeout
  ];

  // Prüfen auf PostgreSQL-Fehlercode
  if (err.code && connectionErrorCodes.includes(err.code)) {
    return true;
  }

  // Prüfen auf Netzwerkfehler
  if (err.message && (
    err.message.includes('connection') || 
    err.message.includes('timeout') ||
    err.message.includes('socket')
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

  console.log(`Versuche Datenbankverbindung wiederherzustellen (Versuch ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

  // Verzögerter Reconnect-Versuch
  setTimeout(() => {
    try {
      createPool();
      isReconnecting = false;
      console.log('Datenbankverbindung erfolgreich wiederhergestellt!');
    } catch (error) {
      console.error(`Reconnect-Versuch ${reconnectAttempts} fehlgeschlagen:`, error);
      isReconnecting = false;
      
      // Weitere Versuche, wenn Maximum nicht erreicht
      if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        reconnect();
      } else {
        console.error(`Maximale Anzahl von Reconnect-Versuchen (${MAX_RECONNECT_ATTEMPTS}) erreicht.`);
      }
    }
  }, RECONNECT_DELAY);
}

// Initialer Verbindungsaufbau
const { pool: initialPool, db: initialDb } = createPool();
export const dbPool = initialPool;
export const db = initialDb;

/**
 * Führt eine Datenbankabfrage mit automatischem Retry bei Verbindungsproblemen aus
 */
export async function executeWithRetry<T>(
  operation: (db: ReturnType<typeof drizzle>) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      if (!db) {
        // Falls die DB-Verbindung nicht existiert, neu erstellen
        const { db: newDb } = createPool();
        return await operation(newDb!);
      }
      
      // Operation ausführen
      return await operation(db);
    } catch (error: any) {
      lastError = error;
      console.error(`Fehler bei Datenbankoperation (Versuch ${attempt + 1}/${maxRetries}):`, error);
      
      // Bei Verbindungsfehlern Reconnect versuchen
      if (isConnectionError(error)) {
        console.log('Verbindungsfehler erkannt, versuche Reconnect...');
        
        // Warten vor dem nächsten Versuch
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        
        // Verbindung neu aufbauen, falls nötig
        if (!isReconnecting) {
          reconnect();
        }
      } else {
        // Bei anderen Fehlern direkt werfen
        throw error;
      }
    }
  }
  
  // Nach allen Versuchen weiterhin Fehler
  console.error(`Alle ${maxRetries} Versuche für Datenbankoperation fehlgeschlagen.`);
  throw lastError;
}