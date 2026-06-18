# T-194-01 — STRUCTURE: file-level blueprint

The shape of the code (not the code). **One new tested src module**, **one new test file**, **one inline runner
hand**, **one additive department-map entry**. Frozen instrument (`measurements/`, `bakeoff-score.mjs`,
`compile.mjs`, program/pack/schema JSON) untouched.

## New file — `src/view/aperture-carve.mjs` (PURE, under the `src/**/*.test.mjs` glob)

The genuinely-new geometry: the carve TARGET (declared opening → widened removable cell set) and the
aperture-coherence GATE. Reuses, never re-implements: `carveOccupancy` (hollow-carve), `closureCheck`
(shell-integrity), `componentLabels` (voxel-components), the face-projection primitives.

```
import { carveOccupancy } from "./hollow-carve.mjs";
import { closureCheck } from "./shell-integrity.mjs";
import { componentLabels } from "../form/voxel-components.mjs";   // 6-connected labeler (int32 shape)
import { recessClosureGuard } from "./treatment-grammar.mjs";     // non-aperture column drop check

export const APERTURE_CARVE_SCHEMA = "aperture-carve/v1";

// Side-face dir → {u,v,w,sign} (the OPENING_AXES already in arch-frame.mjs / treatment-grammar.mjs).
const OPENING_AXES = Object.freeze({ ... });

/**
 * carveTargetCells(occ, declaredAperture, { programW, programH, sill, scale, minArchWidth=5, maxWidth=9 })
 *   → { remove:Set<string>, target:{ uLo,uHi,vLo,vHi, w*, dir }, widenedRegion:{min,max} }
 * Widen the declared slot, centred on its u-midpoint, at the single exterior wall plane (probeWallPlane idiom):
 *   T   = clamp(round(programW*scale), minArchWidth, maxWidth)
 *   uMid= midpoint of declaredAperture.cells u-span; uLo=uMid-floor(T/2), uHi=uLo+T-1
 *   vLo = sill (build y), vHi = sill + programH - 1   (the rectangular body; the arch head curves above, added
 *         later by frameArchPlacements — NOT removed here)
 *   w*  = probeWallPlane(occ, dir, jamb)              (the exterior plane along depth)
 *   remove = every (au∈[uLo,uHi], av∈[vLo,vHi], w*) that is currently occ.solid  (only remove WALL)
 * PURE; byte-stable (canonical au,av walk).
 */
export function carveTargetCells(occ, declaredAperture, opts) { ... }

/**
 * carvedVoidCoherence(afterOcc, target) → { single:boolean, continuous:boolean, components:number, gaps:[] }
 * The "is it an opening or a hole?" discriminator, over the carved void on the aperture face:
 *   • single     — the air cells in the target box form ONE 6-connected void component (componentLabels over
 *                  the inverted box; >1 ⇒ stray voids ⇒ ragged).
 *   • continuous — every u-column in [uLo,uHi] is open from vLo..vHi (no notch), and the head row is unbroken.
 * PURE.
 */
export function carvedVoidCoherence(afterOcc, target) { ... }

/**
 * apertureCoherenceGate(beforeOcc, afterOcc, declaredAperture, target, { floor, eaveY })
 *   → { ok, scope:{ok,leaked:[]}, coherent:{ok,...}, closure:{ok,...}, reason? }
 * The three conjuncts (design Decision 2):
 *   1 SCOPE    — removed = solid-in-before ∧ air-in-after; every removed key ∈ target.widenedRegion, else
 *                scope.leaked, ok=false  ("carve leaked outside declared aperture").
 *   2 COHERENT — carvedVoidCoherence(afterOcc, target).single && .continuous, else  ("ragged carve").
 *   3 CLOSURE  — closureCheck(afterOcc, {regions:[target.widenedRegion]}).closed  (no breach OUTSIDE the
 *                aperture) AND recessClosureGuard(before,after,{floor,eaveY}) with the aperture columns
 *                EXCLUDED from droppedColumns shows no non-aperture column dropped.
 * ok = scope.ok && coherent.ok && closure.ok. PURE.
 */
export function apertureCoherenceGate(beforeOcc, afterOcc, declaredAperture, target, band) { ... }
```

Private helpers: `axisLetter`, `posOf`, `probeWallPlane` (mirror `arch-frame.mjs`; small enough to duplicate —
they are not exported there), `int32ShapeOfBox` (the componentLabels adapter, mirrors shell-integrity's
`int32Shape`), `aperColumns(target)` (the `"x,z"` columns the door occupies, to exclude from the closure guard).

## Modified — `experiments/eval-alignment/picture-climb.mjs` (the metered runner, NOT in `npm test`)

1. **Imports:** add `carveTargetCells`, `apertureCoherenceGate` (aperture-carve.mjs); `carveOccupancy` is reached
   transitively but import directly for the hand; `registerProgram` (wall-generate.mjs) read-only for `scale`.
