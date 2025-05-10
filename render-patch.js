// render-patch.js - Komplett überarbeitete Version ohne Syntaxfehler
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Einfache Logging-Funktion
function log(message) {
  console.log('[RENDER-PATCH] ' + message);
}

log('Starte vereinfachten Render-Patch...');

// Einfache HTML-Seite als String (keine Template-Literals, keine JSX)
const simpleHtml = '<!DOCTYPE html>' +
'<html lang="de">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'  <title>Weiterleitung...</title>' +
'  <script>' +
'    // Direkte Weiterleitung zur Auth-Seite' +
'    (function() {' +
'      console.log("Direkte Weiterleitung zur Auth-Seite");' +
'      window.location.replace(window.location.origin + "/auth");' +
'    })();' +
'  </script>' +
'</head>' +
'<body>' +
'  <noscript>JavaScript wird benötigt, um diese Anwendung zu nutzen.</noscript>' +
'</body>' +
'</html>';

// 1. Frontend-Patch: index.html aktualisieren
const indexHtmlPath = './dist/public/index.html';
if (fs.existsSync(indexHtmlPath)) {
  log('index.html gefunden. Patche für Render-Deployment...');
  
  // Frontend-Konfiguration
  const scriptContent = '\\n<script>\\n' +
    '  // Konfiguration für verschiedene Umgebungen\\n' +
    '  (function() {\\n' +
    '    const isRender = window.location.hostname.includes("render.com") || window.location.hostname.includes("onrender.com");\\n' +
    '    window.APP_CONFIG = {\\n' +
    '      isRender: isRender,\\n' +
    '      apiBaseUrl: "",\\n' +
    '      basename: "",\\n' +
    '      noRedirects: true\\n' +
    '    };\\n' +
    '    console.log("App konfiguriert für:", { isRender: isRender, hostname: window.location.hostname });\\n' +
    '  })();\\n' +
    '</script>';

  try {
    let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

    // Base-Href einfügen
    if (!indexHtml.includes('<base href="/"')) {
      indexHtml = indexHtml.replace('<head>', '<head>\\n  <base href="/">');
      log('base href-Tag hinzugefügt');
    }

    // App-Konfiguration einfügen
    if (!indexHtml.includes('window.APP_CONFIG')) {
      indexHtml = indexHtml.replace('</head>', scriptContent + '\\n</head>');
      log('App-Konfiguration hinzugefügt');
    }

    fs.writeFileSync(indexHtmlPath, indexHtml);
    log('index.html erfolgreich aktualisiert');

    // 404.html für Client-Routing kopieren
    const notFoundPath = path.join(path.dirname(indexHtmlPath), '404.html');
    fs.writeFileSync(notFoundPath, indexHtml);
    log('404.html für Client-Routing erstellt');
  } catch (err) {
    log('Fehler beim Aktualisieren von index.html: ' + err.message);
  }
}

// 2. Server-Patch: Root-Route zur Auth-Seite umleiten
const serverCodePath = './dist/index.js';
if (fs.existsSync(serverCodePath)) {
  log('Server-Code gefunden. Patche Express-Server...');
  
  try {
    let serverCode = fs.readFileSync(serverCodePath, 'utf8');
    
    // Nur patchen, wenn noch nicht gepatcht
    if (!serverCode.includes('// Render-Express-Patch')) {
      // Middleware für Render-spezifisches Routing
      const middlewareCode = '\n// Render-Express-Patch\n' +
        'const isRenderEnv = process.env.RENDER === "true" || !!process.env.RENDER_EXTERNAL_URL;\n' +
        'if (isRenderEnv) {\n' +
        '  console.log("Render-spezifisches Routing aktiviert");\n' +
        '  // Root-Route mit statischer HTML-Seite\n' +
        '  app.get("/", (req, res) => {\n' +
        '    console.log("Root-Route: Sende statische HTML");\n' +
        '    res.send(' + JSON.stringify(simpleHtml) + ');\n' +
        '  });\n' +
        '}\n';
      
      // Finde eine geeignete Stelle zum Einfügen
      let position = serverCode.indexOf('app.use(express.static');
      if (position === -1) {
        position = serverCode.indexOf('app.listen');
      }
      
      if (position !== -1) {
        serverCode = serverCode.slice(0, position) + middlewareCode + serverCode.slice(position);
        fs.writeFileSync(serverCodePath, serverCode);
        log('Express-Server erfolgreich gepatcht');
      } else {
        log('Keine geeignete Stelle im Server-Code gefunden');
      }
    } else {
      log('Server wurde bereits gepatcht');
    }
  } catch (err) {
    log('Fehler beim Patchen des Servers: ' + err.message);
  }
}

// 3. Statische HTML-Dateien für verschiedene Pfade erstellen
log('Erstelle statische HTML-Seiten...');

const directPaths = [
  path.join(__dirname, 'index.html'),
  path.join(__dirname, 'public', 'index.html'),
  path.join(__dirname, 'dist', 'index.html')
];

// Schreibe statische Seiten ohne Weiterleitungen
for (const filePath of directPaths) {
  try {
    const dirPath = path.dirname(filePath);
    if (fs.existsSync(dirPath)) {
      fs.writeFileSync(filePath, simpleHtml);
      log('Statische Seite geschrieben: ' + filePath);
    }
  } catch (err) {
    log('Fehler beim Schreiben von ' + filePath + ': ' + err.message);
  }
}

log('Render-Patch abgeschlossen. Alle Weiterleitungsprobleme sollten behoben sein.');