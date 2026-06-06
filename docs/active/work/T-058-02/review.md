# T-058-02 — Review: enforce design-doc palette as a guarantee

Handoff for a human reviewer. What changed, the audit verdict per build path, test coverage, results,
open concerns. Epic E-18; the gate before the T-061 consolidation scorecard.

## Summary

Turned the design-doc-palette *convention* into a *guarantee*. Every color-assigning GLB-voxel build path
now snaps within the **augmented design-doc palette** (the design-doc manifest ∪ ≤K=2 gated secondary,
T-058-03) — never the full 305-block table or a noisy-texture median-cut. Added a pure guard
(`assertPaletteDiscipline`) that fails loudly on any off-(augmented) block or distinct count over the
design-doc + K cap, wired it into the disciplined runners, fixed a latent `ReferenceError` that made the seg
runner uncrashable-untested, fixed the **core violation** (the integrate build was snapping over a texture
median-cut), regenerated all three committed sweeps, and produced a 7-subject verification record. All 7
subjects pass: off-(augmented) = 0, distinct ≤ design-doc + 2, the canonical **heart 91 → 7** drop, form IoU
unchanged.

## Audit verdict (AC#1) — every path that assigns block colors

| Path | Runner | Before | After |
| ---- | ------ | ------ | ----- |
| **R1** | `glb-voxel-breadth.mjs` | design-doc palette, **not augmented** | `augment:true` — augmented design-doc palette |
| **R2/seg** | `glb-voxel-seg.mjs` | design-doc palette but **`ReferenceError` on run** + not augmented | bug fixed, `augment:true`, guarded |
| **integrate** | `e18-remeasure.mjs` | **no palette → texture median-cut (VIOLATION)** | `paletteFromManifest` + `augment:true`, guarded |
| **R3 surgical** | `glb-voxel-surgical.mjs` | inherits R1; no color-snap step | **unchanged — compliant by inheritance** |

