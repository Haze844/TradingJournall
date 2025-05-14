import { Express } from "express";
import authRoutes from "./routes/auth"; // ← dein geposteter Code ist in dieser Datei

/**
 * Registriert alle Anwendungsrouten (z. B. Authentifizierung).
 */
export function registerRoutes(app: Express) {
  // Authentifizierungs-Endpunkte unter /auth
  app.use("/auth", authRoutes);

  // Weitere Routen (z. B. /api/user, /protected) kannst du hier einfügen
}
