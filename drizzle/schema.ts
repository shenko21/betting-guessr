import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, decimal, boolean, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Virtual wallet for paper trading
 */
export const wallets = mysqlTable("wallets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("10000.00"),
  totalDeposited: decimal("totalDeposited", { precision: 12, scale: 2 }).notNull().default("10000.00"),
  totalWithdrawn: decimal("totalWithdrawn", { precision: 12, scale: 2 }).notNull().default("0.00"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Wallet = typeof wallets.$inferSelect;
export type InsertWallet = typeof wallets.$inferInsert;

/**
 * Individual bets placed by users
 */
export const bets = mysqlTable("bets", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sportKey: varchar("sportKey", { length: 64 }).notNull(),
  homeTeam: varchar("homeTeam", { length: 128 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 128 }).notNull(),
  commenceTime: timestamp("commenceTime").notNull(),
  betType: mysqlEnum("betType", ["moneyline", "spread", "total", "parlay"]).notNull(),
  selection: varchar("selection", { length: 256 }).notNull(),
  odds: decimal("odds", { precision: 8, scale: 2 }).notNull(),
  stake: decimal("stake", { precision: 10, scale: 2 }).notNull(),
  potentialPayout: decimal("potentialPayout", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "won", "lost", "push", "cancelled"]).default("pending").notNull(),
  result: text("result"),
  settledAt: timestamp("settledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Bet = typeof bets.$inferSelect;
export type InsertBet = typeof bets.$inferInsert;

/**
 * Parlay bets (multi-leg bets)
 */
export const parlays = mysqlTable("parlays", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  stake: decimal("stake", { precision: 10, scale: 2 }).notNull(),
  combinedOdds: decimal("combinedOdds", { precision: 10, scale: 2 }).notNull(),
  potentialPayout: decimal("potentialPayout", { precision: 12, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "won", "lost", "push", "cancelled"]).default("pending").notNull(),
  settledAt: timestamp("settledAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Parlay = typeof parlays.$inferSelect;
export type InsertParlay = typeof parlays.$inferInsert;

/**
 * Individual legs of a parlay
 */
export const parlayLegs = mysqlTable("parlay_legs", {
  id: int("id").autoincrement().primaryKey(),
  parlayId: int("parlayId").notNull(),
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sportKey: varchar("sportKey", { length: 64 }).notNull(),
  homeTeam: varchar("homeTeam", { length: 128 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 128 }).notNull(),
  commenceTime: timestamp("commenceTime").notNull(),
  betType: mysqlEnum("betType", ["moneyline", "spread", "total"]).notNull(),
  selection: varchar("selection", { length: 256 }).notNull(),
  odds: decimal("odds", { precision: 8, scale: 2 }).notNull(),
  status: mysqlEnum("status", ["pending", "won", "lost", "push"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ParlayLeg = typeof parlayLegs.$inferSelect;
export type InsertParlayLeg = typeof parlayLegs.$inferInsert;

/**
 * AI predictions for events
 */
export const predictions = mysqlTable("predictions", {
  id: int("id").autoincrement().primaryKey(),
  eventId: varchar("eventId", { length: 128 }).notNull(),
  sportKey: varchar("sportKey", { length: 64 }).notNull(),
  homeTeam: varchar("homeTeam", { length: 128 }).notNull(),
  awayTeam: varchar("awayTeam", { length: 128 }).notNull(),
  commenceTime: timestamp("commenceTime").notNull(),
  predictedWinner: varchar("predictedWinner", { length: 128 }),
  homeWinProbability: decimal("homeWinProbability", { precision: 5, scale: 4 }),
  awayWinProbability: decimal("awayWinProbability", { precision: 5, scale: 4 }),
  drawProbability: decimal("drawProbability", { precision: 5, scale: 4 }),
  predictedHomeScore: decimal("predictedHomeScore", { precision: 5, scale: 2 }),
  predictedAwayScore: decimal("predictedAwayScore", { precision: 5, scale: 2 }),
  confidence: decimal("confidence", { precision: 5, scale: 4 }),
  valueRating: mysqlEnum("valueRating", ["strong_value", "moderate_value", "fair_value", "poor_value"]),
  modelUsed: varchar("modelUsed", { length: 64 }),
  rationale: text("rationale"),
  isCorrect: boolean("isCorrect"),
  actualResult: text("actualResult"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Prediction = typeof predictions.$inferSelect;
export type InsertPrediction = typeof predictions.$inferInsert;

/**
 * Model performance tracking for adaptive learning
 */
export const modelPerformance = mysqlTable("model_performance", {
  id: int("id").autoincrement().primaryKey(),
  sportKey: varchar("sportKey", { length: 64 }).notNull(),
  modelName: varchar("modelName", { length: 64 }).notNull(),
  totalPredictions: int("totalPredictions").notNull().default(0),
  correctPredictions: int("correctPredictions").notNull().default(0),
  accuracy: decimal("accuracy", { precision: 5, scale: 4 }),
  avgConfidence: decimal("avgConfidence", { precision: 5, scale: 4 }),
  profitLoss: decimal("profitLoss", { precision: 12, scale: 2 }).default("0.00"),
  lastUpdated: timestamp("lastUpdated").defaultNow().onUpdateNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ModelPerformance = typeof modelPerformance.$inferSelect;
export type InsertModelPerformance = typeof modelPerformance.$inferInsert;

/**
 * User preferences and risk settings
 */
export const userPreferences = mysqlTable("user_preferences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  riskTolerance: mysqlEnum("riskTolerance", ["conservative", "moderate", "aggressive"]).default("moderate").notNull(),
  favoriteSports: json("favoriteSports").$type<string[]>(),
  maxBetAmount: decimal("maxBetAmount", { precision: 10, scale: 2 }).default("100.00"),
  dailyBetLimit: decimal("dailyBetLimit", { precision: 10, scale: 2 }).default("500.00"),
  notificationsEnabled: boolean("notificationsEnabled").default(true),
  responsibleGamblingAcknowledged: boolean("responsibleGamblingAcknowledged").default(false),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserPreference = typeof userPreferences.$inferSelect;
export type InsertUserPreference = typeof userPreferences.$inferInsert;

/**
 * Wallet transactions for audit trail
 */
export const walletTransactions = mysqlTable("wallet_transactions", {
  id: int("id").autoincrement().primaryKey(),
  walletId: int("walletId").notNull(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["deposit", "withdrawal", "bet_placed", "bet_won", "bet_lost", "bet_refund"]).notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  balanceAfter: decimal("balanceAfter", { precision: 12, scale: 2 }).notNull(),
  referenceId: int("referenceId"),
  referenceType: varchar("referenceType", { length: 32 }),
  description: text("description"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type WalletTransaction = typeof walletTransactions.$inferSelect;
export type InsertWalletTransaction = typeof walletTransactions.$inferInsert;
