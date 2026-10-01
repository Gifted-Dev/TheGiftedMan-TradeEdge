# Rationale: 0001. Modal Sequential Trade Navigation

## Context

The Trade Detail Modal allows traders to inspect trade properties, read and polish notes, and view attached chart screenshots. Currently, the modal operates strictly on a single selected trade. To review multiple trades from a session or filter set, a trader must close the modal, locate the next trade card in the journal list, and click to open it again.

This repeated opening and closing slows down end of session reviews and trade auditing. When studying a sequence of trades taken during a session, traders need fluid, uninterrupted traversal across their journal entries while keeping their active filter and sort context intact.

## Options considered

### Option 1: Pass active filtered list and navigation handler from parent (Recommended)

Pass the active filtered trades array and an `onNavigate` callback from Journal and Quick Log down to TradeDetailModal. The modal derives its current index, handles boundary logic, listens for arrow keys, and invokes `onNavigate(adjacentTrade)` to update the parent state.

**Pros**:
- Keeps list filtering and sorting logic centralized in the parent component.
- Supports both Journal and Quick Log views with zero duplicated filtering code.
- Lightweight props interface with clean separation of concerns.

**Cons**:
- Requires updating the component props signature at both call sites in App.js.

### Option 2: Lift all modal navigation and open state into a dedicated global context

Create a separate React context provider managing the modal queue and trade selection across the entire application.

**Pros**:
- Any component could trigger the modal with a preset queue.

**Cons**:
- Unnecessary architecture overhead for a single page app where Journal and Quick Log already own their list states.
- Introduces extra state synchronization layers and potential stale closures.

## Rationale

Option 1 provides the exact capability needed with minimal blast radius. Both Journal and Quick Log already maintain their own filtered trade arrays (`sorted` in Journal, session trades in Quick Log). Passing this array alongside the selected trade allows TradeDetailModal to calculate its position, display accurate counts, and request adjacent trades without altering the underlying data flow.
