# Review, feat/money-tab-compound-calculator, 2026-11-13

**Reviewed by**: claude-opus-5-5 (author on a different model)
**Scope**: 6 files, branch vs main (merge base 70531c8, committed plus uncommitted plus untracked)
**Verdict**: Changes requested

## Summary
Replaces the Growth projector with a compound calculator (exported pure engine plus `CompoundCalculator` and `CompoundChart` in `src/App.js`), renames the Money tab to Capital, and restructures the page into sections under a sticky jump bar. The engine matches the spec's formulas exactly (Profit base resets per cycle, withdrawals only on multiples of the cycle, full precision, end never negative), parsing is strict and safe, and storage is defensive per field. The headline issues are a mobile usability bug on the currency field and a set of spec "Critical test scenarios" that have no tests. All 27 new tests pass locally.

## Major

### 🟠 Currency symbol field opens a numeric keypad on phones, `src/App.js:6322`
**Problem**: The shared `input()` helper sets `inputMode="decimal"` on every text field, including `currency`. On iOS the decimal keypad has only digits and a point, so there is no way to type `€`, `£` or `R$`; Android varies by keyboard.
**Why it matters**: AC-6 makes the currency symbol user editable; on the main target device (phone) it effectively is not. AC-6 asks for `inputMode="decimal"` only on number inputs.
**Suggested fix**: Pass the input mode per field: none (default text) for `currency`, `numeric` for `days`, `dpw`, `dpm`, `decimal` for `capital`, `gain`, `wdPct`.

### 🟠 Several spec "Critical test scenarios" have no test, `src/CompoundCalculator.test.js`
**Problem**: Branching logic the spec names as critical is untested:
- Late loading data (AC-8): render with no trades, then add trades, and assert the gain default updates and the example note goes away. This is the exact risk the "derive on every render" design exists for.
- Exponent display (AC-15): `ccFmt` switch at 1e15 for headline, multiple, and return on capital (100% for 365 days). Only the engine's raw value is checked.
- Chart branches (AC-10): flat line (`hi===lo`, e.g. Daily, Balance, 100%) and N = 1 (single dot), and the label skip logic.
- Blocked storage (AC-9): `localStorage.setItem` throwing; only junk content is tested, not a throwing accessor.
- `avgDailyGainPct` edges (AC-8): day with opening balance 0 dropped, pending trades and withdrawal only days excluded, average 0 or below / above 100 notes in the UI, `g<=0` early return.
- Jump chips by keyboard (Tab then Enter) and the scroll/active-chip effect (AC-17, AC-18).
**Why it matters**: TESTS = configured; these are branches in money display and default derivation that a refactor could silently break.
**Suggested fix**: Hand to `/test` with the list above; most are short pure or render assertions.

## Minor

