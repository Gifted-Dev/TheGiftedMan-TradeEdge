# TheGiftedMan Trading Tool

TheGiftedMan Trading Tool is a desktop-style trading journal, AI coaching, and performance planner for binary options traders. It combines AI setup validation (supply/demand zones and a curated price-action playbook), trade logging, risk management, a conversational AI trading coach, and performance analytics into a single workspace so traders can track their execution quality and stay within structured rules.

## What the app does

This application helps you:

- Analyze a chart screenshot against either TheGiftedMan S&D Precision Entry System (supply/demand zones, 10 strict gates) or one of the Price Action Playbook's 8 setups (each of the 7 non-zone setups graded against its own 5-item checklist) — the AI determines which system applies and grades accordingly.
- Record trades manually or from AI-assisted analysis.
- Track trades in either Demo or Real mode, with separate performance analytics for each.
- Apply different trade-management setups to Demo and Real accounts while still enforcing the same daily session and trade-limit rules.
- Tag trades with the app's 8 built-in price-action strategies plus Zone (S&D) and Trend/Pattern, or define your own on top of those.
- Choose Fixed Risk %, Anti-Martingale, or Profit Lock money management independently per Demo/Real account — the two escalating styles end their own sessions on a profit target, loss target, or max trades reached.
- Log trades fast with Quick Log, a spreadsheet-style table built for Anti-Martingale/Profit Lock's pace, with its own Start/Pause/End session controls.
- Chat with an AI trading coach ("Ask") that reports your real logged data, reviews your performance/risk/discipline, explains trading concepts and this app's own strategies/money-management styles, and quizzes you on recognizing setups and making the right call.
- Review your win rate, P&L, growth, streaks, zone-grade, strategy, and pair performance over time.
- Manage balance growth, withdrawals, and milestone targets with disciplined risk sizing.

## Core features

### 1. AI setup validator (Zone Analyzer)
- Upload a chart screenshot and the AI first determines which of two systems actually applies, then grades against that system's own rules — no manual toggle needed.
  - **Supply/Demand** — TheGiftedMan S&D Precision Entry System: a base-and-departure zone graded against 10 strict binary gates (4 of them hard filters that instantly invalidate the zone if any one fails).
  - **Support/Resistance / candle-structure** — one of the Price Action Playbook's 8 setups (Break & Retest — Immediate or Delayed, Engulfing Reversal, Double Top/Bottom, 3-Candle Continuation, Inside Bar Breakout, S&D Zone Retest, Fakeout Reversal, plus Market Cycle Confirmation as a stricter confirmation layer on top of a zone/level reversal), each graded against its own 5-item checklist (2 hard filters).
- The analyzer returns a structured verdict with:
  - detected pair
  - which system matched, and which specific strategy (for the price-action path)
  - direction (BUY/SELL)
  - validity grade (A+/A/B/C/INVALID)
  - confidence level
  - execution advice
  - full gate/checklist breakdown for whichever system was used

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
- **Email notification when the gap ends**: the moment any session ends, a serverless function schedules a one-off delayed job (via Upstash QStash) for exactly when that session's cooldown will elapse, then emails you (via Resend) with the end reason and a link back into the app — so you find out you can start again without needing the app open. Works even if you're not actively using the app, and is deduplicated server-side so a retry never double-emails.

### 6. Built-in and custom strategies
- Every account starts with 8 built-in strategies: Zone (S&D), Trend/Pattern, and the 6 non-zone Price Action Playbook setups (Break & Retest, Engulfing Reversal, Double Top/Bottom, 3-Candle Continuation, Inside Bar Breakout, Fakeout Reversal) — these can't be deleted, since they're the app's core curriculum.
- Define your own strategies beyond those in Settings — add, edit, or archive them anytime.
- Every trade — manual, Analyzer-logged, or Quick Log — is tagged with a strategy.
- Deleting a custom strategy that's referenced by existing trades archives it instead of removing it, so historical trades keep their original label; archived strategies are hidden from new-entry pickers but still resolve correctly everywhere they're shown.
- Analytics' strategy breakdown, and the AI coach's pattern detection and per-strategy advice, both work across any number of strategies, built-in or user-defined.

