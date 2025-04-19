import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertUserSchema } from "@shared/schema";
import OpenAI from "openai";
import { setupAuth } from "./auth";

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Middleware to check if user is authenticated
  function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Nicht authentifiziert" });
  }
  // Create OpenAI client
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY || "", // This will get real API key from environment
  });

  // Helper for generating GPT feedback on trades
  async function generateTradeFeedback(tradeData: any): Promise<string> {
    try {
      // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are an expert trading coach analyzing trading decisions. Provide concise feedback (max 200 characters) on the trade based on the provided data. Focus on setup quality, trend alignment, entry timing, and risk management."
          },
          {
            role: "user",
            content: `Trade information:
              Symbol: ${tradeData.symbol}
              Setup: ${tradeData.setup}
              Main Trend M15: ${tradeData.mainTrendM15}
              Internal Trend M5: ${tradeData.internalTrendM5}
              Entry Type: ${tradeData.entryType}
              Entry Level: ${tradeData.entryLevel}
              Liquidation: ${tradeData.liquidation}
              Location: ${tradeData.location}
              Risk/Reward Achieved: ${tradeData.rrAchieved}
              Risk/Reward Potential: ${tradeData.rrPotential}
              Result: ${tradeData.isWin ? 'Win' : 'Loss'}
            `
          }
        ],
        max_tokens: 200,
      });

      return response.choices[0].message.content || "No feedback available";
    } catch (error) {
      console.error("Error generating trade feedback:", error);
      return "Unable to generate feedback at this time.";
    }
  }

  // User authentication is handled by setupAuth in auth.ts

  // Trades routes - all protected by authentication
  app.get("/api/trades", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Extract filter parameters
      const filters: Record<string, any> = {};
      const filterParams = ['symbol', 'setup', 'mainTrendM15', 'internalTrendM5', 'entryType'];
      
      for (const param of filterParams) {
        if (req.query[param]) {
          filters[param] = req.query[param];
        }
      }
      
      const trades = await storage.getTrades(userId, filters);
      res.status(200).json(trades);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.get("/api/trades/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tradeId = Number(req.params.id);
      
      if (!tradeId) {
        return res.status(400).json({ message: "Trade ID is required" });
      }
      
      const trade = await storage.getTradeById(tradeId);
      
      if (!trade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      res.status(200).json(trade);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  app.post("/api/trades", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tradeData = insertTradeSchema.parse(req.body);
      const userId = Number(req.body.userId);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // Generate GPT feedback
      const gptFeedback = await generateTradeFeedback({
        ...tradeData,
        userId,
      });
      
      const newTrade = await storage.createTrade({
        ...tradeData,
        userId,
        gptFeedback,
      });
      
      res.status(201).json(newTrade);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.put("/api/trades/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tradeId = Number(req.params.id);
      
      if (!tradeId) {
        return res.status(400).json({ message: "Trade ID is required" });
      }
      
      const tradeUpdate = req.body;
      const updatedTrade = await storage.updateTrade(tradeId, tradeUpdate);
      
      if (!updatedTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      res.status(200).json(updatedTrade);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });

  app.delete("/api/trades/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tradeId = Number(req.params.id);
      
      if (!tradeId) {
        return res.status(400).json({ message: "Trade ID is required" });
      }
      
      const success = await storage.deleteTrade(tradeId);
      
      if (!success) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Weekly summary route
  app.get("/api/weekly-summary", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      const weekStartStr = req.query.weekStart as string;
      const weekEndStr = req.query.weekEnd as string;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      if (!weekStartStr || !weekEndStr) {
        return res.status(400).json({ message: "Week start and end dates are required" });
      }
      
      const weekStart = new Date(weekStartStr);
      const weekEnd = new Date(weekEndStr);
      
      let summary = await storage.getWeeklySummary(userId, weekStart, weekEnd);
      
      if (!summary) {
        // Calculate and create if it doesn't exist
        summary = await storage.calculateWeeklySummary(userId, weekStart, weekEnd);
      }
      
      res.status(200).json(summary);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Performance data route
  app.get("/api/performance-data", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      const startDateStr = req.query.startDate as string;
      const endDateStr = req.query.endDate as string;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const startDate = startDateStr ? new Date(startDateStr) : undefined;
      const endDate = endDateStr ? new Date(endDateStr) : undefined;
      
      const performanceData = await storage.getPerformanceData(userId, startDate, endDate);
      res.status(200).json(performanceData);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Setup win rates route
  app.get("/api/setup-win-rates", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = Number(req.query.userId);
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      const setupWinRates = await storage.getSetupWinRates(userId);
      res.status(200).json(setupWinRates);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  // Tradovate import route (placeholder for now, would need real Tradovate API integration)
  app.post("/api/import-trades", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }
      
      // This would be replaced with actual Tradovate API integration
      res.status(200).json({ message: "Trade import initiated" });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
