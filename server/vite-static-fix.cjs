/**
 * Eine zusätzliche Lösung für das Problem mit der statischen HTML-Seite
 * nach dem Login. Diese Datei wird verwendet, um sicherzustellen, dass
 * die React-App korrekt geladen wird, anstatt die statische HTML-Seite.
 * 
 * ACHTUNG: Diese Lösung soll PARALLEL zu den bestehenden Lösungen verwendet werden,
 * nicht als Ersatz. Die Vite-Konfiguration sollte unverändert bleiben, diese
 * Datei implementiert eine zusätzliche Absicherung.
 * 
 * CommonJS-Version (.cjs) für die Kompatibilität mit älteren Node-Versionen
 */

const fs = require('fs');
const path = require('path');

// Originale index.html und client/index.html
const staticIndexPath = path.join(process.cwd(), 'index.html');
const reactIndexPath = path.join(process.cwd(), 'client', 'index.html');

// Lese die Client/React index.html
let reactIndexContent;
try {
  reactIndexContent = fs.readFileSync(reactIndexPath, 'utf8');
  console.log("Erfolgreich client/index.html gelesen");
} catch (err) {
  console.error("Fehler beim Lesen von client/index.html:", err);
  return;
}

// Sicherstellen, dass die globale App-Konfiguration enthalten ist
if (!reactIndexContent.includes('window.APP_CONFIG')) {
  console.log("Füge APP_CONFIG zu client/index.html hinzu");
  
  // Füge die Konfiguration hinzu
  reactIndexContent = reactIndexContent.replace(
    '</head>',
    `  <script>
    // WICHTIG: Globale App-Konfiguration für konsistentes Routing
    window.APP_CONFIG = {
      isNetlify: window.location.hostname.includes('netlify.app'),
      isRender: window.location.hostname.includes('render.com') || window.location.hostname.includes('onrender.com'),
      isReplit: window.location.hostname.includes('replit.dev') || window.location.hostname.includes('repl.co'),
      apiBaseUrl: "",
      basename: "",
      noRedirects: false // Aktiviere korrektes SPA-Routing
    };
    console.log("App konfiguriert:", window.APP_CONFIG);
  </script>
</head>`
  );
  
  // Speichere die aktualisierte Datei
  fs.writeFileSync(reactIndexPath, reactIndexContent);
  console.log("client/index.html aktualisiert mit APP_CONFIG");
}

/**
 * Ersetzt den Inhalt von index.html durch ein JavaScript-Redirect-Skript
 * Das stellt sicher, dass nach einem Login der Nutzer zur React-App weitergeleitet wird
 */
function createIndexWithRedirect() {
  try {
    // Vorhandene index.html sichern, falls vorhanden
    if (fs.existsSync(staticIndexPath)) {
      const backupPath = path.join(process.cwd(), 'index.html.backup');
      fs.copyFileSync(staticIndexPath, backupPath);
      console.log(`Bestehende index.html gesichert als ${backupPath}`);
    }
    
    // Erstelle eine redirect-index.html
    const redirectHTML = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>LvlUp Tradingtagebuch - Weiterleitung</title>
  <script>
    // Weiterleitungslogik für bessere SPA-Navigation
    (function() {
      // Setup für SPA-Routing
      // Stabile Weiterleitungsstrategie nach dem Login
      const isAuth = document.cookie.includes('connect.sid');
      
      // Protokollierung für Debugging
      console.log("Statische Weiterleitungsseite geladen");
      console.log("Cookie-Status:", document.cookie ? "Cookies vorhanden" : "Keine Cookies");
      console.log("Auth-Status:", isAuth ? "Authentifiziert" : "Nicht authentifiziert");
      console.log("Aktuelle URL:", window.location.href);
      
      // Direkte Weiterleitung zur React-App mit vollständigem Pfad
      const basePath = window.location.origin;
      const pathToKeep = window.location.pathname;
      const validPaths = ['/auth', '/api', '/booklet'];
      
      // Für API-Pfade keine Weiterleitung
      if (pathToKeep.startsWith('/api/')) {
        console.log("API-Pfad erkannt - keine Weiterleitung");
        return;
      }
      
      // Für Auth-Pfad Weiterleitung zur entsprechenden SPA-Route
      if (pathToKeep === '/auth') {
        console.log("Auth-Pfad erkannt - direkter Link zur SPA-Auth-Route");
        window.location.replace(basePath + '/auth#spa');
        return;
      }
      
      // Für Root-Pfad ('/')
      if (pathToKeep === '/' || pathToKeep === '') {
        console.log("Root-Pfad erkannt - weiterleiten zu SPA-Hauptseite");
        window.location.replace(basePath + '/#spa');
        return;
      }
      
      // Standard-Weiterleitung für alle anderen Pfade
      console.log("Standard-Weiterleitung zur SPA mit aktueller Route");
      window.location.replace(basePath + pathToKeep + '#spa');
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
</html>`;
    
    // Schreibe die Umleitungs-index.html
    fs.writeFileSync(staticIndexPath, redirectHTML);
    console.log("index.html mit Weiterleitungslogik erstellt");
    
    return true;
  } catch (err) {
    console.error("Fehler beim Erstellen der Weiterleitungs-index.html:", err);
    return false;
  }
}

// Führe die Funktion beim Start aus
createIndexWithRedirect();

module.exports = {
  createIndexWithRedirect
};