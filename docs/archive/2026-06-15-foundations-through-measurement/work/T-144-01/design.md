# T-144-01 Design — glance-true-budget

## The decision in one line

`aggregateMultiAngle`'s deciding arithmetic becomes **budget policy v2** — *identity-first,
severity-aware* — and emits the **legacy ≤2 arithmetic beside it**, versioned, additive. The flat
`gapBudget:2` stays in config (legacy continuity, keeps committed records valid); a new
`minorBudget` parameter, **derived from the committed data**, is the v2 cap. The calibration is a
pure re-derivation sweep over committed gap lists, committed as its own record — **no judge calls,
no record re-banking**.

## The v2 formula

> **PASS (v2)** ⇔ the gate **decided** ∧ every judged view is **"same object"** (no drift, no
> "different object", no coverage short-circuit) ∧ **majorCount === 0** ∧ **minorCount ≤
> minorBudget**.
>
> **minorBudget = 10.** **gapBudget (legacy) = 2.**

`majorCount` / `minorCount` are tallied across **all** views from each view's committed
`gaps[].severity`. Per the parser contract (research §"Key structural fact"), a "same object"
verdict carries only minor gaps and a drifted/different verdict carries ≥1 major — so on a
glance-passing record `majorCount===0` is **implied** by "every view same object." We compute and
require `majorCount===0` **explicitly** anyway: it is self-documenting, it is the *severity-aware*
half the AC asks for, and it is robust to any future per-view parser relaxation. "Every view same
object" already excludes coverage-short-circuited views (their verdict is null, not "same object").

### Why identity-first, not budget-first

The reviewer decision (binding, 2026-06-12): *the budget must track the desired look; the glance is
the bar.* A build that reads as the same building from all four diagonals **passes the glance**; a
build that drifts at any angle **fails it** — regardless of minor count. So identity is the gate;
minors are diagnostics under a papercut guard. This inverts the old order (count-first, where 8
minor cosmetic notes sank a glance-passing barn).

### Deriving minorBudget = 10 (calibrate, then freeze)

The data (research):
- Glance-passing population (all-same-object, zero-major): **{8, 8, 2} minors** → observed ceiling
  **8**.
- Per-view parser cap `MAX_GAPS_PER_VIEW = 3` → structural ceiling **4 × 3 = 12** minors.
- **No committed all-same-object record looks bad** → no upper anchor; only the lower bound (8
  passes) and the structural ceiling (12) are real.

The cap must sit in `(8, 12)`:
- **8** (observed ceiling) leaves the barn anchors *on the boundary* (`8 ≤ 8`) — one extra cosmetic
  note in any future glance-passing build would sink it. Fragile; rejected.
- **12** (structural ceiling) equals the maximum a parser-valid all-same-object record can reach, so
  it **never bites** — not a guard at all. Rejected.
- **10** is the midpoint. A record hits it only at `>2.5` minor papercuts per view averaged — *more
  cosmetic hedging than any glance-passing build has ever shown* — while clearing both barn anchors
  with **2 units of headroom**. It is a real tripwire (bites at 11–12) and a calibrated, not
  declared, number. **Chosen.**

minorBudget is frozen as a **named op parameter** in `MULTI_ANGLE_GATE` with this derivation in its
doc comment — calibrated then frozen, not declared then frozen.

### Anchor check (the binding calibration — AC2)

| record | same/drift | major | minor | v2 | legacy ≤2 |
|---|---|---|---|---|---|
| barn-patternbook | 4/0 | 0 | 8 | **PASS** (0 maj, 8≤10) | FAIL 8/2 |
| barn-patternbook-saltcrag | 4/0 | 0 | 8 | **PASS** | FAIL 8/2 |
| synthetic-hut-current | 4/0 | 0 | 2 | PASS | PASS 2/2 |
| cottage-patternbook | 2/2 | 4 | 7 | **FAIL** (2 drift, 4 maj) | FAIL |

All four anchors land correctly. cottage-current (1 coverage view) is **noted, not re-scored**.

## Versioning & dual reporting (AC3)

**Version the policy, not the record envelope.** The record stays `multi-angle-gate/v1` (envelope
shape is unchanged + additive); a new `MULTI_ANGLE_BUDGET_SCHEMA = "multi-angle-budget/v2"` tags the
*aggregation arithmetic*. This mirrors the existing split (per-view `multi-angle-verdict/v1` ≠
record `multi-angle-gate/v1`) and keeps every committed-record reader (offline checker, head-to-head
schema assert) valid without an "accept v1-or-v2" fork.

