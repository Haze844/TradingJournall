// express-fix.js
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname-Äquivalent für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Suchen und Patchen der Index.js Datei im Dist-Verzeichnis
const indexJsPath = path.join(__dirname, 'dist', 'index.js');

if (fs.existsSync(indexJsPath)) {
  console.log('Express-Server-Datei gefunden, starte Patching...');
  let indexJs = fs.readFileSync(indexJsPath, 'utf8');
  
  // Patch 1: API-Pfade korrigieren
  // Suche nach Zeilen, die API-Routes registrieren und stelle sicher, dass sie richtig formatiert sind
  const apiRegExp = /app\.(\w+)\(['"]\/api\/([\w-\/]+)['"]/g;
  let match;
  let patched = false;
  
  while ((match = apiRegExp.exec(indexJs)) !== null) {
    const [fullMatch, method, path] = match;
    // Überprüfe, ob der Pfad mit einem Slash endet
    if (!path.endsWith('/')) {
      const replacement = `app.${method}('/api/${path}/`;
      indexJs = indexJs.replace(fullMatch, replacement);
      console.log(`API-Pfad korrigiert: ${fullMatch} -> ${replacement}`);
      patched = true;
    }
  }
  
  // Patch 2: CORS-Konfiguration hinzufügen
  // Finde den Punkt, an dem Express konfiguriert wird
  const expressConfigIndex = indexJs.indexOf('app.use(express.json());');
  if (expressConfigIndex !== -1) {
    const corsPatch = `
// CORS-Konfiguration
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Antwortheader für API-Anfragen auf JSON setzen
  if (req.path.startsWith('/api/')) {
    res.header('Content-Type', 'application/json');
  }
  
  // Handle OPTIONS Anfragen
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

`;
    // Füge CORS-Konfiguration nach Express-JSON-Konfiguration ein
    indexJs = indexJs.slice(0, expressConfigIndex + 'app.use(express.json());'.length) + 
              corsPatch + 
              indexJs.slice(expressConfigIndex + 'app.use(express.json());'.length);
    console.log('CORS- und Content-Type-Konfiguration hinzugefügt');
    patched = true;
  }
  
  // Patch 3: Konfiguriere statische Dateien neu, um SPA-Routing zu unterstützen
  const staticFilesIndex = indexJs.indexOf('app.use(express.static');
  if (staticFilesIndex !== -1) {
    const staticEndIndex = indexJs.indexOf(');', staticFilesIndex) + 2;
    const spaRoutingPatch = `
// SOFORTIGE STATISCHE HTML-ANTWORT für den Root-Pfad
app.get('/', (req, res) => {
  console.log('Direkte statische HTML-Antwort für /')
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
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
</html>`);
});

// SOFORTIGE STATISCHE HTML-ANTWORT für die Weiterleitungsseite
app.get('/Weiterleitung', (req, res) => {
  console.log('Direkte statische HTML-Antwort für /Weiterleitung')
  res.setHeader('Content-Type', 'text/html');
  res.send(`<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <title>LvlUp Tradingtagebuch - Weiterleitung</title>
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
    .container {
      background-color: rgba(30, 41, 59, 0.8);
      border-radius: 10px;
      padding: 40px;
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.2);
      text-align: center;
      backdrop-filter: blur(10px);
      max-width: 600px;
      width: 100%;
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
      margin-top: 20px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Weiterleitung fehlgeschlagen</h1>
    <p>Es scheint ein Problem mit der automatischen Weiterleitung zu geben.</p>
    <a href="/auth" class="btn">Manuell zum Login</a>
  </div>
</body>
</html>`);
});

// Unterstützung für SPA-Routing
app.get('*', (req, res, next) => {
  // Wenn es eine API-Anfrage ist, zum nächsten Handler weiterleiten
  if (req.path.startsWith('/api/')) {
    return next();
  }
  
  // Sonst die index.html zurückgeben für Client-Routing
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

`;
    // Füge SPA-Routing-Fix nach der statischen Dateikonfiguration ein
    indexJs = indexJs.slice(0, staticEndIndex) + 
              spaRoutingPatch + 
              indexJs.slice(staticEndIndex);
    console.log('SPA-Routing-Unterstützung hinzugefügt');
    patched = true;
  }
  
  if (patched) {
    // Schreibe die geänderte Datei zurück
    fs.writeFileSync(indexJsPath, indexJs);
    console.log('Express-Server erfolgreich gepatcht!');
  } else {
    console.log('Keine Änderungen am Express-Server notwendig.');
  }
} else {
  console.error('Express-Server-Datei nicht gefunden!');
}