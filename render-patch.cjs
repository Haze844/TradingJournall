/**
 * Render-Patch als CommonJS-Modul (für Verträglichkeit mit älteren Node-Versionen)
 * Diese Version behebt das Problem mit dem falschen APP_CONFIG-Setting
 */

const fs = require('fs');
const path = require('path');

// Einfache Logging-Funktion
function log(message) {
  console.log('[RENDER-PATCH] ' + message);
}

log('Starte Render-Patch (CommonJS-Version)...');

// Einfache HTML-Seite als String (keine Template-Literals, keine JSX)
const simpleHtml = '<!DOCTYPE html>' +
'<html lang="de">' +
'<head>' +
'  <meta charset="UTF-8">' +
'  <title>LvlUp Trading Journal</title>' +
'  <base href="/">' +
'  <style>' +
'    body { font-family: Arial, sans-serif; padding: 20px; text-align: center; background-color: #0f172a; color: #e2e8f0; }' +
'    .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; background-color: rgba(15, 23, 42, 0.7); border-radius: 12px; box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3); backdrop-filter: blur(10px); border: 1px solid rgba(59, 130, 246, 0.2); }' +
'    .link { display: inline-block; margin-top: 20px; padding: 12px 24px; background: linear-gradient(to right, #3b82f6, #60a5fa); color: white; text-decoration: none; border-radius: 6px; font-weight: bold; transition: all 0.3s ease; }' +
'    .link:hover { transform: translateY(-2px); box-shadow: 0 5px 15px rgba(59, 130, 246, 0.4); }' +
'    h1 { color: #60a5fa; margin-bottom: 10px; }' +
'    .subtitle { color: #94a3b8; margin-bottom: 30px; }' +
'  </style>' +
'</head>' +
'<body>' +
'  <div class="container">' +
'    <h1>LvlUp Trading Journal</h1>' +
'    <p class="subtitle">Professionelles Analyse-Tool für Trader</p>' +
'    <p>Bitte melde dich an, um deine Trading-Daten zu verwalten und deine Performance zu analysieren.</p>' +
'    <a class="link" href="/auth">Zur Anmeldeseite</a>' +
'  </div>' +
'  <script>' +
'    console.log("Render-Weiterleitung: Statische Startseite ohne Redirect-Logik geladen");' +
'  </script>' +
'</body>' +
'</html>';

// 1. Frontend-Patch: index.html aktualisieren
function patchIndexHtml() {
  const indexHtmlPaths = [
    './dist/public/index.html',
    './dist/index.html',
    './public/index.html',
    './index.html',
  ];

  for (const indexHtmlPath of indexHtmlPaths) {
    if (fs.existsSync(indexHtmlPath)) {
      log(`index.html gefunden: ${indexHtmlPath}. Patche für Render-Deployment...`);
      
      // Frontend-Konfiguration - KRITISCHE ÄNDERUNG: noRedirects: false statt true!
      const scriptContent = '\n<script>\n' +
        '  // Konfiguration für verschiedene Umgebungen\n' +
        '  (function() {\n' +
        '    const isRender = window.location.hostname.includes("render.com") || window.location.hostname.includes("onrender.com");\n' +
        '    window.APP_CONFIG = {\n' +
        '      isRender: isRender,\n' +
        '      apiBaseUrl: "",\n' +
        '      basename: "",\n' +
        '      noRedirects: false\n' + // WICHTIG: Hier auf false gesetzt, damit die Redirects funktionieren
        '    };\n' +
        '    console.log("App konfiguriert für:", { isRender: isRender, hostname: window.location.hostname });\n' +
        '  })();\n' +
        '</script>';

      try {
        let indexHtml = fs.readFileSync(indexHtmlPath, 'utf8');

        // Base-Href einfügen
        if (!indexHtml.includes('<base href="/"')) {
          indexHtml = indexHtml.replace('<head>', '<head>\n  <base href="/">');
          log('base href-Tag hinzugefügt');
        }

        // App-Konfiguration aktualisieren falls vorhanden, sonst einfügen
        if (indexHtml.includes('window.APP_CONFIG')) {
          // Aktualisiere die bestehende Konfiguration
          indexHtml = indexHtml.replace(
            /noRedirects:[\s]*true/g, 
            'noRedirects: false'
          );
          log('Bestehende App-Konfiguration aktualisiert (noRedirects: false)');
        } else {
          // Füge neue Konfiguration hinzu
          indexHtml = indexHtml.replace('</head>', scriptContent + '\n</head>');
          log('App-Konfiguration hinzugefügt');
        }

        fs.writeFileSync(indexHtmlPath, indexHtml);
        log(`${indexHtmlPath} erfolgreich aktualisiert`);

        // 404.html für Client-Routing kopieren
        const dirPath = path.dirname(indexHtmlPath);
        const notFoundPath = path.join(dirPath, '404.html');
        fs.writeFileSync(notFoundPath, indexHtml);
        log(`404.html für Client-Routing erstellt in ${dirPath}`);
      } catch (err) {
        log(`Fehler beim Aktualisieren von ${indexHtmlPath}: ${err.message}`);
      }
    }
  }
}

