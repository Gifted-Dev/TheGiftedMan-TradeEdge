# 0001. Modal Sequential Trade Navigation

**Date**: 2026-09-30
**Status**: Accepted

## Summary

This enhancement adds seamless sequential navigation inside the Trade Detail Modal. Traders can click Next and Previous buttons or press Left and Right arrow keys to review consecutive trades without closing and reopening the modal. Unsaved edits trigger a confirmation prompt, and boundary controls disable cleanly at the ends of the active list.

## Requirements

**User stories**:
- As a trader, I want to move to the next or previous trade directly from the Trade Detail Modal so that I can review consecutive trades quickly without repeatedly closing the dialog.
- As a trader, I want keyboard arrow navigation so that I can step through trades rapidly on desktop.
- As a trader, I want a warning if I navigate away from uncommitted edits so that I do not accidentally lose drafted notes or field changes.

**Acceptance criteria**:
- **AC-1**: When viewing a trade in TradeDetailModal, clicking the Next button displays the next trade from the active filtered list, and clicking Previous displays the previous trade.
- **AC-2**: When viewing the first trade in the active list, the Previous button is disabled; when viewing the last trade in the active list, the Next button is disabled.
- **AC-3**: Pressing Left Arrow navigates to the previous trade and Right Arrow navigates to the next trade, provided keyboard focus is not inside an input, textarea, select, or contenteditable element.
- **AC-4**: A position indicator (such as "Trade 4 of 26") renders in the modal header bar beside the navigation controls.
- **AC-5**: If edit mode is active and the draft contains unsaved changes, attempting to navigate triggers a browser window.confirm dialog asking the user to discard edits or stay.
- **AC-6**: When a trade is deleted from inside the modal, the modal automatically advances to the next remaining trade, or to the previous trade if deleting the last trade, closing only if no trades remain.
- **AC-7**: Navigation strictly respects the active filtered list of the parent view (Journal or Quick Log), including mode, outcome, strategy, grade, and date range filters.
- **AC-8**: If a trade edit causes the trade to no longer match the parent view filter (filter dropout), saving the trade automatically advances to the trade now at that position in the filtered list, or previous if it was the last trade, closing the modal only if no filtered trades remain.
- **AC-9**: If the currently viewed trade is not found in the active list (currentIndex is -1), navigation controls are disabled and the position indicator shows "Outside active filter".

## Decision

**Chosen option**: Option 1: Pass active filtered list and navigation handler from parent.

We will pass the active filtered list and an `onNavigate` callback to TradeDetailModal, enabling localized sequential navigation while preserving existing parent state architecture.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Feature design

**Data model sketch**:
No database migrations or schema alterations required. This is a client side state and user interface enhancement.

**State transitions**:
- Viewing Trade N -> Click Next or Press Right Arrow -> View Trade N+1.
- Viewing Trade N -> Click Prev or Press Left Arrow -> View Trade N-1.
- Editing Trade (dirty) -> Navigate Attempt -> window.confirm Prompt -> (Confirm: discard draft and navigate; Cancel: stay in edit mode).
- Deleting Trade N -> Confirm Delete -> Delete from storage -> Transition to Trade N+1 (or Trade N-1 if N was last, or close if list empty).
- Saving Trade N (outcome modified such that it drops out of current filter) -> Save to storage -> Transition to trade at current index in updated filtered list (or close if list empty).

**API surface**:
Component props extension on `TradeDetailModal`:

| Prop | Type | Required | Description |
|---|---|---|---|
| trade | Object | Yes | Currently displayed trade record |
| tradesList | Array | Optional | Active ordered array of filtered trades from caller |
| onNavigate | Function | Optional | Callback `(nextTrade) => void` to switch active trade |
| onClose | Function | Yes | Callback to dismiss modal |
| onSaved | Function | Optional | Callback with updated trade object after save |
| saveTrades | Function | Yes | Persistence handler for updating trades list |
| deleteTrade | Function | Yes | Persistence handler for deleting trade |
| strategies | Array | Optional | Active strategies for tagging |
| settings | Object | Optional | User settings for balance and styling context |

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Next trade lookup | Trade object at index + 1 | `tradesList[currentIndex + 1]` |
| Previous trade lookup | Trade object at index - 1 | `tradesList[currentIndex - 1]` |
| Position indicator | String e.g. "4 of 26" or "Outside active filter" | Derived from `currentIndex + 1` and `tradesList.length` (or fallback if `currentIndex === -1`) |
| Previous disabled state | Boolean | `currentIndex <= 0` |
| Next disabled state | Boolean | `currentIndex === -1 || currentIndex >= tradesList.length - 1` |
| Filter context | Filtered trade items | Caller component state (`sorted` in Journal) |

