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

// Einfache Testroute für die API-Verfügbarkeit
app.get('/api/health', (req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'API ist verfügbar',
    timestamp: new Date().toISOString()
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

// Exportiere den serverless-Handler mit Fallback für den Fall,
// dass die Initialisierung noch nicht abgeschlossen ist
export const handler = async (event: any, context: any) => {
  // Prüfe, ob der Handler initialisiert wurde
  if (!handlerInstance) {
    // Warte kurz, um Zeit für die Initialisierung zu geben
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Wenn der Handler immer noch nicht initialisiert ist, gib einen Fehlerstatus zurück
    if (!handlerInstance) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: true, 
          message: "API-Initialisierung läuft noch. Bitte erneut versuchen." 
        })
      };
    }
  }
  
  try {
    // Verwende den initialisierten Handler
    return await handlerInstance(event, context);
  } catch (error) {
    console.error('Fehler beim Verarbeiten der Anfrage:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: true, 
        message: "Interner Serverfehler bei der Anfrageverarbeitung" 
      })
    };
  }
};