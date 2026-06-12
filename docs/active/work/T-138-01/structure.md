# T-138-01 proportion-milestone — Structure

File-level blueprint for design.md's decisions. Ordering matters: pure seams → runners → live
runs → report → docs.

## Modified files

### 1. `src/recognition/compile.mjs` (+ `compile.test.mjs`)
- **Add** `export function roofIdiomForPitch(idiomName, pitchClass)` — the steep↔base door
  selection compile already encodes at its course-row fallback, now nameable: for the gable
  family, returns `roof.gable.steep` iff `pitchClass > 1`, `roof.gable` iff `≤ 1`; any other
  idiom returns unchanged (steep hip/pyramid are not offered — the door will refuse downstream,
  an honest apply-failed, never an approximation). Pure, no registry import.
- Tests: the four quadrants (gable up/down-aim, steep down-aim back to base, non-gable identity).

### 2. `src/workshop/geometry.mjs` (+ `geometry.test.mjs`)
- In `applyGeometryAdjust`'s param application: when `"pitchClass" in params`, set
  `mass.roof.pitchClass` AND re-aim the mass's roof idiom via `roofIdiomForPitch` **before** the
  recompile. The recompile's existing gates stay the arbiter (a pack with no steep class still
  refuses at compile → rollback recorded; the cage decides, not the lever).
- Tests: aim pitch 2 on a gable mass under a steep-declaring pack-shaped fixture → recompiles
  through the steep door (idiom renamed, ridge rises); aim 0.5 → base door kept; aim 2 under a
  `[1]`-classes pack → apply-failed/rollback recorded (existing behavior, now asserted).

### 3. `src/recognition/measured-program.mjs` (+ `measured-program.test.mjs`)
- In `applyMeasuredProportions`' pitch branch: after `snapPitch`, re-aim the roof idiom via
  `roofIdiomForPitch(…, snap.pitchClass)`; when the idiom changes, the existing `note()` row for
  `pitchClass` gains the re-aim in its `note` text and a `conflicts` entry is NOT added (the
  idiom is realization vocabulary, not a recognition-vs-sketch conflict).
- Tests: measured ratio ≥1.5 under `[2,1,0.5]` classes → idiom `roof.gable.steep`, class 2,
  note carries the re-aim; ratio 1.0 → idiom unchanged (today's real subjects — byte-stability
  of the committed cottage/barn measured records must hold: re-run `measured:repro`).

### 4. `benchmarks/sculpture/workshop.mjs` (the chain's loop gains hands)
- **Conditional hands rule** (data-driven, no per-building constants): if BOTH
  `recognitionRels(subjectKey, def.pack).program` and `form-sketch/<subjectKey>.json` exist →
  load `source` (`parseProgramReply`, same gates as commit) + `sketch`; else eyes-only
  (fixture path byte-unchanged — T-136 S1 pins the sourceless prompt).
- `runLive`: pass `source` into `runWorkshopLoop({program, pack, source, …})` and into
  `parseWorkshopReply(text, {program, pack, source})`; inject the re-recognize applier
  (`appliers: {...DEFAULT_APPLIERS, "re-recognize": reRecognize}`) — the same composition
  `geometry-levers.mjs` proved (BAML `ReRecognizeMass`, `rerecognizeRenderArgs`,
  `parseMassReply` with `proportions: current.declarations?.proportions ?? null`, strong tier,
  judge-reply bounds); `meta` gains `sourceRef`/`sketchRef` when the hands engage.
- `runReplay`: load pack; `replayLedger({ledger, pack})` (geometry rounds recompile; old
  ledgers unaffected — pack is ignored when no geometry rounds exist).
- `runOffline`: `offlineAssert({ledger, finalArtifactText, pack, conform})` (the T-136
  signature levers already uses).
- New imports: `rerecognizeRenderArgs`/`parseMassReply`, `DEFAULT_APPLIERS`,
  `parseProgramReply`, `recognitionRels`. None are judge seams — `isolation.test.mjs` must stay
  green (it pins the ABSENCE of gate spawn/parse/record writes).

### 5. `benchmarks/sculpture/pattern-book.mjs` (stage 3 measured + armed; repro mirrors)
- `stageSeed(program, pack)` → `stageSeed({program, sketch, pack})`:
  1. `const measured = applyMeasuredProportions({program, sketch, pack})` (idiom re-aim now
     inside);
  2. `seedWorkshopProgram({program: measured.program, pack})` — the refuse-to-spend verdict
     computed UNARMED (regularity semantics unchanged; D2);
  3. merge `declarations.proportions = deriveProportionDeclarations({sketch})` into
     `seeded.workshopProgram`, re-assert (`assertWorkshopProgram`), re-serialize — the COMMITTED
     seed carries the armed declarations (replay derives them from the seed; nothing rides on
     runner state);
  4. return `{seeded, measured, proportions}`; the chain record's `stages.seed` gains
     `measured: {parameters: measured.notes, conflicts: measured.conflicts}` and
     `proportionsDeclared`, plus the seed's `silhouetteRatios` (reported, not gating).
- Stage 1 (`verifySketch`) additionally returns the parsed sketch content (it already reads the
  bytes for the sha).
- `derivePlan`: `replayLedger({ledger, pack})` (geometry rounds need the pack).
- `runRepro`: mirror stage 3 exactly (measured + armed + re-serialized) before the seed
  byte-compare; `replayLedger({ledger, pack})`; `offlineAssert({…, pack, conform})`.
