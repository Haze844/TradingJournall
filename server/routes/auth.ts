// server/routes/auth.ts

import { Router, Request, Response } from 'express';

const router = Router();

// Demo-Nutzerliste (normalerweise aus einer Datenbank)
const users = [
  { username: 'admin', password: 'admin123' },
  { username: 'mo', password: 'mo123' }
];

// Login-Route
router.post('/login', (req: Request, res: Response) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Benutzername und Passwort erforderlich' });
  }

  const user = users.find(
    (u) => u.username === username && u.password === password
  );

  if (!user) {
    return res.status(401).json({ error: 'Ungültige Anmeldedaten' });
  }

  // Benutzer in der Session speichern
  req.session.user = { username: user.username };
  res.status(200).json({ message: 'Login erfolgreich', username: user.username });
});

// Logout-Route
router.post('/logout', (req: Request, res: Response) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Fehler beim Logout:', err);
      return res.status(500).json({ error: 'Logout fehlgeschlagen' });
    }
    res.clearCookie('trading.sid');
    res.status(200).json({ message: 'Logout erfolgreich' });
  });
});

// Session-Prüfung
router.get('/me', (req: Request, res: Response) => {
  if (req.session.user) {
    res.status(200).json({ user: req.session.user });
  } else {
    res.status(401).json({ error: 'Nicht eingeloggt' });
  }
});

export default router;