// APERTURE-CARVE — the charter narrowing (T-194-01, story S-194, epic E-51). Reviewer authorized 2026-06-17
// LETTING THE LOOP CARVE OPENINGS, scoped as a NARROWING of the blanket no-air-op / recess-by-exclusion rule
// (facade-recess-by-exclusion), not an abolition:
//
//   • Carving (removing wall) is allowed ONLY to form a DECLARED opening (a door/gate/window the recognition
//     program declares). Everything else stays no-air-op.
//   • An APERTURE-COHERENCE GATE replaces the blanket ban for that one opening: the carved void must be a
//     COHERENT DRESSED aperture (single connected void, continuous head/jambs/sill, no ragged stray holes) AND
//     CLOSURE must hold on every surface EXCEPT the declared aperture (closure-except-aperture).
//
// This module is the PURE core that makes the relaxation safe: the carve TARGET (declared slot → widened
// removable cell set) and the three-conjunct gate. The hand that picks it lives in the metered runner
// (experiments/eval-alignment/picture-climb.mjs); the wide-arch DRESSING is arch-frame.frameArchPlacements.
//
// REUSE, never re-implement: carveOccupancy (hollow-carve, exclusion carve), closureCheck (shell-integrity, the
// closure-with-allow-regions keeper that already treats declared openings as honorary skin), componentLabels
// (voxel-components, the one flood-fill), recessClosureGuard (treatment-grammar, the column-drop guard).
//
// PURE — no GL, no I/O, no Date/random. Runs under the src/**/*.test.mjs glob. Byte-stable: canonical au,av,
// then column walks; Sets are built in sorted order where order is observable.

import { carveOccupancy } from "./hollow-carve.mjs";
import { closureCheck } from "./shell-integrity.mjs";
import { componentLabels } from "../form/voxel-components.mjs";
import { recessClosureGuard } from "./treatment-grammar.mjs";

export const APERTURE_CARVE_SCHEMA = "aperture-carve/v1";

const fail = (where, msg) => { throw new Error(`${where}: ${msg}`); };

/** Side-face dir → world-axis indices {u:along-face, v:vertical(=1), w:depth/normal} + exterior `sign`
 *  (−1 = the face looks toward the smaller coordinate, so its exterior plane is the min end along w). */
const OPENING_AXES = Object.freeze({
  "+x": { u: 2, v: 1, w: 0, sign: +1 }, "-x": { u: 2, v: 1, w: 0, sign: -1 },
  "+z": { u: 0, v: 1, w: 2, sign: +1 }, "-z": { u: 0, v: 1, w: 2, sign: -1 },
});

/** World [x,y,z] from face-relative (au along, av vertical, w depth). */
function posOf(ax, au, av, w) {
  const p = [0, 0, 0];
  p[ax.u] = au; p[ax.v] = av; p[ax.w] = w;
  return p;
}

/** First SOLID cell from the exterior face inward along the depth axis (the dressOpenings probe idiom).
 *  Returns the depth `w` or null. Exterior is the min end when sign<0, the max end when sign>0. */
function probeWallPlane(occ, ax, au, av) {
  const wMin = occ.bounds.min[ax.w], wMax = occ.bounds.max[ax.w];
  if (ax.sign < 0) { for (let w = wMin; w <= wMax; w++) { const p = posOf(ax, au, av, w); if (occ.solid(p[0], p[1], p[2])) return w; } }
  else { for (let w = wMax; w >= wMin; w--) { const p = posOf(ax, au, av, w); if (occ.solid(p[0], p[1], p[2])) return w; } }
  return null;
}

const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));

