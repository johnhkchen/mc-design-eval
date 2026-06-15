# T-147-01 Design — articulation-brushes

Decisions with rejected alternatives, grounded in `research.md`. Through-line: **the four brushes
are passes over T-146's relief op; the "wiring" is making the recognised facade grammar build by
consuming it at the program path (`compile` resolves roles, a pure applier runs the brushes over the
realized occupancy), strictly no-op when `facade` is absent so every committed pin stays
byte-identical.**

## D0. The load-bearing seam: facade-absent ⇒ byte-identical

Every committed program/pack lacks `facade` (T-145 D0). So:
- `compileProgram` emits the articulation plan **only** when a mass has `facade` → committed subjects
  produce the **same** workshop program → `realizeProgram` byte-identical → `patternbook:repro/offline`
  green.
- The applier runs **only** on a non-empty plan → no placements added → occupancy unchanged →
  `styled:*` and the gate untouched.
- `facade:offline` (T-145's replay) is untouched (we don't change recognition/parse).

This is what lets AC#2 (build the facade) and AC#4 (byte-identical) coexist: we *add* a realization
path that no committed input exercises yet; a dedicated fixture program exercises it under test.

## D1. The four brushes are PASSES in one new module (chosen)

**Chosen — `src/view/facade-articulation.mjs`**, exporting `pilaster`, `quoin`, `infillPanel`,
`eaveOverhang`, each `(occ, opts) → {placements, report}`, each delegating to `surfaceRelief`:
- `pilaster(occ,{material,faces,rhythm:{period,phase},span,depth,zoneOf,zone})` — proud vertical
  strips: a thin adapter mapping the grammar's `{period,phase}` → `surfaceRelief` `rhythm{axis:"column",
  every:period,phase,span}`. **Preserves the rake by construction** (surfaceRelief only emits in front
  of existing cells). This is the minimal brush — the AC's "preserving the rake."
- `quoin(occ,{material,corners?,run,depth})` — corner stepped accent. Finds each vertical corner edge
  of the named faces and emits a proud run up the corner with **alternating stretcher/header**: the
  step is the depth alternation (1,2,1,2,… cells proud per course up to `run`), reusing surfaceRelief
  per-corner-column with `rhythm.axis:"row"` + a depth schedule. Alternation = the
  stretcher/header read; relief is the geometry.
- `infillPanel(occ,{memberMaterial, fieldMaterial, faces, rhythm:{period,phase}, zoneOf, zone})` —
  the thing `timber-frame` stops short of: **studs** (proud, via `surfaceRelief` column rhythm with
  `memberMaterial`) PLUS the **panel field** between them (a recolor of the non-stud field cells to
  `fieldMaterial`). Studs are construction (relief), the field is paint-style recolor placements at the
  base plane. Returns both placement sets; the recess-by-exclusion rule means the field reads recessed
  relative to the proud studs with no air op.
- `eaveOverhang(occ,{material, faces, depth, soffit?})` — a **horizontal proud course at the eave
  row** (the topmost wall row under the roof), projected `depth` cells proud of the wall plane,
  distinct from `jetty` (jetty is a storey-floor bressummer lip; this is the soffit at the roofline).
  Implemented as `surfaceRelief` with `rhythm.axis:"row"`, `every:1` restricted to the eave row via a
  `zoneOf` that selects only `y == eaveRow`.

All four `consumes ["occupancy"]` (infillPanel also reads zones), `emits ["placements","report"]`.

*Rejected — add the four as exported functions inside `surface-relief.mjs`.* Avoids a new TECHNIQUES
entry, but bloats the "one shared op" module with four named idioms and muddies its charter. The
clinker/limewash/roof-steep precedent is one cohesive module per technique family; a dedicated
articulation module reads better and the allowlist cost is one line.

*Rejected — make them constructs (`spec→cells`).* Relief is fundamentally relative to existing
geometry (proud **in front of** the shell); a construct has no occupancy to read, so it could not
honor the rake-preservation / recess-by-exclusion charter. Passes are the correct kind.

## D2. Conformance: join TECHNIQUES + allowlist the surface-relief import (chosen)

`facade-articulation` joins `TECHNIQUES` and gets `ALLOWED["src/view/facade-articulation.mjs"] =
{modules:["surface-relief"], reason:"articulation idioms delegate to the ONE relief op (no refork)"}`
— exactly the `roof-steep → roof-generate` shape (`brush-door.conformance.test.mjs:49`). The applier
and any chain hook reach the brushes via `getBrush().fn`, never a direct import, so no other file
trips. (The "allowlist cannot rot" test requires the import to actually exist — it will.)

## D3. Registry entries — four passes with substrate+realize previews (chosen)

Mirror the `surface.relief` entry exactly (`idiom-registry.mjs:374`): `kind:"pass"`, `fn`, `source`,
`tests`, `composition`, `preview:{substrate:{kind:"shell",spec}, params, realize({occ,cells})}`,
closed `paramsSchema`. Names: **`pilaster`, `quoin`, `infill-panel`, `eave-overhang`** (kebab, the
AC's spelling). Each realize closure stages a small shell and overlays the brush placements (the
`overlayCells` helper already in the module). No `IDIOM_CARD_SPECS` change (passes are catalog-plotted
via `realizePassPreview`). Brush count 24 → **28**; update `brush-contract.test.mjs:215`.

*Rejected — one parametrised `surface.articulation` brush with a `mode` enum.* Collapses four
distinct techniques behind a discriminator, defeating the "four registry brushes" AC and the
preview-card-per-technique contract. The registry's whole value is one name per technique.

## D4. The wiring: compile plans, a pure applier builds (chosen)

`facade` → build, split pure/by-layer so role resolution stays at the one program-path point:
1. **`compileProgram` extension (`compile.mjs`):** when `m.facade` present, build an **articulation
   plan** — an ordered `[{massId, brush, params}]` where every role is already resolved to a block via
   `roleBlock(pack, role)` (AC#3 — the program-path vocabulary authority). Return it as a new
   `articulation` field on the compile result (`{workshopProgram, declarations, …, articulation}`);
   `workshopProgram` is **unchanged** when `facade` is absent (the plan is `[]`). Mapping:
   - per face: `rhythm`+`memberRole`(+`fields.role`) → `infill-panel` if `fields` else `pilaster`;
     `quoins` → `quoin`; `courseLines` → relief row courses (via `surface.relief` row rhythm — reuses
     the existing brush, no new one); `jettyDepth` → refine the jetty element's `overhang` (below).
   - `facade.eaveOverhang > 0` → one `eave-overhang` invocation per relevant face.
2. **jetty refinement:** in the jetty element emission, `overhang = face.jettyDepth ?? default`. Pure,
   additive; default path (no facade) unchanged → byte-identical.
3. **pure applier `applyArticulation(occ, plan)` (in `facade-articulation.mjs`):** resolves each
   `plan[i].brush` via `getBrush` (the door) and runs `fn(occ, params)`, accumulating placements;
   returns `{placements, report, perBrush}`. Reaches brushes through the registry → no door violation.
4. **program-path hook:** `pattern-book.mjs` applies `applyArticulation` after `realizeProgram` (guard:
   empty plan → skip, occupancy untouched). Because no committed subject has `facade`, the chain stays
   byte-identical; the new path is proven by a fixture test (D6), not the committed run.

*Rejected — consume `facade` inside `realizeProgram`.* `realizeProgram` has neither the pack (for
`roleBlock`) nor the recognition `program.masses[].facade` (it sees resolved `elements`). Threading
both in would fork the role-resolution authority into the workshop layer. Compile already owns
role→block; the plan belongs there.

*Rejected — emit the passes as workshop-program elements.* Elements are constructs (`.generate`);
`realizeProgram` has no pass path, and passes need the assembled occupancy (not per-element cells).
A post-realize applier is the only correct shape.

## D5. No-regress + the AC's silhouette guarantee

Every brush is provable in-plane-invisible: its test runs `reliefNoRegress(occBefore, placements,
{faces})` and asserts `inPlanePreserved && ratiosPreserved` (T-146's exported predicate). The honest
perpendicular widening is `expectedWidening`, recorded, never gated — identical posture to T-146.
`infillPanel`'s field recolor is at the base plane (no depth) so it cannot move any silhouette; only
the proud studs widen, and they ride the rake-preserving relief op.

## D6. Determinism, fixtures, replay (AC#4)

- Brushes are PURE (sorted occupancy iteration, no Date/random) → byte-stable placements (the
  surfaceRelief guarantee).
- A committed **fixture facade program** (`src/recognition/fixtures/facade/articulated-program.json` or
  reuse T-145's `expected.json`) drives a test: `compileProgram` → `realizeProgram` → `applyArticulation`
  → assert proud pilaster/quoin/infill/eave cells exist, jetty `overhang` reflects `jettyDepth`, and
  `reliefNoRegress` holds. This is the AC's "the recognised grammar actually builds."
- `--repro`/`--offline`: committed subjects (no facade) → plan `[]` → identical bytes. Verified by
  running `patternbook:offline`, `recognize:offline`, `facade:offline` after each step.

## D7. What is explicitly out of scope

- The **relief-aware gate** (S-148) — `reliefNoRegress` is already exported for it; we don't change the
  gate here.
- A live facade-bearing committed subject end-to-end render — adding one would mint new pins and pull
  in the recognition model; the fixture test proves the build path without that cost (deferred, named).
- BAML migration of any prompt (T-145 D4 already chose the pure-builder path).
