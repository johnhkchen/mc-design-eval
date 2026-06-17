# T-192-01 — PLAN: ordered, independently-verifiable steps

Each step commits atomically. Primary proof = unit tests (the arch geometry) + `GUARD_ONLY=1` wiring; the
metered climb is corroborating evidence (GL+LLM, not in CI), captured as artifacts.

## Step 1 — the arch primitive, TDD (`src/view/arch-frame.mjs` + test)

1a. Write `src/view/arch-frame.test.mjs` first (AF1–AF6 from structure.md) against a synthetic occupancy:
    build a 1-cell-thick stone wall on −x and +x with a flat rectangular door hole (`occupancyFromCells`),
    `eaveY`-bounded, no GL. Assert the placements/return shape the module must satisfy.
1b. Implement `frameArchPlacements(occ, apertures, {frameBlock, minWidth=5})`:
    - iterate `kind:"door"` apertures; `OPENING_AXES[dir]` → `{u,v,w,sign}`;
    - span `[uLo,uHi]`, y `[vLo,vHi]` from `ap.cells` (`au`/`av`); `W=uHi-uLo+1`; `W<minWidth` → push
      `{dir,width:W,kept:false,reason:"too-narrow"}`, continue;
    - `w* = probeWallPlane(occ, ap, ax)` (first `occ.solid` from the exterior face along `w` across
      `region.min[w]..max[w]`); null → `{kept:false,reason:"no-wall-plane"}`;
    - `radius=W/2`, `vTop=vHi`, `spring=vTop-Math.floor(radius)`,
      `spec={center:[(uLo+uHi)/2, spring], radius, span:{axis:axisLetter(ax.u), range:[uLo,uHi]},
       yRange:[spring, vTop], depth:{axis:axisLetter(ax.w), range:[w*,w*]}, block:frameBlock}`;
    - `const {ring, jambCells} = archRing(spec);`
    - ring: for each `{pos,block}` push `{op:"voxel",pos,block:namespaced(frameBlock)}` (additive head);
    - jambCells: parse `"x,y,z"`; if `occ.solid(x,y,z)` push a recolor `{op:"voxel",pos,block:frameBlock}`;
    - record `{dir,width:W,kept:true,ringCells,jambCells}`; return `{placements, perOpening}`.
1c. `npm test` green (new AF1–AF6 pass, nothing else breaks).
**Verify:** `node --test src/view/arch-frame.test.mjs` green; full `npm test` green.
**Commit:** `feat(T-192-01): arch-frame — construct a voxel arch + timber frame on a flat opening`.

## Step 2 — wire `TOOL_DEPARTMENTS` (`src/workshop/climb-gate.mjs`)

