import { eq, desc, and, sql, gte, lte } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { 
  InsertUser, users, 
  wallets, InsertWallet, Wallet,
  bets, InsertBet, Bet,
  parlays, InsertParlay, Parlay,
  parlayLegs, InsertParlayLeg, ParlayLeg,
  predictions, InsertPrediction, Prediction,
  modelPerformance, InsertModelPerformance, ModelPerformance,
  userPreferences, InsertUserPreference, UserPreference,
  walletTransactions, InsertWalletTransaction, WalletTransaction
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

// ============ USER FUNCTIONS ============
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ============ WALLET FUNCTIONS ============
export async function getOrCreateWallet(userId: number): Promise<Wallet | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(wallets).values({ userId, balance: "10000.00", totalDeposited: "10000.00" });
  const created = await db.select().from(wallets).where(eq(wallets.userId, userId)).limit(1);
  return created[0] || null;
}

export async function updateWalletBalance(walletId: number, newBalance: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(wallets).set({ balance: newBalance }).where(eq(wallets.id, walletId));
}

export async function addWalletTransaction(transaction: InsertWalletTransaction): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(walletTransactions).values(transaction);
}

export async function getWalletTransactions(userId: number, limit = 50): Promise<WalletTransaction[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(walletTransactions).where(eq(walletTransactions.userId, userId)).orderBy(desc(walletTransactions.createdAt)).limit(limit);
}

// ============ BET FUNCTIONS ============
export async function createBet(bet: InsertBet): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(bets).values(bet);
  return Number(result[0].insertId);
}

export async function getBetsByUser(userId: number, limit = 50): Promise<Bet[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bets).where(eq(bets.userId, userId)).orderBy(desc(bets.createdAt)).limit(limit);
}

export async function getPendingBets(userId: number): Promise<Bet[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(bets).where(and(eq(bets.userId, userId), eq(bets.status, "pending"))).orderBy(desc(bets.createdAt));
}

export async function updateBetStatus(betId: number, status: "won" | "lost" | "push" | "cancelled", result?: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(bets).set({ status, result, settledAt: new Date() }).where(eq(bets.id, betId));
}

export async function getUserBetStats(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const allBets = await db.select().from(bets).where(eq(bets.userId, userId));
  const settledBets = allBets.filter(b => b.status !== "pending" && b.status !== "cancelled");
  const wonBets = settledBets.filter(b => b.status === "won");
  
  const totalStaked = settledBets.reduce((sum, b) => sum + parseFloat(b.stake), 0);
  const totalReturns = wonBets.reduce((sum, b) => sum + parseFloat(b.potentialPayout), 0);
  const profitLoss = totalReturns - totalStaked;
  const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0;
  const winRate = settledBets.length > 0 ? (wonBets.length / settledBets.length) * 100 : 0;

  return {
    totalBets: allBets.length,
    settledBets: settledBets.length,
    pendingBets: allBets.filter(b => b.status === "pending").length,
    wonBets: wonBets.length,
    lostBets: settledBets.filter(b => b.status === "lost").length,
    totalStaked,
    totalReturns,
    profitLoss,
    roi,
    winRate
  };
}

// ============ PARLAY FUNCTIONS ============
export async function createParlay(parlay: InsertParlay, legs: Omit<InsertParlayLeg, "parlayId">[]): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(parlays).values(parlay);
  const parlayId = Number(result[0].insertId);
  
  for (const leg of legs) {
    await db.insert(parlayLegs).values({ ...leg, parlayId });
  }
  
  return parlayId;
}

export async function getParlaysByUser(userId: number, limit = 50): Promise<(Parlay & { legs: ParlayLeg[] })[]> {
  const db = await getDb();
  if (!db) return [];
  
  const userParlays = await db.select().from(parlays).where(eq(parlays.userId, userId)).orderBy(desc(parlays.createdAt)).limit(limit);
  
  const result = [];
  for (const parlay of userParlays) {
    const legs = await db.select().from(parlayLegs).where(eq(parlayLegs.parlayId, parlay.id));
    result.push({ ...parlay, legs });
  }
  
  return result;
}

// ============ PREDICTION FUNCTIONS ============
export async function createPrediction(prediction: InsertPrediction): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(predictions).values(prediction);
  return Number(result[0].insertId);
}

export async function getPredictionByEvent(eventId: string): Promise<Prediction | null> {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(predictions).where(eq(predictions.eventId, eventId)).limit(1);
  return result[0] || null;
}

export async function getRecentPredictions(sportKey?: string, limit = 20): Promise<Prediction[]> {
  const db = await getDb();
  if (!db) return [];
  
  if (sportKey) {
    return db.select().from(predictions).where(eq(predictions.sportKey, sportKey)).orderBy(desc(predictions.createdAt)).limit(limit);
  }
  return db.select().from(predictions).orderBy(desc(predictions.createdAt)).limit(limit);
}

export async function updatePredictionResult(eventId: string, isCorrect: boolean, actualResult: string): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(predictions).set({ isCorrect, actualResult }).where(eq(predictions.eventId, eventId));
}

