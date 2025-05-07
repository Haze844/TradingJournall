import { z } from "zod";

// Base user schema
export interface User {
  id: number;
  username: string;
  password: string;
}

export const insertUserSchema = z.object({
  username: z.string(),
  password: z.string(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;

// Trade setup types
export const setupTypes = ["BREAKER", "OZEM", "BZEM", "A OZEM", "A BZEM", "MSS", "CISD"] as const;
export const trendTypes = [
  "Long", "Short", 
  "Trend Long", "Trend Short", 
  "Neutral", "Range"
] as const;
export const simpleTrendTypes = ["Long", "Short"] as const;
export const entryLevelTypes = ["50%", "67%"] as const;
export const timeframeTypes = ["M1", "M5", "M15", "H1", "ALL TF"] as const;
export const liquidationTypes = ["M1", "M5", "M15", "H1", "Low Resistance", "Equals"] as const;
export const locationTypes = [
  "FVG", 
  "FVG Sweep", 
  "ca. 50% HS", 
  "ca. 67% HS", 
  "Volumenzone", 
  "Rangekanten", 
  "Mitte der Range", 
  "HTF OB", 
  "Sweep"
] as const;
export const structureTypes = ["Hauptstruktur", "Internal", "Micro"] as const;
export const sessionTypes = ["London", "London Neverland", "NY AM", "NY AM Neverland", "NY PM"] as const;
export const unmitZoneTypes = ["Ja", "Nein", "Mehrere"] as const;
export const marketPhaseTypes = ["Long", "stark Long", "Short", "stark Short", "Range"] as const;
export const rrValues = [1, 2, 3, 4, 5, 6, 7, 8, 9] as const;
export const slTypes = ["Sweep", "zerstört"] as const;
export const slPointsValues = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30] as const;
export const accountTypeValues = ["PA", "EVA", "EK"] as const;

// Trades schema types
export interface Trade {
  id: number;
  date: Date;
  symbol: string | null;
  setup: string | null;
  mainTrendM15: string | null;
  internalTrendM5: string | null;
  entryType: string | null;
  entryLevel: string | null;
  liquidation: string | null;
  location: string | null;
  accountType: string | null;
  session: string | null;
  rrAchieved: number | null;
  rrPotential: number | null;
  profitLoss: number | null;
  gptFeedback: string | null;
  chartImage: string | null;
  isWin: boolean | null;
  userId: number | null;
  // Neue Spalten
  trend: string | null;
  internalTrend: string | null;
  microTrend: string | null;
  structure: string | null;
  timeframeEntry: string | null;
  unmitZone: string | null;
  rangePoints: number | null;
  marketPhase: string | null;
  slType: string | null;
  slPoints: number | null;
  riskSum: number | null;
  riskPoints: number | null;
  riskAmount: number | null;
  size: number | null;
  liquidationEntry: string | null;
}

export const insertTradeSchema = z.object({
  symbol: z.string().nullable().default(null),
  setup: z.string().nullable().default(null),
  mainTrendM15: z.string().nullable().default(null),
  internalTrendM5: z.string().nullable().default(null),
  entryType: z.string().nullable().default(null),
  entryLevel: z.string().nullable().default(null),
  liquidation: z.string().nullable().default(null),
  location: z.string().nullable().default(null),
  accountType: z.string().nullable().default(null),
  session: z.string().nullable().default(null),
  rrAchieved: z.number().nullable().default(null),
  rrPotential: z.number().nullable().default(null),
  profitLoss: z.number().nullable().default(null),
  isWin: z.boolean().nullable().default(null),
  trend: z.string().nullable().default(null),
  internalTrend: z.string().nullable().default(null),
  microTrend: z.string().nullable().default(null),
  structure: z.string().nullable().default(null),
  timeframeEntry: z.string().nullable().default(null),
  unmitZone: z.string().nullable().default(null),
  rangePoints: z.number().nullable().default(null),
  marketPhase: z.string().nullable().default(null),
  slType: z.string().nullable().default(null),
  slPoints: z.number().nullable().default(null),
  riskSum: z.number().nullable().default(null),
  riskPoints: z.number().nullable().default(null),
  riskAmount: z.number().nullable().default(null),
  size: z.number().nullable().default(null),
  liquidationEntry: z.string().nullable().default(null),
});

export type InsertTrade = z.infer<typeof insertTradeSchema> & { 
  gptFeedback?: string;
  chartImage?: string;
};

// Weekly summary types
export interface WeeklySummary {
  id: number;
  weekStart: Date;
  weekEnd: Date;
  totalRR: number;
  tradeCount: number;
  winRate: number;
  userId: number;
}

export const insertWeeklySummarySchema = z.object({
  weekStart: z.date(),
  weekEnd: z.date(),
  totalRR: z.number(),
  tradeCount: z.number(),
  winRate: z.number(),
});

export type InsertWeeklySummary = z.infer<typeof insertWeeklySummarySchema>;

// Performance data types
export interface PerformanceData {
  id: number;
  date: Date;
  performance: number;
  userId: number;
}

export const insertPerformanceDataSchema = z.object({
  date: z.date(),
  performance: z.number(),
});

export type InsertPerformanceData = z.infer<typeof insertPerformanceDataSchema>;

// Setup win rate types
export interface SetupWinRate {
  id: number;
  setup: string;
  winRate: number;
  userId: number;
}

export const insertSetupWinRateSchema = z.object({
  setup: z.string(),
  winRate: z.number(),
});

export type InsertSetupWinRate = z.infer<typeof insertSetupWinRateSchema>;

// Coaching goals types
export interface CoachingGoal {
  id: number;
  userId: number;
  goalType: string;
  description: string;
  targetValue: number;
  currentValue: number;
  completed: boolean;
  createdAt: Date;
  dueDate: Date;
}

export const insertCoachingGoalSchema = z.object({
  userId: z.number(),
  goalType: z.string(),
  description: z.string(),
  targetValue: z.number(),
  currentValue: z.number().optional(),
  completed: z.boolean().optional(),
  dueDate: z.date(),
});

export type InsertCoachingGoal = z.infer<typeof insertCoachingGoalSchema>;

// Coaching feedback types
export interface CoachingFeedback {
  id: number;
  userId: number;
  category: string;
  message: string;
  importance: number;
  acknowledged: boolean;
  createdAt: Date;
}

export const insertCoachingFeedbackSchema = z.object({
  userId: z.number(),
  category: z.string(),
  message: z.string(),
  importance: z.number().optional(),
  acknowledged: z.boolean().optional(),
});

export type InsertCoachingFeedback = z.infer<typeof insertCoachingFeedbackSchema>;

// Macroeconomic event types
export interface MacroEconomicEvent {
  id: number;
  title: string;
  description: string;
  impact: string;
  date: Date;
  time: string;
  actual: string;
  forecast: string;
  previous: string;
  country: string;
  currency: string;
}

export const insertMacroEconomicEventSchema = z.object({
  title: z.string(),
  description: z.string(),
  impact: z.string(),
  date: z.date(),
  time: z.string(),
  actual: z.string().optional(),
  forecast: z.string().optional(),
  previous: z.string().optional(),
  country: z.string(),
  currency: z.string(),
});

export type InsertMacroEconomicEvent = z.infer<typeof insertMacroEconomicEventSchema>;

// Trading strategy types
export interface TradingStrategy {
  id: number;
  userId: number;
  name: string;
  description: string;
  setupType: string;
  entryRules: string;
  exitRules: string;
  riskManagement: string;
  timeframes: string;
  markets: string;
  public: boolean;
  rating: number;
  ratingCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export const insertTradingStrategySchema = z.object({
  userId: z.number(),
  name: z.string(),
  description: z.string(),
  setupType: z.string(),
  entryRules: z.string(),
  exitRules: z.string(),
  riskManagement: z.string(),
  timeframes: z.string(),
  markets: z.string(),
  public: z.boolean().optional(),
});

export type InsertTradingStrategy = z.infer<typeof insertTradingStrategySchema>;

// Strategy comment types
export interface StrategyComment {
  id: number;
  strategyId: number;
  userId: number;
  content: string;
  createdAt: Date;
}

export const insertStrategyCommentSchema = z.object({
  strategyId: z.number(),
  userId: z.number(),
  content: z.string(),
});

export type InsertStrategyComment = z.infer<typeof insertStrategyCommentSchema>;

// Trading streak types
export interface TradingStreak {
  id: number;
  userId: number;
  currentStreak: number;
  longestStreak: number;
  currentLossStreak: number;
  longestLossStreak: number;
  totalTrades: number;
  totalWins: number;
  lastTradeDate: Date | null;
  lastUpdated: Date;
  streakLevel: number;
  experiencePoints: number;
  badges: string[];
}

export const insertTradingStreakSchema = z.object({
  userId: z.number(),
  currentStreak: z.number().optional(),
  longestStreak: z.number().optional(),
  currentLossStreak: z.number().optional(),
  longestLossStreak: z.number().optional(),
  totalTrades: z.number().optional(),
  totalWins: z.number().optional(),
  lastTradeDate: z.date().nullable().optional(),
  streakLevel: z.number().optional(),
  experiencePoints: z.number().optional(),
  badges: z.array(z.string()).optional(),
});

export type InsertTradingStreak = z.infer<typeof insertTradingStreakSchema>;

// Badge Definitionen für Gamifizierung
export const badgeTypes = [
  "winning_streak_5", 
  "winning_streak_10", 
  "winning_streak_20",
  "perfect_week",
  "comeback_king",
  "first_trade",
  "trade_master_50",
  "trade_master_100"
] as const;

// App Settings types
export interface AppSettings {
  id: number;
  userId: number;
  theme: string;
  notifications: boolean;
  syncEnabled: boolean;
  lastSyncedAt: Date;
  offlineModeEnabled: boolean;
  deviceId: string;
  deviceName: string;
  deviceType: string;
  accountBalance: number;
  evaAccountBalance: number;
  ekAccountBalance: number;
  accountType: string;
  goalBalance: number;
  evaGoalBalance: number;
  ekGoalBalance: number;
}

export const insertAppSettingsSchema = z.object({
  userId: z.number(),
  theme: z.string().optional(),
  notifications: z.boolean().optional(),
  syncEnabled: z.boolean().optional(),
  offlineModeEnabled: z.boolean().optional(),
  deviceId: z.string().optional(),
  deviceName: z.string().optional(),
  deviceType: z.string().optional(),
  accountBalance: z.number().optional(),
  evaAccountBalance: z.number().optional(),
  ekAccountBalance: z.number().optional(),
  accountType: z.string().optional(),
  goalBalance: z.number().optional(),
  evaGoalBalance: z.number().optional(),
  ekGoalBalance: z.number().optional(),
});

export type InsertAppSettings = z.infer<typeof insertAppSettingsSchema>;

// Konstanten für Dropdown-Auswahlen
export const accountTypes = [
  "EVA",
  "PA",
  "EK"
];