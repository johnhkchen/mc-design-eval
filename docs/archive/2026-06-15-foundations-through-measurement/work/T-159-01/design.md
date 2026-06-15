# T-159-01 Design — generate-first watertightness

Two independent defects (research.md): **(A) ragged/holey footprint → wall slots**, **(B) fragmented
phantom openings → scattered + see-through holes**. The roof is already clean and must stay untouched.
Both fixes must be pure, deterministic, per-building-constant-free, and provably inert where the plan
was clean.

## Where to apply the fix: FIT vs GENERATE

- **Option 1 — regularize in `fitProvision`** (rewrite `m.runs` / drop phantom openings before
  recording). Cleaner recorded spec, but mutates `provision-fit.json` (the *evidence* record), churns
  fit tests, and overlaps the now-complete T-150-01's fit surface.
- **Option 2 — regularize in `generateProvision`** (the construction stage). fitProvision stays the
  honest evidence recorder; `provision-fit.json` is unchanged. "Author a watertight envelope from
  noisy evidence" and "carve only coherent apertures" are *construction* decisions, which is exactly
  this module's job (it already erodes the perimeter and carves by exclusion). Smallest blast radius,
  one module, easiest inert-proof.

**Decision: Option 2.** The generator already owns envelope authorship (erosion, exclusion-carve);
regularization is the same concern. Keeps FIT as pure evidence (matches the module's stated contract:
"the blob is fit evidence"). Localizes test churn to provision-generate.

## Part A — watertight wall envelope

The current wall is `cols − erode(cols, wallThickness)` (provision-generate.mjs:166–186). With a
holey/ragged `cols`, this leaks two ways: interior plan-holes make interior cells look like boundary
(stray interior rings), and missing perimeter columns are simply absent (see-through slots).

Options:

- **A-rect.** Replace the footprint with its bounding rectangle. Rejected — destroys genuinely
  non-rectangular masses (cottage main+wing, L-plans); not generate-first-general.
- **A-fill.** Flood-fill the plan from outside the bbox; any cell not reached is an enclosed plan-hole
  → add to the footprint. Build the wall ring on the **filled** footprint `F`:
  `wall = F − erode(F, wallThickness)`. Because the boundary of a filled (hole-free) region is a
  single closed loop, the ring has **no see-through gaps** — watertightness is structural, not tuned.
  Fixes interior rings + most slots. Leaves the *outer* notch raggedness (cosmetic) intact.
- **A-close.** Morphological **close** of the plan (dilate-then-erode by a small SE) before A-fill —
  fills ≤k-wide perimeter notches and bridges ≤k-wide run gaps so the outer boundary reads straight,
  not just continuous. [[morphology-cage-learnings]]: *close does the work*; the close was the lever on
  the 3-D spike cage, here in 2-D plan.

**Decision: A-fill + A-close (close THEN fill), default SE radius 1.** Close-1 bridges the common
1-wide blob notches (the dominant comb source); flood-fill guarantees the closed loop regardless of
any wider gap that survives the close. The two compose: close smooths, fill guarantees closure. SE
radius is a general default (`planCloseRadius`, like `minRunWidth`), not per-building. Wider gaps
(e.g. the genuine 4-wide door reveal) are not bridged by close-1, but they are not *holes* in the
plan — they are the doorway, correctly left open by the opening carve, and the ring still closes
around them.

Dilation must be **clamped to the footprint bbox** (never grow the building outward past its fitted
extent) — close = dilate-then-erode returns to ≤ the convex extent, but clamping keeps it honest and
keeps the zero-blob/extent invariants. The roof's `sheetCols` exclusion (overhang columns have no
wall) is applied *after* regularization, unchanged.

## Part B — opening coherence gate

`generateProvision` carves every `op` in every group (provision-generate.mjs:212–237) with no
size/coherence test. 28 of 42 barn apertures are ≤2-cell phantom specks (og-3/og-14: 7×1×1 at y6).

Options:

- **B-area.** Skip apertures whose carved footprint area < `minApertureCells`. Simple, but a thin tall
  slit window (1 wide × 4 tall = 4 cells) could be legitimate.
- **B-dim.** Skip apertures unless `width ≥ minOpeningW ∧ height ≥ minOpeningH`. Distinguishes a
  phantom 1×1 speck from a real 13×7 wagon door or a 1×3 slit by *both* dimensions. The phantom y4/y6
  specks are 1×1 (fail both); the wagon door 13×7 passes.
- **B-coherence.** Require apertures to merge into runs ≥ a min run (the [[surface-paint-respects-run-rule]]
  idea). More machinery than needed; B-dim already separates the populations cleanly here.

**Decision: B-dim, defaults `minOpeningW = minOpeningH = 2`.** A real opening is at least 2×2 (a
1-wide-or-tall aperture in a 2-thick wall is a blob speck on this evidence, not a designed window).
The barn's phantom y4/y6 1×1s fail; the wagon door (13×7) and the larger groups pass. Skipped
apertures become NAMED findings (`opening-incoherent`), never silently dropped (Rule 1). This is a
general default; subjects with genuinely tiny apertures can lower it, but 2×2 is the honest floor for
"this is a hole someone meant, not voxel noise."

Note og-2/og-13 (`head=none`, ~42×5 near the top): a wide refused-head band. It is NOT ≤2-cell, so
B-dim keeps it; if it proves to be a top-band artifact, that is a separate fit concern, out of scope
here (this ticket is solidity, not aperture-fit quality). Flag, don't chase.

## Six-direction closure & the hollow loft

- **Four walls + gable ends:** Part A makes each a continuous ring → no see-through (front/back/left/
  right). Gable-end walls (T-150-01) are already solid sub-surface fill; unaffected.
- **Top:** the roof is solid (research census) — closed.
- **Bottom:** generate-first deliberately has **no floor slab** (flipping the storey-band y-anchor,
  provision-generate.mjs:159–164). The build's base rests on the ground plane at `baseY`; the
  underside is not visible from the gate azimuths. We do **not** re-add a floor (would regress the
  band map). "Watertight around the carve" (S-084) = the *exterior shell* has no holes; the hollow
  loft (eroded interior air) is preserved by building only the ring, exactly as today.

## Inert-where-clean proof strategy

- A-fill/A-close on an already-rectangular, hole-free footprint is the **identity** (no holes to fill,
  no notches to close, dilate-then-erode of a filled rectangle = itself). Unit test: a clean rectangle
  in → identical cols out.
- B-dim on a build whose apertures are all ≥2×2 carves the **same** cells. Unit test: a 3×3 opening is
  carved unchanged; a 1×1 is skipped + recorded.
- End-to-end: the cottage (clean) and a synthetic clean fixture must be byte-identical before/after;
  the barn loses its slots + phantom windows. `--repro` stays green (deterministic transforms of the
  recorded parameters).

## Rejected globally

- Re-adding an interior floor — regresses the band anchor.
- Touching `roof-generate.mjs` — the roof is already watertight; changing it risks the T-150 gable
  work for no gain.
- Any barn-specific number — every new knob is a `PROVISION_GENERATE_DEFAULTS` general default.
