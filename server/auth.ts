import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import { logger } from "./logger";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  logger.info("🔐 Auth-System wird eingerichtet");

  passport.serializeUser((user: Express.User, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.user.findUnique({ where: { id } });
      done(null, user || false);
    } catch (err) {
      done(err);
    }
  });

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.user.findFirst({ where: { username } });
        if (!user) return done(null, false, { message: "Falsche Anmeldedaten." });

        const valid = await comparePasswords(password, user.password);
        if (!valid) return done(null, false, { message: "Falsche Anmeldedaten." });

        return done(null, user);
      } catch (err) {
        return done(err);
      }
    })
  );

  app.use(passport.initialize());
  app.use(passport.session());

  logger.info("✅ Auth-System erfolgreich eingerichtet");
}

export { hashPassword, comparePasswords };
