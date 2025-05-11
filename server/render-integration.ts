/**
 * Render-Plattform-Integration
 * 
 * Diese Datei enthält alle speziellen Anpassungen für das Deployment auf Render,
 * insbesondere Lösungen für die bekannten Probleme mit Sessions, Cookies und
 * IPv6-Netzwerkverbindungen.
 */

import { Request, Response, NextFunction, Express } from 'express';
import { logger } from './logger';
import { storage } from './storage';
import { User as SelectUser } from "@shared/schema";

/**
 * Prüft, ob die Anwendung in der Render-Umgebung läuft
 */
export function isRenderEnvironment(): boolean {
  return process.env.RENDER === 'true' || 
         !!process.env.RENDER_EXTERNAL_URL || 
         !!process.env.RENDER_SERVICE_ID;
}

/**
 * Render-spezifische Express-Konfiguration
 */
export function configureForRender(app: Express): void {
  if (!isRenderEnvironment()) {
    logger.debug("🔄 Keine Render-Umgebung erkannt, Render-Konfiguration wird übersprungen");
    return;
  }

  logger.info("🚀 Render-spezifische Konfiguration wird angewendet");
  
  // Verbesserte Trust Proxy Einstellung für Render's Architektur
  app.set("trust proxy", 1);
  
  // Globales Logging für Render-Debugging
  if (!global.renderLogs) {
    global.renderLogs = [];
  }

  // Verbindungstest-Route speziell für Render
  app.get("/api/render-status", (req, res) => {
    res.json({
      status: "ok",
      environment: "render",
      timestamp: new Date().toISOString(),
      headers: {
        userAgent: req.get('User-Agent'),
        host: req.get('Host'),
        forwardedProto: req.get('X-Forwarded-Proto')
      },
      render: {
        external_url: process.env.RENDER_EXTERNAL_URL,
        service_id: process.env.RENDER_SERVICE_ID
      },
      connectionType: {
        usingIPv4Only: true,
        usingFallbackAuth: true
      }
    });
  });
}

/**
 * Spezielle Authentifizierungsmiddleware für Render
 * 
 * Diese Middleware überprüft zunächst die reguläre Session-Authentifizierung,
 * und wenn diese fehlschlägt, sucht sie nach einem userId-Parameter in der URL,
 * um einen alternativen Authentifizierungsmechanismus zu bieten.
 */
export async function renderAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Zuerst prüfen wir, ob die Render-Anpassungen überhaupt nötig sind
  if (!isRenderEnvironment()) {
    // Standardverhalten in Nicht-Render-Umgebungen: Weiterleitung
    return next();
  }

  // Logging für Debug-Zwecke
  logger.debug("🔍 Render Auth-Check durchgeführt", { 
    path: req.path,
    query: req.query,
    hasSession: !!req.session,
    sessionId: req.session?.id,
    isAuthenticated: req.isAuthenticated()
  });

  // 1. Standard-Authentifizierung über Session prüfen
  if (req.isAuthenticated()) {
    logger.debug("✅ Render: Benutzer per Session authentifiziert", {
      userId: (req.user as any).id,
      path: req.path
    });
    return next();
  }

  // 2. Fallback: userId im Query-Parameter prüfen
  const userIdParam = req.query.userId;
  
  // Sicherheitsüberprüfung: nur bestimmte User-IDs zulassen
  const validUserIds = ['1', '2', 1, 2]; // Admin=1, Mo=2
  const isValidUserId = userIdParam !== undefined && 
                       (validUserIds.includes(userIdParam as any) || 
                        validUserIds.includes(Number(userIdParam)));
  
  if (isValidUserId) {
    try {
      // User-ID konvertieren
      const userId = typeof userIdParam === 'string' ? parseInt(userIdParam, 10) : userIdParam;
      
      // Benutzer aus der Datenbank holen
      const user = await storage.getUser(userId as number);
      
      if (user) {
        // Benutzer im Request-Objekt speichern, ohne Session
        (req as any).renderAuthUser = user;
        (req as any).effectiveUserId = user.id;
        
        logger.debug("✅ Render: Fallback-Authentifizierung über URL-Parameter", {
          userId: user.id,
          username: user.username,
          path: req.path
        });
        
        return next();
      }
    } catch (error) {
      logger.error("❌ Render: Fehler bei URL-Parameter-Authentifizierung", {
        userIdParam,
        path: req.path,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // 3. Wenn keine Authentifizierung erfolgreich war
  logger.debug("❌ Render: Nicht authentifiziert", { 
    path: req.path,
    userIdParam
  });
  
  res.status(401).json({ message: "Nicht authentifiziert" });
}

/**
 * Spezielle GET /api/user Route für Render
 */
export async function renderUserRoute(req: Request, res: Response) {
  // Spezial-Route für Render
  if (!isRenderEnvironment()) {
    return res.status(400).json({ message: "Diese Route ist nur für Render verfügbar" });
  }

  // 1. Reguläre Session-Authentifizierung
  if (req.isAuthenticated()) {
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    return res.json(userWithoutPassword);
  }

  // 2. Fallback: userId im Query-Parameter prüfen
  const userIdParam = req.query.userId;
  
  // Sicherheitsüberprüfung: nur bestimmte User-IDs zulassen
  const validUserIds = ['1', '2', 1, 2]; // Admin=1, Mo=2
  const isValidUserId = userIdParam !== undefined && 
                       (validUserIds.includes(userIdParam as any) || 
                        validUserIds.includes(Number(userIdParam)));
  
  if (isValidUserId) {
    try {
      // User-ID konvertieren
      const userId = typeof userIdParam === 'string' ? parseInt(userIdParam, 10) : userIdParam;
      
      // Benutzer aus der Datenbank holen
      const user = await storage.getUser(userId as number);
      
      if (user) {
        // Don't send password to the client
        const { password, ...userWithoutPassword } = user;
        
        logger.debug("✅ Render: User-Daten via URL-Parameter bereitgestellt", {
          userId: userWithoutPassword.id,
          username: userWithoutPassword.username
        });
        
        return res.json(userWithoutPassword);
      }
    } catch (error) {
      logger.error("❌ Render: Fehler beim Bereitstellen der User-Daten", {
        userIdParam,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }

  // Wenn keine Authentifizierung erfolgreich war
  res.status(401).json({ message: "Nicht authentifiziert" });
}

/**
 * Optimierte Datenbankverbindung für Render
 * Diese Funktion fügt die notwendigen IPv4-Parameter zur Datenbank-URL hinzu
 */
export function getOptimizedDatabaseUrl(): string {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error("DATABASE_URL ist nicht definiert");
  }
  
  // Prüfen, ob in der Render-Umgebung
  if (!isRenderEnvironment()) {
    return dbUrl;
  }
  
  try {
    const url = new URL(dbUrl);
    
    // Parameter für IPv4-Verbindung hinzufügen, wenn noch nicht vorhanden
    if (!url.searchParams.has('ip_type')) {
      url.searchParams.set('ip_type', 'ipv4');
      logger.info("📊 Datenbank-URL für Render optimiert (IPv4-Parameter hinzugefügt)");
    }
    
    return url.toString();
  } catch (error) {
    logger.error("❌ Fehler beim Optimieren der Datenbank-URL", {
      error: error instanceof Error ? error.message : String(error)
    });
    
    // Im Fehlerfall die Original-URL zurückgeben
    return dbUrl;
  }
}

// Typerweiterung für globale Variablen
declare global {
  var renderLogs: string[];
}