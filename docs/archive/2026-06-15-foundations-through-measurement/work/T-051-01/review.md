# T-051-01 — Review: GLB Voxel Build (color + DesignArtifact compile)

Handoff for a human reviewer. The **color + compile half** of E-16 Arm B (image→3D): T-050-01 occupancy
(form, no color) → each cell colored **value-true** from the GLB's own surface texture → a standard
`DesignArtifact` that render/judge consume unchanged. The build that goes head-to-head with text→JSON.

## What changed

**Created**
- `src/form/glb-voxel-build.mjs` (~190 lines) — the pure core. `blockPaletteFromTable` (305-block Lab
  vocabulary → `nearestLab` palette), `sampleSurfaceColors` (nearest-vertex UV → decoded texel; pure
  given a decoded texture), `colorVoxelsToArtifact` (per cell: `nearestLab(srgbToLab(rgb))` → value-true
  block → one `voxel` placement; sorted-unique manifest; **does not validate**), and `glbVoxelBuild`
  (ties parse+voxelize+sample+compile; impure only via an **injected** `decodeTexture`).
- `src/form/glb-voxel-build.test.mjs` (~120 lines) — 9 tests: AJV round-trip on synthetic occupancy +
  synthetic 2-color input, centering/pos map, metadata identity, empty/length guards, the UV→texel
  sampler (RGBA + RGB), and the 305-block palette adapter.
- `benchmarks/sculpture/glb-voxel-run.mjs` (~165 lines) — on-demand runner (GL + `dwebp`, **not** CI).
  Per subject: build → `assertArtifact` → render `SCULPTURE_VIEW_3Q` → silhouette IoU vs the GLB's own
  silhouette → save `artifact.json`/`render-3q.png`/`summary.json` + a rolled-up `summary.md`.

