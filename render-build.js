/**
 * Build-Skript für Render-Deployment
 * 
 * Dieses Skript wird verwendet, um die Anwendung für das Deployment auf Render zu bauen.
 * Es verwendet die Render-spezifische Vite-Konfiguration und wendet einen Vite-Fix an.
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

function log(message) {
  console.log(`[RENDER-BUILD] ${message}`);
}

// Prüfen, ob wir auf Render sind
if (process.env.RENDER) {
  log('Render-Deployment erkannt. Verwende optimierte Build-Konfiguration...');
  
  try {
    // Vite-Fix anwenden
    log('Wende Vite-Fix an...');
    execSync('node vite-fix.js', { stdio: 'inherit' });
    
    // Frontend bauen mit render-spezifischer Konfiguration
    log('Baue Frontend...');
    execSync('npx vite build --config vite.render.js', { stdio: 'inherit' });
    
    // Backend bauen
    log('Baue Backend...');
    execSync('npx esbuild server/index.ts --platform=node --packages=external --bundle --format=esm --outfile=dist/index.mjs', { 
      stdio: 'inherit' 
    });
    
    log('✅ Build erfolgreich abgeschlossen!');
  } catch (error) {
    log(`❌ Build fehlgeschlagen: ${error.message}`);
    process.exit(1);
  }
} else {
  // Standard-Build für lokale Entwicklung
  log('Lokale Entwicklung erkannt. Verwende Standard-Build...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    log('✅ Standard-Build erfolgreich abgeschlossen!');
  } catch (error) {
    log(`❌ Standard-Build fehlgeschlagen: ${error.message}`);
    process.exit(1);
  }
}