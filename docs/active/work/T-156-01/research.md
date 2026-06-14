# T-156-01 — Research (archive-retired)

Descriptive map of `benchmarks/sculpture/` (E-37 / S-156). Goal: separate the **canonical spine**
(STRUCTURE.md) from the **retired sediment** (closed epics E-09→E-24 + the standalone chains the
unified `build:<subject>` supersedes), and chart every committed reference so a move can be
*reference-checked* (E-37 Rule 2: a move is refused if a committed reference can't be updated).

## 1. The directory today

`benchmarks/sculpture/` holds **175 entries**: ~56 tracked sub-dirs (record/output trees) and ~90
top-level `.mjs` runners/utilities, plus `.json`/`.md` record pairs and `README.md`. This is the
"strewn about" feeling — a thin-context agent can't tell `glb-voxel-surgical-sweep.mjs` (retired E-15
ablation) from `build.mjs` (the live entry point).

## 2. The canonical spine (KEEP) — from STRUCTURE.md + the live import/spawn closure

`STRUCTURE.md` (T-154-01) is authoritative. The one entry point is `build.mjs`; it **imports**
`durable-skin.mjs` (SUBJECTS registry) + `src/*`, and **spawns** `generated-milestone.mjs --skip-gate`
(Stage 4 seed) and `workshop.mjs --seed-artifact` (Stage 5). A deterministic intra-sculpture
import+spawn closure from the live npm-script entry points (`/tmp/graph.mjs`) yields **35 reachable
runners**. The KEEP set (runners whose npm scripts are live measurement/creation instruments):

- **Spine:** `build.mjs`, `generated-milestone.mjs` (Stage-4 realizer — load-bearing, NOT archived),
  `workshop.mjs`, `durable-skin.mjs`, `form-sketch.mjs`, `recognize.mjs`, `render-beside.mjs`.
- **Skin/recognition feed (folds into Stage 4, KEPT per AC):** `component-skin.mjs`,
  `component-decomposition.mjs`, `shaped-vocabulary.mjs`, `roof-program.mjs`, `kit-extract.mjs`,
  `kit-presence.mjs`, `dress-openings.mjs`, `placement-grammar.mjs`, `zone-map.mjs`.
- **Frozen measurement instruments (live npm scripts):** `multi-angle-gate.mjs`, `roof-diff.mjs`,
  `measured-proportions.mjs`, `proportion-milestone.mjs`, `facade-milestone.mjs` (+`.test.mjs`),
  `proportion-witness.mjs`, `ruler-calibration.mjs`, `visibility-witness.mjs`, `steep-pitch.mjs`,
  `facade-grammar.mjs`, `relief-calibration.mjs`, `budget-calibration.mjs`, `registration-smoke.mjs`,
  `shell-integrity.mjs`, `glb-smoke.mjs`.
- **Catalog/fixture utilities (live npm scripts):** `idiom-card.mjs`, `brush-catalog.mjs`,
  `fixture-card.mjs`, `geometry-levers.mjs`, `run.mjs` (+`value-match-shared.mjs` it imports).
- **KEEP data dirs (records consumed by the kept spine/skin or kept tests):** `form-sketch/`,
  `recognition/`, `generated/`, `workshop/`, `durable-skin/`, `component-skin/`, `components/`,
  `roof/`, `shaped/`, `regularize/`, `reconstructed/`, `styled/`, `challenge/`, `zone-map/`, `kit/`,
  `kit-presence/`, `dress-openings/`, `multi-angle/`, `relief/`, `visibility/`, `roof-diff/`, `glb/`,
  `runs/`, `placement-grammar/`, `brush-catalog/`, `idiom-card/`, `fixture-card/`, `factory/`,
  `proportion/`, `measured/`, `steep-pitch/`(if present), `spray-paint/` (see §5 caveat).

## 3. The retired set (ARCHIVE) — closed epics + superseded chains

**Superseded standalone chains** (their stages now live inside the unified chain or are obsolete):
`styled-milestone.mjs`, `challenge-milestone.mjs`, `reconstructed-milestone.mjs` (terminal chains;
`styledStretch` is reused *inside* Stage 4, not the runner), `regularize-shell.mjs` (E-27/28
reconstruction — "the blob never becomes the build", superseded by generate-first), `pattern-book.mjs`
+ `pattern-book-compare.mjs` (the program-seed chain replaced by the generate-first realizer).
*`generated-milestone.mjs` is NOT archived — `build.mjs` spawns it; only its standalone-gated npm role.*

**Retired-epic sediment** (runners + their record dirs, tied to closed epics):
- E-13→E-16 GLB-voxel / surgical: `glb-voxel-run/breadth/clean/seg/surgical/surgical-sweep/thin.mjs`
  + dirs `glb-voxel{,-clean,-seg,-surgical,-surgical-sweep,-thin}/`, `surgical-standard.mjs`.
- E-15 form-revise / GLB-formtarget A/B: `form-revise-ab.mjs`, `glb-formtarget-ab.mjs`,
  `glb-grounded-ab.mjs` (+ `*-ab.{json,md}` + dirs `form-revise-ab/`, `glb-formtarget-ab/`).
- E-18/19: `e18-remeasure.mjs`, `e18-scorecard.mjs`, `e19-build.mjs` (+ `e18-build/`, `e19-build/`,
  `e18-remeasure.{json,md}`, `e19-cleanup.{json,md}`).
- E-19→21 material/palette: `material-correct.mjs`, `material-assign.mjs`, `material-map.mjs`,
  `secondary-palette.mjs`, `palette-discipline.mjs`, `value-select.mjs`, `value-match-ab.mjs`,
  `concept-materials-ab.mjs`, `concept-ab.mjs`, `codesign-ab.mjs` (+ dirs `material-correct/`,
  `material-assign/`, `material-map/`, `secondary-palette/`, `palette-discipline/`, `value-select/`,
  `concept-materials/`, `resemblance/`).
