# 0003. Journal Search and Quick Pair Filter

**Date**: 2026-11-12
**Status**: Proposed

## Summary

This adds a search box and a pair dropdown to the trading journal so you can find trades without scrolling. Typing words filters trades by pair name or note text on every keystroke. Picking a pair narrows the list to that asset. Both work together with the filters already there (outcome, strategy, grade, period) and with pagination. Everything happens in the browser, so no database change is needed.

## Context

The journal already filters by Demo or Real tab, outcome, strategy, grade, calendar day, and date range. Each filter is a plain state value in `Journal`, chained into one `sorted` array in `src/App.js`. Pagination (spec 0002) and the modal's next and previous navigation (spec 0001) both read from `sorted`.

There is no way to find a trade by what you wrote in its notes or by its asset. A trader with a long history must scroll. The pair field is free text (a typed string, not a fixed list), so the same asset can appear as `EUR/USD`, `eur/usd`, or `EUR/USD OTC`. All trades are already loaded in memory, so filtering needs no server call.

## Requirements

**User stories**:
- As a trader, I want to type a word and see only trades whose pair or notes contain it, so I can find a past setup fast.
- As a trader, I want to pick one pair from a dropdown and see only trades on that asset.
- As a trader, I want search and pair filter to work with my other filters, and one button to clear them.

