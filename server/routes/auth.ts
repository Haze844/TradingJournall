import { Router, Request, Response, NextFunction } from 'express';
import passport from 'passport';

const router = Router();

// POST /login – Authentifizierung via Passport
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Login fehlgeschlagen' });
    }

    req.logIn(user, (err) => {
      if (err) return next(err);

      // Optional: Session speichern erzwingen
      req.session.save(() => {
        res.status(200).json({
          message: 'Login erfolgreich',
          user: { id: user.id, username: user.username },
          redirectTo: '/simplehome',
        });
      });
    });
  })(req, res, next);
});

// POST /logout – Session beenden
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);

    req.session.destroy(() => {
      res.clearCookie('trading.sid');
      res.status(200).json({ message: 'Logout erfolgreich' });
    });
  });
});

// GET /me – Aktuelle Session prüfen
router.get('/me', (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Nicht eingeloggt' });
  }
});

export default router;