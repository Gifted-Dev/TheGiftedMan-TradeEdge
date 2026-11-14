# Review, feat/money-tab-compound-calculator (daily goal, pass 2), 2026-11-14

**Reviewed by**: Claude Opus 5.5 (author on a different session/model)
**Scope**: 4 files, uncommitted (working tree vs d0c3faf)
**Verdict**: Approve with nits

## Summary
This is the second pass on the daily goal change. Four of the six minors from the first review are fixed. `dayStartBalForMode` is exported and tested (midnight edge, PENDING, Real-only withdrawals, missing timestamp). There is a new day latch test. Spec AC-1, AC-2, AC-7, AC-9, AC-10 and AC-15 are rewritten. The Revision section now lists the two accepted limits (a cycle that crosses midnight, a trade settled after midnight). The `noDayBal` guard is correct: it never blocks Save and never leaves the draft dirty. It lives only in render and does not touch `f` or `msFieldErrors`, and `msCleaned` still stores the typed `%`. Three issues remain. The muted "= $0.00 today" line still renders next to the new alert. A sub-cent `%` goal on a positive balance is still unhandled. AC-6, AC-8 and the wiring and build plan sections still describe the removed history read. `src/Masaniello.test.js` passes 58/58, lint is clean, and no removed export is referenced anywhere in `src/`.

## Minor

### 🟡 The "= $0.00 today" line still shows beside the no balance alert, `src/App.js:8030`
**Problem**: The `= ${f$(targetDollars)} today…` line is gated only on `unit==='%'&&hasTarget&&!errs.msTargetValue`, not on `!noDayBal`. When `noDayBal` is true, `targetDollars` is `null` and `f$(null)` gives `$0.00`. The panel then says "= $0.00 today, from your balance at the start of the day" right above "A % goal needs a balance above 0 at the start of the day". The new test (`src/Masaniello.test.js:463`) only asserts that the alert shows and that no answer line shows, so it misses this.
**Why it matters**: The copy contradicts itself, and AC-1 says there is "no goal that day".
**Suggested fix**: Add `&&!noDayBal` to the line-8030 condition, and in the test assert that `/= \$0\.00 today/` is absent.

### 🟡 A `%` goal that rounds under $0.01 on a positive day start balance is unhandled, `src/App.js:7995-7998`
**Problem**: `noDayBal` covers only `dayStartBal<=0`. Take 0.1% of a $4 day start balance: `msTargetToDollars` rounds it to 0, so `targetDollars` is 0. The panel shows "= $0.00 today" and the answer line falls through to `msTargetAnswer`'s "Set a profit target to see how many sessions it takes.", even though a target is set. On the Dashboard, `msTargetDollarsToday` returns null, so the card silently shows "Session n". AC-1 does not cover this case.
**Why it matters**: This is a rare edge, but it hits the same confusing copy that `noDayBal` was added to stop.
**Suggested fix**: Base the guard on the result instead: `noDayBal = unit==='%' && hasTarget && !errs.msTargetValue && !(msTargetToDollars(tv,'%',dayStartBal) >= 0.01)`. Widen the message to say the goal is under $0.01 today, and add "or the result is under $0.01" to AC-1.

### 🟡 The spec still describes the history read in AC-6, AC-8 and the design sections, `docs/specs/0006-masaniello-profit-target-session-counter.md:41`
**Problem**: The Revision's blanket "this section wins" clause covers these lines, but the ACs themselves still conflict with the code:
- AC-6 (line 41) still requires "Reading your earlier sessions…" and "Could not read your earlier sessions…".
- AC-8 (line 43) still lists "history still loading or failed" as a fallback.
- The data model rows `msTargetDollars{Mode}` and `msTargetSetAt{Mode}` (127-128) remain.
- In the function table, `msTargetProgress(..., setAt)` (145) and `loadMsTargetHistory` (146) remain.
- The wiring rows at 157, 161 and 165 and the state rules at 177, 179, 182 and 184 still describe `setAt` and the history read.
- Build plan step 2 (207) still says "eight `settings.extra` keys" and describes the `msTargetDollars`/`msTargetSetAt` save logic. Steps 3 and 5 (208, 210) still describe `loadMsTargetHistory` and "flip after history resolves".

**Why it matters**: `/check verify` drives the app against the ACs. AC-6 and AC-8 as written will report failures that the author intended.
**Suggested fix**: Delete the history sentence from AC-6 and the "history still loading or failed" fallback from AC-8. Strike or replace rows 127-128 and 146, and drop `setAt` from row 145. Change "eight" to "six" at 207 and rewrite its target clause. Mark 157, 161, 165, 177-184 and 208-210 as superseded, or trim them.

## Nits
- ⚪ `src/App.js:1747`: `msTargetProgress` still takes a `setAt` parameter that no caller passes, and its filter still checks it. This was carried over from the first review.
- ⚪ `src/App.js:1819`: the default `dayStartBal = balance` in `msCounterLabel` still hides a missing argument. Every real caller passes it.
- ⚪ `src/Masaniello.test.js:427-428`: `not.toHaveProperty('msTargetDollarsDemo'/'msTargetSetAtDemo')` passes trivially because `open()` never seeds the stale keys. Seed them in that test to prove they are dropped. They survive `msCleaned`'s `{...v}`, and only `toSettingsRow`'s whitelist prunes them.
- ⚪ `src/Masaniello.test.js:254`: `midnight` is computed once when the describe block loads, but `dayStartBalForMode` reads the clock at call time. A run that straddles local midnight would fail. Fake the timers or compute `midnight` inside each test.
- ⚪ `src/Masaniello.test.js:466`: `getByRole('alert')` is safe today, because no other `role="alert"` renders inside `Cfg` (the other two, at `src/App.js:3928` and `5924`, are Dashboard/QuickLog). It breaks as soon as `Cfg` gains a second alert. Use `getByText(...)` or match the alert by name instead.

## Strengths
- `noDayBal` is display-only. Save stays enabled, the draft stays clean, and the stored `%` starts working the first day the balance is positive. That is the right call for a daily goal.
- The `dayStartBalForMode` tests pin the real edges: midnight is exclusive, PENDING trades are skipped, withdrawals apply to Real only, and a missing timestamp is excluded. The new day latch test exercises the actual reached, empty, reached sequence.
- The spec Revision states its accepted limits plainly instead of hiding them.

## Test coverage
`src/Masaniello.test.js` passes 58/58. All four test gaps from the first review are now covered: the `dayStartBalForMode` midnight boundary, PENDING trades, withdrawals, and the new day latch. Still untested:
- The "= $0.00 today" line next to the alert (minor 1).
- A sub-cent `%` goal (minor 2).
- That Save still succeeds and stores the `%` while `noDayBal` is true.
- A `%` key change at midnight in `msAlertEvents` (`dayBal` changing between calls). It is correct by reading: the new key is seeded silently.
