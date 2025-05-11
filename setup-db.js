/**
 * Datenbank-Setup-Skript für INTERNE RENDER-DATENBANK
 * 
 * Dieses Skript richtet die Datenbank für das Trading Journal ein
 * und wird beim Deployment auf Render ausgeführt.
 * 
 * WICHTIG: Konfiguriert für die interne Render-Datenbank (keine Neon-Abhängigkeit)
 */

import { Pool } from 'pg';
import fs from 'fs';

async function createTables() {
  // Prüfe, ob die Datenbankverbindung konfiguriert ist
  if (!process.env.DATABASE_URL) {
    console.error('DATABASE_URL ist nicht definiert.');
    process.exit(1);
  }

  try {
    console.log('Verbinde mit Render-interner Datenbank...');
    
    // Verbindung zur Datenbank herstellen mit SSL-Konfiguration
    const pool = new Pool({ 
      connectionString: process.env.DATABASE_URL,
      // SSL-Konfiguration für Render-Umgebung
      ssl: process.env.NODE_ENV === 'production' ? {
        rejectUnauthorized: false // Akzeptiere auch selbstsignierte Zertifikate
      } : undefined
    });
    
    console.log('Datenbankverbindung hergestellt, erstelle Tabellen...');

    // Sessions-Tabelle erstellen, wenn sie nicht existiert
    await pool.query(`
      CREATE TABLE IF NOT EXISTS sessions (
        sid VARCHAR NOT NULL PRIMARY KEY,
        sess JSON NOT NULL,
        expire TIMESTAMP(6) NOT NULL
      );
    `);
    console.log('Sessions-Tabelle erstellt oder existiert bereits');

    // Index für expire-Spalte erstellen
    await pool.query(`
      CREATE INDEX IF NOT EXISTS IDX_sessions_expire ON sessions (expire);
    `);
    console.log('Sessions-Index erstellt oder existiert bereits');

    // Benutzer-Tabelle erstellen, wenn sie nicht existiert
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username TEXT NOT NULL UNIQUE,
        password TEXT NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Benutzer-Tabelle erstellt oder existiert bereits');

    // Trades-Tabelle erstellen
    await pool.query(`
      CREATE TABLE IF NOT EXISTS trades (
        id SERIAL PRIMARY KEY,
        symbol TEXT,
        date TIMESTAMP WITH TIME ZONE,
        setup TEXT,
        main_trend_m15 TEXT,
        internal_trend_m5 TEXT,
        entry_type TEXT,
        entry_level TEXT,
        position_size NUMERIC,
        take_profit NUMERIC,
        stop_loss NUMERIC,
        exit_level NUMERIC,
        potential_rrr NUMERIC,
        actual_rrr NUMERIC,
        trade_duration TEXT,
        trade_result TEXT,
        notes TEXT,
        chart_image_url TEXT,
        liquidity_level TEXT,
        deviation TEXT,
        session_nyc BOOLEAN,
        session_london BOOLEAN,
        session_asia BOOLEAN,
        session_time TEXT,
        trend_alignment TEXT,
        smart_money_concept TEXT,
        market_structure TEXT,
        advanced_pattern TEXT,
        chart_pattern TEXT,
        fundamental_news TEXT,
        wick_fill TEXT,
        spread_size TEXT,
        psychological_level BOOLEAN,
        trade_management TEXT,
        exit_reason TEXT,
        advanced_exit TEXT,
        liquidation_level TEXT,
        liquidation_entry TEXT,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Trades-Tabelle erstellt oder existiert bereits');
    
    // Settings-Tabelle erstellen
    await pool.query(`
      CREATE TABLE IF NOT EXISTS settings (
        id SERIAL PRIMARY KEY,
        key TEXT NOT NULL,
        value JSONB,
        user_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Settings-Tabelle erstellt oder existiert bereits');
    
    // Weekly summary Tabelle erstellen
    await pool.query(`
      CREATE TABLE IF NOT EXISTS weekly_summary (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id),
        week_start TIMESTAMP WITH TIME ZONE,
        week_end TIMESTAMP WITH TIME ZONE,
        total_rr NUMERIC,
        trade_count INTEGER,
        win_rate NUMERIC,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    console.log('Weekly-Summary-Tabelle erstellt oder existiert bereits');

    // Standard-Benutzer einfügen, falls noch keine existieren
    try {
      const { rows } = await pool.query('SELECT COUNT(*) FROM users');
      if (parseInt(rows[0].count) === 0) {
        await pool.query(`
          INSERT INTO users (username, password) 
          VALUES ('admin', 'admin123'), ('mo', 'mo123')
        `);
        console.log('Standard-Benutzer wurden erstellt');
      } else {
        console.log('Benutzer existieren bereits, überspringe Erstellung');
      }
    } catch (error) {
      console.error('Fehler beim Überprüfen/Erstellen der Benutzer:', error);
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