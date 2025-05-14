import { Express, Request, Response, NextFunction, Router } from 'express';
import passport from 'passport';

const router = Router();

// Typdefinitionen
interface PassportUser {
  id: string;
  username: string;
  password: string;
  [key: string]: any;
}

interface PassportInfo {
  message?: string;
  [key: string]: any;
}

// POST /login
router.post('/login', (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('local', (err: any, user: PassportUser | false, info?: PassportInfo) => {
    if (err) return next(err);
    if (!user) {
      return res.status(401).json({ error: info?.message || 'Login fehlgeschlagen' });
    }

    req.logIn(user, (err: any) => {
      if (err) return next(err);
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

// POST /logout
router.post('/logout', (req: Request, res: Response, next: NextFunction) => {
  req.logout((err: any) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie('tj_sid'); // ✅ Nur relevanter Cookie wird gelöscht
      res.status(200).json({ message: 'Logout erfolgreich' });
    });
  });
});

// GET /me
router.get('/me', (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ error: 'Nicht eingeloggt' });
  }
});

// GET /csrf
router.get('/csrf', (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
});

// ✅ Neuer benannter Export
export function registerRoutes(app: Express) {
  app.use("/api", router);
}
