# T-195-01 — Research

Epic **E-51** / Story **S-195**. Build a **real wall-relief hand** for the picture-driven climb: proud
quoins / clinker / coursing standing *proud of* the wall plane (construction), not a flat recolor. This is a
map of what exists and how it connects — no solution here.

## The climb loop and its hand contract

- **Driver:** `experiments/eval-alignment/picture-climb.mjs` (T-188-01, epic E-48). This is THE picture-driven
  climb — render → DiagnoseBuild critique → agent picks a tool → apply → re-critique → accept-gate. NOT the
  older `src/workshop/loop.mjs` conformance loop. NOT in `npm test` (metered).
- **The hands** are plain functions in the runner, `hand(occ) → occ`:
  `apply_gable_roof` (92), `recolor_roof` (136), `construct_walls` (107), `add_timber_framing` (116),
  `frame_arch` (164), `articulate_walls` (185), `band_eave` (209). Registered in `TOOLS` (223), described in
  `MENU` (224–233), enumerated in the agent JSON enum (290).
- **Contract (by convention, no formal interface):**
  - `function hand(occ) → occ` — takes one **Occupancy** (`src/view/occupancy.mjs`), returns a *new*
    Occupancy via `occupancyFromCells(cells)` (`cells = {pos:[x,y,z], block, form, state}`). Never mutate input.
  - Synchronous, deterministic; loads program/pack from disk inside the hand
    (`loadProgram(PROGRAM_PATH)` / `loadPackOf(program)`).
  - Materials READ from roles via `roleBlock(pack, role)` — never a hardcoded block (S-192 note, 154–157).
  - Honest no-op: return `occ` unchanged + log; the runner's no-op guard (370–382) rolls back byte-identical
    builds with no spend (`buildDigest` equality).
  - Additive hands (`add_timber_framing`, `frame_arch`) compute placements then
    `occupancyFromCells([...occToCells(occ), ...placements])`. Recolor hands (`articulate_walls`) rewrite block.
- **Department map** lives in `src/workshop/climb-gate.mjs:31` `TOOL_DEPARTMENTS` (so it is unit-tested); a new
  WALL hand must be added there (and asserted in `climb-gate.test.mjs`).

## The accept-gate and the S-191 override (why "the WALL major must clear")

`src/workshop/climb-gate.mjs`:
- `acceptsRound(before, after, opts)` (140–159): keep `after` iff median picture score improved past
  `margin` (4); else consult the **department-dominant override**; else reject regressions / break ties on
  coverage shrink.
- `departmentDominant(...)` (113–123): returns a targeted department in which the tool **cleared a major**
  (`beforeDeptMajors[d] > afterDeptMajors[d]`), with (b) no new major and (c) no net total-item increase in
  any targeted dept. This is the mechanism that **keeps a WALL hand on a whole-build scalar regression** — but
  only if a WALL **major actually clears**. A recolor that leaves a WALL *major* standing is rolled back.
- `deptMajorCounts` / `deptItemCounts` (54–81) derive the per-dept signals from a critique's `items`.

So the AC "the WALL major clears so the override keeps it" = the new hand must move the DiagnoseBuild WALL item
from `severity:"major"` to absent/minor without growing WALL's net burden.

## The real WALL defects (from the last climb — T-193-01 trajectory.json)

Two WALL items recur across the gatehouse climb:
1. **WALL major/replace** — "Uniform near-black vertically-coursed material … far darker than the [concept];
   missing the mid-grey dressed-stone field value/material." → a **material/value** defect.
2. **WALL major/add** — "Corners are the same uniform dark coursing as the field; no rubble quoin contrast;
   missing the contrasting rubble quoins." → a **field-vs-quoin contrast** defect.

After `recolor_roof` (round 2, score 52) the WALL item softened to a **minor/add**: "Walls read as one fairly
uniform rough grey stone with little field-vs-quoin contrast; missing the **coursed dressed-stone field reading
distinct from the rough rubble corners**." That residual is the **relief** gap: the dressed field must read
*distinct from* (recessed relative to) proud rough rubble corners — construction, not a flat colour swap.

`articulate_walls` (round 3) recolors the field pale and keeps cobblestone corners, but the corners stay
**in-plane** — so the "distinct from … proud rubble corners" reading never lands and the WALL major reappeared
in that run. The hand's own comment concedes `composeTreatment`'s quoin was a no-op there (`proudCells=0`).

## The E-43 treatment-grammar relief ops (the primitives to reuse)

- **The proud op:** `surfaceRelief` (`src/view/surface-relief.mjs:64`). Emits cells **proud of** the wall plane,
  only in front of an existing exterior-skin cell; recess by exclusion (no air op); idempotent. Reached through
  the **registry door** as the pass `"surface.relief"` — never imported directly (brush-door tripwire,
  `src/pack/brush-door.conformance.test.mjs`).
