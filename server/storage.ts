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
  appSettings, type AppSettings, type InsertAppSettings
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

// Interface for storage methods
export interface IStorage {
  // Session store
  sessionStore: session.Store;
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
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
    const userSettings = Array.from(this.appSettings.values())
      .filter(settings => settings.userId === userId);
    
    if (deviceId) {
      return userSettings.find(settings => settings.deviceId === deviceId);
    }
    
    // Return the most recently synced settings
    return userSettings.sort((a, b) => 
      new Date(b.lastSyncedAt).getTime() - new Date(a.lastSyncedAt).getTime()
    )[0];
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
    // Find settings for this device
    const deviceSettings = await this.getAppSettings(userId, deviceId);
    
    if (!deviceSettings) {
      return undefined;
    }
    
    // Find most up-to-date settings across all devices
    const latestSettings = await this.getAppSettings(userId);
    
    if (!latestSettings || latestSettings.id === deviceSettings.id) {
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

  // Trade methods
  async getTrades(userId: number, filters?: Partial<Trade>): Promise<Trade[]> {
    let userTrades = Array.from(this.trades.values()).filter(
      (trade) => trade.userId === userId
    );
    
    if (filters) {
      userTrades = userTrades.filter(trade => {
        for (const [key, value] of Object.entries(filters)) {
          if (value !== undefined && trade[key as keyof Trade] !== value) {
            return false;
          }
        }
        return true;
      });
    }
    
    return userTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }

  async getTradeById(id: number): Promise<Trade | undefined> {
    return this.trades.get(id);
  }

  async createTrade(trade: InsertTrade & { userId: number }): Promise<Trade> {
    const id = this.tradeIdCounter++;
    const newTrade: Trade = { 
      ...trade, 
      id,
      date: new Date(),
      gptFeedback: trade.gptFeedback || ""
    };
    
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
    
    return newTrade;
  }

  async updateTrade(id: number, tradeUpdate: Partial<Trade>): Promise<Trade | undefined> {
    const existingTrade = this.trades.get(id);
    
    if (!existingTrade) {
      return undefined;
    }
    
    const updatedTrade = { ...existingTrade, ...tradeUpdate };
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

export const storage = new MemStorage();
