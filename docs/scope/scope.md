# Scope: TheGiftedMan Trading Tool

A disciplined binary options trading journal and execution tracker with session circuit breakers, money management calculation, and automated analytics.

**Build approach:** Tracer Bullet (vertical end to end slices, thin but complete through every layer).
**Workflow:** Beta (after develop: check verify, then test). The project default level of rigor. /architect is the recommended first stop for a feature with a real decision, but skippable when you already know the build. Any feature can carry its own tag (e.g. · GA) to do more or less.

_These are recommendations to keep your build orderly, not requirements. Skip anything that does not fit: if you already know how to build a feature, use /develop and skip /architect. You decide when a feature is `done`._

## At a glance

| # | Feature | Phase | Status |
|---|---------|-------|--------|
| A | Supabase schema & auth | Foundation | existing |
| B | Session engine & circuit breakers | Core | existing |
| C | Zone analyzer | Analysis | existing |
| D | Core trade journal & detail modal | Journal | existing |
| E | Quick log | Execution | existing |
| F | Money management & trading plan | Risk | existing |
| G | Calendar & analytics | Reporting | existing |
| H | Cooldown email notifications | API | existing |
| 1 | Modal sequential trade navigation | Slice 1 | done |
| 2 | Journal list pagination & page sizing | Slice 1 | done |
| 3 | Journal search & quick pair filter | Slice 1 | planned |

## Existing features

### A. Supabase schema & auth · existing
PostgreSQL tables for settings, trades, and sessions with Row Level Security and Supabase authentication.
code in `supabase/` and `src/supabaseClient.js`

### B. Session engine & circuit breakers · existing
Session timer, trade pacing rules, streak tracking, and daily loss circuit breakers.
code in `src/App.js` (`Dashboard`)

### C. Zone analyzer · existing
Chart screenshot upload, zone grading, and AI trade setup evaluation.
code in `src/App.js` (`Analyzer`)

### D. Core trade journal & detail modal · existing
Manual trade entry, pending trade resolution, trade detail modal with screenshot preview and note polish.
code in `src/App.js` (`Journal`, `TradeDetailModal`)

### E. Quick log · existing
Rapid trade logging for escalating styles with win and loss buttons and streak tracking.
code in `src/App.js` (`QuickLog`)

### F. Money management & trading plan · existing
Balance tracking, risk rules, trade style configuration, and withdrawal history.
code in `src/App.js` (`Money`, `Plan`)

### G. Calendar & analytics · existing
Interactive PnL calendar, win rate heat maps, and performance breakdowns by strategy and grade.
code in `src/App.js` (`CalendarPage`, `Analytics`)

### H. Cooldown email notifications · existing
Scheduled delayed email alerts when trading session cooldown periods end.
code in `api/`

## Slice 1: Easy Journal Navigation

### 1. Modal sequential trade navigation · done
Browse between saved journal entries directly inside the open TradeDetailModal using next and previous buttons or keyboard arrow keys without closing the popup.
**Done when:** clicking Next or Previous buttons (or pressing Left/Right arrow keys) in the trade modal smoothly switches to the adjacent trade in the active filtered journal list; boundary buttons disable appropriately and unsaved edits prompt before navigation.
- [x] Design it (spec): `/architect modal sequential trade navigation`
- [x] Build it: `/develop modal sequential trade navigation`
   - [x] Props & caller wiring: pass filtered list and navigate callback from Journal and Quick Log (AC-7)
   - [x] Modal navigation UI: Prev/Next buttons with position counter and boundary limits (AC-1, AC-2, AC-4, AC-9)
   - [x] Keyboard arrows: Left/Right arrow navigation with input focus exclusions and ref hygiene (AC-3)
   - [x] Unsaved edit safety: dirty draft check and discard confirmation (AC-5)
   - [x] Deletion & filter transition: auto advance on delete and filter dropout (AC-6, AC-8)
