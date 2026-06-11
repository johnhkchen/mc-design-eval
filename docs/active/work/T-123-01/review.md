# T-123-01 glb-conditioning — Review

## What shipped

The GLB conditioning stage of E-31 (pipeline-philosophy Stage 2's "then code" half): a pure,
deterministic core that turns a TRELLIS mesh into a **conditioned form sketch** —
grammar-snapped coarse planes, detected/applied axis-aligned mirror symmetry, a rectilinear
footprint, and gross proportions — committed and visualized for all four registered building
GLBs. The sketch is evidence for recognition (S-125); nothing fits against it.

### Files created

- `src/form/form-sketch.mjs` (~870 lines) — the core. Exports: `FORM_SKETCH_SCHEMA`
  (`form-sketch/v1`), `SKETCH_PARAMS` (every declared constant: sampleScale 48, faceTarget 100,
  weldEpsFrac 1e-4, symmetryConfidence 0.80, footprintSnapTolFrac 0.06, pitch buckets,
  storey band), `GRAMMAR_ORIENTATIONS` (6 axes + 8 diagonal roof/eave = 14), `triangleGeometry`,
  `snapNormal`, `coarseFaces`, `sampleOccupancy`, `detectSymmetry`, `fitFootprint`,
  `roofProfile`, `pitchBucket`, `proportionsOf`, `conditionGlb`, `buildSketch`.
- `src/form/form-sketch.test.mjs` — 21 tests over synthetic watertight soups (box, gabled prism
  at parametric pitch, L-plan, tower+hall, deterministic position-keyed noise) and an in-memory
  GLB builder; includes byte-determinism double-runs and cell-set cross-validation of the
  scanline sampler against `voxelizeGlb`.
- `src/form/sketch-plot.mjs` + `sketch-plot.test.mjs` — pure RGBA sheet (plan + front/side
  elevation panels; footprint, mirror plane, eave/ridge overlays; raw-mesh orthographic outline
  rendered into the same cell frame so sketch-vs-GLB divergence is directly visible). 4 tests.
- `benchmarks/sculpture/form-sketch.mjs` — the runner: registry-only subject resolution
  (`SUBJECTS` from durable-skin.mjs, filtered to entries with a GLB + working scale), records
  written through `guardedWriteRecord`, `--repro` fresh-process byte-compare, `--rotate-pins`
  forwarded.
- `benchmarks/sculpture/form-sketch/{cottage,gatehouse,church,barn}.{json,md}` + `-sheet.png` —
  the committed sketches, summaries, and at-a-glance sheets.

### Files modified

- `package.json` — `sketch:cottage|gatehouse|church|barn|all` scripts (direct `node`).
- Nothing else. No consumer was rewired; `glb-voxelize.mjs`, `form-routing.mjs`, milestone
  runners untouched.

### Commits

0604a8b (core + tests) → plotter/`conditionGlb` split → 9576f5f (runner + first records) →
c8bec91 (profile-run fix + per-mass pitch; **one owned pin rotation** under `--rotate-pins`).

## Acceptance criteria — status

- **Conditioning core, pure + unit-tested on synthetic meshes** ✓ (decimate via the declared
  faceTarget cap; normals snapped to the 6+45° grammar with merge; mirror detection with declared
  confidence 0.80 — below it subjects stay asymmetric with the score recorded (cottage 0.54,
  church 0.42, barn 0.55 — all honestly asymmetric meshes; gatehouse 0.87 applied); rectilinear
  footprint with declared tolerance).
- **Sketch schema, serialized, committed, visualized** ✓ (`form-sketch/v1`; one JSON + md + PNG
  sheet per subject; sheets show conditioned occupancy against the raw mesh outline).
- **All four registered GLBs** ✓ — **the church's two masses survive as two masses** (nave
  `primary` + tower `attached`, each with its own roof profile; a third small attached mass — the
  porch — is honestly recorded), **the barn's footprint is a clean 4-vertex rectangle**.
- **No downstream coupling** ✓ — greps recorded below.
- **Deterministic, registry-only, no per-building constants, npm test green** ✓ — `--repro`
  byte-identical ×4 from a fresh process; subjects enter only via the registry; every constant in
  `SKETCH_PARAMS` is universal (the three first-contact fixes were all universal-rule changes,
  re-run on all four); `npm test` 1708/1708.

