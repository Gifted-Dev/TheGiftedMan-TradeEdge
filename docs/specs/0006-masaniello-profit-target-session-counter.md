# 0006. Masaniello Profit Target and Session Counter

**Date**: 2026-11-12
**Status**: In Progress

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
- **AC-1**: With Masaniello selected for a mode, the Masaniello settings panel shows one "Profit target" input with a `$` / `%` unit switch (default `$`). Empty means no target (switching the unit on an empty field changes nothing, so type the value first, then pick `%`). `$` accepts 0.01 to 1,000,000. `%` accepts 0.1 to 1000, and is invalid when the mode balance is 0 or less or when the result rounds to under $0.01. An invalid value shows an inline error and is not saved; the last saved target and `msTargetSetAt` stay.
- **AC-2**: On Save, the target is stored in dollars. Unit `$`: the typed value. Unit `%`: typed value times the mode balance at the moment of saving, rounded to cents. The dollars are recomputed only when the typed value or the unit differs from the saved one. Any other save (for example a change on another tab) keeps the stored `msTargetDollars`. With `%` the panel shows the stored dollars next to the field ("= $120.00"). The dollar goal stays fixed after saving, even when the balance moves. A saved `%` target whose value and unit are unchanged stays valid when the balance later falls to 0 or the percent rounds under $0.01; the balance checks of AC-1 apply only to a new or changed value.
- **AC-3**: Under the target field an answer line updates live as capital, N, K, payout, the target, or the balance change: "About S sessions to reach $T" (singular "About 1 session"), followed by "Projected account gain +X%" (profit after S plan cycles divided by the mode balance). Capital final is already in the plan summary above it.
- **AC-4**: Sessions required S assumes every cycle reaches K wins at the planned payout (the note "Assumes every cycle reaches K wins" is shown). S is the smallest count whose cumulative win profit reaches the remaining target. When the capital follows the balance (Capital empty, or auto copy balance on), each cycle starts from the grown balance (compounding). When Capital is a fixed value, every cycle makes the same profit. Formulas are in *Sessions math* below.
- **AC-5**: S is not limited by the Sessions per day setting.
- **AC-6**: The answer line never shows a blank or a wrong number. Empty target: "Set a profit target to see how many sessions it takes." Effective capital below Minimum capital: "Raise Capital to at least $X first." (when the capital follows the balance: "Balance is below the $X minimum for K of N.") More than 100 sessions needed: "More than 100 sessions at this plan. Lower the target or change N and K." Target already reached: "Target reached: +$P in S sessions." Invalid inputs show only the field errors. For a saved target, while the history read is pending or failed the line shows "Reading your earlier sessions…" or "Could not read your earlier sessions, so the session count is hidden." instead of a count.
- **AC-7**: Sessions that count toward the target are the sessions of that mode with `msN` set (Masaniello), not active, and whose end time is at or after `msTargetSetAt`, whatever the end reason, in end order. Counting stops at the first session after which cumulative profit (sum of each session's `sPnl`) reaches the target, so "reached" never un reaches.
- **AC-8**: The Dashboard mode card, for a mode on Masaniello with a target, shows "Session x/y". x = counted sessions plus 1 when a Masaniello session is active. y = counted sessions plus the sessions still required for the remaining target (a loss raises y). When the target is reached it shows "Target reached" and the counted number of sessions. With no target it shows all of today's sessions for the mode with no cap ("Session 2"). Fallbacks when y has no value: history still loading or failed, show "Session x" only; capital below minimum, show "Session x" plus the hint "capital below min"; more than 100 needed, show "Session x/100+". A mode on any other style keeps the existing "Session n/Sessions per day". The Dashboard reads saved settings (`getMs*ForMode`) and `balForMode(mode)`, never the Settings draft.
- **AC-9**: Progress survives a page reload and trade corrections, because it is derived from stored sessions and not from a stored counter.
- **AC-10**: Saving a changed dollar target (including the first one) sets `msTargetSetAt` to now, which restarts the count. Saving the same dollar value again keeps it. Clearing the target clears `msTargetSetAt`. Demo and Real are independent.
- **AC-11**: A per mode toggle "Auto copy balance" (default off). On: each new cycle takes the current mode balance as its capital, ignoring `msCapital`, and the Capital field is disabled with the hint "Following your balance". Off: today's rule (fixed Capital stays, empty Capital follows the balance).
- **AC-12**: Masaniello no longer counts toward the 2 per day loss target lock: an `MS_LOSS_LIMIT` or `MS_STOP_LOSS` session is not counted by `amPlLossTargetSessionCount`, and the lock messages stop naming Masaniello. A lock caused by earlier AM or PL sessions in the same mode still applies. This replaces the last sentence of 0004 AC-11.
- **AC-13**: Three per mode alert toggles in the panel: "Cycle end alert" (default on), "Target reached alert" (default on), "Stop loss alert" (default off, only matters while "Stop Loss ends cycle" is off, see AC-16). Each plays the existing alert chime when sound is on, and a desktop notification when the tab is hidden and desktop alerts are on. The global sound and desktop settings still gate everything.
- **AC-14**: Cycle end alert: when a Masaniello session ends, the chime and notification fire only if the toggle is on, and the notification says what happened ("Masaniello cycle won", "Masaniello cycle lost", "Masaniello cycle ended"), not "Session locked". A Masaniello session never falls through to the generic chime: with the toggle off it is silent. No alert fires for sessions that were already ended when the app loaded (the existing effect is fixed to seed its previous state on the first load, which also stops today's ended sessions re chiming on every reload). Target reached alert: fires once, when an ended session makes the target reached. If both fire at the same moment, one chime plays and the notification says "Profit target reached". Stop loss alert: fires once per cycle, while the cycle is active, when its loss (`-sPnl`) reaches the Stop Loss dollar line (capital times Stop Loss %). Stop Loss is checked only while the session is still active in the current snapshot, so the trade that ends the cycle gives one chime, not two. Stop Loss ends a cycle only when AC-16 is on. While AC-16 is on, the Stop loss alert does not fire (the cycle end alert covers it).
- **AC-15**: Target reached alert timing: the "previous reached" value is seeded only after the history read has resolved for that mode, so late arriving history never fires it. It fires only on a flip caused by a session that ended after the app loaded.
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
| `msTargetDollars{Mode}` | number, nullable | the stored dollar goal (AC-2) |
| `msTargetSetAt{Mode}` | epoch ms, nullable | set when the dollar goal changes (AC-10) |
| `msAutoCopyBalance{Mode}` | boolean | default false |
| `msAlertSessionEnd{Mode}` | boolean | default true |
| `msAlertTargetReached{Mode}` | boolean | default true |
| `msAlertStopLoss{Mode}` | boolean | default false |
| `msStopLossEnds{Mode}` | boolean | default false (AC-16) |

`sessions`: no change. `endReason` already holds free text, so `MS_STOP_LOSS` needs no migration. The Stop Loss line is read from current settings, not snapshotted, the same as the alert; changing Stop Loss % mid cycle moves the line. The Stop Loss alert guard is kept in memory in its own ref, `stopLossAlertedRef` (not the cycle end `alertedRef`, which would hide the end alert), so a reload in the middle of a cycle can repeat that one alert once.

Derived, never stored: counted sessions, profit so far, sessions required, y in "Session x/y", reached state.

**State transitions** (target): `none` → `active` when a target is saved · `active` → `reached` when cumulative profit reaches the target (derived, latched by AC-7) · any → `active` (restarted) when a changed target is saved · any → `none` when the field is cleared.

**API surface**: no server endpoint. One client read plus pure functions in `src/App.js`:
| Item | Inputs | Output |
|---|---|---|
| `msSessionsToTarget(targetDollars, profitSoFar, capital, followBalance, balance, N, K, payoutPct)` | numbers, boolean | `{sessions, projectedProfit, projectedGainPct}` or `{reason: 'below_min' or 'too_many' or 'reached'}` |
| `msTargetProgress(endedMsSessions, targetDollars, setAt)` | sessions, number, epoch | `{count, profit, reached}` (sorted by `endTime`, stops at the crossing session) |
| `loadMsTargetHistory(userId, mode, setAt)` | ids | one query: `sessions` where `account_mode` = mode, `is_active` false, `end_time` at or after `setAt` (ISO), no date filter. Rows go through `fromSessionRow`, then keep those with `msN` set (client side). Merged with live `todaySS` by session id, live wins. After midnight the live list starts empty, so the read runs again when the date changes (request key `${mode}:${setAt}:${date}`); the stored entry is marked loading until it resolves, so a tab left open overnight never shows a count that misses sessions. Runs on app load for each mode that has a target, stored under `${mode}:${setAt}`; re run when a changed target is saved. While pending or on error the counter shows "Session x" (error logged). A different signed in user resets the cache and the alert state. |
| `getMsAutoCopyBalanceForMode`, `getMsTargetDollarsForMode`, `getMsTargetSetAtForMode`, `getMsAlert*ForMode` | settings, mode | values with the defaults above |

`getMsCapitalForMode` gains a check: when `msAutoCopyBalance` is on, return the balance.

`checkMasanielloSessionEnd(session)` gains `settings` and `mode` (the dispatcher near App.js:1566 already has both) and, after the two plan rules, returns `MS_STOP_LOSS` when `getMsStopLossEndsForMode` is on and `-(session.sPnl || 0) >= session.msCapital * stopLossPct / 100 - 1e-9`. A new getter `getMsStopLossEndsForMode` joins the others. The panel Lost count (App.js:7607) includes `MS_STOP_LOSS`.

**Value sourcing**:
| Action | Value | Source |
|---|---|---|
| Save target | Dollar goal for `%` | typed value times `balForMode` at save (AC-2) |
| Save target | `msTargetSetAt` | `Date.now()` when the dollar goal differs from the stored one |
| Answer line | W, g, Capital final | `msTable` and `msPlanSummary` from the panel inputs |
| Answer line | Capital basis | `msCapital` input, or `balForMode` when empty or auto copy on |
| Answer line | Minimum capital | `msPlanSummary(...).minCapital` |
| Answer line | profitSoFar, counted sessions | `msTargetProgress` over history plus today's ended Masaniello sessions of the mode |
| Answer line | Projected account gain | `msSessionsToTarget`, divided by `balForMode` |
| Dashboard x | Active session | `getActive(ss, mode)` with `msN` set |
| Dashboard y | Remaining sessions | `msSessionsToTarget` with remaining target |
| History read | Earlier sessions | `sessions` table, filtered as in the API table above |
| Today's sessions | Live state | `todaySS.sessions`, so no re read after a session ends |
| Cycle end alert | Won or lost text | `endReason` `MS_TARGET` / `MS_LOSS_LIMIT` / `MS_MANUAL` |
| Target reached alert | Reached flip | derived reached state before and after the session ended (ref of the previous value; not fired on first load) |
| Stop loss alert | Dollar line, loss | capital (`session.msCapital`) times current `msStopLossPct{Mode}` / 100; loss is `-session.sPnl` |
| Stop Loss ends cycle | Whether it applies | `msStopLossEnds{Mode}` via `getMsStopLossEndsForMode` |
| Stop Loss ends cycle | Dollar line, loss | same as the alert row, checked in `checkMasanielloSessionEnd` |
| Sound, desktop | Gates | `settings.soundAlertOn`, `settings.desktopAlertOn`, `settings.alertVolume` |

**Key invariants**:
- Progress is always derived. No counter is stored.
- The dollar goal never changes after saving, unless the user saves a new one.
- `msTargetSetAt` is set only when the stored dollar goal changes.
- Reached is latched by counting order (AC-7).
- A session ended before `msTargetSetAt` never counts. A session already running when the target is set counts once it ends, with its full `sPnl` (a small overcount that is accepted).
- Masaniello ignores `settings.sessionsPerDay` everywhere it is shown.
- The Stop Loss line ends a cycle only when `msStopLossEnds{Mode}` is on; default off keeps 0004 behavior.
- Alerts fire only for sessions that ended or changed after the app loaded, never for history.

**Security model**: no change. Settings and sessions are already owned per user under existing Row Level Security (database rules limiting each row to its owner). The history read filters on the signed in user id as every other read does.

**Configuration required**: none.

**Critical test scenarios**:
- Math, fixed capital: `msSessionsToTarget` for target $200, capital $50, N 10, K 6, payout 92 gives `ceil(200 / (50 * g))` (g from `W(10,6) ≈ 0.4292`, so g ≈ 1.330). Verifies **AC-3**, **AC-4**.
- Math, compounding: with balance $50, the first cycle makes `50 * g`, the second uses the grown balance, so S is lower than the fixed result for a large target. Verifies **AC-4**.
- Messages: empty target, capital below minimum, 101 sessions needed, target already reached each show their exact message and no number. Verifies **AC-6**.
- Percent: 10% on a $500 balance stores `msTargetDollars` 50 and shows "= $50.00". Verifies **AC-1**, **AC-2**.
- Counting: three ended sessions with profits 30, 40, 50 and target 100: counts 3 and reached; a later session of +20 is not counted; a session ending before `msTargetSetAt` is ignored. Verifies **AC-7**.
- Re save: saving the same dollar value keeps `msTargetSetAt`; saving a new one replaces it; clearing nulls it. Verifies **AC-10**.
- Counter label: x includes the active session; a losing session raises y; reached shows "Target reached"; no target shows "Session n"; a Fixed Risk mode keeps "n/Sessions per day". Verifies **AC-8**.
- Reload: counted sessions from earlier days come back from the read and match before the reload. Verifies **AC-9**.
- Auto copy: toggle on makes `getMsCapitalForMode` return the balance and disables the Capital field. Verifies **AC-11**.
- Lock: two `MS_LOSS_LIMIT` sessions today do not lock the mode; two `AM_LOSS_TARGET` sessions still do. Verifies **AC-12**.
- Alerts: cycle end plays one chime when its toggle is on and none when off; target reached fires once on the flip and not on first load; coinciding end and target play one chime; Stop Loss fires once when the loss crosses the line. Verifies **AC-13**, **AC-14**.
- Stop Loss ends cycle: capital $100, Stop Loss 30%, toggle on, one loss of $35 ends the session `MS_STOP_LOSS`; toggle off leaves it active. A win that reaches K ends `MS_TARGET` even if the loss line was crossed earlier in the same snapshot. A draw never ends it. The ended cycle counts as Lost, counts toward the target, is ignored by the daily lock, and plays one chime with "stopped by Stop Loss". Verifies **AC-16**, **AC-17**.

## Build plan

Tracer Bullet: first one real target saved and shown end to end, then the counter, then the extras.

1. Pure engine and tests: `msSessionsToTarget`, `msTargetProgress`, the `getMs*ForMode` getters, and the `getMsCapitalForMode` auto copy check, covering the math, message, and counting scenarios above. Satisfies **AC-3**, **AC-4**, **AC-6**, **AC-7**.
2. Thin thread: add the eight `settings.extra` keys for both modes (16 entries) to the settings whitelist (near App.js:270 and 298) and `settingsDraft` defaults (near 7511); add the Profit target field with unit switch, validation in `msFieldErrors`, the `%` to dollars conversion and `msTargetSetAt` logic in `Cfg`'s save (an errored target keeps its last saved values through the `msCleaned` pattern near App.js:7579, and the computed `msTargetDollars` and `msTargetSetAt` join the saved baseline so the draft is not left dirty), and the answer line in `MasanielloSettings` using today's sessions only. Save, reload, see the same line. Satisfies **AC-1**, **AC-2**, **AC-3**, **AC-5**, **AC-6**, **AC-10**.
3. History read and counter: add `loadMsTargetHistory` and merge with today's sessions for the answer line (counted sessions and profit); replace the Session x/y text for Masaniello at the two Dashboard spots (near App.js:9041 and 9138). Satisfies **AC-7**, **AC-8**, **AC-9**.
4. Auto copy balance: the toggle, the disabled Capital field with its hint, and the getter change. Satisfies **AC-11**.
5. Alerts: the three toggles, and an extension of the session ended effect (near App.js:8924): seed its previous state on the first load, give Masaniello sessions their own branch (cycle end text, target reached flip after history resolves, Stop Loss check with `stopLossAlertedRef`, active sessions only). The decisions live in the exported `msAlertEvents` so they can be unit tested; the effect only plays what it returns. Satisfies **AC-13**, **AC-14**, **AC-15**.
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
- Corrections to trades of earlier days do not update those days' stored session profit, so history can be stale. A correction that lowers today's profit can un reach the target and fire the alert again on the next flip.
- While a cycle is active, y can move a little after each trade, because the balance already holds the cycle's partial result.

**Neutral**:
- Feature 6 (the recommender) can reuse `msSessionsToTarget` to show sessions for a suggested K of N.
- Spec 0004 AC-11 changes by this spec (AC-12 here).

## Follow-up

- [x] Spec 0004: mark the last sentence of AC-11 as replaced by this spec (done with build step 6).
- [x] Spec 0004: note that "Stop Loss % never ends a cycle" (AC-3 label test, line 68 and 82) now holds only while the AC-16 toggle is off (done with build step 7).
- [ ] Not built, deferred from the tool: low trade alert and auto log (auto log was unclear). Scope again if still wanted.
- [ ] Decide later whether the Stop Loss alert guard should be saved in the session so a reload cannot repeat it.