- [x] Verify it: `/check verify modal sequential trade navigation`
- [x] Test it: `/test modal sequential trade navigation`
Spec [0001](../specs/0001-modal-sequential-trade-navigation/index.md) · code in `src/App.js`

### 2. Journal list pagination & page sizing · done
Paginate the trade card list into configurable page sizes so large journal histories remain fast and clean to navigate.
**Done when:** the journal list displays trades across numbered pages with page size selection (10, 25, 50), next and previous page controls, and resets to page 1 upon changing filters.
- [x] Design it (spec): `/architect journal list pagination`
- [x] Build it: `/develop journal list pagination`
   - [x] Pagination state & filter reset: add pageSize and currentPage state hooks with localStorage persistence and filter reset effects (AC-3, AC-5, AC-6)
   - [x] Trade slicing: compute paginated slice and render only current page in Journal while preserving full sorted list on modal (AC-1, AC-8)
   - [x] Pagination controls: implement PaginationBar component with range counter, page size selector, and windowed page pills (AC-2, AC-4, AC-7)
- [x] Verify it: `/check verify journal list pagination`
- [x] Test it: `/test journal list pagination`
Spec [0002](../specs/0002-journal-list-pagination/index.md) · code in `src/App.js`

### 3. Journal search & quick pair filter · needs a decision
Fast keyword search on notes and quick pair filter dropdown to find specific trades without manual scrolling.
**Done when:** entering text in the search input filters trades by pair or note keywords instantly, and selecting a pair narrows the list to trades on that asset.
- [ ] Design it (spec): `/architect journal search & quick pair filter`

## Deferred
Out of scope for the current build pass, kept so the plan stays honest.
- **Dense table view toggle**: compact tabular grid alternative to trade cards for large screens
- **Trade export & backup**: CSV or JSON export of filtered journal entries

## Legend

**The decision box.** Every feature carries exactly one, the sub-task whose label ends with `(spec)`. Its wording varies (`Design it (spec)` normally), so skills locate it by that `(spec)` suffix, never by an exact label. Every other box is an execution box and `/architect` never ticks one.

**Feature lifecycle**: the scope updates as a feature moves; each row is what it shows and who sets it:

| State | Set by | The feature shows |
|---|---|---|
| `planned` · needs a decision | `/scope` | one box: `Design it (spec): /architect <feature>` |
| `in-progress` (designed) | `/architect` at spec capture | `Design it` ticked; spec linked; `Build it: /develop <feature>` + 2 to 5 milestones; the tier's closing boxes (`Verify it` Alpha+, `Test it` Beta+); any surfaced follow up enrolled |
| `in-progress` (building) | `/develop` | milestone sub-boxes tick one by one; code pointer filled |
| `in-progress` (verified) | `/check verify` | `Build it` + milestones ticked; `Verify it` ticked |
| `done` | you, when you decide it is; `/sync` reconciles | boxes you ran ticked, skipped ones marked skipped; the tier's last stage (`Beta` → after `/test`) is the suggested point to call it done; `/sync` captures conventions |

- **Next step** = the first unticked box (always a command or a tracked milestone).
- **needs a decision** = run `/architect` first; otherwise straight to `/develop`. The tag drops once the spec is captured.
- **Atomic build tasks live in the spec's `## Build plan`, not here**: the scope carries only the milestone rollup.
- **Status** `planned` → `in-progress` → `done`, plus `existing` (pre-workflow) and `dropped` (de-scoped, kept for history).
- **Approach tag** beside a heading overrides the project default for that feature; no tag = inherits it.
- **Workflow tier tag** beside a heading sets that one feature's rigor above or below the project default; no tag inherits the default.
- **Workflow** (header line) is the project default, what runs after `/develop`: **Beta** = `/check verify` then `/test`.
- **Pointer line** (`spec <n> · code in <path>`): the spec link added by `/architect`, the code path by `/develop`.
