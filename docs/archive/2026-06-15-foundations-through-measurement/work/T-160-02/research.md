# T-160-02 Research — construction-centric wall skin from pack roles

*Descriptive map of the code the wall-skin pass must fit between. No solutions — those are Design.*
*Builds directly on T-160-01 (the `constructWalls` envelope brush + the `construct_walls` loop tool).*

## The ticket in one line

T-160-01 gave the wall a clean **envelope** (a solid ring floor→eave). It came out **monotone** —
the cottage regressed −7 to a PALETTE cap ("no stone base, plaster, or timber contrast"). This ticket
gives that envelope its **skin as construction, not recolor**: drive the *already-built* articulation
brushes (quoin / course-clinker / opening-dressing / limewash / plinth) from the program's **declared
wall roles**, applied as **relief over the envelope** via the `applyArticulation`/`articulateArtifact`
seam — replacing the loop's blunt fill + hardcoded `wallField` with the fine construction tools.

## What T-160-01 already shipped (the substrate this ticket skins)

- `src/view/wall-generate.mjs` — `constructWalls(occ, {floor, eaveY, program, wallField, …})`: morphological
  close → perimeter ring → solidify floor→eave in each column's **own modal material** (`localFill`) →
  carve a regular opening rhythm from `program.masses[].openings[]` (frame-independent counts). Pure.
- `experiments/eval-alignment/autonomy-loop.mjs` — already swapped `seal_walls` → `construct_walls`
  (thin adapter `construct_walls(occ)` calling `constructWalls`, plus `loadProgram(subject)` reading
  `benchmarks/sculpture/recognition/<subject>.program.json`). Toolset is **size-3**: `apply_gable_roof`,
  `construct_walls`, `add_timber_framing` (the last already uses `infillPanel`). The PACK is **never loaded**.
- T-160-01's verdict (review.md): envelope solidified but **monotone** → cap moved off structural-integrity
  to **palette**; the brush "preserves per-column zoning but cannot *invent* the concept's ground-stone /
  upper-plaster split" — explicitly named the follow-up as **per-storey material from `walls.*` roles**.
  This ticket is that follow-up, *as construction* (the relief idioms), not just a recolor.

## The articulation seam (what this ticket WIRES — already built)

- `src/recognition/compile.mjs`
  - `roleBlock(pack, role)` — the ONE role→block resolution point.
  - `applyArticulation(occ, plan)` — runs a plan of `{brush, params}` through `getBrush`; requires each
    `entry.kind === "pass"`; calls `entry.fn(occ, params)`; accumulates `{placements, report}`. **All
    brushes run over the SAME base occ** (independent passes, not chained).
  - `facadeArticulationPlan(m, pack)` — builds a plan FROM a mass's `facade` record. **Returns `[]` when
    the mass has no `facade`** (it reads `m.facade.faces`). ← critical: see below.
- `src/workshop/articulate.mjs`
  - `articulateArtifact(baseArtifact, articulation)` — folds relief over an artifact via `applyArticulation`
    + `mergePlacements` (last-writer-wins by position, relief fronts the skin); byte-identical when the
    plan is empty. The named AC1 vehicle (artifact-input twin of `realizeWithArticulation`).
  - `mergePlacements(skin, relief)` — relief cell at an existing pos OVERWRITES; fresh pos appends.