2a. Add `frame_arch:["OPENING"]`, `articulate_quoins:["WALL"]`, `band_eave:["ROOF"]` to the frozen map.
2b. Add one assertion to `climb-gate.test.mjs` (extend CG2 or a new CG17) that the three new tools resolve to
    their departments and the override fires for `frame_arch` clearing an OPENING major (mirrors CG14's ROOF
    case for OPENING) — proves the override GENERALIZES past ROOF at the unit level (the claim's crux),
    deterministically, before any spend.
**Verify:** `node --test src/workshop/climb-gate.test.mjs` green; `npm test` green.
**Commit:** `feat(T-192-01): map+test new hands' departments; override generalizes to OPENING (CG17)`.

## Step 3 — the three hands + orientation in the runner (`picture-climb.mjs`)

3a. Orientation: `const RIDGE_AXIS = loadProgram(PROGRAM_PATH)?.masses?.[0]?.roof?.ridgeAxis ?? "z";` set
    `CFG.ridgeAxis = RIDGE_AXIS` (replacing the hardcoded `"z"`). Log the derived axis in the `[guard]` line.
3b. Resolve roles once after PACK loads: `dressingRole = PROGRAM.masses[0].walls.dressing.role`,
    `headRole = PROGRAM.masses[0].openings.find(o=>o.kind==="door").headRole`,
    `roofTrimRole = PROGRAM.masses[0].roof.trimRole`; blocks via `roleBlock(PACK,...)`.
    (Hands that run pre-PACK in the probe paths read the program/pack locally, mirroring `recolor_roof`.)
3c. `frame_arch(occ)`: `extractApertures(occ)` → `frameArchPlacements(occ, aps, {frameBlock})` → overlay via
    `occupancyFromCells([...occToCells(occ), ...placements.map(p=>({pos:p.pos,block:p.block}))])`.
3d. `articulate_quoins(occ)`: `composeTreatment(occ, {field:{recess:true}, edges:{corners:{material:
    quoinBlock}}}, {floor: occ.bounds.min[1], eaveY:CFG.eaveY, extractApertures, dressOpenings}).occ`.
3e. `band_eave(occ)`: derive `ridgeY` (the roof band top: max y of cells above eaveY, or `eaveY+floor(perp/2)`
    like the roof hands) → `composeRoofTreatment(occ, {edge:{material:bandBlock}}, {ridgeAxis:CFG.ridgeAxis,
    eaveY:CFG.eaveY, ridgeY}).occ`. If no roof band present (eave-capped seed) → honest no-op (returns occ).
3f. Register: `TOOLS` += three; `MENU` += three when-to-pick lines; `agentPick` enum += three names.
**Verify:** `GUARD_ONLY=1 node experiments/eval-alignment/picture-climb.mjs` — asserts assets+GL, renders
round-0 + beside sheet, exits before spend; prints the derived `ridgeAxis=x`. No `npm test` impact (runner is
out of the glob).
**Commit:** `feat(T-192-01): frame_arch/articulate_quoins/band_eave hands + program-derived roof orientation`.

## Step 4 — metered climb (evidence, optional, metered)

4a. `CLIMB_OUT=docs/active/work/T-192-01/trajectory.json node experiments/eval-alignment/picture-climb.mjs`.
4b. Capture `run.log`, `trajectory.json`, and the per-round beside renders that show the arch + quoins (and
    the band attempt). Read the renders first-hand (the glance is the deliverable, not the score).
4c. Record, per hand, the falsification outcome: critique fired → lever applied → did the gate KEEP it?
    - `frame_arch`: OPENING major cleared & kept (override generalized) — or rolled back (S-191 finding).
    - `articulate_quoins`: WALL major cleared & kept, no other-department glance regression.
    - `band_eave`: minor-only — kept by scalar/tie, or rolled back (the recorded override minor-gap).
**Note:** this step is best-effort. If spend/vote-noise floors the scalar (the T-191 caveat), the unit proofs
(Step 1, CG17) still establish the hands' geometry and the override's generalization deterministically.

## Step 5 — Review

Write `review.md`: files changed, the per-hand falsification table (honest: which the gate kept, which it
didn't and why), the orientation correction + the critique-coverage gap flagged for E-50/E-49, test coverage
+ gaps, `npm test` count, `git status measurements/` clean.

## Testing strategy summary
- **Unit (in `npm test`):** `arch-frame.test.mjs` (AF1–AF6, the new geometry) + `climb-gate.test.mjs` CG17
  (override generalizes to OPENING). Pure, no GL/LLM. This is the primary, deterministic proof.
- **Wiring (free):** `GUARD_ONLY=1` runner — imports, role resolution, render seam, derived orientation.
- **Integration (metered, manual, artifacts only):** the climb trajectory + beside renders.
- **Invariant:** `git status measurements/` clean; frozen instrument files untouched; `npm test` green.

## Risks & mitigations
- **archRing spec edge cases** (even vs odd width, half-cell center): archRing accepts float center; AF tests
  cover an even (W=4→narrow-skip) and an odd/≥5 width. *Mitigation:* the `minWidth` skip + AF4.
- **Quoin contrast still reads as the field** if cobblestone≈stone_bricks value on the glance → recorded as a
  glance finding, not forced (Decision-5 honesty).
- **Band rolled back** (minor-gated override) → the named S-191 input; do NOT weaken the override here.
- **Overlay ordering**: arch ring vs jamb recolor at a shared cell → last-writer-wins is deterministic;
  placements ordered ring-then-jamb so the frame wins the shared corner.
