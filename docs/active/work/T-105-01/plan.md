# T-105-01 shaped-vocabulary — Plan

Ordering follows structure.md: generators → fits → application → runner. Each step is an atomic
commit, verified before moving on. `npm run test:unit` (or the single-file form) is the gate at
every step; the full `npm test` gates the end.

## Step 1 — Generators: `src/form/shaped-vocab.mjs` (+ tests)

Implement `SHAPED_DEFAULTS`, `ASCENT_FACING`, `stairRun`, `slabStep`, `archRing`, `flatHead`.
Pure integer math; throw on malformed specs (fail-loud precedent).

Tests (`shaped-vocab.test.mjs`):
- **stairRun**: all 8 orientation cases (4 ascents × 2 windings) against hand-written expected
  `{pos, state}` rows; width>1 replication; steps=1 degenerate; state vocabulary ⊆ the proven
  CARD_ROWS values (`facing` ∈ 4 compass, `half` ∈ {bottom,top}, `shape` = "straight").
- **slabStep**: both axes × 3 kinds; `type` state matches kind; length replication.
- **archRing**: hand-checkable r=2.5 semicircle over a 5-wide span — exact aperture/ring cell
  sets; disc symmetry (mirror about center); jamb/head label cells are ring-members adjacent to
  the aperture; depth replication (every depth layer identical); flatHead = degenerate case with
  uniform level. Determinism: two calls, deep-equal output, canonical cell ordering.

Verify: `node --test src/form/shaped-vocab.test.mjs`. Commit:
`feat(E-27 T-105-01): shaped-vocab pure generators — stair run, slab step, voxel-circle arch`.

## Step 2 — Fits: `src/form/shaped-fit.mjs` (+ tests)

Implement `fitCircle` (Kåsa 3×3 LSQ, radial-residual RMSE), `fitOpeningHead` (arch|flat|none
dispatch + gates from SHAPED_DEFAULTS), `stairRunSpecFromPlane`, `slabStepSpecFromPlane`
(glbFit-preferred, voxelFit-fallback-with-finding, pitch snap + pitchDelta error).

Tests (`shaped-fit.test.mjs`):
- `fitCircle`: exact circle points → exact center/radius, rmse≈0; collinear/degenerate → null.
- `fitOpeningHead` synthetic: perfect semicircle profile → arch, rmse≈0; segmental profile →
  arch within tol; flat profile (non-candidate) → flat noop; ragged candidate beyond `rmseTol` →
  kind "none" + named finding (Rule 1 path); width<minArchWidth candidate → "none" finding;
  flat-but-ragged → flat with recorded rmse.
- **Real-record check (the design's named risk, done here)**: load
  `benchmarks/sculpture/components/gatehouse.json` (read-only fixture use, committed file),
  assert og-0/og-2 fit as arches within tolerance with recorded rmse, and a sample church opening
  fits flat. If the gatehouse profile misses the gate, STOP — revisit `rmseTol` with rationale
  recorded in progress.md before any application code.
- Plane fits: synthetic gradient 1.0 → stair spec from glbFit; 0.5 → slab spec; 0.3 → null +
  finding; glbFit absent → voxelFit source + provenance finding.

Verify + commit: `feat(E-27 T-105-01): shaped-fit — spec-from-record fits, Kåsa arch circle,
tolerance-or-named-fallback`.

## Step 3 — Application: `src/view/opening-reconstruct.mjs` (+ tests)

Implement `openingDepthRun`, `reconstructOpeningHeads`, `openingHeadStep`.

Tests (`opening-reconstruct.test.mjs`), all on synthetic occupancies:
- A hollow box wall with a flat-topped 7-wide arched-candidate opening (hand-built headProfile
  record fragment): after reconstruction the head window matches the fitted disc exactly —
  carved cells gone, ring cells solid, fill blocks = neighbor majority; cells outside the window
  byte-identical.
- Flat-head squaring: ragged 3-wide window head → uniform level; 1-wide opening → recorded noop.
- "none" fit → occupancy unchanged for that opening (honest fallback).
- **T-097/E-25 integration case**: same wall, aperture dressed (spruce_trapdoor cells with
  states, occupied-not-solid) below the spring; run the FULL caged path
  (`regularizeShell` + `openingHeadStep`, refSils from the synthetic input's own silhouettes) →
  step accepted, closure no-regress, dressing cells byte-identical (block+state+form), and
  `rebuildArtifact` round-trip carries the states. Protect-region violation path: protect the
  head region → step rejected + rolled back (cage semantics hold for the new step).
- Determinism: double run, identical occupancy + report.

Verify + commit: `feat(E-27 T-105-01): opening-head reconstruction — carve/fill to fitted
arch/flat heads, caged step adapter`.

## Step 4 — Runner + scripts

`benchmarks/sculpture/shaped-vocabulary.mjs` (registry, fit evidence for all roofPlanes +
openings, caged application, double-run sha256, best-effort renders with `unmapped===0` assert,
`--offline`), `package.json` `shaped:*` scripts.

Verify: `npm run shaped:gatehouse` then `shaped:church`, `shaped:cottage`. Inspect:
- gatehouse record: og-0/og-2 kind "arch", fit rmse recorded, cage step accepted, before/after
  frames show the rounded head at ±x azimuths.
- church: heads flat/noop per geometry; cage accepted; closure holds.
- all: artifacts byte-identical across the double run; `unmapped: 0`; `--offline` re-passes.
Commit (records + frames + artifact): `feat(E-27 T-105-01): shaped:* chain — opening heads
fitted and rebuilt under the cage, fit evidence recorded`.

## Step 5 — Full-suite gate + review

`npm test` (expect ~1274 + new, 0 fail). Write `progress.md` final state, then `review.md`
(changes, coverage, open concerns: stair-render residual, T-104 overlap note, tolerance
declarations). Commit docs:
`docs(E-27 T-105-01): RDSPI artifacts — shaped-vocabulary (research→review)`.

## Testing strategy summary

- **Unit (pure, in `src/**/*.test.mjs` glob):** every generator orientation; every fit branch
  (arch/flat/none, glbFit/voxelFit, every gate); application carve/fill/labels; the dressed-
  opening + cage integration case; determinism double-runs everywhere.
- **Integration (runner, GL, not in npm test):** the three subjects end-to-end with renders and
  reproducibility hashes — evidence committed as records + frames.
- **Verification criteria = the AC**: three generators exhaustively unit-tested; fits record
  errors with named fallbacks; gatehouse arch rebuilt + church heads per geometry under the cage;
  `unmapped` empty; subject-agnostic; `npm test` green.

## Risks / contingencies

- Gatehouse arch fit misses tolerance → stop at step 2, record rationale, adjust declared default
  once (never per-subject).
- Cage rejects the head step on a real subject (IoU/closure) → the trace names why; expected
  absorbable (design §Risks), else record the rejection honestly (the cage IS the deliverable's
  safety property) and surface in review.md.
- Regularized church shell may have openings whose depth run is ambiguous (decomposition findings
  list `unassigned` cells) → `openingDepthRun` returns null → opening skipped with finding.
