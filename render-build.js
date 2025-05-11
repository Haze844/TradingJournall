/**
 * Build-Skript für Render-Deployment
 * 
 * Dieses Skript wird verwendet, um die Anwendung für das Deployment auf Render zu bauen.
 * Es verwendet die benutzerdefinierte Vite-Konfiguration.
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
    // Frontend bauen mit benutzerdefinierter Konfiguration
    log('Baue Frontend mit benutzerdefinierter Konfiguration...');
    execSync('npx vite build --config vite.config.custom.ts', { stdio: 'inherit' });
    
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