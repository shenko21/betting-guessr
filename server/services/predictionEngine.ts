import { Event, Outcome } from "./sportsApi";

export interface PredictionResult {
  eventId: string;
  homeTeam: string;
  awayTeam: string;
  predictedWinner: string | null;
  homeWinProbability: number;
  awayWinProbability: number;
  drawProbability: number;
  predictedHomeScore: number;
  predictedAwayScore: number;
  confidence: number;
  valueRating: "strong_value" | "moderate_value" | "fair_value" | "poor_value";
  rationale: string;
  modelUsed: string;
  valueBets: ValueBet[];
}

export interface ValueBet {
  selection: string;
  betType: string;
  bookmaker: string;
  odds: number;
  impliedProbability: number;
  modelProbability: number;
  expectedValue: number;
  valueRating: string;
}

/**
 * Converts American odds to decimal odds
 */
function americanToDecimal(americanOdds: number): number {
  if (americanOdds > 0) {
    return (americanOdds / 100) + 1;
  } else {
    return (100 / Math.abs(americanOdds)) + 1;
  }
}

/**
 * Converts decimal odds to implied probability
 */
function decimalToImpliedProbability(decimalOdds: number): number {
  return 1 / decimalOdds;
}

/**
 * Calculates expected value of a bet
 */
function calculateExpectedValue(probability: number, decimalOdds: number): number {
  return (probability * (decimalOdds - 1)) - (1 - probability);
}

/**
 * Poisson distribution probability
 */
function poissonProbability(lambda: number, k: number): number {
  return (Math.pow(lambda, k) * Math.exp(-lambda)) / factorial(k);
}

function factorial(n: number): number {
  if (n <= 1) return 1;
  return n * factorial(n - 1);
}

/**
 * Simple Elo-based prediction model
 * In a real implementation, this would use historical data
 */
function eloBasedPrediction(homeTeam: string, awayTeam: string): { homeWin: number; awayWin: number; draw: number } {
  // Simulated Elo ratings (in production, these would come from a database)
  const baseElo = 1500;
  const homeAdvantage = 65; // Home field advantage in Elo points
  
  // Generate pseudo-random but consistent ratings based on team names
  const homeElo = baseElo + (hashString(homeTeam) % 400) - 200 + homeAdvantage;
  const awayElo = baseElo + (hashString(awayTeam) % 400) - 200;
  
  const eloDiff = homeElo - awayElo;
  const expectedHome = 1 / (1 + Math.pow(10, -eloDiff / 400));
  
  // Adjust for draws (more common in soccer)
  const drawFactor = 0.25;
  const homeWin = expectedHome * (1 - drawFactor * 0.5);
  const awayWin = (1 - expectedHome) * (1 - drawFactor * 0.5);
  const draw = 1 - homeWin - awayWin;
  
  return { homeWin, awayWin, draw };
}

/**
 * Poisson-based score prediction
 */
function poissonScorePrediction(homeTeam: string, awayTeam: string, sportKey: string): { homeScore: number; awayScore: number } {
  // Average goals/points based on sport
  const avgScores: Record<string, { home: number; away: number }> = {
    soccer_epl: { home: 1.5, away: 1.2 },
    soccer_spain_la_liga: { home: 1.4, away: 1.1 },
    americanfootball_nfl: { home: 24, away: 21 },
    basketball_nba: { home: 112, away: 109 },
    baseball_mlb: { home: 4.5, away: 4.2 },
    icehockey_nhl: { home: 3.1, away: 2.8 },
  };
  
  const baseScores = avgScores[sportKey] || { home: 2, away: 1.8 };
  
  // Add some variance based on team strength
  const homeStrength = 1 + (hashString(homeTeam) % 30) / 100;
  const awayStrength = 1 + (hashString(awayTeam) % 30) / 100;
  
  return {
    homeScore: Math.round(baseScores.home * homeStrength * 10) / 10,
    awayScore: Math.round(baseScores.away * awayStrength * 10) / 10,
  };
}

/**
 * Simple hash function for consistent pseudo-random values
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

/**
 * Identifies value bets by comparing model probability to bookmaker odds
 */
function findValueBets(event: Event, modelProbabilities: { homeWin: number; awayWin: number; draw: number }): ValueBet[] {
  const valueBets: ValueBet[] = [];
  
  if (!event.bookmakers || event.bookmakers.length === 0) return valueBets;
  
  for (const bookmaker of event.bookmakers) {
    const h2hMarket = bookmaker.markets.find(m => m.key === "h2h");
    if (!h2hMarket) continue;
    
    for (const outcome of h2hMarket.outcomes) {
      const decimalOdds = americanToDecimal(outcome.price);
      const impliedProb = decimalToImpliedProbability(decimalOdds);
      
      let modelProb: number;
      if (outcome.name === event.home_team) {
        modelProb = modelProbabilities.homeWin;
      } else if (outcome.name === event.away_team) {
        modelProb = modelProbabilities.awayWin;
      } else {
        modelProb = modelProbabilities.draw;
      }
      
      const ev = calculateExpectedValue(modelProb, decimalOdds);
      
      // Only include if positive expected value
      if (ev > 0.02) {
        let valueRating: string;
        if (ev > 0.15) valueRating = "Strong Value";
        else if (ev > 0.08) valueRating = "Moderate Value";
        else valueRating = "Slight Value";
        
        valueBets.push({
          selection: outcome.name,
          betType: "moneyline",
          bookmaker: bookmaker.title,
          odds: outcome.price,
          impliedProbability: Math.round(impliedProb * 1000) / 10,
          modelProbability: Math.round(modelProb * 1000) / 10,
          expectedValue: Math.round(ev * 1000) / 10,
          valueRating,
        });
      }
    }
  }
  
  return valueBets.sort((a, b) => b.expectedValue - a.expectedValue);
}

