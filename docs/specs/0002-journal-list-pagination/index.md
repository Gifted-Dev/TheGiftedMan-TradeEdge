# 0002. Journal List Pagination and Page Sizing

**Date**: 2026-09-30
**Status**: Accepted

## Summary

This enhancement adds configurable pagination to the trading journal. Traders can browse large trade logs in manageable slices with page sizes of 10, 25, or 50 trades, with 25 trades as the default. A bottom pagination bar provides item count indicators, Previous and Next buttons, and numbered page controls. The modal trade navigation continues to step across the full filtered list without interruption.

## Requirements

**User stories**:
- As a trader, I want my trading journal divided into clean pages so that long trading histories remain fast to render and easy to scan.
- As a trader, I want to pick how many trades render per page (10, 25, or 50) and have that choice remembered across visits.
- As a trader, I want sequential trade review inside the detail modal to continue smoothly across the full filtered history without stopping at page boundaries.

**Acceptance criteria**:
- **AC-1**: The journal list displays trades in slices matching the active page size (defaulting to 25 trades per page).
- **AC-2**: A bottom pagination bar renders with an item range counter (for example "Showing 1 to 25 of 84 trades"), a page size selector (options: 10, 25, 50), Previous and Next buttons, and numbered page buttons.
- **AC-3**: Changing the page size selector updates the visible trade slice immediately, resets the active page to 1, and stores the selection in localStorage under `gm_journal_page_size`.
- **AC-4**: Clicking Next, Previous, or a numbered page button changes the active page, re-renders the matching slice of trades, and keeps page boundaries respected.
- **AC-5**: Modifying any journal filter (Demo or Real tab, outcome filter, strategy filter, grade filter, calendar date filter, or date range picker) resets the active page to 1.
- **AC-6**: When trade deletions or filter changes reduce the number of total pages below the current page, the active page automatically clamps to the highest remaining valid page.
- **AC-7**: Numbered page buttons condense gracefully when total pages exceed 5, displaying a compact window around the current page with ellipsis and jump links to the first and last page.
- **AC-8**: Opening `TradeDetailModal` from any page provides the entire filtered `sorted` trade collection, preserving seamless sequential navigation across the full dataset without restricting review to the current page slice.

## Decision

**Chosen option**: Option 1: Client side slice pagination with localStorage persistence and full list modal pass through.

We will derive the visible trade slice from the existing filtered `sorted` array using simple pagination state (`currentPage`, `pageSize`), store `pageSize` in `localStorage`, and continue passing the complete `sorted` array to `TradeDetailModal`.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Rationale

Reasoning and options: see [rationale.md](./rationale.md).

## Feature design

**Data model sketch**:
No database migrations or backend schema changes required. All trade records are already loaded in memory for the authenticated user and filtered client side.

Pagination state is held in `Journal` component state:
- `pageSize`: number (10, 25, 50), initialized from `localStorage.getItem('gm_journal_page_size')` falling back to 25.
- `currentPage`: number (1 indexed, minimum 1), initialized to 1.

Derived calculations:
- `totalItems`: `sorted.length`.
- `totalPages`: `Math.max(1, Math.ceil(totalItems / pageSize))`.
- `paginatedTrades`: `sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)`.
- `startItem`: `totalItems === 0 ? 0 : (currentPage - 1) * pageSize + 1`.
- `endItem`: `Math.min(currentPage * pageSize, totalItems)`.

**State transitions**:
- Filter change (mode, outcome, strategy, grade, date) -> Reset `currentPage` to 1.
- Page size change -> Set new `pageSize`, save to `localStorage`, reset `currentPage` to 1.
- Page button click (Next / Prev / Number) -> Update `currentPage` to target page.
- Trade deleted -> Recalculate `totalPages`; if `currentPage > totalPages`, clamp `currentPage` to `totalPages`.

**API surface**:
Internal component interface within `Journal` in `src/App.js`:

| Component / Function | Role | Inputs | Outputs | State handling |
|---|---|---|---|---|
| `Journal` | Host view | User props (`trades`, etc.) | Rendered journal view | Holds `currentPage`, `pageSize` |
| `PaginationBar` | Pagination UI | `currentPage`, `totalPages`, `pageSize`, `totalItems`, `onPageChange`, `onPageSizeChange` | Bottom navigation bar | Pure functional component |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Visible trade cards | Array of trade objects | Derived via `sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)` |
| Item range display | String "Showing X to Y of Z trades" | Derived from `(currentPage - 1) * pageSize + 1`, `Math.min(currentPage * pageSize, sorted.length)`, and `sorted.length` |
| Page size options | Array [10, 25, 50] | Static configuration in component |
| Active page size | Number (10, 25, or 50) | `localStorage.getItem('gm_journal_page_size')` or default 25 |
| Page buttons | Array of page numbers and ellipsis | Windowing helper around `currentPage` and `totalPages` |
| Prev button disabled | Boolean | `currentPage <= 1` |
| Next button disabled | Boolean | `currentPage >= totalPages` |
| Modal navigation list | Full array of filtered trades | Existing `sorted` array passed to `TradeDetailModal` |

**Key invariants**:
- When `totalItems` is 0, the pagination bar displays "No trades" or hides controls cleanly without negative or zero page indicators.
- `currentPage` must never exceed `totalPages` or fall below 1.
- Changing any filter must synchronously reset `currentPage` to 1 to avoid showing empty slices of narrowed results.
- `TradeDetailModal` must continue to receive `tradesList={sorted}` so modal Next and Previous buttons remain independent of the visual page boundary.

**Security model**:
Client side state only; operates on user trades already constrained by Supabase Row Level Security. No sensitive credentials or storage operations involved.

**Critical test scenarios**:
- Default pagination: When 30 trades exist, only the first 25 render, the range counter shows "Showing 1 to 25 of 30 trades", and page 2 is accessible via Next, verifies **AC-1**, **AC-2**, **AC-4**.
- Page size change: Switching page size from 25 to 10 immediately shows 10 trades, resets current page to 1, and stores 10 in localStorage, verifies **AC-3**.
- Filter reset: Being on page 2 and toggling the WIN filter resets the current page back to 1, verifies **AC-5**.
- Page clamp on deletion: Being on page 3 with 26 trades (25 on page 1, 1 on page 2) and deleting the sole trade on page 2 clamps active page to page 1, verifies **AC-6**.
- Ellipsis windowing: With 12 total pages, page buttons display a window such as 1 ... 4 5 6 ... 12 rather than all 12 buttons, verifies **AC-7**.
- Modal cross page navigation: Opening the 25th trade on page 1 and clicking Next inside the modal smoothly opens trade 26 (the first trade of page 2), verifies **AC-8**.

## Build plan

- [x] 1. Add `pageSize` and `currentPage` state hooks to `Journal` in `src/App.js`, including `localStorage` persistence and automatic filter reset effects, satisfies **AC-3**, **AC-5**, **AC-6**.
- [x] 2. Compute `paginatedTrades` slice and update the trade card map in `Journal` to render only the current page slice while keeping `tradesList={sorted}` on `TradeDetailModal`, satisfies **AC-1**, **AC-8**.
- [x] 3. Create `PaginationBar` component with item counter, page size selector, Next and Previous buttons, and condensed numbered page pills with windowing, satisfies **AC-2**, **AC-4**, **AC-7**.
- [x] 4. Wire `PaginationBar` below the trade card list in `Journal` and verify disabled states and styling consistency with theme tokens, satisfies **AC-2**, **AC-4**.

## Consequences

**Positive**:
- Eliminates DOM bloat and scroll fatigue when journals contain hundreds of entries.
- Gives traders control over density with remembered preferences.
- Preserves full list sequential review in the modal without forcing traders to close the modal to change pages.

**Negative / tradeoffs**:
- Requires managing an additional state dimension (`currentPage`) alongside existing filter states.

**Neutral**:
- Purely frontend UI change; zero database migrations or API endpoints.

## Migration plan

**Strategy**: no migration needed
**Phases**:
1. Single deploy of updated `Journal` component.
**Rollback**: Revert commit to restore unpaginated rendering.
**Risks**: None. All changes are local to component rendering.