## No-coupling evidence (grep, recorded)

- Importers of `form-sketch.mjs`/`sketch-plot.mjs`: exactly `{form-sketch.test.mjs,
  sketch-plot.test.mjs, benchmarks/sculpture/form-sketch.mjs}`.
- Readers of `FORM_SKETCH_SCHEMA` / the `form-sketch/` record dir: the module, plotter, tests,
  runner — nothing else.
- No `toleran*`/`fit` constant anywhere references the sketch.
- Zero subject names in the new `src/` files (code or comments — the generalization grep matches
  comments).

## What first contact taught (the load-bearing findings)

1. **TRELLIS facet normals cannot see macro pitch.** The meshes are stair-stepped: a pitched roof
   decomposes into exactly-flat + vertical micro-facets, so an area vote over normals read every
   roof as "flat" (98–99% of upward area). Pitch is now read from the median-smoothed top-surface
   profile (rise over run to the wing's own edge) — the T-118/T-122 "sampled profile" lesson.
   Consequence for the grammar stats: the roof-family orientation shares in `grammar.
   areaShareByOrientation` are ≈0% on real meshes — honest evidence of the stair-stepping, and
   the right caveat for any consumer tempted to read facet shares as form.
2. **The barn voxelizes as a hollow shell** (double-skin geometry defeats ray parity for interior
   cells). Top-surface measures are robust to this; layer-count measures are not. The substrate
   is a measurement, and the record carries `rawCount`/`count` so the artifact admits it.
3. **Decimation cap coverage**: ~12k snap-regions per mesh; the kept 100 faces cover only ~35–50%
   of area (recorded as `droppedAreaFrac`, never silent). Fine for a recognition sketch; a
   consumer wanting more coverage raises the universal `faceTarget`.

## Open concerns / limitations

- **Symmetry rarely fires on real meshes** (1 of 4): TRELLIS asymmetry is real (L-plans, towers,
  lean), so 0.80 holds; but if S-125 wants more mirror application, the threshold is the one
  declared knob — change it universally, re-run, rotate pins in an owning ticket.
- **Protrusion noise**: small roof speckles register as 4–8-cell protrusions on the barn
  (alongside genuinely real ones — the gatehouse's merlons, the cottage's chimneys). They are
  excluded from `massCount` and recorded with areas, so recognition can ignore them by size, but
  a future ticket could add a declared protrusion floor.
- **Church porch** is a third body mass (30 cells). The AC's named outcome (tower + nave
  distinct) holds; the porch is honest extra structure, not a failure — flagging it so a human
  confirms the reading against the sheet.
- **`detectSymmetry` better-half tie**: with no faces strictly on either side (degenerate), the
  low side wins by tie-break — synthetic-only edge, untested on purpose (unreachable for real
  buildings).
- The sheet PNGs are CPU-deterministic but deliberately NOT pinned (PNGs never route through the
  pin guard, per the module contract); only the JSON/md records gate `--repro`.

## Test coverage

25 new tests (21 core + 4 plot), all offline/pure: grammar snap incl. 44°/46° boundary, noisy
decimation, sampler ≡ voxelizeGlb cross-validation, symmetry both sides of the threshold +
better-half choice + grammar mirror closure, footprint rectangle/jog/L/pinch cases, profile
pitch classes 25/45/60/flat, storey-candidate banding, two-mass survival, double-run byte
equality. Gap: no unit test runs a real registered GLB (deliberate — real meshes are not stable
fixtures; the committed records + `--repro` are the integration regression).

## For the human reviewer

Look at the four `-sheet.png` files next to their GLBs — that is the AC's at-a-glance check.
The cottage sheet shows the L-plan footprint hugging the mask with chimneys as protrusions; the
gatehouse shows the applied mirror down the gate's center and the arch in the elevation; the
barn shows the steep gable triangle bracketed by eave/ridge lines over a clean rectangle.
A sibling session landed T-126-01 (pin-guard domain refusal) mid-ticket; tests and `--repro`
were re-proved after its commit.
