# 0009. Set balance (balance adjustments)

**Date**: 2026-11-18
**Status**: Accepted

## Summary

Today the only way to fix a wrong balance is to edit the starting balance, which skews percent P&L and the milestone baselines. This spec adds a Set balance action on the Capital tab, in both Demo and Real. You type the balance you really have, and the app saves the difference as a dated adjustment with an optional note. Past trades and stats stay as they were. Adjustments live in one new table, `balance_adjustments`, and every balance in the app adds them on top of the trading result.

## Context

The app computes a mode's balance as starting balance plus trade P&L minus withdrawals (`calcBal` and `balForMode` in `src/App.js`). Withdrawals exist only for Real. Money that enters or leaves for any other reason has no home: a top up, a trade taken but never journaled, a broker fee, a bonus, or a Demo account reset.

The only lever is the starting balance in Settings. Changing it rewrites history. Daily percent P&L is measured against a running balance carried from the starting balance (`buildDayStats`), and withdrawal milestones are multiples of it, so one edit changes every past day's percent and moves every milestone.

The app is Real and Demo as two independent tracks, and balance feeds many places: Dashboard, Journal, Quick Log, Capital, Analytics, Calendar, the Ask profile, Settings checks, and the Masaniello and stake math. Whatever is added has to reach all of them through the existing balance functions, not a parallel number.

## Requirements

**User stories**:
- As a trader, I want to type the balance I really have so that the app matches my broker without editing my starting balance.
- As a trader, I want each correction saved as a dated line with a note so that I can see why my balance changed.
- As a trader, I want my past trades, win rate, and daily percent P&L to stay untouched by a correction.
- As a trader, I want a wrong entry removed so that a typo does not stay in my history.

**Acceptance criteria** (the contract, each independently checkable):
- **AC-1**: The Capital tab has a "Balance" section in both Demo and Real, with its own chip in the jump bar between Sizer and Milestones. It holds a New balance ($) field, an optional Note field, and a Save button, above the adjustment history.
- **AC-2**: Saving a valid new balance records one adjustment for the active mode. Its amount is the new balance minus the current balance, rounded to cents (positive or negative). It is dated today in the user's local day. Right after saving, the current balance shown everywhere in the app equals the new balance exactly.
- **AC-3**: Saving an adjustment does not change the starting balance, any trade, the win rate, or any day's percent P&L figure for past days.
- **AC-4**: The running balance and the calendar day data (`endingBalance`, which feeds the calendar sparkline and drawdown) include an adjustment from its date forward and are unchanged before it. A day's percent P&L still measures trading only: it uses the day's opening balance (which includes earlier adjustments) and that day's trade P&L, never the adjustment itself. A day with an adjustment and no trades appears in the calendar day panel with one line, "Balance adjusted +$Z". The Analytics P&L trend stays trading only and does not change.
- **AC-5**: Bad input shows a plain message, disables Save, and never shows NaN or Infinity. The field is text with a decimal keypad, parsed with `Number()` and checked with `Number.isFinite`, then rounded to cents. The cases are: empty ("Enter your balance"), not a number ("Enter a number"), below 0 ("Balance cannot be below 0"), equal to the current balance to the cent, both sides rounded ("That is already your balance"), and a note over 200 characters after trimming ("Note is too long"). When both the value and the note are bad, both messages show. Zero is allowed as a new balance.
- **AC-6**: While you type a valid value, a preview line shows "Current $X, new $Y, change +$Z" (or `-$Z` for a decrease). Money uses `f$`, and the change uses a new signed helper (`f$` drops the sign today).
- **AC-7**: The history list shows the active mode's adjustments newest first. Each row shows the date, the note if any, the signed amount (green for plus, red for minus), and the balance before and after, labeled "at the time" (stored values, never recomputed after a delete). With none saved it shows "No adjustments yet".
- **AC-8**: Each history row has a Delete button that opens a confirm dialog stating the balance change with the signed helper ("Balance will change by -$Z" for a plus row, "+$Z" for a minus row). Confirming removes the row, and every balance reverts by exactly that amount. If the delete fails, the row stays and a message says "Could not delete. Try again."
- **AC-9**: Each mode sees only its own adjustments. Switching the Demo and Real toggle swaps the balance, the preview baseline, and the list. A Demo adjustment never changes the Real balance, and the other way round.
- **AC-10**: Trading balance is the mode balance minus `max(0, net adjustments)`. A net plus (top up, bonus) is removed from it. A net minus (a loss never journaled, a fee) is kept, because it is real trading money gone. Withdrawal milestones use trading balance on the Capital tab (reached ticks, progress bars, "Milestone reached" advice, next milestone line) and on the Dashboard milestone card. Dashboard growth percent also uses trading balance. The phase 1 lock (tied to the absolute broker minimum), the advised withdrawal dollar amount, the position sizer, the stake tiers, and all stake math use the full balance. When net adjustments are not zero, a short line under the milestones heading says milestones ignore top ups.
- **AC-11**: With a session active in the mode, saving is still allowed, and one warning line shows under the form: "A session is running. The next session will use the new balance." (A live cycle keeps the balance it started with, and tier changes wait until no session is active.)
- **AC-12**: If the save fails, nothing changes (no balance change, no list row), the typed values stay, and a message says "Could not save. Try again." The form clears only after a successful save.
- **AC-13**: Resetting a mode in Settings (trades only or with balances) deletes that mode's adjustments, and the reset confirm text says "and balance adjustments". This differs on purpose from withdrawals, which "trades only" keeps. Resetting Demo never touches Real adjustments.
- **AC-14**: Adjustments persist across reload and across devices for the signed in user, and no other user can read or change them.
- **AC-15**: At 360px wide the section has no horizontal scroll, and its inputs and buttons use the same touch size as the other Capital controls.

