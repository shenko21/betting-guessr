/**
 * The-Odds-API Service
 * Provides real betting odds from multiple bookmakers
 * API Documentation: https://the-odds-api.com/liveapi/guides/v4/
 */

import axios from "axios";

const ODDS_API_BASE_URL = "https://api.the-odds-api.com/v4";
const ODDS_API_KEY = process.env.ODDS_API_KEY || "c1a38bc40908f9c0a8c9cf4556c80d09";

// Map our sport keys to The-Odds-API sport keys
const SPORT_KEY_MAP: Record<string, string> = {
  basketball_nba: "basketball_nba",
  basketball_wnba: "basketball_wnba",
  basketball_ncaab: "basketball_ncaab",
  football_nfl: "americanfootball_nfl",
  football_ncaaf: "americanfootball_ncaaf",
  baseball_mlb: "baseball_mlb",
  hockey_nhl: "icehockey_nhl",
  soccer_epl: "soccer_epl",
  soccer_laliga: "soccer_spain_la_liga",
  soccer_mls: "soccer_usa_mls",
  mma_ufc: "mma_mixed_martial_arts",
};

// Reverse map for converting API responses back to our keys
const REVERSE_SPORT_KEY_MAP: Record<string, string> = Object.fromEntries(
  Object.entries(SPORT_KEY_MAP).map(([k, v]) => [v, k])
);

export interface OddsApiSport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface OddsApiOutcome {
  name: string;
  price: number;
  point?: number;
}

export interface OddsApiMarket {
  key: string;
  last_update: string;
  outcomes: OddsApiOutcome[];
}

export interface OddsApiBookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: OddsApiMarket[];
}

export interface OddsApiEvent {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers: OddsApiBookmaker[];
}

export interface OddsApiScore {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  completed: boolean;
  home_team: string;
  away_team: string;
  scores: Array<{
    name: string;
    score: string;
  }> | null;
  last_update: string | null;
}

// Track API usage
let remainingRequests: number | null = null;
let usedRequests: number | null = null;

/**
 * Get remaining API quota
 */
export function getApiQuota() {
  return {
    remaining: remainingRequests,
    used: usedRequests,
  };
}

/**
 * Update quota tracking from response headers
 */
function updateQuotaFromHeaders(headers: Record<string, string>) {
  if (headers["x-requests-remaining"]) {
    remainingRequests = parseInt(headers["x-requests-remaining"]);
  }
  if (headers["x-requests-used"]) {
    usedRequests = parseInt(headers["x-requests-used"]);
  }
}

/**
 * Get list of available sports from The-Odds-API
 */
export async function getSports(): Promise<OddsApiSport[]> {
  try {
    const response = await axios.get<OddsApiSport[]>(`${ODDS_API_BASE_URL}/sports`, {
      params: { apiKey: ODDS_API_KEY },
      timeout: 10000,
    });
    updateQuotaFromHeaders(response.headers as Record<string, string>);
    return response.data.filter((sport) => sport.active);
  } catch (error) {
    console.error("[Odds API] Error fetching sports:", error);
    return [];
  }
}

/**
 * Get odds for a specific sport
 * @param sportKey - Our internal sport key (e.g., "basketball_nba")
 * @param regions - Comma-separated regions (us, uk, eu, au)
 * @param markets - Comma-separated markets (h2h, spreads, totals)
 */
export async function getOdds(
  sportKey: string,
  regions: string = "us",
  markets: string = "h2h,spreads,totals"
): Promise<OddsApiEvent[]> {
  const apiSportKey = SPORT_KEY_MAP[sportKey];
  if (!apiSportKey) {
    console.warn(`[Odds API] Unknown sport key: ${sportKey}`);
    return [];
  }

  try {
    console.log(`[Odds API] Fetching odds for ${apiSportKey}`);
    const response = await axios.get<OddsApiEvent[]>(
      `${ODDS_API_BASE_URL}/sports/${apiSportKey}/odds`,
      {
        params: {
          apiKey: ODDS_API_KEY,
          regions,
          markets,
          oddsFormat: "american",
        },
        timeout: 15000,
      }
    );
    updateQuotaFromHeaders(response.headers as Record<string, string>);
    console.log(`[Odds API] Found ${response.data.length} events with odds`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      if (error.response?.status === 401) {
        console.error("[Odds API] Invalid API key");
      } else if (error.response?.status === 429) {
        console.error("[Odds API] Rate limit exceeded");
      } else if (error.response?.status === 422) {
        console.warn(`[Odds API] Sport ${apiSportKey} not available or out of season`);
      } else {
        console.error("[Odds API] Error fetching odds:", error.message);
      }
    }
    return [];
  }
}

/**
 * Get scores/results for a specific sport
 * @param sportKey - Our internal sport key
 * @param daysFrom - Number of days in the past to fetch completed games (1-3)
 */
