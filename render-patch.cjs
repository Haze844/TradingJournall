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
  // Keine Weiterleitungsseiten mehr

  // Spezialisierte HTML-Dateien für den Client erstellen
  log('Erstelle spezialisierte HTML-Dateien für Auth und SimpleHome');
  
  // index.html in index-client.html umbenennen (falls sie existiert)
  const indexHtmlPath = path.join(distDir, 'public', 'index.html');
  const indexClientPath = path.join(distDir, 'public', 'index-client.html');
  
  if (fs.existsSync(indexHtmlPath)) {
    try {
      // Index-Inhalt lesen
      const indexContent = fs.readFileSync(indexHtmlPath, 'utf8');
      
      // Für Client optimierte Version erstellen (für SimpleHome)
      const clientContent = indexContent.replace(
        /<title>.*?<\/title>/,
        '<title>LvlUp Trading Journal - SimpleHome</title>'
      );
      
      // Als index-client.html speichern für SimpleHome
      fs.writeFileSync(indexClientPath, clientContent);
      log('index-client.html für SimpleHome erstellt');
      
      // Original index.html entfernen
      fs.unlinkSync(indexHtmlPath);
      log('Original index.html entfernt - Express steuert jetzt die Weiterleitung');
    } catch (err) {
      error(`Fehler bei der HTML-Optimierung: ${err.message}`);
    }
  } else {
    log('index.html nicht gefunden, erstelle Standard-Version für Client');
    const standardClientHtml = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LvlUp Trading Journal - SimpleHome</title>
  <base href="/">
  <script type="module" src="/src/main.tsx"></script>
</head>
<body>
  <div id="root"></div>
  <noscript>Sie benötigen JavaScript, um diese Anwendung zu nutzen.</noscript>
</body>
</html>`;
    fs.writeFileSync(indexClientPath, standardClientHtml);
    log('Standard index-client.html erstellt');
  }
  
  // 404.html entfernen falls vorhanden
  const notFoundPath = path.join(distDir, 'public', '404.html');
  if (fs.existsSync(notFoundPath)) {
    try {
      fs.unlinkSync(notFoundPath);
      log('404.html wurde entfernt');
    } catch (err) {
      error(`Fehler beim Entfernen von 404.html: ${err.message}`);
    }
  }

  // Auth-Routen-Handler optimieren für direkte SimpleHome-Verbindung
  log('Optimiere Auth-Routen für direkte SimpleHome-Verbindung');
  
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
      
      // Direkte Navigation zu Auth ohne Umwege einrichten
      log('Konfiguriere Express für direkte Navigation zu Auth und SimpleHome');
      
      // Express App-Konfiguration finden
      const expressSetupPattern = /app\s*=\s*express\(\);/;
      const rootRoutePattern = /app\.get\(['"]\/['"]\s*,\s*.*\s*=>.*/gs;
      
      if (serverCode.match(rootRoutePattern)) {
        // Bereits existierende Route ersetzen
        serverCode = serverCode.replace(rootRoutePattern, 
          'app.get("/", (req, res) => {\n' +
          '  // Wenn der Benutzer authentifiziert ist, zeige direktes SimpleHome ohne Umwege\n' +
          '  if (req.isAuthenticated()) {\n' +
          '    console.log("Auth Benutzer an Root-Route erkannt, zeige direkt SimpleHome");\n' +
          '    return res.sendFile(path.join(__dirname, "public", "index-client.html"));\n' +
          '  }\n' +
          '  // Nicht authentifiziert, weiterleiten zu /auth mit 303 Status (See Other)\n' +
          '  console.log("Nicht authentifiziert an Root-Route, weiterleiten zu /auth mit 303");\n' +
          '  res.redirect(303, "/auth");\n' +
          '});');
        log('Existierende Root-Route durch intelligente Auth/SimpleHome-Weiterleitung ersetzt');
      } else if (serverCode.match(expressSetupPattern)) {
        // Neue Route hinzufügen
        serverCode = serverCode.replace(
          expressSetupPattern,
          'app = express();\n\n// Intelligente Weiterleitung basierend auf Auth-Status\n' +
          'app.get("/", (req, res) => {\n' +
          '  // Wenn der Benutzer authentifiziert ist, zeige direktes SimpleHome ohne Umwege\n' +
          '  if (req.isAuthenticated()) {\n' +
          '    console.log("Auth Benutzer an Root-Route erkannt, zeige direkt SimpleHome");\n' +
          '    return res.sendFile(path.join(__dirname, "public", "index-client.html"));\n' +
          '  }\n' +
          '  // Nicht authentifiziert, weiterleiten zu /auth mit 303 Status (See Other)\n' +
          '  console.log("Nicht authentifiziert an Root-Route, weiterleiten zu /auth mit 303");\n' +
          '  res.redirect(303, "/auth");\n' +
          '});'
        );
        log('Intelligente Auth/SimpleHome-Weiterleitung für Root-Route hinzugefügt');
      } else {
        log('Konnte Express-Setup nicht finden, keine Auth-Weiterleitung hinzugefügt');
      }
      
      // Log-Nachricht hinzufügen, dass wir direkt mit Auth verbunden sind
      serverCode = serverCode.replace(
        /console\.log\(['"]Server gestartet/,
        'console.log("Direkter Auth-Zugriff aktiviert - keine statische HTML-Seite");\n  console.log("Server gestartet'
      );
      
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