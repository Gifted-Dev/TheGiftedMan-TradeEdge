# 0006. Masaniello Profit Target and Session Counter

**Date**: 2026-11-12
**Status**: Accepted

## Revision 2026-11-14: daily goal

The profit target is a daily goal, not a goal that runs across days. This replaces the earlier "count since `msTargetSetAt`" design, which reset the count whenever the target was edited and had no clear way to start a new day.

- Each day starts at 0 sessions and 0 profit. The Dashboard shows "Session x/y" for today only.
- A `%` goal uses the balance at the start of the day, so it follows the account as it grows.
- Only `msTargetValue` and `msTargetUnit` are stored. `msTargetDollars`, `msTargetSetAt`, `loadMsTargetHistory`, `msMergeSessions`, the history cache and the "reading earlier sessions" state are removed. Wherever the text below still mentions them, this section wins.
- Known limits, accepted: a cycle that starts before midnight and ends after it counts toward neither day (sessions are grouped by their start date). A trade logged before midnight and settled after it moves that day's start balance, so a `%` goal can shift by a little during the day.
- New helper `msTargetDollarsToday(settings, mode, dayStartBal)`. `msModeProgress`, `msCounterLabel` and `msAlertEvents` take today's sessions and the day start balance instead of a history entry.

## Revision 2026-11-14 (b): Stop Loss always ends the cycle, Max Loss Limit follows it

Stop Loss % now always ends a cycle, and the Max Loss Limit shown in the plan follows it. This replaces the "Stop Loss ends cycle" toggle and the "Stop loss alert" toggle. Wherever the text below still mentions those two toggles, this section wins.

**Requirements** (new, continue the AC numbering):
- **AC-18**: The "Stop Loss ends cycle" toggle (`msStopLossEnds{Mode}`) and the "Stop loss alert" toggle (`msAlertStopLoss{Mode}`) are removed from the panel, the settings whitelist, the draft defaults and the getters. Saved values of these keys in `settings.extra` are ignored and left in place (no migration). This replaces AC-16 (toggle) and the Stop Loss alert part of AC-13 and AC-14; only "Cycle end alert" and "Target reached alert" remain.
- **AC-19**: Stop Loss always ends a cycle. After any trade result, if the cycle loss `-sPnl` is at or above the Stop Loss dollar line (`msCapital` times current `msStopLossPct{Mode}` / 100, blank counts as 100), the cycle ends with `MS_STOP_LOSS`. Order of checks, draw rule, overshoot rule and "not snapshotted" rule stay as AC-16 says. At 100 the line equals the full capital, so it fires only when the cycle's capital is used up (the $1 minimum stake can drain a small capital to 0 before loss `N - K + 1`; the cycle then ends `MS_STOP_LOSS` instead of sitting active with a $0 stake). The check runs after a trade result, so lowering Stop Loss % mid cycle ends the cycle on the next result, not on save. Live play and the panel read Stop Loss % through one getter, `getMsStopLossPctForMode(settings, mode)`: a blank, non number or out of range (not 1 to 100) value counts as 100. `msStopLossHit` and the panel default both use it. The hint "Cycle ends at a loss of $X" under the Stop Loss % field is always shown when the plan is valid. The `MS_STOP_LOSS` end text becomes "stopped by Stop Loss: loss $X of $Y line" (App.js near 5908; the notification text stays "stopped by Stop Loss"). The live "Losses x / N-K+1" metric (near 5942) and the `MS_LOSS_LIMIT` text (near 5907) keep `N - K + 1`. AC-17 (counts as Lost, counts toward the target, no daily lock, "stopped by Stop Loss" text, cycle end alert) still holds.
- **AC-20**: The plan summary's "Max Loss Limit" is the number of losses in a straight losing run (every trade loses) that takes the cycle loss to the Stop Loss line, never more than `N - K + 1` and never less than 1. It uses the same plan stakes as live play, including the $1 minimum stake. With Stop Loss 100 (or blank) it equals `N - K + 1` unless the $1 minimum stake drains the capital sooner, in which case it is that smaller count. If capital is 0 or less it returns `N - K + 1`. It is still shown when capital is below Minimum capital (minimum capital already shows red). The metric shows "X losses". Only when X is less than `N - K + 1` the metric adds the sub text "plan limit 5" (the real number) and the note "Counts a straight losing run". The panel InfoTip near App.js:8004 is reworded to say the cycle ends on K wins or at the Stop Loss line, whichever comes first.
- **AC-21**: Only the dollar line ends a live cycle. The straight run count is a plan number for the panel: with wins in between, the stakes differ and the dollar line still decides, so a cycle can end on a different loss count than the panel shows. The plan note says "Counts a straight losing run".
- **AC-22**: The plan Max Loss Limit updates live as capital, N, K, payout or Stop Loss % change, and uses the same effective capital as the rest of the plan (`msCapital`, or the mode balance when Capital is empty or auto copy is on).

