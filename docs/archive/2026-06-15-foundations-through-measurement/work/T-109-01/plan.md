# T-109-01 ridge-and-silhouette-fit — Plan

Eight steps, each independently verifiable and atomically committable. Test commands:
`node --test src/**/*.test.mjs` (root suite, currently 1389 green) for every step; live runs in
steps 7–8 only. Commit prefix: `feat(E-28 T-109-01): …` (fix/docs where apt).

## Step 1 — Enablers: normalize bbox override + exposedFaceMesh subset
- `src/form/form-fidelity.mjs`: `normalizeSilhouette(mask, {grid, fit, coverageThreshold, bbox})`
  — `bbox` overrides the crop window (default `mask.bbox`, behavior byte-identical).
- `src/view/shell-regularize.mjs`: `exposedFaceMesh(occ, {cells} = {})` — optional Set filter;
  faces relative to the subset; bounds remain the full occupancy's.
- Tests: bbox override (known mask, shifted crop → expected grid); subset mesh (mass alone
  projects at the full-frame position — assert via `projectPoint` or tri bounds); default-path
  equality with the pre-change output.
- Verify: full suite green; no other call sites change.

## Step 2 — `src/form/roof-ridge-fit.mjs` (pure core + tests)
- `ridgeFromPlanes`, `fitRidgeLine`, `ridgeVariant` per structure.md signatures.
- Tests (synthetic, exact): two opposing sides pitch 1.0, eaves y15 at edges ±8 → intersection
  y23 @ v0; asymmetric pitches → off-center v; invalid cases (missing pitch, intersection below
  eave + 0.5, v outside run window) → named reasons, gable unchanged; `ridgeVariant` non-mutation;
  `fitRidgeLine` on a synthetic tent tri-soup (apex plateau y23 over x∈[−5,5]) → height 23,
  slopeDeg 0, length 11, rmse 0; sloped-apex mesh → slopeDeg ≠ 0 recorded.
- Verify: suite green.

## Step 3 — Generator cap tracking + swap ridge rungs
- `roof-generate.mjs`: `capKeys` Set + `counts.cap` (marking only; emission unchanged).
- `roof-swap.mjs`: `pitchKey` + ridge.y; ladder interleaves `${name}-ridge-fit` before each plain
  candidate (ridgeVariant applied to that candidate's gables; findings carried on the attempt);
  `generated` carries cap count.
- Tests: cap keys on a known gable (ridge row cells marked, eave cells not); ladder order +
  naming; dedup when the intersection equals the recorded ridge (rung skipped); a ridge-fit rung
  that regresses IoU falls through to the plain rung (synthetic refSils, the existing
  fallback-test pattern with aggressive geometry).
- Verify: suite green; existing 17 roof-swap tests still pass unmodified semantics (tail rungs
  intact).

## Step 4 — `src/view/plane-terminate.mjs` (pure core + tests)
- `unconsumedPlanes`, `terminatePlane`, `terminationSteps` per structure.md.
- Tests: flat blob with 3 bumps + a notched edge → bumps trimmed, top course contiguous over the
  filled extent, added cells take majority-neighbor block; pitched fragment trim-only (no fill);
  protect-set cells untouched; fixtures untouched; `regularizeShell` integration — one good step
  accepted (trace), one IoU-tanking step rolled back (trace reasons non-empty, occ unchanged).
- Verify: suite green.

## Step 5 — `src/view/silhouette-residual.mjs` (pure core + tests)
- `protrusionCandidates`, `massSpill`, `residualPass` per structure.md.
- Tests: synthetic occupancy (16³ box + 2×2×6 chimney + 3×3×4 lump) vs synthetic reference mesh
  (box + chimney, no lump): candidates found (2 components, deterministic ids/order); chimney
  `shownAt` = all 4 azimuths → exempt with evidence; lump shown nowhere → removed; cage rollback
  (a removal that would regress closure on a crafted input rolls back, named); record-protrusion ∪
  stack union (record-only mass without stack plateau still a candidate); double-run log
  byte-equality.
- Verify: suite green.

## Step 6 — Runner wiring (`benchmarks/sculpture/roof-program.mjs`)
- Deterministic core: shared `alignedTriangles` reused for end-fit and `fitRidgeLine`; per-gable
  `ridgeFit` evidence section; terminations stage (candidate cells protected) via
  `regularizeShell` steps; residual stage; artifact/status rule ("accepted" ⇔ final occ differs
  and gates hold); unmapped gate on the final artifact.
- Record/md: `ridgeFit`, `terminations`, `residual`, `generated.counts.cap` sections; attempts
  show ridge rungs; ridge-profile frames (generic ortho perpendicular to the dominant accepted
  gable's ridge axis — confirm the ortho angle names in `VIEW_ANGLES.ortho` first).
- `assertAcceptance`: unchanged budget; assert the residual log contains no silent removals
  (every removed entry has azimuth evidence + cage outcome).
- Verify: `node --test` green (runner is not under the glob, but its pure imports are); syntax
  run `npm run roof:cottage -- --offline` against the committed record still passes (pre-live).

## Step 7 — Live runs: gatehouse + cottage
- `npm run roof:gatehouse` then `npm run roof:cottage` (each double-runs the core; byte-compare
  internal). Then `npm run roof:gatehouse -- --repro` and `npm run roof:cottage -- --repro`.
- Expected (hypotheses, NOT tuned targets — divergence is named and brought back here):
  - gatehouse: residual removes the three protrusion-mass lumps (shownAt empty ×3) with
    per-azimuth spill evidence; roof-2 flat termination accepted; ridge rungs judged by the cage
    either way; census after ≤ 2 (unchanged or better).
  - cottage: chimney exempt (`shownAt` = 4 azimuths, logged); ridge-fit evidence recorded
    (intersect delta vs blob ridge — the known apex-shortfall case becomes a measured number);
    census stays 0.
- If a stage rejects everything: status quo geometry stands (tail rungs / rollback) — record the
  named reasons, do not bend constants (Rule 6).
- Verify: exit 0 both subjects; `--repro` matches; renders + ridge-profile frames on disk;
  records committed.

## Step 8 — Full verification + docs
- Full suite `node --test src/**/*.test.mjs` — expect 1389 + new tests, all green.
- `npm run roof:cottage -- --offline` / `roof:gatehouse -- --offline` — committed-record
  re-assertion passes.
- Commit records, frames manifest, progress.md throughout; review.md at the end.

## Testing strategy summary
- **Unit (pure)**: every new fn synthetic-exact (steps 1–5) — no GLB assets, no GL, deterministic.
- **Integration (pure)**: regularizeShell step-seam + swap-ladder fall-through paths.
- **Live evidence (impure, not in suite)**: step 7 runs ARE the AC's named-chain evidence —
  before/after renders at gatehouse 45/135/225 (already EVIDENCE_ANGLES) + cottage ridge profile;
  fit/removal log + cage outcomes in the durable records. No re-judging (T-111).
- **Determinism**: double-run byte-compare in-process + `--repro` fresh-process, both subjects.

## Risks called from design (watch during 7)
- spill=0 strictness → if raster seams flake, widen the *derived* dilation (named), never an
  epsilon constant.
- ridge rungs all rejected → tail preserves today's geometry; findings recorded.
- terminations vs chimney base overlap → candidate cells protected during terminations by
  construction; verify protect violation counts are 0 in traces.
