# T-154-01 — Research (unify-chain)

Epic **E-37** / Story **S-154**. Map the current "build a subject" chains so the unification
(generate-first becomes the Stage-4 seed the workshop iterates) lands on understood ground.
Descriptive only — no solutions here.

## The ticket in one line

Four chains exist; the workshop is bolted onto pattern-book's *rougher* Stage-4 seed. T-150-01 proved
the cost — the gable/overhang fix went into **generate-first** while the *measured* barn is the
**workshop** one. Unify: generate-first's parametric realizer becomes the Stage-4 seed the workshop
iterates; one `build:<subject>` entry point; first `STRUCTURE.md`; gate stays a separate billed step.

## The chains today (all in `benchmarks/sculpture/`)

| chain | runner | Stage-4 realizer | output | terminal |
| --- | --- | --- | --- | --- |
| **pattern-book** | `pattern-book.mjs` | `stageSeed` → `seedWorkshopProgram` (compile+realizeWithArticulation) | **workshop-program** → `workshop/<key>/program.json` | spawns `workshop.mjs` |
| **generate-first** | `generated-milestone.mjs` | `provisionStage` → `generateProvision` | **artifact** (cell placements) | gate spawn |
| **styled** | `styled-milestone.mjs` | (consumes a base) `styledStretch` | grammar/dressing/settle | gate spawn |
| **challenge** | `challenge-milestone.mjs` | GLB provision (no recognition) | base artifact | gate spawn |
| **reconstructed** | `reconstructed-milestone.mjs` | provision→regularize→reconstruct | repaired base | gate spawn |

`styledStretch` (grammar→dressing→settle fixpoint) is the **shared finisher**, reused by generate-first
(`generated-milestone.mjs:301`) and others — never re-implemented.

## The Stage-5 loop: it iterates a PROGRAM, not an artifact

`src/workshop/loop.mjs:runWorkshopLoop({ program, pack, source, seams, … })`:

- The seed is a **`workshop-program/v1`** (`src/workshop/program.mjs`): an ordered element list
  (`shell` | registry `idiom`) + `declarations` + `budget` + `subject`/`pack`.
- Each round it **re-realizes** `current` (the live program) via
  `realize = (prog, paint) ⇒ applyPaint(realizeWithArticulation(prog, compileProgram(source,pack).articulation).artifact, paint)` (loop.mjs:127-135).
- The model gets ONE sanctioned action per round; appliers (`src/workshop/actions.mjs`,
  `DEFAULT_APPLIERS`): **program** (param adjust), **geometry** (levers on `source`), **recognize**
  (re-recognize a mass, needs `source`), **paint** (surface spray). A revision that regresses the
  pack conformance score (lexicographic: checks passed, then −findings; plus proportion ratio
  no-regress) is **rolled back** (loop.mjs:203). Budget-bounded; structural termination.
- `program`/`geometry`/`recognize` **need a revisable program/source**; `paint` operates on the
  realized artifact. The facade **articulation** (E-35) is constructed each round from `source` and
  folded onto the realization (`realizeWithArticulation` → `mergePlacements`, `src/workshop/articulate.mjs`).

**The crux:** the loop is program-centric. It realizes `current` (a program) every round; the
artifact it renders IS that realization. So "the workshop iterates the generate-first build" collides
with the representation — generate-first emits a raw **artifact**, never a program.

## The seam where the seed enters

`workshop.mjs` (the impure runner):
- `SUBJECTS` rows derive from `workshopSubjectsFrom(REGISTRY, …)` (`src/workshop/seed.mjs:178`) →
  `{ program: "<relDir>/<key><ns>/program.json", concept, pack }`. Paths only (E-25 Rule 3).
- `runLive()` (workshop.mjs:170-300): reads `def.program` →
  `program = assertWorkshopProgram(programText)` (line 173-174) — **this is the seed read**.
  Optionally loads `source` (the recognized program, `recognitionRels(key,pack).program`) + sketch as
  "the hands" (geometry/re-recognize evidence) when both committed exist (line 183-196).
- Then `runWorkshopLoop({ program, pack, source, seams:{exchange,render}, … })`, commits
  ledger/digest/final under domain "workshop" via `guardedWriteRecord` (pin-guard).
- `--replay` / `--offline` modes byte-compare committed program+ledger → final (no model, no GL).

