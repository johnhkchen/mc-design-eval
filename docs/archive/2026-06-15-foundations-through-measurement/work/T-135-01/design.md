# T-135-01 proportion-conformance — Design

## The shape of the problem

Three deliverables: (1) pure proportion metrics on silhouettes, (2) a per-round gate beside
regularity with declared tolerances, rollback, and ledgered ratios, (3) a witness run on the
committed T-127 cottage chain. The binding constraints from research: the gate must be
deterministic and GL-free (loop charter, replay byte-identity, renders uncommitted), committed
records must stay valid under `offlineAssert`'s JSON-equality re-derivation, and the isolation
scan must keep passing.

## Decision 1 — build-side silhouette: orthographic occupancy projection (not GL)

**Chosen:** project the realized artifact's occupancy into binary elevation masks (along ±x and
±z → y×u grids) and a plan mask (along y → x×z), and compute ratios on those masks.

- The orthographic projection IS the silhouette the render depicts, derived from the same voxels,
  byte-stable, and computable during `--replay`/`--offline` with no GL. E-33 Rule 2's "computed
  from renders" is honored in substance (silhouette of the build as seen) without violating the
  loop's "GL bytes never decide" charter — the same resolution E-24/E-28 chose.
- Pure mask functions satisfy the AC's "unit-tested on synthetic silhouettes" directly; the SAME
  metric functions run on the concept's image mask (via `extractSilhouette`, reused E-22
  machinery) — one definition, two substrates.

**Rejected:** per-round GL renders as gate input (non-reproducible, renders gitignored, charter
violation); `silhouetteRatios(workshopProgram)` from T-133 as the gate metric (reads spec fields,
blind to realized geometry/paint; its own header defers the gate metric to S-135); silhouette IoU
as the gate number (IoU conflates proportion with everything else; "silhouette can only refute").

## Decision 2 — metric definitions (documented, tolerance-checked)

On a binary mask with foreground bbox (heights in rows from bbox bottom = ground):

- **eaveY**: the top of the highest row whose width is within `eaveWidthFrac` (default 1.0 — exact
  widest, the generated-build contract "the eave stays the widest layer") of the mask's max row
  width. Detected per elevation; the build-side eave is the max across the two elevations (the
  true eave is widest in at least one).
- **ridgeY**: the top of the highest row whose width ≥ `ridgeMinWidthFrac` (default 0.25) of the
  max row width — a width-thresholded top, so a thin chimney/finial (width ≈2 of ≈28) never reads
  as the ridge (the T-118 protrusion-polluted-apex lesson).
- **ridgeToEave** = totalH/eaveH, **roofShare** = (totalH−eaveH)/totalH (same definitions as
  T-133's program-side ratios, so the rows line up), **aspect** = max(w,d)/min(w,d) from the plan
  mask bbox (build) / sketch planDims (target).
- **Per-mass**: when `declarations.proportions.masses[]` names masses with bboxes (sourced from
  `sketch.proportions.masses`), the projection restricts to the mass's columns and the same
  metrics apply per mass. Whole-object always computed; per-mass only where named (cottage names
  one primary — whole-object equivalent; the seam exists for multi-mass subjects).
- Degenerate masks (empty, eave=ridge ambiguous, no row over threshold) return `null` constituents
  — the caller's fallback trigger, recorded, never silent (the measured-program idiom).
- Comparison: per-ratio **relative** delta `|measured−target|/target`, within tolerance iff
  ≤ `tolerance` (one declared number, default 0.15 — relative so it scales across the three
  ratio magnitudes).

## Decision 3 — targets: concept-first, sketch fallback, sources recorded

Targets are derived ONCE, impurely (decode `concept.png`), and **recorded** in
`declarations.proportions`; the pure gate consumes only declarations.

- `ridgeToEave`/`roofShare`: measured from the concept's silhouette (`extractSilhouette` +
  `CONCEPT_BG` + the same eave/ridge detection). The concept is a ~3/4 view, so vertical
  fractions are approximate — acceptable: the concept is the contract (E-33 honesty note). If
  detection degenerates (null), fall back to `sketchTargetRatios(sketch)`, `source` recorded
  per ratio (`concept` | `sketch`).
