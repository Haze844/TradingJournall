import { Router, Request, Response, NextFunction } from "express";
import passport from "passport";

const router = Router();

router.post("/login", (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate("local", (err, user, info) => {
    if (err) return next(err);
    if (!user) return res.status(401).json({ error: info?.message || "Login fehlgeschlagen" });

    req.logIn(user, (err) => {
      if (err) return next(err);
      req.session.save(() => {
        res.status(200).json({
          message: "Login erfolgreich",
          user: { id: user.id, username: user.username },
          redirectTo: "/simplehome",
        });
      });
    });
  })(req, res, next);
});

router.post("/logout", (req: Request, res: Response, next: NextFunction) => {
  req.logout((err) => {
    if (err) return next(err);
    req.session.destroy(() => {
      res.clearCookie("tj_sid");
      res.status(200).json({ message: "Logout erfolgreich" });
    });
  });
});

router.get("/me", (req: Request, res: Response) => {
  if (req.isAuthenticated()) {
    res.status(200).json({ user: req.user });
  } else {
    res.status(401).json({ error: "Nicht eingeloggt" });
  }
});

router.get("/csrf", (req: Request, res: Response) => {
  res.json({ csrfToken: req.csrfToken() });
});

export default router;
