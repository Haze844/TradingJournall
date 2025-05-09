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