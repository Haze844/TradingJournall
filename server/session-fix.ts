/**
 * Session-Konfiguration + Passport-Initialisierung
 * Vereinheitlicht die Session-Konfiguration für alle Umgebungen
 * und initialisiert Passport korrekt (für Login, Auth etc.)
 */

import session from 'express-session';
import { Express } from 'express';
import connectPg from 'connect-pg-simple';
import { pool } from './db';
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';

const COOKIE_NAME = 'trading.sid';
const SESSION_SECRET = process.env.SESSION_SECRET || 'local-dev-secret';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 Tage

export function setupUnifiedSession(app: Express) {
  console.log('Session-Fix wird angewendet...');

  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = !!process.env.RENDER || !!process.env.RENDER_EXTERNAL_URL;
  const isReplit = !!process.env.REPL_ID || !!process.env.REPL_OWNER;

  let store;

  if (process.env.DATABASE_URL) {
    const PostgresStore = connectPg(session);
    store = new PostgresStore({
      pool,
      tableName: 'sessions',
      createTableIfMissing: false, // Wichtig: nicht automatisch erstellen
    });
    console.log('Verwende PostgreSQL Session-Store');
  } else {
    const MemoryStore = require('memorystore')(session);
    store = new MemoryStore({
      checkPeriod: 86400000, // 24 Stunden
    });
    console.log('Verwende Memory Session-Store (Entwicklungsumgebung)');
  }

  const cookieSettings: session.CookieOptions = {
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: isRender || isProduction || isReplit,
  };

  if (isRender) {
    const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || '';
    if (renderExternalUrl) {
      try {
        const domain = new URL(renderExternalUrl).hostname;
        console.log(`Render-Domain erkannt: ${domain}`);
        if (!domain.includes('localhost')) {
          cookieSettings.domain = domain;
          console.log(`Cookie-Domain gesetzt auf: ${domain}`);
        }
      } catch (error) {
        console.error('Fehler beim Parsen der Render-URL:', error);
      }
    }
  }

  // Proxy-Einstellungen
  if (isRender) {
    app.set('trust proxy', 1);
    console.log('Trust Proxy für Render aktiviert');
    app.use((req, res, next) => {
      if (!req.secure && req.headers['x-forwarded-proto'] !== 'https') {
        const httpsUrl = `https://${req.headers.host}${req.originalUrl}`;
        console.log(`➡️  Redirect auf HTTPS: ${httpsUrl}`);
        return res.redirect(301, httpsUrl);
      }
      next();
    });
  } else if (isReplit) {
    app.set('trust proxy', 'loopback');
    console.log('Trust Proxy für Replit aktiviert');
  }

  const sessionOptions: session.SessionOptions = {
    name: COOKIE_NAME,
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: cookieSettings,
  };

  console.log('Finale Session-Konfiguration:', {
    name: COOKIE_NAME,
    secret: SESSION_SECRET ? 'VORHANDEN' : 'FEHLT',
    resave: false,
    saveUninitialized: false,
    storeType: process.env.DATABASE_URL ? 'PostgreSQL' : 'Memory',
    cookieSettings,
  });

  // 1. Session Middleware aktivieren
  app.use(session(sessionOptions));

  // 2. Passport initialisieren
  app.use(passport.initialize());
  app.use(passport.session());

  // 3. Passport serialize/deserialize definieren
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: string, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE id = $1', [id]);
      if (result.rows.length === 0) return done(null, false);
      done(null, result.rows[0]);
    } catch (err) {
      done(err);
    }
  });

  // 4. Optional: LocalStrategy definieren (falls nicht woanders gemacht)
  passport.use(new LocalStrategy(async (username, password, done) => {
    try {
      const result = await pool.query('SELECT * FROM users WHERE username = $1', [username]);
      const user = result.rows[0];
      if (!user) return done(null, false, { message: 'Falscher Benutzername' });

      const isValid = password === user.password; // Ersetze das durch Hash-Vergleich
      if (!isValid) return done(null, false, { message: 'Falsches Passwort' });

      done(null, user);
    } catch (err) {
      done(err);
    }
  }));

  // Debug-Logging nur in Entwicklung
  if (!isProduction) {
    app.use((req, res, next) => {
      console.log('SESSION-DEBUG:', {
        id: req.session.id,
        cookie: req.session.cookie,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false,
        user: req.user || null,
      });
      next();
    });
  }

  return {
    store,
    cookieSettings,
    name: COOKIE_NAME,
  };
}