`pattern-book.mjs` writes the seed: `stageSeed({program,sketch,pack})` →
`seedWorkshopProgram` (compile + `realizeWithArticulation`, conformance gate) + measured proportions +
proportion declarations → serialized to `chainRels(key,pack).seed` (= `workshop/<key>/program.json`),
then **spawns** `workshop.mjs --subject <key> --pack <pack>` (pattern-book.mjs:258-260).

**So the live seed today = `seedWorkshopProgram`'s program realization.** That is the "pattern-book
seed-brush stage" AC#1 retires. The workshop reads `program.json`.

## generate-first's realizer (the new Stage-4 seed source)

`generated-milestone.mjs:provisionStage` (deterministic core, no GL/judge/writes):
1. **evidence** — voxelize GLB at `def.generated.scale`; condition in-memory with `shellStage`
   (closure + T-102 cage vs GLB silhouettes). Blob is FIT EVIDENCE only, never a build cell.
2. **provision-fit** (`src/form/provision-fit.mjs`) — full component set (footprints, wallTops, roof
   forms gable/hip/pyramid, opening groups); every fit error a named finding.
3. **provision-generate** (`src/form/provision-generate.mjs:generateProvision(fit, {family, policy,
   bands, sheetBlock, opts, metadata})`) — every artifact cell authored from parameters + kit;
   ZERO blob cells (provenance-checked + regenerated byte-identically from the serialized fit). Builds:
   hollow perimeter walls (no floor), T-112 roof vocabulary via `generateRoof`, **T-150 gable-end-as-wall**
   (gable envelope cells recolored to `wallBlockAt(y)`), opening carve-by-exclusion. Returns
   `{artifact, occ, provenance, roofPlan{cells,footprintCols,sheetKeys,capKeys,gableWallKeys}}`.
4. `buildSkin` (S-113 authority) → `styledStretch` (shared grammar/dressing/settle).

Inputs come from the **registry def** (`durable-skin.mjs`), NOT recognize.mjs's program:
`glb`, `generated.scale`, `kitRecord` (kit/v1), `zoneMapRecord` (named storey bands), `policy`
(base/upper/roof dominants). The chain runs the deterministic core **twice** and byte-compares
(determinism); `--repro` = two fresh runs byte-identical (E-36/T-153-01, no longer vs committed draft);
`--offline` gates the MEASUREMENT (gate record + sheet + zero-blob + AJV), drafts informational.

## Stage 3 (recognize) and the render-beside feedback

- `recognize.mjs` writes `recognition/<key><ns>.{program,artifact,replies,record,md}.json` — the
  model-recognized building-program (Stage 3). The pattern-book chain consumes it as `source`;
  generate-first consumes kit/zone-map (themselves recognition-derived), not the program directly.
- **E-36 de-freeze** (`src/view/render-beside.mjs`): `assertGlAvailable()` (loud named failure),
  `renderBesideConcept(artifact, conceptPath, out, {label})` — judge-free 4-azimuth render composed
  beside the concept. `generated-milestone.mjs --skip-gate` already calls it (T-152-01). This is the
  "rendered beside concept" evidence AC#3 wants. `builds/` is free; `measurements/`+`packs/` are the
  pin-guard allowlist (E-36).

## Constraints / what's absent

- **No `build.mjs`, no `build:<subject>` script, no `STRUCTURE.md`** exist (only `build:block-*` table
  scripts). All four green here.
- `npm test` is currently **2119/2119** (per session context). Determinism, replay-byte-identity, the
  workshop **isolation test** (`src/workshop/isolation.test.mjs` scans `workshop.mjs`/`pattern-book.mjs`
  for any judge seam), and the E-25 Rule 3 self-grep (no subject keys in runner source) are all
  enforced and must stay green.
- No per-building constants; subscription shim only (`claude -p`); pin-guard governs record writes.
- The registered subjects with both a GLB+scale AND a committed recognition are the `build` set
  (cottage, barn today — `workshopSubjectsFrom` predicate).

## Open questions for Design

1. Representation: the loop iterates a program; generate-first emits an artifact. How does the
   artifact become the loop's seed without breaking program-based replay of committed records?
2. What happens to the geometry levers (program/geometry/recognize) when the seed is a clean
   GLB-fit artifact with no revisable program? (AC#3: any difference is *named*.)
3. Orchestration: a new `build.mjs` entry vs. extending an existing runner; where the gate boundary sits.