**Modified**
- `src/form/glb-mesh.mjs` (+~80 lines) — `parseGlbColoredSurface(glb)` (per-vertex positions + UVs +
  baseColor image bytes) + `extractBaseColorImage` (handles `texture.source` **and**
  `EXT_texture_webp`). `parseGlbMesh` is **unchanged** (T-050-01's voxelizer untouched).
- `src/form/glb-mesh.test.mjs` (+~85 lines) — `buildColoredBoxGlb` fixture + 6 parse tests (incl. the
  EXT_texture_webp path and the untextured-null case).
- `src/config.mjs` (+~12 lines) — `GLB_VOXEL_METHOD_ID = "glb-voxel.v1"`.
- `.gitignore` — gitignore `glb-voxel/**/render-3q.png` (renders are local-only, repo convention).

**Committed artifacts:** `benchmarks/sculpture/glb-voxel/{koi,heart}/{artifact.json,summary.json}` +
`glb-voxel/summary.md` (the durable, inspectable record; PNGs gitignored).

## Acceptance criteria

- **AC #1** `glbVoxelBuild(glb,{scale}) → DesignArtifact`, value-true per cell, **passes the AJV gate** —
  ✅ (runner calls `assertArtifact`; both real builds pass).
- **AC #2** pure color/compile **unit-tested** on synthetic occupancy + synthetic surface color → valid
  artifact + sensible manifest, **offline (no GL, no 5 MB GLB)** — ✅ (`glb-voxel-build.test.mjs`).
- **AC #3** real koi + heart builds **rendered** (`SCULPTURE_VIEW_3Q`) **+ judged**, artifacts + renders
  saved under `benchmarks/sculpture/glb-voxel/<subj>/` — ✅ (koi IoU 0.622, heart 0.877).
- **AC #4** `npm test` green — ✅ **514/514** (was 486; +28).

## Design decisions a reviewer should know

1. **Pure/impure split is load-bearing.** TRELLIS GLBs have **no vertex colors** — color is a WebP
   baseColor texture sampled by UV. WebP decode needs a host codec, kept **out of `src/` and CI**: the
   testable core takes already-sampled RGB (AC #2 mandates synthetic color, not a real GLB), and the
   runner injects a `dwebp`-backed `decodeTexture`. Mirrors `value-build.mjs` (pure math; runner decodes).
2. **Nearest-vertex (not barycentric) UV.** TRELLIS meshes are dense vs a ≤64³ grid and block
   quantization dwarfs sub-texel precision — the cheaper, simpler choice is right here. Barycentric +
   a triangle spatial index is a documented future seam.
3. **Value-true by construction.** Every cell snaps to the real full-cube block nearest its surface
   color in Lab (E-10 `nearestLab` over 305 blocks) — the same engine that killed moai value drift, so
   no name-by-hue drift is possible.
4. **"Judged" = deterministic silhouette IoU vs the GLB's own silhouette** (T-048-01), not an LLM judge
   (none exists for sculptures). It's the epic's form currency and reuses two finished deliverables.
5. **Coordinate map** i→x, j→y(up, ground y=0), k→z, x/z centered. The non-trivial IoUs confirm it.

## Test coverage

| Area | Test | Strength |
|---|---|---|
| color→block→placement→artifact (AJV round-trip) | glb-voxel-build ×3 | strong; exact manifest + real gate |
| centering / pos mapping | glb-voxel-build ×1 | strong; exact tuples |
| empty / length guards | glb-voxel-build ×1 | strong |
| UV→texel sampling (RGBA + RGB) | glb-voxel-build ×2 | strong; exact, synthetic texture |
| palette adapter | glb-voxel-build ×2 | adequate (305-block shape + reject) |
| color-aware parse (positions/UVs/bounds) | glb-mesh ×3 | strong; in-mem fixture |
| baseColor via source AND EXT_texture_webp | glb-mesh ×2 | strong; both real shapes |
| untextured → null | glb-mesh ×1 | strong |
| real koi/heart build+render+IoU | glb-voxel-run | recorded, not asserted (by design) |

## Coverage gaps / limitations

- **`glbVoxelBuild` end-to-end is not unit-tested** — by design (needs a real/synthetic textured GLB +
  decode; AC #2 forbids the 5 MB GLB in CI). Its three pieces are each tested; the tie + the WebP path
  are covered only by the on-demand runner (which did run green on both subjects). A future seam: a tiny
  synthetic textured-cube GLB + a PNG `decodeTexture` would unit-test the tie offline.
- **Performance** — `sampleSurfaceColors` is O(cells × vertices) (nearest vertex), on top of the
  voxelizer's O(cells × triangles). 12–21 s per real mesh at scale 32. Fine one-shot; **not** for a
  tight loop (S-052's surgical loop). Flag: a vertex spatial grid would cut both by ~1–2 orders.
- **Koi form is coarse** — palette-correct but boxy; the slender S-curve is lost in T-050-01's solid
  voxelization at scale 32 (17% fill). Inherited, **not** a T-051-01 defect; noted for S-052/the epic.
- **`metadata.model_id`** records the pinned id though no model is invoked (schema requires the field;
  the `glb-voxel.v1` method id makes the GLB provenance unambiguous).

## Concerns for human attention

- **Duplicate GLB parser persists.** This story added `parseGlbColoredSurface` to the canonical
  `glb-mesh.mjs`, but T-048-01's `glb-silhouette.mjs` still has its own inline `parseGlb`/`readAccessor`
  (the runner's judge uses T-048-01's `loadMeshFromGlb`). Consolidation remains **T-053-01**'s job, as
  flagged in T-050-01's review — unchanged by this ticket. *(Note: T-053-01 should also fold
  `parseGlbColoredSurface`'s base-color extraction into whatever it keeps, and could let the silhouette
  raster reuse `parseGlbColoredSurface`/`parseGlbMesh`.)*
- **`dwebp` host dependency** for the runner only. Documented in the runner header; absent on a machine
  without libwebp → the runner errors clearly, CI unaffected.

## Verdict

All four ACs met. Pure core unit-tested offline against the real AJV gate; real koi + heart builds
render value-true and judge at IoU 0.622 / 0.877; suite green (514). One inherited form limitation (koi
coarseness) and one standing cross-ticket concern (duplicate parser, T-053-01) flagged. Ready for review.