## Options considered

### Option 1: New `balance_adjustments` table with signed amounts

One row per adjustment: mode, signed amount, date, note, balance before and after. Balance adds the sum for the mode.

**Pros**:
- Clean per mode split with a real `mode` column. Real delete of a single row.
- Same shape and RLS as `withdrawals`, so the pattern is known. No change to how withdrawals behave.

**Cons**:
- One more table, one more migration, one more list in state, passed to every balance reader.

### Option 2: Reuse the `withdrawals` table with a signed amount and a mode column

Treat a deposit as a negative withdrawal.

**Pros**:
- No new table, no new state list.

**Cons**:
- Withdrawals are Real only everywhere: `calcBal`, `buildDayStats`, milestone advice, "total withdrawn", the Ask profile, and reset. Every reader needs a filter, and one missed filter shows a deposit as a withdrawal. The wrong default is a quiet bug.
- Saves use `upsert` of the whole array, which cannot delete a row.

### Option 3: Keep editing the starting balance (status quo)

**Pros**:
- Zero code.

**Cons**:
- Rewrites every past day's percent P&L and every milestone. This is the problem to solve.

## Decision

**Chosen option**: Option 1: New `balance_adjustments` table with signed amounts.

Adjustments are rows of their own, added into the balance by the existing balance functions, saved and deleted one row at a time.

**Implementation skills**: `supabase` (`supabase/agent-skills`, `.agents/skills/supabase/`) · `supabase-postgres-best-practices` (`supabase/agent-skills`, `.agents/skills/supabase-postgres-best-practices/`)

## Rationale

Withdrawals are Real only in every reader (see Context), so putting adjustments in that table makes each reader a place to forget a filter, and `upsert` of a whole array cannot delete one row. A separate table with a `mode` column costs one migration and keeps both features simple. The starting balance stays a true record of where the account began, which is what the percent P&L and the milestones assume.

Choosing "exclude from milestones" keeps withdrawal advice about trading results. A $500 top up must not cross the 2x line and advise a withdrawal you did not earn. Only a net plus is excluded: a net minus is often a real loss (an unjournaled trade, a fee), and removing it would advise a withdrawal the account cannot fund. Stakes, tiers, and the phase 1 lock use the full balance, because they size risk against the money you can really lose, and the lock is tied to the broker's absolute minimum.

Choosing "today only" for the date keeps past days frozen, which AC-3 and AC-4 require. Back dating would rewrite the running balance of every later day in the calendar. Choosing delete only keeps the surface small: a wrong entry is deleted and entered again.

Per row saves (insert one row, delete one row) are chosen over the `saveWds` style whole array `upsert`, because delete must work and a failed write must roll back one row, not the list.

## Feature design

**Data model sketch**:

| Entity | Fields | Notes |
|---|---|---|
| `balance_adjustments` | `id` text PK, `user_id` uuid not null FK `auth.users(id)` on delete cascade, `timestamp` timestamptz not null, `date` text not null (local day, from `tod()`), `mode` text not null check in `('DEMO','REAL')`, `amount` numeric not null (signed), `balance_before` numeric, `balance_after` numeric, `notes` text null | Index on `user_id`. RLS enabled, policy "own balance_adjustments" for all with `auth.uid() = user_id` in using and with check. |

Relationship: user 1 to N adjustments. No other table changes.

Balance rule per mode: `start + trade P&L − withdrawals (Real only) + sum(adjustment amounts for that mode)`.

Client shape (camel case, via `toAdjRow` and `fromAdjRow` next to `toWdRow`): `{id, timestamp(ms), date, mode, amount, balanceBefore, balanceAfter, notes}`.

**State transitions**: none. An adjustment is created once and can only be deleted.

**API surface** (Supabase client calls from `App`, no new server endpoint):

