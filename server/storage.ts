/**
 * STORAGE IMPLEMENTIERUNGEN
 * 
 * Diese Datei enthält Implementierungen für die Datenspeicherung,
 * entweder in der Datenbank oder im Arbeitsspeicher.
 * 
 * Die Auswahl erfolgt automatisch basierend auf den verfügbaren
 * Umgebungsvariablen.
 */

import { Pool } from "@neondatabase/serverless";
import { eq } from "drizzle-orm";
import {
  users,
  trades,
  weeklySummaries,
  appSettings,
  type User,
  type InsertUser,
  type Trade,
  type InsertTrade,
  type WeeklySummary,
  type InsertWeeklySummary,
  type AppSettings,
  type InsertAppSettings,
} from "../shared/schema";

// Verwende den Datenbank-Selektor statt direktem Import
import { db, pool, executeSafely } from "./db-selector";

// Interface für Storage-Operationen
export interface IStorage {
  // User-Operationen
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserPassword(id: number, password: string): Promise<User | undefined>;
  updateUser(id: number, userData: Partial<User>): Promise<User | undefined>;

  // Trade-Operationen
  getTrades(userId: number): Promise<Trade[]>;
  getTrade(id: number): Promise<Trade | undefined>;
  createTrade(trade: InsertTrade): Promise<Trade>;
  updateTrade(id: number, trade: Partial<Trade>): Promise<Trade | undefined>;
  deleteTrade(id: number): Promise<boolean>;

  // WeeklySummary-Operationen
  getWeeklyStats(userId: number): Promise<WeeklySummary[]>;
  getWeeklyStat(id: number): Promise<WeeklySummary | undefined>;
  createWeeklyStat(weeklyStat: InsertWeeklySummary): Promise<WeeklySummary>;
  updateWeeklyStat(
    id: number,
    weeklyStat: Partial<WeeklySummary>,
  ): Promise<WeeklySummary | undefined>;

  // Setting-Operationen
  getSetting(userId: number): Promise<AppSettings | undefined>;
  createSetting(setting: InsertAppSettings): Promise<AppSettings>;
  updateSetting(
    userId: number,
    setting: Partial<AppSettings>,
  ): Promise<AppSettings | undefined>;
}

