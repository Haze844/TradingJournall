import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertTradeSchema, insertUserSchema } from "@shared/schema";
import OpenAI from "openai";
import { setupAuth } from "./auth";
import path from "path";
import fs from "fs";
import puppeteer from "puppeteer";
import { Readable } from "stream";

// Helper function to handle error messages safely
function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'Unknown error';
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication routes
  setupAuth(app);
  
  // Generate and return PDF Manual
  app.get("/generate-pdf", async (req: Request, res: Response) => {
    try {
      const browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();
      
      // Get the full URL of the booklet page
      const protocol = req.protocol;
      const host = req.get('host');
      const bookletUrl = `${protocol}://${host}/booklet`;
      
      await page.goto(bookletUrl, { 
        waitUntil: 'networkidle0',
        timeout: 60000
      });
      
      // Add print-specific styles
      await page.addStyleTag({
        content: `
          @page { 
            margin: 1cm; 
            size: A4; 
          }
          body { 
            background: white; 
            color: black; 
          }
          .rocket-card {
            background: white !important;
            color: black !important;
            border: 1px solid #ddd;
            box-shadow: none !important;
            break-inside: avoid;
            page-break-inside: avoid;
            margin-bottom: 15px;
          }
          header, nav, button, .nonprintable {
            display: none !important;
          }
        `
      });
      
      // Generate PDF
      const pdfBuffer = await page.pdf({
        format: 'A4',
        printBackground: true,
        margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
      });
      
      await browser.close();
      
      // Set response headers
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=lvlup-trading-handbuch.pdf');
      
      // Create a readable stream from the PDF buffer and pipe it to the response
      const stream = new Readable();
      stream.push(pdfBuffer);
      stream.push(null);
      stream.pipe(res);
    } catch (error) {
      console.error('Error generating PDF:', error);
      res.status(500).send('Fehler bei der PDF-Generierung');
    }
  });
  
  // Static PDF Route - Serves directly from public
  app.get("/lvlup-trading-handbuch.pdf", (req: Request, res: Response) => {
    // Generate PDF on-demand and save to public folder, then serve
    (async () => {
      try {
        console.log("Generating PDF for direct download...");
        const browser = await puppeteer.launch({
          headless: true,
          args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        
        // Set viewport to A4 size
        await page.setViewport({
          width: 1240,
          height: 1754,
          deviceScaleFactor: 1.5
        });
        
        // Get the full URL of the booklet page - use request host
        const protocol = req.protocol;
        const host = req.get('host');
        const bookletUrl = `${protocol}://${host}/booklet`;
        
        await page.goto(bookletUrl, { 
          waitUntil: 'networkidle0',
          timeout: 60000
        });
        
        // Add print-specific styles
        await page.addStyleTag({
          content: `
            @page { 
              margin: 1cm; 
              size: A4; 
            }
            body { 
              background: white; 
              font-family: Arial, sans-serif;
              color: black; 
            }
            .rocket-card {
              background: white !important;
              color: black !important;
              border: 1px solid #ddd;
              box-shadow: none !important;
              break-inside: avoid;
              page-break-inside: avoid;
              margin-bottom: 15px;
            }
            header, nav, button, footer, .nonprintable {
              display: none !important;
            }
            h1, h2, h3 {
              color: black;
              page-break-after: avoid;
            }
            img {
              max-width: 100%;
              height: auto;
              page-break-inside: avoid;
            }
            table {
              border-collapse: collapse;
              width: 100%;
              page-break-inside: avoid;
            }
            table, th, td {
              border: 1px solid #ddd;
              padding: 8px;
            }
            pre {
              background-color: #f5f5f5;
              padding: 10px;
              border-radius: 4px;
              overflow-x: auto;
              page-break-inside: avoid;
            }
          `
        });
        
        // Generate PDF
        const pdfBuffer = await page.pdf({
          format: 'A4',
          printBackground: true,
          margin: { top: '1cm', right: '1cm', bottom: '1cm', left: '1cm' }
        });
        
        await browser.close();
        
        // Write to public folder
        const pdfPath = path.join(process.cwd(), 'public', 'lvlup-trading-handbuch.pdf');
        fs.writeFileSync(pdfPath, pdfBuffer);
        console.log("PDF generated and saved to public folder");
        
        // Send the file
        res.sendFile(pdfPath);
        
      } catch (error) {
        console.error('Error generating PDF:', error);
        // Fall back to existing file if available
        const pdfPath = path.join(process.cwd(), 'public', 'lvlup-trading-handbuch.pdf');
        if (fs.existsSync(pdfPath)) {
          res.sendFile(pdfPath);
        } else {
          res.status(500).send('Fehler bei der PDF-Generierung');
        }
      }
    })();
  });
  
  // Middleware to check if user is authenticated
  function isAuthenticated(req: Request, res: Response, next: NextFunction) {
    console.log("isAuthenticated-Check - Session:", req.session?.id, "Auth-Status:", req.isAuthenticated(), "Path:", req.path);
    
    if (req.isAuthenticated()) {
      return next();
    }
    
    // Demo-Mode: Für Entwicklung - nicht in Produktion verwenden
    // Hardcoded User ID verwenden (Mo = 2)
    const defaultUserId = 2;
    
    // GET-Anfragen behandeln
    if (req.method === "GET") {
      req.query.userId = String(defaultUserId);
      console.log("GET Anfrage akzeptiert für nicht-authentifizierten Benutzer mit userId:", defaultUserId);
      return next();
    }
    
    // POST-Anfragen behandeln
    if (req.method === "POST") {
      if (req.body) {
        if (Array.isArray(req.body)) {
          // Array von Objekten (z.B. beim Bulk-Import)
          req.body.forEach((item) => {
            item.userId = defaultUserId;
          });
        } else {
          // Einzelnes Objekt
          req.body.userId = defaultUserId;
        }
        console.log("POST Anfrage akzeptiert für nicht-authentifizierten Benutzer mit userId:", defaultUserId);
        return next();
      }
    }
    
    // PUT-Anfragen behandeln (besonders wichtig für Trade-Aktualisierungen)
    if (req.method === "PUT") {
      if (req.body) {
        req.body.userId = defaultUserId;
        console.log("PUT Anfrage akzeptiert für nicht-authentifizierten Benutzer mit userId:", defaultUserId);
        console.log("PUT Request Body:", req.body);
        return next();
      }
    }
    
    console.log("Zugriff verweigert - Path:", req.path);
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
      // Für authentifizierte Benutzer nehmen wir die ID aus req.user, ansonsten aus req.body (gesetzt durch isAuthenticated Middleware)
      const userId = req.user?.id || req.body.userId || 2; // Fallback auf Mo (2) für Entwicklung
      
      if (!tradeId) {
        return res.status(400).json({ message: "Trade ID is required" });
      }
      
      // Überprüfen, ob der Trade dem Benutzer gehört
      const existingTrade = await storage.getTradeById(tradeId);
      if (!existingTrade) {
        return res.status(404).json({ message: "Trade nicht gefunden" });
      }
      
      // Im Demo-Modus ignorieren wir die Besitzerprüfung
      if (!req.isAuthenticated() && existingTrade.userId !== userId) {
        console.log(`Demo-Modus: Trade ${tradeId} gehört Benutzer ${existingTrade.userId}, aber Anfrage kommt von ${userId}`);
      }
      
      const tradeUpdate = req.body;
      
      // Wenn nur das Chart-Bild aktualisiert wird, kein GPT-Feedback generieren
      if ('chartImage' in tradeUpdate) {
        console.log("PUT Request Body:", req.body);
        // Sicherstellen, dass nur der eigene Trade aktualisiert wird
        if ('userId' in req.body) {
          // Chart-Update mit Benutzer-ID
          const updatedTrade = await storage.updateTrade(tradeId, { 
            chartImage: tradeUpdate.chartImage,
            userId: req.body.userId 
          });
          
          if (!updatedTrade) {
            return res.status(404).json({ message: "Trade not found" });
          }
          
          return res.status(200).json(updatedTrade);
        } else {
          // Altes Verhalten beibehalten falls kein userId übergeben wurde
          const updatedTrade = await storage.updateTrade(tradeId, { chartImage: tradeUpdate.chartImage });
          
          if (!updatedTrade) {
            return res.status(404).json({ message: "Trade not found" });
          }
          
          return res.status(200).json(updatedTrade);
        }
      }
      
      // Normale Trade-Update-Logik
      const updatedTrade = await storage.updateTrade(tradeId, tradeUpdate);
      
      if (!updatedTrade) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      // Wenn relevante Handelsfelder aktualisiert wurden, generiere neues GPT-Feedback
      if (
        tradeUpdate.symbol || 
        tradeUpdate.setup || 
        tradeUpdate.mainTrendM15 || 
        tradeUpdate.internalTrendM5 || 
        tradeUpdate.entryType || 
        tradeUpdate.isWin
      ) {
        const gptFeedback = await generateTradeFeedback({
          ...updatedTrade
        });
        
        await storage.updateTrade(tradeId, { gptFeedback });
        updatedTrade.gptFeedback = gptFeedback;
      }
      
      res.status(200).json(updatedTrade);
    } catch (error) {
      res.status(400).json({ message: error instanceof Error ? error.message : "Fehler beim Aktualisieren" });
    }
  });

  app.delete("/api/trades/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const tradeId = Number(req.params.id);
      // Für authentifizierte Benutzer nehmen wir die ID aus req.user, ansonsten aus req.body oder Query
      const userId = req.user?.id || req.body?.userId || req.query?.userId || 2; // Fallback auf Mo (2) für Entwicklung
      
      if (!tradeId) {
        return res.status(400).json({ message: "Trade ID is required" });
      }
      
      // Im Demo-Modus: Überprüfen, ob der Trade existiert
      const existingTrade = await storage.getTradeById(tradeId);
      if (!existingTrade) {
        return res.status(404).json({ message: "Trade nicht gefunden" });
      }
      
      // Im Demo-Modus ignorieren wir die Besitzerprüfung
      if (!req.isAuthenticated() && existingTrade.userId !== Number(userId)) {
        console.log(`Demo-Modus: DELETE - Trade ${tradeId} gehört Benutzer ${existingTrade.userId}, aber Anfrage kommt von ${userId}`);
      }
      
      const success = await storage.deleteTrade(tradeId);
      
      if (!success) {
        return res.status(404).json({ message: "Trade not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Fehler beim Löschen";
      res.status(500).json({ message: errorMessage });
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

  // Die Tradovate API-Integration wurde entfernt

  // CSV Import route
  app.post("/api/import-csv", isAuthenticated, async (req: Request, res: Response) => {
    try {
      // Prüfe, ob es ein Array von Trades ist oder ein Objekt mit trades und userId
      let trades;
      let clientUserId;
      
      if (Array.isArray(req.body)) {
        // Format: [trade1, trade2, ...] mit optionaler userId in jedem Trade
        trades = req.body;
        clientUserId = trades[0]?.userId;
        console.log("CSV-Import: Array-Format erkannt mit", trades.length, "Trades");
      } else {
        // Format: { trades: [...], userId: ... }
        trades = req.body.trades || [];
        clientUserId = req.body.userId;
        console.log("CSV-Import: Objekt-Format erkannt mit", trades.length, "Trades");
      }
      
      // Bevorzuge die userId aus der Authentifizierung, prüfe aber auch auf explizit gesendete userId
      const userId = req.user?.id || clientUserId;
      
      console.log("CSV-Import: userId:", userId, "Auth status:", req.isAuthenticated(), "Client userId:", clientUserId);
      
      if (!userId) {
        return res.status(401).json({ message: "Bitte melden Sie sich an, um Trades zu importieren" });
      }
      
      if (!trades || !Array.isArray(trades) || trades.length === 0) {
        return res.status(400).json({ message: "Keine gültigen Trade-Daten gefunden" });
      }
      
      const importedTrades = [];
      
      for (const tradeData of trades) {
        try {
          // Prüfen, ob es ein Link-Import ist (nur chartImage-Feld vorhanden) 
          const isLinkImport = tradeData.chartImage && Object.keys(tradeData).length === 1;
          
          let gptFeedback = '';
          
          // Nur GPT-Feedback generieren, wenn es kein Link-Import ist
          if (!isLinkImport) {
            // Generate GPT feedback for each trade
            gptFeedback = await generateTradeFeedback({
              ...tradeData,
              userId,
            });
          }
          
          // Create trade in database with feedback
          const newTrade = await storage.createTrade({
            ...tradeData,
            userId,
            gptFeedback: isLinkImport ? '' : gptFeedback, // Kein Feedback für Link-Imports
            // Ensure date is set if not provided
            date: tradeData.date || new Date().toISOString(),
          });
          
          importedTrades.push(newTrade);
        } catch (error) {
          console.error("Error importing trade:", error);
          // Continue with next trade even if one fails
        }
      }
      
      // Update statistics after import
      try {
        // Recalculate setup win rates
        await storage.calculateSetupWinRates(userId);
        
        // Recalculate weekly summaries if needed
        // This would likely need to be more granular in a production app
      } catch (error) {
        console.error("Error updating statistics:", error);
      }
      
      res.status(200).json({ 
        message: `${importedTrades.length} Trades erfolgreich importiert`, 
        count: importedTrades.length 
      });
    } catch (error) {
      console.error("CSV import error:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Marktphasen-Analyse-Endpunkte
  
  // Hilfsfunktionen für Marktphasen-Analyse
  
  function determineMarketPhase(trade: any): 'trend' | 'range' | 'volatile' {
    // Die Marktphase könnte direkt im Trade gespeichert sein
    if (trade.marketPhase) {
      return trade.marketPhase as 'trend' | 'range' | 'volatile';
    }
    
    // Wenn keine explizite Marktphase vorhanden ist, versuchen wir sie aus anderen Daten abzuleiten
    // Beispiel: Bestimmung basierend auf dem Setup oder Trend
    
    // Wenn es sich um ein trendbasiertes Setup handelt
    if (trade.setup === 'OZEM' || trade.internalTrendM5 === 'Long' || trade.internalTrendM5 === 'Short') {
      return 'trend';
    }
    
    // Wenn es sich um ein Range-basiertes Setup handelt
    if (trade.setup === 'BB') {
      return 'range';
    }
    
    // Wenn die Marktbedingungen volatil waren (z.B. basierend auf Nachrichtenereignissen)
    if (trade.setup === 'BZEM') {
      return 'volatile';
    }
    
    // Standardmäßig als Trend klassifizieren
    return 'trend';
  }
  
  function calculateMarketPhaseDistribution(trades: any[]) {
    // Wenn keine Trades vorhanden sind, leeres Array zurückgeben
    if (!trades || trades.length === 0) {
      return [];
    }
    
    // Zähle die Anzahl der Trades pro Marktphase
    const phaseCounts: Record<string, number> = {
      trend: 0,
      range: 0,
      volatile: 0
    };
    
    for (const trade of trades) {
      const phase = determineMarketPhase(trade);
      phaseCounts[phase]++;
    }
    
    // Farben für die verschiedenen Marktphasen
    const phaseColors: Record<string, string> = {
      trend: '#4F46E5',   // Indigo
      range: '#10B981',   // Grün
      volatile: '#F59E0B', // Gelb
    };
    
    // Berechne die prozentuale Verteilung
    const totalTrades = trades.length;
    
    return Object.entries(phaseCounts).map(([phase, count]) => ({
      phase,
      count,
      percentage: Math.round((count / totalTrades) * 100),
      color: phaseColors[phase]
    }));
  }
  
  function calculateMarketPhasePerformance(trades: any[]) {
    // Wenn keine Trades vorhanden sind, leeres Array zurückgeben
    if (!trades || trades.length === 0) {
      return [];
    }
    
    // Gruppiere Trades nach Marktphase
    const phaseGroups: Record<string, any[]> = {
      trend: [],
      range: [],
      volatile: []
    };
    
    for (const trade of trades) {
      const phase = determineMarketPhase(trade);
      phaseGroups[phase].push(trade);
    }
    
    // Farben für die verschiedenen Marktphasen
    const phaseColors: Record<string, string> = {
      trend: '#4F46E5',   // Indigo
      range: '#10B981',   // Grün
      volatile: '#F59E0B', // Gelb
    };
    
    // Berechne Performance-Metriken für jede Phase
    return Object.entries(phaseGroups).map(([phase, phaseTradeList]) => {
      // Wenn keine Trades in dieser Phase, setze Default-Werte
      if (phaseTradeList.length === 0) {
        return {
          phase,
          winRate: 0,
          avgRR: 0,
          totalTrades: 0,
          color: phaseColors[phase]
        };
      }
      
      // Berechne Win-Rate
      const wins = phaseTradeList.filter(t => t.isWin).length;
      const winRate = Math.round((wins / phaseTradeList.length) * 100);
      
      // Berechne durchschnittliches RR
      const totalRR = phaseTradeList.reduce((sum, trade) => sum + (trade.profitLossRR || 0), 0);
      const avgRR = totalRR / phaseTradeList.length;
      
      return {
        phase,
        winRate,
        avgRR,
        totalTrades: phaseTradeList.length,
        color: phaseColors[phase]
      };
    });
  }
  
  function calculateSetupPerformanceByMarketPhase(trades: any[]) {
    // Wenn keine Trades vorhanden sind, leeres Array zurückgeben
    if (!trades || trades.length === 0) {
      return [];
    }
    
    // Finde alle einzigartigen Setups
    const setupSet = new Set<string>();
    for (const trade of trades) {
      if (trade.setup) {
        setupSet.add(trade.setup);
      }
    }
    
    const setups = Array.from(setupSet);
    
    // Berechne Win-Rate pro Setup und Marktphase
    const setupPerformance = [];
    
    for (const setup of setups) {
      // Filtere Trades für dieses Setup
      const setupTrades = trades.filter(t => t.setup === setup);
      
      // Berechne Win-Rate pro Marktphase für dieses Setup
      const phaseWinRates: Record<string, number> = {
        trend: 0,
        range: 0,
        volatile: 0
      };
      
      for (const phase of Object.keys(phaseWinRates)) {
        const phaseTradeList = setupTrades.filter(t => determineMarketPhase(t) === phase);
        
        if (phaseTradeList.length > 0) {
          const wins = phaseTradeList.filter(t => t.isWin).length;
          phaseWinRates[phase] = Math.round((wins / phaseTradeList.length) * 100);
        }
      }
      
      setupPerformance.push({
        setup,
        trend: phaseWinRates.trend,
        range: phaseWinRates.range,
        volatile: phaseWinRates.volatile
      });
    }
    
    return setupPerformance;
  }
  
  function generateMarketPhaseRecommendations(trades: any[]) {
    // Wenn keine oder zu wenige Trades vorhanden sind, leeres Array zurückgeben
    if (!trades || trades.length < 5) {
      return [];
    }
    
    const recommendations = [];
    
    // Berechne Performance pro Marktphase
    const phasePerformance = calculateMarketPhasePerformance(trades);
    
    // Finde beste und schlechteste Phase
    const bestPhase = phasePerformance.reduce((best, current) => 
      (current.winRate > best.winRate) ? current : best, phasePerformance[0]);
    
    const worstPhase = phasePerformance.reduce((worst, current) => 
      (current.winRate < worst.winRate && current.totalTrades > 0) ? current : worst, phasePerformance[0]);
    
    // Berechne Setup-Performance pro Marktphase
    const setupPerformance = calculateSetupPerformanceByMarketPhase(trades);
    
    // 1. Empfehlung für die beste Phase
    if (bestPhase.totalTrades > 0) {
      // Finde das beste Setup für diese Phase
      const bestSetupForPhase = setupPerformance.reduce((best, current) => 
        (current[bestPhase.phase as keyof typeof current] as number > (best[bestPhase.phase as keyof typeof best] as number)) ? current : best, 
        setupPerformance[0]
      );
      
      recommendations.push({
        id: `rec-best-phase-${bestPhase.phase}`,
        phase: bestPhase.phase as 'trend' | 'range' | 'volatile',
        recommendation: `Fokussiere dich auf ${bestPhase.phase}-Phasen`,
        explanation: `Deine beste Performance erzielst du in ${bestPhase.phase}-Phasen mit einer Win-Rate von ${bestPhase.winRate}% und einem durchschnittlichen RR von ${bestPhase.avgRR.toFixed(2)}. Besonders effektiv ist das Setup "${bestSetupForPhase.setup}" in dieser Phase.`
      });
    }
    
    // 2. Empfehlung für die schwächste Phase
    if (worstPhase.totalTrades > 0 && worstPhase.phase !== bestPhase.phase) {
      recommendations.push({
        id: `rec-worst-phase-${worstPhase.phase}`,
        phase: worstPhase.phase as 'trend' | 'range' | 'volatile',
        recommendation: `Vermeide Trading in ${worstPhase.phase}-Phasen`,
        explanation: `Deine Performance in ${worstPhase.phase}-Phasen ist mit einer Win-Rate von ${worstPhase.winRate}% und einem durchschnittlichen RR von ${worstPhase.avgRR.toFixed(2)} unterdurchschnittlich. Erwäge, diese Phasen zu vermeiden oder deine Strategie anzupassen.`
      });
    }
    
    // 3. Setup-spezifische Empfehlungen
    for (const setup of setupPerformance) {
      // Finde die beste Phase für dieses Setup
      const phaseEntries = [
        { phase: 'trend', winRate: setup.trend },
        { phase: 'range', winRate: setup.range },
        { phase: 'volatile', winRate: setup.volatile }
      ];
      
      const bestPhaseForSetup = phaseEntries.reduce((best, current) => 
        (current.winRate > best.winRate) ? current : best, 
        phaseEntries[0]
      );
      
      // Wenn dieses Setup eine besonders hohe Win-Rate in einer bestimmten Phase hat
      if (bestPhaseForSetup.winRate > 70) {
        recommendations.push({
          id: `rec-setup-${setup.setup}-${bestPhaseForSetup.phase}`,
          phase: bestPhaseForSetup.phase as 'trend' | 'range' | 'volatile',
          recommendation: `Nutze ${setup.setup} in ${bestPhaseForSetup.phase}-Phasen`,
          explanation: `Das Setup "${setup.setup}" hat eine hervorragende Win-Rate von ${bestPhaseForSetup.winRate}% in ${bestPhaseForSetup.phase}-Phasen. Fokussiere dich auf diese Kombination für optimale Ergebnisse.`
        });
      }
    }
    
    // 4. Allgemeine Empfehlung, wenn keine spezifischen gefunden wurden
    if (recommendations.length === 0) {
      // Finde die Phase mit den meisten Trades
      const mostTradesPhase = phasePerformance.reduce((most, current) => 
        (current.totalTrades > most.totalTrades) ? current : most, 
        phasePerformance[0]
      );
      
      recommendations.push({
        id: "rec-general",
        phase: mostTradesPhase.phase as 'trend' | 'range' | 'volatile',
        recommendation: "Erweitere deine Marktphasen-Analyse",
        explanation: "Um präzisere Empfehlungen zu erhalten, verfolge und kennzeichne Marktphasen in deinen zukünftigen Trades. Dies wird dir helfen, deine Stärken und Schwächen in verschiedenen Marktbedingungen besser zu verstehen."
      });
    }
    
    return recommendations;
  }
  
  // Marktphasen-Verteilung
  app.get("/api/market-phases/distribution", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Holen Sie alle Trades des Benutzers
      const trades = await storage.getTrades(userId);
      
      // Marktphasen-Verteilung berechnen
      const distribution = calculateMarketPhaseDistribution(trades);
      
      res.json(distribution);
    } catch (error) {
      console.error("Error calculating market phase distribution:", error);
      res.status(500).json({ error: "Failed to calculate market phase distribution" });
    }
  });
  
  // Marktphasen-Performance
  app.get("/api/market-phases/performance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Holen Sie alle Trades des Benutzers
      const trades = await storage.getTrades(userId);
      
      // Marktphasen-Performance berechnen
      const performance = calculateMarketPhasePerformance(trades);
      
      res.json(performance);
    } catch (error) {
      console.error("Error calculating market phase performance:", error);
      res.status(500).json({ error: "Failed to calculate market phase performance" });
    }
  });
  
  // Setup-Performance nach Marktphasen
  app.get("/api/market-phases/setup-performance", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Holen Sie alle Trades des Benutzers
      const trades = await storage.getTrades(userId);
      
      // Setup-Performance nach Marktphasen berechnen
      const setupPerformance = calculateSetupPerformanceByMarketPhase(trades);
      
      res.json(setupPerformance);
    } catch (error) {
      console.error("Error calculating setup performance by market phase:", error);
      res.status(500).json({ error: "Failed to calculate setup performance by market phase" });
    }
  });
  
  // Marktphasen-Empfehlungen
  app.get("/api/market-phases/recommendations", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Holen Sie alle Trades des Benutzers
      const trades = await storage.getTrades(userId);
      
      // Marktphasen-Empfehlungen generieren
      const recommendations = generateMarketPhaseRecommendations(trades);
      
      res.json(recommendations);
    } catch (error) {
      console.error("Error generating market phase recommendations:", error);
      res.status(500).json({ error: "Failed to generate market phase recommendations" });
    }
  });
  
  // Performance-Heatmap-Daten
  app.get("/api/performance-heatmap", async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }
      
      // Datumsfilter verarbeiten, falls vorhanden
      const startDateParam = req.query.startDate as string;
      const endDateParam = req.query.endDate as string;
      
      let startDate: Date | undefined;
      let endDate: Date | undefined;
      
      if (startDateParam) {
        startDate = new Date(startDateParam);
        if (isNaN(startDate.getTime())) {
          return res.status(400).json({ error: "Invalid start date format" });
        }
      }
      
      if (endDateParam) {
        endDate = new Date(endDateParam);
        if (isNaN(endDate.getTime())) {
          return res.status(400).json({ error: "Invalid end date format" });
        }
        // Setze das Ende des Tages für den Vergleich
        endDate.setHours(23, 59, 59, 999);
      }
      
      // Zusätzliche Filter für Setup, Symbol, Handelsrichtung
      const setupFilter = req.query.setup as string;
      const symbolFilter = req.query.symbol as string;
      const directionFilter = req.query.direction as string;
      const compareWith = req.query.compareWith as string;
      
      // Erweiterte Filter-Arrays für die Filterung
      let setupsArray: string[] = [];
      let symbolsArray: string[] = [];
      let marketPhasesArray: string[] = [];
      let sessionsArray: string[] = [];
      let isWin: boolean | null = null;
      
      // Array-Parameter aus JSON-Strings parsen (von der TradeTable übertragen)
      if (req.query.setups) {
        try {
          setupsArray = JSON.parse(req.query.setups as string);
          console.log("Setups Filter erhalten:", setupsArray);
        } catch (error) {
          console.warn("Fehler beim Parsen der Setups-Filter:", error);
        }
      }
      
      if (req.query.symbols) {
        try {
          symbolsArray = JSON.parse(req.query.symbols as string);
          console.log("Symbols Filter erhalten:", symbolsArray);
        } catch (error) {
          console.warn("Fehler beim Parsen der Symbols-Filter:", error);
        }
      }
      
      if (req.query.marketPhases) {
        try {
          marketPhasesArray = JSON.parse(req.query.marketPhases as string);
          console.log("Marktphasen Filter erhalten:", marketPhasesArray);
        } catch (error) {
          console.warn("Fehler beim Parsen der Marktphasen-Filter:", error);
        }
      }
      
      if (req.query.sessions) {
        try {
          sessionsArray = JSON.parse(req.query.sessions as string);
          console.log("Sessions Filter erhalten:", sessionsArray);
        } catch (error) {
          console.warn("Fehler beim Parsen der Sessions-Filter:", error);
        }
      }
      
      // Win/Loss-Filter
      if (req.query.isWin === 'true') {
        isWin = true;
      } else if (req.query.isWin === 'false') {
        isWin = false;
      }
      
      // Aktive Filter aus der Trades-Tabelle (Legacy-Support)
      const activeFiltersStr = req.query.activeFilters as string;
      let activeFilters: any = {};
      
      if (activeFiltersStr) {
        try {
          activeFilters = JSON.parse(activeFiltersStr);
        } catch (err) {
          console.warn("Invalid activeFilters JSON string:", activeFiltersStr);
        }
      }
      
      // Holen Sie alle Trades des Benutzers
      let allTrades = await storage.getTrades(userId);
      
      // Wende die aktiven Filter aus der Trades-Tabelle an, falls vorhanden
      if (activeFilters && Object.keys(activeFilters).length > 0) {
        console.log("Anwenden von aktiven Filtern auf Heatmap-Daten:", activeFilters);
        
        allTrades = allTrades.filter(trade => {
          let passesFilter = true;
          
          // Datum-Filter
          if (activeFilters.dateRange && activeFilters.dateRange.from && activeFilters.dateRange.to) {
            const tradeDate = new Date(trade.date);
            const fromDate = new Date(activeFilters.dateRange.from);
            const toDate = new Date(activeFilters.dateRange.to);
            toDate.setHours(23, 59, 59, 999); // Ende des Tages
            
            if (tradeDate < fromDate || tradeDate > toDate) {
              passesFilter = false;
            }
          }
          
          // Setup-Filter
          if (passesFilter && activeFilters.setup && activeFilters.setup !== "all") {
            passesFilter = trade.setup === activeFilters.setup;
          }
          
          // Symbol-Filter
          if (passesFilter && activeFilters.symbol && activeFilters.symbol !== "all") {
            passesFilter = trade.symbol === activeFilters.symbol;
          }
          
          // Handelsrichtung-Filter
          if (passesFilter && activeFilters.direction && activeFilters.direction !== "all") {
            passesFilter = trade.entryType === activeFilters.direction;
          }
          
          // Weitere Filter können hier hinzugefügt werden
          
          return passesFilter;
        });
        
        console.log(`Nach Anwendung der aktiven Filter: ${allTrades.length} Trades übrig.`);
      }
      
      // Vergleichsdaten für zweiten Benutzer/Zeitraum (falls angefordert)
      let comparisonTrades: any[] = [];
      
      if (compareWith && compareWith.startsWith("user:")) {
        // Vergleich mit anderem Benutzer (Format: user:1)
        const compareUserId = parseInt(compareWith.split(":")[1]);
        if (!isNaN(compareUserId)) {
          comparisonTrades = await storage.getTrades(compareUserId);
        }
      } else if (compareWith && compareWith.startsWith("period:")) {
        // Vergleich mit anderem Zeitraum (Format: period:last30days)
        const compareTimePeriod = compareWith.split(":")[1];
        
        let compareStartDate: Date | undefined;
        let compareEndDate: Date | undefined;
        
        if (compareTimePeriod === "last30days") {
          compareEndDate = new Date();
          compareStartDate = new Date();
          compareStartDate.setDate(compareEndDate.getDate() - 30);
        } else if (compareTimePeriod === "last90days") {
          compareEndDate = new Date();
          compareStartDate = new Date();
          compareStartDate.setDate(compareEndDate.getDate() - 90);
        } else if (compareTimePeriod === "lastyear") {
          compareEndDate = new Date();
          compareStartDate = new Date();
          compareStartDate.setFullYear(compareEndDate.getFullYear() - 1);
        }
        
        if (compareStartDate && compareEndDate) {
          comparisonTrades = allTrades.filter(trade => {
            if (!trade.date) return false;
            const tradeDate = new Date(trade.date);
            return tradeDate >= compareStartDate! && tradeDate <= compareEndDate!;
          });
        }
      }
      
      // Filtere Trades nach Datum und zusätzlichen Filtern
      const trades = allTrades.filter(trade => {
        if (!trade.date) return false;
        
        const tradeDate = new Date(trade.date);
        
        // Datumsfilter anwenden
        if (startDate && tradeDate < startDate) return false;
        if (endDate && tradeDate > endDate) return false;
        
        // Einfache Filter anwenden, wenn keine Array-Filter aktiviert sind
        
        // Setup-Filter: Einzelner Wert oder Array
        if (setupsArray.length > 0) {
          // Array-Filter (von TradeTable)
          if (!trade.setup || !setupsArray.includes(trade.setup)) return false;
        } else if (setupFilter && setupFilter !== "all" && trade.setup !== setupFilter) {
          // Einzelner Wert (von Heatmap-Dropdown)
          return false;
        }
        
        // Symbol-Filter: Einzelner Wert oder Array
        if (symbolsArray.length > 0) {
          // Array-Filter (von TradeTable)
          if (!trade.symbol || !symbolsArray.includes(trade.symbol)) return false;
        } else if (symbolFilter && symbolFilter !== "all" && trade.symbol !== symbolFilter) {
          // Einzelner Wert (von Heatmap-Dropdown)
          return false;
        }
        
        // Richtungs-Filter anwenden
        if (directionFilter && directionFilter !== "all" && trade.entryType !== directionFilter) return false;
        
        // Win/Loss-Status filtern
        if (isWin !== null && trade.isWin !== isWin) return false;
        
        // Marktphasen filtern
        if (marketPhasesArray.length > 0 && (!trade.marketPhase || !marketPhasesArray.includes(trade.marketPhase))) {
          return false;
        }
        
        // Sessions filtern
        if (sessionsArray.length > 0 && (!trade.session || !sessionsArray.includes(trade.session))) {
          return false;
        }
        
        return true;
      });
      
      if (!trades || trades.length === 0) {
        return res.json({ days: [], timeframe: [], data: [] });
      }
      
      // Tage der Woche
      const days = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag"];
      
      // Handelszeiträume für die Heatmap (Tageszeiten)
      const timeframe = ["04-08", "08-10", "10-12", "12-14", "14-16", "16-18", "18-22"];
      
      // Erstelle die Datenstruktur für die Heatmap
      const heatmapData = [];
      
      // Hilfsfunktion, um den Stunden-Zeitraum eines Trades zu bestimmen
      const getTimeframeForHour = (hour: number): string => {
        if (hour >= 4 && hour < 8) return "04-08";
        if (hour >= 8 && hour < 10) return "08-10";
        if (hour >= 10 && hour < 12) return "10-12";
        if (hour >= 12 && hour < 14) return "12-14";
        if (hour >= 14 && hour < 16) return "14-16";
        if (hour >= 16 && hour < 18) return "16-18";
        if (hour >= 18 && hour < 22) return "18-22";
        return "other";
      };
      
      // Generiere Heatmap-Daten
      const processTradesForHeatmap = (tradesData: any[], isComparison = false) => {
        // Gruppieren der Trades nach Wochentag und Zeitraum
        const groupedTrades: Record<string, Record<string, any[]>> = {};
        
        // Initialisiere die Gruppenstruktur
        days.forEach(day => {
          groupedTrades[day] = {};
          timeframe.forEach(time => {
            groupedTrades[day][time] = [];
          });
        });
        
        // Füge Trades zu den entsprechenden Gruppen hinzu
        for (const trade of tradesData) {
          if (!trade.date) continue;
          
          const tradeDate = new Date(trade.date);
          const dayOfWeek = tradeDate.getDay(); // 0 (Sonntag) bis 6 (Samstag)
          
          // Wir ignorieren Wochenende (0 = Sonntag, 6 = Samstag)
          if (dayOfWeek === 0 || dayOfWeek === 6) continue;
          
          // Konvertierung von 0-basiertem Tag zu unserem Format
          const dayIndex = dayOfWeek - 1; // 0 = Montag, ..., 4 = Freitag
          const day = days[dayIndex];
          
          const hour = tradeDate.getHours();
          const timeframeSlot = getTimeframeForHour(hour);
          
          // Ignoriere Zeitslots außerhalb unserer definierten Zeitrahmen
          if (timeframeSlot === "other") continue;
          
          if (groupedTrades[day] && groupedTrades[day][timeframeSlot]) {
            groupedTrades[day][timeframeSlot].push(trade);
          }
        }
        
        // Erstelle die Heatmap-Daten mit Performance-Metriken
        const resultData = [];
        
        days.forEach(day => {
          timeframe.forEach(time => {
            const tradesInSlot = groupedTrades[day][time];
            
            if (tradesInSlot.length > 0) {
              // Berechne Win-Rate für diesen Slot
              const wins = tradesInSlot.filter(t => t.isWin).length;
              const winRate = tradesInSlot.length > 0 ? (wins / tradesInSlot.length) * 100 : 0;
              
              // Berechne durchschnittliches RR für diesen Slot
              const totalRR = tradesInSlot.reduce((sum, t) => sum + (t.rrAchieved || 0), 0);
              const avgRR = tradesInSlot.length > 0 ? totalRR / tradesInSlot.length : 0;
              
              // Berechne Gesamt-PnL für diesen Slot
              const totalPnL = tradesInSlot.reduce((sum, t) => sum + (t.profitLoss || 0), 0);
              
              resultData.push({
                day,
                timeframe: time,
                value: winRate, // Primärwert für die Heatmap-Farbe
                tradeCount: tradesInSlot.length,
                winRate: Math.round(winRate),
                avgRR: avgRR.toFixed(2),
                totalPnL: totalPnL.toFixed(2),
                isComparison,
              });
            } else {
              // Leere Slots auch hinzufügen mit Nullwerten
              resultData.push({
                day,
                timeframe: time,
                value: 0,
                tradeCount: 0,
                winRate: 0,
                avgRR: "0.00",
                totalPnL: "0.00",
                isComparison,
              });
            }
          });
        });
        
        return resultData;
      };
      
      // Verarbeite primäre Daten
      const primaryData = processTradesForHeatmap(trades);
      
      // Analysiere die Daten für Empfehlungen
      const bestPerformingSlots = primaryData
        .filter(slot => slot.tradeCount > 0)
        .sort((a, b) => b.winRate - a.winRate)
        .slice(0, 3);
      
      const worstPerformingSlots = primaryData
        .filter(slot => slot.tradeCount > 0)
        .sort((a, b) => a.winRate - b.winRate)
        .slice(0, 3);
      
      // Erstelle Empfehlungen basierend auf den Daten
      const recommendations = {
        bestTimes: bestPerformingSlots.map(slot => ({
          day: slot.day,
          time: slot.timeframe,
          winRate: slot.winRate,
          avgRR: slot.avgRR
        })),
        worstTimes: worstPerformingSlots.map(slot => ({
          day: slot.day,
          time: slot.timeframe,
          winRate: slot.winRate,
          avgRR: slot.avgRR
        })),
        trends: []
      };
      
      // Ermittle tagesbezogene Trends
      const dayPerformance: Record<string, { totalWinRate: number, count: number }> = {};
      days.forEach(day => {
        dayPerformance[day] = { totalWinRate: 0, count: 0 };
      });
      
      primaryData.forEach(slot => {
        if (slot.tradeCount > 0) {
          dayPerformance[slot.day].totalWinRate += slot.winRate;
          dayPerformance[slot.day].count += 1;
        }
      });
      
      const dayTrends = Object.entries(dayPerformance)
        .map(([day, data]) => ({
          day,
          avgWinRate: data.count > 0 ? Math.round(data.totalWinRate / data.count) : 0
        }))
        .filter(item => item.avgWinRate > 0)
        .sort((a, b) => b.avgWinRate - a.avgWinRate);
      
      if (dayTrends.length > 0) {
        recommendations.trends.push({
          type: 'day',
          message: `Dein bester Handelstag ist ${dayTrends[0].day} mit einer durchschnittlichen Win-Rate von ${dayTrends[0].avgWinRate}%.`
        });
      }
      
      // Kombiniere alle Daten für die Antwort
      const responseData = {
        days,
        timeframe,
        data: primaryData,
        recommendations,
        filters: {
          availableSetups: [...new Set(allTrades.map(t => t.setup)
            .filter(setup => setup && setup !== '' && setup !== null))]
            .map(item => item || 'Unbekannt')
            .filter(item => item !== ''),
          availableSymbols: [...new Set(allTrades.map(t => t.symbol)
            .filter(symbol => symbol && symbol !== '' && symbol !== null))]
            .map(item => item || 'Unbekannt')
            .filter(item => item !== ''),
          availableDirections: [...new Set(allTrades.map(t => t.entryType)
            .filter(type => type && type !== '' && type !== null))]
            .map(item => item || 'Unbekannt')
            .filter(item => item !== ''),
        }
      };
      
      // Füge Vergleichsdaten hinzu, falls vorhanden
      if (comparisonTrades.length > 0) {
        responseData.comparison = processTradesForHeatmap(comparisonTrades, true);
      }
      
      res.json(responseData);
    } catch (error) {
      console.error("Error generating performance heatmap data:", error);
      res.status(500).json({ error: "Failed to generate performance heatmap data" });
    }
  });

  // Coaching-Routen
  app.get("/api/coaching/goals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const completed = req.query.completed === "true" ? true : 
                      req.query.completed === "false" ? false : 
                      undefined;
      
      const goals = await storage.getCoachingGoals(userId, completed);
      res.json(goals);
    } catch (error) {
      console.error("Error fetching coaching goals:", error);
      res.status(500).json({ error: "Failed to fetch coaching goals" });
    }
  });

  app.post("/api/coaching/goals", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const goal = req.body;
      const newGoal = await storage.createCoachingGoal(goal);
      res.status(201).json(newGoal);
    } catch (error) {
      console.error("Error creating coaching goal:", error);
      res.status(500).json({ error: "Failed to create coaching goal" });
    }
  });

  app.put("/api/coaching/goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const goalUpdate = req.body;
      const updatedGoal = await storage.updateCoachingGoal(id, goalUpdate);

      if (!updatedGoal) {
        return res.status(404).json({ error: "Goal not found" });
      }

      res.json(updatedGoal);
    } catch (error) {
      console.error("Error updating coaching goal:", error);
      res.status(500).json({ error: "Failed to update coaching goal" });
    }
  });

  app.delete("/api/coaching/goals/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const success = await storage.deleteCoachingGoal(id);

      if (!success) {
        return res.status(404).json({ error: "Goal not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting coaching goal:", error);
      res.status(500).json({ error: "Failed to delete coaching goal" });
    }
  });

  app.get("/api/coaching/feedback", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.query.userId as string);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const acknowledged = req.query.acknowledged === "true" ? true : 
                          req.query.acknowledged === "false" ? false : 
                          undefined;
      
      const feedback = await storage.getCoachingFeedback(userId, acknowledged);
      res.json(feedback);
    } catch (error) {
      console.error("Error fetching coaching feedback:", error);
      res.status(500).json({ error: "Failed to fetch coaching feedback" });
    }
  });

  app.post("/api/coaching/feedback/generate", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.body.userId);
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Invalid user ID" });
      }

      const feedback = await storage.generateCoachingFeedback(userId);
      res.status(201).json(feedback);
    } catch (error) {
      console.error("Error generating coaching feedback:", error);
      res.status(500).json({ error: "Failed to generate coaching feedback" });
    }
  });

  app.put("/api/coaching/feedback/:id/acknowledge", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const feedback = await storage.acknowledgeCoachingFeedback(id);

      if (!feedback) {
        return res.status(404).json({ error: "Feedback not found" });
      }

      res.json(feedback);
    } catch (error) {
      console.error("Error acknowledging feedback:", error);
      res.status(500).json({ error: "Failed to acknowledge feedback" });
    }
  });

  // Makroökonomische Ereignisse
  app.get("/api/macro-events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const startDate = req.query.startDate ? new Date(req.query.startDate as string) : new Date();
      const endDate = req.query.endDate ? new Date(req.query.endDate as string) : new Date(startDate);
      
      // Wenn nur startDate angegeben ist, setze endDate auf eine Woche später
      if (!req.query.endDate) {
        endDate.setDate(endDate.getDate() + 7);
      }

      const events = await storage.getMacroEconomicEvents(startDate, endDate);
      res.json(events);
    } catch (error) {
      console.error("Error fetching macro events:", error);
      res.status(500).json({ error: "Failed to fetch macro events" });
    }
  });

  app.post("/api/macro-events", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const event = req.body;
      const newEvent = await storage.createMacroEconomicEvent(event);
      res.status(201).json(newEvent);
    } catch (error) {
      console.error("Error creating macro event:", error);
      res.status(500).json({ error: "Failed to create macro event" });
    }
  });

  app.put("/api/macro-events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const eventUpdate = req.body;
      const updatedEvent = await storage.updateMacroEconomicEvent(id, eventUpdate);

      if (!updatedEvent) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating macro event:", error);
      res.status(500).json({ error: "Failed to update macro event" });
    }
  });

  app.delete("/api/macro-events/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const success = await storage.deleteMacroEconomicEvent(id);

      if (!success) {
        return res.status(404).json({ error: "Event not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting macro event:", error);
      res.status(500).json({ error: "Failed to delete macro event" });
    }
  });

  // Social Trading Routen
  app.get("/api/strategies", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const publicOnly = req.query.publicOnly === "true";

      const strategies = await storage.getTradingStrategies(userId, publicOnly);
      res.json(strategies);
    } catch (error) {
      console.error("Error fetching strategies:", error);
      res.status(500).json({ error: "Failed to fetch strategies" });
    }
  });

  app.get("/api/strategies/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const strategy = await storage.getTradingStrategyById(id);

      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      res.json(strategy);
    } catch (error) {
      console.error("Error fetching strategy:", error);
      res.status(500).json({ error: "Failed to fetch strategy" });
    }
  });

  app.post("/api/strategies", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const strategy = req.body;
      const newStrategy = await storage.createTradingStrategy(strategy);
      res.status(201).json(newStrategy);
    } catch (error) {
      console.error("Error creating strategy:", error);
      res.status(500).json({ error: "Failed to create strategy" });
    }
  });

  app.put("/api/strategies/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const strategyUpdate = req.body;
      const updatedStrategy = await storage.updateTradingStrategy(id, strategyUpdate);

      if (!updatedStrategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      res.json(updatedStrategy);
    } catch (error) {
      console.error("Error updating strategy:", error);
      res.status(500).json({ error: "Failed to update strategy" });
    }
  });

  app.delete("/api/strategies/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const strategy = await storage.getTradingStrategyById(id);

      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      // Nur der Ersteller kann seine Strategie löschen
      if (strategy.userId !== req.user?.id) {
        return res.status(403).json({ error: "Unauthorized to delete this strategy" });
      }

      await storage.deleteTradingStrategy(id);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting strategy:", error);
      res.status(500).json({ error: "Failed to delete strategy" });
    }
  });

  app.get("/api/strategies/:id/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);
      if (isNaN(strategyId)) {
        return res.status(400).json({ error: "Invalid strategy ID" });
      }

      const comments = await storage.getStrategyComments(strategyId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching comments:", error);
      res.status(500).json({ error: "Failed to fetch comments" });
    }
  });

  app.post("/api/strategies/:id/comments", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const strategyId = parseInt(req.params.id);
      if (isNaN(strategyId)) {
        return res.status(400).json({ error: "Invalid strategy ID" });
      }

      // Sicherstellen, dass die Strategie existiert
      const strategy = await storage.getTradingStrategyById(strategyId);
      if (!strategy) {
        return res.status(404).json({ error: "Strategy not found" });
      }

      const comment = {
        strategyId,
        userId: req.user!.id,
        content: req.body.content
      };

      const newComment = await storage.createStrategyComment(comment);
      res.status(201).json(newComment);
    } catch (error) {
      console.error("Error creating comment:", error);
      res.status(500).json({ error: "Failed to create comment" });
    }
  });

  app.delete("/api/comments/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const success = await storage.deleteStrategyComment(id);

      if (!success) {
        return res.status(404).json({ error: "Comment not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting comment:", error);
      res.status(500).json({ error: "Failed to delete comment" });
    }
  });

  // PWA und Multi-Device Routen
  app.get("/api/settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const deviceId = req.query.deviceId as string;

      const settings = await storage.getAppSettings(userId, deviceId);
      res.json(settings || {});
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ error: "Failed to fetch settings" });
    }
  });

  app.post("/api/settings", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const settings = {
        ...req.body,
        userId
      };

      const newSettings = await storage.createAppSettings(settings);
      res.status(201).json(newSettings);
    } catch (error) {
      console.error("Error creating settings:", error);
      res.status(500).json({ error: "Failed to create settings" });
    }
  });

  app.put("/api/settings/:id", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ error: "Invalid ID" });
      }

      const settingsUpdate = req.body;
      const updatedSettings = await storage.updateAppSettings(id, settingsUpdate);

      if (!updatedSettings) {
        return res.status(404).json({ error: "Settings not found" });
      }

      res.json(updatedSettings);
    } catch (error) {
      console.error("Error updating settings:", error);
      res.status(500).json({ error: "Failed to update settings" });
    }
  });

  app.post("/api/settings/sync", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { deviceId } = req.body;

      if (!deviceId) {
        return res.status(400).json({ error: "Device ID is required" });
      }

      const settings = await storage.syncAppSettings(userId, deviceId);

      if (!settings) {
        return res.status(404).json({ error: "Settings not found for this device" });
      }

      res.json(settings);
    } catch (error) {
      console.error("Error syncing settings:", error);
      res.status(500).json({ error: "Failed to sync settings" });
    }
  });
  
  // Trading Streak Routes
  app.get("/api/trading-streak", async (req: Request, res: Response) => {
    try {
      // Unterstützt sowohl authentifizierte als auch nicht-authentifizierte Anfragen
      const userId = req.isAuthenticated() ? req.user!.id : parseInt(req.query.userId as string);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Gültige User-ID erforderlich" });
      }
      
      const streak = await storage.getTradingStreak(userId);
      
      if (!streak) {
        // Es ist kein Fehler, wenn keine Streak existiert; gibt einfach null zurück
        return res.json(null);
      }
      
      res.json(streak);
    } catch (error) {
      console.error("Fehler beim Abrufen der Trading Streak:", error);
      res.status(500).json({ error: "Trading Streak konnte nicht abgerufen werden" });
    }
  });
  
  app.post("/api/trading-streak", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      
      // Überprüfe, ob bereits eine Streak für diesen Benutzer existiert
      const existingStreak = await storage.getTradingStreak(userId);
      
      if (existingStreak) {
        return res.status(400).json({ error: "Trading Streak existiert bereits für diesen Benutzer" });
      }
      
      const streak = {
        ...req.body,
        userId
      };
      
      const newStreak = await storage.createTradingStreak(streak);
      res.status(201).json(newStreak);
    } catch (error) {
      console.error("Fehler beim Erstellen der Trading Streak:", error);
      res.status(500).json({ error: "Trading Streak konnte nicht erstellt werden" });
    }
  });
  
  app.put("/api/trading-streak/:userId", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Ungültige User-ID" });
      }
      
      // Überprüfe, ob der Benutzer seine eigene Streak oder als Admin eine andere Streak aktualisiert
      if (req.user!.id !== userId && req.user!.username !== "admin") {
        return res.status(403).json({ error: "Nicht berechtigt, diese Trading Streak zu aktualisieren" });
      }
      
      const streakUpdate = req.body;
      const updatedStreak = await storage.updateTradingStreak(userId, streakUpdate);
      
      if (!updatedStreak) {
        return res.status(404).json({ error: "Trading Streak nicht gefunden" });
      }
      
      res.json(updatedStreak);
    } catch (error) {
      console.error("Fehler beim Aktualisieren der Trading Streak:", error);
      res.status(500).json({ error: "Trading Streak konnte nicht aktualisiert werden" });
    }
  });
  
  app.post("/api/trading-streak/:userId/badge", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = parseInt(req.params.userId);
      
      if (isNaN(userId)) {
        return res.status(400).json({ error: "Ungültige User-ID" });
      }
      
      // Überprüfe, ob der Benutzer seine eigene Streak oder als Admin eine andere Streak aktualisiert
      if (req.user!.id !== userId && req.user!.username !== "admin") {
        return res.status(403).json({ error: "Nicht berechtigt, Badges für diese Trading Streak hinzuzufügen" });
      }
      
      const { badgeType } = req.body;
      
      // Definiere die erlaubten Badge-Typen direkt hier, damit wir nicht die Schema-Datei importieren müssen
      const allowedBadgeTypes = [
        "winning_streak_5", 
        "winning_streak_10", 
        "winning_streak_20", 
        "perfect_week", 
        "comeback_king", 
        "first_trade", 
        "trade_master_50", 
        "trade_master_100"
      ];
      
      if (!badgeType || !allowedBadgeTypes.includes(badgeType)) {
        return res.status(400).json({ error: "Ungültiger Badge-Typ" });
      }
      
      const updatedStreak = await storage.earnBadge(userId, badgeType);
      
      if (!updatedStreak) {
        return res.status(404).json({ error: "Trading Streak nicht gefunden" });
      }
      
      res.json(updatedStreak);
    } catch (error) {
      console.error("Fehler beim Hinzufügen des Badges:", error);
      res.status(500).json({ error: "Badge konnte nicht hinzugefügt werden" });
    }
  });
  
  app.post("/api/trading-streak/trade-result", isAuthenticated, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { isWin } = req.body;
      
      if (typeof isWin !== 'boolean') {
        return res.status(400).json({ error: "isWin muss ein boolean-Wert sein" });
      }
      
      const updatedStreak = await storage.updateStreakOnTradeResult(userId, isWin);
      res.json(updatedStreak);
    } catch (error) {
      console.error("Fehler beim Aktualisieren des Trade-Ergebnisses:", error);
      res.status(500).json({ error: "Trade-Ergebnis konnte nicht aktualisiert werden" });
    }
  });
  
  app.get("/api/trading-streak/top", async (req: Request, res: Response) => {
    try {
      // Limitiert die Anzahl der zurückgegebenen Streaks
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 10;
      
      const topStreaks = await storage.getTopStreaks();
      
      // Gib nur die angeforderte Anzahl zurück
      res.json(topStreaks.slice(0, limit));
    } catch (error) {
      console.error("Fehler beim Abrufen der Top Streaks:", error);
      res.status(500).json({ error: "Top Streaks konnten nicht abgerufen werden" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
