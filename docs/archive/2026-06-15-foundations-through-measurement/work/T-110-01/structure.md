# T-110-01 church-unblock — Structure

File-level blueprint. Two code seams (census metric, per-component roof), one new pure module, two
registry tables, then committed run evidence. No edits to T-108-01's modules
(`src/form/roof-fit.mjs`, `src/view/roof-generate.mjs`, `src/view/roof-swap.mjs`).

## A. Census role-family identity (D1)

### Modified: `benchmarks/sculpture/durable-skin.mjs`
- Import `ownCoverage` from `src/view/zone-fill.mjs` (replaces the `dominantCoverage` import — all
  three censuses upgrade so every record row carries `dominantFraction` AND `ownFraction`).
- Step 6 (~:495): `covFrontCandidate = ownCoverage(surfaceZoneHistogram(...), policyS)`;
  `gateFrontCandidate = coverageGate(covFrontCandidate, { threshold, zones: policyS, metric: "own" })`.
- Splat-only (~:520): census via `ownCoverage`; gate stays `metric: "dominant"` (frozen baseline,
  comment states why — the legacy-replay precedent at :511).
- Step 9 (~:566): census via `ownCoverage`; gate `metric: "own"`. The throw at :578 reports both
  fractions per failure: `${f.zone} ${f.dominant}=${f.fraction(dominant)} own=${ownFraction} < T`
  — keep the existing census decomposition (`:offslab`/`:frame`) suffix unchanged.
  (`coverageGate` own-metric rows already expose `dominantFraction` beside `fraction`; the failures
  array exposes `fraction` = own under the metric — pull `dominantFraction` from `byZone` for the
  message.)
- Record (`coverageGate` block ~:792): add `metric: { final: "own", frontCandidate: "own",
  splatOnly: "dominant" }` + a note naming the T-095/T-101/T-110 lineage and the monotonicity
  argument (AC: "reasoning recorded for the reviewer").
- `--offline` checks (~:654): unchanged (they read recorded booleans; old records stay valid).
- Registry `SUBJECTS.church`: `kitRecord: "kit/church.json"`, `zoneMapRecord: "zone-map/church.json"`
  (data only; set in step 5 of the plan, after those records exist).

### Modified: `benchmarks/sculpture/placement-grammar.mjs`
- `grammarStage` gate (~:145): `cov = ownCoverage(...)`; `gate = coverageGate(cov, { threshold,
  zones: policy, metric: "own" })`; throw message reports both fractions. `bandEvidence` arithmetic
  untouched (it already computes own-set fractions from `byBlock`).
- Import swap `dominantCoverage` → `ownCoverage`. Offline record checks untouched.

### Unchanged on purpose
- `src/view/zone-fill.mjs`, `src/view/face-resemblance.mjs` — the pure cores already exist (T-101).
- `benchmarks/sculpture/multi-angle-gate.mjs` (already own), `spray-paint.mjs` (committed
  measurement), thresholds/azimuths/judge.

