# Review, feat/money-tab-compound-calculator, 2026-11-13 (second pass)

**Reviewed by**: claude-opus-5-5 (author on a different model)
**Scope**: 9 files, branch vs main (merge base 70531c8, committed plus uncommitted plus untracked)
**Verdict**: Changes requested

## Summary
The branch adds the Capital tab compound calculator (spec 0007) and, in the newest uncommitted change, makes a Masaniello target edit keep `msTargetSetAt` (spec 0006 AC-10 revised). The calculator side is in good shape: every Major and most Minors from the first review are fixed and covered by new tests (98 tests pass across both suites). The AC-10 change itself is a one line edit in `msCleaned`, but two other places silently relied on `msTargetSetAt` moving on every edit: the Settings answer line preview and the target reached alert key. Both now misbehave on an edited target.

## Major

### 🟠 Settings answer line ignores kept progress while a target edit is unsaved, `src/App.js:8012`
**Problem**: `progress=unchanged&&saved?saved:{count:0,profit:0}` (and `histPending` at 8014) still encode the old rule "a changed target restarts the count". Since the save now keeps `msTargetSetAt`, the sessions already done keep counting after save, but the draft preview counts from zero. Raising $100 to $200 with $90 already made: the panel says "About N sessions to reach $200.00" for the full $200; after Save the Dashboard counter shows far fewer. Lowering to $80 with $90 made: the panel shows a session count; after Save the target is instantly "Target reached". Also `saved` is computed against the old dollar goal, so its `profit` stops at the old reach point and cannot simply be reused for a higher goal.
**Why it matters**: The answer line (AC-3, AC-6) is the user's only preview of what a target edit means, and it is wrong exactly in the case AC-10 just changed. "Never a wrong number" is the stated contract of `msTargetAnswer`.
**Suggested fix**: When a saved `msTargetSetAt` exists and the draft has a valid target, recompute progress with the draft dollars: `msTargetProgress(msMergeSessions(hist.sessions, live), targetDollars, savedSetAt)`, and apply the pending/error gate whenever a saved start time exists, not only when `unchanged`. Update the comment at `src/App.js:8004` ("restarts the count on save"). Add a panel test for raise and lower with sessions already done.

### 🟠 Lowering a target below profit made fires "Profit target reached" on Save, `src/App.js:1795`
**Problem**: `msAlertEvents` keys the latched reached state by `${mode}:${setAt}`. Before this change every edit produced a new `setAt`, so a new key was seeded silently. Now the key survives an edit. The alert effect (`src/App.js:9591`, deps include `settings`) reruns on save; if the new lower goal is at or below profit already made, `was===false` and `prog.reached===true`, so the chime plays (and a desktop notification if the tab is hidden) with no session ending.
**Why it matters**: Contradicts AC-15 ("fires only on a flip caused by a session that ended after the app loaded") and is a spurious audible alert on a settings save. The reverse also leaks: raising a reached target flips the latch back to false under the same key, which is fine, but it shows the key no longer identifies one goal.
**Suggested fix**: Include the dollar goal in the alert key only (e.g. `${m}:${setAt}:${target}`), keeping the history cache key as is so no re-read happens. A changed goal is then seeded silently and the next real flip still fires. Add an `msAlertEvents` test: lower the target under profit made, no event; then a session end that reaches a raised target, one event.

## Minor

### 🟡 Spec 0006 still says a changed target restarts the count, `docs/specs/0006-masaniello-profit-target-session-counter.md:129`
**Problem**: The state transitions line reads "any → `active` (restarted) when a changed target is saved", contradicting the revised AC-10, the data table and the invariants in the same spec.
**Why it matters**: The next `/develop` or `/check verify` reading the spec gets two opposite rules.
**Suggested fix**: Reword to "edits keep the start time; only clearing then saving a new target restarts".

### 🟡 No discoverable way to start a fresh goal, `src/App.js:8211`
**Problem**: After reaching a target, entering a new goal now adds onto the old cycle's profit. The only restart is clear, Save, enter, Save. Nothing in the panel says what the count is measured from.
**Why it matters**: A user who hit $100 and types $100 again "for next week" sees "Target reached" immediately and has no hint why.
**Suggested fix**: Show "Counting since <date>" under the target field (from `msTargetSetAt`), or a small "Restart count" action. Product call, spec owner decides.

### 🟡 AC-10 edge cases untested, `src/Masaniello.test.js:171`, `src/Masaniello.test.js:454`
**Problem**: The new tests cover raising a `$` target (counter label) and a `$` edit keeping the start time. Not covered: lowering below profit made, a `%` unit or value edit keeping the start time while dollars recompute, editing Demo while Real has its own start time (independence), clear then re-enter in one save, and the errored target branch keeping the start time.
**Why it matters**: TESTS = configured; this is branching save logic for persisted settings.
**Suggested fix**: Add the cases above to the "Masaniello settings panel" describe, using `lastSaved(saveSettings)`.

### 🟡 Scroll driven active chip still untested, `src/App.js:6403`
**Problem**: The keyboard chip test landed, but the scroll and ResizeObserver path that picks the active chip (and the bottom of page rule) has no test.
**Why it matters**: Carryover from the first review; low risk, but it is the only untested branch left in the Capital page.
**Suggested fix**: One test that stubs `getBoundingClientRect` on the sections and fires `scroll` on `main`.

## Strengths
- The AC-10 save rule is a minimal, correct one liner, per mode through `tk`, and the error and clear branches keep and null the start time as the spec says; Demo and Real cannot bleed into each other.
- The new counter test models the reported bug directly (raise target, sessions done stay 4, total only grows).
- Every first review Major is fixed: per field keypads, plus tests for late loading defaults, exponent display, flat and single point chart, throwing storage, `avgDailyGainPct` edges, and keyboard chips. Memoised schedule and `memo` on the calculator fix the re-render cost.

## Test coverage
98 tests pass (`src/Masaniello.test.js`, `src/CompoundCalculator.test.js`). The compound calculator is now well covered against spec 0007. For the uncommitted AC-10 change, covered: raised `$` target keeps sessions done in the counter label, and a `$` edit keeps `msTargetSetAt`. Untested: the panel answer line on an edited target (wrong today, see Major), the alert on lowering (wrong today, see Major), `%` edits, Demo/Real independence on save, and the errored target branch.
