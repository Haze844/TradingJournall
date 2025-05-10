import { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';

/**
 * Erweitertes Diagnose-Tool für Render-Deployments
 * Diese Datei sammelt umfassende Debug-Informationen zur Identifizierung von Rendering-Problemen
 */

// Hilfsfunktion zum Sammeln von Umgebungsinformationen
function collectEnvironmentInfo() {
  const nodeEnv = process.env.NODE_ENV || 'nicht gesetzt';
  const isProduction = nodeEnv === 'production';
  const port = process.env.PORT || '5000';
  const isRender = !!process.env.RENDER || process.env.IS_RENDER === 'true' || 
                  (process.env.RENDER_EXTERNAL_URL && process.env.RENDER_EXTERNAL_URL.includes('onrender.com'));
  const isReplit = !!process.env.REPL_ID || !!process.env.REPL_OWNER;
  const isNetlify = !!process.env.NETLIFY;
  const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || 'nicht gesetzt';
  const packageJsonExists = fs.existsSync(path.join(process.cwd(), 'package.json'));
  
  // Prüfe, ob wichtige Verzeichnisse existieren
  const distExists = fs.existsSync(path.join(process.cwd(), 'dist'));
  const clientDistExists = fs.existsSync(path.join(process.cwd(), 'dist', 'client'));
  const publicExists = fs.existsSync(path.join(process.cwd(), 'public'));
  const distPublicExists = fs.existsSync(path.join(process.cwd(), 'dist', 'public'));
  
  return {
    nodeEnv,
    isProduction,
    port,
    isRender,
    isReplit,
    isNetlify,
    renderExternalUrl,
    filesystem: {
      packageJsonExists,
      distExists,
      clientDistExists,
      publicExists,
      distPublicExists,
      currentDirectory: process.cwd(),
      directoryContents: listDirectoryContents(process.cwd())
    }
  };
}

// Listet Dateien in einem Verzeichnis auf
function listDirectoryContents(dir: string) {
  try {
    const items = fs.readdirSync(dir);
    return items.map(item => {
      const fullPath = path.join(dir, item);
      const isDirectory = fs.statSync(fullPath).isDirectory();
      return {
        name: item,
        isDirectory,
        path: fullPath
      };
    });
  } catch (error) {
    return [{ error: `Fehler beim Lesen des Verzeichnisses: ${error.message}` }];
  }
}

// Prüft die Verfügbarkeit und Inhalte von Schlüsseldateien
function checkKeyFiles() {
  const filesToCheck = [
    { path: 'index.html', root: true },
    { path: 'dist/index.html', root: false },
    { path: 'dist/client/index.html', root: false },
    { path: 'public/index.html', root: false },
    { path: 'dist/public/index.html', root: false },
    { path: 'render.yaml', root: true },
    { path: 'server/routes.ts', root: true },
    { path: 'server/standalone-express.js', root: true },
    { path: 'render-patch.cjs', root: true }
  ];
  
  return filesToCheck.map(file => {
    const filePath = file.root 
      ? path.join(process.cwd(), file.path)
      : path.join(process.cwd(), file.path);
      
    const exists = fs.existsSync(filePath);
    let content = null;
    let size = 0;
    
    if (exists) {
      try {
        const stat = fs.statSync(filePath);
        size = stat.size;
        
        // Dateiinhalt nur für HTML-Dateien und nur die ersten 500 Zeichen
        if (file.path.endsWith('.html')) {
          content = fs.readFileSync(filePath, 'utf8').substring(0, 500) + '...';
        }
      } catch (error) {
        return {
          path: file.path,
          exists,
          error: `Fehler beim Lesen: ${error.message}`
        };
      }
    }
    
    return {
      path: file.path,
      exists,
      size: exists ? size : 0,
      content
    };
  });
}

// Prüft die statischen Dateien und Routes
function checkStaticFileServing() {
  const publicDirExists = fs.existsSync(path.join(process.cwd(), 'public'));
  const distDirExists = fs.existsSync(path.join(process.cwd(), 'dist'));
  
  return {
    publicDirExists,
    distDirExists,
    publicDirContents: publicDirExists 
      ? listDirectoryContents(path.join(process.cwd(), 'public'))
      : [],
    distDirContents: distDirExists
      ? listDirectoryContents(path.join(process.cwd(), 'dist'))
      : []
  };
}

// Hauptdiagnose-Funktion
export function renderDiagnostic(req: Request, res: Response) {
  const serverUrl = `${req.protocol}://${req.get('host')}`;
  const requestPath = req.originalUrl;
  const timestamp = new Date().toISOString();
  const headers = req.headers;
  const cookies = req.cookies;
  
  // Sammle alle Umgebungsvariablen (ohne sensible Daten)
  const safeEnvVars: {[key: string]: string} = {};
  for (const key in process.env) {
    // Filtere sensible Daten
    if (!key.includes('KEY') && !key.includes('SECRET') && !key.includes('PASSWORD') && !key.includes('TOKEN')) {
      safeEnvVars[key] = typeof process.env[key] === 'string' ? process.env[key] as string : 'nicht-string';
    } else {
      safeEnvVars[key] = '[geschützt]';
    }
  }
  
  // Prüfe HTTP/HTTPS-Konfiguration
  const isHttps = req.secure || (req.headers['x-forwarded-proto'] === 'https');
  
  const diagnosticResult = {
    timestamp,
    request: {
      path: requestPath,
      method: req.method,
      url: req.url,
      baseUrl: req.baseUrl,
      originalUrl: req.originalUrl,
      serverUrl,
      isHttps,
      headers,
      cookies,
      ip: req.ip,
      hostname: req.hostname
    },
    environment: collectEnvironmentInfo(),
    keyFiles: checkKeyFiles(),
    staticFiles: checkStaticFileServing(),
    environmentVariables: safeEnvVars,
    sessionConfig: {
      // Sicher prüfen, ohne sensible Daten zu offenbaren
      cookieSecure: req.secure,
      hasSessionSecret: !!process.env.SESSION_SECRET,
      sessionActive: !!req.session
    },
    databaseConfig: {
      hasDatabaseUrl: !!process.env.DATABASE_URL,
      databaseType: process.env.DATABASE_URL ? (process.env.DATABASE_URL.includes('postgres') ? 'PostgreSQL' : 'Andere') : 'Keine',
      isNeon: process.env.DATABASE_URL ? process.env.DATABASE_URL.includes('neon.tech') : false
    }
  };
  
  // Speichere eine Kopie der Diagnoseergebnisse zur späteren Analyse
  try {
    const logDir = path.join(process.cwd(), 'logs');
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir);
    }
    fs.writeFileSync(
      path.join(logDir, `render-diagnostic-${Date.now()}.json`),
      JSON.stringify(diagnosticResult, null, 2)
    );
  } catch (error) {
    console.error('Fehler beim Speichern der Diagnose:', error);
  }
  
  return res.json(diagnosticResult);
}