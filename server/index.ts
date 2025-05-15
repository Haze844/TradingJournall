import express from "express";
import path from "path";
import cookieParser from "cookie-parser";
import cors from "cors";
import { setupUnifiedSession } from "./session-fix";
import { setupAuth } from "./auth";
import { registerRoutes } from "./routes";

const app = express();

// Middleware-Reihenfolge wichtig
app.use(cookieParser());
setupUnifiedSession(app);
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

setupAuth(app);
registerRoutes(app); // ggf. await verwenden, falls async

// Statische Dateien ausliefern
app.use(express.static(path.join(process.cwd(), "public")));

// SPA-Fallback für alle anderen Routen
app.get("*", (req, res) => {
  res.sendFile(path.join(process.cwd(), "public", "index.html"));
});

app.listen(5000, () => console.log("Server läuft auf Port 5000"));
