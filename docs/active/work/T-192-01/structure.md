# T-192-01 — STRUCTURE: file-level blueprint

The shape of the code (not the code). Two source files changed, one new source file, one new test file, plus
the work-dir artifacts. Frozen instrument (`measurements/`, `bakeoff-score.mjs`, the program/pack JSON)
untouched.

## New file — `src/view/arch-frame.mjs` (pure, under `src/**/*.test.mjs`)

The only genuinely new geometry: impose a voxel arch + dark-timber frame on a FLAT door opening (research §3
proved the existing voussoir path is a no-op on a flat hole).

```
import { archRing } from "../form/shaped-vocab.mjs";
import { bareBlock } from "./occupancy.mjs";   // (or treatment-grammar re-export)

export const ARCH_FRAME_SCHEMA = "arch-frame/v1";

// Side-face dir → {u (along-face axis idx), v (=1, y), w (depth/normal axis idx)} + exterior sign.
const OPENING_AXES = { "+x":{u:2,v:1,w:0,sign:+1}, "-x":{u:2,v:1,w:0,sign:-1},
                       "+z":{u:0,v:1,w:2,sign:+1}, "-z":{u:0,v:1,w:2,sign:-1} };

/**
 * frameArchPlacements(occ, apertures, { frameBlock, minWidth = 5 })
 *   → { placements:[{op:"voxel",pos,block}], perOpening:[{dir,width,kept,reason?}] }
 * For each kind:"door" aperture:
 *   - measure span [uLo,uHi], y [vLo,vHi], W = uHi-uLo+1; W < minWidth → {kept:false, reason:"too-narrow"}.
 *   - resolve exterior wall plane w* = first solid from the face along w (region span).
 *   - spec = { center:[(uLo+uHi)/2, vTop - radius + 1], radius: W/2,
 *              span:{axis, range:[uLo,uHi]}, yRange:[spring, vTop], depth:{axis, range:[w*,w*]},
 *              block: frameBlock }  (axis letters from OPENING_AXES → "x"|"z")
 *   - archRing(spec).ring  → ADD where currently air (the arch head spandrels, dark timber).
 *   - archRing(spec).jambCells that are currently SOLID wall → recolor to frameBlock (frame sides).
 * PURE; byte-stable (aperture order, then archRing's canonical walk). No GL/IO/Date/random.
 */
export function frameArchPlacements(occ, apertures, opts) { ... }
```

Helpers (private): `axisLetter(idx)` (0→"x",2→"z"); `probeWallPlane(occ, ap, ax)` (first `occ.solid` from
the exterior face along `w` within `region`); both pure. `archRing` is reused as-is (no edit to
shaped-vocab.mjs).

**Why a module, not inline:** the existing four hands are inline because they wrap tested modules; this is NEW
geometry, so it earns isolation + unit tests (the climb-gate.mjs precedent).

## Modified — `src/workshop/climb-gate.mjs` (one frozen-shape edit: the department map)

`TOOL_DEPARTMENTS` gains three entries (the override + inventory classifier read this map):
```
frame_arch:        ["OPENING"],
articulate_quoins: ["WALL"],
band_eave:         ["ROOF"],
```
No logic change — `acceptsRound`/`departmentDominant`/`classifyInventory` already consume the map generically.
**This is the only `src/workshop` change.** Existing CG1–CG16 tests stay green (the map is additive).

## Modified — `experiments/eval-alignment/picture-climb.mjs` (the metered runner, NOT in `npm test`)

1. **Imports:** add `frameArchPlacements` (arch-frame.mjs), `composeTreatment` + `composeRoofTreatment`
   (treatment-grammar.mjs), `applyArticulation` already reachable via composers.
2. **Orientation (Decision 4):** replace `CFG.ridgeAxis:"z"` with a value derived from the program:
   `const RIDGE_AXIS = loadProgram(PROGRAM_PATH)?.masses?.[0]?.roof?.ridgeAxis ?? "z";` and read
   `CFG.ridgeAxis = RIDGE_AXIS`. `apply_gable_roof`/`recolor_roof` already read `CFG.ridgeAxis` — no other
   change to them. `ridgeY` for the band hand reuses the same `eaveY + floor(perp/2)` the roof hands compute.