**Decision**: Option A: derive the count from Stop Loss and drop both toggles. Runner ups: keep the toggles (two meanings for one metric), make the metric the Stop Loss dollar line only (loses the loss count the plan is built on).

**Rationale**: The two numbers disagreed: with Stop Loss 20% the plan said 5 losses while the cycle already ended at a $20 loss. A toggle kept both meanings alive. One rule is easier to explain: the Stop Loss line is the cap, and the count is what that cap means in losses. A straight losing run is the only path with one clear answer, because stakes change with every win. Existing users who typed a Stop Loss below 100 with the toggle off will now see cycles end at that line. The default is 100, which never fires, so only users who set a line on purpose are affected, and no migration is run.

**Build design**:
- New pure function `msLossLimitFromStopLoss(capital, N, K, payoutPct, stopLossPct)`. If `capital <= 0` return `N - K + 1`. Otherwise for i = 0 to `N - K`: `stake = liveMasanielloNextStake({ msN: N, msK: K, msPayoutPct: payoutPct, msCapital: capital, msWins: 0, msLosses: i, sPnl: -cum })` where `cum` is the loss so far, then `cum += stake`; return i + 1 at the first loss where `cum >= capital * stopLossPct / 100 - 1e-9`. If none, return `N - K + 1`. It calls the live stake function, so rounding, the $1 minimum and the last all in stake match play by construction. `k > n` cannot happen inside the loop (after `N - K` losses `n = K`, and the last stake is all of `rc`).
- New getter `getMsStopLossPctForMode` (see AC-19); the panel uses it instead of its own `isBlank ? 100` default.
- `msPlanSummary` returns `maxLossLimit` from it (it already receives `stopLossPct`); keep the field `stopLoss` for the dollar line.
- `checkMasanielloSessionEnd` drops the `getMsStopLossEndsForMode` condition; keep `msStopLossHit` as is.
- Remove `getMsStopLossEndsForMode`, `getMsAlertStopLossForMode`, `stopLossAlertedRef` (declaration near 9542, reset near 9374), `stopLossAlerted` from the `st` contract of `msAlertEvents` (near 1768 and 9551), the Stop Loss branch of `msAlertEvents`, the two toggles, `stopEnds` (near 7990) with the hint gate (near 8016, becomes `plan &&`), and the draft and whitelist keys (App.js near lines 270 to 300, 1713, 1769, 1809, 8015, 8059, 8119). Update tests in `src/Masaniello.test.js`: lines 63 to 69 (`msPlanSummary(200,10,6,92,500,25).maxLossLimit` was 5, rewrite with a hand computed value), 77 to 88 (`checkMasanielloSessionEnd(s)` has no settings, so it now means a 100% line; pass settings and keep the $3.24 drain case, which now ends `MS_STOP_LOSS`), 202 to 222, 292 and 370 to 389.

**Value sourcing**:
| Action | Value | Source |
|---|---|---|
| Max Loss Limit metric | capital | effective capital as the plan uses it (AC-22) |
| Max Loss Limit metric | N, K, payout | panel inputs |
| Max Loss Limit metric | Stop Loss line | `msStopLossPct` input (blank is 100) times capital |
| Max Loss Limit metric | per trade stake | `msTable` plan rule with the $1 minimum, as `liveMasanielloNextStake` |
| Live cycle end | loss and line | `-session.sPnl`, `session.msCapital` times current `msStopLossPct{Mode}` |

