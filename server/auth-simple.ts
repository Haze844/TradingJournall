import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
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

export function setupAuth(app: Express) {
  // Einfache Session-Konfiguration
  const sessionOptions: session.SessionOptions = {
    name: "trading.sid",
    secret: process.env.SESSION_SECRET || "development-secret",
    resave: false,
    saveUninitialized: false,
    store: new PostgresSessionStore({
      pool,
      tableName: "sessions",
      createTableIfMissing: true // Lassen wir das für Entwicklung aktiviert
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
      httpOnly: true,
      sameSite: "lax",
      secure: true,  // Auch in Entwicklungsumgebungen mit HTTPS verwenden (z.B. in Replit)
    }
  };

  // Debug für Session-Konfiguration
  console.log("SIMPLE SESSION-CONFIG:", {
    name: sessionOptions.name,
    secret: sessionOptions.secret ? "VORHANDEN" : "FEHLT",
    store: "PostgreSQL",
    cookie: sessionOptions.cookie
  });

  // Trust Proxy für Replit
  app.set("trust proxy", 1);

  // Session-Middleware anwenden
  app.use(session(sessionOptions));
  app.use(passport.initialize());
  app.use(passport.session());

  // Debug-Middleware für Session-Diagnose
  app.use((req, res, next) => {
    console.log("DEBUG-SESSION:", {
      id: req.session.id,
      authenticated: req.isAuthenticated ? req.isAuthenticated() : false,
      path: req.path
    });
    next();
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        
        if (!user) {
          return done(null, false, { message: "Falscher Benutzername oder Passwort" });
        }
        
        // Einfacher Passwort-Check für die Entwicklung
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

      const user = await storage.createUser({
        ...req.body,
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
      
      // Einfach einloggen ohne Komplikationen
      req.login(user, (loginErr: any) => {
        if (loginErr) {
          console.error("Fehler bei Login:", loginErr);
          return next(loginErr);
        }
        
        console.log("Login erfolgreich - Session-ID:", req.session.id, "User-ID:", user.id);
        
        // Passwort nicht zum Client senden
        const { password, ...userWithoutPassword } = user;
        return res.status(200).json(userWithoutPassword);
      });
    })(req, res, next);
  });

  app.post("/api/logout", (req, res, next) => {
    console.log("Logout-Anfrage. Session-ID:", req.session.id);
    
    // Einfacher Logout
    req.logout((logoutErr: any) => {
      if (logoutErr) {
        console.error("Fehler beim Logout:", logoutErr);
        return next(logoutErr);
      }
      
      console.log("Logout erfolgreich");
      res.sendStatus(200);
    });
  });

  app.get("/api/user", (req, res) => {
    console.log("Auth-Check - Session:", req.session.id, "Auth-Status:", req.isAuthenticated());
    
    if (!req.isAuthenticated()) {
      return res.sendStatus(401);
    }
    
    // Passwort nicht zum Client senden
    const { password, ...userWithoutPassword } = req.user as SelectUser;
    console.log("Authentifiziert als:", userWithoutPassword.username);
    res.json(userWithoutPassword);
  });

  // Test-Endpunkt
  app.get("/api/auth-debug", (req, res) => {
    res.json({
      sessionId: req.session.id,
      isAuthenticated: req.isAuthenticated(),
      user: req.isAuthenticated() ? req.user : null,
      cookies: req.headers.cookie,
      sessionAge: req.session.cookie.maxAge
    });
  });
  
  // Seed initial users if they don't exist - for development purposes
  (async () => {
    try {
      const existingUser1 = await storage.getUserByUsername("admin");
      if (!existingUser1) {
        await storage.createUser({
          username: "admin",
          password: "admin123"
        });
        console.log("Created default admin user");
      }
      
      const existingUser2 = await storage.getUserByUsername("mo");
      if (!existingUser2) {
        await storage.createUser({
          username: "mo",
          password: "mo123"
        });
        console.log("Created user 'mo'");
      }
    } catch (error) {
      console.error("Failed to seed initial users:", error);
    }
  })();
}