import { Express } from "express";
import authRoutes from "./routes/auth";

/**
 * Registriert alle Anwendungsrouten.
 */
export async function registerRoutes(app: Express) {
  // Beispiel: Authentifizierungsrouten
  app.use("/auth", authRoutes);

  // Weitere Routen kannst du hier hinzufügen, z. B.:
  // app.use("/api", apiRoutes);
}
