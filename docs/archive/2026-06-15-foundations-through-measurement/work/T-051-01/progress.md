# T-051-01 — Progress

Status: **complete**. All four plan steps done; `npm test` green (514); real koi + heart builds
rendered + judged. Commits land on `main` (Lisa's shared-branch model).

## Steps

- [x] **Step 1 — method id** (`22d607a`). `GLB_VOXEL_METHOD_ID = "glb-voxel.v1"` in `src/config.mjs`.
- [x] **Step 2 — color-aware parse** (`a7a037f`). `parseGlbColoredSurface(glb)` added to
  `src/form/glb-mesh.mjs` (per-vertex world positions + UVs + bounds + baseColor image bytes);
  `parseGlbMesh` untouched. 5 fixture tests via a new `buildColoredBoxGlb`.
- [x] **Step 3 — pure color/compile core** (`5b3b8a2`). `src/form/glb-voxel-build.mjs`:
  `blockPaletteFromTable`, `sampleSurfaceColors`, `colorVoxelsToArtifact`, `glbVoxelBuild`. 9 tests in
  `glb-voxel-build.test.mjs` — incl. the AJV round-trip and the synthetic UV→texel sampler.
- [x] **Parser fix** (`edf3fa7`). See deviation 1.
- [x] **Step 4 — real builds** (`1f83281`). `benchmarks/sculpture/glb-voxel-run.mjs` + `.gitignore`;
  ran both subjects. Artifacts + summaries committed; renders gitignored.

## Real-build results (scale 32, the AC #3 deliverable)

| subject | blocks | manifest (distinct) | silhouette IoU | sec |
|---|---|---|---|---|
| koi | 2164 | 71 | **0.622** | 12.6 |
| heart | 5840 | 91 | **0.877** | 20.5 |

Block counts equal T-050-01's recorded occupancy (2164 / 5840) — one placement per occupied cell, as
designed. IoU is the build render's silhouette vs the **GLB's own** silhouette at `SCULPTURE_VIEW_3Q`.
Heart reads clearly as a chambered anatomical heart (red-dominant, value-true, IoU strong). Koi carries
the koi palette (orange/white/blue) and long-body proportion but reads boxy: its slender S-curve
voxelizes coarsely at scale 32 — an **inherited property of T-050-01 occupancy** (koi is 17% fill,
"slender/sparse"), not a color/compile defect. A non-trivial IoU (0.622) confirms the coordinate
mapping is correct (a transposed/flipped map would score ~0).

## Deviations from plan

1. **`EXT_texture_webp` (the one real surprise).** The plan assumed `texture.source → image`. Real
   TRELLIS GLBs put the WebP image under `texture.extensions.EXT_texture_webp.source` (texture.source
   is absent) — the standard glTF WebP extension. The first run failed `no baseColor texture`. Fixed
   `extractBaseColorImage` to fall back to the extension, and added a fixture variant (`viaWebpExt`)
   + test so the real path is locked (`edf3fa7`). The synthetic-`source` test still covers the plain
   case. No interface change.
2. **artifact.json committed (not just summary).** The AC says "artifacts saved"; I committed the full
   `artifact.json` per subject (2164 / 5840 placements) alongside the small summaries. Only the heavy
   `render-3q.png` is gitignored (the repo's renders-are-local convention). This keeps the deliverable
   reproducible-and-inspectable from git.
3. **No new dependency.** As designed, WebP decode shells out to `dwebp` (installed); nothing was added
   to `package.json`, and `src/**` stays WebP-free (CI clean).

## Verification done
- `npm test` → 514/514 (was 486 pre-ticket; +28 across the two new suites and the webp-ext case).
- `node --check` on the runner; full live run of both subjects (GL + dwebp) succeeded.
- Eyeballed both renders: heart recognizable + value-true; koi palette-correct, form coarse (expected).
