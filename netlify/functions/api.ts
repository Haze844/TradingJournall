import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "../../server/routes";
import cors from "cors";
import serverless from "serverless-http";

const app = express();

// CORS konfigurieren
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Erhöhe die Größenbeschränkung für JSON-Anfragen
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Füge einen Logger-Middleware hinzu
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      console.log(logLine);
    }
  });

  next();
});

// Einfache Testrouten für die API-Verfügbarkeit
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'API ist verfügbar',
    timestamp: new Date().toISOString()
  });
});

// Root-Endpunkt zum Testen
app.get('/', (req: Request, res: Response) => {
  res.status(200).json({
    message: 'Trading Journal API ist aktiv',
    env: process.env.NODE_ENV,
    netlify: true,
    time: new Date().toISOString()
  });
});

// Debug-Endpunkt zur Anzeige von Umgebungsvariablen
app.get('/api/debug-env', (req: Request, res: Response) => {
  res.status(200).json({
    nodeEnv: process.env.NODE_ENV,
    hasDbUrl: !!process.env.DATABASE_URL,
    serverMode: 'netlify-serverless'
  });
});

// Globale Fehlerbehandlung
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error(err);
  const statusCode = err.statusCode || 500;
  res.status(statusCode).json({
    error: true,
    message: err.message || "Internal Server Error",
  });
});

// Registriere die API-Routen und erstelle den serverless-Handler
// Wir verwenden eine async IIFE statt eines Top-Level awaits
let handlerInstance: any;

// Initialisieren der App und Routen
(async () => {
  try {
    await registerRoutes(app);
    // Serverless-Handler initialisieren, nachdem die Routen registriert wurden
    handlerInstance = serverless(app);
  } catch (error) {
    console.error('Fehler beim Initialisieren der API:', error);
  }
})();

// Exportiere den serverless-Handler mit verbesserter Fehlerbehandlung
export const handler = async (event: any, context: any) => {
  console.log('Netlify Funktion aufgerufen:', {
    path: event.path,
    httpMethod: event.httpMethod,
    headers: event.headers
  });
  
  // Spezielle Debug-Route für den Zustand der Serverless-Funktion
  if (event.path === '/.netlify/functions/api/debug') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: JSON.stringify({
        status: 'ok',
        version: '1.0',
        handlerInitialized: !!handlerInstance,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL_SET: !!process.env.DATABASE_URL,
          SERVER_MODE: 'serverless'
        },
        timestamp: new Date().toISOString()
      })
    };
  }
  
  // CORS-Preflight-Anfragen beantworten
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE'
      },
      body: ''
    };
  }

  // Prüfe, ob der Handler initialisiert wurde
  if (!handlerInstance) {
    console.log('Handler noch nicht initialisiert, warte...');
    // Warte kurz, um Zeit für die Initialisierung zu geben
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Wenn der Handler immer noch nicht initialisiert ist, gib einen Fehlerstatus zurück
    if (!handlerInstance) {
      console.error('Handler konnte nicht initialisiert werden!');
      return {
        statusCode: 500,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({ 
          error: true, 
          message: "API-Initialisierung fehlgeschlagen. Bitte kontaktieren Sie den Administrator.",
          path: event.path,
          method: event.httpMethod
        })
      };
    }
  }
  
  try {
    // Verwende den initialisierten Handler
    console.log('Handler aufrufen für:', event.path);
    return await handlerInstance(event, context);
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify({ 
        error: true, 
        message: "Interner Serverfehler bei der Anfrageverarbeitung",
        details: error instanceof Error ? error.message : String(error),
        path: event.path
      })
    };
  }
};