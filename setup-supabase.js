/**
 * Supabase-Datenbank-Setup-Skript
 * 
 * Dieses Skript richtet die Datenbank für das Trading Journal in Supabase ein
 * und wird beim Deployment ausgeführt.
 * 
 * Verwendung: NODE_ENV=production DATABASE_PROVIDER=supabase node setup-supabase.js
 */

const { Pool } = require('@neondatabase/serverless');
const fs = require('fs');
const readline = require('readline');

// Verbindung zur Datenbank aufbauen
async function connectToDatabase() {
  if (!process.env.DATABASE_URL) {
    console.error('❌ Fehler: DATABASE_URL ist nicht gesetzt');
    console.error('Bitte setze die DATABASE_URL-Umgebungsvariable auf deine Supabase-Verbindungs-URL');
    console.error('- Verfügbar im Supabase Dashboard unter "Settings" -> "Database"');
    console.error('- Wähle "Connection string" -> "Transaction pooler" und ersetze "[YOUR-PASSWORD]"');
    process.exit(1);
  }

  console.log('🔄 Verbindung zur Supabase-Datenbank wird hergestellt...');

  try {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test-Query ausführen
    await pool.query('SELECT NOW()');
    console.log('✅ Datenbankverbindung hergestellt');
    return pool;
  } catch (error) {
    console.error('❌ Verbindung zur Datenbank fehlgeschlagen:', error.message);
    if (error.message.includes('password')) {
      console.error('Bitte überprüfe, ob du "[YOUR-PASSWORD]" in der Verbindungs-URL durch dein echtes Passwort ersetzt hast');
    }
    process.exit(1);
  }
}

// Tabelle für Sessions erstellen
async function createSessionsTable(pool) {
  try {
    console.log('🔄 Erstelle Sessions-Tabelle...');
    
    const createSessionsTableSQL = `
      CREATE TABLE IF NOT EXISTS "sessions" (
        "sid" varchar NOT NULL PRIMARY KEY,
        "sess" jsonb NOT NULL,
        "expire" timestamp(6) NOT NULL
      );
      CREATE INDEX IF NOT EXISTS "IDX_session_expire" ON "sessions" ("expire");
    `;
    
    await pool.query(createSessionsTableSQL);
    console.log('✅ Sessions-Tabelle erstellt oder bereits vorhanden');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Sessions-Tabelle:', error.message);
    throw error;
  }
}

