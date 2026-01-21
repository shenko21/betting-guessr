# Sports Betting Assistant — Continuation Instructions for Claude

## Project Summary
A full-stack sports betting simulator with real-time data, AI-powered predictions, parlay building, and paper trading (fake money). Built for educational purposes with strong responsible gambling messaging.

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | React 18 + TypeScript + Vite |
| Routing | Wouter (lightweight) |
| Styling | Tailwind CSS + shadcn/ui components |
| State | React Query via tRPC |
| Backend | Node.js + tRPC (type-safe API) |
| Database | MySQL + Drizzle ORM |
| Data Source | ESPN unofficial API (free, no key) |
| LLM | Anthropic/OpenAI via `invokeLLM()` helper |

---

## Project Structure

```
├── client/
│   ├── src/
│   │   ├── components/       # Reusable UI (shadcn + custom)
│   │   ├── pages/            # Route pages
│   │   │   ├── Home.tsx      # Landing page
│   │   │   ├── Dashboard.tsx # User stats overview
│   │   │   ├── Events.tsx    # Browse sports/games
│   │   │   ├── ParlayBuilder.tsx
│   │   │   ├── BettingHistory.tsx
│   │   │   ├── Advisor.tsx   # AI chat interface
│   │   │   ├── Settings.tsx
│   │   │   └── ResponsibleGambling.tsx
│   │   ├── lib/trpc.ts       # tRPC client
│   │   └── App.tsx           # Router setup
├── server/
│   ├── services/
│   │   ├── espnApi.ts        # ESPN data fetching
│   │   ├── sportsApi.ts      # Mock/fallback data
│   │   └── predictionEngine.ts # Elo + Poisson models
│   ├── routers.ts            # All tRPC endpoints
│   ├── db.ts                 # Database queries
│   └── _core/                # Framework internals (don't modify)
├── drizzle/
│   └── schema.ts             # Database schema
└── shared/
    └── types.ts              # Shared TypeScript types
```

---

## What's DONE ✅

### Backend
- [x] Full database schema (users, wallets, bets, parlays, predictions, model_performance)
- [x] ESPN API integration with 11 sports (NBA, NFL, NHL, MLB, EPL, La Liga, etc.)
- [x] Prediction engine with Elo ratings + Poisson score modeling
- [x] Value bet identification (compares model probability vs bookmaker odds)
- [x] tRPC routers for: sports, predictions, wallet, bets, parlays, preferences, advisor
- [x] Virtual wallet with transactions
- [x] Bet placement and parlay creation
- [x] AI advisor endpoint using LLM

### Frontend
- [x] All pages scaffolded with UI
- [x] Dashboard with stats cards
- [x] Events browser with sport selection
- [x] Parlay builder interface
- [x] Betting history with status badges
- [x] Settings page with risk preferences
- [x] Responsible gambling education page
- [x] Dark theme with consistent styling

---

## What's INCOMPLETE / TODO 🔧

### Critical Issues to Fix

1. **ESPN API Odds Problem**
   - ESPN doesn't provide betting odds via their free API
   - Current workaround: `generateOdds()` in `espnApi.ts` creates synthetic/random odds
   - **Solution**: Integrate The-Odds-API (free tier: 500 requests/month) for real odds
   - API: `https://the-odds-api.com` — requires API key

2. **Bet Settlement System**
   - Bets can be placed but never settle (no game result checking)
   - Need: Background job or manual trigger to check completed games and update bet status
   - Location: Add to `server/routers.ts` → `bets.settle` procedure

3. **Learning Loop Not Connected**
   - `modelPerformance` table exists but isn't being populated
   - Predictions aren't being stored or verified against outcomes
   - Need: Save predictions to DB, then compare with actual results to track accuracy

### Features to Add

4. **Performance Charts** (from todo.md)
   - Dashboard needs visual charts (profit over time, win rate by sport)
   - Use: Recharts (already in dependencies via shadcn)
   - Location: `Dashboard.tsx` — add chart components

5. **Notifications System**
   - Backend `notifyOwner()` exists but not wired up
   - Need: Trigger on significant events (big wins, model accuracy changes)

6. **Result Fetching**
   - `espnApi.getScoreboard()` returns live scores but app doesn't poll for updates
   - Need: Periodic refresh or websocket for live game tracking

---

## Key Code Locations

### To add real odds API:
```typescript
// server/services/oddsApi.ts (new file)
// Replace synthetic odds in espnApi.ts line 246-266
```

### To implement bet settlement:
```typescript
// server/routers.ts → add to bets router
settleBets: protectedProcedure.mutation(async ({ ctx }) => {
  // 1. Get all pending bets for user
  // 2. Fetch game results from ESPN
  // 3. Compare selections to outcomes
  // 4. Update bet status (won/lost/push)
  // 5. Credit winnings to wallet
})
```

### To add charts:
```typescript
// client/src/pages/Dashboard.tsx
import { LineChart, Line, XAxis, YAxis } from 'recharts';
// Add chart in the "Recent Activity" section
```

---

## Environment Variables Needed

```env
# For The-Odds-API (if integrating real odds)
ODDS_API_KEY=your_key_here

# Database (already configured in Manus)
DATABASE_URL=mysql://...

# LLM (for AI advisor)
OPENAI_API_KEY=... # or ANTHROPIC_API_KEY
```

---

## Running the Project

```bash
# Install dependencies
pnpm install

# Run database migrations
pnpm drizzle-kit push

# Start dev server
pnpm dev
```

---

## Priority Order for Continuation

1. **Fix odds** — Without real odds, value bet calculations are meaningless
2. **Bet settlement** — Users can't see if they won/lost
3. **Learning loop** — Track prediction accuracy over time
4. **Charts** — Visual appeal and user engagement
5. **Notifications** — Nice-to-have

---

## Code Quality Notes

- TypeScript strict mode enabled
- tRPC provides end-to-end type safety
- shadcn/ui components are well-structured
- Prediction engine math is solid (Elo + Poisson is standard)
- ESPN API wrapper handles errors gracefully with fallbacks

---

## Questions to Ask User Before Continuing

1. Do you have (or want to get) a The-Odds-API key for real betting odds?
2. Which sports are highest priority? (Currently supports 11)
3. Should bet settlement be automatic (background job) or manual (button click)?
4. Any specific chart types you want on the dashboard?

---

*Generated for project handoff from Manus AI to Claude AI*