3. **Three new hands** (inline, beside the existing four):
   - `frame_arch(occ)` — `extractApertures(occ)` → `frameArchPlacements(occ, aps, {frameBlock:
     roleBlock(pack, openingHeadRole)})` → overlay placements via `occupancyFromCells` last-writer-wins.
   - `articulate_quoins(occ)` — `composeTreatment(occ, {field:{recess:true}, edges:{corners:{material:
     roleBlock(pack, dressingRole)}}}, {floor, eaveY:CFG.eaveY, extractApertures, dressOpenings})` → `.occ`.
   - `band_eave(occ)` — compute `ridgeY` from the roof band, `composeRoofTreatment(occ, {edge:{material:
     roleBlock(pack, roofTrimRole)}}, {ridgeAxis:CFG.ridgeAxis, eaveY:CFG.eaveY, ridgeY})` → `.occ`.
   Roles read from the program (`walls.dressing.role`, `openings[0].headRole`, `roof.trimRole`), blocks via
   `roleBlock` — no hardcoded block ids.
4. **Registry:** `TOOLS` gains the three; `MENU` gains three one-line descriptions (when-to-pick, mirroring
   the existing entries); the `agentPick` output-JSON enum string gains the three tool names.
5. **No change** to the loop body, the gate call, `scoreBuild`, `classifyInventory` wiring — the new hands
   flow through the identical `targetDepartments`/`deptItemCounts`/`acceptsRound` path already in place.

## New test — `src/view/arch-frame.test.mjs` (in `npm test`)

Synthetic fixture: a solid stone wall slab on the −x and +x faces with a flat rectangular door hole punched
through (built via `occupancyFromCells`, no GL). Cases:
- **AF1** ring cells placed in `dark_oak_log` at BOTH ±x passage corners (additive, were air).
- **AF2** the disc interior stays AIR (the arch is open, not filled) — assert the spring-row center column is
  not in placements.
- **AF3** jamb wall cells recolored to `dark_oak_log` (the frame sides).
- **AF4** a too-narrow opening (W<5) → `{kept:false, reason:"too-narrow"}`, zero ring placements (no broken
  arch).
- **AF5** PURE/byte-stable: two runs → identical placement order; closure (re-derive ring count) over the
  before/after footprint not regressed (additive ⇒ holds).
- **AF6** orientation symmetry: ±x produce mirror-image ring sets (same count).

## Ordering of changes (commit boundaries)
1. `src/view/arch-frame.mjs` + `src/view/arch-frame.test.mjs` — the new primitive, TDD, `npm test` green.
2. `src/workshop/climb-gate.mjs` `TOOL_DEPARTMENTS` += three — additive, CG tests green.
3. `experiments/eval-alignment/picture-climb.mjs` — orientation derive + three hands + MENU/enum wiring;
   `GUARD_ONLY=1` proves the wiring/render seam with zero spend.
4. (optional, evidence) metered climb → `docs/active/work/T-192-01/trajectory.json` + beside renders.

## Boundaries / invariants
- `measurements/` and the frozen instrument: **no edit**. `bakeoff-score.mjs`, `compile.mjs`, the program and
  pack JSON: **no edit** (roles/blocks are READ, never written).
- Brush-door rule honored: quoins/banding reach `quoin`/`eave-overhang`/`surface.relief` only through
  `composeTreatment`/`composeRoofTreatment` → `applyArticulation` → `getBrush`; `arch-frame.mjs` imports only
  `archRing` (a spec→cells generator, not a registry brush — the same layer `generateRoof` lives in).
- No air op: arch ring is additive into corner air; jamb/frame is last-writer-wins recolor of existing solid;
  `recessClosureGuard`/closure check proves no hole reopened.
