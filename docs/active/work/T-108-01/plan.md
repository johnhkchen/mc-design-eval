# T-108-01 gable-and-verge-fit — Plan

Each step is independently verifiable and commits atomically. `npm test` green after every step.
GL only in steps 5–6 (never in `npm test`).

## Step 1 — `src/form/roof-end-fit.mjs` + unit tests

Implement `END_FIT_DEFAULTS`, `alignedTriangles`, `fitGableEnds` per structure.md.

Tests (`roof-end-fit.test.mjs`, synthetic only — the roof-fit.test pattern):
- helper: synthetic mesh from quads (positions Float-ish arrays, identity-like alignment with
  declared scales) + a minimal gable/record (reuse `rectRuns`-style helpers locally);
- a clean gable-end mesh (vertical band face at z=12, wall face below at z=12, roof sheet to z=13)
  → `faceCoord 12`, `coord 13`, `overhang 1`, `faceRmse` ≈ 0, source `glb`;
- recessed verge (roof sheet to z=14, wall at 12) → overhang 2;
- no wall slab in the record for that dir → end null + `end-unfitted` finding;
- fitted end past the as-built footprint end → null + `end-fit-insane` (numbers in detail);
- `hip.demanded` gable → ends skipped + `end-hip`; same gable through `gableEndsVariant` → fitted;
- input gables not mutated (deep-equality of the originals).

Verify: `npm run test:unit` green. **Commit 1**: `feat(E-28 T-108-01): roof-end-fit core — GLB end-face fit (face plane, verge overhang, geometric sanity)`.

## Step 2 — ends-aware generator

`roofHeightfield`: skip columns beyond `ends.*.coord`; `owner.sheet` flag for columns beyond
`ends.*.faceCoord` when that gable wins. `generateRoof`: sheet columns place the surface course
only (stair/full at top, slab on half), no underside fill.

Tests (extend `roof-generate.test.mjs`):
- gable with `ends.hi = {coord: 5, faceCoord: 3}` on a z-ridge: columns z>5 absent from heights;
  z∈4..5 sheet (exactly 1–2 cells per column: top ± slab); z≤3 solid to floor;
- no `ends` → byte-identical output to current behavior (regression pin: serialize cells of the
  existing symmetric fixture before/after);
- two-gable composition where a solid winner overrides a sheet loser at a shared column.

Verify: unit suite green. **Commit 2**: `feat(E-28 T-108-01): ends-aware roof generator — footprint trim + verge/eave sheet course`.

## Step 3 — swap: carve set, ladder, record data

`judgeVariant` carve/census cols from surviving pool `footprint.cols`; `swapRoof` 8-rung ladder
with `args.endFit` optional; `generated.fittedEnds` / `endCoords`; attempts gain ends summaries.

Tests (extend `roof-swap.test.mjs`):
- trimmed end leaves NO residue: occ with blob cells past the fitted end → carved, not regenerated
  (assert cells absent post-swap and census.after counts them gone);
- no `endFit` → ladder names/order = the legacy four (dedup proof) and result byte-identical;
- end-fitted rung accepted first when it passes the cage (synthetic refSils built via
  `voxelSilhouettes` of a target shape that matches the trimmed roof);
- all-rungs-rejected → input returned unchanged, reasons named;
- fit-error-dropped gable's footprint NOT carved (existing semantics pinned).

Verify: unit suite green. **Commit 3**: `feat(E-28 T-108-01): roof swap — end-fitted ladder rungs, carve covers untrimmed footprint, ends recorded`.

## Step 4 — runner wiring

`roof-program.mjs`: alignment, `fitGableEnds` (plain + suppressed), pass `endFit` to swap; budget
`6·gables + 2·fittedEnds`; `EVIDENCE_ANGLES` + `+x+z`; end frames at 45°/315°; record/md fields.

Verify: `npm test` green; `node benchmarks/sculpture/roof-program.mjs --subject cottage --repro`
parses + runs the core twice deterministically (expected: DIVERGES from the committed record —
the new geometry — exit 1 is the *signal*, read the log to confirm determinism line). **Commit 4**
with step 5 (the record regen) or alone if the live run needs iteration.

## Step 5 — live evidence: cottage + gatehouse

1. `npm run roof:cottage` — expect an `end-fitted*` rung accepted; inspect record: ends present on
   both main-gable ends (+z/−z) with coords pulled in from 15/−16 toward the walls (±12 + fitted
   overhang); census after ≤ budget; IoU within tolerance at all 4 azimuths; closure holds;
   chimney protected; unmapped 0; renders before/after at 45°/135°/225°/315°.
2. `npm run roof:cottage -- --repro` → MATCHES; `-- --offline` → OK.
3. Same for `roof:gatehouse` (suppressed-hip ends eligible — the ticket's "where its component
   record names gable ends"); watch the budget with 2 fitted ends and the existing census 2.
4. Eyeball the 45°/315° before/after PNGs: gable ends read as constructed triangles with a clean
   verge, not blob residue / solid cliffs. (Evidence, not a gate — Rule: renders never decide.)
5. If a rung is rejected: the reasons land in the record — analyze, fix forward only if it's a
   bug; an honest cage rejection with named reasons is an acceptable ticket outcome (Rule 2), but
   given the cottage numbers (3–4 cell solid overruns removed, IoU should improve) acceptance is
   expected.

**Commit 5**: `feat(E-28 T-108-01): cottage+gatehouse through the gable-end fit — records, artifacts, 45°/315° evidence`.

## Step 6 — full verification + docs

- `npm test` (schema self-tests + full unit suite) green; render suite untouched.
- `git status` — no stray artifacts; PNGs respect .gitignore patterns (`roof/**/*.png` ignored?
  check — frames under `pr/assets/frames/` are committed by convention).
- progress.md kept current throughout; review.md written last (phase 6).

**Commit 6** (if needed): docs/work artifacts.

## Testing strategy summary

| Layer | Vehicle | Gate |
|---|---|---|
| End fit math | synthetic meshes/gables, `roof-end-fit.test.mjs` | npm test |
| Generator fill | synthetic gables + regression pin, `roof-generate.test.mjs` | npm test |
| Swap/cage | synthetic occupancies + refSils, `roof-swap.test.mjs` | npm test |
| Determinism | runner double-run + `--repro` fresh process | live run exit 0 |
| Acceptance | cage checks + census budget + unmapped gate in the run | live run exit 0 |
| The actual AC | record fields + 45°/315° before/after renders | human-readable evidence |

## Out of scope (named, for the reviewer)

- Re-judging any view (T-111 owns verdicts).
- West-wing unfitted planes roof-1/5/6/7 (S-109 silhouette-residual).
- Slope-side eave sheet conversion (design.md decision 3).
- Material zoning of the gable triangle (skin seam, E-26).
- Church (S-110 unblocks it; `roof:church` stays fallback).