// Schema-Tabellen erstellen
async function createSchemaTables(pool) {
  console.log('🔄 Erstelle Schema-Tabellen...');
  
  try {
    // Users-Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "users" (
        "id" serial PRIMARY KEY,
        "username" varchar NOT NULL UNIQUE,
        "password" varchar NOT NULL,
        "created_at" timestamp DEFAULT NOW()
      );
    `);
    console.log('✅ Users-Tabelle erstellt oder bereits vorhanden');

    // Settings-Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "settings" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "goal_amount_pa" integer DEFAULT 1000,
        "goal_amount_eva" integer DEFAULT 1000,
        "goal_amount_ek" integer DEFAULT 1000,
        "account_balance_pa" integer DEFAULT 0,
        "account_balance_eva" integer DEFAULT 0,
        "account_balance_ek" integer DEFAULT 0,
        "currency_symbol" varchar DEFAULT '$',
        "created_at" timestamp DEFAULT NOW(),
        "updated_at" timestamp DEFAULT NOW()
      );
    `);
    console.log('✅ Settings-Tabelle erstellt oder bereits vorhanden');

    // Trades-Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "trades" (
        "id" serial PRIMARY KEY,
        "user_id" integer NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
        "symbol" varchar,
        "date" timestamp NOT NULL,
        "setup" varchar,
        "main_trend_m15" varchar,
        "internal_trend_m5" varchar,
        "entry_type" varchar,
        "entry_level" varchar,
        "stop_loss" varchar,
        "risk_reward_ratio" real,
        "result" varchar,
        "exit_reason" varchar,
        "quality" varchar,
        "satisfaction" varchar,
        "quality_sessions" varchar,
        "trade_duration" varchar,
        "missed" boolean DEFAULT false,
        "notes" text,
        "time_frame" varchar,
        "day_of_week" varchar,
        "trading_session" varchar,
        "high_impact_news" boolean DEFAULT false,
        "market_structure" varchar,
        "position_size" varchar,
        "stop_loss_size" varchar,
        "account_type" varchar DEFAULT 'PA',
        "chart_image" text,
        "liquidation_level" varchar,
        "liquidation_entry" varchar,
        "created_at" timestamp DEFAULT NOW(),
        "updated_at" timestamp DEFAULT NOW()
      );
    `);
    console.log('✅ Trades-Tabelle erstellt oder bereits vorhanden');

    // Weekly Stats-Tabelle
    await pool.query(`
      CREATE TABLE IF NOT EXISTS "weekly_stats" (
        "id" serial PRIMARY KEY,
        "user_id" integer REFERENCES "users"("id") ON DELETE CASCADE,
        "week_start" timestamp NOT NULL,
        "week_end" timestamp NOT NULL,
        "total_rr" real NOT NULL,
        "trade_count" integer NOT NULL,
        "win_rate" real NOT NULL
      );
    `);
    console.log('✅ Weekly Stats-Tabelle erstellt oder bereits vorhanden');

    console.log('✅ Alle Schema-Tabellen erstellt oder aktualisiert');
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Schema-Tabellen:', error.message);
    throw error;
  }
}

// Benutzer erstellen, wenn keine vorhanden sind
async function createInitialUsers(pool) {
  try {
    // Überprüfen, ob bereits Benutzer vorhanden sind
    const result = await pool.query('SELECT COUNT(*) FROM users');
    const userCount = parseInt(result.rows[0].count, 10);
    
    if (userCount === 0) {
      console.log('🔄 Keine Benutzer gefunden, erstelle Standardbenutzer...');
      
      // Admin-Benutzer erstellen (PW: admin123)
      await pool.query(`
        INSERT INTO users (username, password) 
        VALUES ('admin', 'f16bed56189e0a971a3e115c683a65c0b7e507c35552f852fdde0d839c308659.d89e7e6c1880f2c4c4392c0850e3a515');
      `);
      
      // Mo-Benutzer erstellen (PW: mo123)
      await pool.query(`
        INSERT INTO users (username, password) 
        VALUES ('mo', 'f16bed56189e0a971a3e115c683a65c0b7e507c35552f852fdde0d839c308659.d89e7e6c1880f2c4c4392c0850e3a515');
      `);
      
      console.log('✅ Standardbenutzer erfolgreich erstellt:');
      console.log('   - Benutzername: admin, Passwort: admin123');
      console.log('   - Benutzername: mo, Passwort: mo123');
    } else {
      console.log(`ℹ️ Es sind bereits ${userCount} Benutzer in der Datenbank vorhanden`);
    }
  } catch (error) {
    console.error('❌ Fehler beim Erstellen der Standardbenutzer:', error.message);
    throw error;
  }
}

// Alle Operationen ausführen
async function setupDatabase() {
  console.log('🚀 Starte das Supabase-Setup für das Trading Journal...');
  console.log('Umgebung:', process.env.NODE_ENV || 'development');
  
  const pool = await connectToDatabase();
  
  try {
    await createSessionsTable(pool);
    await createSchemaTables(pool);
    await createInitialUsers(pool);
    
    console.log('✅ Datenbank-Setup abgeschlossen');
  } catch (error) {
    console.error('❌ Datenbank-Setup fehlgeschlagen:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

// Skript starten
setupDatabase().catch(err => {
  console.error('Unbehandelter Fehler:', err);
  process.exit(1);
});