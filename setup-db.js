// setup-db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function createTables() {
  const client = await pool.connect();
  try {
    // Erstellen Sie die Benutzertabelle
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `);
    
    // Erstellen Sie die Trades-Tabelle
    await client.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        userId INTEGER NOT NULL,
        date TIMESTAMP WITH TIME ZONE NOT NULL,
        symbol TEXT NOT NULL,
        setup TEXT,
        timeframe TEXT,
        trend TEXT,
        direction TEXT NOT NULL,
        entry DECIMAL NOT NULL,
        exit DECIMAL NOT NULL,
        pnl DECIMAL NOT NULL,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (userId) REFERENCES users(id)
      );
    `);
    
    // Seed-Benutzer mit vordefinierten Passwörtern
    await client.query(`
      INSERT INTO users (username, password) 
      VALUES 
        ('admin', '$2a$10$vJSs7me6hEUt3SYQcVeS3OGcqH2i14KYZi0RRmj0dqX0YWyPcCkDC'),
        ('mo', '$2a$10$hQZJ75I45IpGrtNAkAVkE.W9FYe9i5QYrUfZ.AO6Lx7cwzyEADrcu')
      ON CONFLICT (username) DO NOTHING;
    `);
    
    console.log('Datenbank erfolgreich eingerichtet');
  } catch (error) {
    console.error('Fehler beim Einrichten der Datenbank:', error);
    throw error;
  } finally {
    client.release();
  }
}

createTables().catch(console.error);