- `aspect`: never measurable from one perspective view → always sketch-sourced, recorded as such
  (the AC's "conditioned sketch is the recorded fallback when the concept view obscures a ratio").
- Shape: `declarations.proportions = { targets: {ridgeToEave, roofShare, aspect}, sources: {...},
  tolerance: number, masses?: [...] }`. `parseWorkshopProgram` already admits extra declaration
  keys; a validator function pins the shape when present.

**Rejected:** pack-level tolerances (`packs/rustic.json` byte-sha is pinned in committed ledgers'
`packRef` and the style-pack schema would need to grow — needless blast radius; tolerances are
DECLARED per program with a single exported default, documented in the pack-conformance docs).

## Decision 4 — gate wiring: declaration-driven check inside runConformance + ratio-aware rollback

**Chosen (hybrid):**

1. `proportionCheck(occ, declarations)` joins `conformance.mjs` as check name
   `"proportion-vs-concept"` in `CONFORMANCE_CHECK_NAMES`. `runConformance` appends it **iff
   `declarations.proportions` is declared** — never from the pack's check list. This is the
   module's own charter ("declared, never inferred"; the symmetry-vacuous precedent): committed
   chains' seeds declare no proportions, so their re-derived reports are byte-identical and
   `workshop:offline`/`patternbook:offline` stay green; rustic.json is untouched. The verdict
   carries the data alongside findings — `{name, passed, findings, ratios:{...measured, target,
   delta, withinTolerance, source...}}` — the `watertight`/`single-component` extra-field
   precedent. Findings strings carry the numbers ("roofShare 0.62 vs target 0.29 — Δ 110% >
   tolerance 15%"), so the **critique prompt's `conformance_block` picks the numbers up with zero
   BAML/template change** (it iterates checks) and golden fixtures stand.
2. Rollback: the existing lexicographic `isRegression` already rolls back a within→beyond
   tolerance transition (passed count drops). But the AC's "a revision that *worsens* a ratio
   beyond tolerance rolls back" must also catch already-beyond ratios getting worse (the E-15
   no-regress cage), which a findings-count tie hides. So `loop.mjs` extends its predicate:
   regression iff lexicographic-worse **or** any ratio that ends beyond tolerance has a strictly
   larger |delta| than before (per ratio, whole-object and per-mass alike). The comparison reads
   the `ratios` payload off the two reports' proportion check; reports without one (every
   committed ledger) are unaffected, so `offlineAssert`'s cage-arithmetic re-assert of old
   records is byte-for-byte the same.
3. Ledger: nothing new to plumb — round entries already carry `conformance.before/after`
   verbatim, which now embed the ratios. `final.conformance` likewise.

**Rejected:** adding the name to packs' `checks` lists (breaks offline JSON-equality on 3
committed rustic records); a parallel `round.proportion` gate beside conformance in loop.mjs
(duplicates verdict/score/ledger/prompt plumbing that the checks array gives free, and splits
"the gate" into two reports the digest and offline assert don't know).

## Decision 5 — module placement

- **`src/form/silhouette-proportion.mjs`** (beside form-fidelity, the E-22 shelf): occupancy→mask
  projections (`elevationMask`, `planMask` — needs only `occ.cells` iteration), eave/ridge
  detection, `proportionsOfMask`, `proportionRatios(occ, masses?)`, `compareRatios(measured,
  targets, tolerance)`, `targetsFromConceptMask(mask)` + `targetsFromSketch(sketch)` (imports
  `sketchTargetRatios`), defaults + schema tag. Pure, no I/O — runs under `src/**/*.test.mjs`.
- `conformance.mjs` imports it for `proportionCheck` (src/pack already imports from src/view;
  src/form is equally legal — no isolation pin touches either).
- `replay.mjs`: `replayLedger` gains optional `{throughRound}` (prefix replay) so the witness can
  realize per-round artifacts through the single replay implementation rather than a re-derived
  loop.

## Decision 6 — the witness runner

`benchmarks/sculpture/proportion-witness.mjs` + npm scripts `proportion:cottage`,
`proportion:barn`, `proportion:repro`. For a committed chain (default subject `cottage`, the
named fixture; `barn` runs the same path as generalization evidence):

1. Load committed ledger + concept.png + form-sketch; derive targets (Decision 3) and declared
   tolerance.
2. Prefix-replay rounds 0..N (`replayLedger({ledger, throughRound})`), compute per-round ratios,
   evaluate the check verdict each round would have received.
3. Write `benchmarks/sculpture/proportion/<runKey>.{json,md}` via `guardedWriteRecord` (domain
   "workshop" — a new namespace, no collision; gate-record namespace refusal still applies
   structurally). The md digest sets the witness beside the judge-side description: per-round
   ratio table, the violated ratio named (`roofShare`), target source per ratio, and the round-4
   critique quote it numerically grounds.
4. `--repro`: re-derive from committed inputs and byte-compare (no model, no GL — concept decode
   is deterministic). This satisfies "replay byte-identical" for the new record class.

No judge runs anywhere; the runner never names a judge seam (and is outside ISO1's file list
regardless). The targets derivation helper is exported so S-138 can wire declarations into live
seeds later — this ticket does NOT modify committed seeds or the pattern-book chain (pin policy:
rotation belongs to an owning ticket).

## Docs (AC 4)

`packs/README.md` gains a "Proportion conformance" paragraph (metric definitions, declaration
shape, tolerance default and its meaning, concept-first/sketch-fallback rule); `conformance.mjs`
header documents the declaration-driven activation beside the pack-listed checks.

## Risks / honesty ledger

- Concept-side eave detection on a perspective image is the weakest link; the deterministic
  null→sketch fallback with recorded source keeps it honest. The witness records which source won.
- A declaration-driven check bends "exactly the checks the pack lists"; documented in the module
  header as the deliberate exception (declared targets are subject data, not style policy).
- Relative tolerance vs a near-zero target (flat roof, roofShare→0) divides by small numbers —
  guard: when |target| < 0.05 compare absolute delta instead, documented.
- `eaveWidthFrac`/`ridgeMinWidthFrac` are op parameters (never subject-tuned), frozen in
  `PROPORTION_DEFAULTS` like `CONFORMANCE_DEFAULTS`.
