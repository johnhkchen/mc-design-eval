# T-147-01 Research — articulation-brushes

Epic **E-35** / Story **S-147**. Descriptive map of what exists, where, and how it connects.
Builds on **T-146-01** (the shared relief op) and **T-145-01** (the recognised facade grammar).
No solutions here — see `design.md`.

## 1. The deliverables, restated against the code

The ticket names four missing registry brushes (`pilaster`, `quoin`, `infill-panel`,
`eave-overhang`), each "emitting through T-146-01's relief op," plus wiring the existing
`jetty`/`dormer` constructs "into the program path so the recognised grammar actually builds."
Two of those premises need reconciling with the current tree (§5, §6).

## 2. T-146-01's relief op — the substrate the brushes ride

`src/view/surface-relief.mjs`:
- `surfaceRelief(occ, {material, faces, rhythm:{axis,every,span,phase}, depth, zoneOf, zone})` —
  emits proud cells **in front of existing exterior shell cells** on a column/row rhythm
  (`surface-relief.mjs:64`). Charter (the clinker generalisation): proud only in front of existing
  cells (in-plane silhouette preserved by construction), **recess by exclusion** (no air op),
  idempotent (never re-emits its own material; a ray stops at the first occupied cell). Returns
  `{placements:[{op:"voxel",pos,block}], report:{strips,proudCells,fieldCells,…}}`.
