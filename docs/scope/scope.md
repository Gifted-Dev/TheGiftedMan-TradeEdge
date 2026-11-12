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
| 3 | Journal search & quick pair filter | Slice 1 | in-progress |
| 4 | Masaniello money management style | Slice 2 | in-progress |
| 5 | Masaniello daily goals & session counter | Slice 2 | planned |
| 6 | Masaniello settings recommender | Slice 2 | planned |
| 7 | Settings page reorganization | Slice 3 | done |

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

### 3. Journal search & quick pair filter · in-progress
Fast keyword search on notes and quick pair filter dropdown to find specific trades without manual scrolling.
**Done when:** entering text in the search input filters trades by pair or note keywords instantly, and selecting a pair narrows the list to trades on that asset.
- [x] Design it (spec): `/architect journal search & quick pair filter`
- [ ] Build it: `/develop journal search & quick pair filter`
   - [ ] Search thread: helpers, `search` state, filter step, input row, page reset (AC-1, AC-4, AC-5)
   - [ ] Pair filter: derived options with counts, select, stale pair reset (AC-2, AC-3, AC-4, AC-5, AC-6)
   - [ ] Clear button and empty state (AC-7, AC-8)
- [ ] Verify it: `/check verify journal search & quick pair filter`
- [ ] Test it: `/test journal search & quick pair filter`
Spec [0003](../specs/0003-journal-search-and-pair-filter.md) · code in `src/App.js`

## Slice 2: Masaniello money management (Wealth Warriors style)

### 4. Masaniello money management style · in-progress
Add a fourth Money Management Style where you pick how many wins you need (K) out of a total number of trades (N), and every stake is sized so that hitting K wins reaches the session target. It works next to Fixed Risk %, Anti-Martingale, and Profit Lock.
**Done when:** you can select Masaniello per mode, set initial capital, total trades, win trades, and payout %, and see the minimum capital, required win rate, capital final, account gain, win profit, stop loss, and max loss limit. During a session each trade shows its computed stake, return, and running balance; the session ends itself once K wins or N minus K plus 1 losses are reached; and events won and lost are tracked.
- [x] Design it (spec): `/architect masaniello money management style`
- [x] Build it: `/develop masaniello money management style`
   - [x] Thin thread: pure engine, style option, whitelists, snapshot, dispatchers, one cycle end to end (AC-1, AC-5, AC-6, AC-8, AC-9, AC-12, AC-20)
   - [x] Integration: escalating call sites, replay and corrections, logging guards (AC-9, AC-11, AC-14 to AC-19)
   - [x] Surfaces: Quick Log rows, settings validation and summary, start gate, events won and lost (AC-2, AC-3, AC-4, AC-7, AC-10)
   - [x] Daily lock and assistant knowledge for four styles (AC-11, AC-13)
- [ ] Verify it: `/check verify masaniello money management style`
- [x] Test it: `/test masaniello money management style`
Spec [0004](../specs/0004-masaniello-money-management-style/index.md) · code in `src/App.js`

### 5. Masaniello daily goals & session counter · needs a decision
Track how many Masaniello sessions you have run today and how many more you need to hit a daily profit goal, with the alert and auto options from the tool.
**Done when:** you can set a daily profit target (% or $) and see sessions required, projected account gain, and capital final. A session counter advances on each finished session (manual or auto). Optional toggles cover stop loss alert %, session end alert, low trade alert, auto copy balance into the next session, auto log, and auto count, each with sound feedback.
- [ ] Design it (spec): `/architect masaniello daily goals & session counter`

### 6. Masaniello settings recommender · needs a decision
Suggest the wins and total trades setting that fits you, based on your overall win rate from the journal and your current account balance.
**Done when:** with Masaniello selected, you see a recommended K of N (plus a short reason), using only configurations whose minimum capital fits your balance and whose required win rate sits safely below your real win rate. One click applies it, and too little trade history shows a clear "not enough data" state instead of a guess.
- [ ] Design it (spec): `/architect masaniello settings recommender`

## Slice 3: Settings clarity

### 7. Settings page reorganization · done
The Settings page grew into one long stack of cards with repeated controls and long explainer text. Regroup it into clear sections so you can find a setting fast and see each setting only once.
**Done when:** Settings is split into a small set of named sections (for example Account, Money management, Session rules, Strategies, AI, Danger zone) you can jump between; every setting appears in exactly one place (no duplicate or two way synced selectors, no repeated mode notes); long help text is short and sits beside the field it explains; the active account mode is clear; one Save behavior is obvious; and every setting that works today still works.
- [x] Design it (spec): `/architect settings page reorganization`
- [x] Build it: `/develop settings page reorganization`
   - [x] Thin thread: sticky mode badge, six tabs, one Save bar with dirty and Discard, one real save end to end (AC-1, AC-2, AC-4, AC-5, AC-6, AC-12)
   - [x] Draft only saving: remove instant writes, restore settings on failed save, calculator and strategy inputs out of the draft, reset with balances (AC-4, AC-5, AC-6, AC-14)
   - [x] Regroup: one money style picker, Masaniello hides base stake cards, Session rules and Alerts regrouped (AC-3, AC-8, AC-9)
   - [x] Help text and Masaniello hint: short lines, detail in InfoTip, repeated notes removed (AC-2, AC-10, AC-11)
   - [x] Leave guard, ARIA tabs and phone width pass (AC-7, AC-13)
- [ ] Verify it: `/check verify settings page reorganization`
- [x] Test it: `/test settings page reorganization`
Spec [0005](../specs/0005-settings-page-reorganization/index.md) · code in `src/App.js` (`Cfg`, `MasanielloSettings`)

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