- Ablation/scorecards: `sweep-ablation.mjs`, `sweep-scorecard.mjs` (+ `sweep-ablation/`).
- E-? building-mode + assorted spikes: `building-build.mjs`, `building-concept.mjs` (+ `building/`),
  `cleanliness-baseline.mjs`, `form-baseline.mjs`, `provision-concept.mjs`, `detector-routing.mjs`,
  `form-routing.mjs`, `voxelize-sanity.mjs`, `view-layer-proof.mjs`, `facade-relief-proof.mjs`,
  `resemblance.mjs`, `resemblance-consolidation.mjs`, `surface-coherence.mjs`, `surface-pattern.mjs`,
  `hollow-cottage.mjs`, `hollow-cottage-milestone.mjs`, `floorplan-cottage.mjs`, `levers/`.

*(Final ARCHIVE manifest is fixed in structure.md; Design decides the keep/archive boundary cases.)*

## 4. How committed references are wired (the reference web)

A repo-wide `git grep` per entry (`/tmp/refs2.mjs`) classifies referrers as **test / code / pkg /
json-record / doc**. The blocking classes for `npm test` are **test**, live **code**, and **pkg**:

- **Source-scan conformance tests** hold hard-coded `benchmarks/sculpture/<runner>.mjs` path *lists*
  and `readFileSync` each source to enforce a live-spine invariant. These name retired runners:
  - `src/form/pin-guard.conformance.test.mjs` — PIN_WRITERS list: `styled-milestone`,
    `challenge-milestone`, `reconstructed-milestone` (+ kept ones).
  - `src/pack/brush-door.conformance.test.mjs` — allowlist map: `styled-milestone`,
    `reconstructed-milestone`, `challenge-milestone` (+ kept).
  - `src/form/material-vocabulary.conformance.test.mjs` — scan list: `styled-milestone`.
  → **These are path strings, not imports.** A move requires updating the path to `_archive/…`
  (the scan still finds the source, archived code still conforms → green). This is the
  reference-update the AC demands.
- **Record-reading tests** read the committed *record JSON*, never the runner `.mjs`:
  `src/form/component-skin-distill.test.mjs` reads `pin.chain.record` (e.g. `reconstructed/cottage.json`,
  `styled/hut.json`) and string-compares `pin.chain.runner === "styled-milestone.mjs"`. → archiving the
  **runner file** does NOT break it; archiving the **record dirs** it reads (`reconstructed/`, `styled/`,
  `challenge/`, `components/`, `roof/`, `shaped/`, `regularize/`, `zone-map/`) WOULD. **Hence those
  record dirs stay** (they feed the kept Stage-4 skin — the AC's "kit recognition folds into the
  Stage-4 skin, kept"). The retired *runner* moves; its *records that feed the skin* stay.
- **`package.json` scripts** (pkg) — many retired runners have npm scripts (`styled:*`, `challenge:*`,
  `patternbook:*`, `reconstructed:*`, `regularize:*`, `value:select`, `material:correct`, `e19:build`,
  `building:build`, `surgical:standard`, `resemblance*`, `hollow:*`, `floorplan:*`, `coherence:*`,
  `pattern:cottage`, `patternbook:compare`, `spray:paint`, `view:proof`, `detect:routing`,
  `form:routing`, `concept:ab`, `material:assign`, `material:map`). A move removes/repoints these.
- **Retired connected-components.** Most retired runners reference retired output dirs via retired
  `src/*` modules (`src/form/material-map.mjs`, `src/color/value-select.mjs`, `src/view/surface-pattern.mjs`,
  `src/form/resemblance.mjs`, `src/form/e19-cleanup.mjs`, `src/form/scorecard.mjs`,
  `src/form/concept-materials-ab.mjs`). These `src/*` path strings are **default OUT paths**, executed
  only when the (retired) runner runs — **no test executes them**, so they don't fail `npm test`; but
  they ARE committed references and per E-37 Rule 2 must be updated when the dir moves (or the move
  recorded). They are NOT in the live spine.

## 5. Constraints, assumptions, caveats

- **`npm test` = 2138 tests** (T-154-01 baseline). The hard gate is *still green after the moves*.
- **The test suite is the oracle.** The reference web is dense; the safe procedure is to move retired
  components in batches and run `npm test` after each, updating path strings in kept files (conformance
  lists, npm scripts) exactly where a failure or a `git grep` surfaces them.
- **Records that feed the kept skin stay even when their producing runner is retired.** `reconstructed/`,
  `styled/`, `challenge/` are inputs to the kept `component-skin` distill — do not move them.
- **`generated-milestone.mjs` stays** — `build.mjs` spawns it (load-bearing); only its standalone npm
  scripts (`generated:*`) are superseded.
- **Boundary cases for Design:** `spray-paint.mjs`/`spray-paint/` (E-23 canvas — brush-door pins it),
  `shell-integrity.mjs`, `glb-smoke.mjs`, `registration-smoke.mjs`, `placement-grammar.mjs`/`-grammar/`,
  `zone-map.mjs`/`zone-map/`, `value-match-shared.mjs`, `building/` — referenced by kept tests/runners;
  Design must rule KEEP-or-update for each before they enter the ARCHIVE manifest.
- **`_archive/` does not exist yet.** It will be created at `benchmarks/sculpture/_archive/`, mirroring
  the original relative layout (runner + its record dir under the same name) so history/`--repro` of an
  archived chain remains reconstructable.
- **Out of scope:** S-157 adds the *permanent* topology guardrail (a test that fails when a live module
  imports `_archive/`); this ticket performs the one-time move + reference fix only.
