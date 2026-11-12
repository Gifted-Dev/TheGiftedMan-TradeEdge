# 0004 · Masaniello Money Management Style: rationale

Decision record split from [index.md](index.md).

## Context

Money management today lives in `src/App.js`. `MM_STYLES` (App.js:53) lists three styles, chosen per mode (Demo or Real) through `moneyMgmtStyleDemo` and `moneyMgmtStyleReal` in settings. Anti-Martingale and Profit Lock are "escalating styles" (`isEscalatingStyle`, App.js:1498). That flag does four things: it swaps Trade Management's session ending rules for the style's own check (`checkEscalatingSessionEnd`), it exempts the mode from the 4 losses per day circuit breaker, it counts loss target sessions toward a 2 per day lock (`isAmPlDailyLocked`), and it forces a fixed 60 minute session cap (`getEffectiveSessionDuration`). Stake logic flows through three dispatchers: `liveEscalatingNextStake`, `escalatingStakeReasoning`, and `advanceEscalatingStake`. Quick Log only works for escalating styles and already shows a per trade row list with balance after each trade (App.js:5434).

Settings and session state persist in Supabase `settings.extra` and `sessions.extra` (jsonb, a flexible JSON column). Both go through explicit key whitelists when mapped to rows (settings near App.js:270, sessions near App.js:343). A key missing from those lists silently vanishes on reload.

Masaniello is a classic staking plan. Given a payout, N trades, and K required wins, there is exactly one stake for every possible state (trades left, wins still needed) such that any path reaching K wins ends on the same final capital, and any path reaching N minus K plus 1 losses ends at zero. It is all or nothing on the capital allocated to the cycle. Binary options payout changes from trade to trade, while the math assumes one fixed payout. Brokers also enforce a $1 minimum stake, which a large N can push early stakes below.

Without this, a trader who uses Masaniello has to compute stakes in an outside tool and copy them in by hand, which breaks the app's session tracking and circuit breakers.

## Options considered

### Option 1: Masaniello as a new escalating style engine, live recompute from running capital
Add `MASANIELLO` to `isEscalatingStyle` and the three dispatchers. Stakes come from the closed form fraction table (see *Masaniello math*) applied to the cycle's running capital after every trade, so real payout drift self corrects.
**Pros**:
- Reuses every existing hook: session end check, daily lock, Quick Log, reasoning line.
- Self correcting: a trade that paid 85% instead of the planned 92% just lowers running capital, and the next stake rebalances.
- No migration; fits the `extra` jsonb convention.
**Cons**:
- `isEscalatingStyle` currently implies the 60 minute cap, so that one branch needs an exception.
- About 25 call sites read `isEscalatingStyle`; each needs a quick check.

### Option 2: Precomputed stake table frozen at cycle start
Compute the whole (n, k) stake grid in dollars when the cycle starts and look stakes up.
**Pros**:
- Stakes are exactly what the preview promised.
**Cons**:
- Real payout differences push the final capital off target, and nothing corrects it.
- Bigger session payload to persist.

### Option 3: Separate Masaniello session engine outside the escalating group
A parallel code path with its own end check, lock, and UI.
**Pros**:
- No risk of disturbing AM or PL.
**Cons**:
- Duplicates the dispatch, lock, and Quick Log wiring; every future change lands twice.

## Rationale

The escalating group already carries exactly the behavior the engineer chose for Masaniello: own session end rules, exemption from the 4 loss rule, and the 2 per day loss target lock. Reusing it means Quick Log, Dashboard, and the reconciliation effect pick up Masaniello through the dispatchers instead of a third parallel branch. The only mismatch is the 60 minute cap, handled by one exception that sets `durationMin` to null (the existing code already treats a null duration as "never time expires", App.js:1652).

Live recompute is chosen over a frozen table because binary payout moves per trade. Masaniello's stake is a fraction of current capital for a given (n, k) state, so applying that fraction to real running capital keeps every path on plan proportionally. A frozen table drifts and never recovers. The cost is that the final capital can land a little off the preview when payouts differ, which is honest and expected.

Blocking the start below minimum capital (instead of flooring stakes at $1) keeps the plan mathematically exact at the start.

**Update 2026-11-12 (spreadsheet alignment).** The engineer's spreadsheet defines minimum capital as the capital whose first stake is $1, not the capital that keeps every later stake at $1 or more. The original rule demanded $21.50 for 6 of 10 at 92%; the spreadsheet rule asks $3.24. The cost is that later stakes can fall under $1. Two ways to handle that were weighed: show the real amount like the spreadsheet, or raise it to $1. Raising was chosen, because the app places real trades and the broker rejects stakes under $1, while a spreadsheet only calculates. The price is a small drift from the target, which the live recompute from running capital already absorbs. The reasoning line names the plan amount when it raises, so the trader still sees the sheet's number. Stop Loss became a dollar line from a Stop Loss % and Max Loss Limit became the loss count, to match the sheet's labels. The engineer chose display only for Stop Loss (it does not end the cycle), which keeps `MS_TARGET`, `MS_LOSS_LIMIT`, and `MS_MANUAL` as the only end reasons.
