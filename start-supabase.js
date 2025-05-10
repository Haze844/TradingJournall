/**
 * Trading Journal Supabase-Starter
 * 
 * Dieses Skript startet das Trading Journal mit Supabase als Datenbankanbieter.
 * Es setzt die nötigen Umgebungsvariablen und führt dann das Setup-Skript aus,
 * bevor die Anwendung gestartet wird.
 * 
 * Verwendung: node start-supabase.js
 */

const { spawn, execSync } = require('child_process');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Konfiguration
const CONFIG = {
  databaseUrl: process.env.DATABASE_URL || null,
  defaultPort: process.env.PORT || 5000,
  sessionSecret: process.env.SESSION_SECRET || 'supabase-secret-' + Math.random().toString(36).substring(2, 15),
  nodeEnv: process.env.NODE_ENV || 'production'
};

// Umgebungsvariablen für Supabase
const ENV_VARS = {
  DATABASE_PROVIDER: 'supabase',
  DATABASE_URL: CONFIG.databaseUrl,
  NODE_ENV: CONFIG.nodeEnv,
  PORT: CONFIG.defaultPort,
  SESSION_SECRET: CONFIG.sessionSecret
};

// Hilfsfunktion zum Lesen der URL von der Konsole
function promptForDatabaseUrl() {
  return new Promise((resolve) => {
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    console.log('\n📋 Supabase-Datenbank-URL benötigt');
    console.log('------------------------');
    console.log('So findest du die URL:');
    console.log('1. Gehe zum Supabase Dashboard: https://supabase.com/dashboard');
    console.log('2. Wähle dein Projekt');
    console.log('3. Klicke auf "Project Settings" -> "Database"');
    console.log('4. Kopiere die "Connection string" unter "Transaction pooler"');
    console.log('5. Ersetze [YOUR-PASSWORD] mit deinem Datenbankpasswort\n');

    rl.question('Bitte gib die Supabase-Datenbank-URL ein: ', (url) => {
      rl.close();
      resolve(url.trim());
    });
  });
}

// Startet die Anwendung mit den angegebenen Umgebungsvariablen
function startApplication(envVars) {
  console.log('\n🚀 Starte das Trading Journal mit Supabase...');

  // Umgebungsvariablen ausgeben (ohne Passwort)
  const urlParts = envVars.DATABASE_URL.split('@');
  const safeUrl = urlParts.length > 1 
    ? `[credentials-hidden]@${urlParts[1]}`
    : '[verschlüsselt]';

  console.log('\n🔧 Konfiguration:');
  console.log(`- Datenbank-Provider: ${envVars.DATABASE_PROVIDER}`);
  console.log(`- Datenbank-URL: ${safeUrl}`);
  console.log(`- Umgebung: ${envVars.NODE_ENV}`);
  console.log(`- Port: ${envVars.PORT}`);
  console.log(`- Session-Secret: ${envVars.SESSION_SECRET.substring(0, 5)}...`);

  // Setup ausführen
  console.log('\n🔄 Führe Datenbank-Setup aus...');
  
  try {
    execSync('node setup-supabase.js', { 
      env: { ...process.env, ...envVars },
      stdio: 'inherit'
    });
  } catch (error) {
    console.error('\n❌ Das Datenbank-Setup ist fehlgeschlagen.');
    console.error('Bitte überprüfe deine Datenbankverbindung und versuche es erneut.');
    process.exit(1);
  }
  
  // Produktionsstart mit Node oder Entwicklungsstart mit TSX
  const command = envVars.NODE_ENV === 'production' 
    ? 'node' 
    : 'tsx';
  
  const scriptPath = envVars.NODE_ENV === 'production'
    ? path.join('dist', 'index.js')
    : path.join('server', 'index.ts');
  
  // Prüfen, ob das Skript existiert
  if (!fs.existsSync(scriptPath) && envVars.NODE_ENV === 'production') {
    console.log('\n🔄 Production build nicht gefunden, führe Build aus...');
    try {
      execSync('npm run build', { 
        env: { ...process.env, ...envVars },
        stdio: 'inherit'
      });
    } catch (error) {
      console.error('\n❌ Der Build ist fehlgeschlagen.');
      process.exit(1);
    }
  }
  
  console.log(`\n🚀 Starte Anwendung mit ${command} ${scriptPath}...`);

  // Anwendung starten
  const app = spawn(command, [scriptPath], {
    env: { ...process.env, ...envVars },
    stdio: 'inherit'
  });

  app.on('close', (code) => {
    console.log(`\n👋 Anwendung wurde beendet mit Code ${code}`);
  });

  // CTRL+C Handler
  process.on('SIGINT', () => {
    console.log('\n👋 Beende Anwendung...');
    app.kill('SIGINT');
    process.exit(0);
  });
}

// Hauptfunktion
async function main() {
  console.log('\n🌐 Trading Journal Supabase-Starter');
  console.log('======================================');

  // Wenn keine Datenbank-URL angegeben ist, nachfragen
  if (!CONFIG.databaseUrl) {
    ENV_VARS.DATABASE_URL = await promptForDatabaseUrl();
  }

  // URL validieren
  if (!ENV_VARS.DATABASE_URL || !ENV_VARS.DATABASE_URL.includes('supabase.co')) {
    console.error('\n❌ Ungültige Supabase-Datenbank-URL.');
    console.error('Die URL sollte postgresXX.supabase.co enthalten.');
    process.exit(1);
  }
  
  // Anwendung starten
  startApplication(ENV_VARS);
}

// Skript starten
main().catch(error => {
  console.error('Unbehandelter Fehler:', error);
  process.exit(1);
});