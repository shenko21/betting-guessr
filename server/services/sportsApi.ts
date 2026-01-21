import axios from "axios";

const ODDS_API_BASE = "https://api.the-odds-api.com/v4";

export interface Sport {
  key: string;
  group: string;
  title: string;
  description: string;
  active: boolean;
  has_outrights: boolean;
}

export interface Outcome {
  name: string;
  price: number;
  point?: number;
}

export interface Market {
  key: string;
  last_update: string;
  outcomes: Outcome[];
}

export interface Bookmaker {
  key: string;
  title: string;
  last_update: string;
  markets: Market[];
}

export interface Event {
  id: string;
  sport_key: string;
  sport_title: string;
  commence_time: string;
  home_team: string;
  away_team: string;
  bookmakers?: Bookmaker[];
  scores?: { name: string; score: string }[];
  completed?: boolean;
}

export interface OddsApiResponse {
  data: Event[];
  remainingRequests?: number;
  usedRequests?: number;
}

class SportsApiService {
  private apiKey: string | null = null;

  setApiKey(key: string) {
    this.apiKey = key;
  }

  getApiKey(): string | null {
    return this.apiKey || process.env.ODDS_API_KEY || null;
  }

  async getSports(): Promise<Sport[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn("[SportsAPI] No API key configured, returning mock data");
      return this.getMockSports();
    }

    try {
      const response = await axios.get(`${ODDS_API_BASE}/sports`, {
        params: { apiKey }
      });
      return response.data;
    } catch (error) {
      console.error("[SportsAPI] Error fetching sports:", error);
      return this.getMockSports();
    }
  }

  async getOdds(sportKey: string, regions = "us", markets = "h2h,spreads,totals"): Promise<Event[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      console.warn("[SportsAPI] No API key configured, returning mock data");
      return this.getMockEvents(sportKey);
    }

    try {
      const response = await axios.get(`${ODDS_API_BASE}/sports/${sportKey}/odds`, {
        params: {
          apiKey,
          regions,
          markets,
          oddsFormat: "american"
        }
      });
      return response.data;
    } catch (error) {
      console.error("[SportsAPI] Error fetching odds:", error);
      return this.getMockEvents(sportKey);
    }
  }

  async getScores(sportKey: string, daysFrom = 1): Promise<Event[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return [];
    }

    try {
      const response = await axios.get(`${ODDS_API_BASE}/sports/${sportKey}/scores`, {
        params: {
          apiKey,
          daysFrom
        }
      });
      return response.data;
    } catch (error) {
      console.error("[SportsAPI] Error fetching scores:", error);
      return [];
    }
  }

  async getEvents(sportKey: string): Promise<Event[]> {
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return this.getMockEvents(sportKey);
    }

    try {
      const response = await axios.get(`${ODDS_API_BASE}/sports/${sportKey}/events`, {
        params: { apiKey }
      });
      return response.data;
    } catch (error) {
      console.error("[SportsAPI] Error fetching events:", error);
      return this.getMockEvents(sportKey);
    }
  }

  // Mock data for development/demo without API key
  private getMockSports(): Sport[] {
    return [
      { key: "americanfootball_nfl", group: "American Football", title: "NFL", description: "US Football", active: true, has_outrights: false },
      { key: "basketball_nba", group: "Basketball", title: "NBA", description: "US Basketball", active: true, has_outrights: false },
      { key: "baseball_mlb", group: "Baseball", title: "MLB", description: "Major League Baseball", active: true, has_outrights: false },
      { key: "icehockey_nhl", group: "Ice Hockey", title: "NHL", description: "US Ice Hockey", active: true, has_outrights: false },
      { key: "soccer_epl", group: "Soccer", title: "EPL", description: "English Premier League", active: true, has_outrights: false },
      { key: "soccer_spain_la_liga", group: "Soccer", title: "La Liga", description: "Spanish La Liga", active: true, has_outrights: false },
      { key: "mma_mixed_martial_arts", group: "MMA", title: "MMA", description: "Mixed Martial Arts", active: true, has_outrights: false },
    ];
  }

  private getMockEvents(sportKey: string): Event[] {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000);

    const mockTeams: Record<string, { home: string; away: string }[]> = {
      americanfootball_nfl: [
        { home: "Kansas City Chiefs", away: "Buffalo Bills" },
        { home: "Philadelphia Eagles", away: "Dallas Cowboys" },
        { home: "San Francisco 49ers", away: "Seattle Seahawks" },
      ],
      basketball_nba: [
        { home: "Los Angeles Lakers", away: "Boston Celtics" },
        { home: "Golden State Warriors", away: "Phoenix Suns" },
        { home: "Milwaukee Bucks", away: "Miami Heat" },
      ],
      baseball_mlb: [
        { home: "New York Yankees", away: "Boston Red Sox" },
        { home: "Los Angeles Dodgers", away: "San Francisco Giants" },
        { home: "Houston Astros", away: "Texas Rangers" },
      ],
      icehockey_nhl: [
        { home: "Toronto Maple Leafs", away: "Montreal Canadiens" },
        { home: "Vegas Golden Knights", away: "Colorado Avalanche" },
        { home: "New York Rangers", away: "New Jersey Devils" },
      ],
      soccer_epl: [
        { home: "Manchester United", away: "Liverpool" },
        { home: "Arsenal", away: "Chelsea" },
        { home: "Manchester City", away: "Tottenham" },
      ],
    };

    const teams = mockTeams[sportKey] || mockTeams.basketball_nba;

    return teams.map((matchup, index) => {
      const commenceTime = index === 0 ? tomorrow : dayAfter;
      const homeOdds = Math.floor(Math.random() * 300) - 150;
      const awayOdds = homeOdds > 0 ? -(homeOdds + 20) : -(homeOdds - 20);
      const spread = (Math.random() * 10 - 5).toFixed(1);
      const total = (Math.random() * 30 + 200).toFixed(1);

      return {
        id: `mock_${sportKey}_${index}_${Date.now()}`,
        sport_key: sportKey,
        sport_title: sportKey.split("_").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" "),
        commence_time: commenceTime.toISOString(),
        home_team: matchup.home,
        away_team: matchup.away,
        bookmakers: [
          {
            key: "fanduel",
            title: "FanDuel",
            last_update: now.toISOString(),
            markets: [
              {
                key: "h2h",
                last_update: now.toISOString(),
                outcomes: [
                  { name: matchup.home, price: homeOdds },
                  { name: matchup.away, price: awayOdds },
                ],
              },
              {
                key: "spreads",
                last_update: now.toISOString(),
                outcomes: [
                  { name: matchup.home, price: -110, point: parseFloat(spread) },
                  { name: matchup.away, price: -110, point: -parseFloat(spread) },
                ],
              },
              {
                key: "totals",
                last_update: now.toISOString(),
                outcomes: [
                  { name: "Over", price: -110, point: parseFloat(total) },
                  { name: "Under", price: -110, point: parseFloat(total) },
                ],
              },
            ],
          },
          {
            key: "draftkings",
            title: "DraftKings",
            last_update: now.toISOString(),
            markets: [
              {
                key: "h2h",
                last_update: now.toISOString(),
                outcomes: [
                  { name: matchup.home, price: homeOdds + Math.floor(Math.random() * 10) - 5 },
                  { name: matchup.away, price: awayOdds + Math.floor(Math.random() * 10) - 5 },
                ],
              },
            ],
          },
        ],
      };
    });
  }
}

export const sportsApi = new SportsApiService();
