import { 
  users, type User, type InsertUser,
  trades, type Trade, type InsertTrade,
  weeklySummaries, type WeeklySummary, type InsertWeeklySummary,
  performanceData, type PerformanceData, type InsertPerformanceData,
  setupWinRates, type SetupWinRate, type InsertSetupWinRate,
  coachingGoals, type CoachingGoal, type InsertCoachingGoal,
  coachingFeedback, type CoachingFeedback, type InsertCoachingFeedback,
  macroEconomicEvents, type MacroEconomicEvent, type InsertMacroEconomicEvent,
  tradingStrategies, type TradingStrategy, type InsertTradingStrategy,
  strategyComments, type StrategyComment, type InsertStrategyComment,
  appSettings, type AppSettings, type InsertAppSettings,
  tradingStreaks, type TradingStreak, type InsertTradingStreak,
  badgeTypes
} from "../shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import connectPg from "connect-pg-simple";
import { db } from "./db";
import { eq, and, between, desc, asc } from "drizzle-orm";
import { pool } from "./db";

const MemoryStore = createMemoryStore(session);
const PostgresSessionStore = connectPg(session);

// Interface for storage methods
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;
  
  // Trade operations
  getTrades(userId: number, filters?: Partial<Trade>): Promise<Trade[]>;
  getTradeById(id: number): Promise<Trade | undefined>;
  createTrade(trade: InsertTrade & { userId: number }): Promise<Trade>;
  updateTrade(id: number, trade: Partial<Trade>): Promise<Trade | undefined>;
  deleteTrade(id: number): Promise<boolean>;
  
  // Weekly summary operations
  getWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<WeeklySummary | undefined>;
  createWeeklySummary(summary: InsertWeeklySummary & { userId: number }): Promise<WeeklySummary>;
  updateWeeklySummary(id: number, summary: Partial<WeeklySummary>): Promise<WeeklySummary | undefined>;
  
  // Performance data operations
  getPerformanceData(userId: number, startDate?: Date, endDate?: Date): Promise<PerformanceData[]>;
  createPerformanceData(data: InsertPerformanceData & { userId: number }): Promise<PerformanceData>;
  
  // Setup win rate operations
  getSetupWinRates(userId: number): Promise<SetupWinRate[]>;
  updateSetupWinRate(userId: number, setup: string, winRate: number): Promise<SetupWinRate>;
  
  // Statistics operations
  calculateWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<InsertWeeklySummary & { userId: number }>;
  calculateSetupWinRates(userId: number): Promise<void>;
  
  // Coaching Goals operations
  getCoachingGoals(userId: number, completed?: boolean): Promise<CoachingGoal[]>;
  getCoachingGoalById(id: number): Promise<CoachingGoal | undefined>;
  createCoachingGoal(goal: InsertCoachingGoal): Promise<CoachingGoal>;
  updateCoachingGoal(id: number, goal: Partial<CoachingGoal>): Promise<CoachingGoal | undefined>;
  deleteCoachingGoal(id: number): Promise<boolean>;
  
  // Coaching Feedback operations
  getCoachingFeedback(userId: number, acknowledged?: boolean): Promise<CoachingFeedback[]>;
  createCoachingFeedback(feedback: InsertCoachingFeedback): Promise<CoachingFeedback>;
  acknowledgeCoachingFeedback(id: number): Promise<CoachingFeedback | undefined>;
  generateCoachingFeedback(userId: number): Promise<CoachingFeedback[]>;
  
  // Trading Streak operations
  getTradingStreak(userId: number): Promise<TradingStreak | undefined>;
  createTradingStreak(streak: InsertTradingStreak & { userId: number }): Promise<TradingStreak>;
  updateTradingStreak(userId: number, streak: Partial<TradingStreak>): Promise<TradingStreak | undefined>;
  updateStreakOnTradeResult(userId: number, isWin: boolean): Promise<TradingStreak>;
  getTopStreaks(): Promise<TradingStreak[]>;
  earnBadge(userId: number, badgeType: typeof badgeTypes[number]): Promise<TradingStreak | undefined>;

  // Macroeconomic Events operations
  getMacroEconomicEvents(startDate: Date, endDate: Date): Promise<MacroEconomicEvent[]>;
  getMacroEconomicEventById(id: number): Promise<MacroEconomicEvent | undefined>;
  createMacroEconomicEvent(event: InsertMacroEconomicEvent): Promise<MacroEconomicEvent>;
  updateMacroEconomicEvent(id: number, event: Partial<MacroEconomicEvent>): Promise<MacroEconomicEvent | undefined>;
  deleteMacroEconomicEvent(id: number): Promise<boolean>;
  
  // Trading Strategies operations
  getTradingStrategies(userId?: number, publicOnly?: boolean): Promise<TradingStrategy[]>;
  getTradingStrategyById(id: number): Promise<TradingStrategy | undefined>;
  createTradingStrategy(strategy: InsertTradingStrategy): Promise<TradingStrategy>;
  updateTradingStrategy(id: number, strategy: Partial<TradingStrategy>): Promise<TradingStrategy | undefined>;
  deleteTradingStrategy(id: number): Promise<boolean>;
  
  // Strategy Comments operations
  getStrategyComments(strategyId: number): Promise<StrategyComment[]>;
  createStrategyComment(comment: InsertStrategyComment): Promise<StrategyComment>;
  deleteStrategyComment(id: number): Promise<boolean>;
  
  // App Settings operations
  getAppSettings(userId: number, deviceId?: string): Promise<AppSettings | undefined>;
  createAppSettings(settings: InsertAppSettings): Promise<AppSettings>;
  updateAppSettings(id: number, settings: Partial<AppSettings>): Promise<AppSettings | undefined>;
  syncAppSettings(userId: number, deviceId: string): Promise<AppSettings | undefined>;
}

export class MemStorage implements IStorage {
  sessionStore: session.Store;
  private users: Map<number, User>;
  private trades: Map<number, Trade>;
  private weeklySummaries: Map<number, WeeklySummary>;
  private performanceData: Map<number, PerformanceData>;
  private setupWinRates: Map<number, SetupWinRate>;
  private coachingGoals: Map<number, CoachingGoal>;
  private coachingFeedback: Map<number, CoachingFeedback>;
  private macroEconomicEvents: Map<number, MacroEconomicEvent>;
  private tradingStrategies: Map<number, TradingStrategy>;
  private strategyComments: Map<number, StrategyComment>;
  private appSettings: Map<number, AppSettings>;
  private tradingStreaks: Map<number, TradingStreak>;
  
  private userIdCounter: number;
  private tradeIdCounter: number;
  private summaryIdCounter: number;
  private performanceIdCounter: number;
  private setupWinRateIdCounter: number;
  private coachingGoalIdCounter: number;
  private coachingFeedbackIdCounter: number;
  private macroEconomicEventIdCounter: number;
  private tradingStrategyIdCounter: number;
  private strategyCommentIdCounter: number;
  private appSettingsIdCounter: number;
  private tradingStreakIdCounter: number;
  
  // Coaching Goals operations
  async getCoachingGoals(userId: number, completed?: boolean): Promise<CoachingGoal[]> {
    let goals = Array.from(this.coachingGoals.values()).filter(
      (goal) => goal.userId === userId
    );
    
    if (completed !== undefined) {
      goals = goals.filter(goal => goal.completed === completed);
    }
    
    return goals;
  }
  
  async getCoachingGoalById(id: number): Promise<CoachingGoal | undefined> {
    return this.coachingGoals.get(id);
  }
  
  async createCoachingGoal(goal: InsertCoachingGoal): Promise<CoachingGoal> {
    const id = this.coachingGoalIdCounter++;
    const newGoal: CoachingGoal = { ...goal, id };
    this.coachingGoals.set(id, newGoal);
    return newGoal;
  }
  
  async updateCoachingGoal(id: number, goalUpdate: Partial<CoachingGoal>): Promise<CoachingGoal | undefined> {
    const existingGoal = this.coachingGoals.get(id);
    
    if (!existingGoal) {
      return undefined;
    }
    
    const updatedGoal = { ...existingGoal, ...goalUpdate };
    this.coachingGoals.set(id, updatedGoal);
    
    return updatedGoal;
  }
  
  async deleteCoachingGoal(id: number): Promise<boolean> {
    return this.coachingGoals.delete(id);
  }
  
