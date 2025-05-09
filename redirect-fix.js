// redirect-fix.js - Statische Login-Seite ohne Weiterleitungen
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname-Äquivalent für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starte vereinfachten Static-Page-Fix ohne Weiterleitungslogik...');

// Extrem vereinfachte statische Seite ohne Weiterleitungen - nur direkter Link
const staticLoginHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>LvlUp Tradingtagebuch - Login</title>
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
    .login-container {
      background-color: rgba(30, 41, 59, 0.8);
      border-radius: 10px;
      padding: 40px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      text-align: center;
      backdrop-filter: blur(10px);
      max-width: 600px;
      width: 100%;
    }
    .logo {
      color: #3b82f6;
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 20px;
    }
    h1 {
      font-size: 24px;
      margin-bottom: 30px;
    }
    .btn {
      background-color: #3b82f6;
      color: white;
      border: none;
      padding: 12px 24px;
      font-size: 16px;
      border-radius: 5px;
      cursor: pointer;
      text-decoration: none;
      display: inline-block;
      transition: background-color 0.3s;
    }
    .btn:hover {
      background-color: #2563eb;
    }
    .info {
      margin-top: 30px;
      font-size: 14px;
      color: #9ca3af;
    }
    .credentials {
      background-color: rgba(59, 130, 246, 0.1);
      border-radius: 5px;
      padding: 15px;
      margin-top: 20px;
      text-align: left;
    }
    .credentials p {
      margin: 5px 0;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="logo">LvlUp Tradingtagebuch</div>
    <h1>Willkommen bei Ihrem Trading-Journal</h1>
    <p>Klicken Sie auf den Button unten, um sich anzumelden und Ihr Trading-Journal zu verwalten.</p>
    <a href="/auth" class="btn">Zum Login</a>
    
    <div class="credentials">
      <p><strong>Demo-Zugangsdaten:</strong></p>
      <p>Username: admin | Passwort: admin123</p>
      <p>Username: mo | Passwort: mo123</p>
    </div>
    
    <div class="info">
      <p>Falls Sie Probleme bei der Anmeldung haben, stellen Sie sicher, dass Cookies aktiviert sind und versuchen Sie, die Seite neu zu laden.</p>
    </div>
  </div>
</body>
</html>`;

// Speichere die statische Weiterleitungsseite als index.html direkt im Hauptverzeichnis
try {
  // Finde das Hauptverzeichnis (außerhalb von dist)
  const basePath = path.resolve(__dirname);
  const indexPath = path.join(basePath, 'index.html');
  
  // Schreibe die statische Seite
  fs.writeFileSync(indexPath, staticLoginHtml);
  console.log(`Statische Login-Seite nach ${indexPath} geschrieben`);
  
  // Kopiere auch nach public/ falls dort gesucht wird
  const publicIndexPath = path.join(basePath, 'public', 'index.html');
  if (fs.existsSync(path.dirname(publicIndexPath))) {
    fs.writeFileSync(publicIndexPath, staticLoginHtml);
    console.log(`Statische Login-Seite nach ${publicIndexPath} kopiert`);
  }
  
  // Spezialfall für dist/
  const distIndexPath = path.join(basePath, 'dist', 'index.html');
  if (fs.existsSync(path.dirname(distIndexPath))) {
    fs.writeFileSync(distIndexPath, staticLoginHtml);
    console.log(`Statische Login-Seite nach ${distIndexPath} kopiert`);
  }
  
  console.log('Statische Login-Seite erfolgreich erstellt!');
} catch (error) {
  console.error('Fehler beim Anwenden des Redirect-Fixes:', error);
}