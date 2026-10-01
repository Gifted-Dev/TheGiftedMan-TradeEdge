# Verify: Modal Sequential Trade Navigation · spec 0001 · updated 2026-09-30
_Steps derived from spec 0001 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Open a trade in Journal with multiple trades in the active filter -> Click Next button -> Displays next trade in list, position counter increments -> AC-1
- [ ] In TradeDetailModal, click Previous button -> Displays previous trade in list, position counter decrements -> AC-1
- [ ] Navigate to the first trade in the active filtered list -> Previous button is disabled with disabled styling; Left Arrow key is ignored -> AC-2
- [ ] Navigate to the last trade in the active filtered list -> Next button is disabled with disabled styling; Right Arrow key is ignored -> AC-2
- [ ] With focus outside any text input, press Right Arrow key -> Modal smoothly displays next trade -> AC-3
- [ ] With focus outside any text input, press Left Arrow key -> Modal smoothly displays previous trade -> AC-3
- [ ] Enter edit mode, click inside the notes textarea, type text, and press Left or Right Arrow keys -> Text cursor moves through text without switching trades -> AC-3
- [ ] Observe modal header navigation bar -> Position counter displays "Trade X of Y" where X is 1 based index and Y is total filtered count -> AC-4
- [ ] Enter edit mode, change note text or trade stake, and click Next (or press Right Arrow) -> Browser window.confirm prompt appears ("You have unsaved edits. Discard and navigate?"); clicking Cancel preserves edits; clicking OK navigates and discards draft -> AC-5
- [ ] In edit mode, click Delete trade and confirm -> Modal automatically advances to the adjacent trade (next trade if available, or previous if deleting the last trade); modal closes if no trades remain -> AC-6
- [ ] Apply a filter in Journal (e.g. Outcome WIN, or Strategy Zone) -> Navigate through trades -> Navigation moves strictly through trades matching the active filter -> AC-7
- [ ] With Journal filtered to Outcome WIN, edit a trade outcome from WIN to LOSS and save -> Trade is saved, drops out of filter, and modal automatically advances to the trade now at that position (or previous if last) -> AC-8
- [ ] Open a trade not present in the active list (e.g. deep link or cleared filter) -> Counter displays "Outside active filter" and both Prev and Next buttons are disabled -> AC-9
- [ ] Value sourcing: Next trade lookup -> Derives next trade object from `tradesList[currentIndex + 1]` -> AC-1
- [ ] Value sourcing: Previous trade lookup -> Derives previous trade object from `tradesList[currentIndex - 1]` -> AC-1
- [ ] Value sourcing: Position indicator -> Formats `Trade ${currentIndex + 1} of ${tradesList.length}` or fallback -> AC-4, AC-9
- [ ] Value sourcing: Boundary disabled states -> Disabled when `currentIndex <= 0` (Prev) or `currentIndex === -1 || currentIndex >= tradesList.length - 1` (Next) -> AC-2, AC-9
- [ ] Value sourcing: Filter context -> Navigation list strictly reflects parent caller state (`sorted` in Journal, `sessionTrades` in Quick Log) -> AC-7

## Commands
- [x] `npm run build` -> Compiles production build cleanly with zero errors and zero warnings -> AC-1..AC-9

## Acceptance-criteria coverage
- AC-1 covered by step 1, 2, 14, 15
- AC-2 covered by step 3, 4, 17
- AC-3 covered by step 5, 6, 7
- AC-4 covered by step 1, 2, 8, 16
- AC-5 covered by step 9
- AC-6 covered by step 10
- AC-7 covered by step 11, 18
- AC-8 covered by step 12
- AC-9 covered by step 13, 16, 17
