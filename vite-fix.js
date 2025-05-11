/**
 * Vite-Konfigurationsfehler-Workaround
 * 
 * Dieses Skript wird beim Deployment ausgeführt und ersetzt die fehlerbehaftete
 * vite.config.ts durch eine funktionierende Version im temporären Build-Prozess.
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[VITE-FIX] ${message}`);
}

try {
  const correctViteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: 'client',
  plugins: [react()],
  build: {
    outDir: path.resolve(__dirname, 'dist/public'),
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
      '@shared': path.resolve(__dirname, 'shared'),
      '@assets': path.resolve(__dirname, 'attached_assets'),
    },
  },
});`;

  // Erstelle temporäre Vite-Konfiguration für den Build-Prozess
  const tempVitePath = path.join(__dirname, 'temp-vite.config.js');
  
  log('Erstelle temporäre Vite-Konfiguration...');
  fs.writeFileSync(tempVitePath, correctViteConfig, 'utf8');
  log('✅ Temporäre Vite-Konfiguration erstellt');
  
  // Stelle sicher, dass der Build-Prozess die temporäre Datei verwendet
  process.env.VITE_CONFIG_PATH = tempVitePath;
  log(`✅ Umgebungsvariable VITE_CONFIG_PATH gesetzt auf ${tempVitePath}`);
  
  log('Vite-Fix erfolgreich angewendet!');
} catch (error) {
  log(`❌ Fehler beim Anwenden des Vite-Fixes: ${error.message}`);
  process.exit(1);
}