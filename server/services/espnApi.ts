/**
 * ESPN API Service
 * Uses ESPN's public (unofficial) API endpoints for real sports data
 * No API key required - completely free to use
 */

import axios from "axios";

const ESPN_BASE_URL = "http://site.api.espn.com/apis/site/v2/sports";

// Sport configurations mapping our app's sport keys to ESPN's format
const SPORT_CONFIG: Record<string, { sport: string; league: string; title: string }> = {
  basketball_nba: { sport: "basketball", league: "nba", title: "NBA" },
  basketball_wnba: { sport: "basketball", league: "wnba", title: "WNBA" },
  basketball_ncaab: { sport: "basketball", league: "mens-college-basketball", title: "NCAA Basketball" },
  football_nfl: { sport: "football", league: "nfl", title: "NFL" },
  football_ncaaf: { sport: "football", league: "college-football", title: "NCAA Football" },
  baseball_mlb: { sport: "baseball", league: "mlb", title: "MLB" },
  hockey_nhl: { sport: "hockey", league: "nhl", title: "NHL" },
  soccer_epl: { sport: "soccer", league: "eng.1", title: "English Premier League" },
  soccer_laliga: { sport: "soccer", league: "esp.1", title: "La Liga" },
  soccer_mls: { sport: "soccer", league: "usa.1", title: "MLS" },
  mma_ufc: { sport: "mma", league: "ufc", title: "UFC" },
};

export interface ESPNEvent {
  id: string;
  name: string;
  shortName: string;
  date: string;
  status: {
    type: {
      id: string;
      name: string;
      state: string;
      completed: boolean;
    };
    displayClock?: string;
    period?: number;
  };
  competitions: Array<{
    id: string;
    date: string;
    venue?: {
      fullName: string;
      city: string;
      state?: string;
    };
    competitors: Array<{
      id: string;
      homeAway: "home" | "away";
      team: {
        id: string;
        name: string;
        abbreviation: string;
        displayName: string;
        logo?: string;
      };
      score?: string;
      winner?: boolean;
      records?: Array<{
        type: string;
        summary: string;
      }>;
    }>;
    odds?: Array<{
      provider: {
        id: string;
        name: string;
      };
      details?: string;
      overUnder?: number;
      spread?: number;
      homeTeamOdds?: {
        moneyLine?: number;
        spreadOdds?: number;
      };
      awayTeamOdds?: {
        moneyLine?: number;
        spreadOdds?: number;
      };
    }>;
  }>;
}

export interface ESPNScoreboard {
  events: ESPNEvent[];
  leagues?: Array<{
    id: string;
    name: string;
    abbreviation: string;
  }>;
}

export interface ESPNTeam {
  id: string;
  name: string;
  abbreviation: string;
  displayName: string;
  logo?: string;
  record?: {
    items: Array<{
      summary: string;
      stats: Array<{
        name: string;
        value: number;
      }>;
    }>;
  };
}

export interface ESPNNews {
  articles: Array<{
    headline: string;
    description: string;
    published: string;
    links: {
      web: {
        href: string;
      };
    };
    images?: Array<{
      url: string;
    }>;
  }>;
}

/**
 * Get list of available sports
 */
export function getAvailableSports() {
  return Object.entries(SPORT_CONFIG).map(([key, config]) => ({
    key,
    title: config.title,
    sport: config.sport,
    league: config.league,
  }));
}

/**
 * Fetch scoreboard/schedule for a sport
 */
export async function getScoreboard(sportKey: string, dates?: string): Promise<ESPNEvent[]> {
  const config = SPORT_CONFIG[sportKey];
  if (!config) {
    console.warn(`[ESPN API] Unknown sport key: ${sportKey}`);
    return [];
  }

  try {
    const url = `${ESPN_BASE_URL}/${config.sport}/${config.league}/scoreboard`;
    const params: Record<string, string> = {};
    if (dates) {
      params.dates = dates;
    }

    console.log(`[ESPN API] Fetching scoreboard: ${url}`);
    const response = await axios.get<ESPNScoreboard>(url, { params, timeout: 10000 });
    return response.data.events || [];
  } catch (error) {
    console.error(`[ESPN API] Error fetching scoreboard for ${sportKey}:`, error);
    return [];
  }
}

/**
 * Fetch teams for a sport
 */
export async function getTeams(sportKey: string): Promise<ESPNTeam[]> {
  const config = SPORT_CONFIG[sportKey];
  if (!config) {
    console.warn(`[ESPN API] Unknown sport key: ${sportKey}`);
    return [];
  }

  try {
    const url = `${ESPN_BASE_URL}/${config.sport}/${config.league}/teams`;
    console.log(`[ESPN API] Fetching teams: ${url}`);
    const response = await axios.get(url, { timeout: 10000 });
    
    // ESPN returns teams nested in sports[0].leagues[0].teams
    const teams = response.data?.sports?.[0]?.leagues?.[0]?.teams || [];
    return teams.map((t: { team: ESPNTeam }) => t.team);
  } catch (error) {
    console.error(`[ESPN API] Error fetching teams for ${sportKey}:`, error);
    return [];
  }
}

