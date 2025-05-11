/**
 * Render-Plattform-Integration
 * 
 * Diese Datei enthält alle speziellen Anpassungen für das Deployment auf Render,
 * insbesondere Lösungen für die bekannten Probleme mit Sessions, Cookies und
 * IPv6-Netzwerkverbindungen.
 */

import type { Express, Request, Response, NextFunction } from "express";
import { storage } from "./storage";
import { User } from "@shared/schema";
import { logger } from "./logger";

/**
 * Prüft, ob die Anwendung in der Render-Umgebung läuft
 */
export function isRenderEnvironment(): boolean {
  // Mehrere Möglichkeiten zur Erkennung der Render-Umgebung
  const isRenderVar = process.env.RENDER === 'true';
  const hasRenderUrl = !!process.env.RENDER_EXTERNAL_URL;
  const hasRenderServiceID = !!process.env.RENDER_SERVICE_ID;

  return isRenderVar || hasRenderUrl || hasRenderServiceID;
}

/**
 * Render-spezifische Express-Konfiguration
 */
export function configureForRender(app: Express): void {
  if (!isRenderEnvironment()) {
    logger.debug("👉 Keine Render-Umgebung erkannt, überspringe spezielle Konfiguration");
    return;
  }

  logger.info("🔧 Richte Render-spezifische Konfiguration ein...");

  // Spezielles Verhalten für Render: Fallback auf URL-Parameter-Authentifizierung
  app.use((req, res, next) => {
    // Füge ein Debug-Log für die Anfrage zur Session hinzu
    logger.debug("📡 Render-Anfrage empfangen", {
      method: req.method,
      path: req.path,
      ip: req.ip,
      hasSession: !!req.session,
      sessionID: req.session?.id || 'keine',
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : 'undefined'
    });

    // Prüfe, ob der Request eine userId als Parameter enthält
    // Dies ist eine Render-spezifische Lösung für Session-Probleme
    const userIdParam = req.query.userId || req.body?.userId;
    const validUserIds = ['1', '2', 1, 2]; // Admin=1, Mo=2

    if (userIdParam && 
        (validUserIds.includes(userIdParam as any) || 
         validUserIds.includes(Number(userIdParam)))) {
      logger.debug("🔑 Render URL Parameter Auth aktiviert", {
        userIdParam,
        path: req.path,
        method: req.method
      });
    }

    next();
  });

  logger.info("✅ Render-spezifische Konfiguration erfolgreich eingerichtet");
}

/**
 * Spezielle Authentifizierungsmiddleware für Render
 * 
 * Diese Middleware überprüft zunächst die reguläre Session-Authentifizierung,
 * und wenn diese fehlschlägt, sucht sie nach einem userId-Parameter in der URL,
 * um einen alternativen Authentifizierungsmechanismus zu bieten.
 */
export async function renderAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  // Prüfe zuerst reguläre Authentifizierung
  if (req.isAuthenticated && req.isAuthenticated()) {
    logger.debug("✅ Benutzer regulär authentifiziert", {
      sessionId: req.session?.id,
      userId: (req.user as any)?.id
    });
    return next();
  }

  // Wenn in Render-Umgebung und nicht authentifiziert, prüfe alternatives Auth-Schema
  if (isRenderEnvironment()) {
    // Prüfe, ob der Request eine userId als Parameter enthält
    const userIdParam = req.query.userId || req.body?.userId;
    const validUserIds = ['1', '2', 1, 2]; // Admin=1, Mo=2
    const isValidUserId = userIdParam !== undefined && 
                         (validUserIds.includes(userIdParam as any) || 
                          validUserIds.includes(Number(userIdParam)));
    
    // Debug-Log für Authentifizierungsprüfung
    logger.debug("🔐 Authentifizierungsprüfung", {
      sessionId: req.session?.id,
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      userInSession: !!req.user,
      userId: (req.user as any)?.id || null,
      username: (req.user as any)?.username || null,
      userIdParam: userIdParam as string,
      hasCookies: !!req.headers.cookie,
      cookieNames: req.headers.cookie ? req.headers.cookie.split(';').map(c => c.split('=')[0].trim()) : []
    });
    
    if (isValidUserId) {
      const userId = typeof userIdParam === 'string' ? parseInt(userIdParam, 10) : userIdParam as number;
      
      // Log dazwischen einfügen
      console.log('isAuthenticated-Check - Session:', req.session?.id, 'Auth-Status:', req.isAuthenticated ? req.isAuthenticated() : false, 'Path:', req.path);
      console.log('Alternativer Auth-Mechanismus via userId in Request-Parameter:', userId);
      
      // Benutzer aus der Datenbank holen
      try {
        const user = await storage.getUser(userId);
        
        if (user) {
          logger.info("✅ Authentifizierter Zugriff via Request-Parameter", {
            userId: user.id,
            path: req.path,
            method: req.method,
            ip: req.ip,
            parameterSource: 'query'
          });
          
          // Füge benutzer zum request ohne passport hinzu
          (req as any).renderAuthUser = user;
          return next();
        }
      } catch (error) {
        logger.error("❌ Fehler beim alternativen Auth-Mechanismus", {
          userIdParam,
          error: error instanceof Error ? error.message : String(error),
          path: req.path
        });
      }
    }
  }
  
  // Wenn keine Authentifizierung erfolgreich war
  logger.debug("👤 Render Auth: Benutzer nicht authentifiziert", {
    sessionId: req.session?.id,
    ip: req.ip,
    path: req.path,
    cookies: req.headers.cookie ? 'vorhanden' : 'fehlen'
  });
  
  return res.status(401).json({ message: "Unauthorized" });
}

