# Verify: Settings page reorganization · spec 0005 · updated 2026-11-12
_Steps derived from spec 0005 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Open Settings → six tabs in order (Account, Money management, Session rules, Strategies, AI, Danger zone), Account open, one body shown → AC-1
- [ ] Type in Add strategy (Strategies tab), switch tabs and back → text kept, bar still says "No changes" → AC-1
- [ ] Flip sidebar Demo/Real while Settings is open → badge and values change, draft kept, no dialog → AC-2, AC-7
- [ ] Money management → pick a style → only that style's fields show, no second Active style control → AC-3
- [ ] Change a style, sessions per day, strict locking, trade style → nothing saves until Save is pressed → AC-4
- [ ] Press Save twice fast → one write, bar shows Saved for about 2 s → AC-4, AC-5
- [ ] Start a session, change a setting, Save → Saved plus "Changes start from your next session", no `alert()` → AC-5
- [ ] Break the network, Save → error in bar, draft kept, other pages still show old values → AC-5
- [ ] Edit, press Discard → both Demo and Real revert, calculator fields never mark the bar dirty → AC-6
- [ ] Edit, click another sidebar item, then Log out, then mobile menu item → dialog with Save and leave (blue), Discard, Stay. Escape and backdrop stay → AC-7
- [ ] In that dialog make Save fail → you stay on Settings, error in bar → AC-7
- [ ] Click Settings while on Settings with edits → no dialog → AC-7
- [ ] Pick Masaniello → Risk sizing, Milestone sizing, calculator gone, one line shown. Pick Fixed again → old values still there → AC-8
- [ ] Anti Martingale or Profit Lock → Session rules shows one note; Sessions per day and Alerts still show → AC-9
- [ ] Fixed Risk % → Session rules shows trade style cards, Strict locking, durations → AC-9
- [ ] Scan all tabs → one short sentence per field, detail in `?` tips, no "Overridden by"/"Disabled" notes, no mode suffix on labels → AC-2, AC-10
- [ ] Type N = 99 in Masaniello, change balance, Save → balance saved, N keeps old value, bar says "1 Masaniello field (Demo) not saved" → AC-11
- [ ] Danger zone → tick balances, Reset Demo → bar stays clean; edit another field and Save → old balance is not written back → AC-14
- [ ] Phone width (about 390 px): tab bar scrolls sideways, Save bar does not hide the last field → AC-13
- [ ] Tab key lands on the active tab only; Left, Right, Home, End move tabs → AC-13

## Commands
- [ ] `npx react-scripts test --watchAll=false src/Settings.test.js` → all pass → AC-1, AC-3, AC-4, AC-5, AC-6, AC-8, AC-9, AC-11, AC-13
- [ ] `CI=false npx react-scripts build` → compiles, no warnings → all
- [ ] Compare saved `settings` row before and after saving each control → same keys and value shapes → AC-12

## Value sourcing
- [ ] Header badge follows the sidebar mode (Demo then Real) → Configuring text matches → AC-2
- [ ] Dirty flag: set a field then set it back to its original → bar returns to "No changes" → AC-4
- [ ] Failure restore: after a rejected save, `App` settings equal the pre save values (Dashboard stake unchanged) → AC-5
- [ ] Reset with balances → draft and baseline balances are 0, Save payload carries 0 → AC-14
- [ ] Save payload keeps live `activeMode` and `mbTier*` (change mode mid edit, Save, mode not rolled back) → AC-5
- [ ] Active session notice reads `getActive(ss)` (shows only when any session is active) → AC-5
- [ ] Masaniello skipped count and mode: error in Real only, shown while viewing Demo → bar names Real → AC-11
- [ ] Style note text uses the shown mode's style label (Demo on AM, Real on Fixed, flip mode) → AC-9
- [ ] Masaniello line follows the shown mode's style (Demo Masaniello, Real Fixed, flip mode) → AC-8

## Acceptance-criteria coverage
- AC-1 … tab, strategy text steps · AC-2 … mode steps · AC-3 … style picker · AC-4 … no instant save, double save · AC-5 … save, failure, notice · AC-6 … discard · AC-7 … leave dialog steps · AC-8 … Masaniello · AC-9 … Session rules · AC-10 … help text scan · AC-11 … Masaniello skipped · AC-12 … row compare · AC-13 … phone and keyboard · AC-14 … reset balances
