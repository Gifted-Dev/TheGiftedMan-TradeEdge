# 0005. Settings Page Reorganization

**Date**: 2026-11-12
**Status**: Accepted

## Summary

The Settings page is one long stack of cards. The same choice shows up twice (money style), the same notes repeat, and some controls save the moment you click while others wait for a Save button at the bottom. This spec splits Settings into six tabs (Account, Money management, Session rules, Strategies, AI, Danger zone), shows each setting once, and replaces all the saving styles with one sticky Save bar. No database change is needed, and every setting keeps its saved name and behavior.

## Requirements

**User stories**:
- As a trader, I want Settings split into named tabs so I can find a setting fast.
- As a trader, I want one Save with a clear unsaved state so I always know what is saved.
- As a trader, I want to see which account (Demo or Real) I am editing without reading every label.

**Acceptance criteria**:
- **AC-1**: Settings shows six tabs in this order: Account, Money management, Session rules, Strategies, AI, Danger zone. It opens on Account. Only the open tab's content renders. Tabs use `role="tablist"`, `role="tab"`, and `aria-selected`. Switching tabs never loses or resets draft values, including the "Add strategy" name and description inputs (their state lives in `Cfg`, not the tab body). Those two inputs do not count as unsaved changes.
- **AC-2**: A sticky header on every tab shows "Configuring: Demo account" or "Configuring: Real account", following the sidebar mode. Field labels do not repeat the mode suffix. Danger zone reset buttons still name their scope (Demo, Real, All). Switching mode while Settings is open keeps the draft and shows the other mode's values.
- **AC-3**: Every setting is reachable in exactly one place (see the section map). Money management has one style picker. Picking a style updates the draft and shows only that style's fields. There is no second Active style control.
- **AC-4**: One sticky Save bar is the only way to persist settings fields. The bar is always rendered. When the draft differs from the baseline it shows "Unsaved changes" with Save and Discard enabled. When clean, Save and Discard are disabled. While a save runs, Save, Discard, and the sidebar Demo/Real toggle are disabled, so a double click cannot write twice. No control saves settings on click. Two actions stay separate by design: adding, editing, or deleting a strategy, and the Danger zone resets (each keeps its own confirm).
- **AC-5**: Save writes the whole draft through the existing `persistSettings` path, which still echoes the live `activeMode` and both `mbTier` values. On success the bar shows "Saved" for about 2 seconds and the baseline becomes the exact object sent when Save started (edits made while saving stay unsaved). On failure the bar shows the error text, the draft stays, it stays unsaved, and `saveSettings` in `App` restores the previous `settings` so no other page runs on unsaved values. If any session is active (Demo or Real) when you save, one notice shows with "Saved", says changes start from the next session, and clears on the next edit. It replaces the old strict locking `alert()`.
- **AC-6**: Discard resets the whole draft (both modes) to the baseline, and the bar text says so. The Suggested risk % calculator fields live in their own state, outside the draft, so they never count as unsaved changes.
- **AC-7**: Leaving Settings with unsaved changes (sidebar, mobile menu, or Log out) opens a dialog with Save and leave (primary, not red), Discard, and Stay. Escape and a backdrop click mean Stay. If Save fails, you stay on Settings. The dialog lives in `App`, and the mobile menu closes before it opens. Clicking Settings while on Settings, tab switches, and Demo/Real switches never open the dialog.
- **AC-8**: When Masaniello is the style for the shown mode, Risk sizing, Milestone base sizing, and the Suggested risk % calculator are hidden, replaced by one line: "Masaniello sizes stakes from its own capital." Their saved values stay in the draft and in the saved row. The between sessions tier sync keeps running unchanged.
- **AC-9**: Session rules shows Trade management style (the three cards), Strict Session Locking, and Session duration per style only when the style is Fixed Risk %. For the other styles, those three are replaced by one note naming the active style and how it ends sessions, using the existing text at `Cfg` (Masaniello branch versus Anti Martingale and Profit Lock branch). Sessions per day and the Alerts group show for every style.
- **AC-10**: Help text follows one rule: one short sentence under the field, with detail in the existing `InfoTip`. Each removed paragraph moves verbatim into that field's `InfoTip`, so no explanation is lost. The escalating style note appears once (top of Session rules). "Applies from the next session" appears once (the Save notice, AC-5), not beside fields. The "Overridden by", "Disabled", and per field "regardless of mode" notes are removed. The Fixed Risk % panel shows one line: "Fixed Risk % uses the base stake above. Sessions end by the Session rules tab." The Sessions per day line is rewritten to match what the code does (see Follow-up).
- **AC-11**: Masaniello inline errors stay. Save keeps the last saved value for an errored Masaniello field (spec 0004 AC-2) and still saves the rest. Whenever any Masaniello field has an error, clean or dirty, the Save bar says "N Masaniello fields (Demo or Real) not saved", naming the mode that holds them.
- **AC-12**: No setting regresses. For every control, changing it and saving writes the same key and value shape as before this change. No schema or migration change.
- **AC-13**: On a phone width screen the tab bar scrolls sideways and the Save bar fits without covering the last field. Tabs follow the ARIA tabs pattern: one tab stop, Left and Right arrows move between tabs, Home and End jump to the first and last, each tab has `aria-controls` pointing at a `role="tabpanel"`. Every button is reachable by keyboard.
- **AC-14**: Danger zone "reset with balances" also sets `startingBalance*` to 0 in both the draft and the baseline, so the bar stays clean and the next Save cannot write the old balance back.

