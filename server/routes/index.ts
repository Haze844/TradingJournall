import type { Express } from "express";
import { createServer, type Server } from "http";
import authRoutes from './auth';

export function registerRoutes(app: Express): Promise<Server> {
  // Auth-Routen hinzufügen
  app.use('/api', authRoutes);
  
  // HTTP-Server erstellen
  const httpServer = createServer(app);
  
  return Promise.resolve(httpServer);
}