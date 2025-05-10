/**
 * Datenbank-Setup-Skript (CommonJS Version für Render)
 * 
 * Dieses Skript richtet die Datenbank für das Trading Journal ein
 * und wird beim Deployment auf Render ausgeführt.
 */

const { Pool, neonConfig } = require('@neondatabase/serverless');
const ws = require('ws');

// WebSocket-Konstruktor für Neon einrichten
neonConfig.webSocketConstructor = ws;

async function createTables() {
  // Prüfe, ob die Datenbankverbindung konfiguriert ist
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL ist nicht definiert.');
    process.exit(1);
  }

  try {
    // Verbindung zur Datenbank herstellen
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });

    // Sessions-Tabelle erstellen, wenn sie nicht existiert
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
    `);

    // Index für expire-Spalte erstellen
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_sessions_expire ON sessions (expire);
    `);

    // Benutzer-Tabelle erstellen, wenn sie nicht existiert
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Standard-Benutzer einfügen, falls noch keine existieren
    const { rows } = await pool.query('SELECT COUNT(*) FROM users');
    if (parseInt(rows[0].count) === 0) {
      await pool.query(`
        INSERT INTO users (username, password) 
        VALUES ('admin', 'admin123'), ('mo', 'mo123')
      `);
    }

    console.log('Datenbank erfolgreich eingerichtet');
    await pool.end();
  } catch (error) {
    console.error('Fehler beim Einrichten der Datenbank:', error);
    process.exit(1);
  }
}

// Tabellen erstellen
createTables();