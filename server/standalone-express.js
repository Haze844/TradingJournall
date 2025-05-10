/**
 * Standalone Express-Server für Render Deployment
 * 
 * Dieses Script ist ein minimalistischer Express-Server, der nur die nötigsten
 * Funktionen bereitstellt, um die Login-Seite und API zu servieren. Es umgeht
 * alle möglichen Probleme mit dem Frontend-Build und dem Vite-Prozess.
 */

const express = require('express');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const { Strategy: LocalStrategy } = require('passport-local');
const { Pool } = require('@neondatabase/serverless');
const { drizzle } = require('drizzle-orm/neon-serverless');
const connectPg = require('connect-pg-simple');
const { scrypt, randomBytes, timingSafeEqual } = require('crypto');
const { promisify } = require('util');
const cors = require('cors');

// DB-Setup
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const db = drizzle(pool);

// Hilfsfunktionen für Passwort
const scryptAsync = promisify(scrypt);

async function hashPassword(password) {
  const salt = randomBytes(16).toString('hex');
  const buf = await scryptAsync(password, salt, 64);
  return `${buf.toString('hex')}.${salt}`;
}

async function comparePasswords(supplied, stored) {
  const [hashed, salt] = stored.split('.');
  const hashedBuf = Buffer.from(hashed, 'hex');
  const suppliedBuf = await scryptAsync(supplied, salt, 64);
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

// Express-App initialisieren
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({ origin: true, credentials: true }));

// Session-Setup mit PostgreSQL
const PostgresStore = connectPg(session);
const sessionStore = new PostgresStore({
  pool,
  createTableIfMissing: true,
  tableName: 'sessions'
});

// Session-Konfiguration
app.use(session({
  store: sessionStore,
  secret: process.env.SESSION_SECRET || 'render-emergency-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Tage
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

// Passport für Authentifizierung
app.use(passport.initialize());
app.use(passport.session());

// Passport-Strategie konfigurieren
passport.use(new LocalStrategy(async (username, password, done) => {
  try {
    // Benutzer aus der Datenbank holen
    const [user] = await db.execute(
      "SELECT * FROM users WHERE username = $1",
      [username]
    );

    if (!user || !(await comparePasswords(password, user.password))) {
      return done(null, false, { message: 'Ungültiger Benutzername oder Passwort' });
    }

    return done(null, user);
  } catch (error) {
    return done(error);
  }
}));

// Passport Serialisierung/Deserialisierung
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const [user] = await db.execute(
      "SELECT * FROM users WHERE id = $1",
      [id]
    );
    done(null, user || null);
  } catch (error) {
    done(error);
  }
});

// Static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// API-Endpunkte

// Health-Check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Debug-Endpunkt
app.get('/render-debug', (req, res) => {
  res.json({
    timestamp: new Date().toISOString(),
    server: {
      standalone: true,
      env: process.env.NODE_ENV,
      isRender: process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL,
      renderUrl: process.env.RENDER_EXTERNAL_URL,
      hostname: req.hostname,
      ip: req.ip,
      path: req.path,
      originalUrl: req.originalUrl
    },
    headers: req.headers,
    database: {
      connectionAvailable: !!process.env.DATABASE_URL,
      pool: {
        totalCount: pool.totalCount,
        idleCount: pool.idleCount,
        waitingCount: pool.waitingCount
      }
    },
    auth: {
      sessionSecret: process.env.SESSION_SECRET ? 'vorhanden' : 'fehlt',
      isAuthenticated: req.isAuthenticated(),
      sessionId: req.session?.id || 'keine Session',
      user: req.user ? {
        id: req.user.id,
        username: req.user.username
      } : null
    }
  });
});

// Login
app.post('/api/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      console.error('Login-Fehler:', err);
      return res.status(500).json({ error: 'Server-Fehler beim Login' });
    }
    
    if (!user) {
      console.log('Login fehlgeschlagen:', info?.message || 'Ungültige Anmeldedaten');
      return res.status(401).json({ error: info?.message || 'Ungültige Anmeldedaten' });
    }
    
    req.login(user, (err) => {
      if (err) {
        console.error('Session-Fehler:', err);
        return res.status(500).json({ error: 'Fehler beim Erstellen der Session' });
      }
      
      console.log('Login erfolgreich für:', user.username);
      return res.json({
        id: user.id,
        username: user.username
      });
    });
  })(req, res, next);
});

// Logout
app.post('/api/logout', (req, res) => {
  const username = req.user?.username;
  
  req.logout((err) => {
    if (err) {
      console.error('Logout-Fehler:', err);
      return res.status(500).json({ error: 'Fehler beim Logout' });
    }
    
    console.log('Logout erfolgreich für:', username || 'unbekannter Benutzer');
    res.json({ success: true });
  });
});

// Benutzerinfo
app.get('/api/user', (req, res) => {
  if (!req.isAuthenticated()) {
    return res.status(401).send('Unauthorized');
  }
  
  res.json({
    id: req.user.id,
    username: req.user.username
  });
});

