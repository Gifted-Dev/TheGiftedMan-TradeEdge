# Review, feat/money-tab-compound-calculator (Full capital, spec 0004 AC-22), 2026-11-14

**Reviewed by**: claude-opus-5-5 (author on unknown model)
**Scope**: 4 files (src/App.js, src/Masaniello.test.js, spec 0004 index.md + rationale.md), uncommitted
**Verdict**: Approve with nits

## Summary
Adds `msFullCapital` and a `fullCapital` field on `msPlanSummary`, shows a non blocking "Full capital" line plus warning in the Masaniello Settings summary, and tightens the `msStakeReasoning` "raised to the $1 minimum" condition. The formula is correct: I brute forced every path for 10/6/92, 3/1, 3/2, 20/19, 9/2, 10/6/100 and 20/1/100 and the closed form matched every time (10 of 6 at 92% = $21.50, 9 of 2 = $326.30). No stake function changed, the warning appears only in `MasanielloSettings`, and no top up leftovers remain in `src/`. The issues: low payout inputs render `$Infinity`, the reasoning fix has no test, the main AC-22 math assertion is close to a tautology, and App.js carries unrelated Groq model id hunks.

## Minor

### 🟡 Low payout renders "Full capital $Infinity.", `src/App.js:1595-1599`, `src/App.js:8091`
**Problem**: With payout 1% (allowed, `msFieldErrors` accepts 1 to 100) and K=1 or K=10 at N=20, `W[n][k] - W[n-1][k]` underflows to exactly 0 in floating point at state (9,1), so `gap` is 0 and `fullCapital` is `Infinity`. `f$` then prints `$Infinity`. Low but finite cases can also return values of 1e15 or more, which `toFixed` shows in full or in exponent form.
**Why it matters**: A user reads a broken number in a money panel. Edge input only, but reachable from the form.
**Suggested fix**: When `fullCapital` is not finite, or is above a sane ceiling (for example 1e9), show a short phrase such as "Full capital: not reachable at this payout" and keep the warning.

### 🟡 `msStakeReasoning` condition change has no test, `src/App.js:1650`
**Problem**: The new rule (note only when `0 < plan < 1` and `stake >= 1`) fixes two wrong notes: plan rounded to $0.00, and running capital under $1 where the stake is capped at `rc`. No test in `src/` asserts the reasoning string at all (grep for "raised to the", "plan $" and "Need N more" in tests finds only the Settings warning).
**Why it matters**: It is branching display logic that already regressed once. Display only, so Minor, not Major.
**Suggested fix**: Add three cases: plan $0.62 gives the note; rc $0.80 with plan under $1 gives no note; a normal stake above $1 gives no note.

### 🟡 AC-22 math test's main assertion is close to a tautology, `src/Masaniello.test.js:58-68`
**Problem**: `lowest` is built from `liveMasanielloNextStake`, which already returns `max(1, plan)` capped at running capital. `expect(lowest).toBeGreaterThanOrEqual(1)` therefore only fails if running capital drops under $1, not if a plan stake falls under $1. The useful half is `rawLow(21.49) < 1`. Nothing checks the raw plan at $21.50.
**Why it matters**: A wrong `fullCapital` that is too low would still pass the first half.
**Suggested fix**: Add `expect(rawLow(fullCapital)).toBeGreaterThanOrEqual(1)` (or drop `run` and use `rawLow` for both sides). Both replays are copies of the same walker, so share one helper.

### 🟡 UI test skips "Start stays enabled", `src/Masaniello.test.js:595-608`
**Problem**: The spec's test plan for AC-22 says "Start stays enabled either way". The test checks the copy only.
**Why it matters**: The non blocking part of the contract has no guard. A later change could gate Start on `fullCapital` and still pass.
**Suggested fix**: In the same test, assert the Start control is enabled while capital is 20, or add the case to an existing Start gate test.

### 🟡 Unrelated Groq model id change in this diff, `src/App.js:2024`, `2043`, `2076`, `8725`
**Problem**: `qwen/qwen3.6-27b` changes to `qwen/qwen3.8-27b` in four places, paired with the README edit that the brief calls out of scope. It has nothing to do with AC-22, and this review could not verify the new model id.
**Why it matters**: If it ships inside the AC-22 commit, a wrong model id breaks every Groq AI feature, and the cause is hard to trace from history.
**Suggested fix**: Keep it out of the AC-22 commit. Commit it with README.md separately, after you confirm the id is live on Groq.

## Nits
- ⚪ `src/Masaniello.test.js:47`, the renamed test "drift: while k > 1 the next stake ..." is left over from the rejected k = 1 top up rule. With proportional stakes the rule holds for every k, so restore the old name.
- ⚪ `docs/specs/0004-masaniello-money-management-style/rationale.md:52`, the heading "(last win top up, AC-22)" names the rejected option. Something like "(Full capital warning, AC-22)" would match what shipped.
- ⚪ `docs/specs/0004-masaniello-money-management-style/index.md:40`, AC-22 sits above AC-21. Move it below to keep the numbering in order.
- ⚪ `src/App.js:1598` and `src/App.js:1605`, the same "ceil to cent minus 1e-9" expression appears twice. A small `ceilCent` helper would remove the copy (optional).

## Strengths
- The closed form is exact and cheap (O(N*K)), the reachable state filter `n - k <= N - K` is correct, and the comment explains why the minimum gap gives the threshold.
- The UI handles NaN, empty and auto copy capital through the existing `valid && capital > 0` guard, and the warning is only a colour and copy change with no gate. That matches the AC-22 wording.
- The rationale records why the top up options were rejected, with numbers. Good durable context.

## Test coverage
Covered: the value $21.50, the one cent lower check, the screenshot case stake of $1.32, and the Settings warning showing and hiding. The Masaniello suite passes (65/65). Untested: the reasoning wording branch, the raw plan stake at exactly `fullCapital`, Start staying enabled, and the extreme payout display.
