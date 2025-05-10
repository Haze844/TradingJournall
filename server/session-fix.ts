/**
 * Session-Konfiguration-Fix für Render-Deployments
 * Dieses Modul vereinheitlicht die Session-Konfiguration für alle Umgebungen
 * und behebt spezifische Probleme mit Render/Production
 */

import session from 'express-session';
import { Express } from 'express';
import connectPg from 'connect-pg-simple';
import { pool } from './db';

// Einheitliche Cookie-Namen und Konfiguration für alle Umgebungen
const COOKIE_NAME = 'trading.sid';
const SESSION_SECRET = process.env.SESSION_SECRET || 'local-dev-secret';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 Tage

/**
 * Konfiguriert die Session mit vereinheitlichten Einstellungen für alle Umgebungen
 */
export function setupUnifiedSession(app: Express) {
  console.log('Session-Fix wird angewendet...');
  
  // Erkennen der aktuellen Umgebung
  const isProduction = process.env.NODE_ENV === 'production';
  const isRender = !!process.env.RENDER || !!process.env.RENDER_EXTERNAL_URL;
  const isReplit = !!process.env.REPL_ID || !!process.env.REPL_OWNER;
  
  // Konfiguriere die passende Session-Store basierend auf der Umgebung
  let store;
  
  // In Produktionsumgebungen verwenden wir PostgreSQL als Session-Store
  if (process.env.DATABASE_URL) {
    const PostgresStore = connectPg(session);
    store = new PostgresStore({
      pool,
      tableName: 'sessions', // Einheitlicher Tabellenname
      createTableIfMissing: true,
    });
    console.log('Verwende PostgreSQL Session-Store');
  } else {
    // Fallback für lokale Entwicklung
    const MemoryStore = require('memorystore')(session);
    store = new MemoryStore({
      checkPeriod: 86400000 // 24h Prune
    });
    console.log('Verwende Memory Session-Store (Entwicklungsumgebung)');
  }
  
  // Cookie-Einstellungen basierend auf der Umgebung
  const cookieSettings: session.CookieOptions = {
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    // Für Produktion und Render ist secure:true wichtig
    // Für Replit auch, da Replit HTTPS verwendet
    secure: isRender || isProduction || isReplit,
  };
  
  // Domain-Einstellung für Render/Produktion
  if (isRender) {
    // Domain-Angabe anhand der Render-URL
    const renderExternalUrl = process.env.RENDER_EXTERNAL_URL || '';
    if (renderExternalUrl) {
      try {
        const domain = new URL(renderExternalUrl).hostname;
        console.log(`Render-Domain erkannt: ${domain}`);
        // Setze keine Domain bei localhost (Entwicklung)
        if (!domain.includes('localhost')) {
          cookieSettings.domain = domain;
          console.log(`Cookie-Domain gesetzt auf: ${domain}`);
        }
      } catch (error) {
        console.error('Fehler beim Parsen der Render-URL:', error);
      }
    }
  }
  
  // Proxy-Einstellungen für Render (hinter Cloudflare)
  if (isRender) {
    app.set('trust proxy', 1);
    console.log('Trust Proxy für Render aktiviert');
  } else if (isReplit) {
    app.set('trust proxy', 'loopback');
    console.log('Trust Proxy für Replit aktiviert');
  }
  
  // Session-Middleware mit vereinheitlichten Einstellungen
  const sessionOptions: session.SessionOptions = {
    name: COOKIE_NAME,        // Einheitlicher Cookie-Name
    secret: SESSION_SECRET,   // Aus Umgebungsvariable
    resave: false,            // Optimierte Einstellung für moderne Stores
    saveUninitialized: false, // Nur speichern wenn Daten vorhanden
    store,                    // Store basierend auf Umgebung
    cookie: cookieSettings,   // Angepasste Cookie-Einstellungen
  };
  
  console.log('Finale Session-Konfiguration:', {
    name: COOKIE_NAME,
    secret: SESSION_SECRET ? 'VORHANDEN' : 'FEHLT',
    resave: false,
    saveUninitialized: false,
    storeType: process.env.DATABASE_URL ? 'PostgreSQL' : 'Memory',
    cookieSettings
  });
  
  // Session-Middleware anwenden
  app.use(session(sessionOptions));
  
  // Debug-Middleware für Session-Diagnose
  if (!isProduction) {
    app.use((req, res, next) => {
      console.log('SESSION-DEBUG:', {
        id: req.session.id,
        cookie: req.session.cookie,
        isAuthenticated: req.isAuthenticated ? req.isAuthenticated() : false
      });
      next();
    });
  }
  
  return { 
    store,
    cookieSettings,
    name: COOKIE_NAME
  };
}