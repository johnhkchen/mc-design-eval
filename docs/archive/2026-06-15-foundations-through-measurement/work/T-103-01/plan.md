# T-103-01 component-decomposition — Plan

Ordered, independently verifiable steps; each is one atomic commit. Test commands given per step.
Full-suite gate (`npm test`, currently 1217 passing) runs at steps 1, 7, and 9.

## Step 1 — `openings()` withCells seam

- Edit `src/view/structural-read.mjs`: add `{withCells = false}` third param; when true, include
  `cellsUV` in each returned opening. No other change.
- Test: existing openings tests untouched and passing (default path byte-identical); one new test
  asserting `cellsUV` covers the aperture cells of a synthetic windowed wall.
- Verify: `node --test src/view/structural-read.test.mjs`; then full `npm test` (this edit touches a
  widely-imported module).
- Commit: `feat(E-27 T-103-01): openings() withCells opt-in — aperture cell shapes for head/jamb lift`.

## Step 2 — core skeleton: plane fit, codec, heightfield

- New `src/form/component-decompose.mjs` with `COMPONENT_RECORD_SCHEMA`, `fitPlane`, `columnRuns`/
  `runCells`, `heightfield`, `medianSmooth` (structure §1 signatures).
- Tests (new `component-decompose.test.mjs`): fitPlane on exact planes (flat, sloped, both axes;
  rmse 0), degenerate flag; codec round-trip incl. non-contiguous rows; heightfield on a synthetic
  box (one entry/column, correct top y); median kills a single-column spike, preserves a gable line.
- Verify: `node --test src/form/component-decompose.test.mjs`.
- Commit: `feat(E-27 T-103-01): decomposition core skeleton — plane LSQ, run codec, heightfield`.

## Step 3 — `segmentMasses`

- D2 algorithm: gap clustering on smoothed heights, plan components, protrusion/merge rules,
  junctions, deterministic ids.
- Tests: single box → 1 primary mass, no junctions; two-prism church-like (tall tower prism + long
  low nave) → 2 masses + 1 junction with correct axis/span/yRange; box+chimney (3×3 column, +5
  height) → chimney = `role:"protrusion", protected:true`, junction at host top; gabled box (no
  height gap) → 1 mass (the slope-continuity case); spiked box (isolated +6 single columns) →
  still 1 mass (median robustness).
- Verify: module test file.
- Commit: `feat(E-27 T-103-01): mass segmentation — gap-clustered heightfield plan components,
  protrusion masses, junction surfaces`.

## Step 4 — `roofPlanes`

- D3 1–3: deterministic region grow on H̃ per mass (protrusion columns excluded), merge, kind,
  eave edge, ridge candidate.
- Tests: gabled box → exactly 2 pitched planes, opposing gradients, ridge polyline at the crest with
  fitted y, each plane's eave on the correct side, fit rmse ≤0.5; flat box → 1 flat plane, no ridge,
  4 eave edges; hipped variant (pyramid) → 4 planes, no false ridge between orthogonal pairs (dot
  filter); gable+chimney → planes unpolluted (chimney excluded); spiked gable → same 2 planes.
- Verify: module test file.
- Commit: `feat(E-27 T-103-01): roof planes — region-grown heightfield fits, eave edges, ridge
  candidates`.

## Step 5 — `wallSlabs` + `openingGroups`

- D4 modal-depth slabs per mass×dir; D5 lift of `openings(..., {withCells:true})` to world geometry
  + grouping + arch flag.
- Tests: box → 4 slabs, coverage 1.0, correct planes; two-prism → tower and nave get separate slabs
  on the shared dir; wall with 2 aligned windows + 1 door → one window group of 2 + one door group,
  world bboxes/sill/jambs exact; arched doorway (stepped head profile) → `archCandidate: true`,
  spring/crown correct; flat-head door → `archCandidate: false`.