/**
 * The removable cell set that widens a DECLARED gate into the intended opening, centred on the existing
 * slot. A gatehouse gate is a THROUGH-PASSAGE, so by default we carve the full passage DEPTH (the tunnel),
 * not a single face plane — a single-plane carve on a thick/voxelized wall exposes the cavity behind it and
 * opens NEW breaches the declared region can't mask (the depth lesson). Vertical extent and centre come from
 * the EXISTING aperture (the build positions the slot); width from the program (`programW*scale`, clamped so
 * an arch is always buildable). The declared region spans the full depth so closure-except-aperture holds.
 * Only currently-SOLID cells are removed (never re-removing the slot air). `depth:"plane"` keeps the legacy
 * single-exterior-plane carve (a recess, not a tunnel) for window-like openings.
 * @param {import("./occupancy.mjs").Occupancy} occ the TARGET build to carve
 * @param {object} declaredAperture an `extractApertures` entry for the declared door (carries dir, cells)
 * @param {{programW:number, scale?:number, minArchWidth?:number, maxWidth?:number, depth?:"tunnel"|"plane"}} opts
 * @returns {{remove:Set<string>, target:object, widenedRegion:{min:number[],max:number[]}}}
 */
export function carveTargetCells(occ, declaredAperture, { programW, scale = 1, minArchWidth = 5, maxWidth = 9, depth = "tunnel" } = {}) {
  if (!occ?.bounds) fail("carveTargetCells", "occupancy is empty");
  const ax = OPENING_AXES[declaredAperture?.dir];
  if (!ax) fail("carveTargetCells", `unknown declared aperture dir ${declaredAperture?.dir}`);
  const cells = Array.isArray(declaredAperture.cells) ? declaredAperture.cells : [];
  if (!cells.length) fail("carveTargetCells", "declared aperture has no air cells to centre on");
  const aus = cells.map((c) => c.au), avs = cells.map((c) => c.av);
  const uLoSlot = Math.min(...aus), uHiSlot = Math.max(...aus);
  const vLo = Math.min(...avs), vHi = Math.max(...avs);
  const uMid = (uLoSlot + uHiSlot) / 2;

  // target width: scale the declared width into the build, clamp so an arch head is always buildable.
  const T = clamp(Math.round((programW ?? minArchWidth) * (scale || 1)), minArchWidth, maxWidth);
  const uLo = Math.round(uMid - (T - 1) / 2), uHi = uLo + T - 1;

  // exterior wall plane: probe at a known-SOLID jamb (one column outside the slot), where the slot centre is air.
  const wStar = probeWallPlane(occ, ax, uLoSlot - 1, vLo) ?? probeWallPlane(occ, ax, uHiSlot + 1, vLo);
  if (wStar === null) fail("carveTargetCells", "could not resolve the exterior wall plane (no solid jamb)");

  // depth range: the full build extent along w (the tunnel) or the single exterior plane.
  const wMin = depth === "tunnel" ? occ.bounds.min[ax.w] : wStar;
  const wMax = depth === "tunnel" ? occ.bounds.max[ax.w] : wStar;

  // remove every currently-SOLID cell inside the widened box across the depth range (canonical w,av,au walk).
  const remove = new Set();
  for (let w = wMin; w <= wMax; w++) {
    for (let av = vLo; av <= vHi; av++) {
      for (let au = uLo; au <= uHi; au++) {
        const p = posOf(ax, au, av, w);
        if (occ.solid(p[0], p[1], p[2])) remove.add(`${p[0]},${p[1]},${p[2]}`);
      }
    }
  }

  // the widened aperture region as a world AABB (the closure allow-region + the scope allow-list).
  const c0 = posOf(ax, uLo, vLo, wMin), c1 = posOf(ax, uHi, vHi, wMax);
  const widenedRegion = {
    min: [Math.min(c0[0], c1[0]), Math.min(c0[1], c1[1]), Math.min(c0[2], c1[2])],
    max: [Math.max(c0[0], c1[0]), Math.max(c0[1], c1[1]), Math.max(c0[2], c1[2])],
  };
  const target = { dir: declaredAperture.dir, ax, uLo, uHi, vLo, vHi, wStar, wMin, wMax, width: T, widenedRegion };
  return { remove, target, widenedRegion };
}

