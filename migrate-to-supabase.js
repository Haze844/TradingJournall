/**
 * Datenbank-Migrations-Skript: Neon PostgreSQL → Supabase
 * 
 * Dieses Skript liest Daten aus einer Neon PostgreSQL-Datenbank und überträgt sie
 * in eine Supabase-Datenbank. Es ermöglicht die Migration des Trading Journals
 * ohne Datenverlust.
 * 
 * Verwendung: 
 * - Setze NEON_DATABASE_URL für die Quelldatenbank
 * - Setze SUPABASE_DATABASE_URL für die Zieldatenbank
 * - Führe das Skript mit `node migrate-to-supabase.js` aus
 * 
 * Anmerkung: Vor der Migration wird die Zieldatenbank eingerichtet (setup-supabase.js).
 * Die Primärschlüssel-Sequenzen werden nach der Migration aktualisiert.
 */

const { Pool } = require('@neondatabase/serverless');
const readline = require('readline');
const { execSync } = require('child_process');

// Verbindungsinformationen
const SOURCE_DB_URL = process.env.NEON_DATABASE_URL || process.env.SOURCE_DATABASE_URL;
const TARGET_DB_URL = process.env.SUPABASE_DATABASE_URL || process.env.TARGET_DATABASE_URL;

// Hilfsfunktion zum Lesen der URLs von der Konsole
async function promptForDatabaseUrls() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  return new Promise(async (resolve) => {
    console.log('\n📋 Datenbank-Migration: Neon → Supabase');
    console.log('----------------------------------');
    
    let sourceUrl = SOURCE_DB_URL;
    let targetUrl = TARGET_DB_URL;
    
    if (!sourceUrl) {
      sourceUrl = await new Promise(resolve => {
        console.log('\n📤 Quelldatenbank (Neon PostgreSQL):');
        rl.question('Bitte gib die Neon PostgreSQL Datenbank-URL ein: ', (url) => {
          resolve(url.trim());
        });
      });
    }
    
    if (!targetUrl) {
      targetUrl = await new Promise(resolve => {
        console.log('\n📥 Zieldatenbank (Supabase):');
        console.log('Die URL findest du im Supabase Dashboard unter "Project Settings" -> "Database" -> "Connection string"');
        rl.question('Bitte gib die Supabase Datenbank-URL ein: ', (url) => {
          resolve(url.trim());
        });
      });
    }
    
    rl.close();
    resolve({ sourceUrl, targetUrl });
  });
}

