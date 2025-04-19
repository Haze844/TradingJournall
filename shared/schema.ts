import { pgTable, text, serial, integer, boolean, timestamp, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Base user schema
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Trade setup types
export const setupTypes = ["BB", "OZEM", "BZEM"] as const;
export const trendTypes = ["Long", "Short"] as const;
export const entryLevelTypes = ["50%", "67%"] as const;
export const timeframeTypes = ["M1", "M5", "M15", "H1"] as const;
export const locationTypes = ["FVG", "FVG Sweep", "Sweep", "HTF Breaker"] as const;

// Trades schema
export const trades = pgTable("trades", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull().defaultNow(),
  symbol: text("symbol").notNull(),
  setup: text("setup").notNull(),
  mainTrendM15: text("main_trend_m15").notNull(),
  internalTrendM5: text("internal_trend_m5").notNull(),
  entryType: text("entry_type").notNull(),
  entryLevel: text("entry_level").notNull(),
  liquidation: text("liquidation").notNull(),
  location: text("location").notNull(),
  rrAchieved: real("rr_achieved").notNull(),
  rrPotential: real("rr_potential").notNull(),
  gptFeedback: text("gpt_feedback"),
  isWin: boolean("is_win").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertTradeSchema = createInsertSchema(trades).omit({
  id: true,
  date: true,
  gptFeedback: true,
  userId: true,
});

export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof trades.$inferSelect;

// Weekly summary schema
export const weeklySummaries = pgTable("weekly_summaries", {
  id: serial("id").primaryKey(),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  totalRR: real("total_rr").notNull(),
  tradeCount: integer("trade_count").notNull(),
  winRate: real("win_rate").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertWeeklySummarySchema = createInsertSchema(weeklySummaries).omit({
  id: true,
  userId: true,
});

export type InsertWeeklySummary = z.infer<typeof insertWeeklySummarySchema>;
export type WeeklySummary = typeof weeklySummaries.$inferSelect;

// Performance data schema for chart
export const performanceData = pgTable("performance_data", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  performance: real("performance").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertPerformanceDataSchema = createInsertSchema(performanceData).omit({
  id: true,
  userId: true,
});

export type InsertPerformanceData = z.infer<typeof insertPerformanceDataSchema>;
export type PerformanceData = typeof performanceData.$inferSelect;

// Setup win rate schema for chart
export const setupWinRates = pgTable("setup_win_rates", {
  id: serial("id").primaryKey(),
  setup: text("setup").notNull(),
  winRate: real("win_rate").notNull(),
  userId: integer("user_id").references(() => users.id),
});

export const insertSetupWinRateSchema = createInsertSchema(setupWinRates).omit({
  id: true,
  userId: true,
});

export type InsertSetupWinRate = z.infer<typeof insertSetupWinRateSchema>;
export type SetupWinRate = typeof setupWinRates.$inferSelect;