## Decision

**Chosen option**: Option 1: Tabs, one section at a time with a sticky Save bar

Rebuild `Cfg` as a sticky header (mode badge plus tab bar), one tab body at a time, and one sticky Save bar, with all state staying in the existing draft `f`.

**Implementation skills**: `vercel-react-best-practices` (`vercel-labs/agent-skills`, `.agents/skills/vercel-react-best-practices/`)

## Feature design

**Data model sketch**: No change. The `settings` row, `toSettingsRow`, and `fromSettingsRow` stay as they are.

**Section map** (each setting in exactly one place; keys keep their `Demo` and `Real` suffix for the shown mode):

| Tab | Content | Keys |
|---|---|---|
| Account | Starting balance, broker min withdrawal | `startingBalance{Mode}`, `brokerMin` |
| Money management | Style picker | `moneyMgmtStyle{Mode}` |
| | Risk sizing (hidden under Masaniello) | `riskMode{Mode}`, `riskPercent{Mode}`, `riskAmount{Mode}` |
| | Milestone base sizing with tier panel (hidden under Masaniello) | `mbEnabled{Mode}`, `mbDemotionBufferPct{Mode}` |
| | Style fields: Fixed shows one line pointing to Session rules; Anti Martingale; Profit Lock; Masaniello (`MasanielloSettings`, help text trimmed) | `am*`, `pl*`, `ms*` |
| | Suggested risk % calculator, collapsed, last (hidden under Masaniello) | scratch `riskCalc*`, writes `riskPercent{Mode}` only via Apply |
| Session rules | Trade management style (Fixed only) | `tradeStyle{Mode}` |
| | Sessions per day (all styles) | `sessionsPerDay` |
| | Strict Session Locking (Fixed only) | `strictLocking{Mode}` |
| | Session duration per style (Fixed only) | `sessionDurations` |
| | Alerts group: sound, volume, Test, desktop alerts (all styles) | `soundAlertOn`, `alertVolume`, `desktopAlertOn` |
| Strategies | List, edit, delete, add | existing strategy actions |
| AI | Provider, OpenRouter or Groq key | `aiProvider`, `apiKey`, `groqApiKey` |
| Danger zone | Reset Demo, Real, All, include balances | `resetAccount` |

**State**:
- `f`: the draft, as today (both modes held at once; the shown mode picks a slice).
- `baseline`: snapshot of `f` at mount, then the exact object sent when each Save started. `dirty` = deep compare of `f` and `baseline` (`sessionDurations` is an object). Never compared against `settings`, because `'100'` versus `100` would always read dirty.
- `calc`: the Suggested risk % calculator values, in their own `useState` outside `f`. The mode effect that refills them no longer writes into the draft.
- `newStrat`: name and description inputs, in `Cfg`.
- `tab`: open tab id, default `account`.
- Save states: idle, saving, saved (2 s), error text, active session notice.

**Value sourcing**:
| Action | Value produced / displayed | Source |
|---|---|---|
| Header badge | Shown mode | `mode` prop from `App` (sidebar toggle) |
| Unsaved changes bar | dirty flag | deep compare of draft `f` with `baseline` |
| Save failure | previous settings to restore | `settings` value captured at the start of `saveSettings` in `App` |
| Reset with balances | new draft and baseline balances | 0 for `startingBalanceDemo` and `startingBalanceReal`, as `resetAccount` writes them |
| Save | payload | `persistSettings({...f, startingBalance* parsed})`, which adds `activeMode` and `mbTier*` from the live `settings` prop |
| Save | active session notice | `getActive(ss)` from the `ss` prop |
| Save bar | Masaniello not saved count and mode | `msFieldErrors(f, 'Demo')` and `'Real'` (existing), count per mode |
| Leave dialog | whether to open | `guardRef.current.dirty`, registered by `Cfg`; `App` owns the dialog and the pending target view or log out |
| Leave dialog | Save and leave | `guardRef.current.save()`, returns success or failure |
| Style note (AC-9) | style label and end rule text | `mmStyleLabel(f.moneyMgmtStyle{Mode})` and the existing Masaniello versus Anti Martingale and Profit Lock text in `Cfg` |
| Masaniello line (AC-8) | whether Masaniello is on | `f.moneyMgmtStyle{Mode} === 'MASANIELLO'` |

**Key invariants**:
- The saved row never loses `activeMode` or `mbTier*` (already true through `persistSettings`).
- Only Save and the Danger zone write account data. Draft edits never write.
- The draft is never re seeded from props while open, so a mid edit never resets. The only outside write to a draft key is the reset with balances (AC-14).
- A failed save leaves `App` settings exactly as before the attempt.
- Hidden values (Risk sizing, Milestone sizing under Masaniello) stay in the payload unchanged.

