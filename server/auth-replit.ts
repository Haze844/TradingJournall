import { Request, Response, NextFunction, Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User } from "../shared/schema";
import { pool } from "./db";
import jwt from "jsonwebtoken";

declare global {
  namespace Express {
    interface User extends User {}
  }
}

const scryptAsync = promisify(scrypt);

// Einfachere Passwort-Hashing-Funktion
async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Passwortvergleich
async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Token-Secret aus der Session-Secret verwenden
const TOKEN_SECRET = process.env.SESSION_SECRET || "development-secret";

// Token-basierte Auth für Replit
export function setupAuthReplit(app: Express) {
  // Trust Proxy für Replit
  app.set("trust proxy", 1);

  // Login-Route - gibt JWT-Token zurück statt Session zu verwenden
  app.post("/api/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      console.log("Login-Versuch für Benutzer:", username);
      
      // Benutzer aus der Datenbank abrufen
      const user = await storage.getUserByUsername(username);
      
      // Prüfen, ob Benutzer existiert und Passwort korrekt ist
      if (!user || !(await comparePasswords(password, user.password))) {
        console.log("Login fehlgeschlagen: Ungültige Anmeldedaten");
        return res.status(401).json({ message: "Anmeldung fehlgeschlagen" });
      }
      
      console.log("Benutzer authentifiziert:", username);
      
      // JWT Token erstellen
      const token = jwt.sign(
        { 
          id: user.id, 
          username: user.username 
        }, 
        TOKEN_SECRET, 
        { expiresIn: "30d" }
      );
      
      console.log("JWT Token erstellt für User-ID:", user.id);
      
      // Token als Cookie setzen
      res.cookie("auth_token", token, {
        httpOnly: true,
        secure: true,
        sameSite: "none",
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 Tage
        path: "/"
      });
      
      // Cookie-Header für Debugging ausgeben
      console.log("Cookie-Header gesetzt:", res.getHeader("Set-Cookie"));
      
      // Passwort nicht zurücksenden
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login-Fehler:", error);
      return res.status(500).json({ message: "Server-Fehler beim Login" });
    }
  });

  // Logout-Route - löscht den Auth-Token Cookie
  app.post("/api/logout", (req, res) => {
    console.log("Logout-Anfrage erhalten");
    
    // Auth-Token-Cookie löschen
    res.clearCookie("auth_token", {
      httpOnly: true,
      secure: true,
      sameSite: "none",
      path: "/"
    });
    
    console.log("Auth-Token-Cookie gelöscht");
    res.sendStatus(200);
  });

  // Middleware zum Überprüfen des JWT-Tokens
  const authenticateJWT = async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Token aus Cookies oder Authorization-Header abrufen
      const token = req.cookies.auth_token || 
                   (req.headers.authorization && req.headers.authorization.split(" ")[1]);
      
      console.log("Auth-Check - Token vorhanden:", !!token);
      
      if (!token) {
        console.log("Auth-Check - Kein Token gefunden");
        return res.sendStatus(401);
      }
      
      // Token verifizieren
      const decoded = jwt.verify(token, TOKEN_SECRET) as any;
      console.log("Token verifiziert für User-ID:", decoded.id);
      
      // Benutzer aus der Datenbank abrufen
      const user = await storage.getUser(decoded.id);
      
      if (!user) {
        console.log("Auth-Check - Benutzer nicht in Datenbank gefunden:", decoded.id);
        return res.sendStatus(401);
      }
      
      // Benutzer zum Request hinzufügen
      req.user = user;
      console.log("Authentifiziert als Benutzer:", user.username);
      
      next();
    } catch (error) {
      console.error("JWT-Auth-Fehler:", error);
      return res.sendStatus(401);
    }
  };

  // User-Info-Route mit JWT-Auth
  app.get("/api/user", async (req, res) => {
    try {
      // Token aus Cookies oder Authorization-Header abrufen
      const token = req.cookies.auth_token || 
                   (req.headers.authorization && req.headers.authorization.split(" ")[1]);
      
      console.log("Auth-Check - Token vorhanden:", !!token);
      
      if (!token) {
        console.log("Auth-Check - Kein Token gefunden");
        return res.sendStatus(401);
      }
      
      try {
        // Token verifizieren
        const decoded = jwt.verify(token, TOKEN_SECRET) as any;
        console.log("Token verifiziert für User-ID:", decoded.id);
        
        // Benutzer aus der Datenbank abrufen
        const user = await storage.getUser(decoded.id);
        
        if (!user) {
          console.log("Auth-Check - Benutzer nicht in Datenbank gefunden:", decoded.id);
          return res.sendStatus(401);
        }
        
        // Passwort nicht zurücksenden
        const { password, ...userWithoutPassword } = user;
        console.log("Authentifiziert als Benutzer:", user.username);
        
        return res.json(userWithoutPassword);
      } catch (error) {
        console.error("JWT-Verifikationsfehler:", error);
        return res.sendStatus(401);
      }
    } catch (error) {
      console.error("User-Info-Fehler:", error);
      return res.sendStatus(500);
    }
  });

  // Passwortänderung mit JWT-Auth
  app.post("/api/change-password", authenticateJWT, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: "Aktuelles Passwort und neues Passwort sind erforderlich" });
    }
    
    try {
      const user = await storage.getUser(req.user!.id);
      
      if (!user) {
        return res.status(404).json({ message: "Benutzer nicht gefunden" });
      }
      
      const isPasswordValid = await comparePasswords(currentPassword, user.password);
      
      if (!isPasswordValid) {
        return res.status(401).json({ message: "Aktuelles Passwort ist falsch" });
      }
      
      const hashedPassword = await hashPassword(newPassword);
      
      await storage.updateUserPassword(user.id, hashedPassword);
      
      res.json({ message: "Passwort erfolgreich geändert" });
    } catch (error) {
      console.error("Fehler bei Passwortänderung:", error);
      res.status(500).json({ message: "Server-Fehler bei Passwortänderung" });
    }
  });
}

// Middleware-Helper für geschützte Routen
export const requireAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Token aus Cookies oder Authorization-Header abrufen
    const token = req.cookies.auth_token || 
                (req.headers.authorization && req.headers.authorization.split(" ")[1]);
    
    if (!token) {
      return res.sendStatus(401);
    }
    
    // Token verifizieren
    const decoded = jwt.verify(token, TOKEN_SECRET) as any;
    
    // Benutzer aus der Datenbank abrufen
    const user = await storage.getUser(decoded.id);
    
    if (!user) {
      return res.sendStatus(401);
    }
    
    // Benutzer zum Request hinzufügen
    req.user = user;
    
    next();
  } catch (error) {
    return res.sendStatus(401);
  }
};