| Action | Call | Key inputs | Key outputs | Auth | Key errors |
|---|---|---|---|---|---|
| Load | `from('balance_adjustments').select('*').eq('user_id', id).order('timestamp', {ascending:false})` inside the existing load effect (it reads `data` only, never `error`) | user id | `(data||[]).map(fromAdjRow)` into `adjs` state, numbers wrapped in `Number()`, so a missing table or migration gives an empty list, not a crash | signed in user, RLS | none surfaced |
| Add | `addAdj(adj)`: set state first, then `insert` one row, roll back with functional `setAdjs(prev=>prev.filter(...))` on error | adjustment object | none | RLS own row | insert error, show "Could not save. Try again." |
| Delete | `deleteAdj(id)`: remove from state, then `delete().eq('id', id)`, restore the row with a functional update on error | adjustment id | none | RLS own row | delete error, show "Could not delete. Try again." |
| Reset | inside `resetAccount`: `delete().eq('user_id', id).in('mode', modes)` and filter state | modes in scope | none | RLS own rows | same as other reset calls |

**Value sourcing** (every value named, none left for the build to invent):

| Action | Value produced or displayed | Source |
|---|---|---|
| Save | `mode` | the `mode` prop of `Money` (global Demo and Real toggle) |
| Save | current balance (baseline) | `balForMode(settings, trades, wds, mode, adjs)` read at the moment of save |
| Save | new balance | New balance field (state `adjBal`), `Number()` then rounded to cents |
| Save | `amount` | `(Math.round(new*100) − Math.round(current*100)) / 100` |
| Save | note text | state `adjNote` (Money already uses `note` and `amt` for withdrawals) |
| Save | `balance_before`, `balance_after` | current balance, new balance |
| Save | `date` | `tod()`, the same local day string used by trades and withdrawals |
| Save | `timestamp`, `id` | `Date.now()`, `uid()` |
| Save | `user_id` | `authUser.id` in `toAdjRow` |
| Save | `notes` | Note field, trimmed, empty string stored as null, 200 character cap |
| Preview line | change amount | same `amount` formula, from the live field value |
| Delete dialog | balance change | `-amount` of the chosen row |
| Milestones, Dashboard milestone card, Dashboard growth percent | trading balance | `balForMode(...)` minus `Math.max(0, sum of this mode's amount values)` |
| Day stats | adjustment on a date | sum of `amount` for the mode grouped by the row's `date`, exposed as an `adjusted` field |
| Day panel line | "Balance adjusted +$Z" | the day's `adjusted` field, signed helper |
| Day start balance | adjustments before midnight | rows of the mode with `timestamp < msDayStart()` |
| Session warning | session running | `getActive(ss, mode)` is not null |

**Key invariants**:
- `balForMode(settings, trades, wds, mode, adjs = [])` is the only place balance is computed. `calcBal` gets one extra argument, the mode's adjustments, and adds their sum. The default `[]` keeps every old caller and test working.
- `buildDayStats(trades, wds, mode, startBal, adjs = [])` adds an adjustment to a day's running balance only. `pctPnl` stays `pnl / startOfDay`, where `startOfDay` already includes earlier adjustments.
- `dayStartBalForMode` adds the mode's adjustments with `timestamp` before local midnight. It calls `calcBal` directly, so it filters by mode itself (both functions share one small helper that picks a mode's adjustments).
- A same day adjustment is applied at the end of that date in `buildDayStats` and is excluded from that day's start in `dayStartBalForMode`, so today's daily targets do not move and tomorrow includes it.
- Rows after a deleted one keep their stored `balance_before` and `balance_after`. They are audit values "at the time", never recomputed.
- Starting balance is never written by this feature.
- An adjustment is never edited. Amount is never 0 after rounding.
- Adjustments are filtered by `mode` inside `balForMode`, so a caller cannot mix modes.

**Security model**: Row level security on `balance_adjustments`, one policy for all commands, `auth.uid() = user_id`, same as `withdrawals`. The `mode` check constraint rejects any other value. No compliance scope: this is a personal journal figure, not a payment.

**Configuration required**: none.