/**
 * Spezielle GET /api/user Route für Render
 */
export async function renderUserRoute(req: Request, res: Response) {
  logger.debug("🔍 Render Auth-Check durchgeführt", { 
    sessionId: req.session?.id, 
    isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    path: req.path,
    query: req.query
  });
  
  // #1: Reguläre Session-Authentifizierung prüfen
  if (req.isAuthenticated && req.isAuthenticated()) {
    // Don't send password to the client
    const { password, ...userWithoutPassword } = req.user as User;
    
    logger.debug("✅ Benutzer per Session authentifiziert", {
      userId: userWithoutPassword.id,
      username: userWithoutPassword.username,
      sessionId: req.session?.id
    });
    
    return res.json(userWithoutPassword);
  }
  
  // #2: Für Render - userId im Query-Parameter prüfen (Fallback-Authentifizierung)
  const userIdParam = req.query.userId;
  const validUserIds = ['1', '2', 1, 2]; // Admin=1, Mo=2
  const isValidUserId = userIdParam !== undefined && 
                       (validUserIds.includes(userIdParam as any) || 
                        validUserIds.includes(Number(userIdParam)));
  
  if (isRenderEnvironment() && isValidUserId) {
    // Benutzer aus der Datenbank holen
    try {
      const userId = typeof userIdParam === 'string' ? parseInt(userIdParam, 10) : userIdParam as number;
      const user = await storage.getUser(userId);
      
      if (user) {
        // Don't send password to the client
        const { password, ...userWithoutPassword } = user;
        
        logger.debug("✅ Render Fallback-Authentifizierung via URL-Parameter", {
          userId: userWithoutPassword.id,
          username: userWithoutPassword.username,
          queryParam: userIdParam
        });
        
        return res.json(userWithoutPassword);
      }
    } catch (error) {
      logger.error("❌ Fehler bei Render URL-Parameter Auth", {
        userIdParam,
        error: error instanceof Error ? error.message : String(error)
      });
    }
  }
  
  // Wenn keine Authentifizierung erfolgreich war
  logger.debug("👤 Benutzer nicht authentifiziert", { 
    sessionId: req.session?.id,
    ip: req.ip,
    path: req.path,
    cookies: req.headers.cookie ? 'vorhanden' : 'fehlen'
  });
  return res.sendStatus(401);
}

/**
 * Optimierte Datenbankverbindung für Render
 * Diese Funktion fügt die notwendigen IPv4-Parameter zur Datenbank-URL hinzu
 */
export function getOptimizedDatabaseUrl(): string {
  const originalUrl = process.env.DATABASE_URL || '';
  
  // Prüfe, ob es eine valide URL ist
  if (!originalUrl || !originalUrl.includes('postgres')) {
    logger.error("❌ Ungültige Datenbank-URL für Optimierung");
    return originalUrl;
  }
  
  try {
    // Wenn die URL bereits ip_type=ipv4 hat, nichts ändern
    if (originalUrl.includes('ip_type=ipv4')) {
      return originalUrl;
    }
    
    // Füge Parameter ip_type=ipv4 zur URL hinzu
    const separator = originalUrl.includes('?') ? '&' : '?';
    return `${originalUrl}${separator}ip_type=ipv4`;
  } catch (error) {
    logger.error("❌ Fehler bei der URL-Optimierung", {
      error: error instanceof Error ? error.message : String(error)
    });
    return originalUrl;
  }
}