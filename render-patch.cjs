/**
 * RENDER DEPLOYMENT PATCH SCRIPT
 * 
 * Dieses Skript wird bei jedem Render-Deployment ausgeführt und
 * führt verschiedene Optimierungen und Fixes durch, die speziell
 * für die Render-Umgebung relevant sind.
 */

const fs = require('fs');
const path = require('path');

function log(message) {
  console.log(`[RENDER-PATCH] ${message}`);
}

function error(message) {
  console.error(`[RENDER-PATCH ERROR] ${message}`);
}

// Überprüfen, ob wir uns in der Render-Umgebung befinden
const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL;
log(`Render-Umgebung erkannt: ${isRender ? 'JA' : 'NEIN'}`);

// Wir führen den Patch nur in der Render-Umgebung aus
if (!isRender) {
  log('Nicht in Render-Umgebung, Patch wird übersprungen.');
  process.exit(0);
}

log('Starte Render-spezifische Anpassungen...');

try {
  // Hauptpfade definieren
  const rootDir = process.cwd();
  const distDir = path.join(rootDir, 'dist');
  const publicDir = path.join(rootDir, 'public');
  
  // Sicherstellen, dass dist/client existiert
  const clientDistDir = path.join(distDir, 'client');
  
  if (!fs.existsSync(clientDistDir)) {
    fs.mkdirSync(clientDistDir, { recursive: true });
    log(`Client-Dist-Verzeichnis erstellt: ${clientDistDir}`);
  }
  
  // Überprüfen und erstellen des PUBLIC-Verzeichnisses im DIST-Ordner
  const publicDistDir = path.join(distDir, 'public');
  if (!fs.existsSync(publicDistDir)) {
    fs.mkdirSync(publicDistDir, { recursive: true });
    log(`Public-Dist-Verzeichnis erstellt: ${publicDistDir}`);
  }
  
  // Kopieren der statischen HTML-Fallback-Seite aus public nach dist/public
  try {
    const sourceIndexHtml = path.join(publicDir, 'index.html');
    const destIndexHtml = path.join(publicDistDir, 'index.html');
    
    if (fs.existsSync(sourceIndexHtml)) {
      const content = fs.readFileSync(sourceIndexHtml, 'utf8');
      fs.writeFileSync(destIndexHtml, content);
      log('Static index.html wurde nach dist/public kopiert');
    } else {
      error('Source index.html nicht gefunden in ' + sourceIndexHtml);
    }
  } catch (e) {
    error(`Fehler beim Kopieren der index.html: ${e.message}`);
  }
  
  // Erstellen/Aktualisieren einer speziellen htaccess-Datei für Sonderfälle
  const htaccessContent = `
# Custom Config für Render-Deployment
<IfModule mod_rewrite.c>
  RewriteEngine On
  
  # Umleitung von /auth direkt zur Vue-Route, ohne 404
  RewriteRule ^auth$ /auth/ [R=302,L]
  
  # Alle Anfragen an den Express-Server weiterleiten
  RewriteRule ^(.*)$ /$1 [QSA,L]
</IfModule>
`;

  try {
    fs.writeFileSync(path.join(publicDistDir, '.htaccess'), htaccessContent);
    log('Custom .htaccess für Render erstellt');
  } catch (e) {
    error(`Fehler beim Erstellen der .htaccess: ${e.message}`);
  }
  
  // Fix für APP_CONFIG
  try {
    const appConfigFile = path.join(distDir, 'client', 'index.html');
    if (fs.existsSync(appConfigFile)) {
      let htmlContent = fs.readFileSync(appConfigFile, 'utf8');
      
      // APP_CONFIG anpassen: noRedirects auf false setzen
      if (htmlContent.includes('window.APP_CONFIG')) {
        htmlContent = htmlContent.replace(
          /window\.APP_CONFIG\s*=\s*\{[^}]*\}/,
          'window.APP_CONFIG = { isRender: true, noRedirects: false, directAuth: true, sessionCookieName: "trading.sid" }'
        );
        
        fs.writeFileSync(appConfigFile, htmlContent);
        log('APP_CONFIG in client/index.html wurde für Render optimiert');
      } else {
        error('APP_CONFIG nicht gefunden in client/index.html');
      }
    } else {
      error('client/index.html nicht gefunden');
    }
  } catch (e) {
    error(`Fehler beim Anpassen der APP_CONFIG: ${e.message}`);
  }
  
  // Umleitung für alle wichtigen HTML-Seiten erstellen
  const redirectHtmlContent = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LvlUp Trading Journal - Weiterleitung</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
      background: linear-gradient(135deg, #121212 0%, #1e1e30 100%);
      color: white;
    }
    .container {
      text-align: center;
      max-width: 500px;
      padding: 40px;
      border-radius: 16px;
      background: rgba(30, 30, 48, 0.7);
      backdrop-filter: blur(10px);
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    }
    h1 { color: #4f9eff; }
    .loader {
      display: inline-block;
      width: 50px;
      height: 50px;
      border: 5px solid rgba(79, 158, 255, 0.3);
      border-radius: 50%;
      border-top-color: #4f9eff;
      animation: spin 1s ease-in-out infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  </style>
  <script>
    window.onload = function() {
      setTimeout(function() {
        const targetRoute = window.location.pathname;
        window.location.href = targetRoute;
      }, 1000);
    };
  </script>
</head>
<body>
  <div class="container">
    <div class="loader"></div>
    <h1>LvlUp Trading Journal</h1>
    <p>Weiterleitung läuft...</p>
  </div>
</body>
</html>`;

  // Keine Weiterleitungsseiten mehr erstellen
  log('Keine Weiterleitungsseiten mehr - direkte Navigation zu SPA-Routen');

  // Neon-Datenbank-Konfiguration und Session-Konfiguration für Render anpassen
  try {
    // Zunächst Datenbankverbindung für Neon optimieren
    const dbFilePath = path.join(distDir, 'db.js');
    if (fs.existsSync(dbFilePath)) {
      let dbCode = fs.readFileSync(dbFilePath, 'utf8');
      
      // Prüfen, ob wir Neon WebSocket-Konfiguration hinzufügen müssen
      if (!dbCode.includes('neonConfig.webSocketConstructor') && dbCode.includes('neonConfig')) {
        const poolImportPattern = /import\s*{\s*Pool\s*}/;
        const neonConfigImport = 'import { Pool, neonConfig } from \'@neondatabase/serverless\';';
        const wsImport = 'import ws from \'ws\';';
        
        // Wenn Pool-Import gefunden, ersetzen wir ihn durch die erweiterte Version
        if (dbCode.match(poolImportPattern)) {
          dbCode = dbCode.replace(poolImportPattern, neonConfigImport);
          
          // ws-Import hinzufügen, falls nicht vorhanden
          if (!dbCode.includes('import ws from')) {
            const firstImportEnd = dbCode.indexOf(';', dbCode.indexOf('import')) + 1;
            dbCode = dbCode.slice(0, firstImportEnd) + '\n' + wsImport + dbCode.slice(firstImportEnd);
          }
          
          // WebSocket-Konfiguration hinzufügen
          const poolConfigStart = dbCode.indexOf('export const pool');
          if (poolConfigStart !== -1) {
            const wsConfigCode = '\n// Für Neon in der Render-Umgebung wird WebSocket benötigt\nneonConfig.webSocketConstructor = ws;\n\n';
            dbCode = dbCode.slice(0, poolConfigStart) + wsConfigCode + dbCode.slice(poolConfigStart);
          }
          
          fs.writeFileSync(dbFilePath, dbCode);
          log('Neon-Datenbank-Konfiguration für Render optimiert mit WebSocket-Unterstützung');
        }
      } else {
        log('Neon WebSocket-Konfiguration bereits vorhanden oder nicht notwendig');
      }
    } else {
      log('db.js nicht gefunden - keine Neon-Optimierung möglich');
    }
    
    // Session-Konfiguration anpassen
    const serverFile = path.join(distDir, 'index.js');
    if (fs.existsSync(serverFile)) {
      let serverCode = fs.readFileSync(serverFile, 'utf8');
      
      // Cookie-Konfiguration anpassen
      log('Optimiere Cookie-Einstellungen für Render-Umgebung gemäß Neon Dokumentation');
      
      // Session-Optionen-Patch
      const cookieConfigPattern = /cookie:\s*{[^}]*}/gs;
      // Neon-Dokumentation empfiehlt diese Konfiguration für Render
      const newCookieConfig = `cookie: {
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
        httpOnly: true,
        path: '/',
        secure: true, // Immer 'secure' in Render-Umgebung
        sameSite: 'none' // Wichtig für Cross-Site in Render
      }`;
      
      // Cookie-Konfiguration ersetzen, wenn gefunden
      if (serverCode.match(cookieConfigPattern)) {
        serverCode = serverCode.replace(cookieConfigPattern, newCookieConfig);
        log('Cookie-Konfiguration für Render optimiert');
      } else {
        log('Cookie-Konfiguration nicht gefunden');
      }
      
      // Session resave und saveUninitialized anpassen
      const sessionOptionsPattern = /resave:\s*true/g;
      const saveUninitializedPattern = /saveUninitialized:\s*true/g;
      
      if (serverCode.match(sessionOptionsPattern)) {
        serverCode = serverCode.replace(sessionOptionsPattern, 'resave: false');
        log('Session resave auf false gesetzt');
      }
      
      if (serverCode.match(saveUninitializedPattern)) {
        serverCode = serverCode.replace(saveUninitializedPattern, 'saveUninitialized: false');
        log('Session saveUninitialized auf false gesetzt');
      }
      
      // Trust Proxy sicherstellen
      if (!serverCode.includes('app.set("trust proxy"')) {
        const expressSetupPattern = /app\s*=\s*express\(\);/;
        if (serverCode.match(expressSetupPattern)) {
          serverCode = serverCode.replace(
            expressSetupPattern, 
            'app = express();\napp.set("trust proxy", 1); // Wichtig für Render mit Secure Cookies'
          );
          log('Trust Proxy für Render hinzugefügt');
        }
      }
      
      // Änderungen speichern
      fs.writeFileSync(serverFile, serverCode);
      log('Session-Konfiguration für Render optimiert');
    } else {
      error('Server-Datei nicht gefunden: ' + serverFile);
    }
  } catch (e) {
    error(`Fehler beim Anpassen der Session-Konfiguration: ${e.message}`);
  }
  
  // Erfolg!
  log('Render-Patch abgeschlossen');
  process.exit(0);
  
} catch (err) {
  error(`Unerwarteter Fehler: ${err.message}`);
  error(err.stack);
  process.exit(1);
}