**Critical test scenarios**:
- Capital $100, N 10, K 6, payout 92, Stop Loss 100: `msLossLimitFromStopLoss` returns 5. Verifies **AC-20**.
- Same inputs, Stop Loss 20: returns the first run length whose summed stakes reach $20, below 5. Verifies **AC-20**.
- Stop Loss 1 (tiny line): returns 1 (first stake already crosses). Verifies **AC-20**.
- Plan stake raised to the $1 minimum is used in the replay (capital $10, K of N with a planned stake under $1). Verifies **AC-20**.
- Capital $3.24, N 10, K 6, Stop Loss 100: returns 4 and the live cycle ends `MS_STOP_LOSS` when capital is used up. Capital 0 returns `N - K + 1`. Verifies **AC-19**, **AC-20**.
- `getMsStopLossPctForMode` returns 100 for blank, 0, 150 and `abc`, and the value for 1 to 100. Verifies **AC-19**.
- Lowering Stop Loss % below the current loss does not end the cycle until the next trade result. Verifies **AC-19**.
- `msPlanSummary(...).maxLossLimit` follows Stop Loss, and the panel shows the note when below `N - K + 1`. Verifies **AC-20**, **AC-22**.
- Session with a loss at or over the line ends `MS_STOP_LOSS` with no setting on; a draw does not; a win reaching K ends `MS_TARGET` first. Verifies **AC-19**.
- The two removed toggles are not rendered and a saved `msStopLossEndsDemo: true` is ignored without error. Verifies **AC-18**.
- Only two alert toggles render and a loss crossing the line gives one chime (cycle end). Verifies **AC-18**, **AC-19**.

**Build plan**:
8. Pure engine: `msLossLimitFromStopLoss`, `msPlanSummary.maxLossLimit`, `checkMasanielloSessionEnd` without the toggle, with tests. Satisfies **AC-19**, **AC-20**, **AC-22**.
9. Panel and cleanup: Max Loss Limit metric and note, always visible end hint, remove both toggles, the getters, the ref and the alert branch, whitelist and draft keys, and update the old tests. Satisfies **AC-18**, **AC-21**, **AC-22**.

**Consequences**:
- One rule for Stop Loss, no toggle to explain.
- Users with a saved Stop Loss below 100 now have cycles end at that line (accepted, no migration).
- The panel loss count is a straight run estimate, so a live cycle with wins in between can end on another count.
- The "Stop loss alert" is gone: a trader no longer gets a warning before the line, only the cycle end alert at it.
- Stale `msStopLossEnds*` and `msAlertStopLoss*` keys stay in the settings JSON, harmless.
- The Stop Loss line uses current settings while capital is snapshotted, so lowering Stop Loss % ends active cycles (also in another tab) on their next trade result.
- At Stop Loss 100 a small capital can now end a cycle as `MS_STOP_LOSS` when the $1 minimum stake uses it up, where before it sat active with a $0 stake.

## Summary

This adds one profit target field to the Masaniello settings panel, plus a plain answer line such as "About 4 sessions to reach $200". The Dashboard counter for a Masaniello mode then shows progress toward that target ("Session 2/4") instead of the Sessions per day cap. Progress is worked out from the sessions you have already finished, so it survives reloads and corrections without any new counter to keep in sync. It also adds three alerts (cycle end, target reached, stop loss), an "auto copy balance" option, a per mode toggle that lets Stop Loss % end a cycle (default off), and removes the daily loss lock for Masaniello. No database migration is needed.

## Context

Spec [0004](0004-masaniello-money-management-style/index.md) gave Masaniello its own cycle: each session is one cycle of N trades that ends on K wins or on the loss limit. A winning cycle makes a known profit (the "Win profit" in the plan summary). What a trader actually wants is a goal in dollars ("make $200") and an answer to "how many cycles is that?". Today the plan summary only describes one cycle.

The Dashboard shows "Session x/y" where y is the Sessions per day setting (2 or 3). That cap makes no sense for Masaniello, where the number of sessions comes from the target and the plan, not from a daily habit.

Two facts in the current code shape the design. First, the app loads only today's sessions (`ss.sessions`, App.js:8590), so a target that spans several days cannot be counted from that list alone. Second, spec 0004 counts a Masaniello loss limit toward the daily two loss session lock. The engineer decided that lock should not apply to Masaniello, because a target that needs several cycles must be able to run back to back.

## Requirements

**User stories**:
- As a trader, I want to type one profit target and see how many sessions it takes, so I can plan the work.
- As a trader, I want the Dashboard to show how far along I am (Session 2/4), so I do not have to count myself.
- As a trader, I want a sound and a desktop alert when a cycle ends, when the target is reached, and when a cycle hits my stop loss line.

