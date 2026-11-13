# Review, feat/money-tab-compound-calculator, 2026-11-13 (third pass)

**Reviewed by**: claude-opus-5-5 (author on a different model)
**Scope**: 9 files, branch vs main (merge base 70531c8, committed plus uncommitted plus untracked)
**Verdict**: Approve with nits

## Summary
This pass checks the fixes for the second review: the Settings answer line now counts from the kept `msTargetSetAt` with the draft dollars, the target reached alert key includes the dollar goal, spec 0006 drops the old "restart on edit" rule, the panel shows "Counting sessions since <date>", and new tests cover raise, lower, failed read, `%` edit, Demo/Real independence, clear, alert lowering and the scroll chip. Both prior Majors are fixed correctly and all 106 tests in the two suites pass. One narrow new edge remains: the alert latch keeps stale entries for goals that are no longer current, so editing back to an earlier goal can still chime on Save.

## Minor

### 🟡 Editing back to an earlier goal can fire "Profit target reached" on Save, `src/App.js:1796`
**Problem**: `st.prevReached` is keyed by `${m}:${setAt}:${dollars}` and only the current key is updated. A key for a goal that is no longer current keeps its last value. Sequence: goal $100 with $90 made (key `:100` = false), raise to $200 (key `:200` seeded false), a session ends at +$20 (profit $110, only `:200` updated, `:100` stays false), lower back to $100. On Save `was` is the stale `false`, `prog.reached` is true, so the chime and desktop notification fire with no session ending. Before this branch the key used a fresh `Date.now()` per edit, so an old key could never come back; this is new with AC-10.
**Why it matters**: Same AC-15 violation the second review flagged, now behind a narrower but plausible sequence (raise, trade, revert). Spec 0006 line 129 now promises "An edited goal is seeded silently".
**Suggested fix**: Latch per mode, not per key: store `{key, reached}` under `st.prevReached[m]`, and when the stored key differs from the current one, seed silently. That also caps the object at two entries (see nit on growth). Add an `msAlertEvents` test for the raise, session end, revert sequence.

### 🟡 Stale comment on the history cache, `src/App.js:9402`
**Problem**: "a changed target gets a new setAt, so it reloads" is no longer true; edits keep `setAt` and reuse the cached read.
**Why it matters**: Misleads the next reader into thinking a goal edit triggers a re-read (which is now intentionally not needed, the read is `end_time >= setAt` and independent of dollars).
**Suggested fix**: Reword to "keyed by start time; edits keep it, so the cached read stays valid; clearing and setting a new target reloads".

## Nits
- ⚪ `src/App.js:1798`, `prevReached` gains one key per distinct goal per app load; bounded and harmless, goes away with the per mode latch above.
- ⚪ `src/App.js:8058`, the "Counting sessions since" hint shows the date only; two targets set on the same day are indistinguishable. Fine for now.

## Strengths
- The panel preview now reuses the same pure pieces as the Dashboard (`msMergeSessions`, `msTargetProgress`) with the saved start time and draft dollars, so the preview and the post save counter agree; the pending/error gate applies whenever a start time exists, closing the second review's Major.
- The alert key change is minimal and keeps the history cache key (`${m}:${setAt}`) separate, so no extra Supabase read on edit; `histFor` and the panel both read the same cache key.
- Tests model the real bugs directly: raise subtracts profit made ("About 1 session to reach $110.00"), lower reads "Target reached", `%` edit recomputes dollars and keeps `msTargetSetAt`, Real untouched by a Demo edit, and the scroll chip test exercises both the "above the bar" and "bottom of page" rules.
- Spec 0006 is consistent again: AC-10, data table, state transitions, wiring table, invariants and test plan all say the same thing.

## Test coverage
106 tests pass (`src/Masaniello.test.js`, `src/CompoundCalculator.test.js`). Covered: every case listed as untested in the second review (lowering, `%` edit, Demo/Real independence, clear, failed read on an edited goal, alert lowering then a real flip on a raised goal, scroll driven chip). Not covered: the edit back to an earlier goal after a session end (wrong today, see Minor), and the errored target branch keeping `msTargetSetAt` on save (low risk, unchanged code).