- **R3 is compliant by inheritance:** it reads the R1 artifact (now augmented) and edits geometry within
  regions; it has no median-cut/full-table color snap. Its only block-introducing step is the LLM editor's
  `swap` op (`form-edit.mjs`), a deliberate *form* edit, not a palette snap over the universe — and in the
  committed run every region rolled back. The LLM-`swap` unconstraint is a noted caveat (concern #3), out of
  this ticket's color-snapping scope. **No code change** — enforcing palette there would conflate form
  editing with color discipline.

## Files changed

**Created**
- `src/form/glb-voxel-build.mjs` → `assertPaletteDiscipline(artifact, palette, {cap})` — the pure guard
  (throws on any manifest block outside `palette`, or distinct > cap; namespace-tolerant; returns the
  artifact). The consumer-side palette assert, twin of `assertArtifact`.
- `benchmarks/sculpture/palette-discipline.mjs` — the GL-free verification runner + pure `buildDiscipline`.
- `benchmarks/sculpture/palette-discipline.{md,json}` + per-subject `palette-discipline/<subj>/summary.json`
  — the AC#4 guarantee record (no render PNGs; palette metrics are render-free).

**Modified (src, CI)**
- `src/form/glb-voxel-build.test.mjs` — 5 new tests (guard pass / off-palette throw / cap / namespace /
  augment-seam; the seam test also closes the T-058-03 review gap on `glbVoxelBuild({augment})` coverage).
- `src/form/remeasure.mjs` — value-ΔE tautology note updated: E18 now snaps within the augmented design-doc
  palette (not a k=6 texture cut), and off-palette is counted against it. (Pure; the test asserts the note is
  present, not its text — unaffected.)

**Modified (runners, host/GL — not CI)**
- `glb-voxel-breadth.mjs` (R1): `augment:true`; prose.
- `glb-voxel-seg.mjs` (seg): **fixed 5 stray `snapPalette` refs → the augmented palette `aug`** (the latent
  `ReferenceError`); `augment:true`; off-palette + `assertPaletteDiscipline` measured against `aug`; record note.
- `e18-remeasure.mjs` (integrate): read the design manifest; `palette: paletteFromManifest(manifest)` +
  `augment:true`; off-palette for E18/R1/R2 against the augmented design-doc palette (was the k=6 texture
  cut); `assertPaletteDiscipline`; dropped the now-unused `SEG_DEFAULTS` import. value-ΔE reference unchanged
  (E-17 k=8, for comparability).

**Regenerated (committed artifacts/records; renders gitignored)**
- `glb-voxel/<subj>/{artifact,summary}.json` + `r1.{md,json}` (7 subjects).
- `glb-voxel-seg/<subj>/{artifact,summary}.json` + `seg.{md,json}` (7 subjects).
- `e18-build/<subj>/{artifact,summary}.json` + `e18-remeasure.{md,json}` (7 subjects).

## Results — the guarantee, measured (scale 32, all 7 subjects)

`palette-discipline.md` (the AC#4 record — distinct BEFORE = pre-fix full-table snap over the same
voxelization, AFTER = augmented design-doc):

| subject | design-doc | secondary | distinct before→after | off-(aug) | cap | form IoU (R1) |
| ------- | ---------- | --------- | --------------------- | --------- | --- | ------------- |
| dancing-man | 5 | 0 | 18 → 5 | 0 | 7 | 0.914 |
| moai | 4 | 2 | 43 → 5 | 0 | 6 | 0.565 |
| pineapple | 4 | 0 | 24 → 4 | 0 | 6 | 0.907 |
| bow-and-arrow | 6 | 2 | 34 → 6 | 0 | 8 | 0.473 |
| **heart** | 5 | 2 | **91 → 7** | 0 | 7 | 0.877 |
| mushroom | 4 | 2 | 92 → 6 | 0 | 6 | 0.98 |
| koi | 5 | 1 | 71 → 5 | 0 | 7 | 0.622 |

- **off-(augmented-palette) = 0 on all 7** (AC#2/#4). The off-palette count means *outside* the augmented
  set, NOT a return to the full table.
- **distinct ≤ design-doc size + 2 on all 7** (AC#4 cap). Largest drop mushroom 92→6; the ticket's named
  case heart **91 → 7** reproduced exactly.
- **seg sweep** (now runs at all): off-palette 973/4096/…→ **0**, speckle down on all 7, form IoU steady.
- **integrate**: E18 off-palette **0** on all 7 (was self-confirming against a texture cut); distinct 4–7.
- **Form IoU unharmed (AC#6):** byte-identical to the pre-augment R1 numbers — palette only recolours, never
  moves a voxel, so form IoU is invariant *by construction* over a fixed voxelization. Confirmed empirically
  (R1 0.914/0.565/… unchanged across regeneration) and recorded as the recolour-invariant cross-reference.

## Test coverage

- **Guard (CI, the load-bearing AC#5 coverage):** `assertPaletteDiscipline` — passes when manifest ⊆
  palette (returns the artifact); throws naming the offending block; `cap` trips on bloat even when every
  block is in-palette; namespace tolerance both directions; an `augmentPalette`-augmented build passes at
  cap = size+2. 600/600 green (595 + 5).
- **Live (host, not CI):** the `palette-discipline` record runs the guard on every subject — the record
  *cannot be produced* if any path leaks. The three regenerated sweeps each `assertArtifact` + (seg/integrate)
  `assertPaletteDiscipline` in-loop.

### Gaps / not covered by automated tests
- **`buildDiscipline` (the roll-up) is not unit-tested** — consistent with the existing `buildR1`/`buildSeg`/
  `assembleRemeasure`-runner split, but it is untested md/json assembly. (`assembleRemeasure` *is* unit-tested
  and is unchanged here.)
- **The live sweeps are not reproducible in CI** (need the gitignored host GLBs, dwebp, headless GL). The
  durable `.json/.md` + summaries are the record; regenerable via the runners + `--offline`.
- **R1's in-runner guard is omitted** (the breadth runner does not hold the decoded texture; double-decoding
  to recompute `aug` was avoided). R1's output is instead guarded by the `palette-discipline` record, which
  rebuilds and asserts the identical augmented R1 artifact. seg + integrate guard in-loop (they decode in the
  runner already).

## Open concerns / flags for human attention

1. **R2 (`glb-voxel-clean`) is NOT regenerated and shows nonzero off-palette (avg ~2790 in e18-remeasure).**
   Intentional and honest: R2 is the E-17 *material-clean* baseline, not one of the paths this ticket fixes;
   its off-palette is now measured against the augmented design-doc palette, so it correctly reports the
   leakage the disciplined paths remove. T-061 should read R2 as the "before" baseline, not a regression.
2. **Value-ΔE cost of the tighter palette (recorded, not hidden).** Against the E-17 k=8 texture reference,
   the augmented design-doc palette's value ΔE is nonzero and rose on some subjects (e.g. koi E18 16.35,
   dancing-man 13.82) — the real cost of snapping to deliberately-chosen blocks rather than the texture's own
   colors. Kept the reference at k=8 for comparability (per T-060-01 concern #2); T-061 picks one convention.
3. **R3 LLM-`swap` is unconstrained by the palette.** The surgical editor *could* introduce an off-palette
   block via a `swap` op. Out of scope here (form edit, not color snap); if R3 is ever run for keeps, a
   follow-up could route its `swap` block choices through the augmented palette.
4. **Guard thresholds inherit T-058-03's `AUGMENT_DEFAULTS`** (drift 12 / cov 5% / fit 6 / gain 6, K=2),
   tuned on intent not a grid search. The cap = design-doc + 2 follows directly from K=2; if K is ever
   raised, every `cap: prim.length + 2` call site must move with it (4 sites: seg, integrate, record ×2).

## Risk assessment

Low–moderate. The src change is additive (a pure guard + 5 tests; the remeasure note text). The runner
changes are at call sites only — cores untouched. The regenerated artifacts move committed numbers
deliberately (that is AC#3); form IoU is provably unchanged. The one behavior the suite cannot guard is the
live GL sweeps; the `palette-discipline` record (run live here, all 7 pass) is the standing proof, and the
in-`src` guard + tests prevent a future full-table snap from silently re-entering CI-covered code paths.