### 🟡 Capital label falls back to "$" whenever any field is invalid, `src/App.js:6364`
**Problem**: `Starting capital (${ok?cur:'$'})` uses the overall `ok`, so with currency `€` and, say, an invalid period, the label (and the field's accessible name) flips to `$`.
**Why it matters**: Misleading unit exactly while the user is fixing input; accessible name changes under the user.
**Suggested fix**: Use the parsed currency when the currency field itself is valid (`values.currency ?? '$'`), independent of other fields.

### 🟡 Field errors and the "Fix the marked field" line are not announced, `src/App.js:6325`, `src/App.js:6358`
**Problem**: Error text is wired via `aria-describedby` and `aria-invalid`, but nothing is live; a screen reader user typing gets no feedback that results were replaced.
**Why it matters**: AC-18 asks for screen reader support; the main state change of the card is silent.
**Suggested fix**: Give the replacement line `role="status"` (or `aria-live="polite"`); keep per field errors as is.

### 🟡 Error text wraps and shifts layout in the 2 column grid, `src/index.css:1326`, `src/App.js:6325`
**Problem**: Error slots reserve `minHeight:16` (one line), but messages such as "Enter an amount above 0, up to 1,000,000,000." are about 290 px at 12 px, wider than a column between 481 and 900 px, so they wrap to two lines and push the row down.
**Why it matters**: AC-18: errors "never shift the layout".
**Suggested fix**: Shorten the messages (e.g. "Above 0, max 1,000,000,000") or reserve two lines.

### 🟡 Jump bar active state only reacts to scroll and assumes the first `<main>`, `src/App.js:6461`
**Problem**: The effect queries `document.querySelector('main')`, uses a magic `+90` line, and recomputes only on `scroll`. When the calculator toggles between results and the error line (large height change) the active chip is not re-evaluated until the next scroll. The handler also reads four `getBoundingClientRect`s per scroll event unthrottled (cheap, but each `setActive` change re-renders all of `Money`, see next item).
**Why it matters**: Small correctness drift of the in-view marker (AC-17) and a fragile coupling to the app shell.
**Suggested fix**: Get the scroller via `ref.closest('main')` from the nav element, name the 90 offset (tie it to the bar height / `scrollMarginTop`), or replace the scroll math with an `IntersectionObserver` on the sections.

### 🟡 Full schedule and chart rebuilt on every render of `Money`, `src/App.js:6339`
**Problem**: `buildCompoundSchedule` runs and a table of up to 365 rows x 6 formatted cells (`toLocaleString`) re-renders on every keystroke and on every active-chip change (the chip state lives in `Money`, the calculator's parent, and `CompoundCalculator` is not memoized).
**Why it matters**: Noticeable jank on low end phones while typing and while scrolling across section boundaries.
**Suggested fix**: `useMemo` the rows on the validated values, and wrap `CompoundCalculator` in `memo` (its props are stable across chip changes) or move the active-chip state into the nav component.

## Nits
- ⚪ `src/App.js:6140`, `t.replace(/%$/,'')` runs after trim, so "5 %" is rejected; trim again after removing `%`.
- ⚪ `src/App.js:6306`, `put` builds from the closed over `saved`; safe today because React flushes discrete events, but a functional `setSaved(s=>...)` (with `ccSave` in an effect) removes the stale closure class of bug entirely.
- ⚪ `src/App.js:6376`, the "Using 100 as an example." / gain example notes still show while the field holds unsaved user text (draft) that is not the example; also check `k in draft`.
- ⚪ `src/index.css:1322`, `.cc-bar` uses `--surface-0` but the page behind it is `--bg`, so the bar shows as a slightly different band at rest in every theme; use `var(--bg)`.
- ⚪ `src/App.js:6270`, the chart's viewBox follows measured width, which contradicts AC-10's "fixed viewBox"; the choice is reasonable (stable text size), so update the spec wording.
- ⚪ `src/App.js` (Log withdrawal card), its labels still use `lbl` (`--text-muted`, no `htmlFor`) while the rest of the Capital tab moved to `--text-secondary`; inconsistent within the tidied page (AC-19).
- ⚪ `src/App.js:6527`, with Phase 1 active and a next milestone message, two accent boxes now stack at the top of Milestones; consider showing one.

## Strengths
- Engine is a faithful, minimal transcription of the sheet: `cycleProfit` reset on withdrawal days gives the exact "last cycle days" Profit base, `withdrawal <= start+profit` holds for both bases, and reference cases (40.57 / 140.57 / 181.14 / 7.43 / 115.42 / 51, 26.01, 13.27) are asserted.
- `parseCompoundField` is strict in the right ways: ASCII only `\d` (no Unicode digits), thousands commas only in valid groups, no sign/exponent/decimal comma, digit only integers, and a `Number.isFinite` guard against huge digit strings.
- `ccLoad` validates each field independently through the same parser, rejects non objects and arrays, and wraps all storage access in try/catch; `key={mode}` cleanly isolates Demo and Real state.
- Defaults are derived on every render (never copied into state), so late loading balance and trades flow in until overridden, as the spec requires.
- `Metric`'s new `labelColor` prop is optional with the old default, so no other caller changes; the `--text-muted` to `--text-secondary` swaps are confined to the Capital tab and improve contrast.
- AC-14 test spies on Supabase `upsert` to prove the calculator writes nothing.

## Test coverage
27 tests, all passing (`src/CompoundCalculator.test.js`, 12 s). Covered: engine reference cases and extremes, parse accept/reject lists, visible-field validation, geometric mean and null, and UI smoke for rename, defaults, live recompute, frequency dependent fields, error state, chart label and schedule, short period note, persistence, reset, junk and per field storage fallback, per mode isolation, no withdrawal writes, jump bar in Demo and Real, keyboard tab order on inputs. Untested: late loading defaults, exponent formatting, flat and single point chart, label collision, throwing storage, opening balance 0 and pending/withdrawal only exclusions, the average 0 or below / above 100 notes, chip keyboard activation, and the scroll driven active chip.
