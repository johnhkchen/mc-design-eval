# T-144-01 Review — glance-true-budget

**Handoff.** The multi-angle gate's deciding arithmetic now tracks the *glance*: a build that reads
as the same building from all four diagonals PASSes; one that drifts at any angle (or buries itself
in cosmetic papercuts) FAILs. The flat-`≤2` budget that sank every real build regardless of look is
demoted to a legacy column reported beside v2. Calibration is pure re-derivation over committed gap
lists — **no judge call, no record re-banking**. Five commits (`f2b4efe..665863f`), twelve files,
suite green at 2033/2033.

## What changed (files)

**Core (pure):**
- `src/config.mjs` — `MULTI_ANGLE_GATE.minorBudget = 10` beside the kept `gapBudget: 2`; derivation
  in the doc comment.
- `src/form/multi-angle-gate.mjs` — `MULTI_ANGLE_BUDGET_SCHEMA = "multi-angle-budget/v2"`; new pure
  `budgetVerdict()`; `aggregateMultiAngle` DECIDE branch emits v2 (deciding) + legacy block
  (additive). REFUSE branch untouched.
- `src/form/multi-angle-gate.test.mjs` — v2 budget cases + the four-anchor regression + a
  `budgetVerdict` unit.

**Producers / consumers (additive dual-reporting):**
- `benchmarks/sculpture/multi-angle-gate.mjs` — contract emits `minorBudget`; offline checker
  tolerant of v2 records (v1 unchanged).
- `src/form/head-to-head.mjs`, `src/factory/receipts.mjs` — surface v2 beside legacy; v1 fixtures
  render byte-identical.
- `benchmarks/sculpture/{proportion,styled}-milestone.mjs` — snapshots widened with v2 + legacy.

**Evidence (new):**
- `benchmarks/sculpture/budget-calibration.mjs` + `package.json gate:calibrate` — the sweep.
- `benchmarks/sculpture/multi-angle/budget-calibration.{json,md}` — committed AC2 evidence.

## The policy (v2)

> PASS ⇔ decided ∧ every view "same object" (no drift/different/coverage-short-circuit) ∧
> `majorCount === 0` ∧ `minorCount ≤ minorBudget (10)`.

Identity-first because the reviewer decision is binding: *the glance is the bar*. The major-zero
clause is structurally implied by "every view same object" (the parser forbids a major on a
same-object verdict) but computed and required explicitly — severity-aware and parser-relaxation-proof.
`minorBudget = 10` is **calibrated**: the glance-passing observed ceiling is 8 minors (the two T-138
barns), the structural ceiling is 12 (4 × `MAX_GAPS_PER_VIEW`), 10 is the midpoint — a real papercut
tripwire (bites 11–12) that clears both barn anchors with headroom. Calibrated then frozen, not
declared then frozen. Rejected alternatives (8 = boundary-fragile, 12 = never bites, per-view cap =
redundant with the parser, identity-only = no papercut guard) are in `design.md`.

## Acceptance-criteria audit

- **AC1 — policy v2, severity-aware, identity-first.** ✅ `budgetVerdict` is the deciding arithmetic;
  `minorBudget` derived from data; formula + rejected alternatives + derivation in `design.md`.
- **AC2 — binding calibration anchors.** ✅ `gate:calibrate` proves barn-patternbook &
  barn-patternbook-saltcrag **PASS v2** and cottage-patternbook **FAIL v2**, re-derived over committed
  gap lists; both arithmetics per verdict in the committed `budget-calibration.json`; coverage-refused
  records (cottage-baseline, cottage-current) **noted, not re-scored**. The same four anchors are a
  pure unit regression in `multi-angle-gate.test.mjs`.
- **AC3 — dual reporting, versioned.** ✅ The aggregate emits `passed` (v2) + `legacy{passed,
  gapBudget, gapCount}` + `policy` tag + `majorCount/minorCount/minorBudget`; head-to-head, receipts,
  and both milestone snapshots carry both arithmetics; the budget *policy* is versioned
  (`multi-angle-budget/v2`) while the record envelope stays `multi-angle-gate/v1` so **committed
  records stay valid** (no envelope bump, no re-bank). Schema versioned via the policy tag.
- **AC4 — frozen seam respected.** ✅ No judge call, no render-for-decision, no re-judge; prompt,
  azimuths, severity vocabulary, camera, and reply policy untouched (diff is over aggregation only).
  Isolation scan green inside `npm test`. `npm run visibility:repro` → green-or-named-SKIP.
  `npm test` → 2033/2033 incl. the anchor regressions.

## Test coverage

- **Strong:** the pure policy (`budgetVerdict`/`aggregateMultiAngle`) — v2 pass/fail, the 10/11
  minor boundary, drifted/coverage identity-failures, the legacy-beside column, the four committed
  anchors, and the REFUSE invariants (no policy/legacy on a refusal). All IO-free, under the glob.
- **Integration (no judge):** `gate:offline` proves committed-record validity; `gate:calibrate`
  proves the sweep + anchors and writes the evidence; `visibility:repro` proves the witnesses.
- **Gaps / not covered by automated tests:**
  - The *runner's* live record-emission of v2 (the `record.aggregate` round-trip through GL/judge)
    is exercised only by a real metered gate run, which this ticket deliberately does not perform.
    The offline checker's new `budget` clause is the standing guard for the next live run; it is not
    itself unit-tested against a synthetic v2 record (low risk — it is a typeof/presence check).
  - No `budget-calibration.test.mjs` — the AC2 arithmetic is pinned as a `multi-angle-gate.test.mjs`
    unit and self-asserted at sweep runtime (non-zero exit on mismatch). The sweep's *file IO* (glob,
    md rendering) is untested.

## Open concerns / for the human reviewer

1. **First live v2 gate run.** The next real `gate:multi` will write the first record carrying
   `policy: multi-angle-budget/v2` and flip `overall` PASS/FAIL semantics to the glance. Expect
   previously-FAILing glance-passing builds (the barns) to PASS — that is the intended behaviour, not
   a regression. The committed records remain at their v1 verdicts until a sanctioned re-run.
2. **Deeper chain runners** (`generated-milestone`, `challenge-milestone`) read
   `gate.resemblance?.gapCount/gapBudget` — now sourced from the widened styled-milestone snapshot, so
   the legacy fields ride through correctly; they do not yet surface `minorBudget/majorCount`. Left as
   a judgement call (their output is the legacy continuity column, which is correct as-is).
3. **`minorBudget` has only a lower data anchor.** No committed all-same-object record "looks bad,"
   so the cap's upper justification is structural (the midpoint argument), not empirical. If a future
   glance-passing build legitimately exceeds 10 minors, the cap is the thing to re-calibrate — and it
   is now a single named, documented op parameter, so re-calibration is a one-line, evidence-backed
   change, not a re-derivation of the whole policy.

## Risk / reversibility

Every code change is additive and v2 paths are gated behind `policy != null`, so all v1/legacy
rendering is byte-stable; the sweep is read-only over committed records and the pin-guard structurally
blocks an accidental gate-record write. Reverting v2 to legacy is a one-field change in the aggregate
return.