**Critical test scenarios** (each maps to an acceptance criterion):
- Pure calc: `calcBal` and `balForMode` add a mode's adjustments and ignore the other mode's, verifies **AC-2**, **AC-9**
- Pure calc: `buildDayStats` running balance includes an adjustment from its date, `pctPnl` for a trading day is unchanged by an adjustment on the same day, verifies **AC-3**, **AC-4**
- Form: empty, `abc`, `-5`, the current balance, and a 201 character note each show their message and disable Save, verifies **AC-5**
- Form: valid value shows the preview line and Save writes one row with the right amount, mode, and date, verifies **AC-2**, **AC-6**
- Form: Save fails (mock error), nothing changes and the message shows, verifies **AC-12**
- History: newest first, signed colors, empty state, verifies **AC-7**
- Delete: confirm removes the row and reverts the balance, failure restores the row, verifies **AC-8**
- Mode isolation: toggle Demo and Real, each shows only its list and balance, verifies **AC-9**
- Milestones: with a +$500 adjustment the "Milestone reached" advice does not appear on Capital or Dashboard, the sizer stake and phase 1 lock use the full balance, verifies **AC-10**
- Milestones: with a -$50 adjustment the milestone result is unchanged from full balance, verifies **AC-10**
- Same day ordering: an adjustment dated today leaves today's start balance and percent P&L unchanged and shows in tomorrow's start, verifies **AC-4**
- Input: `12abc`, `1e400`, and a 3 decimal value are rejected or rounded to cents, never NaN or Infinity, verifies **AC-5**
- Active session shows the warning and Save still works, verifies **AC-11**
- Reset of Demo deletes Demo adjustments and keeps Real, verifies **AC-13**
- Reload restores the list (load effect), verifies **AC-14**

## Build plan

Build approach is Tracer Bullet (from `AGENTS.md`): first a thin thread through every layer, then thicken.

1. Migration `supabase/migrations/20261118000000_balance_adjustments.sql`: table, index on `user_id`, RLS, policy, `mode` check, all idempotent (`if not exists`), satisfies **AC-14**
2. Thin thread: `toAdjRow` and `fromAdjRow`, `adjs` state, load in the existing load effect, `addAdj`, clear on sign out, and `adjs` threaded as a prop (default `[]`) to `Money`, `Dashboard`, `Journal`, `QuickLog`, `Analytics`, `CalendarPage`, `Ask`, `Cfg` and the balance calls in `App`; `calcBal`, `balForMode`, and `dayStartBalForMode` take the adjustments. Also update the non component callers: App `bal`, `msCounter`, the Masaniello alert `dayBal`, and the milestone tier effect (add `adjs` to its deps so tiers re resolve). Grep `wds` as an argument, not only the function names. satisfies **AC-2**, **AC-3**, **AC-9**, **AC-14**
3. Thin thread UI: "Balance" section and jump chip in `Money` (both modes), New balance and Note fields, Save, one real save end to end showing the new balance on Dashboard, satisfies **AC-1**, **AC-2**
4. Validation (text input, `Number()`, `isFinite`, cents rounding), signed money helper, preview line, save failure message, and the session warning, satisfies **AC-5**, **AC-6**, **AC-11**, **AC-12**
5. History list with Delete and the confirm dialog, `deleteAdj` with rollback, satisfies **AC-7**, **AC-8**
6. `buildDayStats` takes adjustments and adds the `adjusted` field, `CalendarPage` and `avgDailyGainPct` callers pass them, calendar day panel shows the "Balance adjusted" line, satisfies **AC-4**
7. Trading balance helper; milestone block in `Money`, the Dashboard milestone card, and Dashboard growth percent switch to it; phase 1 lock, sizer, and tiers stay on full balance; add the milestones note line, satisfies **AC-10**
8. `resetAccount` clears the mode's adjustments in state and in the table, and the Cfg reset confirm text mentions them, satisfies **AC-13**
9. Phone width pass at 360px and touch sizes, satisfies **AC-15**
10. Tests: pure calc tests for `calcBal`, `balForMode`, `buildDayStats`; React Testing Library tests for the Balance section. Each test file has its own generic Supabase mock, so no mock change is needed except new failure tests that make `insert` or `delete` return an error. Clear `sessionStorage` between full app tests, covers every AC

## Consequences

**Positive**:
- A wrong balance is fixed in one action, with a visible reason, and history stays honest.
- Starting balance, percent P&L, and milestone baselines keep their meaning.
- Both Demo and Real get it, including the Demo reset case.

**Negative / tradeoffs**:
- One new table, one new state list, and one extra argument on every balance caller. A missed caller shows a balance without adjustments, so the build must grep every `balForMode` and `dayStartBalForMode` call (about 25 in `src/App.js`).
- Today only dating means a correction for a past mistake lands today, so a past day's closing balance in the calendar keeps its old figure.
- Delete only means a typo costs a delete and a new entry.
- Milestones and the displayed balance can differ after an adjustment. The Capital tab must say why when they differ (a short line under the milestones heading when net adjustments are not zero).

**Neutral**:
- Withdrawals and their history are unchanged.
- The Ask profile balance includes adjustments through `balForMode`, with no other change.

## Follow-up

- [ ] Pull `origin/main` first: it is 1 commit ahead (PR 7 merge), and this build touches `src/App.js` widely.
- [ ] While building step 2, check how Masaniello "auto copy balance" and a live Masaniello cycle react to a mid session balance change, and add a test if the stake jumps unexpectedly.
- [ ] If the Capital tab grows crowded, consider whether the Balance section should move to Profile or Settings later. Not needed now.
