// redirect-fix.js - DEAKTIVIERT - KEINE WEITERLEITUNGEN MEHR
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname-Äquivalent für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Weiterleitungen wurden deaktiviert - verwende standard Vite-Index');

// Einfache statische HTML-Seite OHNE Redirect
const staticHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LvlUp Trading Journal</title>
</head>
<body>
  <div id="app"></div>
  <script type="module" src="/src/main.tsx"></script>
</body>
</html>`;

// Stelle sicher, dass wir eine statische Index-Seite ohne Weiterleitungen verwenden
try {
  // Finde das Hauptverzeichnis
  const basePath = path.resolve(__dirname);
  const indexPath = path.join(basePath, 'index.html');
  
  // Prüfe, ob die Datei Weiterleitungscode enthält
  if (fs.existsSync(indexPath)) {
    const content = fs.readFileSync(indexPath, 'utf8');
    if (content.includes('refresh') || content.includes('redirect') || content.includes('window.location.href')) {
      console.log('Weiterleitungscode in index.html gefunden - ersetze mit statischer Version');
      fs.writeFileSync(indexPath, staticHtml);
    }
  }
  
  console.log('Weiterleitungsskript deaktiviert');
} catch (error) {
  console.error('Fehler beim Deaktivieren von Weiterleitungen:', error);
}