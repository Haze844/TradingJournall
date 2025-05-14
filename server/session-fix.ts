import session from "express-session";
import { Express } from "express";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import passport from "passport";
import csrf from "csurf";

const COOKIE_NAME = "tj_sid";
const SESSION_SECRET = process.env.SESSION_SECRET || "local-dev-secret";
const SESSION_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

export function setupUnifiedSession(app: Express) {
  const isProduction = process.env.NODE_ENV === "production";
  const isRender = !!process.env.RENDER || !!process.env.RENDER_EXTERNAL_URL;

  const PostgresStore = connectPg(session);
  const store = new PostgresStore({
    pool,
    tableName: "sessions",
    createTableIfMissing: true,
  });

  const cookieSettings: session.CookieOptions = {
    maxAge: SESSION_MAX_AGE,
    httpOnly: true,
    path: "/",
    sameSite: isRender || isProduction ? "none" : "lax",
    secure: isRender || isProduction,
  };

  if (isRender) {
    const renderUrl = process.env.RENDER_EXTERNAL_URL;
    if (renderUrl) {
      const domain = new URL(renderUrl).hostname;
      if (!domain.includes("localhost")) {
        cookieSettings.domain = domain;
      }
    }
  }

  app.set("trust proxy", 1);

  app.use(
    session({
      name: COOKIE_NAME,
      secret: SESSION_SECRET,
      resave: false,
      saveUninitialized: false,
      store,
      cookie: cookieSettings,
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  app.use(csrf());
  app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
  });
}
