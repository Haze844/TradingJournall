// custom-deploy.js - Spezialskript für Deployment-Optimierung auf Render
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname-Äquivalent für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starte Custom-Deploy-Skript für Render...');

// Lade die Template-HTML-Datei anstelle eines Template-Strings
let customIndexHtml;
try {
  customIndexHtml = fs.readFileSync(path.join(__dirname, 'index_template.html'), 'utf8');
  console.log('index_template.html erfolgreich geladen');
} catch (err) {
  console.error('Fehler beim Laden der index_template.html:', err);
  // Fallback zu einem einfachen HTML ohne komplexe Formatierung
  customIndexHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>LvlUp Tradingtagebuch</title>
  <style>
    body { background-color: #0c1222; color: white; font-family: Arial; text-align: center; padding: 50px; }
    a { background-color: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }
  </style>
</head>
<body>
  <h1>LvlUp Tradingtagebuch</h1>
  <p>Bitte klicken Sie auf den Button, um sich anzumelden.</p>
  <a href="/auth">Zum Login</a>
  <p style="margin-top: 20px;">Username: admin | Passwort: admin123<br>Username: mo | Passwort: mo123</p>
</body>
</html>`;
}

try {
  // Erstelle eine spezielle index.html im Projektroot
  fs.writeFileSync(path.join(__dirname, 'index.html'), customIndexHtml);
  console.log('Spezielle index.html für Root-Pfad erstellt');
  
  // Erstelle zusätzlich eine index.html im public-Ordner
  const publicPath = path.join(__dirname, 'public');
  if (fs.existsSync(publicPath)) {
    fs.writeFileSync(path.join(publicPath, 'index.html'), customIndexHtml);
    console.log('Spezielle index.html für public-Ordner erstellt');
  }
  
  // Erstelle zusätzlich eine index.html im dist-Ordner
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    fs.writeFileSync(path.join(distPath, 'index.html'), customIndexHtml);
    console.log('Spezielle index.html für dist-Ordner erstellt');
  }
  
  // Erstelle auch dist/public falls nötig
  const distPublicPath = path.join(__dirname, 'dist', 'public');
  if (fs.existsSync(distPublicPath)) {
    fs.writeFileSync(path.join(distPublicPath, 'index.html'), customIndexHtml);
    console.log('Spezielle index.html für dist/public-Ordner erstellt');
  }
  
  console.log('Custom-Deploy-Skript erfolgreich ausgeführt!');
} catch (error) {
  console.error('Fehler beim Ausführen des Custom-Deploy-Skripts:', error);
}