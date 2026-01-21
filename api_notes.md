# The Odds API Integration Notes

## Base URL
- `https://api.the-odds-api.com`

## Key Endpoints
1. **GET /v4/sports** - List of in-season sports (free, no quota cost)
2. **GET /v4/sports/{sport}/odds** - Get odds for a sport
3. **GET /v4/sports/{sport}/scores** - Get scores for a sport
4. **GET /v4/sports/{sport}/events** - Get events for a sport

## Parameters
- `apiKey` - Required for all requests
- `regions` - Filter by region (us, uk, eu, au)
- `markets` - h2h (moneyline), spreads, totals
- `oddsFormat` - decimal or american

## Sports Keys (Examples)
- americanfootball_nfl
- basketball_nba
- baseball_mlb
- icehockey_nhl
- soccer_epl (English Premier League)

## Free Tier
- 500 requests/month
- Sufficient for development and testing

## Response Structure
```json
{
  "id": "event_id",
  "sport_key": "americanfootball_nfl",
  "commence_time": "2021-09-10T00:20:00Z",
  "home_team": "Team A",
  "away_team": "Team B",
  "bookmakers": [
    {
      "key": "fanduel",
      "title": "FanDuel",
      "markets": [
        {
          "key": "h2h",
          "outcomes": [
            { "name": "Team A", "price": -150 },
            { "name": "Team B", "price": 130 }
          ]
        }
      ]
    }
  ]
}
```
