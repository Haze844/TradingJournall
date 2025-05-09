// custom-deploy.js - Direkte HTML-Datei ohne JavaScript-Routing für Render
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname-Äquivalent für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starte Custom-Deploy-Skript für Render mit direktem HTML...');

// EXTREM VEREINFACHTE statische HTML-Datei ohne React-Router-Abhängigkeiten
const directHtmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LvlUp Tradingtagebuch</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #0c1222;
      color: white;
      margin: 0;
      padding: 0;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    header {
      background-color: rgba(15, 23, 42, 0.9);
      padding: 20px;
      text-align: center;
      border-bottom: 1px solid rgba(59, 130, 246, 0.3);
    }
    .logo {
      color: #3b82f6;
      font-size: 28px;
      font-weight: bold;
      margin: 0;
    }
    main {
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .container {
      background-color: rgba(30, 41, 59, 0.8);
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
      padding: 30px;
      max-width: 800px;
      width: 100%;
      backdrop-filter: blur(10px);
    }
    h1 {
      color: #e2e8f0;
      margin-top: 0;
      margin-bottom: 20px;
      font-size: 24px;
      text-align: center;
    }
    .card-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 20px;
    }
    @media (min-width: 768px) {
      .card-grid {
        grid-template-columns: 1fr 1fr;
      }
    }
    .card {
      background-color: rgba(15, 23, 42, 0.6);
      border-radius: 8px;
      padding: 20px;
      border: 1px solid rgba(59, 130, 246, 0.2);
    }
    .credentials {
      margin-bottom: 20px;
    }
    .credential-item {
      background-color: rgba(15, 23, 42, 0.7);
      padding: 10px;
      border-radius: 6px;
      margin-bottom: 10px;
    }
    .credential-item strong {
      color: #3b82f6;
      display: block;
      margin-bottom: 5px;
    }
    .feature-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }
    .feature-item {
      display: flex;
      align-items: center;
      margin-bottom: 12px;
    }
    .feature-icon {
      width: 24px;
      height: 24px;
      background-color: rgba(59, 130, 246, 0.2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 10px;
      color: #3b82f6;
    }
    .btn {
      display: inline-block;
      background-color: #3b82f6;
      color: white;
      text-decoration: none;
      padding: 12px 24px;
      border-radius: 6px;
      font-weight: 600;
      text-align: center;
      transition: all 0.2s ease;
      margin-top: 20px;
      border: none;
      cursor: pointer;
      width: 100%;
    }
    .btn:hover {
      background-color: #2563eb;
    }
    footer {
      background-color: rgba(15, 23, 42, 0.9);
      text-align: center;
      padding: 15px;
      color: #94a3b8;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <header>
    <h1 class="logo">LvlUp Tradingtagebuch</h1>
  </header>
  
  <main>
    <div class="container">
      <h1>Willkommen bei Ihrem Trading-Journal</h1>
      
      <div class="card-grid">
        <div class="card">
          <h2>Login</h2>
          <div class="credentials">
            <div class="credential-item">
              <strong>Admin-Konto</strong>
              <p>Benutzername: admin<br>Passwort: admin123</p>
            </div>
            <div class="credential-item">
              <strong>Benutzer-Konto</strong>
              <p>Benutzername: mo<br>Passwort: mo123</p>
            </div>
          </div>
          <!-- Direkter HTML Link ohne JavaScript -->
          <a href="https://trading-journal-fhwv.onrender.com/auth" class="btn">Zum Login</a>
        </div>
        
        <div class="card">
          <h2>Funktionen</h2>
          <ul class="feature-list">
            <li class="feature-item">
              <div class="feature-icon">✓</div>
              <span>Umfassendes Trade-Tracking</span>
            </li>
            <li class="feature-item">
              <div class="feature-icon">✓</div>
              <span>Automatische Performance-Analysen</span>
            </li>
            <li class="feature-item">
              <div class="feature-icon">✓</div>
              <span>Setup-Typen und Muster-Erkennung</span>
            </li>
            <li class="feature-item">
              <div class="feature-icon">✓</div>
              <span>Trendanalyse über mehrere Zeitrahmen</span>
            </li>
            <li class="feature-item">
              <div class="feature-icon">✓</div>
              <span>Präzise Drawdown-Berechnungen</span>
            </li>
            <li class="feature-item">
              <div class="feature-icon">✓</div>
              <span>Risiko- und Money-Management</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </main>
  
  <footer>
    &copy; 2025 LvlUp Tradingtagebuch | Alle Rechte vorbehalten
  </footer>
</body>
</html>`;

try {
  // Erstelle eine spezielle index.html im Projektroot
  fs.writeFileSync(path.join(__dirname, 'index.html'), directHtmlContent);
  console.log('Statische HTML-Datei nach index.html geschrieben');
  
  // Erstelle zusätzlich eine index.html im public-Ordner
  const publicPath = path.join(__dirname, 'public');
  if (fs.existsSync(publicPath)) {
    fs.writeFileSync(path.join(publicPath, 'index.html'), directHtmlContent);
    console.log('Statische HTML-Datei nach public/index.html geschrieben');
  }
  
  // Erstelle zusätzlich eine index.html im dist-Ordner
  const distPath = path.join(__dirname, 'dist');
  if (fs.existsSync(distPath)) {
    fs.writeFileSync(path.join(distPath, 'index.html'), directHtmlContent);
    console.log('Statische HTML-Datei nach dist/index.html geschrieben');
  }
  
  // Erstelle auch dist/public falls nötig
  const distPublicPath = path.join(__dirname, 'dist', 'public');
  if (fs.existsSync(distPublicPath)) {
    fs.writeFileSync(path.join(distPublicPath, 'index.html'), directHtmlContent);
    console.log('Statische HTML-Datei nach dist/public/index.html geschrieben');
  }
  
  console.log('Custom-Deploy-Skript erfolgreich ausgeführt!');
} catch (error) {
  console.error('Fehler beim Ausführen des Custom-Deploy-Skripts:', error);
}