# T-170-02 Structure — file-level blueprint

Epic **E-41** / Story **S-170**. The shape of the change. Additive only; scoring math untouched (it
already reads `kind`). Three source touches + one results file + the RDSPI artifacts.

## Files

### 1. `src/workshop/bakeoff-score.mjs` — MODIFY (add one pure export)

Add `kindReliability(conditions)` after `pairAgreement` (after line 257, before the
`_meanForHarness` re-export). Pure, IO-free, deterministic — the one new piece of logic, single-sourced
and testable.

```
/**
 * Per-condition typed-kind distribution + capping-rate, for the T-170-02 crater rerun. The corpus carries
 * NO per-item kind ground truth, so reliability is reported as a CONDITION-LEVEL expectation, not a
 * per-item join: a MATCHED condition's divergences SHOULD skew add/remove (non-capping); a WRONG-style
 * condition's SHOULD skew replace (capping). The reliability signal is the CONTRAST (wrong.replaceRate −
 * matched.replaceRate), reported beside — never folded into — the score.
 *
 * @param {Array<{key:string, tier:string, votes:Array<{items:Array<{kind?:string, styleClass?:string}>}>}>} conditions
 *        the crater conditions (tier ∈ MATCHED|WRONG|CONTROL), each with its VOTES of persisted items.
 * @returns {{perCondition: Object<string,{tier, nItems, add, replace, remove, untagged,
 *           cappingRate, replaceRate}>, byTier:{MATCHED:{replaceRate,cappingRate,nItems},
 *           WRONG:{...}, CONTROL:{...}}, replaceContrast:number|null, verdict:string}}
 */
export function kindReliability(conditions) { ... }
```

Behaviour:
- Flatten each condition's `votes[].items`; tally `kind` ∈ {add, replace, remove} and `untagged`
  (`kind` null/absent — the reliability red flag: the judge did NOT emit a tag); `cappingRate` =
  `styleClass==="wrong-style"` share; `replaceRate` = `replace`/nItems.
- Aggregate by tier (MATCHED/WRONG/CONTROL) across conditions.
- `replaceContrast` = `byTier.WRONG.replaceRate − byTier.MATCHED.replaceRate` (null if either tier empty).
- `verdict`: if `untagged > 0` anywhere → "TAG UNRELIABLE — judge emitted items without a kind"; else if
  `replaceContrast > 0` → "DISCRIMINATES — wrong-style skews replace more than matched"; else
  → "NO CONTRAST — matched and wrong-style tag alike (over-cap not removed by the tag)".

No edit to `itemStyleClass` / `styleFidelityScore` / `critiqueEvidence` — they already read `kind`.

### 2. `src/workshop/bakeoff-score.test.mjs` — MODIFY (add BO13)

One new `test("BO13 kindReliability ...")` after BO12b. Asserts, on hand-built condition fixtures
(no IO):
- per-condition counts (add/replace/remove/untagged) and `replaceRate`/`cappingRate`;
- `byTier` aggregation across two conditions sharing a tier;
- `replaceContrast` = wrong − matched, and the three `verdict` branches (untagged present → UNRELIABLE;
  contrast>0 → DISCRIMINATES; contrast≤0 → NO CONTRAST);
- empty-input safety (no NaN; `replaceContrast` null when a tier is empty).

Test count goes 2241 → **2242**.

### 3. `experiments/eval-alignment/corpus-referee.mjs` — MODIFY (capture kind, route output, report reliability)

Additive edits, no scoring change:

- **`itemsOf` (line 77):** add `kind: it.kind ?? null` to the persisted item object (beside the existing
  `present`/`missing`/`styleClass`). This is the audit field AC #2/#3 need.
- **Output routing (lines 50, 253):** replace the two hardcoded sinks with env-gated paths, defaulting to
  the T-169-01 values so the harness stays valid for the E-40 baseline:
  ```
  const OUT_DIR = join(ROOT, process.env.REFEREE_OUT_DIR ?? "docs/active/work/T-169-01");
  const RESULTS = process.env.REFEREE_RESULTS ?? "experiments/eval-alignment/results/corpus-referee.json";
  ```
  and write to `join(ROOT, RESULTS)` (with `mkdir` of its dirname). The beside-PNG `composeTwo` targets
  already use `OUT_DIR`, so they follow automatically.
- **Import + call:** add `kindReliability` to the `bakeoff-score.mjs` import (line 42–45); in `runCrater`,
  after building `conditions`, compute `const kindRel = kindReliability(conditions)` and return it in the
  crater object (`{ ..., kindReliability: kindRel }`).
- **Console summary (line ~257):** add a line:
  `KIND:      contrast=${crater.kindReliability.replaceContrast} -> ${crater.kindReliability.verdict}`.

The result doc (`corpus-referee-kind.json` for this run) thus carries the full per-item `kind`+`styleClass`
triple plus the `kindReliability` block — the falsifiable audit trail.

### 4. `experiments/eval-alignment/results/corpus-referee-kind.json` — NEW (committed live evidence)

The post-`kind` run output, written by the env-routed harness. Kept separate from the committed
`corpus-referee.json` (the E-40 baseline) so before/after both survive on disk (AC #1 demands the
comparison). Creation-loop evidence under `experiments/`, not pin-guarded.

### 5. `docs/active/work/T-170-02/` — NEW artifacts

- `research.md`, `design.md`, `structure.md`, `plan.md` (this RDSPI pass).
- `crater-matched.png`, `crater-wrongstyle.png`, `crater-wrongstyle-2.png` — beside-concept composites the
  harness writes here when run with `REFEREE_OUT_DIR=docs/active/work/T-170-02`.
- `FINDINGS.md` — the live result write-up (scores vs the E-40 2/0/2/0 baseline, kind distribution +
  reliability, the E-42 hand-off, the re-assessed recommendation).
- `progress.md`, `review.md`.

## Explicitly NOT touched

- `baml_src/department.baml` and the diagnose golden/fixtures — T-170-01's territory; `kind` is already
  emitted. Re-touching would re-pin the prompt golden in the wrong ticket.
- `styleFidelityScore` / `itemStyleClass` / `critiqueEvidence` — already read `kind`; changing them risks
  the frozen-adjacent scoring for no benefit.
- `measurements/**`, gate vocabulary, `transport-guard.test.mjs` — frozen instrument (AC #4).
- The committed `corpus-referee.json` and the T-169-01 PNGs — the E-40 baseline; preserved by routing.
- `clean-wrong-style.mjs` / `bakeoff.mjs` and their `results/*.json` — the E-39 baselines the harness
  reads for its side-by-side.

## Ordering (matters)

1. `bakeoff-score.mjs` `kindReliability` + BO13 test → `npm test` green at 2242 (pure logic pinned first).
2. `corpus-referee.mjs` capture/route/report edits.
3. `GUARD_ONLY=1` env-routed run → assets present, no spend.
4. Full live env-routed run → writes `corpus-referee-kind.json` + T-170-02 PNGs.
5. `FINDINGS.md` from the live evidence; commit.
6. `review.md`.

## Interfaces / contracts

- `kindReliability` input is the harness's `conditions` array shape (`{key, tier, votes:[{items:[...]}]}`);
  the test builds that shape directly so the helper is verified independent of the live harness.
- Back-compat: with no env vars, the harness writes exactly where T-169-01 did — a re-run of the baseline
  is still possible.
