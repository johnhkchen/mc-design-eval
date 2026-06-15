# T-059-01 Review — thin-feature-preserving voxelization

Handoff for a human reviewer. What changed, how it's tested, what to watch.

## Summary

E-16's `voxelizeGlb` decides occupancy by a single point-in-mesh parity test at each **cell center**, so
members thinner than a voxel drop out or shatter — bow-and-arrow voxelized worst of the 7 subjects (form
IoU **0.473**). This ticket adds `voxelizeGlbThin`: a **conservative surface trace** (exact triangle–box
SAT) **unioned** with the solid fill. A connected mesh surface ⇒ a connected voxel set, so thin members
survive as connected chains; on thick forms the trace is a subset of the solid fill, so the output is
**bit-identical to `voxelizeGlb`** (no regression). Measured outcome:

- **bow-and-arrow: 0.473 → 0.526** form IoU, and **4 severed fragments → 1 connected component**.
- **koi: 0.622 → 0.707** form IoU, stays 1 component (+991 fin cells).

## Files

### Created — `src/form/glb-thin.mjs` (pure, GL-free, CI-tested) — the deliverable
- `triBoxOverlap(c, h, v0, v1, v2)` — Akenine-Möller 13-axis SAT (9 edge×axis crosses, 3 box-face
  trivial reject, 1 triangle plane), generic `separates(axis)` projection test; degenerate triangle → false.
- `voxelizeGlbThin(glb, {scale=32, shell=true, thinScale=null, connectivity=26})` — solid ∪ shell;
  returns `{scale, voxelSize, dims, bounds, occupied, count, thin:{surfaceOnlyCount, components}}`. Same
  record shape as `voxelizeGlb` (+ additive `thin`), so it is a drop-in for `sampleSurfaceColors` /
  `colorVoxelsToArtifact` / `materialCleanVoxel`. `shell:false` = exact `voxelizeGlb` parity.
- `connectedComponents(occupancy, {connectivity=6|26}) → {count, sizes}` — the no-dropped-thin instrument.
- Imports the **shared** `parseGlbMesh` and the existing `pointInMesh`/`occupiedCells` — **no duplicate
  parser, no edit to `glb-voxelize.mjs`**.

### Created — `src/form/glb-thin.test.mjs` (23 tests, runs in `npm test`)
### Created — `benchmarks/sculpture/glb-voxel-thin.mjs` (live GL/dwebp glue — NOT CI)
### Modified — `.gitignore` (one stanza: thin-voxel render PNGs are derived/image-heavy, gitignored like every sibling runner)
### Created — `benchmarks/sculpture/glb-voxel-thin/{bow-and-arrow,koi}/*.json` + `thin.{md,json}` (durable record)

No symbols changed or removed anywhere — the change is **purely additive**.

## Acceptance criteria — status

- [x] **AC #1** `voxelizeGlbThin(glb, opts) → occupancy`, detects thin members + preserves connectivity at
      effective finer resolution; **shares the E-16 parser** (`parseGlbMesh`); **pure, deterministic,
      GL-free**. ("Detect thin" is realized as the exact `surface ∖ solid` mask — no medial axis needed.)
- [x] **AC #2** Unit-tested on a **synthetic ~1-unit rod** (0.25-thick): `voxelizeGlbThin` → **1 connected
      component** spanning the rod, where `voxelizeGlb` drops it to 0 cells; a **flat plate is unaffected**
      (`surfaceOnlyCount === 0`, identical occupied set).
- [x] **AC #3** Applied to **bow-and-arrow + koi**: form IoU **before/after recorded** (bow 0.473 → 0.526
      — rises above 0.473; koi 0.622 → 0.707) **plus the no-dropped-thin check** (bow 4 → 1 component;
      koi 1 → 1). In `thin.{md,json}` + summaries.
- [x] **AC #4** `npm test` green (563/563).

## Test coverage

| concern | test | strength |
| --- | --- | --- |
| no regression on thick forms | cube == `voxelizeGlb` (count 1000, identical occupied) | **strong** — bit-exact, also pins SAT boundary correctness |
| thin member survives connected | 0.25-thick rod → 1 component, spans full X length | **strong** — the central guarantee |
| flat plate unaffected | 10×10×1 plate: `surfaceOnlyCount 0`, identical set | strong |
| SAT kernel | straddle/outside/coplanar/degenerate/face-separated | good — isolated geometry cases |
| connectivity diagnostic | 2 blobs→2, 1 blob→1, 6-vs-26 diagonal, bad connectivity throws | good |
| determinism | two runs identical (occupied + components) | good |
| scale validation | rejects non-integer / out-of-range | good |
| **end-to-end IoU + components** | live bow+koi run → `thin.{md,json}` | measured, not CI |

### Gaps / not covered by automated tests
- The **live IoU numbers are not a CI assertion** — they depend on GL render + dwebp + the gitignored
  GLBs (the established harness split; every sibling runner is the same). They are reproducible via
  `node benchmarks/sculpture/glb-voxel-thin.mjs` and committed as `thin.{md,json}` + summaries.
- No test asserts behavior on a **real TRELLIS mesh with a true non-manifold gap** — the connectivity
  guarantee is structural (proved on the synthetic rod) and held empirically on bow+koi, but a pathological
  GLB with disconnected surface patches would still yield >1 component (reported honestly, per design D4).

## Open concerns / watch items for downstream

1. **Occupancy roughly 2× on thin subjects** (bow 513 → 1210; koi 2164 → 3155). Each cell = one
   `{op:"voxel"}` placement, so the artifact (and render cost) grows accordingly. Well within the AJV gate
   and `SCALE_MAX` budget here, but **T-060-01** (integration + combined remeasure) should confirm the
   heavier builds stay performant when stacked with the T-058 material-clean pass.
2. **Interaction with the speckle fix (T-058-01).** The thin pass *adds surface cells*; the material-clean
   / segmentation pass colors them. The new thin-only cells are thin-shell surface, so they sample real
   surface color — but T-060 should verify the speckle/palette metrics are not worsened by the extra
   surface area (more boundary voxels = more potential palette edges).
3. **`thinScale` knob is implemented but unused/off by default.** It's a global-scale-bump escape hatch
   (design Option A); left in for T-061 boundary-finding experiments. No test exercises a non-null
   `thinScale` beyond scale validation — fine, since the default path is the shipped behavior.
4. **Conservative trace over-thickens a genuinely sub-voxel sheet to 1 voxel.** This is intentional (1
   voxel is the minimum representable; the alternative is dropout) and harmless to thick forms, but a
   reviewer comparing renders should expect thin members to read as *exactly* 1 voxel thick, not feathered.

## Reproduce

```
node --test src/form/glb-thin.test.mjs           # the pure proof (CI)
node benchmarks/sculpture/glb-voxel-thin.mjs      # live before/after (needs GLBs + dwebp + GL)
node benchmarks/sculpture/glb-voxel-thin.mjs --offline   # rebuild thin.{md,json} from summaries
```

No critical issues. The fix is additive, measured, and reverts cleanly (delete `glb-thin.*` + the runner;
nothing else depends on it yet — integration is T-060-01).