// ============ MODEL PERFORMANCE FUNCTIONS ============
export async function updateModelPerformance(sportKey: string, modelName: string, isCorrect: boolean, profitLoss: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const existing = await db.select().from(modelPerformance)
    .where(and(eq(modelPerformance.sportKey, sportKey), eq(modelPerformance.modelName, modelName)))
    .limit(1);

  if (existing.length > 0) {
    const current = existing[0];
    const newTotal = current.totalPredictions + 1;
    const newCorrect = current.correctPredictions + (isCorrect ? 1 : 0);
    const newAccuracy = (newCorrect / newTotal).toFixed(4);
    const newProfitLoss = (parseFloat(current.profitLoss || "0") + profitLoss).toFixed(2);

    await db.update(modelPerformance).set({
      totalPredictions: newTotal,
      correctPredictions: newCorrect,
      accuracy: newAccuracy,
      profitLoss: newProfitLoss
    }).where(eq(modelPerformance.id, current.id));
  } else {
    await db.insert(modelPerformance).values({
      sportKey,
      modelName,
      totalPredictions: 1,
      correctPredictions: isCorrect ? 1 : 0,
      accuracy: isCorrect ? "1.0000" : "0.0000",
      profitLoss: profitLoss.toFixed(2)
    });
  }
}

export async function getModelPerformanceStats(): Promise<ModelPerformance[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(modelPerformance).orderBy(desc(modelPerformance.accuracy));
}

// ============ USER PREFERENCES FUNCTIONS ============
export async function getOrCreateUserPreferences(userId: number): Promise<UserPreference | null> {
  const db = await getDb();
  if (!db) return null;

  const existing = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];

  await db.insert(userPreferences).values({ userId });
  const created = await db.select().from(userPreferences).where(eq(userPreferences.userId, userId)).limit(1);
  return created[0] || null;
}

export async function updateUserPreferences(userId: number, prefs: Partial<InsertUserPreference>): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.update(userPreferences).set(prefs).where(eq(userPreferences.userId, userId));
}

// ============ CHART DATA FUNCTIONS ============
export async function getProfitHistory(userId: number, days = 30): Promise<Array<{ date: string; profit: number; cumulative: number }>> {
  const db = await getDb();
  if (!db) return [];

  const startDate = new Date();
  startDate.setDate(startDate.getDate() - days);

  const settledBets = await db.select()
    .from(bets)
    .where(and(
      eq(bets.userId, userId),
      gte(bets.settledAt, startDate)
    ))
    .orderBy(bets.settledAt);

  // Group by date and calculate daily + cumulative profit
  const dailyProfits: Record<string, number> = {};

  for (const bet of settledBets) {
    if (!bet.settledAt) continue;
    const dateKey = bet.settledAt.toISOString().split('T')[0];

    if (!dailyProfits[dateKey]) {
      dailyProfits[dateKey] = 0;
    }

    if (bet.status === "won") {
      dailyProfits[dateKey] += parseFloat(bet.potentialPayout) - parseFloat(bet.stake);
    } else if (bet.status === "lost") {
      dailyProfits[dateKey] -= parseFloat(bet.stake);
    }
    // push = no change
  }

  // Fill in missing dates and calculate cumulative
  const result: Array<{ date: string; profit: number; cumulative: number }> = [];
  let cumulative = 0;

  for (let i = days; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = d.toISOString().split('T')[0];
    const dailyProfit = dailyProfits[dateKey] || 0;
    cumulative += dailyProfit;

    result.push({
      date: dateKey,
      profit: parseFloat(dailyProfit.toFixed(2)),
      cumulative: parseFloat(cumulative.toFixed(2))
    });
  }

  return result;
}

export async function getBetsBySpor(userId: number): Promise<Array<{ sport: string; bets: number; wins: number; losses: number; profit: number }>> {
  const db = await getDb();
  if (!db) return [];

  const allBets = await db.select().from(bets).where(eq(bets.userId, userId));

  const sportStats: Record<string, { bets: number; wins: number; losses: number; profit: number }> = {};

  for (const bet of allBets) {
    if (!sportStats[bet.sportKey]) {
      sportStats[bet.sportKey] = { bets: 0, wins: 0, losses: 0, profit: 0 };
    }

    sportStats[bet.sportKey].bets++;

    if (bet.status === "won") {
      sportStats[bet.sportKey].wins++;
      sportStats[bet.sportKey].profit += parseFloat(bet.potentialPayout) - parseFloat(bet.stake);
    } else if (bet.status === "lost") {
      sportStats[bet.sportKey].losses++;
      sportStats[bet.sportKey].profit -= parseFloat(bet.stake);
    }
  }

  return Object.entries(sportStats).map(([sport, stats]) => ({
    sport: sport.replace("_", " ").replace(/\b\w/g, l => l.toUpperCase()),
    ...stats,
    profit: parseFloat(stats.profit.toFixed(2))
  }));
}
