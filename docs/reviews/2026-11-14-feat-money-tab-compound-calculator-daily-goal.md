# Review, feat/money-tab-compound-calculator (daily goal), 2026-11-14

**Reviewed by**: Claude Opus 5.5 (author on a different session/model)
**Scope**: 4 files, uncommitted (working tree vs d0c3faf)
**Verdict**: Approve with nits

## Summary
Turns the Masaniello profit target into a daily goal: only `msTargetValue`/`msTargetUnit` are stored, a `%` goal is recomputed from the mode balance at local midnight (`dayStartBalForMode`), and the history read, cache, merge and "counting since" machinery are deleted. The change is a large net simplification, all callers of the changed signatures were updated, no references to removed names remain, `eslint-config-react-app` is clean on `src/App.js` and `src/Masaniello.test.js` passes 53/53. Remaining issues are edge cases (sessions that cross midnight, a `%` goal on a zero or negative day start balance, PENDING trades resolved after midnight), an untested `dayStartBalForMode`, and spec AC-1 still demanding the removed balance validation.

## Minor

### 🟡 A Masaniello cycle that crosses midnight counts toward no day, `src/App.js:1761`
**Problem**: Today's sessions come from `getToday(ss)` (`src/App.js:1049`), which is loaded by `date = tod()` (`src/App.js:9187`) and `date` is the session's start day. A cycle started at 23:50 and ended at 00:10 is in yesterday's row, so it is active (not counted) yesterday and absent today. Its pre-midnight trades are already in `dayStartBal`, its post-midnight trades raise today's balance but not today's progress. The old `loadMsTargetHistory` (end_time >= setAt) did count it, so this is a small regression.
**Why it matters**: Rare for most users, but the counter and the "Target reached" alert silently ignore a real cycle's profit.
**Suggested fix**: Accept and state it in the spec Revision section as a known limit (simplest), or count sessions by `endTime >= msDayStart()` from the stored rows.

### 🟡 A `%` goal on a zero or negative day start balance gives a misleading panel, `src/App.js:7995` and `src/App.js:8029`
**Problem**: `msFieldErrors` no longer rejects a `%` target when the balance is 0 or the result rounds under $0.01. `msTargetToDollars(tv,'%',dayStartBal)` then gives 0 or a negative number: the answer line says "Set a profit target to see how many sessions it takes." although one is set, and the "= $X today" line uses `f$` (which takes `Math.abs`), so a negative day start balance shows a positive dollar goal.
**Why it matters**: Confusing copy on an account that is blown or not funded yet; the Dashboard silently falls back to "Session n".
**Suggested fix**: When `unit==='%'` and `targetDollars<=0`, show a short hint ("No goal today: balance at the start of the day is $0 or less") instead of the "= $X" line and the "Set a profit target" answer.

