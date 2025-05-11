// drizzle.config.ts

import { defineConfig } from "drizzle-kit";

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL ist nicht gesetzt. Bitte .env prüfen.");
}

export default defineConfig({
  schema: "./shared/dbSchema.ts",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL,
  },
});
