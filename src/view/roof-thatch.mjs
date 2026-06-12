// Thatch roof — the thick rounded-eave pitch (T-132-01, story S-132, epic E-32; saltcrag's
// first factory-specified gap brush). roof.gable emits a plank SHEET (one course deep, hard
// eave edge); thatch's identity is MASS — a pitched slab ≥ `thickness` voxels deep measured
// normal to the pitch, an eave that overshoots the wall plane and rounds underneath instead
// of ending in a square soffit, and a rolled ridge course (or a bought ridge block where the
// story affords one). Turf reuses the same shape at the steep minimum via the field block.
//
// Full-cube emission only (hay/moss have no stair family); the underside is open by
// construction — cells exist solely in the slab between the pitch surface and `thickness`
// below it, never filling the loft. PURE — no GL/IO/Date/random; byte-stable cell order.

const isInt = (n) => Number.isInteger(n);
const isBlockId = (b) => typeof b === "string" && b.length > 0;

function fail(msg) { throw new Error(`roofThatchConstruct: ${msg}`); }

/** The steep minimum (the draft's gate): thatch sheds water by pitch; below 1 it rots flat. */
export const THATCH_MIN_PITCH = 1;

/**
 * THATCH ROOF — gable mass along `ridgeAxis` with rounded overshooting eaves.
 * @param {{footprint:{x0:number,x1:number,z0:number,z1:number}, ridgeAxis:"x"|"z",
 *          eaveY:number, pitch?:number, block:string, thickness?:number,
 *          ridgeRoll?:boolean, ridgeBlock?:string|null, eaveOvershoot?:number}} spec
 * @returns {{cells:{pos:number[],block:string}[], counts:{field:number,ridge:number},
 *            ridgeY:number, depth:number}}
 */
export function roofThatchConstruct(spec) {
  const {
    footprint, ridgeAxis, eaveY, pitch = THATCH_MIN_PITCH, block,
    thickness = 2, ridgeRoll = true, ridgeBlock = null, eaveOvershoot = 1,
  } = spec ?? {};
  const { x0, x1, z0, z1 } = footprint ?? {};
  if (![x0, x1, z0, z1].every(isInt) || x0 > x1 || z0 > z1) fail("spec.footprint must be integer {x0≤x1, z0≤z1}");
  if (!isInt(eaveY)) fail("spec.eaveY must be an integer");
  if (ridgeAxis !== "x" && ridgeAxis !== "z") fail('spec.ridgeAxis must be "x"|"z"');
  if (!Number.isFinite(pitch) || pitch < THATCH_MIN_PITCH) fail(`spec.pitch must be ≥ ${THATCH_MIN_PITCH} (thatch is steep or it is rot)`);
  if (!isBlockId(block)) fail("spec.block must be a non-empty block id");
  if (!isInt(thickness) || thickness < 2) fail("spec.thickness must be an integer ≥ 2 (a thin thatch is a plank roof)");
  if (ridgeBlock !== null && !isBlockId(ridgeBlock)) fail("spec.ridgeBlock must be a block id or null");
  if (!isInt(eaveOvershoot) || eaveOvershoot < 1) fail("spec.eaveOvershoot must be an integer ≥ 1 (the eyebrow is the point)");

  // slope axis: the pitch runs perpendicular to the ridge
  const [s0, s1] = ridgeAxis === "z" ? [x0, x1] : [z0, z1];
  const [r0, r1] = ridgeAxis === "z" ? [z0, z1] : [x0, x1];

  // vertical depth that guarantees `thickness` measured NORMAL to the pitch plane:
  // t_normal = t_vertical · cos(atan(pitch)) ⇒ t_vertical = t · √(1 + pitch²)
  const depth = Math.ceil(thickness * Math.sqrt(1 + pitch * pitch));

  // surface height per slope column: rises from both extended eaves toward the middle
  const lo = s0 - eaveOvershoot;
  const hi = s1 + eaveOvershoot;
  const surf = (s) => {
    const inward = Math.min(s - s0, s1 - s); // negative on overshoot columns
    return eaveY + Math.round(pitch * inward);
  };
  let ridgeY = -Infinity;
  for (let s = s0; s <= s1; s++) ridgeY = Math.max(ridgeY, surf(s));

  const cells = [];
  const counts = { field: 0, ridge: 0 };
  for (let s = lo; s <= hi; s++) {
    const top = surf(s);
    // the eave tip keeps only the upper half of the mass — the rounded eyebrow underside
    const colDepth = (s === lo || s === hi) ? Math.ceil(depth / 2) : depth;
    for (let r = r0; r <= r1; r++) {
      const [x, z] = ridgeAxis === "z" ? [s, r] : [r, s];
      for (let y = top; y > top - colDepth; y--) {
        cells.push({ pos: [x, y, z], block });
        counts.field++;
      }
      if (ridgeRoll && top === ridgeY) {
        cells.push({ pos: [x, ridgeY + 1, z], block: ridgeBlock ?? block });
        counts.ridge++;
      }
    }
  }
  return { cells, counts, ridgeY: ridgeRoll ? ridgeY + 1 : ridgeY, depth };
}
