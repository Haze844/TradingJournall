// custom-deploy.js - Direkte Weiterleitung zur Auth-Seite
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname-Äquivalent für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starte Custom-Deploy-Skript für direkten Auth-Redirect...');

// Einfachste HTML-Weiterleitung zur Auth-Seite
const directAuthRedirect = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta http-equiv="refresh" content="0;url=/auth">
  <title>LvlUp Trading Journal</title>
</head>
<body>
  <script>
    window.location.href = "/auth";
  </script>
</body>
</html>`;

try {
  // Speichere an allen möglichen Stellen
  const locations = [
    path.join(__dirname, 'index.html'),
    path.join(__dirname, 'public', 'index.html'),
    path.join(__dirname, 'dist', 'index.html'),
    path.join(__dirname, 'dist', 'public', 'index.html')
  ];
  
  // Schreibe in alle verfügbaren Verzeichnisse
  for (const location of locations) {
    if (fs.existsSync(path.dirname(location))) {
      fs.writeFileSync(location, directAuthRedirect);
      console.log(`Auth-Redirect nach ${location} geschrieben`);
    }
  }
  
  console.log('Custom-Deploy-Skript erfolgreich ausgeführt!');
} catch (error) {
  console.error('Fehler beim Ausführen des Custom-Deploy-Skripts:', error);
}