# TheGiftedMan Trading Tool

TheGiftedMan Trading Tool is a desktop-style trading journal and performance planner for binary options traders. It combines AI zone validation, trade logging, risk management, and performance analytics into a single workspace so traders can track their execution quality and stay within structured rules.

## What the app does

This application helps you:

- Analyze supply and demand zones with AI support from OpenRouter or Groq.
- Record trades manually or from AI-assisted analysis.
- Track trades in either Demo or Real mode, with separate performance analytics for each.
- Apply different trade-management setups to Demo and Real accounts while still enforcing the same daily session and trade-limit rules.
- Review your win rate, P&L, growth, streaks, zone-grade performance, and pair performance over time.
- Manage balance growth, withdrawals, and milestone targets with disciplined risk sizing.

## Core features

### 1. AI zone analyzer
- Upload chart screenshots and let the app evaluate the visible zone.
- The analyzer returns a structured verdict with:
  - detected pair
  - zone type and direction
  - validity grade (A/B/C/INVALID)
  - confidence level
  - execution advice
  - criteria breakdown for the zone analysis

### 2. Trade journal
- Record trades from AI analysis or manual entry.
- Choose the account mode for each trade:
  - Demo
  - Real
- Attach notes and screenshots to each trade.
- Mark trades as Pending, Win, or Loss and review them later in detail.
- Manual entries can be backdated to reflect historical trades without disrupting the current day’s active session.

### 3. Demo vs Real account tracking
- Every trade can be tagged as Demo or Real.
- The app keeps each account mode separate in analytics and reporting.
- You can see:
  - Demo win rate
  - Real win rate
  - Demo P&L and growth
  - Real P&L and growth
- This makes it easy to compare execution quality across practice and live account behavior.

### 4. Trade management rules
- Select a trade-management style for Demo and Real accounts independently.
- Built-in styles include:
  - Precision
  - Active
  - Structured
- The app still enforces the same daily rules and limits, including:
  - maximum sessions per day
  - 6-hour gap between sessions
  - daily loss breaker
  - session-based trade limits and stop conditions

### 5. Session timer and focus music
- Each trade style (Precision, Active, Structured) has its own adjustable session duration, set in Settings.
- Start a session from the Dashboard to get a live countdown, with Pause and End Session controls.
- Pausing freezes the countdown; leaving it paused auto-resumes after 5 minutes so it can't be used to dodge the timer indefinitely.
- A session ends the moment EITHER the timer hits zero OR an existing trade-count/win-loss rule triggers — whichever happens first — and the Dashboard shows the specific reason (time expired, stop loss, take profit, or max trades).
- A timed-out session specifically pauses new Zone Analyzer requests and new manual Journal entries until the normal 6-hour gap elapses; any trade already awaiting a Win/Loss outcome stays fully accessible.
- **Zero-trade timeouts get a separate, shorter cooldown** (1-2 hours, adjustable in Settings) instead of the full 6-hour gap, and don't count toward your daily session limit — so correctly skipping a session with no qualifying setup isn't penalized like a real trading session. After 3 consecutive no-trade sessions in a day, the next session reverts to the standard 6-hour gap and does count toward the limit, to prevent unlimited restart-and-scan behavior. Tracked independently per Demo/Real.
- While a session is active, the Dashboard (and a compact widget on every other page) plays free lofi/ambient background music via the Jamendo API — play/pause, skip to a random track, track selection, and volume on the Dashboard — and it stops automatically the moment the session ends, for any reason.

### 6. Money management and planning
- Risk sizing is either a percent of your current balance or a fixed dollar amount per trade — switch anytime in Settings.
- Override the stake for any single trade at logging time (Journal manual entry, or when logging an Analyzer result) — type a custom dollar amount or percent instead of accepting the default.
- Track withdrawals and milestone targets.
- Review projected growth and balance progression over time.
- Use the built-in trading plan view to review your risk and session rules, plus an interactive zone-selection checklist for judging a zone before you trust it.

### 7. Analytics dashboard
- View key metrics such as:
  - balance
  - win rate, with a 95% confidence interval (Wilson score interval, reliable even at low trade counts) shown alongside it and by zone grade
  - total P&L
  - expected value per trade
  - current streak
- Review cumulative performance over time.
- Compare performance by:
  - account mode
  - zone grade
  - trading pair
  - analyzed versus manual trades
- **Review tab**: an auto-generated "This Week" / "This Month" digest per Demo/Real — trade counts, win rate with confidence interval, delta vs. the prior period, best/worst pair (minimum 3 trades to qualify), most common gate failure (only from zone analyses linked to a trade you actually logged), trades logged without zone analysis, and Real-account P&L. Pure numbers and deltas, computed on the fly from your existing trades — no manual entry, no generated commentary.

### 8. Cloud account and sync
- Email + password authentication (Supabase Auth), including password reset.
- Settings, trades, sessions, withdrawals, and zone analyses are stored per-account in Supabase Postgres, protected by row-level security (each user can only read/write their own rows).
- Chart screenshots are uploaded to Supabase Storage instead of being embedded as base64, keeping the database lean.
- Log in from any device to see the same data — nothing is tied to a single browser anymore.
- If local data exists from a previous browser-only install, the app offers a one-time import into your account on first login.

## Tech stack
- React
- Lucide React
- Tailwind CSS via PostCSS
- Supabase (Postgres, Auth, Storage)
- OpenRouter API / Groq API for AI zone analysis
- Jamendo API for session background music

## Getting started

1. Clone the repository
   ```bash
   git clone https://github.com/your-username/giftedman-trading.git
   cd giftedman-trading
   ```

2. Install dependencies
   ```bash
   npm install
   ```

3. Set up Supabase
   - Create a free project at https://supabase.com.
   - Link this repo to it and push the schema:
     ```bash
     npx supabase login
     npx supabase link --project-ref your-project-ref
     npx supabase db push
     ```
     This applies [`supabase/migrations`](supabase/migrations) — creating the `settings`, `trades`, `sessions`, `withdrawals`, and `zone_analyses` tables, enabling row-level security, and setting up the private `screenshots` storage bucket with its access policies. Future schema changes go in new files under `supabase/migrations/` and get pushed the same way.
   - In Project Settings → API, copy the Project URL and anon public key.
   - Create a `.env.local` file in the project root:
     ```
     REACT_APP_SUPABASE_URL=your-project-url
     REACT_APP_SUPABASE_ANON_KEY=your-anon-key
     ```

4. Configure AI provider keys
   - Sign up in the app, then add your OpenRouter or Groq API key in Settings.
   - OpenRouter: https://openrouter.ai/keys
   - Groq: https://console.groq.com/keys

5. Configure background music (optional)
   - Get a free client_id at https://developer.jamendo.com/v3.0.
   - Add it to `.env.local`: `REACT_APP_JAMENDO_CLIENT_ID=your-client-id`
   - Without a key, the Dashboard session music player shows "Music unavailable this session" — trading features are unaffected.

6. Run the app
   ```bash
   npm start
   ```
   The app will open at http://localhost:3000.

## Available scripts
- npm start — start the development server
- npm test — run the test suite
- npm run build — create a production build

## Notes
- Settings and trade history are stored in your Supabase account and accessible from any device you log in from.
- The app is designed to support disciplined execution rather than automated trading.
- The trading rules are intended to help you stay consistent and avoid emotional overtrading.