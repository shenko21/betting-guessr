import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import {
  getOrCreateWallet, updateWalletBalance, addWalletTransaction, getWalletTransactions,
  createBet, getBetsByUser, getPendingBets, updateBetStatus, getUserBetStats,
  createParlay, getParlaysByUser,
  createPrediction, getPredictionByEvent, getRecentPredictions,
  getOrCreateUserPreferences, updateUserPreferences,
  getModelPerformanceStats,
  getProfitHistory, getBetsBySpor
} from "./db";
import { sportsApi } from "./services/sportsApi";
import * as espnApi from "./services/espnApi";
import * as oddsApi from "./services/oddsApi";
import { generatePrediction, calculateParlayOdds, formatOdds } from "./services/predictionEngine";
import { invokeLLM } from "./_core/llm";
import { notifyOwner } from "./_core/notification";

export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // ============ SPORTS DATA ============
  sports: router({
    list: publicProcedure.query(async () => {
      // Use ESPN API for real sports list
      return espnApi.getAvailableSports();
    }),
    
    getOdds: publicProcedure
      .input(z.object({
        sportKey: z.string(),
        regions: z.string().optional(),
        markets: z.string().optional()
      }))
      .query(async ({ input }) => {
        // First try The-Odds-API for real betting odds
        try {
          const realOdds = await oddsApi.getOddsForSport(
            input.sportKey,
            input.regions || "us",
            input.markets || "h2h,spreads,totals"
          );
          if (realOdds && realOdds.length > 0) {
            console.log(`[Odds API] Found ${realOdds.length} events with real odds`);
            return realOdds;
          }
        } catch (error) {
          console.error("[Odds API] Error, trying ESPN fallback:", error);
        }

        // Fallback to ESPN API with synthetic odds
        try {
          const espnData = await espnApi.getOddsForSport(input.sportKey);
          if (espnData && espnData.length > 0) {
            console.log(`[ESPN API] Fallback: Found ${espnData.length} events`);
            return espnData;
          }
        } catch (error) {
          console.error("[ESPN API] Error, falling back to mock data:", error);
        }

        // Final fallback to mock data
        return sportsApi.getOdds(input.sportKey, input.regions, input.markets);
      }),

    // Get API quota info
    getApiQuota: publicProcedure.query(() => {
      return oddsApi.getApiQuota();
    }),
    
    getScores: publicProcedure
      .input(z.object({ sportKey: z.string(), daysFrom: z.number().optional() }))
      .query(async ({ input }) => {
        // Use ESPN API for real scores
        try {
          const events = await espnApi.getScoreboard(input.sportKey);
          return events.map(event => ({
            id: event.id,
            sportKey: input.sportKey,
            homeTeam: event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.team.displayName || 'TBD',
            awayTeam: event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.team.displayName || 'TBD',
            homeScore: parseInt(event.competitions[0]?.competitors.find(c => c.homeAway === 'home')?.score || '0'),
            awayScore: parseInt(event.competitions[0]?.competitors.find(c => c.homeAway === 'away')?.score || '0'),
            completed: event.status.type.completed,
            status: event.status.type.state,
          }));
        } catch (error) {
          console.error("[ESPN API] Error fetching scores:", error);
          return sportsApi.getScores(input.sportKey, input.daysFrom);
        }
      }),
    
    getNews: publicProcedure
      .input(z.object({ sportKey: z.string() }))
      .query(async ({ input }) => {
        return espnApi.getNews(input.sportKey);
      }),
    
    getTeams: publicProcedure
      .input(z.object({ sportKey: z.string() }))
      .query(async ({ input }) => {
        return espnApi.getTeams(input.sportKey);
      }),
  }),

  // ============ PREDICTIONS ============
  predictions: router({
    generate: publicProcedure
      .input(z.object({ sportKey: z.string(), eventId: z.string().optional() }))
      .query(async ({ input }) => {
        const events = await sportsApi.getOdds(input.sportKey);
        
        if (input.eventId) {
          const event = events.find(e => e.id === input.eventId);
          if (!event) return null;
          return generatePrediction(event);
        }
        
        return events.map(event => generatePrediction(event));
      }),
    
    getRecent: publicProcedure
      .input(z.object({ sportKey: z.string().optional(), limit: z.number().optional() }))
      .query(async ({ input }) => {
        return getRecentPredictions(input.sportKey, input.limit);
      }),
    
    getModelStats: publicProcedure.query(async () => {
      return getModelPerformanceStats();
    }),
  }),

  // ============ WALLET ============
  wallet: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getOrCreateWallet(ctx.user.id);
    }),
    
    deposit: protectedProcedure
      .input(z.object({ amount: z.number().min(1).max(100000) }))
      .mutation(async ({ ctx, input }) => {
        const wallet = await getOrCreateWallet(ctx.user.id);
        if (!wallet) throw new Error("Wallet not found");
        
        const newBalance = (parseFloat(wallet.balance) + input.amount).toFixed(2);
        await updateWalletBalance(wallet.id, newBalance);
        
        await addWalletTransaction({
          walletId: wallet.id,
          userId: ctx.user.id,
          type: "deposit",
          amount: input.amount.toFixed(2),
          balanceAfter: newBalance,
          description: `Deposited $${input.amount.toFixed(2)} virtual funds`
        });
        
        return { success: true, newBalance };
      }),
    
    getTransactions: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getWalletTransactions(ctx.user.id, input.limit);
      }),
  }),

  // ============ BETS ============
  bets: router({
    place: protectedProcedure
      .input(z.object({
        eventId: z.string(),
        sportKey: z.string(),
        homeTeam: z.string(),
        awayTeam: z.string(),
        commenceTime: z.string(),
        betType: z.enum(["moneyline", "spread", "total"]),
        selection: z.string(),
        odds: z.number(),
        stake: z.number().min(1),
      }))
      .mutation(async ({ ctx, input }) => {
        const wallet = await getOrCreateWallet(ctx.user.id);
        if (!wallet) throw new Error("Wallet not found");
        
        const balance = parseFloat(wallet.balance);
        if (balance < input.stake) {
          throw new Error("Insufficient balance");
        }
        
        // Calculate potential payout
        let potentialPayout: number;
        if (input.odds > 0) {
          potentialPayout = input.stake + (input.stake * input.odds / 100);
        } else {
          potentialPayout = input.stake + (input.stake * 100 / Math.abs(input.odds));
        }
        
        // Deduct stake from wallet
        const newBalance = (balance - input.stake).toFixed(2);
        await updateWalletBalance(wallet.id, newBalance);
        
        // Create bet
        const betId = await createBet({
          userId: ctx.user.id,
          eventId: input.eventId,
          sportKey: input.sportKey,
          homeTeam: input.homeTeam,
          awayTeam: input.awayTeam,
          commenceTime: new Date(input.commenceTime),
          betType: input.betType,
          selection: input.selection,
          odds: input.odds.toString(),
          stake: input.stake.toFixed(2),
          potentialPayout: potentialPayout.toFixed(2),
        });
        
        // Record transaction
        await addWalletTransaction({
          walletId: wallet.id,
          userId: ctx.user.id,
          type: "bet_placed",
          amount: (-input.stake).toFixed(2),
          balanceAfter: newBalance,
          referenceId: betId,
          referenceType: "bet",
          description: `Bet placed: ${input.selection} @ ${formatOdds(input.odds)}`
        });
        
        return { success: true, betId, newBalance };
      }),
    
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getBetsByUser(ctx.user.id, input.limit);
      }),
    
    pending: protectedProcedure.query(async ({ ctx }) => {
      return getPendingBets(ctx.user.id);
    }),
    
    stats: protectedProcedure.query(async ({ ctx }) => {
      return getUserBetStats(ctx.user.id);
    }),

    // Chart data endpoints
    profitHistory: protectedProcedure
      .input(z.object({ days: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getProfitHistory(ctx.user.id, input.days || 30);
      }),

    statsBySport: protectedProcedure.query(async ({ ctx }) => {
      return getBetsBySpor(ctx.user.id);
    }),
    
    settle: protectedProcedure
      .input(z.object({
        betId: z.number(),
        status: z.enum(["won", "lost", "push"]),
        result: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        // Manual settlement option
        const bets = await getBetsByUser(ctx.user.id, 100);
        const bet = bets.find(b => b.id === input.betId);

        if (!bet || bet.userId !== ctx.user.id) {
          throw new Error("Bet not found");
        }

        if (bet.status !== "pending") {
          throw new Error("Bet already settled");
        }

        await updateBetStatus(input.betId, input.status, input.result);

        const wallet = await getOrCreateWallet(ctx.user.id);
        if (!wallet) throw new Error("Wallet not found");

        if (input.status === "won") {
          const payout = parseFloat(bet.potentialPayout);
          const newBalance = (parseFloat(wallet.balance) + payout).toFixed(2);
          await updateWalletBalance(wallet.id, newBalance);

          await addWalletTransaction({
            walletId: wallet.id,
            userId: ctx.user.id,
            type: "bet_won",
            amount: payout.toFixed(2),
            balanceAfter: newBalance,
            referenceId: bet.id,
            referenceType: "bet",
            description: `Bet won: ${bet.selection} @ ${formatOdds(parseFloat(bet.odds))}`
          });

          // Check for milestone notification
          const stats = await getUserBetStats(ctx.user.id);
          if (stats && stats.winRate >= 60 && stats.settledBets >= 10) {
            await notifyOwner({
              title: "User Achievement: High Win Rate",
              content: `User ${ctx.user.name || ctx.user.openId} has achieved a ${stats.winRate.toFixed(1)}% win rate over ${stats.settledBets} bets with $${stats.profitLoss.toFixed(2)} profit!`
            });
          }

          return { success: true, newBalance };
        } else if (input.status === "push") {
          const refund = parseFloat(bet.stake);
          const newBalance = (parseFloat(wallet.balance) + refund).toFixed(2);
          await updateWalletBalance(wallet.id, newBalance);

          await addWalletTransaction({
            walletId: wallet.id,
            userId: ctx.user.id,
            type: "bet_refund",
            amount: refund.toFixed(2),
            balanceAfter: newBalance,
            referenceId: bet.id,
            referenceType: "bet",
            description: `Bet pushed (refunded): ${bet.selection}`
          });

          return { success: true, newBalance };
        }

        return { success: true, newBalance: wallet.balance };
      }),

    // Auto-settle bets based on actual game results
    autoSettle: protectedProcedure.mutation(async ({ ctx }) => {
      const pendingBets = await getPendingBets(ctx.user.id);
      if (pendingBets.length === 0) {
        return { settled: 0, results: [] };
      }

      const results: Array<{
        betId: number;
        selection: string;
        status: "won" | "lost" | "push" | "pending";
        result?: string;
      }> = [];

      // Group bets by sport to minimize API calls
      const betsBySport = pendingBets.reduce((acc, bet) => {
        if (!acc[bet.sportKey]) acc[bet.sportKey] = [];
        acc[bet.sportKey].push(bet);
        return acc;
      }, {} as Record<string, typeof pendingBets>);

      const wallet = await getOrCreateWallet(ctx.user.id);
      if (!wallet) throw new Error("Wallet not found");

      let currentBalance = parseFloat(wallet.balance);

      for (const [sportKey, bets] of Object.entries(betsBySport)) {
        // Fetch completed games for this sport
        const completedGames = await oddsApi.getCompletedGames(sportKey, 3);

        for (const bet of bets) {
          // Find the game result
          const game = completedGames.find(
            (g) =>
              g.id === bet.eventId ||
              (g.homeTeam === bet.homeTeam && g.awayTeam === bet.awayTeam)
          );

          if (!game) {
            // Game not yet completed
            results.push({
              betId: bet.id,
              selection: bet.selection,
              status: "pending",
            });
            continue;
          }

          // Determine bet outcome
          let status: "won" | "lost" | "push" = "lost";
          const resultText = `${game.homeTeam} ${game.homeScore} - ${game.awayScore} ${game.awayTeam}`;

          if (bet.betType === "moneyline") {
            // Moneyline bet
            const winner =
              game.homeScore > game.awayScore
                ? game.homeTeam
                : game.awayScore > game.homeScore
                ? game.awayTeam
                : "push";

            if (winner === "push") {
              status = "push";
            } else if (bet.selection.includes(winner)) {
              status = "won";
            } else {
              status = "lost";
            }
          } else if (bet.betType === "spread") {
            // Spread bet - parse the spread from selection
            const spreadMatch = bet.selection.match(/([+-]?\d+\.?\d*)/);
            if (spreadMatch) {
              const spread = parseFloat(spreadMatch[1]);
              const isHomeTeam = bet.selection.includes(bet.homeTeam);
              const adjustedScore = isHomeTeam
                ? game.homeScore + spread
                : game.awayScore + spread;
              const opponentScore = isHomeTeam ? game.awayScore : game.homeScore;

              if (adjustedScore > opponentScore) {
                status = "won";
              } else if (adjustedScore === opponentScore) {
                status = "push";
              } else {
                status = "lost";
              }
            }
          } else if (bet.betType === "total") {
            // Total (over/under) bet
            const totalMatch = bet.selection.match(/(\d+\.?\d*)/);
            if (totalMatch) {
              const line = parseFloat(totalMatch[1]);
              const actualTotal = game.homeScore + game.awayScore;
              const isOver = bet.selection.toLowerCase().includes("over");

              if (actualTotal === line) {
                status = "push";
              } else if (
                (isOver && actualTotal > line) ||
                (!isOver && actualTotal < line)
              ) {
                status = "won";
              } else {
                status = "lost";
              }
            }
          }

          // Update bet status
          await updateBetStatus(bet.id, status, resultText);

          // Update wallet based on result
          if (status === "won") {
            const payout = parseFloat(bet.potentialPayout);
            currentBalance += payout;
            await addWalletTransaction({
              walletId: wallet.id,
              userId: ctx.user.id,
              type: "bet_won",
              amount: payout.toFixed(2),
              balanceAfter: currentBalance.toFixed(2),
              referenceId: bet.id,
              referenceType: "bet",
              description: `Bet won: ${bet.selection} | ${resultText}`,
            });
          } else if (status === "push") {
            const refund = parseFloat(bet.stake);
            currentBalance += refund;
            await addWalletTransaction({
              walletId: wallet.id,
              userId: ctx.user.id,
              type: "bet_refund",
              amount: refund.toFixed(2),
              balanceAfter: currentBalance.toFixed(2),
              referenceId: bet.id,
              referenceType: "bet",
              description: `Bet pushed: ${bet.selection} | ${resultText}`,
            });
          }

          results.push({
            betId: bet.id,
            selection: bet.selection,
            status,
            result: resultText,
          });
        }
      }

      // Update final wallet balance
      await updateWalletBalance(wallet.id, currentBalance.toFixed(2));

      const settledCount = results.filter((r) => r.status !== "pending").length;

      // Notify on significant settlements
      if (settledCount > 0) {
        const stats = await getUserBetStats(ctx.user.id);
        if (stats && stats.winRate >= 60 && stats.settledBets >= 10) {
          await notifyOwner({
            title: "User Achievement: High Win Rate",
            content: `User ${ctx.user.name || ctx.user.openId} has achieved a ${stats.winRate.toFixed(1)}% win rate over ${stats.settledBets} bets!`,
          });
        }
      }

      return { settled: settledCount, results, newBalance: currentBalance.toFixed(2) };
    }),
  }),

  // ============ PARLAYS ============
  parlays: router({
    calculate: publicProcedure
      .input(z.object({ legs: z.array(z.object({ odds: z.number() })) }))
      .query(({ input }) => {
        return calculateParlayOdds(input.legs);
      }),
    
    place: protectedProcedure
      .input(z.object({
        stake: z.number().min(1),
        legs: z.array(z.object({
          eventId: z.string(),
          sportKey: z.string(),
          homeTeam: z.string(),
          awayTeam: z.string(),
          commenceTime: z.string(),
          betType: z.enum(["moneyline", "spread", "total"]),
          selection: z.string(),
          odds: z.number(),
        }))
      }))
      .mutation(async ({ ctx, input }) => {
        if (input.legs.length < 2) {
          throw new Error("Parlay must have at least 2 legs");
        }
        
        const wallet = await getOrCreateWallet(ctx.user.id);
        if (!wallet) throw new Error("Wallet not found");
        
        const balance = parseFloat(wallet.balance);
        if (balance < input.stake) {
          throw new Error("Insufficient balance");
        }
        
        const { combinedOdds, impliedProbability } = calculateParlayOdds(input.legs);
        
        let potentialPayout: number;
        if (combinedOdds > 0) {
          potentialPayout = input.stake + (input.stake * combinedOdds / 100);
        } else {
          potentialPayout = input.stake + (input.stake * 100 / Math.abs(combinedOdds));
        }
        
        const newBalance = (balance - input.stake).toFixed(2);
        await updateWalletBalance(wallet.id, newBalance);
        
        const parlayId = await createParlay(
          {
            userId: ctx.user.id,
            stake: input.stake.toFixed(2),
            combinedOdds: combinedOdds.toString(),
            potentialPayout: potentialPayout.toFixed(2),
          },
          input.legs.map(leg => ({
            eventId: leg.eventId,
            sportKey: leg.sportKey,
            homeTeam: leg.homeTeam,
            awayTeam: leg.awayTeam,
            commenceTime: new Date(leg.commenceTime),
            betType: leg.betType,
            selection: leg.selection,
            odds: leg.odds.toString(),
          }))
        );
        
        await addWalletTransaction({
          walletId: wallet.id,
          userId: ctx.user.id,
          type: "bet_placed",
          amount: (-input.stake).toFixed(2),
          balanceAfter: newBalance,
          referenceId: parlayId,
          referenceType: "parlay",
          description: `${input.legs.length}-leg parlay placed @ ${formatOdds(combinedOdds)}`
        });
        
        return { success: true, parlayId, combinedOdds, potentialPayout, newBalance };
      }),
    
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => {
        return getParlaysByUser(ctx.user.id, input.limit);
      }),
  }),

  // ============ USER PREFERENCES ============
  preferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      return getOrCreateUserPreferences(ctx.user.id);
    }),
    
    update: protectedProcedure
      .input(z.object({
        riskTolerance: z.enum(["conservative", "moderate", "aggressive"]).optional(),
        favoriteSports: z.array(z.string()).optional(),
        maxBetAmount: z.number().optional(),
        dailyBetLimit: z.number().optional(),
        notificationsEnabled: z.boolean().optional(),
        responsibleGamblingAcknowledged: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const updateData: Record<string, unknown> = {};
        if (input.riskTolerance) updateData.riskTolerance = input.riskTolerance;
        if (input.favoriteSports) updateData.favoriteSports = input.favoriteSports;
        if (input.maxBetAmount !== undefined) updateData.maxBetAmount = input.maxBetAmount.toFixed(2);
        if (input.dailyBetLimit !== undefined) updateData.dailyBetLimit = input.dailyBetLimit.toFixed(2);
        if (input.notificationsEnabled !== undefined) updateData.notificationsEnabled = input.notificationsEnabled;
        if (input.responsibleGamblingAcknowledged !== undefined) updateData.responsibleGamblingAcknowledged = input.responsibleGamblingAcknowledged;
        await updateUserPreferences(ctx.user.id, updateData);
        return { success: true };
      }),
  }),

  // ============ AI ADVISOR ============
  advisor: router({
    analyze: protectedProcedure
      .input(z.object({
        eventId: z.string(),
        sportKey: z.string(),
        question: z.string().optional()
      }))
      .mutation(async ({ ctx, input }) => {
        const events = await sportsApi.getOdds(input.sportKey);
        const event = events.find(e => e.id === input.eventId);
        
        if (!event) throw new Error("Event not found");
        
        const prediction = generatePrediction(event);
        const prefs = await getOrCreateUserPreferences(ctx.user.id);
        const stats = await getUserBetStats(ctx.user.id);
        
        const systemPrompt = `You are an expert sports betting analyst and advisor. You help users make informed betting decisions while always emphasizing responsible gambling.

IMPORTANT: Always remind users that:
1. Sports betting involves significant financial risk
2. Past performance does not guarantee future results
3. Never bet more than you can afford to lose
4. This is for educational and entertainment purposes only

User's risk tolerance: ${prefs?.riskTolerance || 'moderate'}
User's betting stats: ${stats ? `${stats.winRate.toFixed(1)}% win rate, ${stats.totalBets} total bets, $${stats.profitLoss.toFixed(2)} P/L` : 'New user'}`;

        const userPrompt = `Analyze this betting opportunity:

Match: ${event.home_team} vs ${event.away_team}
Sport: ${event.sport_key}
Date: ${new Date(event.commence_time).toLocaleString()}

Model Prediction:
- ${event.home_team} win: ${(prediction.homeWinProbability * 100).toFixed(1)}%
- ${event.away_team} win: ${(prediction.awayWinProbability * 100).toFixed(1)}%
- Draw: ${(prediction.drawProbability * 100).toFixed(1)}%
- Predicted Score: ${prediction.predictedHomeScore} - ${prediction.predictedAwayScore}
- Confidence: ${(prediction.confidence * 100).toFixed(1)}%
- Value Rating: ${prediction.valueRating}

Value Bets Found: ${prediction.valueBets.length > 0 ? prediction.valueBets.map(vb => `${vb.selection} @ ${formatOdds(vb.odds)} (EV: +${vb.expectedValue}%)`).join(', ') : 'None'}

${input.question ? `User Question: ${input.question}` : 'Provide a comprehensive analysis and betting recommendation.'}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: userPrompt }
          ]
        });

        return {
          analysis: response.choices[0]?.message?.content || "Unable to generate analysis",
          prediction,
          event
        };
      }),
    
    getAdvice: protectedProcedure
      .input(z.object({ question: z.string() }))
      .mutation(async ({ ctx, input }) => {
        const stats = await getUserBetStats(ctx.user.id);
        const prefs = await getOrCreateUserPreferences(ctx.user.id);
        
        const systemPrompt = `You are an expert sports betting advisor. Provide helpful, educational advice while always emphasizing responsible gambling.

CRITICAL RULES:
1. Never guarantee wins or profits
2. Always emphasize the risks of gambling
3. Encourage responsible betting limits
4. Recommend paper trading for practice
5. Suggest bankroll management strategies

User Profile:
- Risk Tolerance: ${prefs?.riskTolerance || 'moderate'}
- Betting History: ${stats ? `${stats.totalBets} bets, ${stats.winRate.toFixed(1)}% win rate, $${stats.profitLoss.toFixed(2)} P/L` : 'New user'}`;

        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: input.question }
          ]
        });

        return {
          advice: response.choices[0]?.message?.content || "Unable to generate advice"
        };
      }),
  }),
});

export type AppRouter = typeof appRouter;