- Verify: module test file.
- Commit: `feat(E-27 T-103-01): wall slabs + opening groups — modal-depth planes, head/jamb lift,
  arch candidates`.

## Step 6 — `component-glb-fit`

- New module + tests: `triangleStats` (hand soup: unit normals, areas, degenerate zeroed);
  `scaleAlignment` reproduces voxelizeGlb+keysToArtifact mapping on a known case; `aabbAlignment`
  maps mesh corners to occupancy corners; `glbFitForPlane` on a synthetic two-plane "roof" soup
  recovers each plane (angle <1°) and returns null when no triangles are in cone/extent.
- Verify: `node --test src/form/component-glb-fit.test.mjs`.
- Commit: `feat(E-27 T-103-01): GLB reference fitting — triangle stats, two alignments, per-plane
  area-weighted fits`.

## Step 7 — `decompose` orchestration + schema

- `decompose(occ, {glb, alignment, opts})` assembling the record body + findings;
  `schema/component-record.schema.json`.
- Tests: full decompose on gable+chimney synthetic (with a matching synthetic mesh) → record
  validates with ajv against the schema file; glbFit attached with small angle; decompose twice →
  deep-equal + identical JSON.stringify; mesh withheld → `glbFit: null` + `glb-fit-missing` finding.
- Verify: module tests + full `npm test`.
- Commit: `feat(E-27 T-103-01): component record — decompose orchestration + component-record/v1
  schema (ajv)`.

## Step 8 — runner + wiring

- `benchmarks/sculpture/component-decomposition.mjs` per structure §5 (SHELLS table, double-run
  byte check, ajv gate, expect asserts, md, colored renders, frame copy, `--shell`, `--offline`);
  package.json scripts; .gitignore rule.
- Verify: `node benchmarks/sculpture/component-decomposition.mjs --subject cottage` end-to-end
  locally (GL render may be slow; failures tolerated for the record, not for the JSON).
- Commit: `feat(E-27 T-103-01): component-decomposition runner — registry-driven, deterministic,
  visualized` (runner + wiring only; records land in step 9).

## Step 9 — run the three subjects, commit records + evidence

- `npm run components:cottage && npm run components:gatehouse && npm run components:church`.
- **Human-check the renders** (read the PNGs): cottage = 2 roof-plane colors split at the ridge +
  red chimney; gatehouse = arch jambs outlined; church = two mass colors split tower/nave. The
  render is the evidence; the expect-asserts are support.
- `--offline` re-run per subject passes; full `npm test` green.
- Commit: `feat(E-27 T-103-01): component records — cottage/gatehouse/church segmented, GLB-fitted,
  visualized`.

## Step 10 — Review artifact

- `review.md`: files, coverage, open concerns (alignment quality on aabb-affine subjects, T-102
  interplay, anything the renders contradicted).

## Testing strategy summary

- Unit (node --test, GL-free): every exported core function on synthetic shells (steps 2–7) — the
  AC's "pure, deterministic, unit-tested on synthetic shells".
- Integration: the runner on the three committed shells with hard-asserted minimum expectations +
  double-run byte determinism + ajv gate (step 9); `--offline` as the cheap re-verifier.
- Visual: component-colored oblique renders, committed as pr frames — the AC's "check at a glance".

## Risks / adjustment triggers

- If gap clustering misjoins church tower/nave (shared plan columns at the junction), fall back to
  per-class assignment of columns by their own H̃ (column-exact, already the design) — only the
  merge rule may need the boundary-length tiebreak tuned; document any deviation in progress.md.
- If the gatehouse arch head profile is too ragged on the raw shell for the candidate rule, record
  `archCandidate:false` + a finding and adjust the rule only if the synthetic test stays green —
  honesty over tuning (E-25 Rule 6). The expect table is then corrected with the measured truth and
  the deviation recorded (expectations are minimums I set; the shell is the authority).
- If GL rendering fails on this host, records still commit; frames noted as a gap in review.md.
