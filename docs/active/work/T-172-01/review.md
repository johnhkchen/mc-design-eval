# T-172-01 — Review

**Outcome: the falsifiable claim held.** The roof is now a **covering over the envelope**, not a
solid material prism, and multi-mass subjects get **one gable per `masses[]`**. Roof-field material
fell from a build-dominating ~61–78 % to 16–38 %; the cottage renders its two perpendicular gables;
no wall-track closure regression. `npm test` green (2249/0); the frozen instrument is untouched.

## What changed

### Production source
- **`src/view/roof-generate.mjs`** — added `opts.covering` (default-off): a per-column `coverFloor`
  riser-seal rule hollows the wedge interior while keeping the slope watertight at any pitch
  (`coverFloor = clamp(minNbrTop+1, floor, top)`). Gable-end walls (`gableWallKeys`) and sheet verges
  keep their floors. Added the pure census helper `roofMaterialFraction(placements, roofBlocks)`.
  Absent `covering` ⇒ **byte-identical** legacy prism (the `gableBlock` precedent).
- **`src/form/provision-generate.mjs`** — one line: the generate-first roof call now passes
  `covering: true` (it already passed `gableBlock` and is already multi-ridge per `componentGableGroups`).

### Tests
- **`src/view/roof-generate.test.mjs`** — 7 new cases (29 → 36): hollows interior; pitch-2 watertight
  (no daylight column, impl-independent); surface + caps byte-identical on/off; gable-end walls +
  footprint `closureOf` preserved; slope-interior census = 0 (pitch 1); absent⇒legacy regression pin;
  multi-gable composition under covering.

### Experiment runner (no unit tests, per harness posture — verified by running)
- **`experiments/eval-alignment/roof-climb.mjs`** — now builds **one `gableRecord` per recognized
  mass** (`recognition/{subject}.program.json` → `registerRect`, axis-swap aware), covering mode,
  gable-end wall = modal eave block. Single-bbox covering **fallback** on no-program/ambiguous
  registration (logged). Prints the before/after census + `closureOf`; writes
  `builds/{subject}/roof-covering/` (the committed `new-roof` build is preserved). Metered `score()`
  gated behind `--score` (default off — the crater is T-173-01). Result schema bumped to v2.

### Evidence (committed)
- `builds/{cottage,barn,gatehouse}/roof-covering/` (4 azimuth views + `beside-concept.png` +
  `artifact.json`); `experiments/eval-alignment/results/roof-climb-{subject}.json` (v2, census +
  closure); `docs/active/work/T-172-01/beside-{subject}.png`; full RDSPI artifacts.

## Acceptance criteria

- **AC #1 — covering, not a solid prism; census well under ~72 %.** ✓ Roof field: cottage 77.7 %→
  **38.1 %**, barn 74.3 %→**26.2 %**, gatehouse 60.9 %→**15.7 %**. The wedge interior is hollow
  (unit-proven: pitch-1 slope-interior fill = 0). Provable offline — no GL/model needed.
- **AC #2 — multi-ridge; cottage two perpendicular gables; barn prism gone; renders beside concept.**
  ✓ cottage: two gables (main ridge=z, wing ridge=x) with a valley (`beside-cottage.png`); barn: one
  clean gable (`beside-barn.png`). gatehouse: registration ambiguous (near-square) → single-bbox
  covering fallback, **logged** (the claim's "doesn't register" branch, handled not forced).
- **AC #3 — no closure regression; report reopened seams honestly.** ✓ The roof never touches wall
  cells (carve keeps `y ≤ eave` verbatim; covering authors only `y > eave`), so wall-band `closureOf`
  is a property of the input shell, not this change; the footprint-perimeter invariant is unit-pinned.
  The barn's 0.70 closure is the **pre-existing** S-160 `barn--saltcrag` envelope gap (a WALL seam),
  reported, not introduced.
- **AC #4 — `npm test` green; frozen instrument untouched.** ✓ 2249/0; zero files under
  `measurements/` changed.

## Test coverage & gaps

- **Strong (durable, offline):** the engine is fully unit-covered — hollow/watertight/byte-identity/
  closure-invariance/census, all GL-free under the `src/**/*.test.mjs` glob. The default-off posture
  is regression-pinned, and the full suite confirms six other `generateRoof` callers stay byte-stable.
- **Gap (flagged):** `roof-climb.mjs` carries no unit tests (matches the metered-harness posture of
  the eval-alignment runners). Its correctness was verified by *running* (census numbers + inspected
  renders). A future `building-program` schema or `registerRect` change could silently drift it.
- **Not exercised here:** the live baseline-vs-new **score** (gated behind `--score`, intentionally
  unspent) — that is T-173-01's crater.

## Open concerns / handoffs

- **The `compile.mjs::roofBlocks` prism is a separate, still-open seam.** The faithful *recognition*
  gatehouse (T-171) is a `dark_oak_planks` prism via `roofBlocks` (solid cubes when the chosen roof
  field is outside the pack's stair-course family) — a **family-resolution** problem, a different code
  path from the `generateRoof` prism this ticket killed. Wiring covering into the compile/realize path
  also trips the not-yet-`gableWallKeys`-aware conformance gate (T-150-01 review) and needs a judge-pin
  rotation — out of scope, **reported** (not silently merged). **T-173-01 must decide** whether to
  repoint the referee at the `roof-covering` build (fixed `generateRoof`) or the `roofBlocks`
  recognition build; the cleanest crater wants the former plus a faithful (non-prism) roof field.
- **Gatehouse multi-ridge unavailable.** `registerRect` is ambiguous on a near-square single mass; the
  fallback is correct but means the gatehouse isn't a multi-ridge demonstration (it's single-mass
  anyway). If a future subject has perpendicular masses that register cleanly, the path is proven on
  the cottage.
- **Hollow underside is visible at low/oblique angles** (the declared `sheet`/overhang exclusion). It
  reads as a roof at the gate azimuths; if a future judge penalizes the open eave underside, a thin
  soffit course would close it (not pursued — the covering is the point).
- **Pitch fixed at 1** in the runner (FORM-isolation, matching the original climb). Steeper concepts
  (the barn is "steep gabled") could read more faithfully with the program's `pitchClass`; the engine
  handles any pitch watertightly, so this is a one-field runner change if a later ticket wants it.

## One-line summary for the next session

The `generateRoof` prism is dead: roofs are coverings (cottage 78→38 %, barn 74→26 %), cottage builds
its two perpendicular gables, closure unregressed, tests green. Remaining roof prism lives in
`compile.mjs::roofBlocks` (family-resolution, reported) → T-173-01 picks the build to crater.