export async function getScores(
  sportKey: string,
  daysFrom: number = 1
): Promise<OddsApiScore[]> {
  const apiSportKey = SPORT_KEY_MAP[sportKey];
  if (!apiSportKey) {
    console.warn(`[Odds API] Unknown sport key: ${sportKey}`);
    return [];
  }

  try {
    console.log(`[Odds API] Fetching scores for ${apiSportKey}`);
    const response = await axios.get<OddsApiScore[]>(
      `${ODDS_API_BASE_URL}/sports/${apiSportKey}/scores`,
      {
        params: {
          apiKey: ODDS_API_KEY,
          daysFrom: Math.min(daysFrom, 3), // API max is 3 days
        },
        timeout: 15000,
      }
    );
    updateQuotaFromHeaders(response.headers as Record<string, string>);
    console.log(`[Odds API] Found ${response.data.length} games with scores`);
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error)) {
      console.error("[Odds API] Error fetching scores:", error.message);
    }
    return [];
  }
}

/**
 * Transform Odds API events to our app's format
 * Uses snake_case to maintain compatibility with existing frontend code
 */
export function transformOddsToAppFormat(events: OddsApiEvent[], ourSportKey: string) {
  return events.map((event) => {
    // Find the best bookmaker (prefer DraftKings, FanDuel, or first available)
    const preferredBookmakers = ["draftkings", "fanduel", "betmgm", "pointsbetus"];
    let selectedBookmaker = event.bookmakers.find((b) =>
      preferredBookmakers.includes(b.key)
    );
    if (!selectedBookmaker && event.bookmakers.length > 0) {
      selectedBookmaker = event.bookmakers[0];
    }

    // Extract markets
    const h2hMarket = selectedBookmaker?.markets.find((m) => m.key === "h2h");
    const spreadsMarket = selectedBookmaker?.markets.find((m) => m.key === "spreads");
    const totalsMarket = selectedBookmaker?.markets.find((m) => m.key === "totals");

    // Get moneyline odds
    const homeOdds = h2hMarket?.outcomes.find((o) => o.name === event.home_team)?.price || 0;
    const awayOdds = h2hMarket?.outcomes.find((o) => o.name === event.away_team)?.price || 0;

    // Get spread
    const homeSpread = spreadsMarket?.outcomes.find((o) => o.name === event.home_team);
    const awaySpread = spreadsMarket?.outcomes.find((o) => o.name === event.away_team);

    // Get totals
    const overTotal = totalsMarket?.outcomes.find((o) => o.name === "Over");
    const underTotal = totalsMarket?.outcomes.find((o) => o.name === "Under");

    return {
      id: event.id,
      sport_key: ourSportKey,
      sport_title: event.sport_title,
      commence_time: event.commence_time,
      home_team: event.home_team,
      away_team: event.away_team,
      bookmakers: event.bookmakers.length > 0
        ? event.bookmakers.map((bookmaker) => ({
            key: bookmaker.key,
            title: bookmaker.title,
            markets: bookmaker.markets.map((market) => ({
              key: market.key,
              outcomes: market.outcomes.map((outcome) => ({
                name: outcome.name,
                price: outcome.price,
                point: outcome.point,
              })),
            })),
          }))
        : [
            {
              key: selectedBookmaker?.key || "default",
              title: selectedBookmaker?.title || "Best Available",
              markets: [
                {
                  key: "h2h",
                  outcomes: [
                    { name: event.home_team, price: homeOdds },
                    { name: event.away_team, price: awayOdds },
                  ],
                },
                ...(spreadsMarket
                  ? [
                      {
                        key: "spreads",
                        outcomes: [
                          {
                            name: event.home_team,
                            price: homeSpread?.price || -110,
                            point: homeSpread?.point || 0,
                          },
                          {
                            name: event.away_team,
                            price: awaySpread?.price || -110,
                            point: awaySpread?.point || 0,
                          },
                        ],
                      },
                    ]
                  : []),
                ...(totalsMarket
                  ? [
                      {
                        key: "totals",
                        outcomes: [
                          {
                            name: "Over",
                            price: overTotal?.price || -110,
                            point: overTotal?.point || 0,
                          },
                          {
                            name: "Under",
                            price: underTotal?.price || -110,
                            point: underTotal?.point || 0,
                          },
                        ],
                      },
                    ]
                  : []),
              ],
            },
          ],
    };
  });
}

/**
 * Main function to get formatted odds for a sport
 * Falls back to ESPN synthetic odds if The-Odds-API fails
 */
export async function getOddsForSport(
  sportKey: string,
  regions: string = "us",
  markets: string = "h2h,spreads,totals"
) {
  const events = await getOdds(sportKey, regions, markets);
  if (events.length === 0) {
    return [];
  }
  return transformOddsToAppFormat(events, sportKey);
}

/**
 * Get completed game results for bet settlement
 */
export async function getCompletedGames(sportKey: string, daysFrom: number = 3) {
  const scores = await getScores(sportKey, daysFrom);
  return scores
    .filter((game) => game.completed && game.scores)
    .map((game) => {
      const homeScore = game.scores?.find((s) => s.name === game.home_team);
      const awayScore = game.scores?.find((s) => s.name === game.away_team);
      return {
        id: game.id,
        sportKey,
        homeTeam: game.home_team,
        awayTeam: game.away_team,
        homeScore: homeScore ? parseInt(homeScore.score) : 0,
        awayScore: awayScore ? parseInt(awayScore.score) : 0,
        completed: true,
        commenceTime: game.commence_time,
      };
    });
}