// Verbindung zu einer Datenbank herstellen
async function connectToDatabase(url, name) {
  console.log(`🔄 Verbindung zur ${name}-Datenbank wird hergestellt...`);

  try {
    const pool = new Pool({
      connectionString: url,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    // Test-Query ausführen
    await pool.query('SELECT NOW()');
    console.log(`✅ Verbindung zur ${name}-Datenbank hergestellt`);
    return pool;
  } catch (error) {
    console.error(`❌ Verbindung zur ${name}-Datenbank fehlgeschlagen:`, error.message);
    if (error.message.includes('password')) {
      console.error(`Bitte überprüfe, ob du "[YOUR-PASSWORD]" in der ${name}-URL durch dein echtes Passwort ersetzt hast`);
    }
    process.exit(1);
  }
}

// Zieldatenbank einrichten
async function setupTargetDatabase(targetUrl) {
  console.log('\n🔄 Richte Zieldatenbank (Supabase) ein...');
  
  try {
    process.env.DATABASE_URL = targetUrl;
    process.env.DATABASE_PROVIDER = 'supabase';
    
    execSync('node setup-supabase.js', { 
      stdio: 'inherit'
    });
    
    console.log('✅ Zieldatenbank erfolgreich eingerichtet');
  } catch (error) {
    console.error('❌ Einrichtung der Zieldatenbank fehlgeschlagen');
    throw error;
  }
}

// Daten aus einer Tabelle migrieren
async function migrateTable(sourcePool, targetPool, tableName, idColumn = 'id') {
  console.log(`\n🔄 Migriere Tabelle "${tableName}"...`);
  
  try {
    // Daten aus Quelldatenbank lesen
    const sourceResult = await sourcePool.query(`SELECT * FROM ${tableName}`);
    const rows = sourceResult.rows;
    
    if (rows.length === 0) {
      console.log(`ℹ️ Keine Daten in Tabelle "${tableName}" gefunden`);
      return 0;
    }
    
    console.log(`📊 ${rows.length} Datensätze in "${tableName}" gefunden`);
    
    // Zieldatenbank leeren
    await targetPool.query(`DELETE FROM ${tableName}`);
    
    // Spaltenüberschriften ermitteln
    const columnNames = Object.keys(rows[0]);
    const columns = columnNames.join(', ');
    
    // Daten in Zieldatenbank einfügen
    for (const row of rows) {
      const values = columnNames.map(col => {
        const value = row[col];
        if (value === null) return 'NULL';
        if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
        if (value instanceof Date) return `'${value.toISOString()}'`;
        return value;
      });
      
      const sql = `INSERT INTO ${tableName} (${columns}) VALUES (${values.join(', ')})`;
      await targetPool.query(sql);
    }
    
    // Primärschlüssel-Sequenz aktualisieren
    if (idColumn) {
      try {
        await targetPool.query(`
          SELECT setval(pg_get_serial_sequence('${tableName}', '${idColumn}'), 
                        (SELECT COALESCE(MAX(${idColumn}), 0) FROM ${tableName}), true);
        `);
      } catch (error) {
        console.warn(`⚠️ Konnte Sequenz für ${tableName}.${idColumn} nicht aktualisieren:`, error.message);
      }
    }
    
    console.log(`✅ Tabelle "${tableName}" erfolgreich migriert (${rows.length} Datensätze)`);
    return rows.length;
  } catch (error) {
    console.error(`❌ Fehler bei der Migration von Tabelle "${tableName}":`, error.message);
    throw error;
  }
}

// Hauptfunktion zum Ausführen der Migration
async function migrateDatabase() {
  console.log('🚀 Starte Datenbank-Migration: Neon PostgreSQL → Supabase');
  
  // Verbindungsinformationen abrufen
  const { sourceUrl, targetUrl } = await promptForDatabaseUrls();
  
  if (!sourceUrl || !targetUrl) {
    console.error('❌ Fehlende Datenbank-URLs. Bitte gib sowohl Quell- als auch Ziel-URL an.');
    process.exit(1);
  }
  
  // Zieldatenbank einrichten
  await setupTargetDatabase(targetUrl);
  
  // Verbindungen herstellen
  const sourcePool = await connectToDatabase(sourceUrl, 'Quell');
  const targetPool = await connectToDatabase(targetUrl, 'Ziel');
  
  try {
    // Migrationsstatus initialisieren
    const stats = {
      users: 0,
      settings: 0,
      trades: 0,
      weekly_stats: 0
    };
    
    // Tabellen in der richtigen Reihenfolge migrieren (wegen Fremdschlüsseln)
    stats.users = await migrateTable(sourcePool, targetPool, 'users');
    stats.settings = await migrateTable(sourcePool, targetPool, 'settings');
    stats.trades = await migrateTable(sourcePool, targetPool, 'trades');
    stats.weekly_stats = await migrateTable(sourcePool, targetPool, 'weekly_stats');
    
    // Zusammenfassung anzeigen
    console.log('\n✅ Migration erfolgreich abgeschlossen!');
    console.log('\n📊 Zusammenfassung:');
    console.log(`- Benutzer: ${stats.users}`);
    console.log(`- Einstellungen: ${stats.settings}`);
    console.log(`- Trades: ${stats.trades}`);
    console.log(`- Wochenstatistiken: ${stats.weekly_stats}`);
    
    console.log('\n🚀 Die Anwendung kann jetzt mit der Supabase-Datenbank gestartet werden:');
    console.log('    node start-supabase.js');
    
  } catch (error) {
    console.error('\n❌ Migration fehlgeschlagen:', error);
    process.exit(1);
  } finally {
    // Verbindungen schließen
    await sourcePool.end();
    await targetPool.end();
  }
}

// Skript starten
migrateDatabase().catch(error => {
  console.error('\n❌ Unbehandelter Fehler:', error);
  process.exit(1);
});