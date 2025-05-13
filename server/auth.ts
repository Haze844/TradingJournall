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
import { Pool } from "pg";
import cookieParser from "cookie-parser";

interface PostgresSessionOptions {
  pool: Pool;
  tableName: string;
  createTableIfMissing: boolean;
  pruneSessionInterval?: number;
  errorCallback?: (err: Error) => void;
}

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

  const store = new PostgresSessionStore({
    pool,
    tableName: 'sessions',
    createTableIfMissing: true,
    errorCallback: (err) => logger.error("Fehler im Session-Store:", err)
  } satisfies PostgresSessionOptions);

  // 🍪 Parser für alte Cookie-Bereinigung
  app.use(cookieParser());

  // 🧹 Alte Cookies wie tj_sid oder trading_sid entfernen
  app.use((req, res, next) => {
    const legacyCookies = ['tj_sid', 'trading_sid'];
    legacyCookies.forEach(name => {
      if (req.cookies?.[name]) {
        res.clearCookie(name, { path: '/' });
        logger.info(`🧹 Alte Session-Cookie gelöscht: ${name}`);
      }
    });
    next();
  });

  app.use(
    session({
      name: 'trading.sid', // Aktiver Session-Cookie
      store,
      secret: process.env.SESSION_SECRET || 'dev-secret',
      resave: false,
      saveUninitialized: false,
      cookie: {
        httpOnly: true,
        secure: isRender || isProduction,
        sameSite: isRender || isProduction ? 'none' : 'lax',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 Tage
      }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.user.findUnique({ where: { id } });
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.user.findFirst({ where: { username } });
        if (!user) return done(null, false, { message: "Falsche Anmeldedaten." });

        const valid = await comparePasswords(password, user.password);
        if (!valid) return done(null, false, { message: "Falsche Anmeldedaten." });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  logger.info("✅ Auth-System erfolgreich eingerichtet");
}

export { hashPassword, comparePasswords };