### 7. Money management and planning
- Choose a Money Management style independently per Demo/Real account, in Settings:
  - **Fixed Risk %** — stake is a percent of your current balance or a fixed dollar amount, switchable anytime. Session-ending is governed by your chosen Trade Management style (Precision/Active/Structured).
  - **Anti-Martingale** — stake escalates by a configurable multiplier after each win, up to a configurable max (1 or 2 consecutive escalations), capped by a dollar ceiling (% of balance); any loss resets immediately to the base stake.
  - **Profit Lock** — a win stakes ONLY the profit just banked from that win (never your original capital), up to the same max-escalations/ceiling caps; any loss resets to base. A win that leaves the session's cumulative P&L still at or below breakeven does NOT escalate — the next stake stays at base until the session is genuinely in profit, so a partial recovery from an earlier loss is never mistaken for banked profit.
  - Both escalating styles skip Trade Management entirely — the session ends itself automatically the moment a profit target %, loss target %, or max-trades-per-session count is reached (all configurable, all % of the session's starting balance), whichever comes first. This ending is never a lock — Journal and Zone Analyzer stay fully accessible right after.
  - A **Suggested risk %** calculator (in Settings, collapsed by default) auto-populates from your real live balance and — when an escalating style is active — your actual configured profit target and max trades, then shows a suggested risk % with its reasoning. It only computes and displays; applying it to your real Risk % setting is a separate, explicit action.
- **Quick Log**: a rapid spreadsheet-style entry table, available whenever Anti-Martingale or Profit Lock is the active style for the current account mode.
  - Start, Pause, and End the session directly from Quick Log — the same live controls as the Dashboard, so you never have to leave the fast-entry view to manage the session itself.
  - Each row is one trade — pick a pair and direction, tap Win or Loss, and the row commits immediately: balance, session P&L, and the next row's suggested stake (calculated live from whichever escalating engine is active) all update instantly.
  - Made a mistake? Correct a row's outcome or direction in place, right from Quick Log — every downstream stat (balance, streak, next suggested stake) replays and recalculates automatically, no need to void and re-enter.
  - Click any row to open the same Trade Detail/Edit view used by the Journal, in-place, for adding a screenshot or notes without losing your spot in the table.
  - The session summary shows your profit target, loss target, and max-trades cap in concrete dollar/count terms, plus a progress bar showing exactly where the session's current P&L sits between its stop and target.
- Override the stake for any single trade at logging time (Journal manual entry, or when logging an Analyzer result) — type a custom dollar amount or percent instead of accepting the default.
- Track withdrawals and milestone targets.
- Review projected growth and balance progression over time.
- Use the built-in trading plan view to review your risk and session rules, plus an interactive zone-selection checklist for judging a zone before you trust it.

### 8. Analytics dashboard
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

### 9. AI Coach ("Ask")
A conversational assistant, grounded in your own journal data and this app's own curriculum — not a generic chatbot bolted on the side.
- **Data queries**: ask about your win rate, P&L, streaks, grade/strategy/pair breakdowns, discipline (off-plan rate), or session patterns for any date range — answered from your real computed numbers only, every win rate shown with its 95% confidence interval and sample size.
- **Advisory / coaching**: ask for a risk review, a money-management read, a discipline check, a broad performance review, session prep, or which strategy to favor — grounded in your actual trade/session history plus this app's own Price Action Playbook and money-management mechanics, including a per-strategy refinement read (which grade floor to require, whether off-plan entries are dragging a strategy down).
- **General trading knowledge**: ask what a concept means, how a strategy works, or which setup fits a given market condition — answered from the app's own curated Price Action Playbook and money-management definitions rather than generic textbook trading knowledge, so "Profit Lock" and the 8 named strategies always mean what they mean IN THIS APP.
- Never predicts market direction or gives a live trade call — a market-opinion question gets a real, direct answer about what's and isn't answerable, not a canned refusal.
- **Chat history**: conversations persist across sessions and devices (synced via Supabase); start a fresh "New chat" anytime. Terminal-style Up/Down arrow recall steps back through your previously sent messages in the current chat.
- Handles follow-ups intelligently — a bare "continue" after a cut-off reply picks up where it left off, and a short reactive remark ("that's because I was on a different style before") is understood as continuing the same thread, not treated as an unrelated new question.
- **Quiz mode**: click "Quiz me" for a two-phase multiple-choice training question — first identify which of the 8 Price Action Playbook setups a text-described scenario resembles (the name is hidden until you answer), then decide the actual trade: direction, expiry, or no trade at all if the scenario is a deliberate near-miss. Immediate right/wrong feedback plus an explanation citing the specific rule, a running score, and a "Polish / simplify wording" option if a scenario reads unclearly. Ephemeral by design — nothing is saved to your account, so there's nothing to manage or reset beyond starting a new chat.
- Resilient to AI provider rate limits: if the primary provider hits its rate limit, the app automatically retries on the other configured provider before falling back to a plain data recap (which is always clearly labeled as a fallback, never presented as a full answer).

### 10. Cloud account and sync
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
- OpenRouter API / Groq API for the Zone Analyzer and the AI Coach, with automatic fallback from Groq to OpenRouter's free model if Groq's rate limit is hit
- Jamendo API for session background music
- Vercel Functions + Upstash QStash + Resend for session-gap email notifications

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
   - In Authentication → URL Configuration, set **Site URL** to your deployed app's actual domain (e.g. `https://your-app.vercel.app`), and add `https://your-app.vercel.app/auth/confirmed` (and `http://localhost:3000/auth/confirmed` for local dev) to **Redirect URLs**. Sign-up already passes `emailRedirectTo` pointing at this path, but Supabase only honors it if the URL is on this allow-list — otherwise it silently falls back to the Site URL's default confirmation page. Without this step, confirmation still works, it just lands on Supabase's generic page instead of the app's own "Email confirmed" screen.

4. Configure AI provider keys
   - Sign up in the app, then add your OpenRouter and/or Groq API key in Settings — needed for the Zone Analyzer's AI grading and the AI Coach ("Ask") chat.
   - OpenRouter: https://openrouter.ai/keys (free model: nemotron-nano-12b)
   - Groq: https://console.groq.com/keys (free model: qwen3.6-27b)
   - Configuring both is recommended: if Groq's free-tier rate limit is hit, the app automatically retries the same request on OpenRouter instead of failing or falling back to a plain data recap.

5. Configure background music (optional)
   - Get a free client_id at https://developer.jamendo.com/v3.0.
   - Add it to `.env.local`: `REACT_APP_JAMENDO_CLIENT_ID=your-client-id`
   - Without a key, the Dashboard session music player shows "Music unavailable this session" — trading features are unaffected.

6. Configure session-gap email notifications (optional, requires a Vercel deployment)
   - This runs as two Vercel Functions (`api/schedule-gap-notification.js`, `api/send-gap-notification.js`), not locally in `npm start`.
   - Install the Upstash QStash/Workflow integration on your Vercel project (Marketplace → free plan) — provisions `QSTASH_TOKEN`, `QSTASH_CURRENT_SIGNING_KEY`, `QSTASH_NEXT_SIGNING_KEY` automatically.
   - Sign up free at https://resend.com, create an API key, and add it as `RESEND_API_KEY` in Vercel's Environment Variables (no domain needed — it sends from Resend's shared `onboarding@resend.dev` sender until you verify your own domain).
   - Requires `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` as plain (non-`REACT_APP_`) Vercel env vars — already provisioned automatically if you installed Supabase via the Vercel Marketplace.
   - Run the new migration (`supabase/migrations/20260705000000_session_email_notified.sql`) to add the `email_notified_at` dedup column.
   - Without this configured, session timing/locking works exactly the same — the schedule call just fails silently (fire-and-forget from the client).

7. Run the app
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