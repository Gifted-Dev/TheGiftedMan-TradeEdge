# Verify: Masaniello money management style · spec 0004 · updated 2026-11-12
_Steps derived from spec 0004 acceptance criteria. `/check verify` runs these; `/test` locks the durable ones._

## UI / manual
- [ ] Settings, Money Management, Demo: the Active style switch and the tabs both list "Masaniello". Pick it for Demo, switch the sidebar to Real, and confirm Real still shows its own style → AC-1
- [ ] Masaniello tab: four inputs show (Capital $, Total trades N, Win trades K, Payout %). Capital placeholder shows the current Demo balance when unset → AC-2
- [ ] Type N = 21, K = 10 with N = 10, Payout = 0: each shows an inline error; press Save settings, reload, and confirm the old values are still stored → AC-2
- [ ] Set N = 10, K = 6, then lower N to 5: the K error shows until K is 4 or less → AC-2
- [ ] With capital $100, N 10, K 6, payout 92: summary shows Capital final $233.01, Win profit +$133.01, Required win rate 60.0%, Stop Loss $100.00 (at Stop Loss 100%), Max Loss Limit 5 losses, and the note "Assumes every trade pays the planned payout" → AC-3
- [ ] Set the mode balance to $0 (or below): Account gain shows "n/a" → AC-3
- [ ] With N 10, K 6, payout 92: Minimum capital shows $3.24. At $3.24 the first stake is $1.00. Later states that plan under $1 show Stake $1.00 with "(plan $X, raised to the $1 minimum)" → AC-3, AC-21
- [ ] Settings shows five inputs including Stop Loss % (default 100). With capital $100 and Stop Loss 20, Stop Loss shows $20.00 and Max Loss Limit shows 5 losses. Losing $20 inside a cycle does not end it → AC-2, AC-3
- [ ] Set capital one cent below the shown Minimum capital: Dashboard and Quick Log show "Capital below minimum $X for 6 of 10" and Start session is disabled → AC-4
- [ ] Set capital above the mode balance: "Capital is more than your balance" shows and start is refused → AC-4
- [ ] Leave capital empty, start a cycle, then win one trade and start the next cycle after it ends: the new cycle's capital is the balance at that moment → AC-4
- [ ] Start a cycle, then change N to 8 in Settings and save: Quick Log still shows Wins x / 6 and Losses y / 5 for the running cycle → AC-5
- [ ] Dashboard Next stake and Quick Log stake show the live stake ($30.89 for the first trade of 6 of 10 at $100) with "Need 6 more wins in 10 trades. Stake $30.89." → AC-6
- [ ] Quick Log rows show Stake, Return (the trade's pnl) and Balance after, folding from the cycle capital, not the account balance → AC-7
- [ ] Log a Draw: Wins, Losses, and the next stake do not change → AC-8
- [ ] Six wins end the cycle with "target reached: 6 wins"; five losses end it with "loss limit reached: 5 losses"; no countdown ever ends it → AC-9
- [ ] End a cycle with End session: session row carries endReason MS_MANUAL → AC-9
- [ ] Masaniello tab "Today's events": Won counts MS_TARGET sessions today, Lost counts MS_LOSS_LIMIT, manual endings count as neither → AC-10
- [ ] Lose 4 trades inside cycles: no day lock. End two cycles on MS_LOSS_LIMIT: the mode locks for the day with the loss target message → AC-11
- [ ] Mid cycle, reload the page: Settings values and the cycle's Wins and Losses are unchanged → AC-12
- [ ] Ask the assistant "which money management styles exist": it names four, including Masaniello's K of N mechanics → AC-13
- [ ] Journal manual entry during a cycle: the default stake equals the live Masaniello stake; overriding it to another amount moves running capital by the real result and the next stake recomputes → AC-14
- [ ] Log a Pending trade from the Journal during a cycle, then try a second log from Journal, Analyzer, and Quick Log: each refuses with "Resolve your pending trade first" → AC-15
- [ ] After a cycle ends, Quick Log offers no late grace row for Masaniello → AC-16
- [ ] With capital invalid and no active session, save a Journal entry dated today: start is refused with the reason and the trade is not saved → AC-17
- [ ] Leave a cycle active past midnight: the next day it no longer appears and today's Won and Lost counts do not include it → AC-18
- [ ] Flip a cycle WIN to LOSS in Quick Log (or delete a cycle trade in Journal): Wins and Losses recount and persist after reload; an ended cycle is never reopened → AC-19
- [ ] Start buttons and the Dashboard timer show "No time limit" for Masaniello → AC-20

## Value sourcing
- [ ] Capital default: clear msCapital, change the balance, confirm the placeholder and the next cycle's capital follow the balance
- [ ] Summary metrics: change N, K, payout one at a time and confirm each metric moves live
- [ ] Events won and lost: switch Demo and Real and confirm each counts only its own mode
- [ ] Next stake running capital: make a Real withdrawal mid cycle; the next stake does not change (it reads msCapital + sPnl, not balance)
- [ ] Next stake payout: log a win at 85% under a 92% plan; the next stake uses the planned 92% fraction applied to the lower running capital
- [ ] Trade row return: a win logged at 85% shows pnl at 85% of its stake
- [ ] Pending block: a Pending trade from yesterday's same numbered session does not block today's cycle
- [ ] Start label: switch style between Anti-Martingale (60m) and Masaniello (No time limit)

## Commands
- [ ] `CI=true npm test -- --watchAll=false src/Masaniello.test.js` → 8 tests pass (math, paths, draw, k = n, drift, minimum capital, bounds, validation) → AC-2, AC-3, AC-6, AC-8, AC-9
- [ ] `npx eslint src/App.js` → no output

## Acceptance-criteria coverage
- AC-1 to AC-20 each covered by the UI step tagged with it; AC-2, AC-3, AC-6, AC-8, AC-9 also by the command step.
