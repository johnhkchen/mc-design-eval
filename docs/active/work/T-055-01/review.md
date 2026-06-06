# T-055-01 — review: material-clean-pass (E-17 rung R2)

Handoff for a human reviewer. What changed, how it's tested, what to watch. The headline: the GLB-voxel
build's **speckle is gone** — distinct-block count collapses (koi 71→8, heart 91→7, mushroom 92→7) and
spatial speckle ≈ halves on all 7 subjects, while form IoU holds to ±0.001. The win is purely on the
*surface*, by construction, with zero form cost.

## What changed

### Source (in `npm test`, pure)
- **`src/form/glb-voxel-build.mjs`** — *modified, behavior-preserving.* Extracted `keysToArtifact(occupancy,
  keys, opts)` (the i/j/k→`pos` centering + `minecraft:` prefix + sorted-unique manifest + wrapper) out of
  `colorVoxelsToArtifact`, which now snaps colors→keys then delegates. Single source of truth shared by R1
  (colors→keys) and R2 (keys directly). The existing R1 tests pass unchanged — the proof it's a no-op.
- **`src/form/material-clean.mjs`** — *new, the R2 core.* Pure exports: `extractTexturePalette`
  (E-10 palette from the decoded texture → value-true snap palette), `snapColorsToPalette`,
  `denoiseVoxelKeys` (Chebyshev-box neighbourhood majority, ties keep current, read-old/write-new),
  `speckleScore` (face-adjacent differing-pair fraction), `applyMaterialTexture` (optional E-11, off by
  default), and the headline `materialCleanVoxel(build, opts)`. Impure-via-injection `materialCleanGlb`
  wraps voxelize + parse + injected `decodeTexture` + the core, mirroring `glbVoxelBuild` exactly.
- **`src/form/material-clean.test.mjs`** — *new, 8 tests.* Synthetic, pure, GL-free; AJV round-trip.

### Benchmarks / runner (GL + host tool, NOT in `npm test`)
- **`benchmarks/sculpture/glb-voxel-clean.mjs`** — *new.* The R2 sweep over the 7 subjects; imports
  `SUBJECTS` from `glb-voxel-breadth.mjs`; reuses the dwebp/judge/regen glue locally. Reconstructs R1
  before-keys from the committed `glb-voxel/<subj>/artifact.json` and reports before→after.
- **`benchmarks/sculpture/glb-voxel-clean/<subject>/{artifact.json,summary.json}`** + **`r2.{md,json}`** —
  *new, durable.* Renders (`render-3q.png`) are gitignored.
- **`.gitignore`** — added the R2 render-PNG ignore line.

## Test coverage

- **Unit (8, in `npm test`):** palette extraction is small + value-true; per-voxel snap shrinks distinct
  count (gradient 22→k); denoise absorbs a speck (distinct→1, speckle→0, occupancy unchanged) and a 50/50
  tie keeps current; `speckleScore` on hand grids; `materialCleanVoxel` end-to-end → `assertArtifact`
  passes + manifest ≤ naive; `applyMaterialTexture` stays in-table; `keysToArtifact` parity. Suite:
  **522/522** (was 514).
- **Integration (manual, live run):** 7/7 subjects built, asserted, rendered, judged; `r2.{md,json}`
  written; `--offline` re-run is byte-stable (determinism).
- **Gaps (acceptable, by the project's CI boundary):** the GL render path and the dwebp WebP decode are
  not in `npm test` (the `src/**`-only glob; the established split — pure logic in `src/`, host/GL glue in
  the harness). `materialCleanGlb`'s impure tie-together is exercised only by the live run, not a unit
  test — same as `glbVoxelBuild`. `applyMaterialTexture` is covered as a unit but is never exercised by
  the sweep (it's opt-in and off, by Decision 6).

## Results (the deliverable)

| subject | distinct R1→R2 | speckle R1→R2 | form IoU R1→R2 |
| ------- | -------------- | ------------- | -------------- |
| dancing-man | 18 → 5 | 0.528 → 0.275 | 0.914 → 0.914 |
| moai | 43 → 5 | 0.643 → 0.248 | 0.565 → 0.565 |
| pineapple | 24 → 5 | 0.549 → 0.250 | 0.907 → 0.907 |
| bow-and-arrow | 34 → 8 | 0.706 → 0.366 | 0.473 → 0.473 |
| heart | 91 → 7 | 0.692 → 0.343 | 0.877 → 0.877 |
| mushroom | 92 → 7 | 0.522 → 0.301 | 0.980 → 0.980 |
| koi | 71 → 8 | 0.723 → 0.350 | 0.622 → 0.623 |

Every subject: distinct-block count down hard, speckle ≈ halved, form IoU steady. The "right shape, dirty
surface" R1 failure mode is resolved.

## Open concerns & limitations

1. **Speckle floor ≈ 0.25–0.37, not 0.** Denoise (radius 1, 1 pass) removes isolated specks but leaves
   the legitimate boundaries between the canonical blocks — a value gradient genuinely transitions between,
   say, two grays, so adjacent cells there *should* differ. That residual is real structure, not noise.
   A reviewer wanting an even cleaner read could try `passes: 2` or `radius: 2`, but watch for washing out
   true 2-block detail (and it would not change form IoU). Not pursued — the current drop is decisive.
2. **Form IoU is silhouette-only and recolor-invariant.** "Form steady" is guaranteed by construction (R2
   never moves a voxel; every block is an opaque full cube), so the IoU column is a *sanity check that the
   pipeline didn't corrupt occupancy*, not independent evidence the clean helped. The visual cleanliness is
   the real result — eyeball `glb-voxel-clean/<subject>/render-3q.png` against `glb-voxel/<subject>/` (R2 is
   not auto-scored on cleanliness; the metric is structural via `speckleScore`).
3. **Texture-atlas background handling.** `extractTexturePalette` uses E-10's default near-black
   `dropColor`. The TRELLIS atlases behaved well (palettes 5–8, no degenerate "all background" cluster),
   but a future subject with a non-black atlas fill could pull a junk block into the palette. Mitigation
   exists (`dropColor` / `k` are plumbed through `materialCleanVoxel` opts); none was needed here.
4. **`paletteSize` varies 5–8 across subjects** (median-cut stops early when the texture has fewer than `k`
   real color modes). That's correct behavior, not a bug — a simpler texture earns a smaller palette.

## No action needed from a human to merge

`npm test` green, determinism verified, no secret leak, working tree clean apart from this ticket's
artifacts. The change is additive (a new core module + runner) plus one behavior-preserving refactor gated
by existing tests.