/**
 * Fetch news for a sport
 */
export async function getNews(sportKey: string): Promise<ESPNNews["articles"]> {
  const config = SPORT_CONFIG[sportKey];
  if (!config) {
    console.warn(`[ESPN API] Unknown sport key: ${sportKey}`);
    return [];
  }

  try {
    const url = `${ESPN_BASE_URL}/${config.sport}/${config.league}/news`;
    console.log(`[ESPN API] Fetching news: ${url}`);
    const response = await axios.get<ESPNNews>(url, { timeout: 10000 });
    return response.data.articles || [];
  } catch (error) {
    console.error(`[ESPN API] Error fetching news for ${sportKey}:`, error);
    return [];
  }
}

/**
 * Get game summary/details
 */
export async function getGameSummary(sportKey: string, gameId: string) {
  const config = SPORT_CONFIG[sportKey];
  if (!config) {
    console.warn(`[ESPN API] Unknown sport key: ${sportKey}`);
    return null;
  }

  try {
    const url = `${ESPN_BASE_URL}/${config.sport}/${config.league}/summary`;
    console.log(`[ESPN API] Fetching game summary: ${url}?event=${gameId}`);
    const response = await axios.get(url, { 
      params: { event: gameId },
      timeout: 10000 
    });
    return response.data;
  } catch (error) {
    console.error(`[ESPN API] Error fetching game summary:`, error);
    return null;
  }
}

/**
 * Transform ESPN events to our app's odds format
 * Uses snake_case to maintain compatibility with existing frontend code
 */
export function transformToOddsFormat(events: ESPNEvent[], sportKey: string) {
  return events.map(event => {
    const competition = event.competitions[0];
    const homeTeam = competition?.competitors.find(c => c.homeAway === "home");
    const awayTeam = competition?.competitors.find(c => c.homeAway === "away");
    const odds = competition?.odds?.[0];

    // Generate synthetic odds if ESPN doesn't provide them
    // This is for demonstration - in production you'd use a real odds API
    const generateOdds = () => {
      const spread = Math.floor(Math.random() * 14) - 7;
      const favorite = spread > 0 ? "away" : "home";
      const moneylineHome = favorite === "home"
        ? -(100 + Math.floor(Math.random() * 150))
        : 100 + Math.floor(Math.random() * 200);
      const moneylineAway = favorite === "away"
        ? -(100 + Math.floor(Math.random() * 150))
        : 100 + Math.floor(Math.random() * 200);

      return {
        homeMoneyline: moneylineHome,
        awayMoneyline: moneylineAway,
        spread: Math.abs(spread),
        spreadFavorite: favorite,
        total: 200 + Math.floor(Math.random() * 50),
      };
    };

    const syntheticOdds = generateOdds();
    const homeTeamName = homeTeam?.team.displayName || "TBD";
    const awayTeamName = awayTeam?.team.displayName || "TBD";

    return {
      id: event.id,
      sport_key: sportKey,
      sport_title: SPORT_CONFIG[sportKey]?.title || sportKey,
      commence_time: event.date,
      home_team: homeTeamName,
      away_team: awayTeamName,
      bookmakers: [{
        key: "espn_synthetic",
        title: "BetWise Odds",
        markets: [
          {
            key: "h2h",
            outcomes: [
              {
                name: homeTeamName,
                price: odds?.homeTeamOdds?.moneyLine || syntheticOdds.homeMoneyline
              },
              {
                name: awayTeamName,
                price: odds?.awayTeamOdds?.moneyLine || syntheticOdds.awayMoneyline
              },
            ],
          },
          {
            key: "spreads",
            outcomes: [
              {
                name: homeTeamName,
                price: -110,
                point: syntheticOdds.spreadFavorite === "home"
                  ? -syntheticOdds.spread
                  : syntheticOdds.spread
              },
              {
                name: awayTeamName,
                price: -110,
                point: syntheticOdds.spreadFavorite === "away"
                  ? -syntheticOdds.spread
                  : syntheticOdds.spread
              },
            ],
          },
          {
            key: "totals",
            outcomes: [
              { name: "Over", price: -110, point: odds?.overUnder || syntheticOdds.total },
              { name: "Under", price: -110, point: odds?.overUnder || syntheticOdds.total },
            ],
          },
        ],
      }],
    };
  });
}

/**
 * Get formatted odds for a sport (main function to use)
 */
export async function getOddsForSport(sportKey: string) {
  const events = await getScoreboard(sportKey);
  return transformToOddsFormat(events, sportKey);
}