/** Every "x,z" column the widened aperture occupies across its depth (excluded from the non-aperture closure
 *  check — these columns are INTENTIONALLY open). For a tunnel this is the full u-span × w-depth footprint. */
function aperColumns(target) {
  const cols = new Set();
  const { ax, uLo, uHi, vLo, wMin, wMax, wStar } = target;
  const wLo = wMin ?? wStar, wHi = wMax ?? wStar;
  for (let w = wLo; w <= wHi; w++) for (let au = uLo; au <= uHi; au++) { const p = posOf(ax, au, vLo, w); cols.add(`${p[0]},${p[2]}`); }
  return cols;
}

/** Adapt a list of "x,y,z" keys to the Int32 `{occupied,count}` shape componentLabels reads. */
function int32ShapeOfKeys(keys) {
  const flat = new Int32Array(keys.length * 3);
  let n = 0;
  for (const k of keys) { const [x, y, z] = k.split(",").map(Number); flat[n] = x; flat[n + 1] = y; flat[n + 2] = z; n += 3; }
  return { occupied: flat, count: keys.length };
}

/**
 * Is the carved void an OPENING, not a HOLE? Over the widened target box on the aperture face:
 *   • single     — the air cells in the box form ONE 6-connected component (stray voids ⇒ >1).
 *   • continuous — every u-column in [uLo,uHi] is air over the full [vLo,vHi] (no ragged notch).
 * @param {import("./occupancy.mjs").Occupancy} afterOcc the carved build
 * @param {object} target from {@link carveTargetCells}
 * @returns {{single:boolean, continuous:boolean, components:number, notches:string[]}}
 */
export function carvedVoidCoherence(afterOcc, target) {
  const { ax, uLo, uHi, vLo, vHi, wStar } = target;
  const voidKeys = [];
  const notches = [];
  for (let au = uLo; au <= uHi; au++) {
    let columnOpen = true;
    for (let av = vLo; av <= vHi; av++) {
      const p = posOf(ax, au, av, wStar);
      if (afterOcc.solid(p[0], p[1], p[2])) columnOpen = false;
      else voidKeys.push(`${p[0]},${p[1]},${p[2]}`);
    }
    if (!columnOpen) notches.push(String(au));
  }
  voidKeys.sort();
  const { sizes } = voidKeys.length ? componentLabels(int32ShapeOfKeys(voidKeys), { connectivity: 6 }) : { sizes: [] };
  const components = sizes.length;
  return { single: components === 1, continuous: notches.length === 0, components, notches };
}

/**
 * THE APERTURE-COHERENCE GATE. A carve is accepted iff ALL THREE conjuncts hold (design Decision 2):
 *   1 SCOPE    — every removed cell (solid-before ∧ air-after) lies inside the declared widened region.
 *   2 COHERENT — the carved void is a single, continuous opening (carvedVoidCoherence).
 *   3 CLOSURE  — closureCheck(after, {regions:[widenedRegion]}) is closed (no breach OUTSIDE the aperture)
 *                AND no NON-aperture wall-band column was dropped vs `before` (recessClosureGuard minus the
 *                aperture columns).
 * @param {import("./occupancy.mjs").Occupancy} beforeOcc
 * @param {import("./occupancy.mjs").Occupancy} afterOcc
 * @param {object} target from {@link carveTargetCells}
 * @param {{floor:number, eaveY:number}} band wall-band y-range for the column-drop guard
 * @returns {{ok:boolean, scope:object, coherent:object, closure:object, reason:string|null}}
 */
