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
 * Ersetzt den Inhalt von index.html durch ein minimales JavaScript-Redirect-Skript
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
    
    // Erstelle eine minimale redirect-index.html (ohne unnötige HTML-Elemente)
    const redirectHTML = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Weiterleitung...</title>
  <script>
    // Minimale Weiterleitungslogik
    (function() {
      console.log("Weiterleitungsseite geladen");
      window.location.replace(window.location.origin + '/#spaLoaded');
    })();
  </script>
</head>
<body>
  <noscript>JavaScript wird benötigt, um diese Anwendung zu nutzen.</noscript>
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