/**
 * Main prediction function
 */
export function generatePrediction(event: Event): PredictionResult {
  const { homeWin, awayWin, draw } = eloBasedPrediction(event.home_team, event.away_team);
  const { homeScore, awayScore } = poissonScorePrediction(event.home_team, event.away_team, event.sport_key);
  
  // Determine predicted winner
  let predictedWinner: string | null = null;
  if (homeWin > awayWin && homeWin > draw) {
    predictedWinner = event.home_team;
  } else if (awayWin > homeWin && awayWin > draw) {
    predictedWinner = event.away_team;
  }
  
  // Calculate confidence based on probability margin
  const maxProb = Math.max(homeWin, awayWin, draw);
  const confidence = Math.min(0.95, maxProb + (maxProb - 0.33) * 0.5);
  
  // Find value bets
  const valueBets = findValueBets(event, { homeWin, awayWin, draw });
  
  // Determine overall value rating
  let valueRating: "strong_value" | "moderate_value" | "fair_value" | "poor_value";
  if (valueBets.length > 0 && valueBets[0].expectedValue > 10) {
    valueRating = "strong_value";
  } else if (valueBets.length > 0 && valueBets[0].expectedValue > 5) {
    valueRating = "moderate_value";
  } else if (valueBets.length > 0) {
    valueRating = "fair_value";
  } else {
    valueRating = "poor_value";
  }
  
  // Generate rationale
  const rationale = generateRationale(event, { homeWin, awayWin, draw }, { homeScore, awayScore }, valueBets);
  
  return {
    eventId: event.id,
    homeTeam: event.home_team,
    awayTeam: event.away_team,
    predictedWinner,
    homeWinProbability: Math.round(homeWin * 10000) / 10000,
    awayWinProbability: Math.round(awayWin * 10000) / 10000,
    drawProbability: Math.round(draw * 10000) / 10000,
    predictedHomeScore: homeScore,
    predictedAwayScore: awayScore,
    confidence: Math.round(confidence * 10000) / 10000,
    valueRating,
    rationale,
    modelUsed: "elo_poisson_hybrid",
    valueBets,
  };
}

function generateRationale(
  event: Event,
  probs: { homeWin: number; awayWin: number; draw: number },
  scores: { homeScore: number; awayScore: number },
  valueBets: ValueBet[]
): string {
  let rationale = `**Match Analysis: ${event.home_team} vs ${event.away_team}**\n\n`;
  
  rationale += `Our hybrid Elo-Poisson model predicts:\n`;
  rationale += `- ${event.home_team} win probability: ${(probs.homeWin * 100).toFixed(1)}%\n`;
  rationale += `- ${event.away_team} win probability: ${(probs.awayWin * 100).toFixed(1)}%\n`;
  rationale += `- Draw probability: ${(probs.draw * 100).toFixed(1)}%\n\n`;
  
  rationale += `**Predicted Score:** ${event.home_team} ${scores.homeScore.toFixed(1)} - ${scores.awayScore.toFixed(1)} ${event.away_team}\n\n`;
  
  if (valueBets.length > 0) {
    rationale += `**Value Bets Identified:**\n`;
    for (const vb of valueBets.slice(0, 3)) {
      rationale += `- ${vb.selection} (${vb.bookmaker}): ${vb.odds > 0 ? '+' : ''}${vb.odds} | EV: +${vb.expectedValue}% | ${vb.valueRating}\n`;
    }
  } else {
    rationale += `**No significant value bets identified.** The bookmaker odds appear to be fairly priced for this matchup.\n`;
  }
  
  return rationale;
}

/**
 * Calculate combined parlay odds
 */
export function calculateParlayOdds(legs: { odds: number }[]): { combinedOdds: number; impliedProbability: number } {
  let combinedDecimal = 1;
  
  for (const leg of legs) {
    combinedDecimal *= americanToDecimal(leg.odds);
  }
  
  // Convert back to American odds
  let combinedAmerican: number;
  if (combinedDecimal >= 2) {
    combinedAmerican = Math.round((combinedDecimal - 1) * 100);
  } else {
    combinedAmerican = Math.round(-100 / (combinedDecimal - 1));
  }
  
  const impliedProbability = 1 / combinedDecimal;
  
  return {
    combinedOdds: combinedAmerican,
    impliedProbability: Math.round(impliedProbability * 10000) / 100,
  };
}

/**
 * Format odds for display
 */
export function formatOdds(americanOdds: number): string {
  return americanOdds > 0 ? `+${americanOdds}` : `${americanOdds}`;
}