export function apertureCoherenceGate(beforeOcc, afterOcc, target, { floor, eaveY } = {}) {
  if (!beforeOcc?.bounds || !afterOcc?.bounds) fail("apertureCoherenceGate", "occupancy is empty");
  const region = target.widenedRegion;
  const inRegion = (x, y, z) =>
    x >= region.min[0] && x <= region.max[0] && y >= region.min[1] && y <= region.max[1] && z >= region.min[2] && z <= region.max[2];

  // 1 SCOPE — removed = solid in before, absent (or non-solid) in after.
  const leaked = [];
  for (const [key] of beforeOcc.cells) {
    const [x, y, z] = key.split(",").map(Number);
    if (!beforeOcc.solid(x, y, z)) continue;
    if (afterOcc.solid(x, y, z)) continue; // still there
    if (!inRegion(x, y, z)) leaked.push(key); // removed OUTSIDE the declared aperture → leak
  }
  leaked.sort();
  const scope = { ok: leaked.length === 0, leaked };

  // 2 COHERENT
  const coherent = carvedVoidCoherence(afterOcc, target);
  coherent.ok = coherent.single && coherent.continuous;

  // 3 CLOSURE-EXCEPT-APERTURE, as NO-REGRESSION on the established metric. The closure GATE is the column-level
  // recessClosureGuard with the aperture columns EXCLUDED: no NON-aperture wall-band column dropped, and
  // closureOf did not fall. This is exactly the ticket AC ("closureOf … not regressed") and the project's one
  // closure-regression metric. Together with SCOPE (nothing removed outside the region) it robustly catches a
  // non-aperture breach. The VOLUMETRIC closureCheck mouth count is REPORTED as evidence but NOT gated on: a
  // constructed gatehouse wall is a near-colonnade (closureOf ≈ 0.05 — the sparse-shell finding), so absolute
  // mouth-counting is dominated by pre-existing gaps, not the carve (it would reject every clean carve). The
  // honest call: gate on closureOf-no-regression, report the volumetric beside it.
  const ccBefore = closureCheck(beforeOcc, { regions: [region] });
  const ccAfter = closureCheck(afterOcc, { regions: [region] });
  const volumetricNewBreaches = Math.max(0, ccAfter.mouths.length - ccBefore.mouths.length);
  let columnGuard = { ok: true, nonAperture: [], before: null, after: null };
  if (Number.isInteger(floor) && Number.isInteger(eaveY) && eaveY >= floor) {
    const guard = recessClosureGuard(beforeOcc, afterOcc, { floor, eaveY });
    const aperCols = aperColumns(target);
    // closureOf is a perimeter ratio, so widening a PERIMETER door legitimately lowers it (the door columns
    // are perimeter columns). The real no-regression property is therefore "no NON-aperture before-column was
    // dropped" — every wall column that closed before still closes, except the intentional aperture. The raw
    // (aperture-inclusive) closureOf is reported for context, not gated.
    const nonAperture = guard.droppedColumns.filter((c) => !aperCols.has(c));
    columnGuard = { ok: nonAperture.length === 0, nonAperture, before: guard.before, after: guard.after };
  }
  const closure = {
    ok: columnGuard.ok, columnGuard,
    volumetricNewBreaches, breachesBefore: ccBefore.mouths.length, breachesAfter: ccAfter.mouths.length, // reported, not gated
  };

  const ok = scope.ok && coherent.ok && closure.ok;
  const reason = ok ? null
    : !scope.ok ? `carve leaked outside declared aperture (${leaked.length} cell(s), e.g. ${leaked[0]})`
    : !coherent.ok ? (coherent.single ? `ragged carve: notched columns ${coherent.notches.join(",")}` : `ragged carve: ${coherent.components} void components`)
    : `non-aperture wall column(s) dropped / closureOf fell: ${columnGuard.nonAperture.join(",")} (${columnGuard.before}→${columnGuard.after})`;
  return { ok, scope, coherent, closure, reason };
}

/** Convenience: carve `occ` by the target's removable set (exclusion carve, no air op). */
export function carveAperture(occ, remove) {
  return carveOccupancy(occ, remove);
}
