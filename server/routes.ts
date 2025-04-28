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
      if (Object.keys(tradeUpdate).length === 1 && 'chartImage' in tradeUpdate) {
        // Nur Chart-Update
        const updatedTrade = await storage.updateTrade(tradeId, tradeUpdate);
        
        if (!updatedTrade) {
          return res.status(404).json({ message: "Trade not found" });
        }
        
        return res.status(200).json(updatedTrade);
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

  const httpServer = createServer(app);
  return httpServer;
}
