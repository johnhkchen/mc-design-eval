# T-139-01 Research — skirt-aware eave detection

Epic **E-34** (straight-ruler) / Story **S-139**. Descriptive map of the instrument that
mis-identifies a plinth band as the eave line. No solutions here.

## The defect, in one sentence

`maskProportions` anchors the eave on the **topmost row whose extent ≥ `eaveWidthFrac` (0.98) ×
the GLOBAL max row extent**. When a build carries a realized plinth/water-table course that juts
out past the walls, the plinth *is* the global max, only the plinth's own rows clear `0.98 ×
plinth`, and the eave line lands on the **plinth top** — everything above (walls + roof) reads as
roof. The E-33 cottage recorded ridge:eave **5.5** / roofShare **0.8182** instead of the corrected
≈**1.7** / ≈**0.45** family. T-138-02 review, finding 4.

## Where it lives

- **`src/form/silhouette-proportion.mjs`** — the pure module (no GL/IO/Date/random, runs under
  `src/**/*.test.mjs`). The relevant surface:
  - `PROPORTION_DEFAULTS` (line ~41): frozen op parameters — `tolerance 0.15`, `absoluteFloor
    0.05`, `ridgeMinWidthFrac 0.25`, `eaveWidthFrac 0.98`, `conceptMaxCoverage 0.5`.
  - `maskProportions(mask, opts)` (line ~125): **the single point of the defect.** Computes per-row
    `extents[]` and `maxExtent`, then in one downward pass sets `ridgeRow` (first row ≥ `ridgeFrac ×
    maxExtent`), `eaveRow` (first row ≥ `eaveFrac × maxExtent`), `groundRow` (last fg row). Returns
    `{ridgeRow, eaveRow, groundRow, totalH = groundRow−ridgeRow+1, eaveH = groundRow−eaveRow,
    maxExtent}` or `null` for a degenerate mask. **Both the eave and ridge thresholds key off the
    same `maxExtent`.**
  - `ratiosFromMask` / `targetsFromConceptMask` (alias) — single-mask `{ridgeToEave, roofShare}`;
    `null` constituents when `eaveH < 1`.
  - `elevationMask(occ, axis, {bbox})` / `planMask` — orthographic occupancy projections, row 0 at
    TOP, tight-cropped. The build substrate.
  - `proportionRatios(occ, {masses})` → `ratiosOver`: projects BOTH elevations, runs
    `maskProportions` on each, then **`eaveH = MIN across views`** (the taper view sees the true
    widest-layer eave), **`totalH = MAX across views`** (the along-ridge view sees the full ridge),
    `aspect` from the plan bbox. Per-mass rows over restricted bboxes.
  - `deriveProportionDeclarations` / `compareRatios` — target derivation + the gate arithmetic.
    Concept-first, sketch fallback; `targetsFromConceptMask` runs `maskProportions` on the concept
    silhouette, so **the same eave rule grades the concept target too** (one rule, two substrates).

- **`packs/README.md`** (§"Proportion conformance", lines ~16–54): the FROZEN, declared
  documentation of the detection rules — eave = "the eave stays the widest layer", ridge guard,
  ratio definitions, tolerance, rollback. **Any rule change must update this prose** (AC #1).

- **`src/form/silhouette-proportion.test.mjs`** — 12 synthetic tests (SP1–SP12). Hand-built
  `gableHouse` occupancy + `triangleOnBoxMask` image-style mask, with hand-derived eave/ridge/ratio
  expectations. These pin the current contract; the fix must keep them green (none has a plinth).

- **`src/pack/conformance.mjs`** — the workshop round gate calls the module declaration-driven (runs
  iff the program declares `declarations.proportions`). Not touched by this ticket.

- **`src/workshop/loop.mjs`** — `proportionRegression` no-regress cage (compares `excess` across
  rounds). The bent ruler inverted the loop's gradient here. Not touched by this ticket.

## The cottage evidence (measured, this session)

Elevation-mask row extents of the committed `cottage/final-artifact.json` (row 0 = top):

- **x-view (along ridge, w=29, h=25):** chimney `3,1,1`, then a solid wall+roof column at extent
  **28** for ~17 rows, with **29,29** at rows 20–21 (yFromBottom 3–4 — the plinth course), `28`
  below. `maxExtent=29`. `0.98×29 = 28.42` → only the two `29` plinth rows qualify → **eaveRow lands
  on the plinth top, eaveH=4**.
- **z-view (gable/taper, w=28, h=25):** chimney, roof taper `2,4,6,8,10`, walls `23,24,25,26,27,26…`,
  plinth **28,28** at rows 20–21, `26` below. `maxExtent=28`, `0.98×28 = 27.44` → only the two
  plinth rows qualify → **eaveH=4** again.
- Assembly: `eaveH = min(4,4) = 4`, `totalH = max(22,19) = 22` → **ridge:eave 5.5, roofShare
  0.8182** — exactly the recorded numbers.

## The barn evidence — why "global max" is not the whole story

The barn is the AC's named **skirt-free** regression check. Its **x-view max extent (28) appears in
only ONE row** — a genuine **eave overhang** sitting *above* walls of extent 26. The barn's eaveRow
is mid-mask (12 rows of wall below it), not at the bottom. So the over-wide row is a *real eave*,
high in the silhouette. Contrast the cottage, whose over-wide rows are *low* (a plinth). **Position,
not run-length, separates a plinth from an eave overhang** — a structural run-count rule that simply
demotes "the widest extent that spans few rows" would move the barn's eave and break byte-identity
(measured: such a rule pushes barn refExtent 28→26). This is the central constraint on the fix.

## Constraints (binding)

1. **No subject-conditional code, no per-building constants** (AC #1). Whatever distinguishes a
   skirt must be a *declared, frozen op parameter* in `PROPORTION_DEFAULTS`, documented in
   `packs/README.md` beside the existing rules — same posture as `eaveWidthFrac`.
2. **Monotone / identity-class discipline** (AC #2; T-095/T-101/T-110/T-137 precedent). Every mask
   *without* a qualifying skirt must derive **byte-identical** lines/ratios under old and new rules.
   The barn (and `gableHouse`, `triangleOnBoxMask`) must be provably unchanged. Where rules differ
   (the cottage), **both rulers reported side by side**.
3. **Committed records untouched.** `benchmarks/sculpture/proportion/*.json` keep their old numbers;
   pin-guard protects them. The terminal re-verdict belongs to **T-143**. The witness repro
   (`proportion:repro`) is **not** part of `npm test`, so the module change does not fail CI on
   those records.
4. **No judge runs, no pin rotations** (AC #4 — T-142/T-143 own those). Workshop↔judge isolation
   scan unchanged. The frozen judge contract, azimuths, thresholds unmoved.
5. **Purity preserved** — no GL/IO/Date/random; the fixture must be synthetic or pinned mask data,
   not a `benchmarks/` file read at test time.

## Open questions for Design

- What declared signal cleanly separates a *low plinth* (strip it) from a *high eave overhang*
  (keep it) and a *normal wall-as-widest-layer* (keep it), with zero new constants beyond the
  minimum? (Candidates: bottom-region position prior; structural run-count — rejected by the barn
  evidence above; explicit "wider than the wall column above.")
- What is the corrected cottage ratio family the fixture should pin, and does the chosen mechanism
  leave `gableHouse`/`triangle`/barn byte-identical? (Prototyped in Design.)
