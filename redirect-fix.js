// redirect-fix.js - Spezieller Fix für Weiterleitungsschleife
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname-Äquivalent für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starte Redirect-Fix für Weiterleitungsschleife...');

// Spezielle statische Weiterleitungsseite, die direkt an der Basis-URL platziert wird
const staticRedirectHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>LvlUp Tradingtagebuch</title>
  <script>
    // Prüfen, ob wir bereits auf der Auth-Seite sind oder angemeldet
    const isAuth = window.location.pathname.includes('/auth');
    const isLoggedIn = document.cookie.includes('connect.sid');
    
    // Simple Zustandsverwaltung, um Schleifen zu vermeiden
    try {
      const redirectCount = parseInt(sessionStorage.getItem('redirectCount') || '0');
      
      if (redirectCount > 2) {
        // Nach zu vielen Redirects einfach einen direkten Link anzeigen
        document.write('<div style="font-family: Arial; text-align: center; margin-top: 100px;"><h1>LvlUp Tradingtagebuch</h1><p>Bitte klicken Sie hier, um zur Anmeldung zu gelangen:</p><a href="/auth" style="display: inline-block; background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Zum Login</a></div>');
      } else {
        // Redirect-Zähler erhöhen
        sessionStorage.setItem('redirectCount', (redirectCount + 1).toString());
        
        // Weiterleitung forcieren, aber nur wenn nötig
        if (!isAuth && !isLoggedIn) {
          window.location.replace('/auth');
        }
      }
    } catch (e) {
      // Fallback wenn sessionStorage nicht verfügbar ist
      window.location.replace('/auth');
    }
  </script>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background-color: #0c1222;
      color: white;
    }
    .container {
      text-align: center;
      padding: 2rem;
      border-radius: 8px;
      background-color: rgba(30, 41, 59, 0.8);
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      backdrop-filter: blur(10px);
      max-width: 80%;
    }
    .logo {
      margin-bottom: 1rem;
      font-size: 2rem;
      font-weight: bold;
      color: #3b82f6;
    }
    .button {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      border: none;
      border-radius: 4px;
      padding: 0.75rem 1.5rem;
      font-size: 1rem;
      cursor: pointer;
      text-decoration: none;
      margin-top: 1rem;
    }
    .button:hover {
      background-color: #2563eb;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">LvlUp Tradingtagebuch</div>
    <h2>Willkommen zurück!</h2>
    <p>Sie werden automatisch weitergeleitet...</p>
    <a href="/auth" class="button">Direkt zum Login</a>
  </div>
</body>
</html>`;

// Speichere die statische Weiterleitungsseite als index.html direkt im Hauptverzeichnis
try {
  // Finde das Hauptverzeichnis (außerhalb von dist)
  const basePath = path.resolve(__dirname);
  const indexPath = path.join(basePath, 'index.html');
  
  // Schreibe die statische Seite
  fs.writeFileSync(indexPath, staticRedirectHtml);
  console.log(`Statische Weiterleitungsseite nach ${indexPath} geschrieben`);
  
  // Kopiere auch nach public/ falls dort gesucht wird
  const publicIndexPath = path.join(basePath, 'public', 'index.html');
  if (fs.existsSync(path.dirname(publicIndexPath))) {
    fs.writeFileSync(publicIndexPath, staticRedirectHtml);
    console.log(`Statische Weiterleitungsseite nach ${publicIndexPath} kopiert`);
  }
  
  // Spezialfall für dist/
  const distIndexPath = path.join(basePath, 'dist', 'index.html');
  if (fs.existsSync(path.dirname(distIndexPath))) {
    fs.writeFileSync(distIndexPath, staticRedirectHtml);
    console.log(`Statische Weiterleitungsseite nach ${distIndexPath} kopiert`);
  }
  
  console.log('Redirect-Fix erfolgreich angewendet!');
} catch (error) {
  console.error('Fehler beim Anwenden des Redirect-Fixes:', error);
}