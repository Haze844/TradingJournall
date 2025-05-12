/**
 * Datenbank-Setup-Skript (CommonJS Version für Render)
 *
 * Dieses Skript richtet die Datenbank für das Trading Journal ein
 * und wird beim Deployment auf Render ausgeführt.
 */

const { Pool } = require('pg');

async function createTables() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL ist nicht definiert.');
    process.exit(1);
  }

  const pool = new Pool({ 
    connectionString: dbUrl,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined
  });

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
    
    // Trades-Tabelle
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
    console.log('✅ Trades-Tabelle erstellt');

    // Settings-Tabelle
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
    console.log('✅ Settings-Tabelle erstellt');

    // Weekly-Summary-Tabelle
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
    console.log('✅ Weekly-Summary-Tabelle erstellt');

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