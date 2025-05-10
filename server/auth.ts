import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

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
  // Verbesserte Session-Konfiguration für maximale Kompatibilität in Replit-Umgebung
  const sessionOptions: session.SessionOptions = {
    name: "trading.sid",
    secret: process.env.SESSION_SECRET || "development-secret",
    resave: true, // Erzwinge Session-Speicherung bei jeder Anfrage
    saveUninitialized: true, // Speichere auch nicht initialisierte Sessions
    store: new PostgresSessionStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: true,
      pruneSessionInterval: 60, // Prüfe häufiger auf abgelaufene Sessions
    }),
    cookie: {
      maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
      httpOnly: true,
      sameSite: "none", // Wichtig für Cross-Site-Requests in Replit-Umgebungen
      secure: true, // Immer auf secure setzen für HTTPS
      path: '/', // Stelle sicher, dass der Cookie für alle Pfade gilt
    }
  };

  // Trust Proxy für Replit
  app.set("trust proxy", 1);
  
  // Session-Middleware anwenden
  app.use(session(sessionOptions));
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
    // Einfache Sicherheitsüberprüfung
    if (!req.body || !req.body.username) {
      return res.status(400).json({ message: "Username und Passwort erforderlich" });
    }
    
    console.log("Login-Versuch für Benutzer:", req.body.username);
    
    passport.authenticate("local", (err: any, user: any, info: any) => {
      if (err) {
        console.error("Login-Fehler:", err);
        return next(err);
      }
      
      if (!user) {
        console.log("Login fehlgeschlagen:", info?.message || "Ungültige Anmeldedaten");
        return res.status(401).json({ message: info?.message || "Anmeldung fehlgeschlagen" });
      }
      
      console.log("Benutzer authentifiziert:", user.username);
      
      req.login(user, (loginErr: any) => {
        if (loginErr) {
          console.error("Fehler bei req.login():", loginErr);
          return next(loginErr);
        }
        
        console.log("Login erfolgreich, User-ID:", user.id);
        
        // Passwort nicht zurücksenden
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("Logout-Anfrage erhalten. Session-ID:", req.session.id);
    
    // FIX: Vereinfachter, robusterer Logout-Prozess ohne Session-Regeneration
    req.logout((logoutErr: any) => {
      if (logoutErr) {
        console.error("Fehler beim Logout:", logoutErr);
        return next(logoutErr);
      }
      
      // Session direkt speichern ohne Regeneration
      req.session.save((saveErr) => {
        if (saveErr) {
          console.error("Fehler beim Speichern der Session nach Logout:", saveErr);
          return next(saveErr);
        }
        
        console.log("Logout erfolgreich, Session gespeichert. Session-ID:", req.session.id);
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("Auth-Check - Session:", req.session.id, "Auth-Status:", req.isAuthenticated());
    
    // FIX: Den Header-Check vereinfachen
    if (!req.isAuthenticated()) {
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