- `reliefNoRegress(occBefore, placements, {faces, opts})` (`:156`) — the **gate predicate**: own-face
  orthographic elevation + `maskProportions` byte-identical before/after, and whole-build
  `ridgeToEave`/`roofShare` unchanged. Perpendicular widening is honest visible relief
  (`expectedWidening`, never gated). **Exported for reuse** — the brushes' silhouette no-regress test
  (AC#4) calls this exact predicate.
- `RELIEF_DEFAULTS = {depth:1, span:1, phase:0}` — declared, never subject-tuned. `every` has no
  universal value: the caller supplies the period from the grammar.

`pilaster` ≈ `surfaceRelief` with `rhythm.axis:"column"` already. The four brushes are
**specialisations/compositions of this one op**, not new geometry engines.

## 3. The registry door + brush contract

`src/pack/idiom-registry.mjs` — the ONE door (E-32 Rule 1). Two kinds:
- **construct** (`kind:"construct"`, `generate: spec→{cells}`) — realized in `realizeProgram`; needs an
  `IDIOM_CARD_SPECS` entry (`idiom-card.mjs`).
- **pass** (`kind:"pass"`, `fn: occ+ctx→{placements,report}`) — NOT realized by `realizeProgram`;
  preview is a `{substrate, params, realize({occ,cells})}` closure (no card spec). `surface.relief`
  is the template (`idiom-registry.mjs:374`): `composition {consumes:["occupancy"], emits:["placements","report"]}`,
  substrate `kind:"shell"`, realize calls `surfaceRelief` + `overlayCells`.

Contract enforced by `src/pack/brush-contract.mjs`:
- Closed vocabularies (`:41`): `BRUSH_CONSUMES = [spec,occupancy,zones,features,kit,artifact]`,
  `BRUSH_EMITS = [cells,placements,report,removeSet,artifact]`.
- A pass must consume `"occupancy"` and emit `"placements"` or `"removeSet"` (`:171`).
- `brush-contract.test.mjs:215` asserts **"24 brushes"** (T-146 bumped 23→24) — adding four → **28**.
- `brush-catalog.test.mjs:22` — `catalogCoverage` requires every brush plotted (passes via
  `realizePassPreview`); `:58` asserts the count line in the catalog md.
- `idiom-registry.test.mjs:143` — passes have closed paramsSchemas (`validate({})` ok,
  `validate({swag:true})` false); `:165` — every brush carries composition/tests/preview.

## 4. Preview-card machinery for passes

`src/pack/brush-preview.mjs`: `PREVIEW_SUBSTRATE_KINDS = ["shell","solid","box"]` (`:23`);
`previewSubstrate(decl)` builds cells; `realizePassPreview(name, entry)` (`:84`) builds the substrate
occupancy and runs `entry.preview.realize({occ, cells})`, expecting ≥1 cell. `brush-catalog.mjs`
plots passes through this. **No `idiom-card.mjs` edit is needed for passes** (that file is
construct-only — `cardCoverage` only checks constructs).

## 5. The "program path" (where AC#2 lives)

`benchmarks/sculpture/pattern-book.mjs` IS the recognised-program → build chain:
`parseProgramReply` → `compileProgram(program, pack)` → `realizeProgram(workshopProgram)` →
grammar/dressing/settle (`verifyRecognition` at `:106`–`116`; live chain `runLive` `:231`). It is
**record-pinned**: `patternbook:repro` / `patternbook:offline` byte-compare committed artifacts; a
`generalizationGrep` (`:79`) self-greps the runner source (matches comments too —
[[generalization-grep-and-no-evidence-rerolls]]).

`src/recognition/compile.mjs`:
- `compileProgram(program, pack)` (`:114`) lowers `program.masses` → `{workshopProgram:{elements}}`.
- `roleBlock(pack, role)` (`:27`) — the **role→block resolver for the program path** (looks up
  `pack.palette`). Every construct element resolves roles here before emission.
- Already emits idiom elements for **plinth** (`:187`), **jetty** (`:197`, consumes `m.jetty.walls`/
  `beamRole`/`joistRole`), **dormers** (`:245`, consumes `m.roof.dormers.count`/`wall`), chimney,
  roof, arch/head. `jettyOverhang` spec gets a default `overhang` (no per-storey depth read).
- **`facade` is never referenced** (`grep facade compile.mjs` → 0). T-145-01 deliberately left it
  "read by recognition + the gate, ignored by compile/realize" for byte-identity (T-145 design D0).

`realizeProgram(workshopProgram)` (`src/workshop/program.mjs:180`) — walks `elements`; shell →
`boxShell`, idiom → `getIdiom(idiom).generate(spec).cells`. **Constructs only** (`.generate`); passes
have no `.generate` and are applied later, over the occupancy, in the chain's grammar/dressing/settle
stage (`styled-milestone.mjs:103` `styledStretch`; `placement-grammar.mjs:grammarStage`).

## 6. Jetty / dormer wiring status — premise correction

The ticket says jetty/dormer constructs are "not [wired into the program path] at all." **Refuted by
the tree**: `compile.mjs:197` (jetty) and `:245` (dormers) already emit idiom elements from
`m.jetty` / `m.roof.dormers`, realized by `realizeProgram`, carded in `idiom-card.mjs:43-53`. Both
build today from a recognised program (`verifyRecognition` exercises the full mass set).

The **actual** unwired surface is the **T-145 facade grammar** (`schema/building-program.schema.json:180`):
`masses[].facade.{eaveOverhang, faces[].{rhythm, memberRole, fields, quoins, courseLines, jettyDepth,
openingsRhythm, evidence}}`. It is recorded + pack-validated (`program.mjs` `validateProgramAgainstPack`,
`facadeBounds`, `assertFacadeDiegetic`) but **nothing consumes it to build**. Specifically:
- `facade.faces[].jettyDepth` — described "refines `masses[].jetty`" — unread.
- `facade.eaveOverhang` — unread (this is the `eave-overhang` brush's input).
- `facade.faces[].{rhythm, memberRole, fields, quoins, courseLines}` — the pilaster / infill-panel /
  quoin inputs — unread.

So AC#2 ≡ "make the recognised facade grammar build": consume `facade` in the program path,
resolving its roles via `roleBlock` and emitting the articulation passes + refining the jetty.

## 7. Vocabulary authority (AC#3)

Two composition points, by layer:
- **Program path:** roles resolve through `compile.mjs:roleBlock` — every construct element already
  does this; facade roles must resolve **here too**, not via a private path.
- **Skin/dressing chain:** `src/form/material-vocabulary.mjs` `composeVocabulary` / `ownSetsOf`
  ([[vocabulary-authority-one-composition-point]]) — the conformance sweep enforces single-sourcing.

The new brushes take a resolved `material` (block) param like every other pass; the
named→shipped resolution stays at `roleBlock` (program path). **No per-building constants**: periods
come from `facade.faces[].rhythm`, depth from `RELIEF_DEFAULTS`/grammar, bounds from
`pack.proportions.articulation` (or the documented fallback, T-145 D6).

## 8. Conformance sweep (AC#3, AC#4)

`src/pack/brush-door.conformance.test.mjs`: `TECHNIQUES` (`:29`) lists every technique module;
`ALLOWED` (`:41`) maps file→permitted technique imports. `surface-relief` is already in TECHNIQUES
(`:37`). A new module that imports `surface-relief.mjs` must (a) join TECHNIQUES and (b) get an
ALLOWED entry (the `roof-steep → roof-generate` precedent at `:49`). Applying passes via
`getBrush(name).fn(...)` (the door) is NOT a violation — only direct technique-module imports trip.

## 9. Constraints & assumptions carried into Design

- **Byte-identity (AC#4):** every committed program/pack has **no `facade`** → any facade consumer
  must be a strict no-op when `facade` is absent, so `patternbook:repro/offline`, `recognize:offline`,
  `facade:offline`, `styled:*` stay byte-identical.
- **Relief is construction, paint is recolor** — the four brushes ADD proud cells (no air op);
  `infill-panel` combines proud studs (relief) with a between-members field (the recolor half).
- **Diegetic proof** — facade carries roles only; resolution is `roleBlock`; a GLB can inform layout,
  never material (T-145 D2).
- **FX-R1 watch** ([[same-prompt-seam-handle-dont-reject]] / obs 16829): prompt-sha drift came from a
  sibling's uncommitted schema lines; keep changes additive and re-verify offline replays.
- **Self-grep** (`pattern-book.mjs:79`) matches comments — any live-chain edit must avoid subject keys.