- **The crux idempotence rule (why `articulate_walls`'s quoin no-op'd):** `surfaceRelief` skips a column when
  the **source** cell already IS the relief material (`bareBlock(blk) === reliefBlock`, surface-relief.mjs:106
  — "already relief, never re-emit; the clinker rule"). The gatehouse corners are *already* cobblestone, and the
  quoin material *is* cobblestone (`walls.dressing.role`) → every corner column is skipped → `proudCells=0`.
  **Recoloring the corners to the field block first makes the quoin emit** (source ≠ reliefBlock).
- **The compose engine:** `composeTreatment(occ, spec, ctx)` (`src/view/treatment-grammar.mjs:183`). Applies a
  `treatment-grammar/v1` spec as an ordered layer stack, each layer through the door:
  - `base` → proud plinth course (`rowCourse` → `surface.relief`) at the floor row;
  - `field` → **recess by exclusion** (must declare `recess:true`; emits nothing);
  - `edges.corners` → geometry-derived **proud quoins** via the `quoin` brush (alternating stretcher/header);
  - `edges.top` → corner-EXCLUDED eave cornice course (`rowCourse` + `excludeKey`);
  - `edges.opening` → injected `dressOpenings` + optional voussoir (DI seam; OPENING-owned, S-194 territory).
  - Each layer runs against the *original* occ, then folds once last-writer-wins; returns
    `{occ, placements, edges, report, closure}`.
- **Edges from geometry:** `deriveEdges(occ, {faces, floor, eaveY})` (treatment-grammar.mjs:77) →
  `{footprint, corners, cornerKey, top, bottom, band}` — the ≤4 footprint corner columns are the quoin set; no
  shape assumption.
- **Spec sourcing from roles:** `sourceTreatment(program, pack, {mass})`
  (`src/recognition/treatment-source.mjs:56`) derives a `treatment-grammar/v1` spec; **fails loud when edge
  material === field material** (a same-material relief silently no-ops). For the gatehouse:
  field = `walls.ground.role`, dressing/edge = `walls.dressing.role` — distinct (stone_bricks vs cobblestone).
- **Ready brushes also available** (all through the door): `quoin`, `pilaster`, `infillPanel`, `eaveOverhang`
  (`src/view/facade-articulation.mjs`); `clinkerCourses` (`src/view/clinker.mjs`).

## Closure and the gates I must not regress

- `closureOf(ring)` (`src/view/wall-generate.mjs:152`): fraction of the ring's bbox-rectangle perimeter the
  ring occupies; clean rect = 1. Pure.
- `recessClosureGuard(occBefore, occAfter, {floor, eaveY})` (`treatment-grammar.mjs:302`, exported): builds
  before/after wall-band rings restricted to the *before* footprint (neutralizing benign proud-quoin bbox
  growth), requires `closureOf(after) >= closureOf(before)` AND no dropped columns. Additive proud relief holds
  by construction; an air-op recess would trip it. `composeTreatment` already returns this verdict as `.closure`.

## The glance (the judge) and test conventions

- **Glance render:** `renderBesideConcept(artifact, conceptPath, outPath, opts)`
  (`src/view/render-beside.mjs:75`) — judge-free, no spend; renders the 4 gate azimuths beside the concept.
  `assertGlAvailable()` (42) is the single GL gate (throws `GlUnavailableError`). CLI: `npm run render:beside`.
  Precedents for a guard-only / probe render in the runner: `GUARD_ONLY` (324) and `ROOF_MATERIAL_PROBE` (310).
- **Tests:** `node --test "src/**/*.test.mjs"`, colocated `*.test.mjs`, `import { test } from "node:test"` +
  `assert/strict`, short prefix codes (TG/WG/CG…), small local stub builders (`boxStub` at
  `treatment-grammar.test.mjs:16`). `composeTreatment`/`recessClosureGuard`/`reliefNoRegress` already have a
  rich test (`treatment-grammar.test.mjs`) covering additive-only, closure "with teeth", in-plane no-regress,
  idempotence, fail-loud, purity — the shape this ticket's "pure parts unit-tested" AC wants.

## Constraints / assumptions

- **Parallel sibling:** T-194-01 (S-194) owns the **no-air-op narrowing + arch carving** (OPENING). I must
  stay WALL-only and **not** touch the aperture/carve path or `frame_arch` — I omit `edges.opening` from my
  spec to avoid OPENING overlap and file collisions.
- **Frozen instrument untouched** (`measurements/`); creation-side only.
- **Brush-door rule:** reach proud/quoin ops via `composeTreatment` (which already goes through the door),
  never a direct `surface-relief`/`quoin` import — or `brush-door.conformance.test.mjs` trips.
- **Amplitude is the lever** ([[facade-grammar-recolor-vs-construction]], E-43/E-35): restrained reads rich,
  busy reads noisy. The deliverable is judged on the render, not block counts.