**Acceptance criteria**:
- **AC-1**: With Masaniello selected for a mode, the Masaniello settings panel shows one "Profit target" input with a `$` / `%` unit switch (default `$`). Empty means no target (switching the unit on an empty field changes nothing, so type the value first, then pick `%`). `$` accepts 0.01 to 1,000,000. `%` accepts 0.1 to 1000, and works only while the balance at the start of the day is above 0: otherwise the panel says so, shows no answer line, and there is no goal that day. An out of range value shows an inline error and is not saved; the last saved target stays.
- **AC-2**: The target is stored as typed: `msTargetValue` and `msTargetUnit` (`$` or `%`), nothing else. The goal in dollars is worked out each day: unit `$` is the typed value; unit `%` is the typed value times the mode balance at the start of that day (local midnight), rounded to cents. With `%` the panel shows "= $X today, from your balance at the start of the day".
- **AC-3**: Under the target field an answer line updates live as capital, N, K, payout, the target, or the balance change: "About S sessions to reach $T" (singular "About 1 session"), followed by "Projected account gain +X%" (profit after S plan cycles divided by the mode balance). Capital final is already in the plan summary above it.
- **AC-4**: Sessions required S assumes every cycle reaches K wins at the planned payout (the note "Assumes every cycle reaches K wins" is shown). S is the smallest count whose cumulative win profit reaches the remaining target. When the capital follows the balance (Capital empty, or auto copy balance on), each cycle starts from the grown balance (compounding). When Capital is a fixed value, every cycle makes the same profit. Formulas are in *Sessions math* below.
- **AC-5**: S is not limited by the Sessions per day setting.
- **AC-6**: The answer line never shows a blank or a wrong number. Empty target: "Set a profit target to see how many sessions it takes." Effective capital below Minimum capital: "Raise Capital to at least $X first." (when the capital follows the balance: "Balance is below the $X minimum for K of N.") More than 100 sessions needed: "More than 100 sessions at this plan. Lower the target or change N and K." Target already reached: "Target reached: +$P in S sessions." Invalid inputs show only the field errors. A % goal that is not usable (the balance at the start of the day is 0 or less, or the goal rounds under $0.01) shows a message and no answer line.
- **AC-7**: Sessions that count toward today's goal are today's sessions of that mode with `msN` set (Masaniello) and not active, whatever the end reason, in end order. Counting stops at the first session after which cumulative profit (sum of each session's `sPnl`) reaches the goal, so "reached" never un reaches. Every new day starts again at 0 sessions and 0 profit.
- **AC-8**: The Dashboard mode card, for a mode on Masaniello with a target, shows "Session x/y". x = counted sessions plus 1 when a Masaniello session is active. y = counted sessions plus the sessions still required for the remaining target (a loss raises y). When the target is reached it shows "Target reached" and the counted number of sessions. With no target it shows all of today's sessions for the mode with no cap ("Session 2"). Fallbacks when y has no value: capital below minimum, show "Session x" plus the hint "capital below min"; more than 100 needed, show "Session x/100+". A mode on any other style keeps the existing "Session n/Sessions per day". The Dashboard reads saved settings (`getMs*ForMode`) and `balForMode(mode)`, never the Settings draft.
- **AC-9**: Progress survives a page reload and trade corrections, because it is derived from today's stored sessions and not from a stored counter. No read of earlier days is needed.
- **AC-10**: Editing the target (higher, lower, or the unit) never resets the count. Only the goal changes, so the total sessions needed adjusts and the sessions already done today still count. Clearing the target removes the goal. Demo and Real are independent.
- **AC-11**: A per mode toggle "Auto copy balance" (default off). On: each new cycle takes the current mode balance as its capital, ignoring `msCapital`, and the Capital field is disabled with the hint "Following your balance". Off: today's rule (fixed Capital stays, empty Capital follows the balance).
- **AC-12**: Masaniello no longer counts toward the 2 per day loss target lock: an `MS_LOSS_LIMIT` or `MS_STOP_LOSS` session is not counted by `amPlLossTargetSessionCount`, and the lock messages stop naming Masaniello. A lock caused by earlier AM or PL sessions in the same mode still applies. This replaces the last sentence of 0004 AC-11.
- **AC-13**: Three per mode alert toggles in the panel: "Cycle end alert" (default on), "Target reached alert" (default on), "Stop loss alert" (default off, only matters while "Stop Loss ends cycle" is off, see AC-16). Each plays the existing alert chime when sound is on, and a desktop notification when the tab is hidden and desktop alerts are on. The global sound and desktop settings still gate everything.
- **AC-14**: Cycle end alert: when a Masaniello session ends, the chime and notification fire only if the toggle is on, and the notification says what happened ("Masaniello cycle won", "Masaniello cycle lost", "Masaniello cycle ended"), not "Session locked". A Masaniello session never falls through to the generic chime: with the toggle off it is silent. No alert fires for sessions that were already ended when the app loaded (the existing effect is fixed to seed its previous state on the first load, which also stops today's ended sessions re chiming on every reload). Target reached alert: fires once, when an ended session makes the target reached. If both fire at the same moment, one chime plays and the notification says "Profit target reached". Stop loss alert: fires once per cycle, while the cycle is active, when its loss (`-sPnl`) reaches the Stop Loss dollar line (capital times Stop Loss %). Stop Loss is checked only while the session is still active in the current snapshot, so the trade that ends the cycle gives one chime, not two. Stop Loss ends a cycle only when AC-16 is on. While AC-16 is on, the Stop loss alert does not fire (the cycle end alert covers it).
- **AC-15**: Target reached alert timing: it fires only on a flip caused by a session that ended after the app loaded. The previous "reached" value is kept per mode together with the goal in dollars, so editing the goal (even back to an earlier value) never plays it.
- **AC-16**: A per mode toggle "Stop Loss ends cycle" (default off) sits next to the Stop Loss % field. Off: Stop Loss % stays display and alert only, as in 0004. On: after any trade result, if the cycle loss `-sPnl` is at or above the Stop Loss dollar line (`msCapital` times current `msStopLossPct{Mode}` / 100), the cycle ends with `endReason` `MS_STOP_LOSS`. Order of checks: `MS_TARGET`, then `MS_LOSS_LIMIT`, then `MS_STOP_LOSS`, so the plan's own rules win a tie. A draw changes no loss, so it never triggers it. The loss can overshoot the line by the last stake; the cycle ends on crossing, it is not capped. With Stop Loss % at 100 the line equals the full capital, so it effectively never fires. When the toggle is on, the panel shows "Cycle ends at a loss of $X" next to the field.
- **AC-17**: An `MS_STOP_LOSS` session behaves like any ended Masaniello session. It counts toward the profit target (AC-7, any end reason), counts as Lost in the panel Won and Lost numbers, and is not counted by the daily lock (AC-12). The Session ended notice reads "Masaniello cycle stopped by Stop Loss". It uses the cycle end alert toggle (AC-14), not the Stop Loss alert toggle, so the end gives one chime. The session end text near App.js:5856 and the "won, lost, ended" word near App.js:9205 both gain this case.

## Options considered

### Option 1: Target in settings, progress derived from stored sessions

The target lives in settings. Progress is computed from ended Masaniello sessions: today's sessions from live state plus earlier days from one read when needed.

**Pros**:
- Nothing to keep in sync: corrections, deletes, and reloads are right by construction.
- Reuses `sPnl` and `endTime` already stored on each session.
- No migration.

**Cons**:
- One extra read of earlier sessions when the target was set before today.
- Needs a small merge of two sources (earlier days plus today).

### Option 2: Stored counters

Keep `msTargetSessions` and `msTargetProfit` in settings and add to them whenever a session ends.

**Pros**:
- No extra read.

**Cons**:
- Counters drift when a trade is corrected or deleted after the session ended, or when a session ends in a second tab.
- Every end path must remember to update them.

### Option 3: Rebuild from the trades table

Sum trade `pnl` since the target date.

**Pros**:
- Trades are already loaded in full.

**Cons**:
- Trades do not say which style or cycle they belong to, so Fixed Risk trades would leak in.
- Cannot count sessions, only profit.

## Decision

**Chosen option**: Option 1: Target in settings, progress derived from stored sessions.

The target and toggles are stored in `settings.extra`; sessions done and profit so far are always derived from ended Masaniello sessions.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`) · `supabase` (`supabase/agent-skills`, `.agents/skills/supabase/`)

## Rationale

The forces are: corrections must stay right (0004 AC-19 recounts cycle trades), the app already loads only today's sessions, and the project wants no migration. Derived progress is the only option where a corrected or deleted trade cannot leave a stale counter. The extra read is small (one query, only when the target started before today) and the earlier days never change, so it can be loaded once per target and mode, then merged with today's live sessions.

Compounding when the capital follows the balance matches how Masaniello is run in practice (each cycle starts from the grown balance) and gives an honest, shorter answer than a flat estimate. When Capital is fixed, the flat rule is exact. A win rate adjusted estimate was rejected for this feature because it overlaps feature 6 (the recommender) and needs trade history.

The engineer chose to remove the daily lock for Masaniello. Their reason is that reaching a target takes several back to back cycles. The cost is real: after two losing cycles the app no longer stops a third. The Stop Loss alert and the Capital input are the remaining guards. The sticky mode wide lock from earlier AM or PL sessions is kept, so switching style cannot be used to trade around a bad day.

Stop Loss % ending a cycle is a per mode toggle, default off, not always on. Options were never (alert only), always, or a toggle. Always would silently change what every saved Stop Loss % means, and the plan already caps loss at N minus K plus 1 losses. A toggle lets a trader who wants a tighter dollar cap opt in, while everyone else keeps the 0004 behavior. The runner up was never (alert only), which is the smallest build but leaves no way to enforce the line. A new `MS_STOP_LOSS` reason keeps history and alert text honest, and it counts as Lost so the panel stays at two numbers.

## Feature design

**Sessions math** (g is the profit of one winning cycle as a fraction of its capital):
- `W = msTable(N, K, payout)[N][K]`, `g = 1 / W - 1`. A cycle with capital C makes `C * g` when it reaches K wins.
- `remaining = max(0, targetDollars - profitSoFar)`. Under AC-7, `profitSoFar` is the cumulative profit of counted sessions.
- **Capital follows balance**: `B = mode balance`; for i = 1 to 100: `profit = B * g`, `cum += profit`, `B += profit`; S is the first i where `cum >= remaining - 1e-9`.
- **Fixed Capital C**: `S = ceil(remaining / (C * g) - 1e-9)`, and above 100 shows the "More than 100" message.
- Projected account gain = `cum after S cycles / current mode balance * 100`.
- Capital used for the Minimum capital check: balance when following, else `msCapital`.
- While a cycle is active, the plan counts that cycle as one of the remaining sessions (its trades are already in the balance, a small overlap that is accepted).

**Data model sketch** (no migration):

`settings.extra`, per mode (suffix `Demo` or `Real`):
| Key | Type | Rule |
|---|---|---|
| `msTargetValue{Mode}` | number, nullable | typed value; null means no target |
| `msTargetUnit{Mode}` | `'$'` or `'%'` | default `'$'` |
| `msAutoCopyBalance{Mode}` | boolean | default false |
| `msAlertSessionEnd{Mode}` | boolean | default true |
| `msAlertTargetReached{Mode}` | boolean | default true |
| `msAlertStopLoss{Mode}` | boolean | default false |
| `msStopLossEnds{Mode}` | boolean | default false (AC-16) |

`sessions`: no change. `endReason` already holds free text, so `MS_STOP_LOSS` needs no migration. The Stop Loss line is read from current settings, not snapshotted, the same as the alert; changing Stop Loss % mid cycle moves the line. The Stop Loss alert guard is kept in memory in its own ref, `stopLossAlertedRef` (not the cycle end `alertedRef`, which would hide the end alert), so a reload in the middle of a cycle can repeat that one alert once.

Derived, never stored: counted sessions, profit so far, sessions required, y in "Session x/y", reached state.

**State transitions** (target): `none` → `active` when a target is saved · `active` → `reached` when today's cumulative profit reaches the goal (derived, latched by AC-7) · every new day starts `active` again at 0 sessions · an edited target keeps today's count (`reached` is derived again against the new goal) · any → `none` when the field is cleared. An edited goal is seeded silently by the alert latch (no chime on Save).

**API surface**: no server endpoint. Pure functions in `src/App.js`, no read:
| Item | Inputs | Output |
|---|---|---|
| `msSessionsToTarget(targetDollars, profitSoFar, capital, followBalance, balance, N, K, payoutPct)` | numbers, boolean | `{sessions, projectedProfit, projectedGainPct}` or `{reason: 'below_min' or 'too_many' or 'reached'}` |
| `msTargetProgress(endedMsSessions, targetDollars)` | sessions, number | `{count, profit, reached}` (sorted by `endTime`, stops at the crossing session) |
| `msTargetDollarsToday(settings, mode, dayStartBal)` and `dayStartBalForMode(settings, trades, wds, mode)` | settings, mode, balance | the goal in dollars for today (`$` as typed; `%` of the balance at local midnight; null under $0.01), and the mode balance from trades and withdrawals before local midnight. A different signed in user resets the alert state. |
| `getMsAutoCopyBalanceForMode`, `getMsAlert*ForMode` | settings, mode | values with the defaults above |

`getMsCapitalForMode` gains a check: when `msAutoCopyBalance` is on, return the balance.

`checkMasanielloSessionEnd(session)` gains `settings` and `mode` (the dispatcher near App.js:1566 already has both) and, after the two plan rules, returns `MS_STOP_LOSS` when `getMsStopLossEndsForMode` is on and `-(session.sPnl || 0) >= session.msCapital * stopLossPct / 100 - 1e-9`. A new getter `getMsStopLossEndsForMode` joins the others. The panel Lost count (App.js:7607) includes `MS_STOP_LOSS`.

**Value sourcing**:
| Action | Value | Source |
|---|---|---|
| Daily goal | Dollar goal for `%` | typed value times `dayStartBalForMode`, the balance at local midnight (AC-2) |
| Answer line | W, g, Capital final | `msTable` and `msPlanSummary` from the panel inputs |
| Answer line | Capital basis | `msCapital` input, or `balForMode` when empty or auto copy on |
| Answer line | Minimum capital | `msPlanSummary(...).minCapital` |
| Answer line | profitSoFar, counted sessions | `msTargetProgress` over today's ended Masaniello sessions of the mode |
| Answer line | Projected account gain | `msSessionsToTarget`, divided by `balForMode` |
| Dashboard x | Active session | `getActive(ss, mode)` with `msN` set |
| Dashboard y | Remaining sessions | `msSessionsToTarget` with remaining target |
| Today's sessions | Live state | `todaySS.sessions`, so no re read after a session ends |
| Cycle end alert | Won or lost text | `endReason` `MS_TARGET` / `MS_LOSS_LIMIT` / `MS_MANUAL` |
| Target reached alert | Reached flip | derived reached state before and after the session ended (ref of the previous value; not fired on first load) |
| Stop loss alert | Dollar line, loss | capital (`session.msCapital`) times current `msStopLossPct{Mode}` / 100; loss is `-session.sPnl` |
| Stop Loss ends cycle | Whether it applies | `msStopLossEnds{Mode}` via `getMsStopLossEndsForMode` |
| Stop Loss ends cycle | Dollar line, loss | same as the alert row, checked in `checkMasanielloSessionEnd` |
| Sound, desktop | Gates | `settings.soundAlertOn`, `settings.desktopAlertOn`, `settings.alertVolume` |

**Key invariants**:
- Progress is always derived. No counter is stored.
- The goal in dollars is worked out each day from the saved value and unit. It is never stored.
- Reached is latched by counting order (AC-7).
- A session counts once it has ended, with its full `sPnl`.
- Masaniello ignores `settings.sessionsPerDay` everywhere it is shown.
- The Stop Loss line ends a cycle only when `msStopLossEnds{Mode}` is on; default off keeps 0004 behavior.
- Alerts fire only for sessions that ended or changed after the app loaded, never for history.

**Security model**: no change. Settings and sessions are already owned per user under existing Row Level Security (database rules limiting each row to its owner).

**Configuration required**: none.

**Critical test scenarios**:
- Math, fixed capital: `msSessionsToTarget` for target $200, capital $50, N 10, K 6, payout 92 gives `ceil(200 / (50 * g))` (g from `W(10,6) ≈ 0.4292`, so g ≈ 1.330). Verifies **AC-3**, **AC-4**.
- Math, compounding: with balance $50, the first cycle makes `50 * g`, the second uses the grown balance, so S is lower than the fixed result for a large target. Verifies **AC-4**.
- Messages: empty target, capital below minimum, 101 sessions needed, target already reached each show their exact message and no number. Verifies **AC-6**.
- Percent: 10% with a day start balance of $500 gives a $50 goal today and shows "= $50.00 today". Verifies **AC-1**, **AC-2**.
- Counting: three ended sessions with profits 30, 40, 50 and target 100: counts 3 and reached; a later session of +20 is not counted; sessions of the other mode are ignored. Verifies **AC-7**.
- Edit: raising the goal keeps today's sessions and only grows the total; lowering it under the profit made shows reached; clearing saves no target. Verifies **AC-10**.
- Counter label: x includes the active session; a losing session raises y; reached shows "Target reached"; no target shows "Session n"; a Fixed Risk mode keeps "n/Sessions per day". Verifies **AC-8**.
- Reload: today's counted sessions match before and after a reload. Verifies **AC-9**.
- Auto copy: toggle on makes `getMsCapitalForMode` return the balance and disables the Capital field. Verifies **AC-11**.
- Lock: two `MS_LOSS_LIMIT` sessions today do not lock the mode; two `AM_LOSS_TARGET` sessions still do. Verifies **AC-12**.
- Alerts: cycle end plays one chime when its toggle is on and none when off; target reached fires once on the flip and not on first load; coinciding end and target play one chime; Stop Loss fires once when the loss crosses the line. Verifies **AC-13**, **AC-14**.
- Stop Loss ends cycle: capital $100, Stop Loss 30%, toggle on, one loss of $35 ends the session `MS_STOP_LOSS`; toggle off leaves it active. A win that reaches K ends `MS_TARGET` even if the loss line was crossed earlier in the same snapshot. A draw never ends it. The ended cycle counts as Lost, counts toward the target, is ignored by the daily lock, and plays one chime with "stopped by Stop Loss". Verifies **AC-16**, **AC-17**.

## Build plan

Tracer Bullet: first one real target saved and shown end to end, then the counter, then the extras.

1. Pure engine and tests: `msSessionsToTarget`, `msTargetProgress`, the `getMs*ForMode` getters, and the `getMsCapitalForMode` auto copy check, covering the math, message, and counting scenarios above. Satisfies **AC-3**, **AC-4**, **AC-6**, **AC-7**.
2. Thin thread: add the `settings.extra` keys for both modes to the settings whitelist (near App.js:270 and 298) and `settingsDraft` defaults (near 7511); add the Profit target field with unit switch, validation in `msFieldErrors`, and the save in `Cfg` (an errored target keeps its last saved value through the `msCleaned` pattern), and the answer line in `MasanielloSettings` using today's sessions only. Save, reload, see the same line. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**, **AC-10**.
3. Counter: count today's sessions for the answer line (counted sessions and profit); replace the Session x/y text for Masaniello at the two Dashboard spots (near App.js:9041 and 9138). Satisfies **AC-7**, **AC-8**, **AC-9**.
4. Auto copy balance: the toggle, the disabled Capital field with its hint, and the getter change. Satisfies **AC-11**.
5. Alerts: the three toggles, and an extension of the session ended effect (near App.js:8924): seed its previous state on the first load, give Masaniello sessions their own branch (cycle end text, target reached flip, Stop Loss check with `stopLossAlertedRef`, active sessions only). The decisions live in the exported `msAlertEvents` so they can be unit tested; the effect only plays what it returns. Satisfies **AC-13**, **AC-14**, **AC-15**.
6. Remove the Masaniello daily lock: drop `MS_LOSS_LIMIT` from `amPlLossTargetSessionCount` (App.js:1069), fix the two lock messages (near 3711 and 4741), update the Lock test in `src/Masaniello.test.js`, and note the change on 0004 AC-11. Satisfies **AC-12**.
7. Stop Loss ends cycle: add `msStopLossEnds{Mode}` to the whitelist and draft defaults, the toggle and the "Cycle ends at a loss of $X" hint in the panel, `getMsStopLossEndsForMode`, the `MS_STOP_LOSS` branch in `checkMasanielloSessionEnd` (pass `settings` and `mode` from the dispatcher), the Lost count, both end text spots, and the lock exclusion. Check the recount path near App.js:9055 uses the same dispatcher. Satisfies **AC-16**, **AC-17**.

## Consequences

**Positive**:
- One field answers "how many sessions to $200?" with no extra screen.
- Counter stays right after corrections, deletes, and reloads.
- No migration and no new dependency.

**Negative / tradeoffs**:
- With no daily lock, a trader can run several full capital cycles in a row after losses. The Stop Loss alert and the Capital input are the only guards left (the sticky AM or PL lock still applies).
- The sessions estimate assumes every cycle wins at the planned payout, so it is a best case. The note says so.
- One extra read when a target started before today.
- The Stop Loss alert guard is in memory, so a reload mid cycle can repeat it once.
- With the toggle on, a Stop Loss end can leave a cycle short of its plan, so the sessions estimate (best case) is further from reality. Off by default, so existing users see no change.
- The Stop Loss line is not snapshotted, so editing Stop Loss % during a cycle moves its line.
- Spec 0004 says Stop Loss % never ends a cycle; this spec changes that only when the toggle is on.
- A session already running when the target is set counts with its full profit.
- A correction that lowers today's profit can un reach the target and fire the alert again on the next flip.
- While a cycle is active, y can move a little after each trade, because the balance already holds the cycle's partial result.

**Neutral**:
- Feature 6 (the recommender) can reuse `msSessionsToTarget` to show sessions for a suggested K of N.
- Spec 0004 AC-11 changes by this spec (AC-12 here).

## Follow-up

- [x] Spec 0004: mark the last sentence of AC-11 as replaced by this spec (done with build step 6).
- [x] Spec 0004: note that "Stop Loss % never ends a cycle" (AC-3 label test, line 68 and 82) now holds only while the AC-16 toggle is off (done with build step 7).
- [ ] Not built, deferred from the tool: low trade alert and auto log (auto log was unclear). Scope again if still wanted.
- [ ] Decide later whether the Stop Loss alert guard should be saved in the session so a reload cannot repeat it.
