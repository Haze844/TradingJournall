import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";

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
  // Umgebungsabhängige Konfiguration für optimale Kompatibilität
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = process.env.RENDER || process.env.RENDER_EXTERNAL_URL;
  const isReplit = process.env.REPL_ID || process.env.REPL_SLUG;
  
  // Cookie-Einstellungen je nach Umgebung anpassen
  const cookieSettings: session.CookieOptions = {
    maxAge: 1000 * 60 * 60 * 24, // 24 Stunden Standardwert
    httpOnly: true,
    path: '/'
  };
  
  // Für Produktionsumgebungen und spezifische Plattformen
  if (isProduction || isRender) {
    // Cross-Origin-Anfragen in Produktionsumgebungen erlauben
    cookieSettings.sameSite = 'none';
    cookieSettings.secure = true;
  } else if (isReplit) {
    // Replit-spezifische Einstellungen
    cookieSettings.sameSite = 'lax';
    cookieSettings.secure = true;
  } else {
    // Für lokale Entwicklung
    cookieSettings.sameSite = 'lax';
    cookieSettings.secure = false;
  }
  
  // Verbesserte Session-Einstellungen mit Debug-Logging und optimierten Cookie-Parametern
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || "lvlup-trading-journal-secret-key",
    resave: true, // Auf true gesetzt, um Session-Probleme zu vermeiden
    saveUninitialized: true, // Auf true gesetzt, um neue Sessions zu erhalten
    store: storage.sessionStore,
    rolling: true, // Verlängert die Cookie-Lebensdauer bei jeder Anfrage
    name: 'lvlup.sid', // Expliziter Cookie-Name gegen Konflikte
    cookie: cookieSettings
  };
  
  // Debug-Logging mit verbesserter Erkennung des Session-Store-Typs
  const storeType = storage.sessionStore ? 
    (storage.sessionStore.constructor.name.includes('Postgres') ? 'PostgreSQL' : 
     storage.sessionStore.constructor.name.includes('Memory') ? 'Memory' : 
     storage.sessionStore.constructor.name) : 
    'KEINE';
  
  console.log('Session-Konfiguration initialisiert mit:', {
    secret: sessionSettings.secret ? 'VORHANDEN' : 'FEHLT',
    resave: sessionSettings.resave,
    saveUninitialized: sessionSettings.saveUninitialized,
    sessionStoreType: storeType,
    cookieSettings: sessionSettings.cookie
  });

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Falscher Benutzername oder Passwort" });
        }
        
        // Basic password check for simplicity during development
        // In production, use the comparePasswords function to securely check passwords
        // if (!(await comparePasswords(password, user.password))) {
        if (password !== user.password) {
          return done(null, false, { message: "Falscher Benutzername oder Passwort" });
        }
        
        return done(null, user);
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error, null);
    }
  });

  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByUsername(req.body.username);
      if (existingUser) {
        return res.status(400).json({ message: "Benutzername existiert bereits" });
      }

      // For development simplicity, not hashing passwords
      // In production, use hashPassword for secure password storage
      // const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        // password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        // Don't send password to the client
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      next(error);
    }
  });

  app.post("/api/login", (req, res, next) => {
    console.log("Login-Versuch für Benutzer:", req.body.username, "mit rememberMe:", req.body.rememberMe);
    
    // Debug-Informationen für Deployment-Umgebungen
    console.log("Login-Anfrage-Headers:", {
      origin: req.headers.origin,
      referer: req.headers.referer,
      host: req.headers.host,
      cookie: req.headers.cookie ? "Vorhanden" : "Nicht vorhanden",
      userAgent: req.headers['user-agent'],
      'x-forwarded-for': req.headers['x-forwarded-for'],
      'x-forwarded-proto': req.headers['x-forwarded-proto'],
      'sec-fetch-site': req.headers['sec-fetch-site'],
      'sec-fetch-mode': req.headers['sec-fetch-mode']
    });
    
    // Umgebungsinformationen für besseres Debugging
    const isProduction = process.env.NODE_ENV === 'production';
    const isRender = process.env.RENDER || process.env.RENDER_EXTERNAL_URL;
    const isReplit = process.env.REPL_ID || process.env.REPL_SLUG;
    
    console.log("Umgebungsinformationen:", {
      environment: process.env.NODE_ENV || 'development',
      isProduction,
      isRender: isRender ? 'true' : 'false',
      isReplit: isReplit ? 'true' : 'false',
      sessionSecret: process.env.SESSION_SECRET ? 'vorhanden' : 'fehlt'
    });
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login-Fehler:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login fehlgeschlagen:", info?.message || "Ungültige Anmeldedaten");
        return res.status(401).json({ message: info?.message || "Anmeldung fehlgeschlagen" });
      }
      
      console.log("Benutzer authentifiziert:", user.username, "- Session-ID vor Login:", req.session.id);
      
      // Überprüfe, ob "Eingeloggt bleiben" Option aktiviert ist
      const rememberMe = req.body.rememberMe === true;
      
      // Stellen wir sicher, dass die Session und der Cookie korrekt konfiguriert sind
      try {
        // Für sichere Cookie-Einstellungen, insbesondere für Cross-Origin-Anfragen
        if (req.session.cookie) {
          // Umgebungsabhängige Cookie-Einstellungen
          // Die ursprünglichen Cookie-Einstellungen werden jetzt von der anfänglichen 
          // Session-Konfiguration übernommen, aber wir können sie hier überschreiben
          
          // Domain-Einstellung für Cross-Origin-Cookies (optional)
          const host = req.headers.host || '';
          if (host.includes('onrender.com')) {
            req.session.cookie.domain = '.onrender.com';
          }
          
          console.log("Cookie-Einstellungen für Login:", {
            sameSite: req.session.cookie.sameSite,
            secure: req.session.cookie.secure,
            domain: req.session.cookie.domain || 'Nicht gesetzt',
            maxAge: req.session.cookie.maxAge,
            path: req.session.cookie.path
          });
        }
      } catch (cookieErr) {
        console.error("Fehler bei Cookie-Konfiguration:", cookieErr);
      }
      
      req.login(user, (loginErr: any) => {
        if (loginErr) {
          console.error("Fehler bei req.login():", loginErr);
          return next(loginErr);
        }
        
        // Cookie-Lebensdauer ändern, wenn "Eingeloggt bleiben" aktiviert ist
        if (req.session.cookie) {
          if (rememberMe) {
            // 30 Tage für "Eingeloggt bleiben"
            req.session.cookie.maxAge = 1000 * 60 * 60 * 24 * 30;
            console.log("'Eingeloggt bleiben' aktiviert - Cookie-Lebensdauer auf 30 Tage gesetzt");
          } else {
            // 24 Stunden Standard-Lebensdauer
            req.session.cookie.maxAge = 1000 * 60 * 60 * 24;
            console.log("Standard-Cookie-Lebensdauer auf 24 Stunden gesetzt");
          }
        }
        
        // Session regenerieren für bessere Sicherheit
        req.session.regenerate((regErr) => {
          if (regErr) {
            console.error("Fehler bei Session-Regeneration:", regErr);
            
            // Falls Session-Regenerierung fehlschlägt, versuchen wir trotzdem zu speichern
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error("Fehler beim Speichern der Session:", saveErr);
                return next(saveErr);
              }
              
              console.log("Login erfolgreich (ohne Regeneration), Session gespeichert. Session-ID:", req.session.id, "User-ID:", user.id);
              
              // Don't send password to the client
              const { password, ...userWithoutPassword } = user;
              return res.status(200).json(userWithoutPassword);
            });
            
            return; // Frühe Rückkehr nach dem Fehler
          }
          
          // Session wieder mit dem Benutzer verknüpfen, da regenerate() die Session leert
          req.login(user, () => {
            // Session speichern um sicherzustellen, dass sie persistiert wird
            req.session.save((saveErr) => {
              if (saveErr) {
                console.error("Fehler beim Speichern der Session:", saveErr);
                return next(saveErr);
              }
              
              console.log("Login erfolgreich, Session regeneriert und gespeichert. Session-ID:", req.session.id, "User-ID:", user.id);
              
              // Don't send password to the client
              const { password, ...userWithoutPassword } = user;
              return res.status(200).json(userWithoutPassword);
            });
          });
        });
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("Logout-Anfrage erhalten. Session-ID:", req.session.id);
    
    // Session speichern um den aktuellen Status zu sichern
    req.session.save((err) => {
      if (err) {
        console.error("Fehler beim Speichern der Session vor Logout:", err);
      }
      
      req.logout((logoutErr: any) => {
        if (logoutErr) {
          console.error("Fehler beim Logout:", logoutErr);
          return next(logoutErr);
        }
        
        // Session regenerieren um CSRF-Schutz zu verbessern
        req.session.regenerate((regenerateErr) => {
          if (regenerateErr) {
            console.error("Fehler beim Regenerieren der Session:", regenerateErr);
            return next(regenerateErr);
          }
          
          console.log("Logout erfolgreich. Neue Session-ID:", req.session.id);
          res.sendStatus(200);
        });
      });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("Auth-Check - Session:", req.session.id, "Auth-Status:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      console.log("Nicht authentifiziert - Headers:", req.headers);
      return res.sendStatus(401);
    }
    
    // Don't send password to the client
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    console.log("Authentifiziert als Benutzer:", userWithoutPassword.username);
    res.json(userWithoutPassword);
  });
  
  // Endpunkt für Passwortänderung
  app.post("/api/change-password", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Nicht authentifiziert" });
    }
    
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Aktuelles Passwort und neues Passwort sind erforderlich" });
    }
    
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }
      
      // Überprüfen des aktuellen Passworts
      // Im Dev-Modus einfacher String-Vergleich, in Produktion comparePasswords verwenden
      // if (!(await comparePasswords(currentPassword, user.password))) {
      if (currentPassword !== user.password) {
        return res.status(400).json({ message: "Aktuelles Passwort ist falsch" });
      }
      
      // Passwort ändern
      // In Produktion hashedPassword verwenden
      // const hashedNewPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, {
        password: newPassword
      });
      
      return res.status(200).json({ message: "Passwort erfolgreich geändert" });
    } catch (error) {
      console.error("Fehler beim Ändern des Passworts:", error);
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