`aggregateMultiAngle` DECIDE branch now returns (additive fields **bold**):
```
{ schema: "multi-angle-gate/v1",
  decided: true,
  passed,                       // ← NOW v2 (deciding)
  **policy: "multi-angle-budget/v2"**,
  **majorCount, minorCount, minorBudget: 10**,
  gapCount, gapBudget: 2,       // legacy fields KEPT (continuity)
  gaps, failures,               // failures now severity-aware (below)
  **legacy: { passed, gapBudget: 2, gapCount }**,   // the old ≤2 verdict, beside
  views }
```
- `failures` reasons under v2: a drifted/different view → `reason: verdict` (unchanged); a coverage
  view → `reason:"coverage"` (unchanged); the budget overflow becomes `{angle:"(all)",
  reason:"minor-budget"}` (was `"gap-budget"`). The legacy block records the old `"gap-budget"`
  outcome for continuity.
- `legacy.passed` = the **exact old rule**: `decided ∧ no identity/coverage failures ∧ gapCount ≤ 2`.
- The REFUSE branch is **byte-unchanged** (no policy/legacy on a refusal — there is no verdict to
  dual-report).

**Downstream producers** (head-to-head, receipts, milestone runners) read `aggregate.passed` (now
v2) and `aggregate.gapCount/gapBudget` (legacy fields, still present) — they keep working unchanged.
For *faithful* dual reporting we additively surface the policy: `gateRow` copies through
`policy`, `legacyPassed`, `majorCount`, `minorCount`, `minorBudget` (null when a committed v1 record
lacks them); `headToHeadMd` / `verdictCell` annotate the policy when present. No md string that an
existing test pins is altered for the v1-fixture path (additive-only; v1 fixtures render exactly as
before because the new fields are null).

## The calibration sweep (AC2 artifact)

A new impure runner `benchmarks/sculpture/budget-calibration.mjs`:
1. Reads the committed `multi-angle/*.json` records (no judge, no render).
2. For each **decided** record, re-derives both arithmetics from its committed `views[].gaps[]`
   via the pure policy (the same function the gate uses) — proving v2 over committed gap lists.
3. Asserts the binding anchors (barn-patternbook PASS-v2, saltcrag PASS-v2, cottage-patternbook
   FAIL-v2); coverage-refused records flagged `noted, not re-scored`.
4. Writes `benchmarks/sculpture/multi-angle/budget-calibration.json` + `.md`: per record, both
   arithmetics side by side, the derivation of `minorBudget`, and the anchor assertions. Schema
   `budget-calibration/v1`. **The committed gate records are never opened for writing.**

This record is *evidence*, not a verdict producer — it certifies the calibration that the policy
froze.

## Alternatives rejected

- **Bump the record envelope to `multi-angle-gate/v2`.** Forces "accept v1 or v2" in the offline
  checker, head-to-head schema assert, and every test fixture, and tempts re-banking committed
  records. Versioning the *budget policy* (a distinct schema tag the aggregate carries) is the
  minimal, idiom-matching move. Rejected.
- **Move `gapBudget` 2 → 10 in config.** Breaks the offline contract check on every committed record
  (`contract.gapBudget:2 ≠ 10`) → "records valid" violated, and erases the legacy arithmetic the AC
  wants reported beside v2. Rejected — add `minorBudget` *beside* the kept `gapBudget`.
- **Re-bank the committed barn/cottage records to their v2 verdicts.** Violates "committed records
  untouched"; the calibration is a *re-derivation* (separate evidence record), exactly like T-142's
  SKIP keeps history honest rather than re-banking. Rejected.
- **minorBudget = 8** (tightest fit). Anchor sits on the boundary; brittle. Rejected (see derivation).
- **minorBudget = 12** (structural max). Never bites — no papercut guard. Rejected.
- **Per-view minor cap instead of total.** The parser already caps each view at 3; a per-view cap is
  redundant with `MAX_GAPS_PER_VIEW`. The papercut failure mode is *aggregate* hedging across views,
  which only a total cap catches. Rejected.
- **Drop the minor cap entirely (identity-only).** The AC explicitly wants a death-by-papercuts
  guard "without repeating the declare-then-freeze mistake." A calibrated total cap is that guard.
  Rejected.
