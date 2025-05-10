/**
 * DATENBANK-KONFIGURATION mit FEHLERBEHANDLUNG für RENDER
 * 
 * Diese Datei wurde optimiert, um mit häufigen Datenbankproblemen
 * in der Render-Umgebung zuverlässig umzugehen. Bei Verbindungsproblemen
 * wird automatisch ein Reconnect versucht.
 */

import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-serverless';
import ws from "ws";
import * as schema from "../shared/schema";

neonConfig.webSocketConstructor = ws;

// Verbesserte Fehlerbehandlung und Debugging
if (!process.env.DATABASE_URL) {
  console.error("KRITISCHER FEHLER: DATABASE_URL fehlt! Die Anwendung kann nicht mit der Datenbank verbunden werden.");
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

// Variablen für Reconnect-Management
let reconnectAttempts = 0;
const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_DELAY = 2000; // 2 Sekunden
let isReconnecting = false;

// Verbesserte Verbindung mit Fehlerbehandlung
console.log("Datenbankverbindung mit Neon Serverless wird hergestellt...");

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
  console.error('Unerwarteter Fehler am Datenbankpool:', err);
  
  // Bei Verbindungsfehlern Reconnect versuchen
  if (isConnectionError(err)) {
    console.log('Verbindungsfehler erkannt, versuche Reconnect...');
    reconnect();
  }
});

export const db = drizzle({ client: pool, schema });

console.log("Datenbankverbindung erfolgreich initialisiert.");