**Security model**: No change. Rows stay scoped to the signed in user by existing Supabase Row Level Security (rules that limit each user to their own rows). API keys stay in the same field and are not logged.

**Configuration required**: none.

**Critical test scenarios**:
- Open Settings: six tabs in order, Account selected, one body rendered, verifies **AC-1**.
- Edit a field, switch tabs and back: value kept, verifies **AC-1**, **AC-6**.
- Edit a field: bar shows Unsaved changes. Discard restores. Save writes once and shows Saved, verifies **AC-4**, **AC-5**, **AC-6**.
- Save rejects with an error: bar shows it, draft kept, verifies **AC-5**.
- Change style on the picker: no `saveSettings` call until Save, verifies **AC-3**, **AC-4**.
- Pick Masaniello: Risk sizing, Milestone sizing, and calculator gone, one line shown, values still saved, verifies **AC-8**.
- Pick Anti Martingale: Session rules shows one note, no cards or duration, Alerts and Sessions per day visible, verifies **AC-9**.
- Dirty draft then click a sidebar view or Log out: dialog with three actions. Stay, Escape, and backdrop keep you here. Failed save keeps you here, verifies **AC-7**.
- Save rejects: `App` settings equal the pre save values, verifies **AC-5**.
- Double click Save: one write, verifies **AC-4**.
- Reset with balances, then Save: old balance is not written back, verifies **AC-14**.
- Type in Add strategy, switch tabs and back: text kept, bar stays clean, verifies **AC-1**.
- Arrow keys, Home, End move between tabs, verifies **AC-13**.
- Switch mode with a dirty draft: no dialog, draft kept, verifies **AC-2**, **AC-7**.
- Masaniello error field plus Save: other fields saved, bar names the skipped count, verifies **AC-11**.
- Save payload equals the old key and value shape for each control, verifies **AC-12**.

## Build plan

Tracer Bullet: first a thin thread through shell, draft, and Save, then thicken.

1. Thin thread: sticky header with mode badge, tab bar, and Save bar (dirty, Save, Discard, error) in `Cfg`. Move existing blocks under their tabs without changing their inner controls. One real save end to end. Export `Cfg`. Satisfies **AC-1**, **AC-2**, **AC-4**, **AC-5**, **AC-6**, **AC-12**.
2. Remove instant writes: `applyStyle`, `applySessions`, `applyStrictLocking`, and `applyMoneyMgmtStyle` become draft edits. Move the active session notice to Save and drop the strict lock `alert()`. Make `saveSettings` in `App` restore previous settings on error. Move `riskCalc*` into its own state. Lift `newStrat*` into `Cfg`. Disable the mode toggle while saving. Handle reset with balances in draft and baseline. Satisfies **AC-4**, **AC-5**, **AC-6**, **AC-14**.
3. Money management: one style picker, Masaniello hides Risk sizing, Milestone sizing, and calculator with one line, calculator last. Delete `mmTab` and the Active style switch. Satisfies **AC-3**, **AC-8**.
4. Session rules: regroup trade style cards, sessions per day, strict locking, durations, and the Alerts group, with one note for non Fixed styles. Satisfies **AC-9**.
5. Help text pass: one sentence per field, detail into `InfoTip`, remove the repeated notes and mode suffixes. Satisfies **AC-2**, **AC-10**.
6. Leave guard: `guardRef` registered by `Cfg`, a request function in `App` used by sidebar, mobile menu, and both Log out buttons, a three action dialog in `App` (Save and leave primary, Escape and backdrop mean Stay). Satisfies **AC-7**.
7. Masaniello skipped field hint in the Save bar, shown clean or dirty. Satisfies **AC-11**.
8. Phone width and ARIA tabs keyboard pass. Satisfies **AC-13**.
9. Tests in `src/App.test.js` for the scenarios above. Satisfies **AC-1** to **AC-14**.

## Consequences

**Positive**:
- Short, scannable page. Each setting has one home.
- One save rule. No surprise writes.
- Dead Masaniello controls gone.

**Negative / tradeoffs**:
- You cannot edit an inactive money style's fields without choosing it in the draft first.
- Anyone used to instant buttons must now press Save.
- A larger diff touching `Cfg` and the nav wiring in `App`, with no existing Settings tests to catch regressions until step 9.

**Neutral**:
- Tab choice resets to Account on each visit.
- The leave dialog is a new three action dialog in `App`, since `ConfirmDialog` is red and has two buttons.
- The first run setup screen (the older `useState` near `Analyzer`) is not changed.

## Follow-up

- [ ] The Sessions per day help text says "projections only, sessions no longer gate trade logging", but `canStart` in `App` also reads `sessionsPerDay`. Check the real behavior before writing the new line.
- [ ] No `beforeunload` prompt is planned for closing the browser tab. Add one if data loss is reported.

- [ ] Consider remembering the last open tab if repeat edits feel slow.
- [ ] Check the section map again when scope features 5 and 6 (Masaniello daily goals and recommender) are designed, since they will add Masaniello fields.