**Key invariants**:
- Keyboard arrow shortcuts must never trigger when focus is inside an input, textarea, select, or element with isContentEditable set.
- Window event listeners for arrow keys must use React refs for mutable state (tradesList, trade, editingTrade, editDraft) to avoid stale closures.
- Switching trades while in read only mode must reset scroll position to top.
- Navigation buttons must disable whenever `tradesList` has fewer than 2 items or when the current trade is not in `tradesList`.

**Security model**:
Client side navigation operates exclusively over trade records already loaded into memory for the authenticated user session under existing Supabase Row Level Security policies.

**Critical test scenarios**:
- Happy path: Opening trade 2 of 5, clicking Next switches view to trade 3 of 5, counter updates to "3 of 5", verifies **AC-1**, **AC-4**.
- Boundary limits: On trade 1 of 5, Previous button is disabled and Left Arrow is ignored, verifies **AC-2**.
- Keyboard safety: Typing notes in textarea or editable element and pressing Left Arrow moves text cursor without changing trades, verifies **AC-3**.
- Unsaved edit guard: Editing note text and clicking Next triggers window.confirm prompt; cancelling stays on trade with draft intact, verifies **AC-5**.
- Deletion auto advance: Deleting trade 2 of 3 smoothly transitions to trade 3; deleting trade 3 of 3 transitions to trade 2, verifies **AC-6**.
- Filter fidelity: When Journal filters by outcome WIN, navigation moves only through winning trades, verifies **AC-7**.
- Filter dropout on save: Changing a WIN trade to LOSS while viewing WIN filter saves successfully and advances to the next winning trade, verifies **AC-8**.
- Missing index fallback: Opening a trade not present in the current filter shows "Outside active filter" and disables Next and Prev, verifies **AC-9**.

## Build plan

- [x] 1. Update `TradeDetailModal` call sites in `Journal` and `QuickLog` within `src/App.js` to pass `tradesList={sorted}` (or corresponding active list) and `onNavigate={setSelectedTrade}`, satisfies **AC-7**.
- [x] 2. Add modal header navigation bar with Previous and Next buttons and "X of Y" position counter, applying disabled styling at list boundaries and handling `-1` index fallback, satisfies **AC-1**, **AC-2**, **AC-4**, **AC-9**.
- [x] 3. Implement `keydown` event listener for Left and Right arrow keys using React refs to prevent stale closures, guarding against inputs, textareas, and contenteditable elements, satisfies **AC-3**.
- [x] 4. Add dirty edit detection and `window.confirm` dialog before executing navigation when in edit mode, satisfies **AC-5**.
- [x] 5. Update deletion and save handlers in `TradeDetailModal` to advance to adjacent trade on deletion or filter dropout instead of closing immediately, satisfies **AC-6**, **AC-8**.

## Consequences

**Positive**:
- Eliminates friction when reviewing trade history.
- Accelerates post session analysis and note auditing.
- Works across both manual journal entries and quick log records.
- Handles filter dropout gracefully without breaking navigation indices.

**Negative / tradeoffs**:
- Slightly increases component prop surface in `App.js`.
- Requires careful dirty state checking so user notes are never lost unintentionally.

**Neutral**:
- Purely frontend UI enhancement with zero impact on database schemas or backend serverless APIs.

## Migration plan

**Strategy**: no migration needed
**Phases**:
1. Single deploy with updated React component props and modal event handlers.
**Rollback**: Revert commit to restore previous modal behavior.
**Risks**: None. All changes are non breaking and isolated to modal UI presentation.