// 2. Integrieren der statischen HTML-Fix-Datei
function integrateStaticHtmlFix() {
  try {
    // Versuche, den statischen HTML-Fix zu importieren
    if (fs.existsSync('./server/vite-static-fix.js')) {
      log('Statischer HTML-Fix gefunden, wende ihn an...');
      
      try {
        // In einer CommonJS-Umgebung funktioniert require
        require('./server/vite-static-fix');
        log('Statischer HTML-Fix erfolgreich angewendet');
      } catch (err) {
        log(`Fehler beim Anwenden des statischen HTML-Fixes: ${err.message}`);
      }
    } else {
      log('Erstelle minimalen statischen HTML-Fix...');
      
      // Erstelle eine minimale Version des Fixes
      const fixContent = `
/**
 * Minimale Version des statischen HTML-Fixes
 */
const fs = require('fs');
const path = require('path');

function createIndexWithRedirect() {
  const indexPath = path.join(process.cwd(), 'index.html');
  const redirectHTML = \`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weiterleitung...</title>
  <script>
    // Weiterleitungscode für SPA-Navigation
    (function() {
      console.log("Statische Weiterleitungsseite geladen");
      const basePath = window.location.origin;
      window.location.replace(basePath + '/#spa');
    })();
  </script>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #0c1222;
      color: white;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      margin: 0;
    }
    .loader {
      border: 5px solid rgba(59, 130, 246, 0.2);
      border-radius: 50%;
      border-top: 5px solid #3b82f6;
      width: 50px;
      height: 50px;
      animation: spin 1s linear infinite;
      margin-bottom: 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .container {
      text-align: center;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="loader"></div>
    <p>Einen Moment bitte, du wirst weitergeleitet...</p>
  </div>
</body>
</html>\`;

  fs.writeFileSync(indexPath, redirectHTML);
  console.log("Minimaler statischer HTML-Fix: index.html mit Weiterleitungslogik erstellt");
  return true;
}

// Führe die Funktion aus
createIndexWithRedirect();
      `;
      
      fs.writeFileSync('./server/vite-static-fix.js', fixContent);
      log('Minimaler statischer HTML-Fix erstellt und angewendet');
    }
  } catch (err) {
    log(`Fehler bei der Integration des statischen HTML-Fixes: ${err.message}`);
  }
}

// 3. Server-Patch aktualisieren, wenn notwendig
function patchServerCode() {
  const serverCodePaths = [
    './dist/index.js',
    './index.js',
    './server.js'
  ];
  
  for (const serverCodePath of serverCodePaths) {
    if (fs.existsSync(serverCodePath)) {
      log(`Server-Code gefunden: ${serverCodePath}. Prüfe Patches...`);
      
      try {
        let serverCode = fs.readFileSync(serverCodePath, 'utf8');
        let modified = false;
        
        // Nur patchen, wenn noch nicht gepatcht oder wenn noRedirects: true vorhanden ist
        if (serverCode.includes('noRedirects: true')) {
          serverCode = serverCode.replace(/noRedirects:[\s]*true/g, 'noRedirects: false');
          modified = true;
          log('noRedirects-Konfiguration im Server-Code aktualisiert');
        }
        
        // Bei Bedarf Middleware für zusätzliche Weiterleitungslogik hinzufügen
        if (!serverCode.includes('// Render-Fix: Dynamisches Routing') && !serverCode.includes('Dynamic SPA routing fix')) {
          const middlewareCode = `
// Render-Fix: Dynamisches Routing für SPA
app.use((req, res, next) => {
  // Nur für HTML-Anfragen, nicht für API oder Statische Dateien
  if (!req.path.startsWith('/api/') && 
      !req.path.includes('.') && 
      req.headers.accept && 
      req.headers.accept.includes('text/html')) {
    
    console.log("SPA-Route erkannt:", req.path);
    
    // Authentifizierungsstatus prüfen
    const isAuthenticated = req.isAuthenticated && req.isAuthenticated();
    if (isAuthenticated) {
      console.log("Authentifizierter Nutzer, leite weiter zu SPA");
    }
    
    // Für alle HTML-Anfragen die index.html servieren
    return res.sendFile(path.join(process.cwd(), 'public', 'index.html'));
  }
  
  next();
});
`;
          
          // Finde eine geeignete Stelle zum Einfügen
          let position = serverCode.indexOf('app.listen');
          if (position === -1) {
            position = serverCode.indexOf('server.listen');
          }
          
          if (position !== -1) {
            serverCode = serverCode.slice(0, position) + middlewareCode + serverCode.slice(position);
            modified = true;
            log('Dynamisches Routing für SPA hinzugefügt');
          } else {
            log('Keine geeignete Stelle im Server-Code gefunden');
          }
        }
        
        if (modified) {
          fs.writeFileSync(serverCodePath, serverCode);
          log(`${serverCodePath} erfolgreich gepatcht`);
        } else {
          log(`${serverCodePath} benötigt keine Anpassungen`);
        }
      } catch (err) {
        log(`Fehler beim Patchen von ${serverCodePath}: ${err.message}`);
      }
    }
  }
}

// Führe alle Patches aus
patchIndexHtml();
integrateStaticHtmlFix();
patchServerCode();

log('Render-Patch (CommonJS) abgeschlossen. Das Problem mit der statischen HTML-Weiterleitung sollte behoben sein.');

module.exports = {
  patchIndexHtml,
  integrateStaticHtmlFix,
  patchServerCode
};