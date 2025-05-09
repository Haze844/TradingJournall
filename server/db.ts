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

// Verbesserte Verbindung mit Fehlerbehandlung
console.log("Datenbankverbindung mit Neon Serverless wird hergestellt...");

export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 20, // Erhöhte Poolgrößen für bessere Leistung
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
});

// Überwache Pool-Fehler
pool.on('error', (err) => {
  console.error('Unerwarteter Fehler am Datenbankpool:', err);
});

export const db = drizzle({ client: pool, schema });

console.log("Datenbankverbindung erfolgreich initialisiert.");
