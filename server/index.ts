import express, { type Request, Response, NextFunction } from "express";
import path from "path";
import cors from "cors";
import cookieParser from "cookie-parser";

import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { setupUnifiedSession } from "./session-fix";
import { setupAuth } from "./auth";
import { fixRenderDirectories } from "./render-dir-fix";
import { logger, requestLogger, errorLogger } from "./logger";
import { configureForRender, isRenderEnvironment, getOptimizedDatabaseUrl } from "./render-integration";

// 🚀 Serverstart-Logging
logger.info("🚀 Trading Journal Server startet...");

// 📁 Verzeichnisse für Render vorbereiten
fixRenderDirectories();

// 🌍 Render-spezifische DB-Optimierung
if (isRenderEnvironment()) {
  try {
    process.env.DATABASE_URL = getOptimizedDatabaseUrl();
    logger.info("📊 Datenbank-URL für Render optimiert (IPv4-Modus)");
  } catch (error) {
    logger.error("❌ Fehler bei der Datenbank-URL-Optimierung", {
      error: error instanceof Error ? error.message : String(error)
    });
  }
}

const app = express();

// 🌐 Umgebung erkennen
const isRender = isRenderEnvironment();
const isReplit = !!process.env.REPL_ID || !!process.env.REPL_SLUG;
const isNetlify = process.env.NETLIFY === "true";
const isProduction = process.env.NODE_ENV === 'production';

logger.info("🌐 Umgebung erkannt", {
  isRender,
  isReplit,
  isNetlify,
  isProduction,
  nodeEnv: process.env.NODE_ENV
});

// 🛠️ Konfigurationen für Render aktivieren
configureForRender(app);

// 🔐 Sessions initialisieren (wichtig vor setupAuth!)
setupUnifiedSession(app);

// 🌍 CORS
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin', 'X-Client-Info']
}));

// 🍪 Cookies parsen
app.use(cookieParser());

// 🧠 Body-Parser für JSON & Formulardaten
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: false, limit: '10mb' }));

// 📋 Logging
app.use(requestLogger);
app.use(errorLogger);

// 🔐 Auth aktivieren
setupAuth(app);

// 🖼️ Statische Dateien aus /public
app.use(express.static(path.join(process.cwd(), "public")));

// 📍 Root-Redirect zu /auth
app.get("/", (req, res) => {
  logger.info("📍 Root-Pfad-Anfrage erkannt – Weiterleitung zu /auth");
  return res.redirect("/auth");
});

// 🧪 Erweiterte Logging-Middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: any;

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
