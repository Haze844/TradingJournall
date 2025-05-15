import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { setupUnifiedSession } from "./session-fix";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";

// 🔧 Wichtig: Pfad zur gebauten Vite-Client-App
const clientPath = path.join(process.cwd(), "dist/public");

const app = express();

// 🍪 Cookie Parser zuerst
app.use(cookieParser());

// 🔐 Session & Auth vorbereiten
setupUnifiedSession(app);
setupAuth(app);

// 🌍 CORS
app.use(cors({ origin: true, credentials: true }));

// 📦 JSON & Formulardaten parsen
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// 🔀 Routen registrieren
registerRoutes(app);

// 🌐 Root-Redirect z. B. auf Login-Seite
app.get("/", (_req, res) => res.redirect("/auth"));

// 🖼️ Statische Dateien aus dem Client-Build
app.use(express.static(clientPath));

// 🧭 SPA-Fallback für React Router (z. B. /simplehome)
app.get("*", (req, res) => {
  res.sendFile(path.join(clientPath, "index.html"));
});

// 🚀 Server starten
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server läuft auf Port ${PORT}`);
});