- New imports: `applyMeasuredProportions`, `silhouetteRatios`, `deriveProportionDeclarations`.

### 6. `package.json`
- `measured:barn:saltcrag` (`--subject barn --pack packs/saltcrag.json --ticket T-138-01`),
  `milestone:proportion` / `milestone:proportion:baselines` / `milestone:proportion:repro`
  (new runner below). Gate + chain + measured scripts otherwise already exist.

## New files

### 7. `benchmarks/sculpture/proportion-milestone.mjs` (compare/report — OUTSIDE the workshop isolation scan, beside `pattern-book-compare.mjs`)
Reads gate records by path; convenes nothing, judges nothing, writes no verdict record. Pure
I/O over committed records; re-run → byte-identical. Pin-guarded writes (`--rotate-pins`).
- **`--baselines` mode** (run BEFORE any rotation; refuses if its output already exists without
  `--rotate-pins`): quotes the three pre-rotation gate aggregates
  (`multi-angle/{barn-patternbook, barn-patternbook-saltcrag, cottage-patternbook}.json` —
  decided/passed, gapCount, gap list w/ severities, the cottage coverage refusal) + the
  committed chain finals' `silhouetteRatios` + record shas →
  `benchmarks/sculpture/pattern-book/proportion-baselines.json`.
- **default mode** (after the re-runs + judge runs): per subject composes — before/after/target
  silhouette ratios (seed→final via `replayLedger({ledger, pack, throughRound})` prefix rows,
  the T-135/T-136 pattern); conformance trajectory; lever-use citation (geometry/recognize
  rounds: round, kind, accepted/rolled-back — "used or not" either way); verdict vs baseline
  (gap count + severity movement; cottage: refusal → first verdict); **both gap-budget
  arithmetics** with the ≤2-recalibration flagged to the reviewer (E-33 Rule 3); retired pins
  named (path + old sha from the baselines record); witness-repro degradation noted. Writes
  `benchmarks/sculpture/pattern-book/proportion-milestone.json` +
  `pr/assets/proportion-milestone.md` (concept beside the gate sheet per subject — the glance).
- **`--repro`**: re-derive default-mode outputs from committed inputs, byte-compare, exit-coded.
- Registry-driven subjects (durable-skin registry + the two packs); E-25 Rule 3 self-grep
  embedded like its siblings.

## Records written by the runs (not authored by hand)

- `measured/barn--saltcrag.{program,artifact,record,md}` — new (model-free live run).
- Rotated chain pins per subject: `workshop/<runKey>/program.json` (measured+armed seed),
  `workshop/<runKey>.{json,md}`, `workshop/<runKey>/{final-artifact,component-plan}.json`,
  `pattern-book/<runKey>.{json,md}` — via `patternbook` runs with `--rotate-pins`.
- Rotated gate pins per subject: `multi-angle/<key>-patternbook[-saltcrag].{json,md}` + sheets —
  via `gate:patternbook:*` with `--rotate-pins` (fresh renders, judge per view, T-114 replies,
  both coverage arithmetics per T-137).
- `pattern-book/head-to-head.{json,md}` + `pr/assets/pattern-book-milestone.md` re-composed
  (`pattern-book-compare.mjs --rotate-pins`) — its patternbook column updates to the new
  verdicts.

## Docs

- `docs/knowledge/design-learnings.md`: new section **"E-33 — the proportion loop"** (measured
  vs estimated quantity; the steep-pitch unlock and what actually used it; eyes-to-hands — did
  the model aim the levers; the fourth identity-class census fix; honest over/under-reach).
- `pr/assets/proportion-milestone.md` doubles as the E-12 handoff page (links the records,
  ledgers, baselines, retired pins).

## Boundaries & invariants held

- The frozen gate: NOT modified. Judge contract/thresholds/azimuths untouched; judge runs only
  via its CLI from outside the workshop files (isolation receipts cited in review).
- Pin policy: every overwrite behind `--rotate-pins` in an owning ticket (this one); preflight
  before spend everywhere (already structural, T-119).
- Witnesses (T-135 `proportion/`, T-137 `visibility/`): NOT touched, NOT re-run; their `--repro`
  degrades to named skip-on-pin-mismatch after rotation (T-137 gatehouse precedent) — asserted
  and recorded, not fixed.
- Sibling T-136 namespace (`levers/`, `docs/active/work/T-136-01/`): not written.
- E-25 Rule 3: no subject keys in any runner source (self-grep in chain + milestone records).

## Order of changes (each commit-atomic)

1. compile helper + tests → 2. geometry re-aim + tests → 3. measured re-aim + tests (then
`measured:repro` must still be byte-green) → 4. workshop.mjs hands (fixture replay/offline +
isolation green) → 5. pattern-book stage 3 + repro mirror (repro of OLD committed chains will
now diverge on the seed compare — expected and unavoidable mid-flight; the three live re-runs
restore green; sequence 5→8 within one working session) → 6. npm scripts + full suite →
7. baselines capture + saltcrag measured run (model-free) → 8. live runs serially
barn → barn--saltcrag → cottage (chain → repro/offline → gate → offline → commit, spend-probed
between) → 9. milestone compose + repro → 10. docs → 11. review.md.
