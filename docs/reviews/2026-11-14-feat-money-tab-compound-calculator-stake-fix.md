# Review, feat/money-tab-compound-calculator (stake fix), 2026-11-14

**Reviewed by**: claude-opus-5-5 (author on a different model)
**Scope**: 2 files, uncommitted
**Verdict**: Blocked

## Summary
The change replaces the proportional Masaniello stake `rc * (1 - W[n-1][k] / W[n][k])` with a fixed-target stake `(T * W[n-1][k-1] - rc) / p`, where `T = msCapital / W[N][K]`. It is algebraically identical on plan (checked: the recurrence gives `T*W[n-1][k-1] - T*W[n][k] = p*T*(W[n][k] - W[n-1][k])`) and it fixes the reported case (207.09, 9/2, W L($1) W ends at 210.10 vs target 210.11, old 209.73). Off plan, though, the win branch is forced back onto plan and the whole deviation moves to the loss branch, where each loss multiplies it by `(1+p)/p` (about 2.09 at 92%). A deficit grows with every loss. Under the payout drift that spec 0004 calls normal (85% real vs 92% plan), this turns a $0.38 shortfall fix into cycles that win K trades and still lose most of their capital.

## Blockers

### 🔴 Fixed target stake makes payout drift compound into ruin, `src/App.js:1634-1635`
**Problem**: Write the deviation from plan as `d = rc - T*W[n][k]`. After a loss, the new formula leaves `T*W[n-1][k] + d*(1+p)/p`, so the deviation more than doubles on every loss. An under-paid win (85% instead of 92%) creates a deficit, which the later losses then amplify, and later stakes rise to chase the fixed target. I ran all 1024 outcome paths of 10/6 at a 92% plan with 85% real payout. Two values were Old: 0 and New: 172 in the run, but the run showed they don't count early ruin as labelled (see Test coverage), so I left them out.
- Lowest final capital on a path that reaches K = 6 wins: **old $186.35, new $5.96**
- Win paths that end **below the starting $100**: **old 0, new 12**. Example: path W L L L W W W W L W ends at **$12.60 new, about $198 old**.

At minimum capital (3.24, 92%, no drift), the $1 raises do the same thing. The lowest final capital on a winning path drops from $1.77 to $0.96.
**Why it matters**: This is real money management. Spec 0004 (rationale.md:21 and :46, verify.md:39) says outright that payouts move per trade and that live recompute keeps paths "on plan proportionally". The fix removes that property: a user who hits the required win count can still lose most of the cycle's capital, and stakes rise sharply while behind. That is worse than the bug it fixes, a final win that falls short by cents.
**Suggested fix**: Keep the proportional formula. It is the spec's decision and it is robust to drift. Fix the reported shortfall at its root, the $1-minimum residue, not by re-anchoring every state. Two options:
- (a) Use the fixed-target top-up only at k = 1, the last win needed, where it cannot compound: stake = max(proportional, (T - rc)/p), still clamped to rc.
- (b) Accept the residue, as spec 0004 index.md:63 already says ("lands near, not exactly on").

Re-anchoring off-plan states to a fixed target is a load-bearing change of design, so take it to /architect and update spec 0004 before shipping it.

## Major

### 🟠 Contradicts the governing spec without updating it, `src/App.js:1625-1635`
**Problem**: Spec 0004 index.md:63 defines the live stake as `min(rc, max(1, round2(rc * f)))` with `f = 1 - W(n-1,k)/W(n,k)`. Test plan item index.md:160 ("next stake equals running capital × f") and rationale.md:46 also depend on that formula. The header comment at App.js:1580-1584 still describes the proportional model. The diff rewrites the drift test to match the new formula instead of the spec.
**Why it matters**: The spec and the code now disagree about the core money formula. /check verify (verify.md:39) would fail against the spec wording.
**Suggested fix**: Either keep the spec formula (see the blocker), or route the change through /architect and update index.md:63, :160, the rationale, and the App.js header comment.

### 🟠 Tests mirror the implementation and miss the drift risk, `src/Masaniello.test.js:47-82`
**Problem**: The rewritten drift test (47-54) recomputes the new formula inside the test, so it checks the formula against itself and does not check behavior. No test plays full paths with off-plan payout. The existing `play` helper takes `payoutPct`, but every caller uses 92. "behind plan" (79-82) asserts only `<= 10`, which any clamped value satisfies. "k = 1" (66-72) uses an arbitrary state (sPnl 120) that no real path reaches.
**Why it matters**: The blocker above passes all 66 tests.
**Suggested fix**: Add a property-style test. Enumerate or sample paths with `play(outcomes, 85)` and assert every path that reaches K wins ends at or above `msCapital`, and close to `capitalFinal` within a tolerance. Keep the 207.09 regression. Assert the exact stake in the behind-plan case.

## Minor

### 🟡 Reasoning line shows a negative plan, `src/App.js:1645`
**Problem**: When the cycle is ahead of plan, the plan goes negative (for example `rc 300` at 5W/0L on 100 capital gives plan -72.82). The line then reads "plan $-72.82, raised to the $1 minimum". When `rc < 1`, the stake is `rc`, not $1, but the same "raised to the $1 minimum" text still appears.
**Suggested fix**: Show the "raised" text only when `0 < plan < 1` and `stake === 1`, or reword it for an ahead-of-target state.

### 🟡 Divide by zero when `msPayoutPct` is missing, `src/App.js:1635`
**Problem**: `session.msPayoutPct / 100` is a divisor now. A session row with `msN` set but `msPayoutPct` null (App.js:354 maps missing values to null) gives p = 0, so `0/0`, then `NaN` stake, then `$NaN` on the Dashboard. The old formula returned $1 in that case. New sessions always get a payout of at least 1 from `getMsPayoutPctForMode`, so only legacy or hand-edited rows are exposed.
**Suggested fix**: Guard with `!(session.msPayoutPct > 0)`, returning null, or reuse the payout getter's fallback.

## Nits
- ⚪ `src/App.js:1580-1584`: the header comment still says stakes are "recomputed live from running capital" so drift "self-corrects". This is no longer true under the new formula.
- ⚪ `src/App.js:1634`: `target` is recomputed on every call along with the full `msTable`. That is fine at N ≤ 20. Noting it only because `msLossLimitFromStopLoss` calls it in a loop.

## Strengths
- The on-plan equivalence is real. I verified it algebraically, and the existing wins-first, losses-first and loss-limit path tests still pass (66/66).
- The 207.09 regression test reproduces the reported bug exactly. It fails on the old formula (209.73 < 210.10) and passes on the new one.
- `msLossLimitFromStopLoss` results are unchanged for all existing cases, because a straight losing run stays on plan apart from the $1 raises.

## Test coverage
The reported case and some clamp edges are covered. Full-path behavior under off-plan payout is not, and that is where this change regresses. The drift test checks the implementation against itself. Simulation script used for the numbers above: C:\Users\Admin\AppData\Local\Temp\claude\1f222f2112fe00c8\9f4f1413-70db-4e81-9234-9456530c99d2\scratchpad\sim.js
