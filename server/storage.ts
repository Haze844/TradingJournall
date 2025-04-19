import { 
  users, type User, type InsertUser,
  trades, type Trade, type InsertTrade,
  weeklySummaries, type WeeklySummary, type InsertWeeklySummary,
  performanceData, type PerformanceData, type InsertPerformanceData,
  setupWinRates, type SetupWinRate, type InsertSetupWinRate
} from "@shared/schema";

// Interface for storage methods
export interface IStorage {
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private trades: Map<number, Trade>;
  private weeklySummaries: Map<number, WeeklySummary>;
  private performanceData: Map<number, PerformanceData>;
  private setupWinRates: Map<number, SetupWinRate>;
  
  private userIdCounter: number;
  private tradeIdCounter: number;
  private summaryIdCounter: number;
  private performanceIdCounter: number;
  private setupWinRateIdCounter: number;

  constructor() {
    this.users = new Map();
    this.trades = new Map();
    this.weeklySummaries = new Map();
    this.performanceData = new Map();
    this.setupWinRates = new Map();
    
    this.userIdCounter = 1;
    this.tradeIdCounter = 1;
    this.summaryIdCounter = 1;
    this.performanceIdCounter = 1;
    this.setupWinRateIdCounter = 1;
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
