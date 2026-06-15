# T-144-01 Research — glance-true-budget

Epic **E-34** (straight-ruler), story **S-144**. Calibrate the multi-angle gate's gap budget so
PASS/FAIL tracks the *glance* instead of a never-derived flat `≤2`. **No judge calls, ever** — this
is pure arithmetic re-derived over committed gap lists.

## The seam being changed

`MULTI_ANGLE_GATE.gapBudget: 2` (`src/config.mjs:50-53`, frozen `Object.freeze`) and its single
enforcer, `aggregateMultiAngle()` in `src/form/multi-angle-gate.mjs:142-199`. The aggregate is the
**pure** half (no GL/network/IO); the impure runner `benchmarks/sculpture/multi-angle-gate.mjs`
renders, judges, and persists records. The judge contract (prompt at `:50-76`, parser at `:85-130`,
azimuths, severity vocabulary, one-run-per-view, T-114 reply policy) is **untouched** — v2 is an
aggregation change over already-returned gap lists.

### What `aggregateMultiAngle` does today (`:142-199`)

Two-stage: **REFUSE** (any missing/unrendered view or unparsed verdict → `{decided:false,
refusal}`, no pass/fail at all — `:157-170`) then **DECIDE** (`:172-198`):
- Walk the four azimuths. A `coverage.passed===false` view is a decided FAIL (`failures.push
  {angle, reason:"coverage"}`), verdict null by the T-088 short-circuit (`:177-180`).
- A non-`"same object"` verdict → `failures.push {angle, reason: verdict}` (`:181-183`).
- Every gap on every non-short-circuited view → `gaps.push {angle, region, attribute}` (`:184`).
  **Severity is dropped here** — the tally is severity-blind.
- If `failures.length===0 && gaps.length > gapBudget` → `failures.push {angle:"(all)",
  reason:"gap-budget"}` (`:186-188`).
- Returns `{schema, decided:true, passed: failures.length===0, gapCount, gapBudget, gaps,
  failures, views}` (`:189-198`).

**Key structural fact:** the per-view parser (`:115-123`) *forbids a major gap on a "same object"
verdict* and *requires ≥1 major on drifted/different*. So on a record where every view is "same
object," every gap is necessarily **minor**, and `gapCount` is a pure minor count. Majors only ride
on views that already fail on identity. Therefore **"every view same object" ⟺ "zero major gaps"**
(given coverage passed). Identity-first and severity-first are the same predicate; the minor cap is
the only *new* lever v2 adds beyond the existing identity check.

## The committed evidence (the calibration corpus)

