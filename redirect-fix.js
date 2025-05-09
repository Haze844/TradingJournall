// redirect-fix.js - Automatischer Redirect zur Auth-Seite
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname-Äquivalent für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starte direkten Auth-Redirect ohne Landing Page...');

// Einfache HTML-Seite mit direktem Redirect zur Auth-Seite
const redirectHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=/auth">
  <title>LvlUp Tradingtagebuch - Umleitung</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #0c1222;
      color: white;
      margin: 0;
      padding: 0;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
    }
  </style>
</head>
<body>
  <script>
    // Sofortige Weiterleitung zur Auth-Seite
    window.location.href = "/auth";
  </script>
</body>
</html>`;

// Speichere die Weiterleitungsseite als index.html direkt im Hauptverzeichnis
try {
  // Finde das Hauptverzeichnis (außerhalb von dist)
  const basePath = path.resolve(__dirname);
  const indexPath = path.join(basePath, 'index.html');
  
  // Schreibe die Redirect-Seite
  fs.writeFileSync(indexPath, redirectHtml);
  console.log(`Redirect zur Auth-Seite nach ${indexPath} geschrieben`);
  
  // Kopiere auch nach public/ falls dort gesucht wird
  const publicIndexPath = path.join(basePath, 'public', 'index.html');
  if (fs.existsSync(path.dirname(publicIndexPath))) {
    fs.writeFileSync(publicIndexPath, redirectHtml);
    console.log(`Redirect zur Auth-Seite nach ${publicIndexPath} kopiert`);
  }
  
  // Spezialfall für dist/
  const distIndexPath = path.join(basePath, 'dist', 'index.html');
  if (fs.existsSync(path.dirname(distIndexPath))) {
    fs.writeFileSync(distIndexPath, redirectHtml);
    console.log(`Redirect zur Auth-Seite nach ${distIndexPath} kopiert`);
  }

  // Auch in dist/public/ speichern
  const distPublicIndexPath = path.join(basePath, 'dist', 'public', 'index.html');
  if (fs.existsSync(path.dirname(distPublicIndexPath))) {
    fs.writeFileSync(distPublicIndexPath, redirectHtml);
    console.log(`Redirect zur Auth-Seite nach ${distPublicIndexPath} kopiert`);
  }
  
  console.log('Auth-Redirect erfolgreich erstellt!');
} catch (error) {
  console.error('Fehler beim Anwenden des Redirect-Fixes:', error);
}