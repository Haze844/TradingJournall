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

// Konstanten für Dropdown-Auswahlen
export const accountTypes = [
  "EVA",
  "PA",
  "EK"
];