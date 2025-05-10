/**
 * RENDER-DIRECTORY-FIX
 * 
 * Dieses Modul behebt ein häufiges Problem in Render-Deployments,
 * wobei Verzeichnispfade nicht immer korrekt erkannt werden.
 * Es überprüft, ob wichtige Verzeichnisse existieren und erstellt sie bei Bedarf.
 */

import * as fs from 'fs';
import * as path from 'path';

/**
 * Überprüft, ob ein Verzeichnis existiert und erstellt es bei Bedarf
 */
export function ensureDirectoryExists(dirPath: string) {
  try {
    if (!fs.existsSync(dirPath)) {
      console.log(`Verzeichnis nicht gefunden: ${dirPath}, wird erstellt...`);
      fs.mkdirSync(dirPath, { recursive: true });
      console.log(`Verzeichnis erfolgreich erstellt: ${dirPath}`);
    } else {
      console.log(`Verzeichnis gefunden: ${dirPath}`);
    }
    return true;
  } catch (error) {
    console.error(`Fehler beim Überprüfen/Erstellen von Verzeichnis ${dirPath}:`, error);
    return false;
  }
}

/**
 * Hauptfunktion zum Überprüfen und Erstellen wichtiger Verzeichnisse für Render
 */
export function fixRenderDirectories() {
  // Prüfe, ob wir in einer Render-Umgebung sind
  const isRender = process.env.RENDER === "true" || !!process.env.RENDER_EXTERNAL_URL;
  if (!isRender) {
    console.log('Keine Render-Umgebung erkannt, Directory-Fix wird übersprungen.');
    return;
  }

  console.log('Render-Umgebung erkannt, überprüfe Verzeichnisse...');
  
  // Hauptverzeichnisse, die für Render wichtig sein könnten
  const baseDirs = [
    path.join(process.cwd(), 'public'),
    path.join(process.cwd(), 'dist'),
    path.join(process.cwd(), 'dist', 'public'),
    path.join(process.cwd(), 'logs')
  ];
  
  // Überprüfe und erstelle alle Verzeichnisse
  for (const dir of baseDirs) {
    ensureDirectoryExists(dir);
  }
}