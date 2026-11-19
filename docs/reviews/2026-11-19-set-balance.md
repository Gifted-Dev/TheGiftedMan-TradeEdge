# Review, feat/user-profile-page (Set balance, spec 0009), 2026-11-19

**Reviewed by**: claude-opus-5-5 (author on a different model)
**Scope**: 6 files, uncommitted
**Verdict**: Approve with nits

## Summary
Adds per mode balance adjustments: a new `balance_adjustments` table with RLS, `adjs` state threaded through every balance reader, a Set balance section and history on the Capital tab, trading balance for milestones and Dashboard growth, calendar day data, and reset cleanup. Caller coverage is complete: every `balForMode`, `dayStartBalForMode`, `buildDayStats`, and `avgDailyGainPct` call in `src/App.js` passes `adjs`, and mode filtering lives inside the shared helpers, so no caller can mix Demo and Real. Remaining issues are edge cases (an Infinity preview for huge inputs), a few accessibility and test gaps, and small polish items. Both test files pass (65 tests).

## Minor
### 🟡 Huge but finite input shows "$Infinity" and enables Save, `src/App.js:6316-6327` (Money, adj validation)
**Problem**: `Number.isFinite(n)` is checked before the cents rounding. For inputs in about 1.8e306 to 1.8e308 (for example `1e307`), `n*100` overflows, so `adjNew` and `adjAmount` become `Infinity`. The preview shows "new $Infinity, change +$Infinity" and Save is enabled. Insert then sends `null` (JSON of Infinity), which fails NOT NULL and rolls back.
**Why it matters**: AC-5 says the form never shows NaN or Infinity. The test covers `1e400` but not this range.
**Suggested fix**: Check `Number.isFinite(adjNew)` after rounding, or better, set a sane upper bound (for example 1e12) with a plain message.

### 🟡 Validation messages not tied to the input, `src/App.js:6643-6648`
**Problem**: The error lines ("Enter a number", "Note is too long") are plain divs. The inputs have no `aria-invalid` or `aria-describedby` pointing at them, and nothing announces them, so a screen reader user hears a disabled Save with no reason.
**Why it matters**: This is a new form, and accessibility basics are in scope for the review.
**Suggested fix**: Give each message an id, set `aria-describedby` and `aria-invalid` on the related input when it is in error, and optionally make the preview or error region `aria-live="polite"`.

### 🟡 AC-10 "full balance" paths and non Dashboard screens untested, `src/BalanceAdjust.test.js`
**Problem**: The tests prove that the Dashboard balance includes adjustments and that milestones and growth ignore a top up. Nothing asserts that the sizer stake, the phase 1 lock, or the advised withdrawal dollar amount use the full balance. Nothing asserts that Journal, Quick Log, or the Settings calculator show the adjusted balance. Also missing: the spec's Dashboard milestone card case (no "Milestone reached" with a +$500 top up on Real) and the -$50 case at UI level (the pure calc test covers it).
**Why it matters**: The spec names a missed caller as the main risk. Today all callers are correct, but there is no regression test, so one dropped `adjs` argument would pass CI.
**Suggested fix**: Add one Capital test with a +$500 Real adjustment that checks the sizer "Balance" metric shows the full figure and that no milestone advice appears. Add one Journal or Quick Log render that checks the adjusted balance.

### 🟡 Reset clears local state even if the table delete fails, `src/App.js:9610-9611`
**Problem**: `setAdjs` filters first, and the `delete()` error is ignored. If the delete fails (network, or migration not applied), the list looks empty until the next reload, when the rows come back.
**Why it matters**: This matches the existing trades and sessions reset pattern, so it is not a regression. It is still a silent divergence on a destructive action.
**Suggested fix**: Optional. Check `error` and surface it, or accept this as consistent with the rest of `resetAccount`.

## Nits
- ⚪ `src/App.js:6317`, `Number()` accepts `0x1F`, `0b101`, and `0o7` as valid balances. This matches the spec's wording but is surprising; a `/^\d*\.?\d*$/` precheck would reject them.
- ⚪ `src/App.js:6731` (milestones note), `netAdj!==0` is a float compare. Rows like +0.1, +0.2, -0.3 sum to 5.5e-17 and show the note. Compare `Math.round(netAdj*100)!==0`. The note also says "ignore top ups" when the net is minus, where nothing is ignored. The spec allows it, but the text can mislead.
- ⚪ `src/App.js:7420-7431`, a month whose only rows are adjustments now shows "+$0.00" in green on the month strip instead of "—", because `dates.length` counts adjustment only days. Withdrawal only days already behaved this way, but filtering on `total>0` would be cleaner.
- ⚪ `src/App.js:6332`, `balanceBefore: bal` stores the raw float (can carry sub cent trade P&L). Rounding it to cents would match `balanceAfter`.
- ⚪ Process: the work sits on `feat/user-profile-page`, a branch whose PR (#7) is already merged. Move it to its own branch before opening the PR.

## Strengths
- Mode isolation is structural: `modeAdjs` runs inside `balForMode`, `dayStartBalForMode`, and `buildDayStats`, and every caller passes `adjs` (verified by grep, all of about 30 sites, including the App level `bal`, `msCounter`, the Masaniello alert `dayBal`, and the tier effect, whose deps now include `adjs`).
- Money math is careful: the amount comes from integer cents (`Math.round(new*100)-Math.round(bal*100)`), the "already your balance" check rounds both sides, and `pctPnl` stays trading only, with the adjustment applied at the end of its day.
- Optimistic add and delete use functional updates for rollback, so they do not clobber concurrent changes. The delete rollback guards against double restore and keeps the newest first order.
- The migration is idempotent, enables RLS with `using` and `with check`, cascades on `auth.users`, and has a mode check constraint and a `user_id` index, matching the `supabase/AGENTS.md` conventions.
- Calendar summary correctly drops adjustment only days from trading day counts and best and worst day, and `detectStreakDates` already ignores them.

## Test coverage
`src/BalanceAdjust.test.js` covers the pure calc for `calcBal`, `balForMode`, `tradingBalForMode`, `buildDayStats` (running balance, adjustment only day), and `dayStartBalForMode` (today excluded). UI tests cover validation (AC-5), preview and save payload (AC-2, AC-6), save failure (AC-12), history and delete (AC-7, AC-8), delete failure, mode swap (AC-9), the session warning (AC-11), Dashboard balance and growth (AC-10), the calendar line (AC-4), reset (AC-13), and the milestones note. `CompoundCalculator.test.js` is updated for the new jump chip. Gaps: the full balance paths of AC-10 (sizer, phase 1, advised amount), the Dashboard milestone card, adjusted balance on Journal, Quick Log, and Settings, the Infinity range, and AC-15 (360px), which is a manual or verify check. All 65 tests pass locally.
