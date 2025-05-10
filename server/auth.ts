import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db-selector";
import { logger } from "./logger";

const PostgresSessionStore = connectPg(session);

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  // VERBESSERTE Session-Konfiguration für verschiedene Deployment-Umgebungen
  // Umgebungserkennung
  const isReplit = !!process.env.REPL_SLUG || !!process.env.REPL_ID;
  const isRender = process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL;
  const isProduction = process.env.NODE_ENV === "production";
  
  logger.info("🔐 Auth-System wird eingerichtet", { 
    environment: { 
      isRender, 
      isReplit, 
      isProduction, 
      nodeEnv: process.env.NODE_ENV 
    } 
  });
  
  // Cookie-Konfiguration je nach Umgebung optimieren
  let cookieConfig: session.CookieOptions = {
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
    httpOnly: true,
    path: '/'
  };
  
  // Render-spezifische Konfiguration nach Neon Dokumentation
  if (isRender) {
    console.log("Verwende optimierte Passport-Auth mit Render-spezifischen Cookie-Einstellungen");
    cookieConfig = {
      ...cookieConfig,
      secure: true,        // Muss true sein in Render-Umgebung
      sameSite: 'none',    // Muss 'none' sein für Cross-Site in Render
    };
  } 
  // Replit-spezifische Konfiguration
  else if (isReplit) {
    console.log("Verwende optimierte Passport-Auth mit angepassten Cookie-Einstellungen");
    cookieConfig = {
      ...cookieConfig,
      sameSite: 'lax',     // 'lax' für bessere Browser-Kompatibilität in Replit
      // In Replit keine 'secure'-Flag, problematisch in der Entwicklungsumgebung
    };
  } 
  // Standard-Produktion
  else if (isProduction) {
    console.log("Sichere Cookies aktiviert für Produktionsumgebung");
    cookieConfig = {
      ...cookieConfig,
      secure: true,
      sameSite: 'lax'
    };
  } 
  // Lokale Entwicklung
  else {
    console.log("Entwicklungsmodus - Standard-Cookies ohne 'secure'-Flag");
    cookieConfig.sameSite = 'lax';
  }
  
  // Session-Store mit Neon Postgres aufsetzen
  // Umgebungsspezifische Konfiguration
  let sessionStoreConfig = {
    pool, // Verwende den vorhandenen Pool mit Neon-DB-Verbindung
    tableName: "sessions",
    createTableIfMissing: true
  };
  
  // Für Render spezifische Optimierungen
  if (isRender) {
    console.log("Optimierter Session-Store für Render-Umgebung wird initialisiert");
    sessionStoreConfig = {
      ...sessionStoreConfig,
      pruneSessionInterval: 900, // Weniger häufig prüfen in Render (alle 15 Minuten)
      errorCallback: (err) => {
        console.error("Session-Store Fehler in Render:", err);
        if (global.renderLogs) {
          global.renderLogs.push(`[${new Date().toISOString()}] [SESSION-ERROR] ${err.message}`);
        }
      }
    };
  } 
  // Für Replit spezifische Optimierungen
  else if (isReplit) {
    console.log("Optimierter Session-Store für Replit-Umgebung wird initialisiert");
    sessionStoreConfig = {
      ...sessionStoreConfig,
      pruneSessionInterval: 60, // Regelmäßig prüfen in Replit (jede Minute)
    };
  }
  // Standard-Konfiguration
  else {
    sessionStoreConfig = {
      ...sessionStoreConfig,
      pruneSessionInterval: 300, // Alle 5 Minuten in anderen Umgebungen
    };
  }
  
  const sessionStore = new PostgresSessionStore(sessionStoreConfig);

  // Optimierte Session-Konfiguration basierend auf dem Deployment-Typ
  let sessionOptions: session.SessionOptions = {
    name: "tj_sid", // Kürzerer Name ohne Sonderzeichen - MUSS KONSISTENT BLEIBEN!
    secret: process.env.SESSION_SECRET || "development-secret",
    store: sessionStore,
    cookie: cookieConfig
  };

  // Für Render-Umgebung empfohlene Einstellungen nach Neon-Dokumentation
  if (isRender) {
    sessionOptions = {
      ...sessionOptions,
      resave: false,
      saveUninitialized: false,
      rolling: true
    };
    logger.info("🔧 Render-optimierte Session-Konfiguration aktiviert", { sessionOptions });
  }
  // Für Replit-Umgebung
  else if (isReplit) {
    sessionOptions = {
      ...sessionOptions,
      resave: true,
      saveUninitialized: true,
      rolling: true
    };
    logger.info("🔧 Replit-optimierte Session-Konfiguration aktiviert", { sessionOptions });
  }
  // Standard-Produktionsumgebung
  else if (isProduction) {
    sessionOptions = {
      ...sessionOptions,
      resave: false,
      saveUninitialized: false,
      rolling: true
    };
    logger.info("🔧 Produktions-Session-Konfiguration aktiviert", { sessionOptions });
  }
  // Lokale Entwicklung
  else {
    sessionOptions = {
      ...sessionOptions,
      resave: true,
      saveUninitialized: true,
      rolling: true
    };
    logger.info("🔧 Entwicklungs-Session-Konfiguration aktiviert", { sessionOptions });
  }

  // Trust Proxy Einstellung
  // Für Render und Replit wichtig, da Anfragen über Proxies geleitet werden
  // Der Wert 1 bedeutet, dass wir dem ersten Proxy vertrauen
  if (isRender) {
    app.set("trust proxy", 1);
    logger.info("🔐 Trust Proxy für Render Umgebung aktiviert");
  } else if (isReplit) {
    app.set("trust proxy", 1);
    logger.info("🔐 Trust Proxy für Replit Umgebung aktiviert");
  } else if (isProduction) {
    app.set("trust proxy", 1);
    console.log("Trust Proxy für Produktionsumgebung aktiviert");
  }
  
  // Session-Middleware anwenden
  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        logger.debug("🔑 Authentifizierungsversuch", { username, timestamp: new Date().toISOString() });
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          logger.warn("❌ Login fehlgeschlagen: Benutzer nicht gefunden", { 
            username,
            timestamp: new Date().toISOString()
          });
          return done(null, false, { message: "Falscher Benutzername oder Passwort" });
        }
        
        // Basic password check for simplicity during development
        // In production, use the comparePasswords function to securely check passwords
        // if (!(await comparePasswords(password, user.password))) {
        if (password !== user.password) {
          logger.warn("❌ Login fehlgeschlagen: Falsches Passwort", { 
            username, 
            userId: user.id,
            timestamp: new Date().toISOString()
          });
          return done(null, false, { message: "Falscher Benutzername oder Passwort" });
        }
        
        logger.info("✅ Login erfolgreich", { 
          username, 
          userId: user.id,
          timestamp: new Date().toISOString()
        });
        return done(null, user);
      } catch (error) {
        logger.error("❌ Fehler bei der Authentifizierung", { 
          username,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          timestamp: new Date().toISOString()
        });
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => {
    logger.debug("👤 Benutzer wird in Session serialisiert", { userId: user.id });
    done(null, user.id);
  });
  
  passport.deserializeUser(async (id: number, done) => {
    try {
      logger.debug("👤 Benutzer wird aus Session wiederhergestellt", { userId: id });
      const user = await storage.getUser(id);
      
      if (user) {
        logger.debug("✅ Benutzer aus Datenbank geladen", { userId: id });
        done(null, user);
      } else {
        logger.warn("❌ Benutzer nicht in Datenbank gefunden", { userId: id });
        done(null, null);
      }
    } catch (error) {
      logger.error("❌ Fehler beim Wiederherstellen des Benutzers", { 
        userId: id,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      logger.info("📝 Registrierungsversuch", { 
        username: req.body.username, 
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        logger.warn("❌ Registrierung fehlgeschlagen: Benutzername existiert bereits", { 
          username: req.body.username,
          ip: req.ip 
        });
        return res.status(400).json({ message: "Benutzername existiert bereits" });
      }

      // For development simplicity, not hashing passwords
      // In production, use hashPassword for secure password storage
      // const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        // password: hashedPassword,
      });

      logger.info("✅ Benutzer erfolgreich erstellt", { 
        userId: user.id, 
        username: user.username 
      });

      req.login(user, (err) => {
        if (err) {
          logger.error("❌ Fehler beim automatischen Login nach Registrierung", {
            userId: user.id,
            username: user.username,
            error: err instanceof Error ? err.message : String(err)
          });
          return next(err);
        }
        
        logger.info("✅ Automatischer Login nach Registrierung erfolgreich", { 
          userId: user.id, 
          username: user.username
        });
        
        // Don't send password to the client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      logger.error("❌ Fehler bei der Registrierung", {
        username: req.body.username,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    // Einfache Sicherheitsüberprüfung
    if (!req.body || !req.body.username) {
      logger.warn("❌ Ungültige Login-Anfrage: Fehlende Daten", { 
        body: req.body,
        ip: req.ip 
      });
      return res.status(400).json({ message: "Username und Passwort erforderlich" });
    }
    
    logger.info("🔑 Login-Versuch", { 
      username: req.body.username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      sessionId: req.sessionID
    });
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        logger.error("❌ Login-Fehler", {
          username: req.body.username,
          error: err instanceof Error ? err.message : String(err),
          stack: err instanceof Error ? err.stack : undefined
        });
        return next(err);
      }
      
      if (!user) {
        logger.warn("❌ Login fehlgeschlagen", { 
          username: req.body.username,
          reason: info?.message || "Ungültige Anmeldedaten",
          ip: req.ip,
          sessionId: req.sessionID
        });
        return res.status(401).json({ message: info?.message || "Anmeldung fehlgeschlagen" });
      }
      
      logger.debug("👤 Benutzer authentifiziert", { 
        username: user.username,
        userId: user.id
      });
      
      req.login(user, (loginErr: any) => {
        if (loginErr) {
          logger.error("❌ Fehler bei Session-Erstellung", {
            username: user.username,
            userId: user.id,
            error: loginErr instanceof Error ? loginErr.message : String(loginErr),
            stack: loginErr instanceof Error ? loginErr.stack : undefined
          });
          return next(loginErr);
        }
        
        logger.info("✅ Login erfolgreich", { 
          username: user.username,
          userId: user.id,
          ip: req.ip,
          sessionId: req.sessionID,
          timestamp: new Date().toISOString()
        });
        
        // Passwort nicht zurücksenden
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    const sessionId = req.session.id;
    const userId = req.user ? (req.user as any).id : null;
    const username = req.user ? (req.user as any).username : null;
    
    logger.info("🚪 Logout-Anfrage erhalten", { 
      sessionId: sessionId,
      userId: userId,
      username: username,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      isAuthenticated: req.isAuthenticated()
    });
    
    // Optimierter Logout-Prozess mit vollständiger Session-Zerstörung
    req.logout((logoutErr: any) => {
      if (logoutErr) {
        logger.error("❌ Fehler beim Logout-Prozess", {
          sessionId: sessionId,
          userId: userId,
          username: username,
          error: logoutErr instanceof Error ? logoutErr.message : String(logoutErr),
          stack: logoutErr instanceof Error ? logoutErr.stack : undefined
        });
        return next(logoutErr);
      }
      
      logger.debug("👤 Passport-Logout erfolgreich", { 
        sessionId: sessionId,
        userId: userId,
        username: username
      });
      
      // Komplett Session zerstören
      req.session.destroy((destroyErr: any) => {
        if (destroyErr) {
          logger.error("❌ Fehler beim Zerstören der Session", {
            sessionId: sessionId,
            userId: userId,
            username: username,
            error: destroyErr instanceof Error ? destroyErr.message : String(destroyErr),
            stack: destroyErr instanceof Error ? destroyErr.stack : undefined
          });
          // Trotzdem 200 senden, da der Client die Daten lokal löscht
          return res.sendStatus(200);
        }
        
        logger.info("✅ Logout erfolgreich", {
          sessionId: sessionId,
          userId: userId, 
          username: username,
          ip: req.ip,
          timestamp: new Date().toISOString()
        });
        
        // Zusätzlich Legacy-Cookies löschen
        res.clearCookie("trading.sid");
        res.clearCookie("trading_sid");
        // Das aktuelle Cookie "tj_sid" wird automatisch von Express Session entfernt
        
        logger.debug("🍪 Legacy-Cookies gelöscht", {
          cookies: ["trading.sid", "trading_sid"]
        });
        
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    logger.debug("🔍 Auth-Check durchgeführt", { 
      sessionId: req.session.id, 
      isAuthenticated: req.isAuthenticated(),
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      path: req.path,
      query: req.query
    });
    
    // FIX: Den Header-Check vereinfachen
    if (!req.isAuthenticated()) {
      logger.debug("👤 Benutzer nicht authentifiziert", { 
        sessionId: req.session.id,
        ip: req.ip,
        path: req.path,
        cookies: req.headers.cookie ? 'vorhanden' : 'fehlen'
      });
      return res.sendStatus(401);
    }
    
    // Don't send password to the client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    
    logger.debug("✅ Benutzer authentifiziert", {
      userId: userWithoutPassword.id,
      username: userWithoutPassword.username,
      sessionId: req.session.id
    });
    
    res.json(userWithoutPassword);
  });
  
  // Endpunkt für Passwortänderung
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      logger.warn("❌ Passwortänderung verweigert: Nicht authentifiziert", {
        ip: req.ip,
        sessionId: req.session.id,
        path: req.path
      });
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }
    
    const userId = (req.user as any).id;
    const username = (req.user as any).username;
    
    logger.info("🔑 Passwortänderung angefordert", {
      userId: userId,
      username: username,
      ip: req.ip,
      sessionId: req.session.id
    });
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      logger.warn("⚠️ Passwortänderung fehlgeschlagen: Unvollständige Daten", {
        userId: userId,
        username: username,
        ip: req.ip,
        hasCurrentPassword: !!currentPassword,
        hasNewPassword: !!newPassword
      });
      return res.status(400).json({ message: "Aktuelles Passwort und neues Passwort sind erforderlich" });
    }
    
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        logger.error("❌ Passwortänderung fehlgeschlagen: Benutzer nicht gefunden", {
          userId: userId,
          username: username,
          ip: req.ip
        });
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }
      
      // Überprüfen des aktuellen Passworts
      // Im Dev-Modus einfacher String-Vergleich, in Produktion comparePasswords verwenden
      // if (!(await comparePasswords(currentPassword, user.password))) {
      const isCurrentPasswordValid = currentPassword === user.password;
      if (!isCurrentPasswordValid) {
        logger.warn("⚠️ Passwortänderung fehlgeschlagen: Falsches aktuelles Passwort", {
          userId: userId,
          username: username,
          ip: req.ip
        });
        return res.status(400).json({ message: "Aktuelles Passwort ist falsch" });
      }
      
      // Passwort ändern
      // In Produktion hashedPassword verwenden
      // const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, {
        password: newPassword
      });
      
      logger.info("✅ Passwort erfolgreich geändert", {
        userId: userId,
        username: username,
        ip: req.ip,
        timestamp: new Date().toISOString()
      });
      
      return res.status(200).json({ message: "Passwort erfolgreich geändert" });
    } catch (error) {
      logger.error("❌ Fehler bei Passwortänderung", {
        userId: userId,
        username: username,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return res.status(500).json({ message: "Fehler beim Ändern des Passworts" });
    }
  });
  
  // Seed initial users if they don't exist - for development purposes
  (async () => {
    try {
      const existingUser1 = await storage.getUserByUsername("admin");
      if (!existingUser1) {
        await storage.createUser({
          username: "admin",
          password: "admin123" // In production, use hashPassword
        });
        console.log("Created default admin user");
      }
      
      const existingUser2 = await storage.getUserByUsername("mo");
      if (!existingUser2) {
        await storage.createUser({
          username: "mo",
          password: "mo123" // In production, use hashPassword
        });
        console.log("Created user 'mo'");
      }
    } catch (error) {
      console.error("Failed to seed initial users:", error);
    }
  })();
}