  // Coaching Feedback operations
  async getCoachingFeedback(userId: number, acknowledged?: boolean): Promise<CoachingFeedback[]> {
    let feedback = Array.from(this.coachingFeedback.values()).filter(
      (fb) => fb.userId === userId
    );
    
    if (acknowledged !== undefined) {
      feedback = feedback.filter(fb => fb.acknowledged === acknowledged);
    }
    
    return feedback.sort((a, b) => 
      b.importance - a.importance || 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }
  
  async createCoachingFeedback(feedback: InsertCoachingFeedback): Promise<CoachingFeedback> {
    const id = this.coachingFeedbackIdCounter++;
    const newFeedback: CoachingFeedback = { ...feedback, id };
    this.coachingFeedback.set(id, newFeedback);
    return newFeedback;
  }
  
  async acknowledgeCoachingFeedback(id: number): Promise<CoachingFeedback | undefined> {
    const existingFeedback = this.coachingFeedback.get(id);
    
    if (!existingFeedback) {
      return undefined;
    }
    
    const updatedFeedback = { ...existingFeedback, acknowledged: true };
    this.coachingFeedback.set(id, updatedFeedback);
    
    return updatedFeedback;
  }
  
  async generateCoachingFeedback(userId: number): Promise<CoachingFeedback[]> {
    // Fetch user trades to analyze
    const userTrades = await this.getTrades(userId);
    
    if (userTrades.length === 0) {
      return [];
    }
    
    const feedback: CoachingFeedback[] = [];
    
    // Analyze trading patterns
    const setupCounts: Record<string, { total: number, wins: number }> = {};
    const trendCounts: Record<string, { total: number, wins: number }> = {};
    
    for (const trade of userTrades) {
      // Track setup statistics
      if (!setupCounts[trade.setup]) {
        setupCounts[trade.setup] = { total: 0, wins: 0 };
      }
      setupCounts[trade.setup].total++;
      if (trade.isWin) {
        setupCounts[trade.setup].wins++;
      }
      
      // Track trend statistics
      if (!trendCounts[trade.internalTrendM5]) {
        trendCounts[trade.internalTrendM5] = { total: 0, wins: 0 };
      }
      trendCounts[trade.internalTrendM5].total++;
      if (trade.isWin) {
        trendCounts[trade.internalTrendM5].wins++;
      }
    }
    
    // Find best and worst setups
    let bestSetup = '';
    let bestSetupWinRate = 0;
    let worstSetup = '';
    let worstSetupWinRate = 1;
    
    for (const [setup, stats] of Object.entries(setupCounts)) {
      if (stats.total >= 5) { // Only consider setups with enough data
        const winRate = stats.wins / stats.total;
        if (winRate > bestSetupWinRate) {
          bestSetupWinRate = winRate;
          bestSetup = setup;
        }
        if (winRate < worstSetupWinRate) {
          worstSetupWinRate = winRate;
          worstSetup = setup;
        }
      }
    }
    
    // Generate strategy feedback
    if (bestSetup && bestSetupWinRate > 0.6) {
      feedback.push({
        id: this.coachingFeedbackIdCounter++,
        userId,
        category: "strategy",
        message: `Dein Setup "${bestSetup}" zeigt eine starke Performance mit einer Win-Rate von ${Math.round(bestSetupWinRate * 100)}%. Fokussiere dich mehr auf dieses Setup.`,
        importance: 3,
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    if (worstSetup && worstSetupWinRate < 0.4) {
      feedback.push({
        id: this.coachingFeedbackIdCounter++,
        userId,
        category: "strategy",
        message: `Dein Setup "${worstSetup}" hat eine niedrige Win-Rate von ${Math.round(worstSetupWinRate * 100)}%. Überprüfe deine Einstiegskriterien oder vermeide dieses Setup.`,
        importance: 4,
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    // Analyze risk management
    const recentTrades = userTrades.slice(0, 20); // Consider last 20 trades
    const hasConsecutiveLosses = this.hasConsecutiveLosses(recentTrades, 3);
    const riskReward = this.calculateAverageRiskReward(recentTrades);
    
    if (hasConsecutiveLosses) {
      feedback.push({
        id: this.coachingFeedbackIdCounter++,
        userId,
        category: "psychology",
        message: "Du hast mehrere Verluste in Folge. Überdenke deine aktuelle Strategie und nimm dir Zeit, um dich zu erholen. Überhandle nicht.",
        importance: 5,
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    if (riskReward < 1.5) {
      feedback.push({
        id: this.coachingFeedbackIdCounter++,
        userId,
        category: "risk",
        message: `Dein durchschnittliches Risiko-Ertrags-Verhältnis von ${riskReward.toFixed(2)} ist zu niedrig. Strebe ein Verhältnis von mindestens 2:1 an.`,
        importance: 4,
        acknowledged: false,
        createdAt: new Date()
      });
    }
    
    // Save feedback
    for (const fb of feedback) {
      this.coachingFeedback.set(fb.id, fb);
    }
    
    return feedback;
  }
  
  // Helper methods for coaching feedback
  private hasConsecutiveLosses(trades: Trade[], count: number): boolean {
    let consecutiveLosses = 0;
    
    for (const trade of trades) {
      if (!trade.isWin) {
        consecutiveLosses++;
        if (consecutiveLosses >= count) {
          return true;
        }
      } else {
        consecutiveLosses = 0;
      }
    }
    
    return false;
  }
  
  private calculateAverageRiskReward(trades: Trade[]): number {
    if (trades.length === 0) {
      return 0;
    }
    
    const totalRR = trades.reduce((sum, trade) => sum + trade.rrAchieved, 0);
    return totalRR / trades.length;
  }
  
  // Macroeconomic Events operations
  async getMacroEconomicEvents(startDate: Date, endDate: Date): Promise<MacroEconomicEvent[]> {
    let events = Array.from(this.macroEconomicEvents.values());
    
    events = events.filter(
      (event) => event.date >= startDate && event.date <= endDate
    );
    
    return events.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  async getMacroEconomicEventById(id: number): Promise<MacroEconomicEvent | undefined> {
    return this.macroEconomicEvents.get(id);
  }
  
  async createMacroEconomicEvent(event: InsertMacroEconomicEvent): Promise<MacroEconomicEvent> {
    const id = this.macroEconomicEventIdCounter++;
    const newEvent: MacroEconomicEvent = { ...event, id };
    this.macroEconomicEvents.set(id, newEvent);
    return newEvent;
  }
  
  async updateMacroEconomicEvent(id: number, eventUpdate: Partial<MacroEconomicEvent>): Promise<MacroEconomicEvent | undefined> {
    const existingEvent = this.macroEconomicEvents.get(id);
    
    if (!existingEvent) {
      return undefined;
    }
    
    const updatedEvent = { ...existingEvent, ...eventUpdate };
    this.macroEconomicEvents.set(id, updatedEvent);
    
    return updatedEvent;
  }
  
  async deleteMacroEconomicEvent(id: number): Promise<boolean> {
    return this.macroEconomicEvents.delete(id);
  }
  
  // Trading Strategies operations
  async getTradingStrategies(userId?: number, publicOnly?: boolean): Promise<TradingStrategy[]> {
    let strategies = Array.from(this.tradingStrategies.values());
    
    if (userId !== undefined) {
      strategies = strategies.filter(strategy => 
        strategy.userId === userId || (publicOnly && strategy.public)
      );
    } else if (publicOnly) {
      strategies = strategies.filter(strategy => strategy.public);
    }
    
    return strategies.sort((a, b) => b.rating - a.rating);
  }
  
  async getTradingStrategyById(id: number): Promise<TradingStrategy | undefined> {
    return this.tradingStrategies.get(id);
  }
  
  async createTradingStrategy(strategy: InsertTradingStrategy): Promise<TradingStrategy> {
    const id = this.tradingStrategyIdCounter++;
    const newStrategy: TradingStrategy = { 
      ...strategy, 
      id, 
      rating: 0, 
      ratingCount: 0, 
      createdAt: new Date(), 
      updatedAt: new Date() 
    };
    this.tradingStrategies.set(id, newStrategy);
    return newStrategy;
  }
  
  async updateTradingStrategy(id: number, strategyUpdate: Partial<TradingStrategy>): Promise<TradingStrategy | undefined> {
    const existingStrategy = this.tradingStrategies.get(id);
    
    if (!existingStrategy) {
      return undefined;
    }
    
    const updatedStrategy = { 
      ...existingStrategy, 
      ...strategyUpdate, 
      updatedAt: new Date() 
    };
    this.tradingStrategies.set(id, updatedStrategy);
    
    return updatedStrategy;
  }
  
  async deleteTradingStrategy(id: number): Promise<boolean> {
    // Also delete associated comments
    const commentsToDelete = Array.from(this.strategyComments.values())
      .filter(comment => comment.strategyId === id);
    
    for (const comment of commentsToDelete) {
      this.strategyComments.delete(comment.id);
    }
    
    return this.tradingStrategies.delete(id);
  }
  
  // Strategy Comments operations
  async getStrategyComments(strategyId: number): Promise<StrategyComment[]> {
    const comments = Array.from(this.strategyComments.values())
      .filter(comment => comment.strategyId === strategyId);
    
    return comments.sort((a, b) => 
      new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
    );
  }
  
  async createStrategyComment(comment: InsertStrategyComment): Promise<StrategyComment> {
    const id = this.strategyCommentIdCounter++;
    const newComment: StrategyComment = { 
      ...comment, 
      id, 
      createdAt: new Date()
    };
    this.strategyComments.set(id, newComment);
    return newComment;
  }
  
  async deleteStrategyComment(id: number): Promise<boolean> {
    return this.strategyComments.delete(id);
  }
  
  // App Settings operations
  async getAppSettings(userId: number, deviceId?: string): Promise<AppSettings | undefined> {
    console.log(`getAppSettings für userId ${userId} und deviceId ${deviceId || 'nicht angegeben'}`);
    
    const userSettings = Array.from(this.appSettings.values())
      .filter(settings => settings.userId === userId);
    
    console.log(`Gefundene Einstellungen für userId ${userId}: ${userSettings.length}`);
    
    if (userSettings.length === 0) {
      console.log(`Keine Einstellungen für userId ${userId} gefunden`);
      return undefined;
    }
    
    if (deviceId) {
      const deviceSettings = userSettings.find(settings => settings.deviceId === deviceId);
      console.log(`Geräte-spezifische Einstellungen ${deviceSettings ? 'gefunden' : 'nicht gefunden'}`);
      return deviceSettings;
    }
    
    // Return the most recently synced settings
    const sortedSettings = userSettings.sort((a, b) => 
      new Date(b.lastSyncedAt || new Date()).getTime() - new Date(a.lastSyncedAt || new Date()).getTime()
    );
    
    console.log(`Neueste Einstellungen für userId ${userId} zurückgegeben:`, sortedSettings[0]);
    return sortedSettings[0];
  }
  
  async createAppSettings(settings: InsertAppSettings): Promise<AppSettings> {
    const id = this.appSettingsIdCounter++;
    const newSettings: AppSettings = { 
      ...settings, 
      id,
      lastSyncedAt: new Date()
    };
    this.appSettings.set(id, newSettings);
    return newSettings;
  }
  
  async updateAppSettings(id: number, settingsUpdate: Partial<AppSettings>): Promise<AppSettings | undefined> {
    const existingSettings = this.appSettings.get(id);
    
    if (!existingSettings) {
      return undefined;
    }
    
    const updatedSettings = { 
      ...existingSettings, 
      ...settingsUpdate,
      lastSyncedAt: new Date()
    };
    this.appSettings.set(id, updatedSettings);
    
    return updatedSettings;
  }
  
  async syncAppSettings(userId: number, deviceId: string): Promise<AppSettings | undefined> {
    console.log(`syncAppSettings aufgerufen für userId ${userId} und deviceId ${deviceId}`);
    
    // Find settings for this device
    const deviceSettings = await this.getAppSettings(userId, deviceId);
    
    if (!deviceSettings) {
      console.log(`Keine Einstellungen für diese Geräte-ID gefunden, erstelle neue Einstellungen`);
      return this.createAppSettings({
        userId,
        deviceId,
        theme: 'dark',
        notifications: true,
        goalBalance: 7500,
        evaAccountBalance: 1500,
        accountBalance: 0,
      });
    }
    
    // Find most up-to-date settings across all devices
    const latestSettings = await this.getAppSettings(userId);
    
    if (!latestSettings || latestSettings.id === deviceSettings.id) {
      console.log(`Keine neueren Einstellungen gefunden, verwende aktuelle Geräteeinstellungen`);
      return deviceSettings;
    }
    
    // Sync settings from latest to this device
    const updatedSettings = await this.updateAppSettings(deviceSettings.id, {
      theme: latestSettings.theme,
      notifications: latestSettings.notifications
    });
    
    return updatedSettings;
  }

  constructor() {
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    // Initialisiere alle Maps korrekt (ohne Duplikate)
    this.users = new Map();
    this.trades = new Map();
    this.weeklySummaries = new Map();
    this.performanceData = new Map();
    this.setupWinRates = new Map();
    this.coachingGoals = new Map();
    this.coachingFeedback = new Map();
    this.macroEconomicEvents = new Map();
    this.tradingStrategies = new Map();
    this.strategyComments = new Map();
    this.appSettings = new Map();
    this.tradingStreaks = new Map();
    
    // Initialisiere alle Zähler
    this.userIdCounter = 1;
    this.tradeIdCounter = 1;
    this.summaryIdCounter = 1;
    this.performanceIdCounter = 1;
    this.setupWinRateIdCounter = 1;
    this.coachingGoalIdCounter = 1;
    this.coachingFeedbackIdCounter = 1;
    this.macroEconomicEventIdCounter = 1;
    this.tradingStrategyIdCounter = 1;
    this.strategyCommentIdCounter = 1;
    this.appSettingsIdCounter = 1;
    this.tradingStreakIdCounter = 1;
    
    console.log("MemStorage initialisiert - Map-Instanzen erstellt und Zähler gesetzt");
  }
  
  // Trading Streak Methoden
  async getTradingStreak(userId: number): Promise<TradingStreak | undefined> {
    return Array.from(this.tradingStreaks.values()).find(
      (streak) => streak.userId === userId
    );
  }

  async createTradingStreak(streak: InsertTradingStreak & { userId: number }): Promise<TradingStreak> {
    const id = this.tradingStreakIdCounter++;
    
    // Standardwerte hinzufügen, falls nicht definiert
    const newStreak: TradingStreak = {
      id,
      userId: streak.userId,
      currentStreak: streak.currentStreak || 0,
      longestStreak: streak.longestStreak || 0,
      currentLossStreak: streak.currentLossStreak || 0,
      longestLossStreak: streak.longestLossStreak || 0,
      totalTrades: streak.totalTrades || 0,
      totalWins: streak.totalWins || 0,
      lastTradeDate: streak.lastTradeDate || new Date(),
      lastUpdated: new Date(),
      streakLevel: streak.streakLevel || 1,
      experiencePoints: streak.experiencePoints || 0,
      badges: streak.badges || []
    };
    
    this.tradingStreaks.set(id, newStreak);
    return newStreak;
  }

  async updateTradingStreak(userId: number, streakUpdate: Partial<TradingStreak>): Promise<TradingStreak | undefined> {
    const existingStreak = await this.getTradingStreak(userId);
    
    if (!existingStreak) {
      return undefined;
    }
    
    const updatedStreak = { 
      ...existingStreak, 
      ...streakUpdate,
      lastUpdated: new Date()
    };
    
    this.tradingStreaks.set(existingStreak.id, updatedStreak);
    return updatedStreak;
  }

  async updateStreakOnTradeResult(userId: number, isWin: boolean): Promise<TradingStreak> {
    let streak = await this.getTradingStreak(userId);
    
    // Erstelle einen neuen Streak-Eintrag, falls noch keiner existiert
    if (!streak) {
      streak = await this.createTradingStreak({
        userId,
        currentStreak: 0,
        longestStreak: 0,
        currentLossStreak: 0,
        longestLossStreak: 0,
        totalTrades: 0,
        totalWins: 0,
        lastTradeDate: new Date(),
        streakLevel: 1,
        experiencePoints: 0,
        badges: []
      });
    }
    
    // Aktualisiere den Streak basierend auf dem Handelsergebnis
    const updatedStreak = { ...streak };
    updatedStreak.totalTrades += 1;
    updatedStreak.lastTradeDate = new Date();
    
    if (isWin) {
      // Gewinn-Fall
      updatedStreak.totalWins += 1;
      updatedStreak.currentStreak += 1;
      updatedStreak.currentLossStreak = 0;
      updatedStreak.experiencePoints += 10; // Basispunkte für einen Gewinn
      
      // Bonuspunkte für Streak-Fortsetzung
      if (updatedStreak.currentStreak > 1) {
        updatedStreak.experiencePoints += Math.min(updatedStreak.currentStreak * 2, 20); // Max 20 Bonuspunkte
      }
      
      // Aktualisiere längste Gewinnsträhne
      if (updatedStreak.currentStreak > updatedStreak.longestStreak) {
        updatedStreak.longestStreak = updatedStreak.currentStreak;
        
        // Prüfe Streak-Badges
        if (updatedStreak.longestStreak >= 5 && !updatedStreak.badges.includes("winning_streak_5")) {
          updatedStreak.badges.push("winning_streak_5");
          updatedStreak.experiencePoints += 50;
        }
        
        if (updatedStreak.longestStreak >= 10 && !updatedStreak.badges.includes("winning_streak_10")) {
          updatedStreak.badges.push("winning_streak_10");
          updatedStreak.experiencePoints += 100;
        }
        
        if (updatedStreak.longestStreak >= 20 && !updatedStreak.badges.includes("winning_streak_20")) {
          updatedStreak.badges.push("winning_streak_20");
          updatedStreak.experiencePoints += 200;
        }
      }
    } else {
      // Verlust-Fall
      updatedStreak.currentStreak = 0;
      updatedStreak.currentLossStreak += 1;
      
      // Aktualisiere längste Verluststrähne
      if (updatedStreak.currentLossStreak > updatedStreak.longestLossStreak) {
        updatedStreak.longestLossStreak = updatedStreak.currentLossStreak;
      }
      
      // Comeback King Badge - Nach einer Verluststrähne von 3 oder mehr folgt ein Gewinn
      if (updatedStreak.currentLossStreak >= 3 && isWin && !updatedStreak.badges.includes("comeback_king")) {
        updatedStreak.badges.push("comeback_king");
        updatedStreak.experiencePoints += 75;
      }
    }
    
    // Erster Trade Badge
    if (updatedStreak.totalTrades === 1 && !updatedStreak.badges.includes("first_trade")) {
      updatedStreak.badges.push("first_trade");
      updatedStreak.experiencePoints += 25;
    }
    
    // Trade Master Badges
    if (updatedStreak.totalTrades >= 50 && !updatedStreak.badges.includes("trade_master_50")) {
      updatedStreak.badges.push("trade_master_50");
      updatedStreak.experiencePoints += 100;
    }
    
    if (updatedStreak.totalTrades >= 100 && !updatedStreak.badges.includes("trade_master_100")) {
      updatedStreak.badges.push("trade_master_100");
      updatedStreak.experiencePoints += 200;
    }
    
    // Berechne das Streak-Level (steigt alle 100 XP)
    updatedStreak.streakLevel = Math.floor(updatedStreak.experiencePoints / 100) + 1;
    
    // Speichere den aktualisierten Streak
    return this.updateTradingStreak(userId, updatedStreak) as Promise<TradingStreak>;
  }

  async getTopStreaks(): Promise<TradingStreak[]> {
    // Sortiere nach höchstem Streak und längster Strähne
    return Array.from(this.tradingStreaks.values())
      .sort((a, b) => b.longestStreak - a.longestStreak || b.currentStreak - a.currentStreak || b.experiencePoints - a.experiencePoints);
  }

  async earnBadge(userId: number, badgeType: typeof badgeTypes[number]): Promise<TradingStreak | undefined> {
    const existingStreak = await this.getTradingStreak(userId);
    
    if (!existingStreak) {
      return undefined;
    }
    
    // Prüfe, ob das Badge bereits vorhanden ist
    if (existingStreak.badges.includes(badgeType)) {
      return existingStreak; // Keine Änderung, wenn das Badge bereits vorhanden ist
    }
    
    // Füge das neue Badge hinzu
    const updatedBadges = [...existingStreak.badges, badgeType];
    
    // Füge XP basierend auf Badge-Typ hinzu
    let additionalXP = 0;
    
    switch (badgeType) {
      case "winning_streak_5":
        additionalXP = 50;
        break;
      case "winning_streak_10":
        additionalXP = 100;
        break;
      case "winning_streak_20":
        additionalXP = 200;
        break;
      case "perfect_week":
        additionalXP = 150;
        break;
      case "comeback_king":
        additionalXP = 75;
        break;
      case "first_trade":
        additionalXP = 25;
        break;
      case "trade_master_50":
        additionalXP = 100;
        break;
      case "trade_master_100":
        additionalXP = 200;
        break;
      default:
        additionalXP = 10;
    }
    
    // Aktualisiere Streak mit neuem Badge und XP
    const updatedStreak = { 
      ...existingStreak,
      badges: updatedBadges,
      experiencePoints: existingStreak.experiencePoints + additionalXP,
      streakLevel: Math.floor((existingStreak.experiencePoints + additionalXP) / 100) + 1,
      lastUpdated: new Date()
    };
    
    this.tradingStreaks.set(existingStreak.id, updatedStreak);
    return updatedStreak;
  }

  // User methods
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    
    if (!existingUser) {
      return undefined;
    }
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    
    return updatedUser;
  }

  // Trade methods
  async getTrades(userId: number, filters?: Partial<Trade>): Promise<Trade[]> {
    let userTrades = Array.from(this.trades.values()).filter(
      (trade) => trade.userId === userId
    );
    
    console.log("MemStorage getTrades - Initial trade count for userId", userId, ":", userTrades.length);
    
    if (filters) {
      console.log("MemStorage getTrades - Filters applied:", JSON.stringify(filters));
      
      // Spezieller Umgang mit Datums-Filtern
      if (filters.startDate || filters.endDate) {
        const startDate = filters.startDate ? new Date(filters.startDate as any) : null;
        const endDate = filters.endDate ? new Date(filters.endDate as any) : null;
        
        console.log("Date filters:", { startDate, endDate });
        
        // Standardfilter fürs Datum (nicht anwenden, speziell behandeln)
        delete filters.startDate;
        delete filters.endDate;
      }
      
      // userId aus Filter entfernen, da wir bereits nach userId gefiltert haben
      const { userId: filterUserId, ...otherFilters } = filters;
      
      // Debug für userId Filter-Problem
      if (filterUserId) {
        console.log(`Filter enthält userId=${filterUserId}, entferne diesen Filter, da bereits nach userId=${userId} gefiltert wurde`);
      }
      
      // Standard-Filter-Ansatz
      userTrades = userTrades.filter(trade => {
        for (const [key, value] of Object.entries(otherFilters)) {
          // Wenn Wert nicht leer ist und nicht mit dem Trade-Wert übereinstimmt
          if (value !== undefined && value !== null && value !== '' && trade[key as keyof Trade] !== value) {
            // Spezielle Typbehandlung für numerische Werte
            if (typeof trade[key as keyof Trade] === 'number' && !isNaN(Number(value))) {
              if (Number(trade[key as keyof Trade]) !== Number(value)) {
                return false;
              }
            } else {
              return false;
            }
          }
        }
        return true;
      });
    }
    
    const sortedTrades = userTrades.sort((a, b) => {
      // Safer date parsing
      let dateA, dateB;
      try {
        dateA = new Date(b.date);
        dateB = new Date(a.date);
      } catch (e) {
        console.error("Date parsing error:", e);
        return 0;
      }
      return dateA.getTime() - dateB.getTime();
    });
    
    console.log("MemStorage getTrades - Final filtered trade count:", sortedTrades.length);
    
    return sortedTrades;
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async createTrade(trade: InsertTrade & { userId: number }): Promise<Trade> {
    const id = this.tradeIdCounter++;
    // Standardwerte setzen, falls nicht vorhanden
    const newTrade: Trade = { 
      symbol: "",
      setup: "",
      mainTrendM15: "",
      internalTrendM5: "",
      entryType: "",
      entryLevel: "",
      liquidation: "",
      location: "",
      rrAchieved: 0,
      rrPotential: 0,
      isWin: false,
      profitLoss: 0,
      // Wichtig: Hier setzen wir keinen Standardwert für rangePoints, damit undefined-Werte nicht zu 0 werden
      id,
      date: trade.date ? new Date(trade.date) : new Date(),
      gptFeedback: trade.gptFeedback || ""
    };
    
    // Wir fügen die übergebenen Trade-Daten hinzu, aber nur wenn sie nicht undefined sind
    for (const key of Object.keys(trade)) {
      if (trade[key as keyof typeof trade] !== undefined) {
        (newTrade as any)[key] = trade[key as keyof typeof trade];
      }
    }
    
    this.trades.set(id, newTrade);
    
    // Update statistics after adding a trade
    const monday = new Date(newTrade.date);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    await this.calculateWeeklySummary(trade.userId, monday, sunday);
    await this.calculateSetupWinRates(trade.userId);
    
    // Aktualisiere auch den Trading Streak basierend auf dem Handelsergebnis
    if (newTrade.isWin !== undefined) {
      await this.updateStreakOnTradeResult(trade.userId, newTrade.isWin);
    }
    
    return newTrade;
  }

  async updateTrade(id: number, tradeUpdate: Partial<Trade>): Promise<Trade | undefined> {
    const existingTrade = this.trades.get(id);
    
    if (!existingTrade) {
      return undefined;
    }
    
    // Beim Aktualisieren müssen wir sicherstellen, dass undefined-Werte korrekt behandelt werden
    // Insbesondere bei rangePoints wollen wir vermeiden, dass es auf 0 zurückgesetzt wird
    const updatedTrade = { ...existingTrade };
    
    // Nur die Felder kopieren, die in tradeUpdate nicht undefined sind
    Object.keys(tradeUpdate).forEach(key => {
      if (tradeUpdate[key as keyof Partial<Trade>] !== undefined) {
        updatedTrade[key as keyof Trade] = tradeUpdate[key as keyof Partial<Trade>] as any;
      }
    });
    
    this.trades.set(id, updatedTrade);
    
    // Update statistics after updating a trade
    const monday = new Date(updatedTrade.date);
    monday.setDate(monday.getDate() - monday.getDay() + 1);
    monday.setHours(0, 0, 0, 0);
    
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);
    
    await this.calculateWeeklySummary(updatedTrade.userId, monday, sunday);
    await this.calculateSetupWinRates(updatedTrade.userId);
    
    // Wenn sich der isWin-Status geändert hat, müssen wir den Trading Streak aktualisieren
    if (tradeUpdate.isWin !== undefined && tradeUpdate.isWin !== existingTrade.isWin) {
      await this.updateStreakOnTradeResult(updatedTrade.userId, tradeUpdate.isWin);
    }
    
    return updatedTrade;
  }

  async deleteTrade(id: number): Promise<boolean> {
    const trade = this.trades.get(id);
    
    if (!trade) {
      return false;
    }
    
    const userId = trade.userId;
    const success = this.trades.delete(id);
    
    if (success) {
      // Update statistics after deleting a trade
      const monday = new Date(trade.date);
      monday.setDate(monday.getDate() - monday.getDay() + 1);
      monday.setHours(0, 0, 0, 0);
      
      const sunday = new Date(monday);
      sunday.setDate(sunday.getDate() + 6);
      sunday.setHours(23, 59, 59, 999);
      
      await this.calculateWeeklySummary(userId, monday, sunday);
      await this.calculateSetupWinRates(userId);
      
      // Da ein Trade gelöscht wurde, sollten wir die Streak überprüfen und aktualisieren
      const streak = await this.getTradingStreak(userId);
      if (streak) {
        // Hier könnten wir potentiell die Streak neu berechnen, aber für jetzt
        // werden wir keine automatische Anpassung vornehmen und der Benutzer kann sie manuell anpassen
        // Es ist schwierig zu bestimmen, ob der gelöschte Trade Teil der aktuellen Streak war
      }
    }
    
    return success;
  }

  // Weekly summary methods
  async getWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<WeeklySummary | undefined> {
    return Array.from(this.weeklySummaries.values()).find(
      (summary) => 
        summary.userId === userId && 
        summary.weekStart.getTime() === weekStart.getTime() &&
        summary.weekEnd.getTime() === weekEnd.getTime()
    );
  }

  async createWeeklySummary(summary: InsertWeeklySummary & { userId: number }): Promise<WeeklySummary> {
    const id = this.summaryIdCounter++;
    const newSummary: WeeklySummary = { ...summary, id };
    
    // Check if summary already exists and update instead
    const existingSummary = await this.getWeeklySummary(summary.userId, summary.weekStart, summary.weekEnd);
    
    if (existingSummary) {
      return this.updateWeeklySummary(existingSummary.id, summary) as Promise<WeeklySummary>;
    }
    
    this.weeklySummaries.set(id, newSummary);
    return newSummary;
  }

  async updateWeeklySummary(id: number, summaryUpdate: Partial<WeeklySummary>): Promise<WeeklySummary | undefined> {
    const existingSummary = this.weeklySummaries.get(id);
    
    if (!existingSummary) {
      return undefined;
    }
    
    const updatedSummary = { ...existingSummary, ...summaryUpdate };
    this.weeklySummaries.set(id, updatedSummary);
    
    return updatedSummary;
  }

  // Performance data methods
  async getPerformanceData(userId: number, startDate?: Date, endDate?: Date): Promise<PerformanceData[]> {
    let userPerformanceData = Array.from(this.performanceData.values()).filter(
      (data) => data.userId === userId
    );
    
    if (startDate) {
      userPerformanceData = userPerformanceData.filter(
        (data) => new Date(data.date) >= startDate
      );
    }
    
    if (endDate) {
      userPerformanceData = userPerformanceData.filter(
        (data) => new Date(data.date) <= endDate
      );
    }
    
    return userPerformanceData.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }

  async createPerformanceData(data: InsertPerformanceData & { userId: number }): Promise<PerformanceData> {
    const id = this.performanceIdCounter++;
    const newData: PerformanceData = { ...data, id };
    
    // Check if data for this date already exists
    const existingData = Array.from(this.performanceData.values()).find(
      (pd) => 
        pd.userId === data.userId && 
        new Date(pd.date).toDateString() === new Date(data.date).toDateString()
    );
    
    if (existingData) {
      // Update existing data
      this.performanceData.set(existingData.id, { ...existingData, performance: data.performance });
      return { ...existingData, performance: data.performance };
    }
    
    this.performanceData.set(id, newData);
    return newData;
  }

  // Setup win rate methods
  async getSetupWinRates(userId: number): Promise<SetupWinRate[]> {
    return Array.from(this.setupWinRates.values()).filter(
      (rate) => rate.userId === userId
    );
  }

  async updateSetupWinRate(userId: number, setup: string, winRate: number): Promise<SetupWinRate> {
    const existingRate = Array.from(this.setupWinRates.values()).find(
      (rate) => rate.userId === userId && rate.setup === setup
    );
    
    if (existingRate) {
      // Update existing rate
      const updatedRate = { ...existingRate, winRate };
      this.setupWinRates.set(existingRate.id, updatedRate);
      return updatedRate;
    }
    
    // Create new rate
    const id = this.setupWinRateIdCounter++;
    const newRate: SetupWinRate = { id, userId, setup, winRate };
    this.setupWinRates.set(id, newRate);
    return newRate;
  }

  // Statistics calculation methods
  async calculateWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<InsertWeeklySummary & { userId: number }> {
    const weekTrades = await this.getTrades(userId);
    
    // Filter trades within the week
    const tradesInWeek = weekTrades.filter(
      (trade) => new Date(trade.date) >= weekStart && new Date(trade.date) <= weekEnd
    );
    
    const tradeCount = tradesInWeek.length;
    
    if (tradeCount === 0) {
      const emptySummary = {
        weekStart,
        weekEnd,
        totalRR: 0,
        tradeCount: 0,
        winRate: 0,
        userId
      };
      
      await this.createWeeklySummary(emptySummary);
      return emptySummary;
    }
    
    // Calculate total RR
    const totalRR = tradesInWeek.reduce((sum, trade) => sum + trade.rrAchieved, 0);
    
    // Calculate win rate
    const winCount = tradesInWeek.filter(trade => trade.isWin).length;
    const winRate = (winCount / tradeCount) * 100;
    
    const summary = {
      weekStart,
      weekEnd,
      totalRR,
      tradeCount,
      winRate,
      userId
    };
    
    await this.createWeeklySummary(summary);
    
    // Update performance data
    const days = [];
    let currentDay = new Date(weekStart);
    
    while (currentDay <= weekEnd) {
      days.push(new Date(currentDay));
      currentDay.setDate(currentDay.getDate() + 1);
    }
    
    let cumulativeRR = 0;
    
    for (const day of days) {
      const endOfDay = new Date(day);
      endOfDay.setHours(23, 59, 59, 999);
      
      const tradesOnDay = tradesInWeek.filter(
        (trade) => new Date(trade.date) <= endOfDay
      );
      
      if (tradesOnDay.length > 0) {
        cumulativeRR = tradesOnDay.reduce((sum, trade) => sum + trade.rrAchieved, 0);
      }
      
      await this.createPerformanceData({
        date: day,
        performance: cumulativeRR,
        userId
      });
    }
    
    return summary;
  }

  async calculateSetupWinRates(userId: number): Promise<void> {
    const userTrades = await this.getTrades(userId);
    
    // Get unique setups
    const setups = [...new Set(userTrades.map(trade => trade.setup))];
    
    for (const setup of setups) {
      const setupTrades = userTrades.filter(trade => trade.setup === setup);
      const tradeCount = setupTrades.length;
      
      if (tradeCount > 0) {
        const winCount = setupTrades.filter(trade => trade.isWin).length;
        const winRate = (winCount / tradeCount) * 100;
        
        await this.updateSetupWinRate(userId, setup, winRate);
      }
    }
  }
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // Trade operations
  async getTrades(userId: number, filters?: Partial<Trade>): Promise<Trade[]> {
    let query = db.select().from(trades).where(eq(trades.userId, userId));
    
    if (filters) {
      if (filters.setup) {
        query = query.where(eq(trades.setup, filters.setup));
      }
      if (filters.trend) {
        query = query.where(eq(trades.trend, filters.trend));
      }
      if (filters.session) {
        query = query.where(eq(trades.session, filters.session));
      }
      if (filters.isWin !== undefined) {
        query = query.where(eq(trades.isWin, filters.isWin));
      }
      if (filters.accountType) {
        query = query.where(eq(trades.accountType, filters.accountType));
      }
    }
    
    const results = await query.orderBy(desc(trades.date));
    return results;
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    const [trade] = await db.select().from(trades).where(eq(trades.id, id));
    return trade;
  }

  async createTrade(trade: InsertTrade & { userId: number }): Promise<Trade> {
    const [newTrade] = await db.insert(trades).values(trade).returning();
    return newTrade;
  }

  async updateTrade(id: number, tradeUpdate: Partial<Trade>): Promise<Trade | undefined> {
    const [updatedTrade] = await db
      .update(trades)
      .set(tradeUpdate)
      .where(eq(trades.id, id))
      .returning();
    return updatedTrade;
  }

  async deleteTrade(id: number): Promise<boolean> {
    const result = await db.delete(trades).where(eq(trades.id, id)).returning({ id: trades.id });
    return result.length > 0;
  }

  // Weekly summary operations
  async getWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<WeeklySummary | undefined> {
    const [summary] = await db
      .select()
      .from(weeklySummaries)
      .where(
        and(
          eq(weeklySummaries.userId, userId),
          eq(weeklySummaries.weekStart, weekStart),
          eq(weeklySummaries.weekEnd, weekEnd)
        )
      );
    return summary;
  }

  async createWeeklySummary(summary: InsertWeeklySummary & { userId: number }): Promise<WeeklySummary> {
    const [newSummary] = await db.insert(weeklySummaries).values(summary).returning();
    return newSummary;
  }

  async updateWeeklySummary(id: number, summaryUpdate: Partial<WeeklySummary>): Promise<WeeklySummary | undefined> {
    const [updatedSummary] = await db
      .update(weeklySummaries)
      .set(summaryUpdate)
      .where(eq(weeklySummaries.id, id))
      .returning();
    return updatedSummary;
  }

  // Performance data operations
  async getPerformanceData(userId: number, startDate?: Date, endDate?: Date): Promise<PerformanceData[]> {
    let query = db.select().from(performanceData).where(eq(performanceData.userId, userId));
    
    if (startDate && endDate) {
      query = query.where(
        between(performanceData.date, startDate, endDate)
      );
    }
    
    const results = await query.orderBy(asc(performanceData.date));
    return results;
  }

  async createPerformanceData(data: InsertPerformanceData & { userId: number }): Promise<PerformanceData> {
    const [newData] = await db.insert(performanceData).values(data).returning();
    return newData;
  }

  // Setup win rate operations
  async getSetupWinRates(userId: number): Promise<SetupWinRate[]> {
    const results = await db
      .select()
      .from(setupWinRates)
      .where(eq(setupWinRates.userId, userId));
    return results;
  }

  async updateSetupWinRate(userId: number, setup: string, winRate: number): Promise<SetupWinRate> {
    const [existingRate] = await db
      .select()
      .from(setupWinRates)
      .where(
        and(
          eq(setupWinRates.userId, userId),
          eq(setupWinRates.setup, setup)
        )
      );
    
    if (existingRate) {
      const [updatedRate] = await db
        .update(setupWinRates)
        .set({ winRate })
        .where(eq(setupWinRates.id, existingRate.id))
        .returning();
      return updatedRate;
    } else {
      const [newRate] = await db
        .insert(setupWinRates)
        .values({ userId, setup, winRate })
        .returning();
      return newRate;
    }
  }

  // Statistics operations
  async calculateWeeklySummary(userId: number, weekStart: Date, weekEnd: Date): Promise<InsertWeeklySummary & { userId: number }> {
    const tradesInWeek = await db
      .select()
      .from(trades)
      .where(
        and(
          eq(trades.userId, userId),
          between(trades.date, weekStart, weekEnd)
        )
      );
    
    const totalRR = tradesInWeek.reduce((sum, trade) => sum + (trade.rrAchieved || 0), 0);
    const tradeCount = tradesInWeek.length;
    const winCount = tradesInWeek.filter(trade => trade.isWin).length;
    const winRate = tradeCount > 0 ? winCount / tradeCount : 0;
    
    return {
      weekStart,
      weekEnd,
      totalRR,
      tradeCount,
      winRate,
      userId
    };
  }

  async calculateSetupWinRates(userId: number): Promise<void> {
    const allTrades = await this.getTrades(userId);
    
    const setupStats: Record<string, { wins: number, total: number }> = {};
    
    for (const trade of allTrades) {
      if (!trade.setup) continue;
      
      if (!setupStats[trade.setup]) {
        setupStats[trade.setup] = { wins: 0, total: 0 };
      }
      
      setupStats[trade.setup].total++;
      
      if (trade.isWin) {
        setupStats[trade.setup].wins++;
      }
    }
    
    for (const [setup, stats] of Object.entries(setupStats)) {
      if (stats.total >= 3) { // Only consider setups with enough data
        const winRate = stats.wins / stats.total;
        await this.updateSetupWinRate(userId, setup, winRate);
      }
    }
  }

  // Coaching Goals operations
  async getCoachingGoals(userId: number, completed?: boolean): Promise<CoachingGoal[]> {
    let query = db.select().from(coachingGoals).where(eq(coachingGoals.userId, userId));
    
    if (completed !== undefined) {
      query = query.where(eq(coachingGoals.completed, completed));
    }
    
    return await query;
  }

  async getCoachingGoalById(id: number): Promise<CoachingGoal | undefined> {
    const [goal] = await db.select().from(coachingGoals).where(eq(coachingGoals.id, id));
    return goal;
  }

  async createCoachingGoal(goal: InsertCoachingGoal): Promise<CoachingGoal> {
    const [newGoal] = await db.insert(coachingGoals).values(goal).returning();
    return newGoal;
  }

  async updateCoachingGoal(id: number, goalUpdate: Partial<CoachingGoal>): Promise<CoachingGoal | undefined> {
    const [updatedGoal] = await db
      .update(coachingGoals)
      .set(goalUpdate)
      .where(eq(coachingGoals.id, id))
      .returning();
    return updatedGoal;
  }

  async deleteCoachingGoal(id: number): Promise<boolean> {
    const result = await db.delete(coachingGoals).where(eq(coachingGoals.id, id)).returning({ id: coachingGoals.id });
    return result.length > 0;
  }

  // Coaching Feedback operations
  async getCoachingFeedback(userId: number, acknowledged?: boolean): Promise<CoachingFeedback[]> {
    let query = db.select().from(coachingFeedback).where(eq(coachingFeedback.userId, userId));
    
    if (acknowledged !== undefined) {
      query = query.where(eq(coachingFeedback.acknowledged, acknowledged));
    }
    
    return await query.orderBy(desc(coachingFeedback.importance), desc(coachingFeedback.createdAt));
  }

  async createCoachingFeedback(feedback: InsertCoachingFeedback): Promise<CoachingFeedback> {
    const [newFeedback] = await db.insert(coachingFeedback).values(feedback).returning();
    return newFeedback;
  }

  async acknowledgeCoachingFeedback(id: number): Promise<CoachingFeedback | undefined> {
    const [updatedFeedback] = await db
      .update(coachingFeedback)
      .set({ acknowledged: true })
      .where(eq(coachingFeedback.id, id))
      .returning();
    return updatedFeedback;
  }

  async generateCoachingFeedback(userId: number): Promise<CoachingFeedback[]> {
    // Fetch user trades to analyze
    const userTrades = await this.getTrades(userId);
    
    if (userTrades.length === 0) {
      return [];
    }
    
    const feedback: CoachingFeedback[] = [];
    
    // Analyze trading patterns
    const setupCounts: Record<string, { total: number, wins: number }> = {};
    const trendCounts: Record<string, { total: number, wins: number }> = {};
    
    for (const trade of userTrades) {
      // Track setup statistics
      if (trade.setup) {
        if (!setupCounts[trade.setup]) {
          setupCounts[trade.setup] = { total: 0, wins: 0 };
        }
        setupCounts[trade.setup].total++;
        if (trade.isWin) {
          setupCounts[trade.setup].wins++;
        }
      }
      
      // Track trend statistics
      if (trade.internalTrendM5) {
        if (!trendCounts[trade.internalTrendM5]) {
          trendCounts[trade.internalTrendM5] = { total: 0, wins: 0 };
        }
        trendCounts[trade.internalTrendM5].total++;
        if (trade.isWin) {
          trendCounts[trade.internalTrendM5].wins++;
        }
      }
    }
    
    // Find best and worst setups
    let bestSetup = '';
    let bestSetupWinRate = 0;
    let worstSetup = '';
    let worstSetupWinRate = 1;
    
    for (const [setup, stats] of Object.entries(setupCounts)) {
      if (stats.total >= 5) { // Only consider setups with enough data
        const winRate = stats.wins / stats.total;
        if (winRate > bestSetupWinRate) {
          bestSetupWinRate = winRate;
          bestSetup = setup;
        }
        if (winRate < worstSetupWinRate) {
          worstSetupWinRate = winRate;
          worstSetup = setup;
        }
      }
    }
    
    // Generate strategy feedback
    if (bestSetup && bestSetupWinRate > 0.6) {
      const newFeedback = await this.createCoachingFeedback({
        userId,
        category: "strategy",
        message: `Dein Setup "${bestSetup}" zeigt eine starke Performance mit einer Win-Rate von ${Math.round(bestSetupWinRate * 100)}%. Fokussiere dich mehr auf dieses Setup.`,
        importance: 3,
        acknowledged: false,
        createdAt: new Date()
      });
      feedback.push(newFeedback);
    }
    
    if (worstSetup && worstSetupWinRate < 0.4) {
      const newFeedback = await this.createCoachingFeedback({
        userId,
        category: "strategy",
        message: `Dein Setup "${worstSetup}" hat eine niedrige Win-Rate von ${Math.round(worstSetupWinRate * 100)}%. Überprüfe deine Einstiegskriterien oder vermeide dieses Setup.`,
        importance: 4,
        acknowledged: false,
        createdAt: new Date()
      });
      feedback.push(newFeedback);
    }
    
    // Analyze risk management
    const recentTrades = userTrades.slice(0, 20); // Consider last 20 trades
    const hasConsecutiveLosses = this.hasConsecutiveLosses(recentTrades, 3);
    const riskReward = this.calculateAverageRiskReward(recentTrades);
    
    if (hasConsecutiveLosses) {
      const newFeedback = await this.createCoachingFeedback({
        userId,
        category: "psychology",
        message: "Du hast mehrere Verluste in Folge. Überdenke deine aktuelle Strategie und nimm dir Zeit, um dich zu erholen. Überhandle nicht.",
        importance: 5,
        acknowledged: false,
        createdAt: new Date()
      });
      feedback.push(newFeedback);
    }
    
    if (riskReward < 1.5) {
      const newFeedback = await this.createCoachingFeedback({
        userId,
        category: "risk",
        message: `Dein durchschnittliches Risiko-Ertrags-Verhältnis von ${riskReward.toFixed(2)} ist zu niedrig. Strebe ein Verhältnis von mindestens 2:1 an.`,
        importance: 4,
        acknowledged: false,
        createdAt: new Date()
      });
      feedback.push(newFeedback);
    }
    
    return feedback;
  }

  // Helper methods for coaching feedback
  private hasConsecutiveLosses(trades: Trade[], count: number): boolean {
    let consecutiveLosses = 0;
    
    for (const trade of trades) {
      if (!trade.isWin) {
        consecutiveLosses++;
        if (consecutiveLosses >= count) {
          return true;
        }
      } else {
        consecutiveLosses = 0;
      }
    }
    
    return false;
  }

  private calculateAverageRiskReward(trades: Trade[]): number {
    if (trades.length === 0) {
      return 0;
    }
    
    const validTrades = trades.filter(trade => trade.rrAchieved !== null && trade.rrAchieved !== undefined);
    if (validTrades.length === 0) {
      return 0;
    }
    
    const totalRR = validTrades.reduce((sum, trade) => sum + (trade.rrAchieved || 0), 0);
    return totalRR / validTrades.length;
  }

  // Macroeconomic Events operations
  async getMacroEconomicEvents(startDate: Date, endDate: Date): Promise<MacroEconomicEvent[]> {
    const events = await db
      .select()
      .from(macroEconomicEvents)
      .where(between(macroEconomicEvents.date, startDate, endDate))
      .orderBy(asc(macroEconomicEvents.date));
    return events;
  }

  async getMacroEconomicEventById(id: number): Promise<MacroEconomicEvent | undefined> {
    const [event] = await db.select().from(macroEconomicEvents).where(eq(macroEconomicEvents.id, id));
    return event;
  }

  async createMacroEconomicEvent(event: InsertMacroEconomicEvent): Promise<MacroEconomicEvent> {
    const [newEvent] = await db.insert(macroEconomicEvents).values(event).returning();
    return newEvent;
  }

  async updateMacroEconomicEvent(id: number, eventUpdate: Partial<MacroEconomicEvent>): Promise<MacroEconomicEvent | undefined> {
    const [updatedEvent] = await db
      .update(macroEconomicEvents)
      .set(eventUpdate)
      .where(eq(macroEconomicEvents.id, id))
      .returning();
    return updatedEvent;
  }

  async deleteMacroEconomicEvent(id: number): Promise<boolean> {
    const result = await db.delete(macroEconomicEvents).where(eq(macroEconomicEvents.id, id)).returning({ id: macroEconomicEvents.id });
    return result.length > 0;
  }

  // Trading Strategies operations
  async getTradingStrategies(userId?: number, publicOnly?: boolean): Promise<TradingStrategy[]> {
    let query = db.select().from(tradingStrategies);
    
    if (userId !== undefined) {
      if (publicOnly) {
        query = query.where(
          or(
            eq(tradingStrategies.userId, userId),
            eq(tradingStrategies.public, true)
          )
        );
      } else {
        query = query.where(eq(tradingStrategies.userId, userId));
      }
    } else if (publicOnly) {
      query = query.where(eq(tradingStrategies.public, true));
    }
    
    return await query.orderBy(desc(tradingStrategies.rating));
  }

  async getTradingStrategyById(id: number): Promise<TradingStrategy | undefined> {
    const [strategy] = await db.select().from(tradingStrategies).where(eq(tradingStrategies.id, id));
    return strategy;
  }

  async createTradingStrategy(strategy: InsertTradingStrategy): Promise<TradingStrategy> {
    const now = new Date();
    const [newStrategy] = await db
      .insert(tradingStrategies)
      .values({
        ...strategy,
        rating: 0,
        ratingCount: 0,
        createdAt: now,
        updatedAt: now
      })
      .returning();
    return newStrategy;
  }

  async updateTradingStrategy(id: number, strategyUpdate: Partial<TradingStrategy>): Promise<TradingStrategy | undefined> {
    const [updatedStrategy] = await db
      .update(tradingStrategies)
      .set({
        ...strategyUpdate,
        updatedAt: new Date()
      })
      .where(eq(tradingStrategies.id, id))
      .returning();
    return updatedStrategy;
  }

  async deleteTradingStrategy(id: number): Promise<boolean> {
    const result = await db.delete(tradingStrategies).where(eq(tradingStrategies.id, id)).returning({ id: tradingStrategies.id });
    return result.length > 0;
  }

  // Strategy Comments operations
  async getStrategyComments(strategyId: number): Promise<StrategyComment[]> {
    const comments = await db
      .select()
      .from(strategyComments)
      .where(eq(strategyComments.strategyId, strategyId))
      .orderBy(desc(strategyComments.createdAt));
    return comments;
  }

  async createStrategyComment(comment: InsertStrategyComment): Promise<StrategyComment> {
    const [newComment] = await db
      .insert(strategyComments)
      .values({
        ...comment,
        createdAt: new Date()
      })
      .returning();
    return newComment;
  }

  async deleteStrategyComment(id: number): Promise<boolean> {
    const result = await db.delete(strategyComments).where(eq(strategyComments.id, id)).returning({ id: strategyComments.id });
    return result.length > 0;
  }

  // App Settings operations
  async getAppSettings(userId: number, deviceId?: string): Promise<AppSettings | undefined> {
    let query = db.select().from(appSettings).where(eq(appSettings.userId, userId));
    
    if (deviceId) {
      query = query.where(eq(appSettings.deviceId, deviceId));
    }
    
    const [settings] = await query;
    return settings;
  }

  async createAppSettings(settings: InsertAppSettings): Promise<AppSettings> {
    const [newSettings] = await db
      .insert(appSettings)
      .values({
        ...settings,
        lastSyncedAt: new Date()
      })
      .returning();
    return newSettings;
  }

  async updateAppSettings(id: number, settingsUpdate: Partial<AppSettings>): Promise<AppSettings | undefined> {
    const [updatedSettings] = await db
      .update(appSettings)
      .set({
        ...settingsUpdate,
        lastSyncedAt: new Date()
      })
      .where(eq(appSettings.id, id))
      .returning();
    return updatedSettings;
  }

  async syncAppSettings(userId: number, deviceId: string): Promise<AppSettings | undefined> {
    const allSettings = await db
      .select()
      .from(appSettings)
      .where(eq(appSettings.userId, userId))
      .orderBy(desc(appSettings.lastSyncedAt));
    
    if (allSettings.length === 0) {
      return undefined;
    }
    
    const [latestSettings] = allSettings;
    const currentDeviceSettings = allSettings.find(s => s.deviceId === deviceId);
    
    if (!currentDeviceSettings) {
      // Create new settings for this device
      const newSettings = await this.createAppSettings({
        ...latestSettings,
        deviceId,
        deviceName: 'New Device',
        deviceType: 'unknown',
        lastSyncedAt: new Date()
      });
      return newSettings;
    } else if (currentDeviceSettings.id !== latestSettings.id) {
      // Update current device settings with latest
      const updatedSettings = await this.updateAppSettings(currentDeviceSettings.id, {
        theme: latestSettings.theme,
        notifications: latestSettings.notifications,
        offlineModeEnabled: latestSettings.offlineModeEnabled,
        accountBalance: latestSettings.accountBalance,
        evaAccountBalance: latestSettings.evaAccountBalance,
        ekAccountBalance: latestSettings.ekAccountBalance,
        accountType: latestSettings.accountType,
        goalBalance: latestSettings.goalBalance,
        evaGoalBalance: latestSettings.evaGoalBalance,
        ekGoalBalance: latestSettings.ekGoalBalance
      });
      return updatedSettings;
    }
    
    return currentDeviceSettings;
  }

  // Trading Streak operations
  async getTradingStreak(userId: number): Promise<TradingStreak | undefined> {
    const [streak] = await db.select().from(tradingStreaks).where(eq(tradingStreaks.userId, userId));
    return streak;
  }

  async createTradingStreak(streak: InsertTradingStreak & { userId: number }): Promise<TradingStreak> {
    const [newStreak] = await db
      .insert(tradingStreaks)
      .values({
        ...streak,
        lastUpdated: new Date()
      })
      .returning();
    return newStreak;
  }

  async updateTradingStreak(userId: number, streakUpdate: Partial<TradingStreak>): Promise<TradingStreak | undefined> {
    const [updatedStreak] = await db
      .update(tradingStreaks)
      .set({
        ...streakUpdate,
        lastUpdated: new Date()
      })
      .where(eq(tradingStreaks.userId, userId))
      .returning();
    return updatedStreak;
  }

  async updateStreakOnTradeResult(userId: number, isWin: boolean): Promise<TradingStreak> {
    const existingStreak = await this.getTradingStreak(userId);
    
    if (!existingStreak) {
      // Create new streak record
      return await this.createTradingStreak({
        userId,
        currentStreak: isWin ? 1 : 0,
        longestStreak: isWin ? 1 : 0,
        currentLossStreak: isWin ? 0 : 1,
        longestLossStreak: isWin ? 0 : 1,
        totalTrades: 1,
        totalWins: isWin ? 1 : 0,
        lastTradeDate: new Date(),
        streakLevel: 1,
        experiencePoints: isWin ? 10 : 5,
        badges: []
      });
    } else {
      // Update existing streak
      const updates: Partial<TradingStreak> = {
        totalTrades: existingStreak.totalTrades + 1,
        lastTradeDate: new Date()
      };
      
      if (isWin) {
        updates.totalWins = existingStreak.totalWins + 1;
        updates.currentStreak = existingStreak.currentStreak + 1;
        updates.currentLossStreak = 0;
        updates.experiencePoints = existingStreak.experiencePoints + 10;
        
        if (updates.currentStreak > existingStreak.longestStreak) {
          updates.longestStreak = updates.currentStreak;
        }
      } else {
        updates.currentStreak = 0;
        updates.currentLossStreak = existingStreak.currentLossStreak + 1;
        updates.experiencePoints = existingStreak.experiencePoints + 5;
        
        if (updates.currentLossStreak > existingStreak.longestLossStreak) {
          updates.longestLossStreak = updates.currentLossStreak;
        }
      }
      
      // Level up logic
      const expNeededForNextLevel = existingStreak.streakLevel * 100;
      if ((updates.experiencePoints || 0) >= expNeededForNextLevel) {
        updates.streakLevel = existingStreak.streakLevel + 1;
      }
      
      const updatedStreak = await this.updateTradingStreak(userId, updates);
      return updatedStreak!;
    }
  }

  async getTopStreaks(): Promise<TradingStreak[]> {
    const topStreaks = await db
      .select()
      .from(tradingStreaks)
      .orderBy(desc(tradingStreaks.longestStreak))
      .limit(10);
    return topStreaks;
  }

  async earnBadge(userId: number, badgeType: typeof badgeTypes[number]): Promise<TradingStreak | undefined> {
    const streak = await this.getTradingStreak(userId);
    
    if (!streak) {
      return undefined;
    }
    
    const badges = streak.badges || [];
    
    // Only add badge if not already earned
    if (!badges.includes(badgeType)) {
      badges.push(badgeType);
      
      const updatedStreak = await this.updateTradingStreak(userId, {
        badges,
        experiencePoints: streak.experiencePoints + 25 // Bonus XP for badge
      });
      
      return updatedStreak;
    }
    
    return streak;
  }
}

// Wähle die Storage-Implementation basierend auf der Umgebung
export const storage = process.env.DATABASE_URL 
  ? new DatabaseStorage() 
  : new MemStorage();