// Datenbank-basierte Storage-Implementierung
export class DatabaseStorage implements IStorage {
  // User-Operationen
  async getUser(id: number): Promise<User | undefined> {
    try {
      const [user] = await executeSafely(db => 
        db.select().from(users).where(eq(users.id, id))
      );
      return user;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Benutzers mit ID ${id}:`, error);
      return undefined;
    }
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    try {
      const [user] = await executeSafely(
        () => db.select().from(users).where(eq(users.username, username)),
        undefined,
        `Fehler beim Abrufen des Benutzers mit Username ${username}`
      );
      return user;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Benutzers mit Username ${username}:`, error);
      return undefined;
    }
  }

  async createUser(user: InsertUser): Promise<User> {
    try {
      const [createdUser] = await executeSafely(
        () => db.insert(users).values(user).returning(),
        undefined,
        "Fehler beim Erstellen eines Benutzers"
      );
      return createdUser;
    } catch (error) {
      console.error("Fehler beim Erstellen eines Benutzers:", error);
      throw error;
    }
  }

  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    try {
      const [updatedUser] = await executeSafely(db => 
        db.update(users)
          .set({ password })
          .where(eq(users.id, id))
          .returning()
      );
      return updatedUser;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Passworts für Benutzer ${id}:`, error);
      return undefined;
    }
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    try {
      const [updatedUser] = await executeSafely(db => 
        db.update(users)
          .set(userData)
          .where(eq(users.id, id))
          .returning()
      );
      return updatedUser;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Benutzers ${id}:`, error);
      return undefined;
    }
  }

  // Trade-Operationen
  async getTrades(userId: number): Promise<Trade[]> {
    try {
      return await executeSafely(db => 
        db.select().from(trades).where(eq(trades.userId, userId))
      );
    } catch (error) {
      console.error(`Fehler beim Abrufen der Trades für Benutzer ${userId}:`, error);
      return [];
    }
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    try {
      const [trade] = await executeSafely(db => 
        db.select().from(trades).where(eq(trades.id, id))
      );
      return trade;
    } catch (error) {
      console.error(`Fehler beim Abrufen des Trades mit ID ${id}:`, error);
      return undefined;
    }
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    try {
      const [createdTrade] = await executeSafely(db => 
        db.insert(trades).values(trade).returning()
      );
      return createdTrade;
    } catch (error) {
      console.error("Fehler beim Erstellen eines Trades:", error);
      throw error;
    }
  }

  async updateTrade(
    id: number,
    trade: Partial<Trade>,
  ): Promise<Trade | undefined> {
    try {
      const [updatedTrade] = await executeSafely(db => 
        db.update(trades).set(trade).where(eq(trades.id, id)).returning()
      );
      return updatedTrade;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren des Trades mit ID ${id}:`, error);
      return undefined;
    }
  }

  async deleteTrade(id: number): Promise<boolean> {
    try {
      const [deletedTrade] = await executeSafely(db => 
        db.delete(trades).where(eq(trades.id, id)).returning()
      );
      return !!deletedTrade;
    } catch (error) {
      console.error(`Fehler beim Löschen des Trades mit ID ${id}:`, error);
      return false;
    }
  }

  // WeeklySummary-Operationen
  async getWeeklyStats(userId: number): Promise<WeeklySummary[]> {
    try {
      return await executeSafely(db => 
        db.select().from(weeklySummaries).where(eq(weeklySummaries.userId, userId))
      );
    } catch (error) {
      console.error(`Fehler beim Abrufen der Wochenstatistiken für Benutzer ${userId}:`, error);
      return [];
    }
  }

  async getWeeklyStat(id: number): Promise<WeeklySummary | undefined> {
    try {
      const [stat] = await executeSafely(db => 
        db.select().from(weeklySummaries).where(eq(weeklySummaries.id, id))
      );
      return stat;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Wochenstatistik mit ID ${id}:`, error);
      return undefined;
    }
  }

  async createWeeklyStat(weeklyStat: InsertWeeklySummary): Promise<WeeklySummary> {
    try {
      const [createdStat] = await executeSafely(db => 
        db.insert(weeklySummaries).values(weeklyStat).returning()
      );
      return createdStat;
    } catch (error) {
      console.error("Fehler beim Erstellen einer Wochenstatistik:", error);
      throw error;
    }
  }

  async updateWeeklyStat(
    id: number,
    weeklyStat: Partial<WeeklySummary>,
  ): Promise<WeeklySummary | undefined> {
    try {
      const [updatedStat] = await executeSafely(db => 
        db.update(weeklySummaries).set(weeklyStat).where(eq(weeklySummaries.id, id)).returning()
      );
      return updatedStat;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Wochenstatistik mit ID ${id}:`, error);
      return undefined;
    }
  }

  // AppSettings-Operationen
  async getSetting(userId: number): Promise<AppSettings | undefined> {
    try {
      const [setting] = await executeSafely(db => 
        db.select().from(appSettings).where(eq(appSettings.userId, userId))
      );
      return setting;
    } catch (error) {
      console.error(`Fehler beim Abrufen der Einstellungen für Benutzer ${userId}:`, error);
      return undefined;
    }
  }

  async createSetting(setting: InsertAppSettings): Promise<AppSettings> {
    try {
      const [createdSetting] = await executeSafely(db => 
        db.insert(appSettings).values(setting).returning()
      );
      return createdSetting;
    } catch (error) {
      console.error("Fehler beim Erstellen von Einstellungen:", error);
      throw error;
    }
  }

  async updateSetting(
    userId: number,
    setting: Partial<AppSettings>,
  ): Promise<AppSettings | undefined> {
    try {
      const [updatedSetting] = await executeSafely(db => 
        db.update(appSettings)
          .set(setting)
          .where(eq(appSettings.userId, userId))
          .returning()
      );
      return updatedSetting;
    } catch (error) {
      console.error(`Fehler beim Aktualisieren der Einstellungen für Benutzer ${userId}:`, error);
      return undefined;
    }
  }
}

// Speicher-basierte Storage-Implementierung für lokale Entwicklung
export class MemStorage implements IStorage {
  private users: User[] = [
    {
      id: 1,
      username: "admin",
      password:
        "f16bed56189e0a971a3e115c683a65c0b7e507c35552f852fdde0d839c308659.d89e7e6c1880f2c4c4392c0850e3a515",
      createdAt: new Date(),
    },
    {
      id: 2,
      username: "mo",
      password:
        "f16bed56189e0a971a3e115c683a65c0b7e507c35552f852fdde0d839c308659.d89e7e6c1880f2c4c4392c0850e3a515",
      createdAt: new Date(),
    },
  ];

  private trades: Trade[] = [];

  private weeklyStats: WeeklySummary[] = [];

  private settings: AppSettings[] = [];

  // User-Operationen
  async getUser(id: number): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return this.users.find((u) => u.username === username);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.users.length ? Math.max(...this.users.map((u) => u.id)) + 1 : 1;
    const newUser = { ...user, id, createdAt: new Date() };
    this.users.push(newUser);
    return newUser;
  }

  async updateUserPassword(id: number, password: string): Promise<User | undefined> {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) return undefined;
    this.users[userIndex].password = password;
    return this.users[userIndex];
  }
  
  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const userIndex = this.users.findIndex((u) => u.id === id);
    if (userIndex === -1) return undefined;
    this.users[userIndex] = { ...this.users[userIndex], ...userData };
    return this.users[userIndex];
  }

  // Trade-Operationen
  async getTrades(userId: number): Promise<Trade[]> {
    return this.trades.filter((t) => t.userId === userId);
  }

  async getTrade(id: number): Promise<Trade | undefined> {
    return this.trades.find((t) => t.id === id);
  }

  async createTrade(trade: InsertTrade): Promise<Trade> {
    const id = this.trades.length
      ? Math.max(...this.trades.map((t) => t.id)) + 1
      : 1;
    const newTrade = {
      ...trade,
      id,
      date: new Date(), // Sicherstellen, dass date immer gesetzt ist
      userId: 1, // Default userId setzen
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.trades.push(newTrade as Trade);
    return newTrade as Trade;
  }

  async updateTrade(
    id: number,
    trade: Partial<Trade>,
  ): Promise<Trade | undefined> {
    const tradeIndex = this.trades.findIndex((t) => t.id === id);
    if (tradeIndex === -1) return undefined;
    this.trades[tradeIndex] = {
      ...this.trades[tradeIndex],
      ...trade,
      updatedAt: new Date(),
    };
    return this.trades[tradeIndex];
  }

  async deleteTrade(id: number): Promise<boolean> {
    const tradeIndex = this.trades.findIndex((t) => t.id === id);
    if (tradeIndex === -1) return false;
    this.trades.splice(tradeIndex, 1);
    return true;
  }

  // WeeklySummary-Operationen
  async getWeeklyStats(userId: number): Promise<WeeklySummary[]> {
    return this.weeklyStats.filter((s) => s.userId === userId);
  }

  async getWeeklyStat(id: number): Promise<WeeklySummary | undefined> {
    return this.weeklyStats.find((s) => s.id === id);
  }

  async createWeeklyStat(weeklyStat: InsertWeeklySummary): Promise<WeeklySummary> {
    const id = this.weeklyStats.length
      ? Math.max(...this.weeklyStats.map((s) => s.id)) + 1
      : 1;
    const newStat = {
      ...weeklyStat,
      id,
      userId: weeklyStat.userId || 1, // Default userId setzen wenn nicht vorhanden
    };
    this.weeklyStats.push(newStat as WeeklySummary);
    return newStat as WeeklySummary;
  }

  async updateWeeklyStat(
    id: number,
    weeklyStat: Partial<WeeklySummary>,
  ): Promise<WeeklySummary | undefined> {
    const statIndex = this.weeklyStats.findIndex((s) => s.id === id);
    if (statIndex === -1) return undefined;
    this.weeklyStats[statIndex] = {
      ...this.weeklyStats[statIndex],
      ...weeklyStat,
    };
    return this.weeklyStats[statIndex];
  }

  // AppSettings-Operationen
  async getSetting(userId: number): Promise<AppSettings | undefined> {
    return this.settings.find((s) => s.userId === userId);
  }

  async createSetting(setting: InsertAppSettings): Promise<AppSettings> {
    const id = this.settings.length
      ? Math.max(...this.settings.map((s) => s.id)) + 1
      : 1;
    const newSetting = {
      ...setting,
      id,
      lastSyncedAt: new Date(),
    };
    this.settings.push(newSetting as AppSettings);
    return newSetting as AppSettings;
  }

  async updateSetting(
    userId: number,
    setting: Partial<AppSettings>,
  ): Promise<AppSettings | undefined> {
    const settingIndex = this.settings.findIndex((s) => s.userId === userId);
    if (settingIndex === -1) return undefined;
    this.settings[settingIndex] = {
      ...this.settings[settingIndex],
      ...setting,
      lastSyncedAt: new Date(),
    };
    return this.settings[settingIndex];
  }
}

// Storage-Auswahl basierend auf Umgebungsvariablen
let storage: IStorage;

if (process.env.DATABASE_URL) {
  storage = new DatabaseStorage();
  console.log("Storage-Auswahl: DatabaseStorage (DATABASE_URL vorhanden)");
} else {
  storage = new MemStorage();
  console.log("Storage-Auswahl: MemStorage (keine DATABASE_URL)");
}

export { storage };