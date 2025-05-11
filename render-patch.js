/**
 * Render-Deployment-Patch
 * Dieser Patch führt notwendige Anpassungen für Render-Deployments aus, 
 * die nicht in der normalen Konfiguration enthalten sind.
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[RENDER-PATCH] ${message}`);
}

// 1. Datei-Check - Prüfen, ob die notwendigen Dateien existieren
log('Überprüfe Dateien für Render-Deployment...');

// ESM-Format Check und Anpassung
if (fs.existsSync(path.join(__dirname, 'dist/index.js')) && 
    !fs.existsSync(path.join(__dirname, 'dist/index.mjs'))) {
  log('dist/index.js gefunden, aber keine dist/index.mjs - erstelle Symlink');
  try {
    fs.symlinkSync(
      path.join(__dirname, 'dist/index.js'), 
      path.join(__dirname, 'dist/index.mjs'),
      'file'
    );
    log('✅ Symlink von index.js zu index.mjs erstellt');
  } catch (error) {
    log(`❌ Fehler beim Erstellen des Symlinks: ${error.message}`);
  }
}

// 2. Umgebungsvariablen anpassen
log('Konfiguriere Umgebungsvariablen für Render...');

// Setze spezifische Render-Flags
process.env.RENDER = 'true';
process.env.DATABASE_PROVIDER = 'render_internal';

if (!process.env.DATABASE_URL) {
  log('⚠️ WARNUNG: DATABASE_URL ist nicht gesetzt! Die Anwendung wird nicht korrekt funktionieren.');
} else {
  log('✅ DATABASE_URL ist gesetzt');
}

if (!process.env.SESSION_SECRET) {
  process.env.SESSION_SECRET = `render-generated-${Date.now()}`;
  log('⚠️ WARNUNG: SESSION_SECRET ist nicht gesetzt! Es wurde ein temporärer Wert generiert.');
} else {
  log('✅ SESSION_SECRET ist gesetzt');
}

log('✅ Render-Patch erfolgreich angewendet!');