**Acceptance criteria**:
- **AC-1**: A search input in the journal filters trades on every keystroke. A trade matches when every whitespace separated word in the query appears (case insensitive, substring) in its pair or notes. An empty or whitespace only query matches all trades.
- **AC-2**: A pair dropdown lists "All pairs (N)" first (N is the tab's total trade count), then each distinct pair found in the current Demo or Real tab, shown as `EUR/USD (12)`. Options sort by trade count (highest first), then label via `localeCompare(..., undefined, {sensitivity:'base'})`. Selecting a pair shows only trades on that pair.
- **AC-3**: Pairs group by trimmed, case insensitive text. `eur/usd` and `EUR/USD ` are one option, labelled with the trimmed spelling of the newest trade in the tab (`trades` is newest first). `EUR/USD OTC` stays a separate option. A trade with a blank pair groups under the label "(no pair)", option value `''`, and sorts by its count like any other option.
- **AC-4**: Search and pair filter combine with outcome, strategy, grade, calendar day, and period filters using AND. Summary stats, pagination, and the trade detail modal's navigation list all use the narrowed `sorted` list.
- **AC-5**: Changing the search text or the selected pair resets the active page to 1.
- **AC-6**: Search text and pair selection survive a Demo or Real tab switch. If the selected pair has no trades in the new tab (or its last trade is deleted), the pair resets to "All pairs". Neither value is saved to storage; both reset on reload.
- **AC-7**: A "Clear" button appears in the control row only when `filterActive` is true (`search.trim()!==''` or `effectivePair!=='ALL'`). Clicking it clears both. A whitespace only search does not show it.
- **AC-8**: When `sorted` is empty and `filterActive` is true, the list card (the "No {filt} trades yet." card near App.js:4823) reads "No trades match your filters." and shows a "Clear search and pair" button. With `filterActive` false, that card is unchanged. The summary card ("No trades match this filter.") is unchanged.

## Options considered

### Option 1: Client side filter in `Journal`, two new state values
Add `search` and `pairFilt` state beside the existing filters. Add two steps to the filter chain. Render one new control row.
**Pros**:
- Smallest change, matches every existing filter's pattern.
- Instant results; the data is already in memory.
- No schema or API change.
**Cons**:
- Filtering cost grows with history size (a few thousand trades is still trivial).
- Search covers only loaded trades.

### Option 2: Server side search through Supabase
Send the query to the database with a text search or `ilike` filter.
**Pros**:
- Scales to very large histories.
**Cons**:
- Needs a network call per keystroke or a debounce, which breaks "instantly".
- Pagination, summary stats, and modal navigation all read the in memory list today, so they would need rework.

### Option 3: Fuzzy search library
Typo tolerant matching with a new dependency.
**Pros**:
- Forgives misspelled words.
**Cons**:
- New dependency for a small list, and fuzzy results are harder to explain than substring matches.

## Decision

**Chosen option**: Option 1: Client side filter in `Journal`.

Add `search` and `pairFilt` state, filter `sorted` by them with pure helper functions, and render one control row above the Strategy row.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

Spec 0002 and the existing filters already treat the full filtered `sorted` array as the single source for the list, stats, pagination, and modal. Adding two more steps to that chain keeps one source of truth, and AC-4 holds with no extra wiring. The data is in memory, so substring matching is instant and needs no debounce. Server search (Option 2) would break that single source for a gain this project does not need yet. Fuzzy search (Option 3) adds a dependency for a problem substring match solves.

Runner up decisions made here: the pair dropdown is built from the current tab's trades before other filters, so counts stay stable while you narrow. Blank pairs get a "(no pair)" option instead of being hidden, so no trade becomes unreachable. A native `<select>` is used for accessibility and mobile, over a custom combobox.

## Feature design

**Data model sketch**: No database change. New `Journal` state:
- `search`: string, default `''`.
- `pairFilt`: string, the pair key, default `'ALL'`.

Name note: `pairOptions` already exists in `Journal` (the manual entry pair datalist, App.js:4138). Do not reuse that name; the derived list below is `pairFilterOptions`.

Pure helpers (module level in `src/App.js`, exported for tests):
- `pairKey(t)`: `(t.pair||'').trim().toLowerCase()`; blank stays `''`.
- `matchesSearch(t, q)`: split `q.trim().toLowerCase()` on whitespace; return true if there are no words, else every word is a substring of `` `${t.pair||''} ${t.notes||''}`.toLowerCase() ``.

Derived values in `Journal`:
- `pairFilterOptions`: built from `tabTrades`. Group by `pairKey`, label is the trimmed spelling of the first trade in `tabTrades` order (newest), count trades, sort count desc then `localeCompare` on label. Blank key label is "(no pair)". Not memoized (the rest of the filter chain is not).
- `effectivePair`: `pairFilterOptions.some(o=>o.key===pairFilt) ? pairFilt : 'ALL'`.
- `filterActive`: `search.trim()!=='' || effectivePair!=='ALL'`. One boolean for the Clear button and the empty state.
- Filter chain: `...gradeFiltered → dateFiltered → pairFiltered → searchFiltered → rangeFiltered → sorted`. Pair and search filter on `effectivePair` and `search`.
- Dropdown counts ignore the period and calendar day filters by design, so a count can show over an empty list; AC-8's wording covers that.

**State transitions**:
- Page reset: add `search` and `pairFilt` to the deps of the existing reset effect (App.js:4111). Handlers do not call `setCurrentPage(1)` inline for these two.
- Typing in search: set `search`.
- Pair select change: set `pairFilt`.
- Clear button or empty state button: set `search` to `''` and `pairFilt` to `'ALL'`.
- Selected pair missing from `pairFilterOptions` (tab switch, deletion, edit): `useEffect(()=>{if(effectivePair!==pairFilt)setPairFilt('ALL')},[effectivePair,pairFilt])`. Both the derived `effectivePair` (no flash of a stale filter) and this effect (so a pair does not come back on Demo to Real to Demo) are needed. Do not put `pairFilterOptions` in the deps (new array every render).

**API surface**: None. Client side only.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Search | Match result per trade | `search` state and trade `pair` and `notes` fields |
| Pair dropdown | Option list and counts | `tabTrades` grouped by `pairKey` (existing `trades` prop filtered by `journalTab`) |
| Pair dropdown | Option label | Trimmed `trade.pair` of the newest trade with that key |
| Pair dropdown | "All pairs (N)" count | `tabTrades.length` |
| Pair dropdown | Selected value | `effectivePair` (never raw `pairFilt`) |
| Filter | Selected pair key | `pairFilt` state, validated against `pairFilterOptions` |
| Empty state | Which message shows | `filterActive` |
| Clear button | Visibility | `filterActive` |

**Key invariants**:
- `sorted` stays the one list that feeds the cards, summary stats, pagination, and modal navigation.
- The pair dropdown never offers a pair with zero trades in the current tab, and a stale `pairFilt` never filters (effective value falls back to `'ALL'`).
- Search never mutates trades.

**Security model**: No new data access. Trades are already scoped to the signed in user. React escapes rendered text, and the query is only used in a substring check (no regex, no HTML).

**Configuration required**: None.

**UX surface**:
- New row directly above the Strategy row (below the outcome buttons row): `<input type="search">` (placeholder "Search pair or notes", `aria-label="Search journal"`; its native clear x clears search only), `<select aria-label="Filter by pair" value={effectivePair}>`, and a "Clear" button shown per AC-7. Style with the existing `inp` and `btn` styles and theme tokens. The row wraps on narrow screens like the other filter rows.

**Critical test scenarios**:
- `matchesSearch`: multiple words in any order match; case ignored; notes only match; empty query matches all, verifies **AC-1**
- `pairKey` and option building: `eur/usd` and `EUR/USD ` merge, `EUR/USD OTC` separate, blank becomes "(no pair)", sort by count, verifies **AC-2**, **AC-3**
- Journal render: type a word, list narrows; select pair, list narrows; both plus an outcome filter combine, verifies **AC-1**, **AC-4**
- Go to page 2, then type in search: page resets to 1, verifies **AC-5**
- Select a pair that exists only in Demo, switch to Real: pair shows "All pairs", verifies **AC-6**
- Clear button hidden when idle or whitespace only search, visible when active, clears both; empty state shows the match message and its button, verifies **AC-7**, **AC-8**
- Edit the last trade of the selected pair to another pair: pair resets to "All pairs", verifies **AC-6**

Test setup: `Journal` takes many props (`settings`, `trades`, `saveTrades`, `deleteTrade`, `ss`, `saveSS`, `pa`, `setPA`, `wds`, `mode`, `userId`, `strategies`, `addStrategy`). Reuse any existing Journal test setup; if none, pass minimal stubs (`jest.fn()` for callbacks, empty arrays and objects for the rest) and mock Supabase backed calls. Helpers `pairKey` and `matchesSearch` get plain unit tests with no render.

## Build plan

Approach: Tracer Bullet (from `AGENTS.md`). Search goes first as a thin end to end thread, then the pair filter, then polish.

1. Add `pairKey` and `matchesSearch` helpers. Add `search` state, the `searchFiltered` step in the chain, the search input in a new control row, and add `search` to the page reset effect, satisfies **AC-1**, **AC-4**, **AC-5**
2. Add `pairFilterOptions`, `pairFilt` state, `effectivePair`, the `pairFiltered` step, the `<select>` with counts, and the stale pair reset effect, satisfies **AC-2**, **AC-3**, **AC-4**, **AC-5**, **AC-6**
3. Add the Clear button (visible rule) and the new empty state message with its button, satisfies **AC-7**, **AC-8**
4. Add tests with React Testing Library for the helpers and the Journal flows above, satisfies **AC-1** to **AC-8**

## Consequences

**Positive**:
- Trades are findable by pair or note text in one step.
- Reuses the single `sorted` list, so stats, pagination, and modal navigation stay correct with no extra wiring.
- No dependency, no schema change.

**Negative / tradeoffs**:
- Another filter row adds vertical space above the list, especially on mobile.
- Search only covers pair and notes, not strategy names, grade, or zone type (those have their own filters).
- Free text pairs that differ beyond case and spaces (`EURUSD` vs `EUR/USD`) stay separate options.
- Filtering runs on every keystroke over the full tab list. Fine for thousands of trades; revisit if histories grow far beyond that.

**Neutral**:
- Search and pair are not saved, so a reload starts with a clean list. This matches the other filters.
- Existing pagination and modal behavior are unchanged.

## Follow-up

- [ ] If histories grow large, consider a short debounce (about 150 ms) or `useDeferredValue` on `search`.
- [ ] A pair alias or normalise step (for `EURUSD` vs `EUR/USD`) is out of scope here; raise it if the dropdown gets noisy.