2. **New hand `carve_arch(occ)`** (inline, beside `frame_arch`, ~lines 175+):
   - load program/pack; `door = masses[0].openings.find(o => o.kind==="door" && o.head==="arch")`; none → no-op.
   - `seedRef = artifactOccupancy(SEED_ARTIFACT)`; `declared = extractApertures(seedRef)` for `door.wall`.
   - `scale` from `registerProgram(program, occ)` along the opening u-axis (fallback 1).
   - `{remove, target, widenedRegion} = carveTargetCells(occ, declared, {programW:door.w, programH:door.h,
     sill:door.sill, scale})`.
   - `carved = carveOccupancy(occ, remove)`; `wideAp = extractApertures(carved)` for `door.wall`.
   - `dressed = occupancyFromCells([...occToCells(carved), ...frameArchPlacements(carved,[wideAp],{frameBlock})
     .placements])` (frame + now-buildable arch head).
   - `gate = apertureCoherenceGate(occ, dressed, declared, target, {floor:occ.bounds.min[1], eaveY:CFG.eaveY})`.
   - **`gate.ok`** → log per-opening + closure, return `dressed`. **else** → log refute reason, return
     `frame_arch(occ)` (recess-only fallback), record `reverted:"recess-only"`.
3. **Registry:** `TOOLS += carve_arch`; `MENU += one line` ("open + arch the DECLARED gate — best when the
   OPENING divergence is a NARROW slot where the concept shows a WIDE arched gate; widens then dresses");
   `agentPick` enum string += `carve_arch`.
4. **No change** to the loop body, gate call, `scoreBuild`, `classifyInventory` — `carve_arch` flows the
   identical OPENING path `frame_arch` already does.

## Modified — `src/workshop/climb-gate.mjs` (one additive line)

`TOOL_DEPARTMENTS` (line 31) gains `carve_arch: Object.freeze(["OPENING"])`. No logic change —
`acceptsRound`/`departmentDominant`/`classifyInventory` consume the map generically. CG1–CG17 stay green.

## New test — `src/view/aperture-carve.test.mjs` (in `npm test`)

Synthetic fixtures via `occupancyFromCells` (no GL): a solid wall slab on a face with a 1-wide slot punched
through, and the declared-aperture record for it.
- **AC1 carveTargetCells** widens the slot to T≥minWidth, centred, at the wall plane; only solid cells removed;
  `widenedRegion` contains every removed key.
- **AC2 gate PASSES a clean carve** — a centred rectangular widen + dressed jambs: `scope.ok`, `coherent.single
  && continuous`, `closure.ok` (no non-aperture column dropped). `ok:true`.
- **AC3 gate FAILS a ragged carve** — punch two disjoint voids (stray hole beside the opening): `coherent.single
  === false` → `ok:false`, reason "ragged carve".
- **AC4 gate FAILS a scope leak** — remove a cell on a NON-aperture wall (outside `widenedRegion`):
  `scope.leaked` non-empty → `ok:false` "carve leaked outside declared aperture".
- **AC5 closure-except-aperture** — the aperture columns ARE expected to drop (not flagged); a *non*-aperture
  column dropped IS flagged. Assert `recessClosureGuard`-with-aperture-excluded distinguishes the two.
- **AC6 PURE/byte-stable** — two runs identical removal order; carved occ re-derives identically.
- **AC7 too-narrow program width** — `programW*scale < minArchWidth` clamps UP to `minArchWidth` (so an arch is
  always buildable once we commit to carving), recorded.

## Ordering of changes (commit boundaries)
1. `src/view/aperture-carve.mjs` + `src/view/aperture-carve.test.mjs` — TDD, `npm test` green. (the gate first)
2. `src/workshop/climb-gate.mjs` `TOOL_DEPARTMENTS += carve_arch` — additive, CG-tests green.
3. `experiments/eval-alignment/picture-climb.mjs` — `carve_arch` hand + MENU/enum/import wiring; `GUARD_ONLY=1`
   proves the wiring/render seam with zero spend.
4. (evidence) metered climb (or scoped `carve_arch`-only render) → `docs/active/work/T-194-01/`: beside render
   of the wide arched gate, `closureOf`/gate report, trajectory.

## Boundaries / invariants
- **Frozen instrument: no edit.** `measurements/`, `bakeoff-score.mjs`, `compile.mjs`, program/pack/schema —
  READ only. Roles/blocks READ via `roleBlock`, never written.
- **Brush-door:** shaped vocab only via `archConstruct` (already how `arch-frame.mjs` reaches `archRing`);
  `aperture-carve.mjs` imports no registry brush — it composes carve + closure + components.
- **The narrowing is scoped in code:** carving happens ONLY inside `carve_arch`, ONLY on a `head:"arch"` declared
  door, ONLY within `target.widenedRegion`; the blanket no-air-op continue (`arch-frame.mjs:92`) and
  `recessClosureGuard` for every other pass are UNCHANGED. `carve_arch` self-reverts to recess-only on any gate
  failure — a leaky carve is never returned.
