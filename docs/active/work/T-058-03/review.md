# T-058-03 — Review: gated secondary palette

Handoff for a human reviewer. What changed, test coverage, open concerns.

## Summary

Adds a **strictly gated secondary palette** to E-18's GLB voxelization. The primary palette stays the
design-doc manifest (the model's deliberate few blocks); the secondary brings in **at most K=2** blocks
from the full value-true table, and **only** when a block is a super-great fit for an underserved,
meaningful texture colour — cutting the snap drift the tight palette would otherwise impose, without
reopening the speckle/bloat the manifest lock fixed. Pure, GL-free, opt-in. Verified live across 7
subjects: 5 augmented (drift down on each), 2 added nothing, off-palette 0 and total ≤ size+K everywhere.

## Files changed

**Created**
- `src/form/palette-augment.mjs` — the pure core. `AUGMENT_DEFAULTS` (k, driftThreshold, minCoverage,
  fitThreshold, gainThreshold, K — all named/tunable), `augmentReport` (palette + diagnostics),
  `augmentPalette` (the AC-named thin entry, = `augmentReport(...).palette`).
- `src/form/palette-augment.test.mjs` — 7 GL-free unit tests.
- `benchmarks/sculpture/secondary-palette.mjs` — the 7-subject host/GL sweep (live/`--offline`/
  `--regen-missing`), pure `buildSecondary` roll-up.
- `benchmarks/sculpture/secondary-palette.{md,json}` + per-subject `secondary-palette/<subj>/{artifact,
  summary}.json` — the durable record (render PNGs gitignored).

**Modified**
- `src/form/glb-voxel-build.mjs` — import `augmentPalette`; `glbVoxelBuild` gains an `augment` opt;
  augments `pal` after decode, before `colorVoxelsToArtifact`.
- `src/form/material-segment.mjs` — import `augmentPalette`; `segmentMaterials` gains an `augment` opt;
  augments `snapPalette` after the palette is chosen.
- `.gitignore` — stanza for the new sweep's render PNGs.

## Acceptance criteria — status

- **AC1 — `augmentPalette` pure/GL-free + wired, thresholds + K named constants.** ✅
  `palette-augment.mjs` imports only `palette-extract`/`cielab`/`block-table` (no GL/WebP/GLB/network).
  `AUGMENT_DEFAULTS` holds every threshold and `K`. Wired opt-in into both build paths.
- **AC2 — unit tests (far+tight→added; served→none; cap holds; low-coverage→none).** ✅ All four, plus
  the fit gate and a `segmentMaterials({augment})` wiring test, plus a no-augment regression test. 7/7 green.
- **AC3 — per-subject record (added blocks + mean snap ΔE before→after); honest zeros.** ✅
  `secondary-palette.{md,json}`: each subject's added blocks `{block, gain, coverage}` and the per-voxel
  snap ΔE before→after. dancing-man/pineapple recorded as adding 0.
- **AC4 — total ≤ design-doc size + K; off-(augmented) = 0; form IoU not harmed.** ✅ Cap enforced in the
  core (`slice(0, K)`) and asserted in the wiring test; the sweep shows off-palette 0 and total ≤ size+2 on
  all 7. Form IoU is invariant under recolouring (no voxel moves) — confirmed equal to the primary build.
- **AC5 — `npm test` green.** ✅ 595/595 (588 prior + 7 new).

## Test coverage

- **Pure core (the load-bearing AC2 coverage):** synthetic atlas textures + a synthetic value-true table
  let each gate be exercised in isolation — underserved×real×fit×big-win all required; the cap; the
  low-coverage speck rejection (no speckle reopened); the fit gate; deterministic block-Lab (value-true)
  secondary. All offline, no GL/RNG.
- **Wiring:** `segmentMaterials(build, {palette, augment:{table}})` on a red surface under a neutral
  design-doc palette → the secondary block is actually used, manifest ⊆ augmented palette, off-palette 0,
  distinct ≤ size+K, AJV-valid; and the no-augment path uses only primary blocks (regression).
- **Integration / real textures:** the live scale-32 sweep (host/GL, not in `npm test`) exercises the
  whole chain on the 7 TRELLIS GLBs and produced the committed record.

### Gaps / not covered by automated tests
- `glbVoxelBuild`'s `augment` branch has **no dedicated unit test** (the wiring test covers
  `segmentMaterials`; `glbVoxelBuild` shares the identical `augmentPalette` call, and the breadth runner
  exercises it live, but a synthetic glbVoxelBuild+augment unit test would close the gap cheaply).
- `buildSecondary` (the roll-up) is **not** unit-tested — consistent with the existing `buildSeg`/`buildR1`
  runners, but it is untested markdown/JSON assembly.
- The live sweep is **not reproducible in CI** (needs the gitignored host GLBs, `dwebp`, and headless GL);
  the durable `.json`/`.md` + summaries are the record, regenerable via `--offline`.

## Open concerns / flags for human attention

1. **Pre-existing latent bug in `glb-voxel-seg.mjs` (NOT this ticket).** `runSeg` references an undeclared
   `snapPalette` (lines ~233/248/263/280) after the T-058-02 rename of that local to `palette` — a
   `ReferenceError` on a live R-seg run. It is GL/host (not in `npm test`) so it never surfaced. Out of
   T-058-03's scope; flagged for an E-18 follow-up (likely a one-line rename per site). My new
   `secondary-palette.mjs` does not have this issue.
2. **Residual drift not chipped on dancing-man/pineapple.** Both keep high snap drift (15.33 / 17.59) yet
   add 0 — their off-design colours are spread across clusters none of which clears `fitThreshold ≤ 6`
   ("no single table block is a near-exact match"). This is the conservative bar as specified; a future
   tuning ticket wanting to reduce that residual should revisit `fitThreshold`/`gainThreshold`, not the
   mechanism. Recorded in the sweep `note`.
3. **Thresholds tuned on intent, not a sweep.** `AUGMENT_DEFAULTS` are the ticket's suggested values
   (≈12/5%/6/6, K=2). The live run shows they behave sensibly (high-coverage exact-fit hues get added,
   noise does not), but they were not grid-searched. T-058-02 (which makes the augmented palette canonical)
   is the natural place to confirm or re-tune them against rendered fidelity.
4. **`augment` is opt-in by design.** Default-off keeps every existing build path byte-identical; nothing
   *consumes* the augmentation in production yet. Making it canonical across all build paths is **T-058-02**'s
   job (per its updated spec) — T-058-03 ships the mechanism + the record only. Reviewers expecting the R1/
   R-seg/e18 sweeps to already use it should look to T-058-02.
5. **`meanSnap` definitions differ by surface.** The record reports the **per-voxel** mean snap ΔE
   (sampled surface colours); `augmentReport` returns a **cluster-coverage-weighted** mean (for GL-free
   tests). Both are honest measures of the same drift; the difference is intentional and noted in the JSON.

## Risk assessment

Low. The change is additive and opt-in: with `augment` absent every path is unchanged (proved by the full
suite + a dedicated regression test). The new core is small, pure, deterministic, and reuses the
established colour primitives. The only production-facing artifacts are a new benchmark and its record;
no existing committed sweep numbers move.
