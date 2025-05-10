import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";
import { setupUnifiedSession } from "./session-fix";
import { setupAuth } from "./auth";

// Wir verzichten komplett auf den statischen HTML-Fix
// Stattdessen werden wir direkte Weiterleitungen auf Serverseite implementieren
console.log("Direkter Auth-Zugriff aktiviert - keine statische HTML-Seite");

const app = express();

// Umgebungsvariablen erkennen
const isRender = process.env.RENDER === "true" || !!process.env.RENDER_EXTERNAL_URL;
const isReplit = !!process.env.REPL_ID || !!process.env.REPL_SLUG;
const isNetlify = process.env.NETLIFY === "true";
const isProduction = process.env.NODE_ENV === 'production';

console.log("Umgebung erkannt:", { 
  isRender, 
  isReplit, 
  isNetlify,
  isProduction,
  nodeEnv: process.env.NODE_ENV 
});

// GRUNDLEGENDER FIX: Stark vereinfachte CORS-Konfiguration für alle Umgebungen
// Erlaubt alle Anfragen, unabhängig vom Ursprung - kritisch für Replit
app.use(cors({
  origin: true, // Erlaubt alle Origins
  credentials: true, // Erlaubt Cookies bei Cross-Origin-Anfragen, essentiell für den Auth-Fix
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Client-Info']
}));

// Cookie-Parser für JWT-Token hinzufügen
app.use(cookieParser());

// WICHTIG: Erhöhe die Größenbeschränkung für JSON-Anfragen auf 10MB für größere Bilder
// Diese Middleware MUSS vor setupAuth sein, damit req.body in den Auth-Routes verfügbar ist
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// Verwende Standard-Passport-Auth für alle Umgebungen
console.log("Verwende optimierte Passport-Auth mit sameSite=none");
setupAuth(app);

// Serve static files from the public directory
app.use(express.static(path.join(process.cwd(), "public")));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  // Log incoming cookies for debugging
  if (path.startsWith("/api")) {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
    console.log(`Cookies: ${JSON.stringify(req.headers.cookie || 'none')}`);
    console.log(`Session ID: ${req.session?.id || 'keine Session'}`);
    console.log(`Authenticated: ${req.isAuthenticated()}`);
  }

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    // If the request is looking for a PDF file, check if it's in the public directory
    if (_req.path.endsWith('.pdf')) {
      log(`PDF request: ${_req.path}`);
      return _next();
    }

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on port 5000
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = 5000;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