- `src/view/facade-articulation.mjs` — the four relief brushes, each `(occ, opts) → {placements, report}`,
  taking **resolved block ids**: `pilaster` (proud strips), `quoin` (corner stepped run, alternating
  stretcher/header depth, all faces' corner columns), `infillPanel` (studs + field recolor), `eaveOverhang`
  (soffit course at a row). Charter: proud cells only in front of existing exterior shell; recess by
  exclusion (no air op); idempotent; pure. `bandZone({yLo,yHi})` → storey y-gate predicate.

## The brushes the ticket names (signatures confirmed)

All are registered passes in `src/pack/idiom-registry.mjs` and match the `(occ, params)` contract that
`applyArticulation` requires — **except `dressOpenings`** (3-arg; call it directly):

| Ticket idiom | Registry name | fn / module | params (runtime) |
|---|---|---|---|
| quoin (corners) | `quoin` | `facade-articulation.mjs` | `{material, faces, run, headerDepth, band?}` |
| field course / clinker | `surface.clinker` | `clinker.mjs` `clinkerCourses` | `{board, zoneOf (required), zone, faces, lap, course}` |
| per-storey field | `surface.fill` | `zone-fill.mjs` `zoneFill` | `{zoneOf, zones:{zone:{dominant,preserve}}, skin, minRun}` |
| limewash banding | `surface.limewash` | `limewash.mjs` `limewashAspect` | `{block, aspects:[dir], coverage, minRun, preserve}` |
| opening dressing | `opening-dressing` | `opening-dressing.mjs` `dressOpenings` | `(occ, apertures, treatments)` — **NOT (occ,params)** |
| plinth (base) | `plinth` | `idiom-constructs.mjs` `plinthBand` | **kind "construct"** (spec→cells), not a relief pass |

`extractApertures(occ, dirs=SIDE_FACES)` reads the envelope's holes → world apertures. `treatmentsFromKit`
maps a kit record → `{slots:{infill,shutter,door,light,frame}}`; the pack's `door.*`/`window.*`/
`opening.lintel` roles can fill these slots directly. `clinkerCourses` and `zoneFill` **require a `zoneOf`
closure** — fine for a runtime-computed plan (purity-as-data is only required of *committed* programs).

## The recognition programs (the role source) — the alignment facts

`benchmarks/sculpture/recognition/<subject>.program.json`. Each declares `program.pack` and per-mass
`walls.{ground,upper,dressing}.role`, `plinth.{courses,role}`, `openings[]`. **None carries a `facade`
record** (confirmed: `facade:"none"` on barn; cottage/barn-saltcrag have no `facade` key) — so the existing
`facadeArticulationPlan` path emits NOTHING for these subjects. **The skin plan must be derived from the
`walls.*` roles directly, not from a `facade` record.** That is the new code this ticket adds.

| Subject | pack | walls.ground | walls.upper | walls.dressing | plinth | program? |
|---|---|---|---|---|---|---|
| cottage | rustic | `wall.dressing`(stone_bricks) | `wall.infill.upper`(white_terracotta) | `wall.dressing` | yes | yes (2 masses, L) |
| barn | rustic | `wall.field.ground`(cobblestone) | `wall.field.ground` | `wall.dressing`(stone_bricks) | yes | yes (1 mass) |
| barn--saltcrag | **saltcrag** | `wall.field.ground`(cobblestone) | `wall.field.ground` | `wall.dressing.quoin`(stone_bricks) | yes | yes (1 mass) — **witness** |
| gatehouse | — | — | — | — | — | **NONE** (degrade to envelope-only) |

Pack roles available (resolution targets): **saltcrag** has the rich wall vocabulary —
`wall.field.ground`=cobblestone, `wall.field.upper`=dark_oak_planks, `wall.dressing.quoin`=stone_bricks,
`wall.finish.limewash`=white_terracotta, plus `door.main`/`window.shutter`/`window.glazing`/`opening.lintel`.
**rustic** has `wall.field.ground`=cobblestone, `wall.dressing`=stone_bricks, `wall.infill.upper`=white_terracotta,
`frame.timber`=dark_oak_log, `door.main`/`window.shutter`/`window.infill` — **but NO `wall.finish.limewash`**
(so limewash banding only fires on the saltcrag witness; rustic skips it — graceful by role-presence).

## The witness case (`benchmarks/sculpture/workshop/barn--saltcrag/final-artifact.json`)

Present on disk. The ticket's census: saltcrag declares quoin/limewash/clinker but the build placed a **flat
cobblestone plane + 140 quoin blocks, no courses/relief/limewash**, `prompting_method_id:
procedural/workshop@1` (**never ran articulation**). This is the recolor-collapse the construction skin must
fix. The build is also 72% solid `dark_oak_planks` roof-prism — **out of scope** (roof concern, T-160-03).
`builds/barn--saltcrag/` does NOT exist → the witness reads the workshop artifact.

## Constraints / assumptions surfaced

- **No per-building constants in the pass** (AC5): the skin reads roles/zones, never subject keys. `eaveY`/
  `ridgeAxis`/artifact-path are harness SUBJECTS config (allowed — they were already there in T-160-01).
- **Pack must be loaded** (it currently isn't): `program.pack` names it → `packs/<pack>.json`. No program /
  no pack ⇒ skin no-ops (gatehouse stays the bare envelope — the graceful-degradation contract).
- **`wallField` hardcode removed** (AC2): the envelope's last-resort fill derives from the pack ground role;
  the skin's per-storey fill then overwrites the exterior with the role materials anyway.
- **`dressOpenings` is 3-arg** — it cannot ride `applyArticulation`'s `(occ,params)` loop; call it directly
  after the relief plan, over the relieved occ, so it dresses the carved holes (zoneFill recolors only
  *occupied* skin cells, never fills the holes — verified in the signature).
- **`defect-eval.mjs` untouched** (AC5 / S-161 boundary); the render beside the concept is the real judge
  (relief is exactly what a coarse single-azimuth metric misses — the ticket says trust the render here).
- **Replace, not patch / minimal toolset**: the skin folds INTO `construct_walls` (envelope → skin), keeping
  the menu size-3; it does not add a 4th tool. The agent gets a *finer* wall tool, not *more* tools.
