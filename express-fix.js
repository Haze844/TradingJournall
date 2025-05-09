// express-fix.js - Express-Server-Patches für Render.com
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// __dirname-Äquivalent für ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('Starte Express-Fix für Render.com...');

function patchExpressServer() {
  const serverCodePath = './dist/index.js';
  
  if (!fs.existsSync(serverCodePath)) {
    console.error('Konnte Express-Server nicht finden:', serverCodePath);
    return;
  }
  
  let serverCode = fs.readFileSync(serverCodePath, 'utf8');
  
  // Spezielle Middleware für Render, um Redirects zu handhaben
  if (!serverCode.includes('// Express-Fix für Render.com')) {
    // Füge Render-spezifische Middlewares für Root-Verarbeitung und 404-Handling hinzu
    const additionalMiddleware = `
  // Express-Fix für Render.com - Root-Handling und serverseitige Redirects
  const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL;
  
  if (isRender) {
    console.log('Render-spezifische Middlewares aktiviert');
    
    // Root-Pfad speziell behandeln - direkt zu /auth umleiten
    app.get('/', (req, res) => {
      console.log('Root-Pfad aufgerufen, leite weiter zu /auth');
      return res.redirect('/auth');
    });
    
    // Spezielle Middleware für fehlgeschlagene API-Anfragen die HTML zurückgeben
    app.use((req, res, next) => {
      const originalSend = res.send;
      
      res.send = function(body) {
        // Prüfen, ob eine API-Anfrage versucht, HTML zurückzugeben (typisches 404-Symptom)
        const isApiRequest = req.path.startsWith('/api/');
        const isHtmlResponse = typeof body === 'string' && body.includes('<!DOCTYPE html>');
        
        if (isApiRequest && isHtmlResponse) {
          console.warn(\`API-Route \${req.path} hat HTML zurückgegeben, sende 404 JSON\`);
          return res.status(404).json({ error: 'API endpoint not found' });
        }
        
        return originalSend.call(this, body);
      };
      
      next();
    });
  }
`;
    
    // Füge die Middleware vor der Statische-Datei-Bedienung ein
    let position = serverCode.indexOf('app.use(express.static');
    if (position === -1) {
      position = serverCode.indexOf('app.listen');
    }
    
    if (position !== -1) {
      serverCode = serverCode.substring(0, position) + 
                  additionalMiddleware + 
                  serverCode.substring(position);
                  
      fs.writeFileSync(serverCodePath, serverCode);
      console.log('Express-Server erfolgreich mit Render-spezifischen Middlewares gepatcht');
    } else {
      console.error('Konnte keine geeignete Stelle im Express-Server finden, um Middleware einzufügen');
    }
  } else {
    console.log('Express-Server wurde bereits gepatcht');
  }
}

patchExpressServer();

console.log('Express-Fix abgeschlossen');