import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock database functions with all required exports
vi.mock("./db", () => ({
  getDb: vi.fn(() => Promise.resolve(null)),
  getUserByOpenId: vi.fn(),
  upsertUser: vi.fn(),
  getWalletByUserId: vi.fn(() => Promise.resolve({
    id: 1,
    userId: 1,
    balance: "10000.00",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  createWallet: vi.fn(() => Promise.resolve({
    id: 1,
    userId: 1,
    balance: "10000.00",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getOrCreateWallet: vi.fn(() => Promise.resolve({
    id: 1,
    userId: 1,
    balance: "10000.00",
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getUserPreferences: vi.fn(() => Promise.resolve({
    id: 1,
    userId: 1,
    riskTolerance: "moderate",
    maxBetAmount: "100.00",
    dailyBetLimit: "500.00",
    notificationsEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getOrCreateUserPreferences: vi.fn(() => Promise.resolve({
    id: 1,
    userId: 1,
    riskTolerance: "moderate",
    maxBetAmount: "100.00",
    dailyBetLimit: "500.00",
    notificationsEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  updateUserPreferences: vi.fn(() => Promise.resolve({
    id: 1,
    userId: 1,
    riskTolerance: "moderate",
    maxBetAmount: "100.00",
    dailyBetLimit: "500.00",
    notificationsEnabled: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  })),
  getBetsByUserId: vi.fn(() => Promise.resolve([])),
  getUserBetStats: vi.fn(() => Promise.resolve({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalStaked: 0,
    totalWon: 0,
    winRate: 0,
    profitLoss: 0,
  })),
  getBetStats: vi.fn(() => Promise.resolve({
    totalBets: 0,
    wonBets: 0,
    lostBets: 0,
    totalStaked: 0,
    totalWon: 0,
    winRate: 0,
    profitLoss: 0,
  })),
  createBet: vi.fn(),
  settleBet: vi.fn(),
  getParlaysByUserId: vi.fn(() => Promise.resolve([])),
  createParlay: vi.fn(),
  getWalletTransactions: vi.fn(() => Promise.resolve([])),
  createWalletTransaction: vi.fn(),
  updateWalletBalance: vi.fn(),
  getModelPerformance: vi.fn(() => Promise.resolve([])),
  recordPrediction: vi.fn(),
  updatePredictionOutcome: vi.fn(),
}));

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-123",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

function createUnauthContext(): TrpcContext {
  return {
    user: null,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: vi.fn(),
    } as unknown as TrpcContext["res"],
  };
}

describe("Sports Betting API", () => {
  describe("auth.me", () => {
    it("returns user when authenticated", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.me();
      
      expect(result).toBeDefined();
      expect(result?.openId).toBe("test-user-123");
      expect(result?.email).toBe("test@example.com");
    });

    it("returns null when not authenticated", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.auth.me();
      
      expect(result).toBeNull();
    });
  });

  describe("sports.list", () => {
    it("returns a list of available sports", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.sports.list();
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty("key");
      expect(result[0]).toHaveProperty("title");
    });
  });

  describe("sports.getOdds", () => {
    it("returns odds for a given sport", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.sports.getOdds({ sportKey: "basketball_nba" });
      
      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });
  });

  describe("wallet.get", () => {
    it("returns wallet for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.wallet.get();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("balance");
    });

    it("throws error for unauthenticated user", async () => {
      const ctx = createUnauthContext();
      const caller = appRouter.createCaller(ctx);
      
      await expect(caller.wallet.get()).rejects.toThrow();
    });
  });

  describe("preferences.get", () => {
    it("returns preferences for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.preferences.get();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("riskTolerance");
    });
  });

  describe("bets.stats", () => {
    it("returns betting statistics for authenticated user", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.bets.stats();
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("totalBets");
      expect(result).toHaveProperty("winRate");
      expect(result).toHaveProperty("profitLoss");
    });
  });

  describe("parlays.calculate", () => {
    it("calculates combined odds for parlay legs", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.parlays.calculate({
        legs: [
          { odds: -110 },
          { odds: 150 },
        ],
      });
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("combinedOdds");
      expect(result).toHaveProperty("impliedProbability");
      expect(typeof result.combinedOdds).toBe("number");
      expect(typeof result.impliedProbability).toBe("number");
    });

    it("handles positive odds correctly", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.parlays.calculate({
        legs: [
          { odds: 200 },
          { odds: 200 },
        ],
      });
      
      expect(result.combinedOdds).toBeGreaterThan(0);
      // Two +200 underdogs combined should have low probability
      expect(result.impliedProbability).toBeLessThan(20);
    });

    it("handles negative odds correctly", async () => {
      const ctx = createAuthContext();
      const caller = appRouter.createCaller(ctx);
      
      const result = await caller.parlays.calculate({
        legs: [
          { odds: -200 },
          { odds: -200 },
        ],
      });
      
      // Two heavy favorites combined still have decent probability
      expect(result.impliedProbability).toBeGreaterThan(30);
    });
  });
});

describe("Prediction Engine Logic", () => {
  describe("Parlay Odds Calculation", () => {
    it("correctly converts American odds to decimal", () => {
      // -110 American = 1.909 decimal
      // +150 American = 2.5 decimal
      const americanToDecimal = (odds: number): number => {
        if (odds > 0) {
          return (odds / 100) + 1;
        } else {
          return (100 / Math.abs(odds)) + 1;
        }
      };

      expect(americanToDecimal(-110)).toBeCloseTo(1.909, 2);
      expect(americanToDecimal(150)).toBeCloseTo(2.5, 2);
      expect(americanToDecimal(-200)).toBeCloseTo(1.5, 2);
      expect(americanToDecimal(200)).toBeCloseTo(3.0, 2);
    });

    it("correctly calculates implied probability", () => {
      const impliedProbability = (odds: number): number => {
        if (odds > 0) {
          return 100 / (odds + 100);
        } else {
          return Math.abs(odds) / (Math.abs(odds) + 100);
        }
      };

      // -200 implies ~66.67% probability
      expect(impliedProbability(-200)).toBeCloseTo(0.6667, 2);
      // +200 implies ~33.33% probability
      expect(impliedProbability(200)).toBeCloseTo(0.3333, 2);
      // -110 implies ~52.38% probability
      expect(impliedProbability(-110)).toBeCloseTo(0.5238, 2);
    });
  });
});
