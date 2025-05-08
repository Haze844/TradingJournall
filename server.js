// Dieser Server wird für Render-Hosting verwendet
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import session from 'express-session';
import { registerRoutes } from './server/routes.js';

// ESM Konfiguration
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Express-Server erstellen
const app = express();
const PORT = process.env.PORT || 5000;

// Basis-Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// Session-Konfiguration
app.use(session({
  secret: process.env.SESSION_SECRET || 'trading-journal-dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 Stunden
  }
}));

// Statische Dateien ausliefern
app.use(express.static(path.join(__dirname, 'dist/public')));

// API-Routen registrieren
await registerRoutes(app);

// Health Check Endpunkt
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// Debug-Endpunkt
app.get('/api/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    hostname: req.hostname,
    headers: req.headers,
    cookies: req.cookies,
    session: req.session ? 'Active' : 'Not active',
    time: new Date().toISOString()
  });
});

// Alle anderen Anfragen an index.html weiterleiten (SPA)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist/public/index.html'));
});

// Server starten
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
});