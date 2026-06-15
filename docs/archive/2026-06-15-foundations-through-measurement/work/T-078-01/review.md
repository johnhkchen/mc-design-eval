# Review — T-078-01 view-layer-and-structural-read

Handoff for a human reviewer. The E-23 substrate (story S-078): hand the LLM a **view** + a small
geometric structural read, not 57k voxels. Built across `src/view/` + a live cottage proof. Commit
`b44536e`. `npm test` green (845 pass, +29 new).

## What changed

**New — `src/view/` (the substrate, all pure cores GL/I-O-free):**
- `occupancy.mjs` — `artifactOccupancy(artifact)` / `occupancyFromCells(list)` → a material-carrying
  `Occupancy { bounds, dims, cells:Map<voxelKey,block>, has, block }`. Reuses `expandArtifact` (no
  refork). Keeps the artifact's own integer space (negatives intact).
- `surface-grid.mjs` — **Path P**. `projectSurface(occ, dir)` for 6 ortho + 4 ground-diagonal dirs:
  front-most surface voxel per cell **+ depth + face normal**. `backProject(grid)` reads each cell's
  stored `voxel` → the surface set. `gridMaskOf`. `resolveDir` throws on arbitrary-oblique (AC scope,
  enforced).
- `structural-read.mjs` — `footprint`, `storeyBands` (+`floorLines`), `openings` (door/window via
  enclosed-air flood-fill), `roofRegion` (+coverage), `wallFields` (per-face surface cells + holes +
  block tally), `structuralRead` bundle.
- `multi-angle.mjs` — **Path R**. Pure `VIEW_ANGLES` (6 ortho + 4 diag + 3/4) + `resolveAngle` (named
  or arbitrary 3-axis). Impure `renderViews` (lazy render-tool, E-22 lens).
- `reference-quantize.mjs` — `referenceTarget`/`quantizeToFace` wrapping `gridFromImage` at `n`=face
  width with the design-doc `manifest` whitelist; pure `quantizeOpts`/`bareList`.

**New — runner:** `benchmarks/sculpture/view-layer-proof.mjs` (`npm run view:proof`). **Modified:**
`package.json` (one script). **Untouched:** `expand.mjs`, `camera.mjs`, `render.mjs`, `image-grid.mjs`
— all reused as-is.

## AC coverage

| AC | Status | Evidence |
|----|--------|----------|
| Multi-angle view reader (E-22 lens; ortho 6 + 45° + arbitrary; read any angle) | ✅ | `multi-angle.mjs`; live proof rendered front/3-Q/top/+x+z; `resolveAngle` accepts arbitrary angles |
| 2.5-D projected surface grid (ortho/45° only) + depth + normal; round-trip project→back-project | ✅ | `surface-grid.mjs`; round-trip identity unit-tested on cube for all 6 ortho + 4 diag; **TRUE on the real cottage -z face (571 cells)**; arbitrary-oblique throws |
| Structural read (footprint, storey bands, openings) + roof region + wall fields | ✅ | `structural-read.mjs`; cottage proof: floorLines [0,7,14], roof coverage 0.793, ±x wall holes=4, window openings |
| Same-angle reference grid-quantize to the face cell grid (`gridFromImage`) | ✅ | `reference-quantize.mjs`; proof: 26×26 grid, validate mode, **outOfPalette=0** within the 6-block manifest |
| Pure cores unit-tested on synthetic occupancy + one live cottage GL render under work dir | ✅ | 29 tests across 5 files; `view-front/threeQuarter/top/+x+z.png` + `view-layer-report.json` saved |
| `npm test` green | ✅ | 845 pass (was 816) |

## Test coverage & gaps

- **Strong:** the load-bearing invariant — back-projection round-trip — is tested as an explicit
  identity for every ortho + diagonal dir on synthetic occupancy **and** re-verified on the real
  cottage face in the proof. Boundary enforcement (arbitrary-oblique throw) tested. Structural read
  tested on hand-built shapes with independently-derived expectations (L footprint, 2-storey bands,
  punched-wall hole, window/door). Reference-quantize validate-mode (outOfPalette 0) proven purely.
- **Gaps (acceptable, noted):**
  1. *GL render edge untested in the unit glob* — `renderViews`' actual GL call is exercised only by
     the live proof (by design; the glob stays GL-free, mirroring `glb-silhouette`/`image-grid` which
     leave decode/GL to runners). The pure angle table + resolver are unit-tested.
  2. *`gridFromImage` decode path* in `referenceTarget` is image-grid's own already-tested seam; our
     test drives the pure `gridFromPixels` with the real opts instead of committing a binary fixture.
  3. *Storey-band / floor heuristics* (`floorFillThreshold=0.6`, dominant-block grouping) are not
     gated against a ground truth — they are reported for eyeball validation. The cottage's
     floorLines [0,7,14] look right (a 3-storey read) but this is a heuristic, not a proof.
  4. *Diagonal normal* uses a first-air-face fallback; correct for surface voxels, approximate for the
     rare doubly-occluded case (documented in code).

## Open concerns / handoff notes for downstream stories

- **Roof coverage 0.793 and ±x wall holes=4 on the cottage are REAL defects, not read bugs** — they
  are exactly what **S-084 (surface-coherence)** must seal before **S-080 (hollow)**. The read
  surfacing them is the intended deliverable; `wallFields.holes` and `roofRegion.coverage` are the
  measurable signals S-084's ACs reference.
- **S-079 (spray-paint):** consumes `projectSurface` (the canvas) + `referenceTarget` (the cell-aligned
  material target) + `storeyBands` (the plaster-band start). Note in `progress.md`: the proof quantized
  the build's own front render as the reference; production should render the **textured GLB** at the
  same angle (no direct textured-GLB GL path exists yet — same mechanism, different image source).
- **S-081 (floorplan):** consumes `storeyBands.floorLines` as floor heights.
- **No critical issues for human attention.** Reused modules untouched; the ticket frontmatter `phase`
  is left for Lisa (it auto-advanced ready→…→implement during this pass — not committed by me).

## Risk assessment

Low. The substrate is additive (a new `src/view/` sector), changes no existing module, and the one
correctness-critical claim (unambiguous back-projection) is structurally guaranteed (cells store their
source voxel) and tested both synthetically and on real data. GL flakiness cannot break the `npm test`
gate (the proof is a separate runner).
