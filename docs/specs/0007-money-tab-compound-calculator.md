# 0007. Money Tab Compound Calculator

**Date**: 2026-11-13
**Status**: Accepted

## Summary

This renames the Money tab to "Capital" (two places called "Money management" was confusing) and gives it a proper design pass: one clear scroll, calculator first, a small jump bar, consistent cards, and good phone behaviour. It replaces the Growth projector with the compound calculator from your sheet (`Compound_Calculator_v1.xlsx`). You get a headline projected balance, a settings block you edit right on the page, three summary tiles, a growth line chart, and a day by day schedule with planned withdrawals. Starting capital and gain per day begin as your live balance and your real average day for the active mode (Demo or Real), and your edits are remembered in the browser only, so nothing touches Settings or the database. The math is one small pure function (a function with no screen or storage inside it) that copies the sheet's formulas, so it is easy to test against the sheet.

## Context

The Money tab (`Money` in `src/App.js`) has a Growth projector that guesses future balance from a weekly win rate and your risk percent. It uses two sliders and a bar strip, and it cannot show planned withdrawals. Your sheet answers the question you actually ask ("what do I have on day N if I make X% a day and take some out?") and is already tuned: headline, tiles, chart, and a schedule.

Facts in the current code that shape the design:
- The Money tab already knows the active mode (`mode`), the live balance (`balForMode`), the trades, and the withdrawals (Real only).
- `buildDayStats` already turns trades into per day results with each day's percent gain measured against that day's own opening balance. A real average day can come from it without new math.
- `f$` always prints a `$` and drops the minus sign, so it cannot be used for a user chosen currency symbol.
- Spec 0005 made Settings a draft with one Save bar. The calculator must stay out of that: its inputs are scratch values for a projection, not account settings.
- The repo has no chart library and keeps almost everything in `src/App.js`.

The sheet's rules, read from its formulas: each day, profit is start times gain; a withdrawal happens on a schedule; end balance is start plus profit minus withdrawal; the next day starts at that end balance. Weekly and Monthly withdrawals fire on days that are multiples of days per week or days per month. A Profit base means the profit earned over the last cycle's days (the days since the previous withdrawal day); a Balance base means that day's start plus profit.

## Requirements

**User stories**:
- As a trader, I want to see my projected balance on any day from 1 to 365 so that I know what steady compounding would give me.
- As a trader, I want to plan withdrawals (how much, from profit or balance, how often) so that I see what I keep and what I take out.
- As a trader, I want the calculator to start from my real balance and my real average day so that I do not retype numbers I already have, and to override them freely without touching Settings.

