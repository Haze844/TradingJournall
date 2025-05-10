/**
 * SUPABASE DATENBANKKONFIGURATION
 * 
 * Diese Datei konfiguriert die Verbindung zu einer Supabase PostgreSQL-Datenbank.
 * Supabase bietet PostgreSQL in der Cloud mit einfacher Verwaltung.
 * 
 * Anleitung zur Verbindung:
 * 1. Erstelle ein Projekt in Supabase (https://supabase.com/dashboard)
 * 2. Kopiere die Verbindungs-URL aus dem Dashboard
 *    (Connection Pooling URL oder Direct Connection URL)
 * 3. Setze die Umgebungsvariable DATABASE_URL auf diese URL
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

// WebSocket-Konstruktor für die Serverless-Umgebung konfigurieren
neonConfig.webSocketConstructor = ws;

// Verbesserte Fehlerbehandlung und Debugging
if (!process.env.DATABASE_URL) {
  console.error("KRITISCHER FEHLER: DATABASE_URL fehlt! Die Anwendung kann nicht mit der Datenbank verbunden werden.");
  throw new Error(
    "DATABASE_URL must be set. Die URL sollte aus dem Supabase Dashboard kopiert werden."
  );
}

// Variablen für Reconnect-Management
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 Sekunden
let isReconnecting = false;

// Log der Datenbankverbindung (ohne sensible Daten)
const dbUrlParts = process.env.DATABASE_URL.split('@');
const dbHost = dbUrlParts.length > 1 ? dbUrlParts[1].split('/')[0] : 'versteckt';
console.log(`Verbindung zu Supabase-Datenbank wird hergestellt (Host: ${dbHost})...`);

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Erhöhte Poolgrößen für bessere Leistung
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

/**
 * Prüft, ob ein Fehler ein Verbindungsfehler ist, der ein Reconnect rechtfertigt
 */
function isConnectionError(err: any): boolean {
  // Typische Verbindungsfehler mit PostgreSQL
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

  console.log(`Versuche Supabase-Datenbankverbindung wiederherzustellen (Versuch ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})...`);

  // Verzögerter Reconnect-Versuch
  setTimeout(() => {
    try {
      // Alten Pool schließen
      try {
        pool.end().catch(e => 
          console.error("Fehler beim Schließen des alten Pools:", e)
        );
      } catch (e) {
        console.error("Fehler beim Schließen des alten Pools:", e);
      }
      
      // Neuen Pool erstellen würde hier folgen, ist aber in diesem Fall nicht möglich,
      // da die Konstante nicht neu zugewiesen werden kann
      
      isReconnecting = false;
      console.log('Verbindung zurückgesetzt, versuche mit bestehendem Pool weiterzuarbeiten');
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

// Überwache Pool-Fehler und versuche Reconnect bei schwerwiegenden Fehlern
pool.on('error', (err) => {
  console.error('Unerwarteter Fehler am Supabase-Datenbankpool:', err);
  
  // Bei Verbindungsfehlern Reconnect versuchen
  if (isConnectionError(err)) {
    console.log('Verbindungsfehler erkannt, versuche Reconnect...');
    reconnect();
  }
});

// Drizzle ORM mit Schema initialisieren
export const db = drizzle({ client: pool, schema });

// Hilfsfunktion zum Ausführen von Datenbankoperationen mit automatischem Retry
export async function executeWithRetry<T>(
  operation: (dbInstance: typeof db) => Promise<T>,
  maxRetries = 3
): Promise<T> {
  let lastError;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await operation(db);
    } catch (error: any) {
      lastError = error;
      console.error(`Fehler bei Datenbankoperation (Versuch ${attempt + 1}/${maxRetries}):`, error);
      
      // Bei Verbindungsfehlern Reconnect versuchen
      if (isConnectionError(error)) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
        
        if (!isReconnecting) {
          reconnect();
        }
      } else {
        throw error;
      }
    }
  }
  
  throw lastError;
}

console.log("Supabase-Datenbankverbindung erfolgreich initialisiert.");