// Render-Auth Notfallseite
app.get('/', (req, res) => {
  if (req.isAuthenticated()) {
    // Wenn bereits eingeloggt, zeige eine einfache Dashboard-Seite
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LvlUp Trading Journal - Dashboard</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #121212 0%, #1e1e30 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            max-width: 800px;
            width: 100%;
            padding: 2rem;
            background: rgba(30, 30, 48, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          }
          h1 { color: #4f9eff; }
          h2 { color: #3d8aff; }
          .btn {
            background: #4f9eff;
            color: black;
            border: none;
            padding: 10px 20px;
            border-radius: 5px;
            font-weight: bold;
            cursor: pointer;
            margin-top: 20px;
          }
          .user-info {
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 0.5rem;
            margin-bottom: 1.5rem;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>LvlUp Trading Journal</h1>
          
          <div class="user-info">
            <h2>Angemeldet als: ${req.user.username}</h2>
            <p>Benutzer-ID: ${req.user.id}</p>
          </div>
          
          <p>Dies ist eine vereinfachte Standalone-Version für Render-Deployments.</p>
          <p>Da es Probleme mit dem vollen React-Frontend gibt, bietet diese Version grundlegende Funktionalität zur Diagnose.</p>
          
          <button id="logoutBtn" class="btn">Abmelden</button>
        </div>

        <script>
          document.getElementById('logoutBtn').addEventListener('click', async () => {
            try {
              const response = await fetch('/api/logout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include'
              });
              
              if (response.ok) {
                alert('Erfolgreich abgemeldet');
                window.location.reload();
              } else {
                alert('Fehler beim Abmelden');
              }
            } catch (error) {
              alert('Fehler: ' + error.message);
            }
          });
        </script>
      </body>
      </html>
    `;
    
    res.send(htmlContent);
  } else {
    // Wenn nicht eingeloggt, zeige die Login-Seite
    const htmlContent = `
      <!DOCTYPE html>
      <html lang="de">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>LvlUp Trading Journal - Login</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            background: linear-gradient(135deg, #121212 0%, #1e1e30 100%);
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
          }
          .container {
            max-width: 500px;
            width: 100%;
            padding: 2rem;
            background: rgba(30, 30, 48, 0.7);
            backdrop-filter: blur(10px);
            border-radius: 1rem;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
          }
          h1 {
            color: #4f9eff;
            margin-bottom: 1rem;
          }
          .form {
            margin-top: 2rem;
          }
          .form-group {
            margin-bottom: 1.5rem;
          }
          label {
            display: block;
            margin-bottom: 0.5rem;
            color: #4f9eff;
          }
          input {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.5rem;
            border: 1px solid rgba(79, 158, 255, 0.3);
            background: rgba(0, 0, 0, 0.2);
            color: white;
          }
          button {
            width: 100%;
            padding: 0.75rem;
            border-radius: 0.5rem;
            background: #4f9eff;
            color: #000;
            border: none;
            font-weight: bold;
            cursor: pointer;
            margin-top: 1rem;
          }
          .info {
            margin-top: 2rem;
            padding: 1rem;
            background: rgba(79, 158, 255, 0.1);
            border-radius: 0.5rem;
          }
          .credentials {
            margin-top: 1rem;
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 0.5rem;
          }
          .error-msg {
            color: #ff5555;
            margin-top: 1rem;
            padding: 0.5rem;
            background: rgba(255, 0, 0, 0.1);
            border-radius: 0.5rem;
            display: none;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1>LvlUp Trading Journal</h1>
          <p>Standalone Login für Render-Deployments</p>
          
          <div class="form">
            <div class="form-group">
              <label for="username">Benutzername</label>
              <input type="text" id="username" placeholder="Benutzername eingeben" />
            </div>
            <div class="form-group">
              <label for="password">Passwort</label>
              <input type="password" id="password" placeholder="Passwort eingeben" />
            </div>
            <div id="errorMsg" class="error-msg">Fehler beim Login</div>
            <button id="loginBtn">Anmelden</button>
          </div>
          
          <div class="info">
            <h3>Demo-Zugangsdaten</h3>
            <div class="credentials">
              <p><strong>Admin:</strong><br>Benutzer: admin<br>Passwort: admin123</p>
            </div>
            <div class="credentials">
              <p><strong>Benutzer:</strong><br>Benutzer: mo<br>Passwort: mo123</p>
            </div>
          </div>
        </div>

        <script>
          document.getElementById('loginBtn').addEventListener('click', async function() {
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            const errorMsg = document.getElementById('errorMsg');
            
            if (!username || !password) {
              errorMsg.textContent = 'Bitte gib Benutzername und Passwort ein';
              errorMsg.style.display = 'block';
              return;
            }
            
            try {
              // Status-Anzeige
              this.textContent = 'Wird angemeldet...';
              this.disabled = true;
              errorMsg.style.display = 'none';
              
              // API-Anfrage zum Login
              const response = await fetch('/api/login', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({ username, password }),
                credentials: 'include'
              });
              
              if (response.ok) {
                const data = await response.json();
                alert('Anmeldung erfolgreich! Willkommen, ' + data.username);
                // Seite neu laden, um Dashboard zu zeigen
                window.location.reload();
              } else {
                const data = await response.json();
                errorMsg.textContent = data.error || 'Ungültige Anmeldedaten';
                errorMsg.style.display = 'block';
                this.textContent = 'Anmelden';
                this.disabled = false;
              }
            } catch (error) {
              errorMsg.textContent = 'Ein Fehler ist aufgetreten: ' + error.message;
              errorMsg.style.display = 'block';
              this.textContent = 'Anmelden';
              this.disabled = false;
            }
          });
        </script>
      </body>
      </html>
    `;
    
    res.send(htmlContent);
  }
});

// Catch-all Route für alle anderen Anfragen
// Leitet zur Hauptseite weiter
app.get('*', (req, res) => {
  res.redirect('/');
});

// Server starten
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Standalone Express-Server gestartet auf Port ${PORT}`);
  console.log('Umgebung:', process.env.NODE_ENV || 'development');
  console.log('Render-Umgebung:', process.env.RENDER === 'true' || !!process.env.RENDER_EXTERNAL_URL);
});