**Acceptance criteria** (the contract, each criterion is IDed and independently checkable):
- **AC-1**: The Money tab opens with the calculator card first, above Position sizer (an intended order change). The old Growth projector (weeks slider, win rate slider, bar strip) is gone. Position sizer, Withdrawal milestones, Log withdrawal, and Withdrawal history work exactly as before. The Demo banner reads "Milestones below reflect your Demo balance. This is for practice only. Demo has no real withdrawals; switch to Real to log an actual withdrawal." (no mention of a projector).
- **AC-2**: The headline reads "Projected balance, day N" with the end balance of day N in the chosen currency. Under it: the multiple, "X.XXx the capital above, withdrawals included", where the multiple is (end balance + total withdrawn) divided by the calculator's starting capital (not the Settings starting balance). A third line reads "No withdrawals planned" when frequency is None or withdrawal % is 0, otherwise "Withdrawing P% of profit, monthly" (base and frequency in lower case, P without trailing zeros, for example 12.5 or 50).
- **AC-3**: The schedule follows the sheet. Day 1 starts at the starting capital. Profit = start × gain. End = start + profit − withdrawal. Each next day starts at the previous end. "Withdrawn so far" is the running total of withdrawals. Reference case: capital 100, gain 2%, 30 days, Monthly, 50%, Profit gives day 30 withdrawal 40.57 and end balance 140.57; with frequency None the day 30 end balance is 181.14.
- **AC-4**: Withdrawal rules. None: always 0. Daily: every day. Weekly: only on days that are multiples of days per week. Monthly: only on days that are multiples of days per month. The withdrawal is withdrawal % of the base. Base "Profit" is the sum of profit over the last cycle days up to and including that day (Daily: that day's profit). Base "Balance" is that day's start plus profit. Reference: capital 100, gain 2%, Weekly, 7 per week, 50%, Profit gives day 7 withdrawal 7.43. This is the one definition of the Profit base. If the period is shorter than the cycle (for example 20 days with 30 per month), no withdrawal happens and a line under the schedule says "No withdrawal day falls within the period." Profit earned after the last withdrawal day stays in the balance.
- **AC-5**: Three summary tiles: Total withdrawn (withdrawn so far on day N), Total profit (end balance + total withdrawn − starting capital), Return on capital (total profit ÷ starting capital, one decimal percent).
- **AC-6**: The settings block holds: currency symbol (1 to 3 characters), starting capital (above 0, at most 1,000,000,000), account gain per day % (above 0, at most 100), period in days (whole number 1 to 365), withdrawal frequency (None, Daily, Weekly, Monthly), and, only when frequency is not None: withdrawal % (0 to 100) and withdraw from (Profit or Balance); days per week (whole 1 to 7) only for Weekly; days per month (whole 1 to 31) only for Monthly. Everything updates as you type, with no Apply or Save button. One short help line suggests 5 per week and 20 to 22 per month if you count only trading days. Number inputs are text fields with `inputMode="decimal"` (not `type="number"`, which hides junk). Parsing: trim, remove thousands commas, remove one trailing `%` on percent fields, then accept only digits with an optional single decimal point (no sign, no exponent, no decimal comma, so "2,5" is rejected). Days, days per week, and days per month accept digits only. Currency: trim, count by code points, reject empty or whitespace only; shown directly before the amount with no space.
- **AC-7**: Bad input (empty, not a number, zero where above zero is needed, out of range, a symbol that is empty or longer than 3) shows a short message beside that field and marks it. Headline, tiles, chart, and schedule are replaced by one line, "Fix the marked field to see the projection." Nothing ever shows NaN, Infinity, or a blank number. Other fields stay editable. Only visible fields are validated: with frequency None, withdrawal %, withdraw from, days per week, and days per month are hidden and ignored; with Weekly or Monthly, withdrawal % is always validated.
- **AC-8**: Defaults. Starting capital starts as the live balance of the active mode, shown to 2 decimals, as long as it is above 0. Gain per day starts as your real average day for the active mode: the geometric mean of the trading days' percent gains, `(product of (1 + p/100)) ^ (1/n) − 1`, as a percent rounded to 2 decimals, taken from `buildDayStats` over days with at least one finished trade and an opening balance above 0 (pending trades and withdrawal only days are not counted). The range check runs on the rounded value. With no such days, gain starts at 2% and a note says "No trade history yet, using 2% as an example." If the average is 0 or below, the gain field starts empty with "Your average day is not above 0%, enter a gain to project." If it is above 100, it starts empty with "Your average day is above 100%, enter a gain." If the live balance is 0 or below, capital starts at 100 with the note "Using 100 as an example." If the live balance is above 1,000,000,000, the capital field shows the range error (no silent clamp). While a field is not overridden, its text is derived from the live value on every render (never copied into state once), so late loading data never leaves a stale default or a flashing example note. Withdrawal frequency starts as None, withdrawal % 50, withdraw from Profit, period 30, days per week 7, days per month 30, currency "$".
- **AC-9**: Edits are saved in the browser (localStorage) per mode, so Demo and Real keep separate values. A saved value survives a reload and switching tabs or modes. A field becomes overridden on its first edit that parses valid; invalid typing keeps the text on screen but saves nothing, and clearing a field does not mean "follow live". Capital and gain stay as you set them until you tap "Use my live numbers", which clears both overrides and makes them follow your live balance and average day again; that link shows only while at least one is overridden. Only valid values are saved, and `capital` and `gain` are written only when overridden. No Settings value, Save bar, or Supabase row is read or written by this feature. Every storage read and write is in try/catch; if storage is blocked, holds junk, or holds JSON that is not an object, the calculator still works with the defaults.
- **AC-10**: A line chart (one inline SVG, full width; its viewBox width follows the measured width so one unit is one pixel and text stays 11 px at any screen width, and its height is fixed at 190) plots the end balance for day 1 to day N. The y axis runs from the lowest to the highest end balance (not from 0); the x axis labels day 1 and day N only; the last, first, highest and lowest points are labelled, in that order, skipping any label that would overlap one already placed. If lowest equals highest the line is drawn at mid height (no divide by zero). It has `role="img"` and a text label such as "Balance growth, day 1 to day 30, from $102.00 to $140.57" where "from" is the day 1 end balance. With N = 1 it shows one dot.
- **AC-11**: A plain note is always visible: "Projection only. Assumes the same gain every day and no losing days, which no live account achieves."
- **AC-12**: The schedule lists every day 1 to N with columns Day, Start, Profit, Withdrawal, End balance, Withdrawn so far. It sits in a scroll box with a header that stays visible, and rows whose withdrawal is above 0 are visibly marked (a scheduled day with a 0 base is not marked).
- **AC-13**: At 360 px width the page has no sideways scroll. The settings block stacks to one column and the schedule scrolls sideways inside its own box.
- **AC-14**: Planned withdrawals in the calculator are hypothetical only. They never create, change, or read a withdrawal record, and Log withdrawal and Withdrawal history ignore them.
- **AC-16**: Rename. The sidebar and phone nav entry reads "Capital" (was "Money mgmt") and the page title reads "Capital" (was "Money management"). The view id `money` and the Wallet icon stay. The Settings tab keeps its name "Money management", because it holds the style and rules. The About card title "Money Management" (`src/App.js:8456`) is reworded so it names the Capital tab for balance, projection and withdrawals and the Settings tab for the style and rules. Existing tests that open the Settings tab "Money management" still pass unchanged.
- **AC-17**: Layout. The page is one scroll in this order: Projection (calculator), Position sizer, Withdrawal milestones, Withdrawals (Log withdrawal and history, Real only). A sticky jump bar of small chips (Projection, Sizer, Milestones, Withdrawals; the last only in Real) scrolls to each section, marks the one in view, is keyboard reachable, and stays usable at 360 px (the chips scroll sideways inside the bar). Each section has the same card style, heading size, and spacing, taken from the app's existing design tokens and card style, with no new colours or fonts.
- **AC-18**: UX quality bar. The first screen shows the headline answer without scrolling past the settings. Inputs have visible labels, units (%, days, the currency symbol) and a 44 px touch target on phones. Numbers use the mono font and right align in the schedule. Errors, empty and example notes use the app's existing warning and info styles and never shift the layout when they appear. Withdrawal rows and the withdrawn tile use the success colour and money out uses the danger colour, consistently. Every control works with keyboard and has a visible focus ring, and the chart and tiles have text labels for screen readers. Light and dark themes both read clearly (contrast of normal text at least 4.5 to 1).
- **AC-19**: The existing sections are tidied, not rebuilt: Position sizer keeps its numbers and rules, Withdrawal milestones keep their math, and Log withdrawal and history keep their behaviour; only layout, spacing, labels and hierarchy improve (for example the style description line under the sizer is one short muted line, and the Phase 1 or milestone message sits at the top of Milestones).
- **AC-15**: Money display uses the chosen symbol, English style thousands separators, and 2 decimals. At or above 1e15 an amount switches to exponent form with 4 significant digits (for example `$3.742e+118`), and the multiple uses the same rule, so even 100% a day for 365 days fits at 360 px. Return on capital uses the same rule.

## Options considered

### Option 1: Rebuild the card in place in `src/App.js` with an exported pure engine

Replace the Growth projector inside `Money` with a `CompoundCalculator` component in `src/App.js`. The math lives in exported pure functions in the same file, the way the Masaniello engine does, so tests import them directly. State is local to the component and persisted to localStorage per mode.

**Pros**:
- Matches how every other feature in this repo is built; no new file pattern to learn.
- The pure engine is easy to test against the sheet.
- No database, no Settings coupling.

**Cons**:
- `src/App.js` grows by roughly 250 lines.

### Option 2: A new file `src/CompoundCalculator.js`

Same design, but the component and engine live in their own file and `Money` imports it.

**Pros**:
- Keeps `App.js` from growing; the unit is easy to find.

**Cons**:
- It needs shared styles and helpers (`card`, `inp`, `lbl`, `btn`) that only exist inside `App.js`, so those get exported or duplicated (the average day could instead be passed in as a prop).
- It starts a second code layout in a repo that has only one, for a change that is mostly one card.

### Option 3: Keep the projector and add the calculator below it

**Pros**:
- Nothing existing is removed.

**Cons**:
- Two different projections of the same thing on one page, with different assumptions, confuse the reader. Your request says the calculator replaces the projector.

## Decision

**Chosen option**: Option 1: Rebuild the card in place in `src/App.js` with an exported pure engine

Replace the Growth projector with a `CompoundCalculator` component and exported pure functions (`buildCompoundSchedule`, `validateCompoundInputs`, `avgDailyGainPct`) in `src/App.js`, saving edits to localStorage per mode and using no database.

**Design source**: the existing app look (design tokens, card style, spacing in `src/index.css` and `src/App.js`), polished for hierarchy, spacing, and states. No external design file.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

The repo is one big `App.js` with exported pure engines and tests that import them (Masaniello, specs 0004 and 0006). Following that pattern keeps the change small and the math testable. Option 2 sounds tidy but forces exports or copies of the shared styles that only exist in `App.js`, which costs more than the lines it saves. Option 3 contradicts the request.

Local only storage fits the forces in Context: these inputs are scratch values for a projection, spec 0005 made Settings a draft with one Save bar, and you asked to override without touching Settings. A database row would add a table or a column, a migration, and a failure mode (a failed save) for numbers nobody needs on another device. If cross device sync is ever wanted, the saved shape below can move to Supabase later.

Decisions I made for you (RECOMMEND items), with the runner up:
- Compute at full precision, round only when displaying, like the sheet. Runner up: round each row to cents; rejected because it drifts from the sheet.
- Own money formatter that uses the chosen symbol, 2 decimals, thousands separators. Runner up: reuse `f$`; rejected because it forces `$` and drops the sign.
- Cap starting capital at 1,000,000,000. At 100% a day for 365 days the numbers stay finite, but the cap blocks typos that make unreadable results.
- Persist only valid values, so a reload never lands on a half typed field. Runner up: persist raw text; rejected because it reopens the page on an error.
- Validate only visible fields (see AC-7), matching the sheet.
- Default gain uses the geometric mean, not the arithmetic mean: an arithmetic mean overstates compounding (+10% then −10% averages 0 but really loses 1%), and the calculator assumes the same gain every day. Runner up: arithmetic mean; rejected as flattering.
- Keep "follow live" for capital and gain until overridden (your pick), derived on every render. Runner up: seed once and save; it avoids the follow state but stops live balance changes flowing in.
- Large numbers switch to exponent form at 1e15 so the layout holds at phone width.
- Name "Capital" (your pick) for the tab; runner ups Growth, Wallet, Funds. One scroll with a jump bar (your pick) over inner tabs, which would hide content and copy the Settings pattern. Visual direction comes from the app's own tokens (your pick).
- Chart is one inline SVG polyline with no library. Runner up: a chart library; rejected as a new dependency for one line.
- The chart's viewBox width follows its measured width (one unit is one pixel). Runner up: a fixed 360 wide viewBox scaled to fit; rejected after the build because it stretched the text to about 2.7 times its size on desktop and let neighbouring labels collide.

## Feature design

**Data model sketch**: no database change. One localStorage key per mode, `gm_compound_calc_DEMO` and `gm_compound_calc_REAL`, holding JSON:

| Field | Type | Meaning |
|---|---|---|
| `currency` | string, 1 to 3 chars | Symbol shown before amounts |
| `capital` | number, optional | Present only when overridden; absent means follow the live balance |
| `gain` | number, optional | Present only when overridden; absent means follow the real average day |
| `days` | integer 1 to 365 | Period |
| `wdPct` | number 0 to 100 | Withdrawal % |
| `wdFrom` | `Profit` or `Balance` | Withdrawal base |
| `wdFreq` | `None`, `Daily`, `Weekly`, `Monthly` | Frequency |
| `dpw` | integer 1 to 7 | Days per week |
| `dpm` | integer 1 to 31 | Days per month |

Each field is read on its own: a missing or invalid field falls back to its default and does not spoil the others.

**State transitions**: none. Component state is the current text of each input plus the saved values; there is no lifecycle.

**API surface**: no network or database calls. Interface is the pure engine:

| Function | Inputs | Output |
|---|---|---|
| `buildCompoundSchedule(inputs)` | `capital`, `gainPct`, `days`, `wdPct`, `wdFrom`, `wdFreq`, `dpw`, `dpm` (all already valid, gain and withdrawal in percent) | `rows`: array of `{day, start, profit, withdrawal, end, withdrawn}`, one per day |
| `validateCompoundInputs(raw)` | the current text of every input | `{ok, errors, values}`: `errors` maps field name to message, `values` holds parsed numbers when `ok` |
| `avgDailyGainPct(trades, wds, mode, startBal)` | as `buildDayStats` | geometric mean of the days' `pctPnl` over days with `total > 0` and `startBalance > 0`, as a percent rounded to 2 decimals, or `null` when there are no such days |

**Value sourcing** (every value each action produces, computes, or displays names where it comes from):
| Action | Value produced / displayed | Source |
|---|---|---|
| Open the tab | Default starting capital | `balForMode(settings, trades, wds, mode)` for the active `mode`; example 100 when it is 0 or below |
| Open the tab | Default gain per day % | `avgDailyGainPct(trades, wds, mode, getStartingBalanceForMode(settings, mode))`; example 2 when `null`; empty field with a message when 0 or below or above 100 |
| Open the tab | Saved overrides and other settings | localStorage key for the active `mode`, per field, else the defaults in AC-8 |
| Render | Currency symbol | `currency` field (default `$`) |
| Render | Schedule rows | `buildCompoundSchedule` from the validated inputs |
| Render | Headline balance, day N | `rows[N-1].end` |
| Render | Multiple of starting capital | (`rows[N-1].end` + `rows[N-1].withdrawn`) ÷ capital, 2 decimals |
| Render | Withdrawal line | `wdFreq`, `wdFrom`, `wdPct` |
| Render | Total withdrawn | `rows[N-1].withdrawn` |
| Render | Total profit | `rows[N-1].end` + `rows[N-1].withdrawn` − capital |
| Render | Return on capital | Total profit ÷ capital |
| Render | Chart points and labels | `rows[i].end` for day 1 to N; min and max of that list |
| Render | Withdrawal cycle length | `dpw` when Weekly, `dpm` when Monthly (the sheet's "Withdrawal cycle") |
| Edit | Which fields show or are validated | `wdFreq`: days per week only for Weekly, days per month only for Monthly. With None, withdrawal %, withdraw from, and both day fields stay visible but have no effect and are not validated |
| Use my live numbers | Cleared overrides | removes `capital` and `gain` from the saved JSON |

**Key invariants**:
- The engine runs only on validated input and always returns `days` finite rows; no `NaN` or `Infinity` reaches the screen.
- End balance is never negative: withdrawal % is at most 100 and the base is at most start plus profit.
- Calculator state never reaches Settings, `saveSettings`, `saveWds`, trades, or Supabase.
- Day N headline equals the last schedule row.

**Security model**: runs fully in the browser for the signed in user on their own data. The only storage is localStorage with non sensitive projection inputs. No new rows, no RLS change, no compliance scope.

**Configuration required**: none.

**Critical test scenarios** (each maps to an acceptance criterion in ## Requirements):
- Reference case 100, 2%, 30 days, Monthly, 50%, Profit: day 30 withdrawal 40.57, end 140.57; frequency None: end 181.14, verifies **AC-3**
- Weekly, 7 per week, Profit: day 7 withdrawal 7.43, day 14 end 115.42, verifies **AC-3**, **AC-4**
- Daily from Balance, 50%: days 1 to 3 end at 51, 26.01, 13.27, verifies **AC-4**
- Withdrawal 0% and 100%, days 1 and 365, gain 100%: finite numbers, end never below 0, verifies **AC-4**, **AC-7**
- Each bad input (empty, `abc`, 0 capital, gain 101, days 0 or 366, days 1.5, symbol with 4 characters) shows its message and hides the results, verifies **AC-7**
- Average day from trades: two trading days of +2% and +4% give 3.00; days of +10% and −10% give −0.50 (empty gain field with the message, not 0); no finished trades gives `null` and the 2% example note; a day with opening balance 0 is dropped; pending trades and withdrawal only days are not counted, verifies **AC-8**
- Text parsing: `12abc`, `2,5`, `1e3`, `-5`, `   `, `5%` on a percent field (accepted), `1,000` on capital (accepted), verifies **AC-6**, **AC-7**
- Late loading data: render with no trades, then add trades; the default updates and no example note stays, verifies **AC-8**
- Period 20 with Monthly 30: no withdrawal and the "No withdrawal day falls within the period." line; flat chart (Daily, Balance, 100%) draws without error; 100% for 365 days shows exponent form, verifies **AC-4**, **AC-10**, **AC-15**
- Override persists after a reload in the same mode and not in the other mode; Reset clears both; blocked storage still renders, verifies **AC-9**
- Headline, tiles, and chart label agree with the last row, verifies **AC-2**, **AC-5**, **AC-10**
- Money tab still shows Position sizer, milestones, Log withdrawal, and history, and logging a withdrawal is not affected by calculator values, verifies **AC-1**, **AC-14**, **AC-19**
- The nav shows "Capital" and the page title "Capital"; the Settings tab is still named "Money management" and its existing tests pass, verifies **AC-16**
- Jump chips scroll to each section; the Withdrawals chip is absent in Demo; chips reachable by Tab and Enter, verifies **AC-17**, **AC-18**

## Build plan

Order follows Tracer Bullet: the first task is a thin but complete path (engine to screen with real defaults), then each task thickens one layer.

1. Thin thread: add `buildCompoundSchedule`, `validateCompoundInputs`, `avgDailyGainPct` as exported pure functions, replace the projector card with `CompoundCalculator` showing the headline and schedule from live defaults (capital, average day or 2%, period 30, frequency None), satisfies **AC-1**, **AC-2**, **AC-3**, **AC-8**
2. Settings block: all inputs and selects with live update, validation messages, the one line fallback for bad input, frequency dependent fields, satisfies **AC-4**, **AC-6**, **AC-7**
3. Saving and live numbers: per mode localStorage (valid values only, each field read on its own), the "Use my live numbers" link, the example notes, satisfies **AC-8**, **AC-9**
4. Tiles, chart, and projection note: three tiles, inline SVG chart with labels and accessible label, the note, the money and exponent formatter, satisfies **AC-5**, **AC-10**, **AC-11**, **AC-15**
5. Schedule polish and layout: scroll box with sticky header, marked withdrawal rows, phone width pass at 360 px, satisfies **AC-12**, **AC-13**
6. Cleanup: remove the old projector state and variables (`wks`, `wrOverride`, `wr`, `proj`, `maxP`), update the Demo banner text, fix the comment above `Money` (`src/App.js:6114`) that mentions the growth projector, confirm Position sizer, milestones, and withdrawals still work, satisfies **AC-1**, **AC-14**
7. Rename: nav label `Money mgmt` to `Capital` (`src/App.js:9305`), page title (`src/App.js:6156`), and reword the About card (`src/App.js:8456`); leave the Settings tab name, satisfies **AC-16**
8. Layout and polish: section order, sticky jump bar with in view marker, shared card and heading style, tidy Position sizer, Milestones and Withdrawals, touch targets, focus rings, error and note styles, light and dark check, 360 px pass, satisfies **AC-17**, **AC-18**, **AC-19**, **AC-13**
9. Tests: engine reference cases and edge cases, validation, average day, persistence and reset, Money tab smoke test, satisfies the Critical test scenarios

## Consequences

**Positive**:
- One projection that matches the sheet you already trust, with planned withdrawals the old projector could not show.
- No database change, no migration, and no change to the Settings save flow.
- The pure engine is small and easy to check against the sheet.

**Negative / tradeoffs**:
- The average day default can still be flattering (it comes from days you traded, and the projection assumes no losing days). The geometric mean and the always visible note are the guards.
- Edits live only in this browser: a different device or a cleared browser goes back to live defaults.
- `src/App.js` grows by about 250 lines.
- The old win rate projector is removed; anyone who liked testing different win rates loses that view.
- The renamed tab means one more word to learn; the old name "Money mgmt" disappears from the nav, so any habit or note that uses it needs updating.
- A sticky jump bar takes a little vertical space on phones; it stays one line high.

**Neutral**:
- No migration needed: the old projector kept no saved state.
- Calculator inputs for Demo and Real are independent, like the rest of the Money tab.

## Follow-up

- [ ] Sync across devices (moving the saved shape into Supabase) is out of scope; revisit only if you use more than one device for planning.
- [ ] Feature 6 (Masaniello settings recommender) and this calculator are separate; nothing here reads Masaniello plan values. Revisit if you want a Masaniello aware projection.
