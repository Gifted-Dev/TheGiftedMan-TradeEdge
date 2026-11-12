# 0005. Settings Page Reorganization: rationale

## Context

`Cfg` in `src/App.js` (about 700 lines) renders the whole page in one scroll. Problems found by reading it:

- **Money style is picked twice.** An "Active style" switch and a tab bar both choose Fixed Risk %, Anti Martingale, Profit Lock, or Masaniello, and each click updates the other.
- **Account mode is repeated.** A badge says "Configuring: Demo account" while most labels and notes also say Demo or Real.
- **Notes repeat.** The "this style is on its own session rules" note appears in the Fixed tab, in Session rules, and in the calculator. "Applies from your next session" appears beside several fields.
- **Saving is mixed.** Style, sessions per day, and strict locking save the instant you click, and each such save also writes every half edited field in the draft. Everything else waits for the bottom Save button. A reader cannot tell which is which.
- **Dead controls.** Risk sizing and Milestone base sizing do nothing when Masaniello is active, yet they stay visible with an "overridden" note.
- **Order.** AI provider comes first, Strategies come after Session rules, and the page is one scroll.

Scope row 7 asks for named sections, one place per setting, short help text beside each field, a clear mode, one Save behavior, and no lost features. Settings stored per mode keep the `Demo` and `Real` key suffixes, so the saved row does not change.

## Options considered

### Option 1: Tabs, one section at a time with a sticky Save bar

Six tabs. Draft lives in `Cfg` state. One Save bar. Money style becomes one picker.

**Pros**:
- Short page, and the setting count per screen drops sharply.
- One save rule, no hidden writes of half edited fields.
- Reuses `f` state, `persistSettings`, `InfoTip`, and `ConfirmDialog`.

**Cons**:
- The leave guard needs a small hook between `App` (owns the view) and `Cfg` (owns the draft).
- You cannot pre configure an inactive money style without making it the draft's active style.

### Option 2: One long page with jump links and the same cards

Add an anchor menu and regroup cards.

**Pros**:
- Smallest code change.

**Cons**:
- Keeps the long scroll and the mixed saving. Does not meet "one Save behavior".

### Option 3: Autosave every change

No Save button.

**Pros**:
- Nothing to forget.

**Cons**:
- A slider drag writes half valid risk values to a money setting. Needs debounce, error UI, and changes the Masaniello "invalid is not saved" rule.

## Rationale

The pain is not missing features, it is the structure: duplicated pickers, repeated notes, and three saving styles. Tabs cut the page length without removing a setting, which meets the scope's "find fast" goal. One draft with one Save fixes the surprising instant writes, which matter because these values size real money stakes. Autosave was rejected because a half moved slider would write an unsafe stake. The leave guard costs a small ref hook, which is cheaper than losing a risk change by clicking away.

Settled by me, not asked (runner up in brackets):
- Keep `Cfg` and its parts in `src/App.js`, split into small section functions, and export `Cfg` for tests (runner up: a new `Settings.js` file).
- Strategies and Danger zone stay as direct actions, since they are records and destructive commands, not settings.
- Sessions per day shows for every style, because the sidebar counter and session start check read it for every style (only show it under Fixed).
- Tab choice is not remembered, which avoids stored state (remember last tab in `localStorage`).
- The leave guard uses a ref the page registers, plus one request function in `App` for the sidebar and mobile menu (lift the whole draft into `App`).
- Save stays enabled when a Masaniello field has an error (block Save), to match spec 0004.
- No `beforeunload` prompt for closing the browser tab (add one later if data loss is reported).
