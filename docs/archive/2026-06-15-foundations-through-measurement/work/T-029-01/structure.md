# T-029-01 — Structure: sculptor consolidation

The file-level blueprint. Five touch points: one new harness module, two new tests, the barrel, the
README, and the journal. **No existing sculptor module's behavior changes** — consolidation is wiring +
guards + documentation.

## Files

### CREATE `src/sculptor/staged-loop.mjs` (~110 lines)

The consolidation harness — sequences the existing public passes into one loop. Adds **no new
capability**; pure sequencing + a baseline metric + the critic call.

Imports (all from siblings — the spine + passes, never a concept-grid module):
```
import { mass, proportionsOf } from "./massing.mjs";
import { material } from "./material.mjs";
import { relief, reliefMetrics, compileRelief } from "./relief.mjs";
import { reviewBuildState } from "./review.mjs";
```

Public interface:
- `stagedSculpt(source, intent = {}) → { massingState, state, proportions, metrics, baseline }`
  - `mass(source)` → massing-locked state `m` + proportions.
  - `material(m, intent)` → material-locked `skinned`.
  - `relief(skinned, intent)` → relief-locked `state`.
  - `baseline = reliefMetrics(m)` (massing-only, all-flat), `metrics = reliefMetrics(state)`.
  - Pure: no render, no model. Always runnable in `npm test`.
- `lessFlat(baseline, metrics) → { variance, coverage, range, isLessFlat }`
  - A tiny, pure comparator that names the deltas and the boolean verdict (`metrics.variance >
    baseline.variance && metrics.coverage > baseline.coverage`). Keeps the "less flat" claim in one place,
    citable by the test and the journal.
- `async runStagedLoop(source, { brief = "", intent = {}, render, diagnose } = {}) → { state, artifact,
  proportions, metrics, baseline, comparison, diagnosis, render }`
  - `const sculpt = stagedSculpt(source, intent)`.
  - `const artifact = compileRelief(sculpt.state)`.
  - `const review = await reviewBuildState(sculpt.state, { brief, render, diagnose })` (render/diagnose
    forwarded; undefined → the live `defaultRender`/`defaultDiagnose` leaves).
  - Returns the composed artifact, the metrics + `comparison = lessFlat(...)`, the routed `diagnosis`, and
    the render report. **The single wired demonstration of the loop.**

Module header documents: the lock chain (occupied→material→relief, the P14 cure), that the only form
dependency is `MassingSource`, and that render/diagnose are injectable (live by default, stubbed in tests).

### CREATE `src/sculptor/staged-loop.test.mjs` (~140 lines) — AC #1

Drives the harness. Tiers:

1. **Fixtures (no GL, no model).**
   - `tinyGrid()` → a hand-built `{ grid, n, m }` (e.g. 4×5 with a couple of `null` air cells and a top
     cornice row) fed through the **real** `conceptGridSource` — exercises the actual grid adapter without
     a JPEG decode or an image-grid import.
   - `gridlessSource()` → a literal `MassingSource` (`{ width, height, *occupied() }`) with **no grid
     array anywhere** — the "GLB-shaped" drop-in for the functional boundary proof (shared with the
     boundary test's intent).
   - A small `intent` with one explicit relief feature (a window recess) so relief is non-trivial.

2. **Pure assertions (always run):**
   - `stagedSculpt` over `tinyGrid()`: the final state has `occupied`, `material`, **and** `relief` locked
     (`state.locked` ⊇ {occupied, material, relief}); `lockLog` records massing→material→relief in order.
   - **Less-flat metric (cite):** `baseline.variance === 0 && baseline.coverage === 0`;
     `metrics.variance > 0 && metrics.coverage > 0`; `lessFlat(...).isLessFlat === true`.
   - **AJV gate:** `parseArtifact(compileRelief(state)).ok === true` (the composed build is a valid
     `DesignArtifact`); manifest is multi-block (material set), ≥1 placement at `z === -1` (the recess,
     carved by exclusion).
   - **Loop with stubbed render + diagnose:** `runStagedLoop(tinyGrid, { render: stubRender, diagnose:
     stubFlat })` → since the facade is textured+relieved, a `flat` defect routes to **relief**; a clean
     stub (`[]`) yields an empty diagnosis. Both recorded via assertions.
   - **Gridless source flows unchanged:** `stagedSculpt(gridlessSource())` produces the same locked-chain
     result — the middle/review never needed the grid (functional half of AC #2, exercised here too).

3. **GL-gated render tier (AC #1 "renders"):** import the gate; if `!GL_AVAILABLE`, `t.skip(reason)`.
   Else `renderArtifact(compileRelief(state), { outPath, view: {width:128,height:128} })` → assert the PNG
   signature `89 50 4E 47 0D 0A 1A 0A`, `bytes > 2000`, `placed >= occupiedCount`. Proves the composed
   loop renders for real.

### CREATE `src/sculptor/reuse-boundary.test.mjs` (~90 lines) — AC #2

Static + functional boundary guard, modeled on `src/color/reuse-boundary.test.mjs`.

- `importSpecifiers(src)` — the same regex extractor (from / bare / dynamic imports).
- `CONCEPT_GRID_DENYLIST = [/image-grid/, /palette-extract/, /nano-banana/, /\bexpand\.mjs/,
  /image-to-grid/]` — concept-grid / image-pipeline modules the middle/review must never import.
- **Static scan:** for each of `material.mjs`, `relief.mjs`, `review.mjs`, `compile.mjs`,
  `orchestrator.mjs`, `build-state.mjs` → assert no specifier matches the denylist. (relief/compile/spine
  also assert no `../color/` import — geometry/spine are color-free; material legitimately imports the
  portable engine, asserted as the *only* allowed cross-dir import there.)
- **`conceptGridSource` is the sole grid reader:** scan `massing.mjs` — the only module that mentions
  `grid` / `n` / `m` destructuring of a grid; assert `material`/`relief`/`review` source contains no
  `.grid`/`gridResult` reference (grep-style string assertion).
- **Functional drop-in proof:** build a literal `MassingSource` (no grid), run it through `mass → material
  → relief`, compile, and `parseArtifact(...).ok` — the whole loop runs with zero concept-grid code in the
  test's own graph (no `image-grid` import here), proving `MassingSource` is the only seam.

### MODIFY `src/sculptor/index.mjs` (+1 export block)

Append:
```
export { stagedSculpt, runStagedLoop, lessFlat } from "./staged-loop.mjs";
```
Single import site preserved — the consolidated loop is reachable from the barrel like every pass.

### MODIFY `src/sculptor/README.md` (+~8 lines)

- Add a **"The full loop (T-029)"** bullet under "The pieces": `staged-loop.mjs` sequences
  massing→material→relief→critic; `stagedSculpt` (pure) + `runStagedLoop` (live); cite `reliefMetrics` as
  the less-flat signal.
- Add one line under "Boundaries": the form dependency is `MassingSource` only, enforced by
  `reuse-boundary.test.mjs`; a GLB source is a drop-in.

### MODIFY `docs/knowledge/design-learnings.md` (+~35 lines) — AC #3

Append `## E-11 — staged-sculptor consolidation (S-029, T-029-01)` after the E-10 section (current EOF,
line 1308). Subsections: the spine + lock chain (P14 cure), the two seed passes, the **less-flat result
with actual numbers**, the recorded critic diagnosis, the input-agnostic / GLB-reuse statement (boundary
test), and the final `npm test` count. Mirrors the E-10 consolidation section's altitude and tone.

## Ordering of changes

1. `staged-loop.mjs` (the harness) — nothing depends on it yet.
2. `index.mjs` export — makes it reachable.
3. `staged-loop.test.mjs` — proves AC #1 (drives the harness; capture the real metric numbers + diagnosis
   for the journal).
4. `reuse-boundary.test.mjs` — proves AC #2.
5. `README.md` — doc the loop.
6. Run `npm test`; capture the green count and the metric/diagnosis numbers.
7. `design-learnings.md` — write the journal with the captured numbers (AC #3).

## Interfaces unchanged (the consolidation invariant)

`build-state`, `orchestrator`, `compile`, `massing`, `material`, `relief`, `review` — **public signatures
untouched**. If wiring forces a change to any of them, that is a missing dependency edge surfaced by
consolidation, recorded as a deviation in progress.md, not a silent edit. Expected: zero such changes.
