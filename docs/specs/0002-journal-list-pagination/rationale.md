# 0002. Journal List Pagination and Page Sizing: Rationale

**Date**: 2026-09-30

## Context

The trading journal in `Journal` currently renders all trades matching the active filters in a single continuous vertical list using `sorted.map(t => ...)`. As a trader logs dozens or hundreds of trades across daily sessions, this leads to heavy DOM node counts, awkward scrolling on mobile and desktop, and sluggish rendering when expanding images or opening details.

The goal is to divide the journal into structured pages with configurable sizing (10, 25, or 50 items per page), while ensuring that:
1. Traders can choose their preferred page density, and that preference persists across browser reloads.
2. Filtering, deleting, or changing tabs handles page boundaries gracefully without stranding the user on empty screens.
3. The sequential trade review feature in `TradeDetailModal` introduced in spec 0001 continues to traverse the entire filtered dataset seamlessly, rather than halting at arbitrary visual page boundaries.

## Options considered

### Option 1: Client side slice pagination with localStorage persistence (Selected)

Derive the paginated slice in the `Journal` component from the already filtered in memory `sorted` array using simple slice math: `sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize)`. Save the selected `pageSize` to `localStorage` under `gm_journal_page_size`. Render a clean bottom navigation bar with range details, page size controls, Previous/Next navigation, and windowed numbered pills. Pass the complete `sorted` array to `TradeDetailModal` so modal navigation remains fluid.

**Pros**:
- Extremely simple and fast implementation with no network latency.
- Matches the app existing client side filter and state architecture.
- Keeps modal sequential trade navigation completely uninterrupted across page slices.
- Persists user preferences easily with zero backend schema overhead.

**Cons**:
- All trades for the user remain in memory on initial load, though for typical retail trading journals (hundreds or low thousands of trades) this remains well within JavaScript memory comfort limits.

### Option 2: Infinite scroll with dynamic loading

Append trades dynamically as the user scrolls toward the bottom of the viewport, using an IntersectionObserver or scroll position listener.

**Pros**:
- Natural mobile feed browsing feel without explicit button clicks.

**Cons**:
- Unpredictable footer accessibility and jumpy scrollbars.
- Harder for traders to jump to specific points in their history.
- Makes it difficult to inspect total trade count and exact page positions.
- Complicates scroll position restoration when closing the trade detail modal.

### Option 3: Server side database limit and offset queries

Query Supabase with `.range(from, to)` to fetch only the active page from PostgreSQL on every page change.

**Pros**:
- Minimizes browser memory by never holding older trades locally.

**Cons**:
- Introduces round trip network latency on every page flip and filter toggle.
- Breaks client side analytics calculations and streak evaluations that rely on having the full active session and history loaded.
- Substantially increases code complexity and Supabase API call volume for zero user visible benefit at current scale.

## Rationale

Option 1 is selected because it directly solves the visual clutter and DOM weight issues while maintaining instant reactivity. All trades are already loaded and synchronized via Supabase in the parent state, so slicing the array in memory introduces zero network delay when flipping pages. Preserving the full `sorted` array for `TradeDetailModal` means traders can review dozens of consecutive trades without repeatedly closing and reopening dialogs to change pages.
