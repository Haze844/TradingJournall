import express, { Request, Response, NextFunction } from "express";
import cors from "cors";
import path from "path";
import { setupAuth } from "./auth-simple";
import { registerRoutes } from "./routes";

// Server-Konfiguration
const app = express();
const PORT = process.env.PORT || 5000;

// CORS mit Credentials
app.use(cors({
  origin: true,
  credentials: true
}));

// JSON-Body-Parser
app.use(express.json());

// Auth-Setup (vereinfacht)
setupAuth(app);

// API-Routes
registerRoutes(app);

// Einfacher Health-Check-Endpunkt
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || "development"
  });
});

// Debug-Route für Authentifizierungsproblemen
app.get("/api/debug", (req, res) => {
  res.json({
    session: {
      id: req.session.id,
      cookie: req.session.cookie,
    },
    user: req.user,
    isAuthenticated: req.isAuthenticated(),
    headers: {
      host: req.headers.host,
      cookie: !!req.headers.cookie,
      userAgent: req.headers["user-agent"],
      origin: req.headers.origin,
      referer: req.headers.referer
    }
  });
});

// Statische Dateien aus dem Client-Build-Verzeichnis
app.use(express.static(path.join(__dirname, "../public")));

// Serve der SPA für alle anderen Pfade
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Global Error Handler
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error("Server-Fehler:", err);
  res.status(500).json({
    error: err.message || "Interner Serverfehler",
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack
  });
});

// Server starten
app.listen(Number(PORT), "0.0.0.0", () => {
  console.log(`[express] serving on port ${PORT}`);
});

export default app;