### New tests: `src/view/coverage-monotone.test.mjs`
- Loads committed records (skip-if-absent guard per file, all currently committed):
  `benchmarks/sculpture/durable-skin/{cottage,gatehouse}.json` (`coverage.final` + `fill.policy`),
  `benchmarks/sculpture/challenge/{cottage,gatehouse}.json` (`skin.coverage` + reconstructing zones
  from `skin.zoneMap.bands` dominants/preserves is NOT possible — use `skin` record's gate byZone +
  censuses; where a record lacks a usable policy, derive `zones` from the recorded
  `coverage[zone].dominant` + own rows when present, else fall back to durable-skin's policy field),
  `benchmarks/sculpture/styled/{cottage,gatehouse}.json` (grammar coverage + policy).
  Practical rule: for each record, for every zone the recorded dominant-gate passed, assert the
  own-metric gate over `ownCoverage(byBlock-census, policy)` also passes; assert recorded
  `passed:true` gates stay `passed:true`. (If a given record genuinely carries no policy+census
  pair, it is skipped with a named console note — the durable-skin pair alone is sufficient
  coverage of the claim; do not synthesize policies.)
- Property check: random-ish small censuses — any zone passing dominant passes own (own ⊇ dominant),
  mirroring the T-101 core test at the gate-composition level.

## B. Per-component roof fit (D2)

### New: `src/form/component-roof.mjs` (+ `component-roof.test.mjs`)
```
export function componentGableGroups({ record, gables })
  → { groups: [{ massId, role, gables: [gable], gableIds: [string] }], findings: [finding] }
```
- Plane→mass via `record.roofPlanes[].massId`; gable→mass via its `sides[].planeId` (both sides;
  disagreement ⇒ finding `gable-spans-masses`, grouped under the first side's mass).
- Group order: `role === "primary"` first, then by `massId` ascending (deterministic, documented).
- Includes insane gables in their group (the runner reports per-component fallbacks from them).
- Masses with roof planes but no gables ⇒ finding `component-roof-unfitted` (named per component).
- PURE: no I/O, no Date/random. Tests: synthetic two-mass record + the committed
  `components/church.json` (asserts nave group = roof-3/7 pair gable, tower group = roof-14/15).

### Modified: `benchmarks/sculpture/roof-program.mjs`
- `runRoof()`: after `fit = gablesFromRecord(record)` build
  `const { groups, findings: groupFindings } = componentGableGroups({ record, gables: fit.gables })`.
- Loop groups sequentially; per group: `swapRoof(occCurrent, { gables: group.gables, family,
  refSils, regions, protect, chimney })`; if `swap.accepted` → `occCurrent = swap.occ`.
  Collect `components: [{ massId, role, gableIds, swap: <existing per-swap record view> }]`.
- Composition summary (top-level, back-compatible shapes for `renderMd`, `loadReconstruction`,
  `roofPlanFromRecord`):
  - `status`: `"accepted"` iff ≥1 component accepted, else `"fallback"`.
  - `swap.accepted` = same; `swap.reasons` = per-component reasons prefixed `[massId]`;
    `swap.attempt`/`swap.attempts` = flattened with `massId` field per attempt;
    `swap.carve.removed`/`generated.counts`/`reseat` = sums; `swap.fitError` = concat;
    `swap.iou` = the last accepted component's (whole-build context — final state);
    `swap.closure` = last accepted's; `census.before/after.spikes` = sums; `swap.bandFloor` = min.
  - `fit` unchanged (all gables + findings); `findings` gains the group findings.
- `artifact` = `rebuildArtifact(occCurrent, raw)` once, only if any accepted.
- `assertAcceptance`: budget `6 × Σ accepted components' generated gables` (same formula, summed).
- Record: new `components` array (additive). `renderMd`: render a per-component section when
  `components` present; single-mass records render exactly as today.
- Console: one line per component (`[church] mass-0 (primary): ACCEPTED (...)` /
  `mass-1: FALLBACK — ...`).
- Committed cottage/gatehouse records: untouched on disk; `--offline` reads status/sha only —
  still valid. A future live re-run on them yields one group (single mass) ⇒ behavior identical.

## C. Registry/data additions (D3)

### Modified: `benchmarks/sculpture/kit-extract.mjs`
- Add church row to its SUBJECTS table:
  `{ key: "church", concept: runs/016-…/concept.png, map: material-map/church.json,
     zoneMapRecord: "zone-map/church.json" }` (pure data; the sweep's other behavior untouched).

### New committed records (produced by named runs, not hand-written)
- `benchmarks/sculpture/zone-map/church.{json,md}` — `npm run zone:map -- --subject church`.
- `benchmarks/sculpture/kit/church.{json,raw.json,md}` — `npm run kit:extract -- --subject=church`
  (one-time LLM; raw committed).
- `benchmarks/sculpture/roof/church.{json,md}` + `roof/church/artifact.json` (if any component
  accepted) — `npm run roof:church`.
- `benchmarks/sculpture/challenge/church.{json,md}` + artifacts + `multi-angle/church-challenge.*`
  — `npm run challenge:church`.
- `benchmarks/sculpture/styled/church.{json,md}` + artifacts + `multi-angle/church-styled.*` +
  `pr/assets/styled-church-kit.md` + frames — `npm run styled:church`; `--repro` after.
- PNG policy: per `.gitignore` rules, run PNGs gitignored; `pr/assets/frames/*` committed.

## D. Ordering of changes (matters)

1. A (census) + its tests — everything downstream is blocked on the gate.
2. C kit-extract row + zone:map church + kit:extract church (LLM) — needs A.
3. Registry update in durable-skin SUBJECTS.church (kitRecord/zoneMapRecord) — needs 2's records.
4. B (component-roof core + runner) + `npm run roof:church` — family needs the kit from 2.
5. Chain runs (challenge → styled, then --repro / --offline re-asserts) — need 1–4.
6. Docs/learnings + review.

## Interfaces unchanged (consumers keep working)

- `coverageGate` / `ownCoverage` signatures: untouched.
- `roof-program/v1` consumed fields (`status`, `swap.accepted`, `family`, `fit.gables[].footprint.bbox`)
  — semantics preserved under composition; `roofPlanFromRecord` and `loadReconstruction` unmodified.
- `component-plan/v1`, `grammarStage` return shape, styled/challenge record schemas: unchanged
  (records gain additive fields only).