18 committed records under `benchmarks/sculpture/multi-angle/*.json`. Re-derived tallies (severity
counted from each view's committed `gaps[]`):

| record | same/drift | major | minor | recorded verdict |
|---|---|---|---|---|
| **barn-patternbook** | 4 / 0 | 0 | **8** | FAIL 8/2 |
| **barn-patternbook-saltcrag** | 4 / 0 | 0 | **8** | FAIL 8/2 |
| synthetic-hut-current | 4 / 0 | 0 | 2 | **PASS** 2/2 |
| **cottage-patternbook** | 2 / 2 | 4 | 7 | FAIL (drifted ×2) |
| cottage-generated | 2 / 2 | 4 | 6 | FAIL |
| cottage-current | 0 / 3 (+1 cov) | 4 | 5 | FAIL |
| cottage-challenge | 1 / 3 | 4 | 7 | FAIL |
| barn-challenge / barn-generated | 0 / 4 | 8 | 4 | FAIL |
| church-*, gatehouse-* (8 recs) | 0 / 4 | 6–10 | 2–5 | FAIL |

**The binding anchors** (lineage reconciled via the T-142 retired-pin registry: `barn-patternbook
→ T-138-01`, `barn-patternbook-saltcrag → T-138-01`, `cottage-patternbook → T-138-02`):
- **Must PASS v2** — `barn-patternbook` and `barn-patternbook-saltcrag`: every view same-object,
  zero major, 8 minor, glance-passing, yet both recorded budget-FAIL 8/2. ("T-127 barn, T-132
  saltcrag, both T-138-01 barns" names the lineage of these two on-disk files.)
- **Must FAIL v2** — `cottage-patternbook` (the T-138-02 cottage): 2/4 same-object, 7 minor + **4
  major**, glance-failing. The PASS/FAIL column today carries no information the identity column
  doesn't: *every* real build fails 8/2 whether it looks right or not.
- `synthetic-hut-current` (2 minor) already passes both arithmetics — a sanity floor.
- `cottage-current` carries a coverage-refused view → "noted, not re-scored" (AC2).

**The glance-passing population maxes at 8 minors** (barn ×2); the per-view parser caps gaps at 3
(`MAX_GAPS_PER_VIEW`, `:40`), so the structural ceiling for an all-same-object record is `4×3 = 12`.
There is **no committed all-same-object record that looks bad** — every glance-failing record drifted
(carried majors). So the data gives a *lower* bound (8 passes) but no upper anchor for "too many
papercuts." The cap must be derived between the observed ceiling (8) and the structural ceiling (12).

## Consumers of the aggregate shape (dual-reporting surface — AC3)

Found via fan-out (`.passed / .gapCount / .gapBudget / .failures / .gaps`):
- **Primary producer:** `aggregateMultiAngle` (the source of truth). The runner embeds the whole
  `aggregate` object into the record (`multi-angle-gate.mjs:570`), so additive fields ride along.
- `composeKitAwareVerdict` (`kit-presence.mjs:262-280`) ANDs `aggregate.passed` with kit presence →
  `overall`. Reads only `{decided, passed, refusal}` — automatically v2 once `passed` is v2. PURE.
- `head-to-head.mjs gateRow` (`:14-45`) reads `aggregate.{decided,passed,gapCount,gapBudget}`;
  `headToHeadMd` renders `gapCount/gapBudget` (`:97`). `HEAD_TO_HEAD_SCHEMA` own. Test fixtures pin
  `aggregate:{decided,passed,gapCount,gapBudget:2,failures}` (`head-to-head.test.mjs:24`).
- `factory/receipts.mjs verdictCell` (`:19-23`) renders `gapCount vs budget gapBudget` off a gateRow.
- Milestone runners snapshot aggregate fields: `proportion-milestone.mjs:89-90`,
  `styled-milestone.mjs:200-203`, `generated-milestone.mjs:360-410`, `challenge-milestone.mjs:509`.
  All read `gapCount/gapBudget/passed/failures` — which **persist** under v2 (legacy continuity).
- **Offline re-assertion** (`multi-angle-gate.mjs:283-336`): validates committed records. Pins
  `rec.contract.gapBudget === MULTI_ANGLE_GATE.gapBudget` (`:289`) and the aggregate well-formedness
  (`:292`). **Constraint:** if `MULTI_ANGLE_GATE.gapBudget` moves off 2, every committed record's
  `contract.gapBudget:2` mismatches → offline breaks → "committed records valid" violated.

## Schema / validation reality

- **No ajv/JSON-Schema file validates gate records.** Validation is the internal offline checker
  above. Schema tags are plain strings: `MULTI_ANGLE_GATE_SCHEMA="multi-angle-gate/v1"` (record
  envelope), `MULTI_ANGLE_VERDICT_SCHEMA="multi-angle-verdict/v1"` (per-view), `KIT_AWARE_GATE_SCHEMA`.
- `head-to-head.mjs:15` and `gate:offline:287` assert `rec.schema === MULTI_ANGLE_GATE_SCHEMA`. A
  record-envelope bump to `/v2` would force "accept v1 or v2" in every reader and re-bank committed
  records — **out of bounds** (records untouched). The *budget policy* is the thing to version.

## Tests pinning current behaviour (will need v2 updates)

- `multi-angle-gate.test.mjs:18-22` asserts `gapBudget===2` frozen (extend, keep).
- `:114-127` asserts the **flat ≤2 arithmetic**: 2 gaps PASS, 3 gaps FAIL `{angle:"(all)",
  reason:"gap-budget"}`. Under v2, 3 *minor* all-same-object gaps PASS — these cases must be
  rewritten for v2 + the anchors pinned as regressions.
- `:129-144` drifted/coverage FAIL cases — still FAIL under v2 (identity-first). Keep.
- `head-to-head.test.mjs` / `receipts.test.mjs` fixtures hardcode `gapBudget:2` and md strings like
  `FAIL | 1/2` — additive aggregate fields are safe; any md change to those strings is not.

## Coordination

T-142-01 (witness-pin-policy) **landed** (commits f0b981e/494a3a2/fd4ad70) — its `witness-repro.mjs`
and runner edits are committed, not in-flight. Its witnesses re-census **committed** gate records;
since v2 does **not** rewrite committed records (no judge, untouched), the witnesses are unaffected.
Risk is only the shared working tree: stage **only** T-144 files, re-Read before edit, verify green
before commit (the [[shared-file-commit-sweep]] lesson).

## Constraints surfaced

1. **No judge, no re-judge, no re-render-for-decision.** Pure re-derivation over committed `gaps[]`.
2. **Committed records untouched and valid** → keep `gapBudget:2` in config; add the v2 parameter
   *beside* it; keep the record-envelope schema `multi-angle-gate/v1`; version the *budget policy*.
3. The cap must be **derived from data**, then frozen as a named op parameter (don't repeat the
   declare-then-freeze mistake that produced `2`).
4. Identity-first: "every view same object ∧ zero major" is already structurally one predicate; the
   minor cap is the only genuinely new arithmetic.
