# Verify: Journal list pagination and page sizing · spec 0002 · updated 2026-10-01
_Steps derived from spec 0002 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [x] On journal with 30 or more trades, verify only the first 25 render, with the counter displaying "Showing 1 to 25 of X trades" -> AC-1, AC-2
- [x] Click page size button "10", verify only 10 trades render and counter displays "Showing 1 to 10 of X trades" -> AC-2, AC-3
- [x] Reload the browser, verify page size selection persists as 10 from local storage -> AC-3
- [x] Click "Next" button, verify page 2 displays trades 11 to 20 and Previous button is enabled -> AC-4
- [x] Click page button "1", verify the list returns to trades 1 to 10 and Previous is disabled -> AC-4
- [x] Switch account mode to Real or toggle an outcome filter, verify active page resets to page 1 -> AC-5
- [x] Narrow filters so the previous page number exceeds available pages, verify current page clamps to the highest remaining page -> AC-6
- [x] On a trade log with more than 5 pages, verify numbered page buttons condense with ellipsis and direct jumps to first and last page -> AC-7
- [x] Open TradeDetailModal from a trade on page 1, click Next past the page boundary, verify trade 11 from page 2 displays seamlessly -> AC-8

## Commands
- [x] `npm run build` -> compiles cleanly with zero warnings or errors -> AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8
- [x] `npm test` -> smoke tests and critical calculations pass -> AC-1, AC-8

## Acceptance criteria coverage
- AC-1 covered by step 1, step 10, step 11
- AC-2 covered by step 1, step 2, step 10
- AC-3 covered by step 2, step 3, step 10
- AC-4 covered by step 4, step 5, step 10
- AC-5 covered by step 6, step 10
- AC-6 covered by step 7, step 10
- AC-7 covered by step 8, step 10
- AC-8 covered by step 9, step 10, step 11
