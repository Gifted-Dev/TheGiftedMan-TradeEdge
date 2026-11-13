# Review, feat/money-tab-compound-calculator, 2026-11-13 (fourth pass)

**Reviewed by**: claude-opus-5-5 (author on a different model)
**Scope**: 9 files, branch vs main (merge base 70531c8, committed plus uncommitted plus untracked)
**Verdict**: Approve with nits

## Summary
This pass checks the fixes for the third review. The target reached latch in `msAlertEvents` is now one `{key, reached}` entry per mode, keyed by `${setAt}:${dollars}`. A key that differs from the stored one seeds silently, so editing back to an earlier goal can no longer chime. The stale history cache comment is reworded. A new test covers the raise, session end, revert sequence. Both third pass Minors are fixed, the growth nit is gone with them, and all 107 tests in the two suites pass. One nit from the third pass is still open.

## Nits
- ⚪ `src/App.js:8060`, still open from the third pass: "Counting sessions since" shows the date only, so two targets set on the same day look the same. Fine for now.
- ⚪ `src/Masaniello.test.js:322`, uses `.map(e => e.title)` where the rest of the block uses the `titles()` helper. Cosmetic.

## Fix verification
- `src/App.js:1797-1800`: `was` is `undefined` unless the stored key matches, so any edit (raise, lower, revert) seeds silently. Only a session end under an unchanged key can turn `false` into `true`. Clearing a target (`prog` null) leaves the old entry in place. A new target gets a fresh `Date.now()` `setAt`, so that old entry can never match again. Correct.
- Other readers of `prevReached`: `src/App.js:9417` resets it to `{}` on a user change and `src/App.js:9601/9608` pass the ref through. Neither looks inside the entries, so the shape change is safe. `src/Masaniello.test.js:331` still asserts `{}` while history is loading, which still holds because the loading branch `continue`s before any write.
- The object now holds at most two entries (DEMO, REAL), which closes the third pass growth nit.
- `src/App.js:9404-9405`: the comment now says edits keep `setAt` and reuse the cached read, which matches the code.
- The new test `editing the goal back to an earlier value gives no alert` would fail under the third pass code: a stale `:100` key with `false` would meet a reached profit of 110. It passes now.

## Strengths
- The fix is the smallest one that holds: one comparison against a per mode entry. There is no cleanup code, and memory stays bounded by design.
- The new test models the exact sequence from the review (seed, raise, session end, revert). It also checks that the session end in between still gives the "cycle lost" chime.

## Test coverage
107 tests pass (`src/Masaniello.test.js`, `src/CompoundCalculator.test.js`). The third pass gap (an edit back to an earlier goal after a session ends) is now covered. Still not covered: the errored target branch keeping `msTargetSetAt` on save (low risk, unchanged code), and an edit that lands in the same snapshot as a crossing session end (that flip is seeded silently while the cycle end chime still plays, which is acceptable and rare).
