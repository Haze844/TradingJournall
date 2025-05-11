import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import session from 'express-session';
import passport from 'passport';
import { setupAuth } from './server/auth.js';
import { registerRoutes } from './server/routes.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// ➤ CORS & JSON Middleware
app.use(cors({
  origin: true,
  credentials: true
}));
app.use(express.json());

// ➤ Auth & Session Setup (inkl. Passport)
setupAuth(app); // beinhaltet session(), passport.initialize(), passport.session()

// ➤ Statische Dateien (für SPA)
app.use(express.static(path.join(__dirname, 'dist/public')));

// ➤ API-Routen
await registerRoutes(app);

// ➤ Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', environment: process.env.NODE_ENV || 'development' });
});

// ➤ Debug-Check
app.get('/api/debug', (req, res) => {
  res.json({
    environment: process.env.NODE_ENV || 'development',
    hostname: req.hostname,
    headers: req.headers,
    session: req.session || null,
    user: req.user || null,
    time: new Date().toISOString()
  });
});

// ➤ SPA Catch-All Route
app.get('*', (req, res, next) => {
  if (
    req.method === 'GET' &&
    !req.path.startsWith('/api/') &&
    !req.path.includes('.') &&
    req.headers.accept?.includes('text/html')
  ) {
    return res.sendFile(path.join(__dirname, 'dist/public/index.html'));
  }
  next();
});

// ➤ Serverstart
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server läuft auf Port ${PORT} im ${process.env.NODE_ENV || 'development'}-Modus`);
});