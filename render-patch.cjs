/**
 * RENDER-PATCH für TradingJournal
 * 
 * Dieses Skript wird im Render-Deployment ausgeführt, um Probleme zu beheben,
 * die speziell in der Render-Umgebung auftreten können.
 * 
 * Hauptfunktionen:
 * 1. Debugging für Render aktivieren
 * 2. Verzeichnisse überprüfen und erstellen
 * 3. Datei- und Verzeichnisberechtigungen korrigieren
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `${timestamp} - ${message}`;
  console.log(logMessage);
  
  // Auch in Logdatei schreiben
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    fs.appendFileSync(path.join(logDir, 'render-patch.log'), logMessage + '\n');
  } catch (error) {
    console.error(`Fehler beim Schreiben in die Logdatei: ${error.message}`);
  }
}

function ensureDirectoryExists(dirPath) {
  try {
    if (!fs.existsSync(dirPath)) {
      log(`Verzeichnis nicht gefunden: ${dirPath}, wird erstellt...`);
      fs.mkdirSync(dirPath, { recursive: true });
      log(`Verzeichnis erfolgreich erstellt: ${dirPath}`);
    } else {
      log(`Verzeichnis gefunden: ${dirPath}`);
    }
    return true;
  } catch (error) {
    log(`Fehler beim Überprüfen/Erstellen von Verzeichnis ${dirPath}: ${error.message}`);
    return false;
  }
}

function isRenderEnvironment() {
  return process.env.RENDER === "true" || !!process.env.RENDER_EXTERNAL_URL;
}

// Hauptfunktion
function applyRenderPatches() {
  log('Render-Patch-Skript gestartet');
  
  // Prüfen, ob wir in einer Render-Umgebung sind
  if (!isRenderEnvironment()) {
    log('Keine Render-Umgebung erkannt, Patching wird übersprungen.');
    return;
  }
  
  log('Render-Umgebung erkannt, Patches werden angewendet...');
  
  // Wichtig: Datenbankanbieter auf Render-intern setzen
  log('Datenbankanbieter wird auf render_internal gesetzt...');
  process.env.DATABASE_PROVIDER = 'render_internal';
  
  // Render-Flag setzen, falls noch nicht vorhanden
  if (!process.env.RENDER) {
    process.env.RENDER = 'true';
    log('RENDER-Flag wurde gesetzt');
  }
  
  // Umgebungsvariablen protokollieren (ohne sensible Daten)
  log(`NODE_ENV: ${process.env.NODE_ENV}`);
  log(`RENDER_EXTERNAL_URL: ${process.env.RENDER_EXTERNAL_URL || 'nicht gesetzt'}`);
  
  // 1. Verzeichnisse prüfen und erstellen
  const baseDirs = [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'dist', 'public'),
    path.join(process.cwd(), 'logs')
  ];
  
  for (const dir of baseDirs) {
    ensureDirectoryExists(dir);
  }
  
  // 2. Routing-Workaround für direkten Auth-Zugriff
  log('Routing-Workaround für direkten Auth-Zugriff wird installiert...');
  try {
    // In Render erst im dist/public, falls das existiert
    if (fs.existsSync(path.join(process.cwd(), 'dist', 'public'))) {
      log('dist/public Verzeichnis gefunden, erstelle ein leeres index.html als Fallback...');
      fs.writeFileSync(
        path.join(process.cwd(), 'dist', 'public', 'index.html'),
        `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/auth"></head><body>Redirecting...</body></html>`
      );
    }
    // Dann auch in public, falls das existiert
    if (fs.existsSync(path.join(process.cwd(), 'public'))) {
      log('public Verzeichnis gefunden, erstelle ein leeres index.html als Fallback...');
      fs.writeFileSync(
        path.join(process.cwd(), 'public', 'index.html'),
        `<!DOCTYPE html><html><head><meta http-equiv="refresh" content="0;url=/auth"></head><body>Redirecting...</body></html>`
      );
    }
    
    log('Routing-Workaround erfolgreich installiert');
  } catch (error) {
    log(`Fehler beim Installieren des Routing-Workarounds: ${error.message}`);
  }
  
  log('Render-Patch-Skript abgeschlossen');
}

// Skript ausführen
applyRenderPatches();