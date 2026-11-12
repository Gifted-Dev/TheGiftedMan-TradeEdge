# 0004. Masaniello Money Management Style

**Date**: 2026-11-12
**Status**: In Progress

Decision history (context, options, rationale): [rationale.md](rationale.md) · Verify steps: [verify.md](verify.md)

## Summary

This adds Masaniello as a fourth Money Management Style next to Fixed Risk %, Anti-Martingale, and Profit Lock. You choose how many wins you need (K) out of a total number of trades (N), and every stake is sized so that reaching K wins lands the cycle exactly on its target. The cycle ends by itself on K wins or on N minus K plus 1 losses (at planned payout, that loses close to all the cycle's capital). It plugs into the existing escalating style engine and stores everything in the existing `extra` JSON columns, so no database migration is needed.

## Requirements

**User stories**:
- As a trader, I want to pick Masaniello per mode and set capital, N, K, and payout, so the app sizes every stake for me.
- As a trader, I want to see the plan's outcome (final capital, gain, worst case) before I start, so I know what I am risking.
- As a trader, I want the cycle to end by itself on K wins or on the loss limit, and see today's events won and lost.

**Acceptance criteria**:
- **AC-1**: In Settings, the Money Management Style picker for each mode lists a fourth option "Masaniello" (id `MASANIELLO`). Demo and Real choose independently.
- **AC-2**: With Masaniello selected for a mode, Settings shows five inputs for that mode: Capital ($, prefilled with the mode's current balance when unset), Total trades N (integer 3 to 20, default 10), Win trades K (integer 1 to N minus 1, default 6), Payout % (1 to 100, default 92), Stop Loss % (1 to 100, default 100). An out of range value shows an inline error and is not saved. Lowering N below K + 1 shows the K error until K is fixed.
- **AC-3**: Below the inputs, a summary updates live from those inputs: Minimum capital, Required win rate (K / N, %), Capital final, Win profit (capital final minus capital), Account gain (win profit / mode balance, %, or "n/a" when the balance is 0 or less), Stop Loss (a dollar line: capital times Stop Loss %), Max Loss Limit (the loss count, N minus K plus 1 losses). Minimum capital is the smallest capital whose first stake is $1, the spreadsheet rule. Stop Loss is display only: it never ends a cycle. The summary carries the note "Assumes every trade pays the planned payout". Formulas are in *Masaniello math* below.
- **AC-4**: Starting a session under Masaniello is blocked, with a visible reason, when effective capital (the `msCapital` setting, or the current balance when unset, resolved fresh at each new cycle) is below Minimum capital ("Capital below minimum $X for K of N") or above the mode's current balance ("Capital is more than your balance").
- **AC-5**: A new Masaniello session snapshots N, K, payout, and capital into the session. Editing settings during a running cycle changes only the next cycle.
- **AC-6**: During a cycle, Dashboard and Quick Log show the next stake from the live stake formula, rounded to cents, never below $1, never above running capital, plus a one line reasoning ("Need k more wins in n trades. Stake $X.").
- **AC-7**: Quick Log's trade rows for a Masaniello cycle show, per trade, the stake, the return (the trade's pnl, using that trade's real payout), and running balance (session capital plus cumulative cycle pnl through that trade).
- **AC-8**: A DRAW is a push: it does not change `msWins`, `msLosses`, or the next stake, and does not use one of the N trades.
- **AC-9**: The cycle ends itself with `endReason` `MS_TARGET` when wins reach K, or `MS_LOSS_LIMIT` when losses reach N minus K plus 1. It has no time cap. Ending manually records `MS_MANUAL`.
- **AC-10**: The Masaniello settings panel shows today's events for that mode: Won (count of today's sessions ending `MS_TARGET`) and Lost (count ending `MS_LOSS_LIMIT`). `MS_MANUAL` counts as neither.
- **AC-11**: Masaniello is exempt from the 4 losses per day rule. A session ending `MS_LOSS_LIMIT` counts toward the same 2 per day loss target lock as `AM_LOSS_TARGET` and `PL_LOSS_TARGET`.
- **AC-12**: Masaniello settings and in cycle state survive a page reload (they round trip through Supabase).
- **AC-13**: The assistant's money management knowledge (`MM_STYLES_KNOWLEDGE`) describes four styles, including Masaniello's mechanics, instead of "the ONLY three".
- **AC-14**: A trade logged from the Journal (`addManual`) during a Masaniello cycle defaults its stake to the live Masaniello stake (through `stakeFor`). A manual stake override is still allowed; the cycle then follows real pnl (running capital moves by the actual result) and the next stake recomputes from it.
- **AC-15**: While a trade in the active Masaniello cycle is PENDING, logging another trade for that mode (Journal or Quick Log) is blocked with the message "Resolve your pending trade first". Resolution order of pending trades does not matter, since counts and `sPnl` are order independent.
- **AC-16**: The late grace trade into an already ended session (`commitRow`, `lateTradeLogged`) is not offered for Masaniello. `advanceMasaniello` does nothing once either end bound is reached.
- **AC-17**: The start gate from AC-4 lives in `mkSession`, so the auto start inside `addManual` is also refused, and the trade is not saved, when capital is invalid.
- **AC-18**: An active Masaniello cycle whose start date is before today is ended as `MS_MANUAL` on the first reconcile of the new day. It counts as neither won nor lost.
- **AC-19**: Correcting or deleting a trade in an active Masaniello cycle recomputes `msWins` and `msLosses` from the session's resolved trades and persists the change. A correction never reopens an ended cycle (same rule as AM and PL today).
- **AC-20**: Start session labels and the Quick Log time metric show "No time limit" for Masaniello instead of a minute count.
- **AC-21**: Later in a cycle the plan can call for a stake under $1 (the minimum capital rule only guarantees the first stake). The live stake is then raised to $1, because the broker will not take less, and the reasoning line says so ("Need k more wins in n trades. Stake $1.00 (plan $0.62, raised to the $1 minimum)."). The plan summary does not list per trade stakes, so nothing shows a sub $1 amount.

## Decision

**Chosen option**: Option 1: Masaniello as a new escalating style engine, live recompute from running capital.

Masaniello joins `isEscalatingStyle`, gets its own engine functions beside AM and PL, and recomputes each stake from the cycle's running capital using the planned payout.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Feature design

**Masaniello math** (p = payout % / 100, q = 1 + p):

Let `W(n, k)` be the fraction of the target capital you need when n trades remain and k wins are still needed.
- `W(n, 0) = 1` for any n ≥ 0 (target reached).
- `W(n, k) = 0` when k > n (cycle lost).
- `W(n, k) = (p * W(n-1, k) + W(n-1, k-1)) / q` for 1 ≤ k ≤ n.

Check: staking `s = W(n,k) - W(n-1,k)` (target units), a win gives `W(n,k) + p*s = W(n-1,k-1)` and a loss gives `W(n-1,k)`.

Derived values for capital `C0`:
- **Capital final** `Cf = C0 / W(N, K)`.
- **Live stake fraction** at state (n, k): `f(n, k) = 1 - W(n-1, k) / W(n, k)`. Live stake = `min(rc, max(1, round2(rc * f)))` where `rc` is running capital and `round2` rounds to cents. When k = n, f = 1 (all in). Cent rounding, and any stake raised to the $1 minimum (AC-21), leave residue, so final capital lands near (not exactly on) `Cf` or 0.
- **Live state**: `n = N - msWins - msLosses`, `k = K - msWins`.
- **Minimum capital** (spreadsheet rule: the first stake is $1): the first stake is `C0 * f(N, K)`, so minimum capital is `1 / f(N, K) = W(N,K) / (W(N,K) - W(N-1,K))`, rounded up to the cent. Only the first stake is guaranteed to be $1 or more. Later states can call for less (see **AC-21**).
- **Required win rate** `K / N * 100`.
- **Win profit** `Cf - C0`. **Account gain** `(Cf - C0) / mode balance * 100`.
- **Stop Loss** (dollars, display only) `C0 * Stop Loss % / 100`. **Max Loss Limit** `N - K + 1` losses (the loss count that ends the cycle).

Implement `W` as a small memoized table (at most 21 × 20 numbers) built by one pure function, `msTable(N, K, p)`.

**Data model sketch** (no migration):

`settings.extra`, per mode (suffix `Demo` or `Real`):
| Key | Type | Rule |
|---|---|---|
| `moneyMgmtStyle{Mode}` | string | gains value `MASANIELLO` |
| `msCapital{Mode}` | number, nullable | null means "use current balance"; must be ≤ balance at start |
| `msTotalTrades{Mode}` | int | 3 to 20, default 10 |
| `msWinTrades{Mode}` | int | 1 to N-1, default 6 |
| `msPayoutPct{Mode}` | number | 1 to 100, default 92 (matches `PAYOUT`) |
| `msStopLossPct{Mode}` | number | 1 to 100, default 100; display only, never snapshotted into a session |

`sessions.extra` (set only for Masaniello sessions, null otherwise):
| Key | Type | Rule |
|---|---|---|
| `msN`, `msK`, `msPayoutPct`, `msCapital` | numbers | snapshot at cycle start, never change |
| `msWins`, `msLosses` | int | start 0; draws excluded |
| `endReason` | string | gains `MS_TARGET`, `MS_LOSS_LIMIT`, `MS_MANUAL` |

Never stored (always derived): next stake, running capital (`msCapital + sPnl`), summary metrics, today's events.

`trades`: no new field. Each trade's existing `stake`, `pnl`, `payoutPct`, and `sessionNum` already carry everything the rows and replay need.

**State transitions** (one cycle):
`active` → `ended(MS_TARGET)` when msWins reaches K · `active` → `ended(MS_LOSS_LIMIT)` when msLosses reaches N-K+1 · `active` → `ended(MS_MANUAL)` on manual end. WIN increments msWins, LOSS increments msLosses, DRAW changes nothing.

**API surface**: no server endpoint. Client functions in `src/App.js`:
| Function | Inputs | Output |
|---|---|---|
| `msTable(N, K, payoutPct)` | ints, number | `W` lookup |
| `msPlanSummary(capital, N, K, payoutPct, balance, stopLossPct)` | numbers | `{minCapital, requiredWinRate, capitalFinal, winProfit, accountGainPct, stopLoss, maxLossLimit}` (`stopLoss` in dollars, `maxLossLimit` a loss count) |
| `liveMasanielloNextStake(session, balance, settings, mode)` | same signature as the AM/PL live stake functions; only `session` is read | dollars, raised to $1 when the plan stake is lower |
| `msStakeReasoning(session, balance, settings, mode)` | same signature pattern | string, adds "(plan $X, raised to the $1 minimum)" when raised |
| `advanceMasaniello(session, outcome)` | session, `WIN`/`LOSS`/`DRAW` | `{msWins, msLosses}` |
| `checkMasanielloSessionEnd(session, mode, settings)` | session | `MS_TARGET` / `MS_LOSS_LIMIT` / null |
| `getMs*ForMode(settings, mode)` | settings, mode | clamped setting values |

**Value sourcing**:
| Action | Value | Source |
|---|---|---|
| Settings panel | Capital default | mode balance (`balForMode`) when `msCapital{Mode}` is null |
| Settings panel | N, K, payout, Stop Loss % | `settings.extra` keys above, via `getMs*ForMode` |
| Settings panel | Stop Loss $ | capital times `msStopLossPct{Mode}` / 100, from `msPlanSummary` |
| Settings panel | Max Loss Limit | N minus K plus 1, from `msPlanSummary` |
| Next stake | Plan stake under $1 | raw `round2(rc * f)`, shown only in the reasoning line when raised |
| Settings panel | Summary metrics | `msPlanSummary` from inputs plus mode balance |
| Settings panel | Events won / lost | `ss.sessions` for the mode, filtered by `endReason` (already today only, per the comment near App.js:1047; no extra date filter) |
| Settings panel | Account gain | `msPlanSummary`; "n/a" when mode balance ≤ 0 |
| Journal entry | Default stake | `stakeFor` returning `liveMasanielloNextStake` for the active cycle |
| Pending block | Has pending | any trade with `sessionNum` equal to the active session and outcome `PENDING` |
| Midnight end | Cycle start day | date of `session.startTime` compared with `tod()` |
| Start label | Duration text | "No time limit" when `durationMin` is null |
| Start session | Snapshot values | `getMs*ForMode` at the moment of `buildSession` |
| Start gate | Min capital, balance | `msPlanSummary`, `balForMode` |
| Next stake | Running capital | `session.msCapital + session.sPnl` |
| Next stake | n, k | `msN`, `msK`, `msWins`, `msLosses` on the session |
| Next stake | payout | `session.msPayoutPct` (planned, not the trade's) |
| Trade row | Stake | trade's stored stake |
| Trade row | Return | trade's `pnl` (from `calcPnl` with the trade's own `payoutPct`) |
| Trade row | Running balance | `session.msCapital` plus cumulative pnl of earlier cycle trades |
| End check | Reason | `msWins` vs `msK`, `msLosses` vs `msN - msK + 1` |

**Key invariants**:
- `1 ≤ K ≤ N - 1`, `3 ≤ N ≤ 20`, enforced by the getters (clamp) and the inputs (reject).
- `msWins ≤ K` and `msLosses ≤ N - K + 1`; the session is inactive once either bound is hit.
- Snapshot fields never change after `buildSession`.
- Masaniello ignores `riskMode`, `riskPercent`, `riskAmount`, and Milestone Base Sizing; `amBaseStake` is never called for it.
- A Masaniello session has `durationMin: null`, so it never time expires.
- Withdrawals during a cycle do not change running capital (it reads `msCapital + sPnl`, not balance).
- `sPnl` is the capital basis because every trade linked to the session counts, including overrides and off plan trades. Trades with no `sessionNum` are outside the cycle.
- Profits do not compound into the capital setting. A null `msCapital` resolves to the balance at each new cycle; a set value stays fixed. Compounding belongs to feature 5.
- The getters clamp K to N minus 1 for use, while the Settings input keeps showing the error until the stored K is fixed.
- Payout under plan on late or all in trades makes final capital fall short of `Cf`, and a K win finish can even sit below `C0` after heavy drift. The loss limit stays counted in trades, not dollars.

**Security model**: no change. Settings and sessions are already owned per user under existing Row Level Security (database rules limiting each row to its owner). No new data is shared.

**Configuration required**: none.

**Critical test scenarios**:
- Math: `msTable(10, 6, 92)` gives `Cf / C0 ≈ 2.330087` (checked by hand: $100 becomes $233.01 on both the wins first and the four losses first paths); any path ends at `Cf` or near 0 within a few cents (rounding residue) when payout equals plan. Verifies **AC-3**, **AC-6**.
- Pending: with one cycle trade PENDING, a second log is refused; resolving trades in reverse order gives the same counts. Verifies **AC-15**.
- Midnight: a cycle started yesterday ends `MS_MANUAL` on first reconcile today. Verifies **AC-18**.
- Correction: flipping a cycle WIN to LOSS updates `msWins`/`msLosses` and persists after reload. Verifies **AC-19**.
- K = N edge is rejected; K = N - 1 last trade with k = n stakes all running capital. Verifies **AC-2**, **AC-6**.
- Minimum capital: capital one cent below min blocks start with the message; at min, the first stake is $1.00 (not below). For 10 of 6 at 92%, min capital is `1 / f(10,6)`, $3.24 (3.2368; the old every state rule gave $21.50). Verifies **AC-4**.
- Sub $1 later: at min capital, a state later in the cycle whose plan stake is under $1 returns $1.00 and the reasoning line names the plan amount. Verifies **AC-21**.
- Labels: Stop Loss shows capital times Stop Loss %; Max Loss Limit shows N minus K plus 1 losses; Stop Loss % never ends a cycle. Verifies **AC-3**.
- Cycle: 6 wins out of 10 ends `MS_TARGET`; 5 losses ends `MS_LOSS_LIMIT`; a draw in between changes nothing. Verifies **AC-8**, **AC-9**.
- Drift: a trade at 85% payout under a 92% plan; next stake equals running capital × f. Verifies **AC-6**, **AC-7**.
- Lock: two `MS_LOSS_LIMIT` sessions today lock the mode; four individual losses inside cycles do not. Verifies **AC-11**.
- Reload: settings and mid cycle `msWins`/`msLosses` survive the Supabase round trip. Verifies **AC-12**.
- Mid cycle edit of N does not change the running cycle. Verifies **AC-5**.

## Build plan

Tracer Bullet: first a thin thread that runs one real cycle end to end (setting, start, stake, outcome, auto end, persisted), then thicken with validation, summary, events, and locks.

1. Pure engine: `msTable`, `msPlanSummary`, `liveMasanielloNextStake`, `msStakeReasoning`, `advanceMasaniello`, `checkMasanielloSessionEnd`, `getMs*ForMode`, with unit tests for the math scenarios above. Satisfies **AC-3**, **AC-6**, **AC-8**, **AC-9**.
2. Thin thread: add `MASANIELLO` to `MM_STYLES` and make sure the `moneyMgmtStyle{Mode}` setter accepts it; add the four `ms*{Mode}` settings keys to the settings whitelist (near App.js:270) and the six session keys (`msN`, `msK`, `msPayoutPct`, `msCapital`, `msWins`, `msLosses`) to the session whitelist (near App.js:343); snapshot in `buildSession`; add Masaniello branches to `isEscalatingStyle`, `liveEscalatingNextStake`, `escalatingStakeReasoning`, `advanceEscalatingStake`, and `checkEscalatingSessionEnd`; set `durationMin: null` in `getEffectiveSessionDuration` for Masaniello and render "No time limit" in the start labels (near App.js:3604, 5582) and the Quick Log time metric (near 5595); plain N, K, payout, capital inputs in Settings. Run one cycle in Quick Log to `MS_TARGET` and reload. Satisfies **AC-1**, **AC-5**, **AC-6**, **AC-9**, **AC-12**, **AC-20**.
3. Walk every remaining `isEscalatingStyle` call site (about 25), including the time triggered reconciles (near App.js:3446, 8560) that must tolerate a null duration. Known trap: ternaries that assume only two escalating styles and would mislabel Masaniello, near App.js:4583, 7628, 7773, 3621, 5760, 7324 (`calcIsAM`). Set `MS_MANUAL` wherever the manual end path writes its end reason for a Masaniello session, without changing the AM/PL value. Satisfies **AC-9**, **AC-11**.
4. Replay and corrections: in `correctOutcome` (near App.js:5494) and the reconcile replay (near 8484 to 8503), reset and recompute `msWins`/`msLosses` from resolved session trades, seed running capital from `msCapital` instead of `startBalance`, and add the ms keys to the change detection (near 8517) so an ms only change persists. Satisfies **AC-8**, **AC-19**.
5. Logging guards: route `stakeFor` through `liveMasanielloNextStake` for Journal entries; block a new log while a cycle trade is PENDING; turn off the late grace trade in `commitRow` for Masaniello; move the start gate into `mkSession`; end a cycle started before today as `MS_MANUAL` on reconcile. Satisfies **AC-14**, **AC-15**, **AC-16**, **AC-17**, **AC-18**.
6. Quick Log rows: for Masaniello, fold running balance from `session.msCapital` instead of `startBalance`, and show stake, return, running balance from stored trade values. Satisfies **AC-7**.
7. Settings validation and summary panel (inline errors, live metrics, "n/a" gain, planned payout note) plus the start gate messages in Dashboard and Quick Log. Satisfies **AC-2**, **AC-3**, **AC-4**.
8. Today's events won and lost in the Masaniello settings panel. Satisfies **AC-10**.
9. Daily lock: include `MS_LOSS_LIMIT` in `amPlLossTargetSessionCount`, and update the lock message text to name Masaniello. Satisfies **AC-11**.
11. Spreadsheet alignment (added 2026-11-12, after the earlier steps were built): change `msPlanSummary` minimum capital to `W(N,K) / (W(N,K) - W(N-1,K))` and rename its fields (`stopLoss` dollars, `maxLossLimit` count); add `msStopLossPct{Mode}` to the settings whitelist, `msFieldErrors` and a fifth Settings input; relabel the two summary metrics; raise the live stake to $1 with the reasoning note; update the existing tests in `src/Masaniello.test.js`. Satisfies **AC-2**, **AC-3**, **AC-4**, **AC-21**.
10. Update `MM_STYLES_KNOWLEDGE` and the "Anti-Martingale / Profit Lock only" Quick Log alert copy for four styles. Satisfies **AC-13**.

## Consequences

**Positive**:
- Traders get exact Masaniello stakes inside the app, with session tracking and locks intact.
- Self correcting stakes keep the plan on track when broker payout shifts.
- No migration and no new dependency.

**Negative / tradeoffs**:
- Final capital can land slightly off the preview when real payouts differ from the planned payout.
- A losing cycle loses the full allocated capital by design; the only guard is the capital input and the daily lock.
- `isEscalatingStyle` now means "own session rules" rather than "escalates on wins"; the name is slightly misleading. Renaming it is out of scope.
- App.js grows by a few hundred lines in an already 8,800 line file.

**Neutral**:
- Feature 5 (daily goals and session counter) and feature 6 (settings recommender) build on `msPlanSummary` and the `MS_*` end reasons defined here.

## Follow-up

- [ ] Feature 5 should reuse `msPlanSummary` and today's `MS_TARGET` count instead of re-deriving them.
- [ ] Feature 6 should reuse `msPlanSummary(...).minCapital` and `requiredWinRate` for its filter.
