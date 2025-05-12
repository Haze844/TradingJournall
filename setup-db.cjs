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
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL ist nicht definiert.');
    process.exit(1);
  }

  const pool = new Pool({ connectionString: dbUrl });

  try {
    console.log('🔧 Starte Tabellenerstellung...');

    // Sessions-Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR(255) NOT NULL PRIMARY KEY,
        sess JSONB NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
    `);
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_sessions_expire ON sessions (expire);
    `);
    console.log('✅ Sessions-Tabelle bereit');

    // Users-Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);
    console.log('✅ Users-Tabelle bereit');

    // Admin-Benutzer einfügen, falls keine Benutzer existieren
    const { rows } = await pool.query(`SELECT COUNT(*) FROM users`);
    if (parseInt(rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO users (username, password)
        VALUES
          ('admin', 'admin123'),
          ('mo', 'mo123');
      `);
      console.log('🔐 Standardbenutzer eingefügt');
    } else {
      console.log('👥 Benutzer existieren bereits – kein Insert notwendig');
    }

    console.log('🎉 Datenbank erfolgreich eingerichtet');
  } catch (error) {
    console.error('❌ Fehler beim Einrichten der Datenbank:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Tabellen erstellen
createTables();