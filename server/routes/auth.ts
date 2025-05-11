import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = Router();

// Typdefinitionen für Passport-Parameter
interface PassportUser {
  id: string | number;
  username: string;
  [key: string]: any;
}

interface AuthInfo {
  message?: string;
  [key: string]: any;
}

// Login-Route mit Passport
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err: Error | null, user: PassportUser | false, info?: AuthInfo) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || 'Login fehlgeschlagen' });

    req.logIn(user, (err) => {
      if (err) return next(err);
      return res.status(200).json({
        message: 'Login erfolgreich',
        user: { id: user.id, username: user.username },
        redirectTo: '/simplehome' // <-- Frontend kann hierhin navigieren
      });
    });
  })(req, res, next);
});

// Logout-Route
router.post('/logout', (req: Request, res: Response) => {
  req.logout(() => {
    req.session.destroy(() => {
      res.clearCookie('trading.sid');
      res.status(200).json({ message: 'Logout erfolgreich' });
    });
  });
});

// Wer bin ich? (Session-Check)
router.get('/me', (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Nicht eingeloggt' });
  }
});

export default router;