### 🟡 A `%` goal moves during the day when a PENDING trade from before midnight resolves, `src/App.js:1698`
**Problem**: `calcBal` skips PENDING trades, and `dayStartBalForMode` filters on `t.timestamp` (when the trade was logged). A trade logged at 23:59 and resolved after midnight changes `dayStartBal`, so the `%` goal and the alert latch key `String(prog.target)` (`src/App.js:1788`) change mid-day. The latch is reseeded silently, so a target reached flip that lands in the same snapshot can be swallowed. Editing an earlier day's trade in the journal has the same effect.
**Why it matters**: Low frequency, but the documented rule "a % is of the balance at the start of the day" stops being true and one alert can be lost.
**Suggested fix**: Accept and document, or include PENDING trades logged before midnight as resolved-at-0 (they had no P&L at midnight, so treat their later P&L as today's). At least note it next to `dayStartBalForMode`.

### 🟡 `dayStartBalForMode` is untested, `src/App.js:1698`
**Problem**: The new money-path helper (mode filter, `timestamp < midnight` boundary, Real-only withdrawals, missing timestamp excluded because `undefined < t0` is false) is not exported and no test exercises it; the `%` tests pass `dayStartBal` in directly, and the Cfg panel tests use `trades={[]}`.
**Why it matters**: The midnight boundary and withdrawals handling are the core of the new `%` behavior; a regression there would not be caught.
**Suggested fix**: Export it (or test through Cfg with `trades`/`wds` either side of a mocked midnight) and assert: a Demo trade before midnight counts, one after does not, a PENDING one does not, a Real withdrawal before midnight is subtracted and does not affect Demo.

### 🟡 Spec AC-1 still requires the removed balance validation, `docs/specs/0006-masaniello-profit-target-session-counter.md:35`
**Problem**: AC-1 says `%` "is invalid when the mode balance is 0 or less or when the result rounds to under $0.01" and mentions `msTargetSetAt`. The Revision's blanket clause covers the removed names but not this rule, and the code (`msFieldErrors`, `src/App.js:7941`) dropped it. AC-6 and AC-8 also still describe the history loading/failed text, Data model rows 126-127, the function table at 144, the wiring at 156/160/176-183/209/229 still describe `setAt` and the history read (covered by the blanket clause, but noisy).
**Why it matters**: `/check verify` against AC-1 will report a failure the author intended.
**Suggested fix**: Rewrite AC-1's `%` sentence to the new rule (0.1 to 1000 only; no goal for a day whose start balance gives under $0.01), and optionally strike the obsolete rows.

### 🟡 No test for the new-day latch behavior, `src/Masaniello.test.js:251`
**Problem**: The alert suite never runs a "yesterday reached, new day sessions empty, then reached again" sequence (same `$` key), nor a `%` key change from a new `dayBal`. The logic is right by reading (same key, `was=true` then `false`, then flips), but it is the main new-day risk the change introduces.
**Suggested fix**: One test: reached with `[won]`, then `sessions: []`, then a new win ending, expect exactly one "Profit target reached".

## Nits
- ⚪ `src/App.js:1747`, `msTargetProgress` still takes a `setAt` parameter no caller passes; drop it and the `setAt == null ||` filter.
- ⚪ `src/App.js:1819`, `msCounterLabel(..., dayStartBal = balance)` default hides a missing argument; every real caller passes it, so the default only serves tests.
- ⚪ `src/App.js:1786`, the comment "also covers editing back to an old goal" is now true only because the latch stores the last key; with a `%` goal the key also changes at midnight, worth saying.
- ⚪ `src/Masaniello.test.js:391`, `not.toHaveProperty('msTargetDollarsDemo')` passes trivially because the fixture never had the key; seed stale `msTargetDollarsDemo`/`msTargetSetAtDemo` in `open()` to actually test old saved settings (they survive `msCleaned` via `{...v}` and are only pruned by `toSettingsRow`'s whitelist, which is fine but untested).

## Strengths
- Large net deletion (about 170 lines in App.js, a Supabase read, a cache and a whole loading/error UI state) with every signature change (`msFieldErrors`, `msModeProgress`, `msCounterLabel`, `msAlertEvents`, `MasanielloSettings`, `Cfg`) updated at all call sites; lint clean, tests green.
- Old saved keys need no migration: `toSettingsRow` whitelists `extra`, so `msTargetDollars*`/`msTargetSetAt*` are dropped on the next save and nothing reads them meanwhile.
- `dayStartBalForMode` reuses `calcBal`, so PENDING exclusion and Real-only withdrawals match `balForMode`.

## Test coverage
`src/Masaniello.test.js` (53 tests, passing) was updated for every changed signature and adds `msTargetDollarsToday` cases and a "percent follows the day start balance" counter test. Deleting `src/MasanielloHistory.test.js` loses nothing, it only covered the removed `loadMsTargetHistory`. Untested new logic: `dayStartBalForMode` (midnight boundary, withdrawals, PENDING), the new-day latch sequence, and old saved settings carrying stale keys.
