// Shaped construction vocabulary — the pure clean-construct generators (T-105-01, story S-105,
// epic E-27). Roof-as-program (S-104) is one instance of the general capability this module is:
// voxel constructs generated from named parameters, built the way a player builds — stair-block
// slopes, slab half-steps, voxel-circle arches — not sampled from a mesh. Each generator is
// spec → placements: deterministic, exhaustively orientation-tested, with block states drawn from
// the vocabulary T-097 PROVED end-to-end (AJV gate → empty `unmapped` → state-id read-back):
// stairs {facing, half, shape:"straight"}, slabs {type}. E-27 Rule 3: a reconstructed component
// is generated geometry with named parameters; an `unmapped` state in the render is a failure.
//
//   • stairRun — a straight slope segment: 4 cardinal ascents × 2 windings. "walk" is the
//     climbable course (half:"bottom", facing toward the ascent — Minecraft stairs face the
//     direction you climb); "soffit" is the mirrored underside course (half:"top", facing
//     REVERSED) for eaves and reveals. (The T-097 "stairs-invisible" residual is RETIRED as of
//     T-107-01 — the viewer's substring air-check ate every *_stairs name; lens patched. Stair
//     correctness is still proven by read-back first; pixels now agree.)
//   • slabStep — a half-block course at one level: the y+0.5 transition between full-block
//     courses; `kind` maps 1:1 onto the proven slab `type` state (bottom|top|double).
//   • archRing / flatHead — the opening-head constructs. The arch is a VOXEL CIRCLE: a cell is
//     aperture iff its center lies inside the fitted disc (below the spring center the full span
//     is aperture); ring = head-window cells outside the disc, FULL CUBES (the Minecraft-native
//     arch at witnessed spans; originally also the render-evidence choice under the stairs-
//     invisible lens — that lens is fixed as of T-107-01, the full-cube ring stands on the
//     native-arch rationale alone). `headCells`/`jambCells` are LABELS for the dressing pass
//     (T-097/E-26), not edits: head = ring cells 4-adjacent (in the wall plane) to the aperture
//     above the spring center; jambs = the flanking wall columns just outside the span, sill to
//     spring.
//
// Subject-agnostic by construction: specs carry geometry and a block id; no block-name or
// dimension constants live here. Specs are produced by the fit seam (shaped-fit.mjs) under the
// E-27 Rule 1 tolerance-or-named-fallback contract; this module trusts a well-formed spec and
// THROWS on a malformed one (fail-loud, the occupancyFromCells precedent).
//
// PURE — no GL, no I/O, no Date/random — runs under the `src/**/*.test.mjs` glob.

export const SHAPED_SCHEMA = "shaped-vocab/v1";

/** Declared op-parameter defaults for the fit seam — named in every durable record that uses
 * them (the REGULARIZE_DEFAULTS precedent), never subject-tuned. */
export const SHAPED_DEFAULTS = Object.freeze({
  rmseTol: 0.8,      // arch: max radial RMSE (cells) of the head profile vs the fitted circle
  flatRmseTol: 0.6,  // flat head: max RMSE (cells) of the profile vs the fitted level
  minArchWidth: 5,   // an aperture narrower than this has no arch to fit
  minArchRise: 2,    // a head profile rising less than this is flat, not an arch
  pitchTol: 0.25,    // stair run: |plane gradient| must be within this of 1.0 (stair-legal 1:1)
  slabPitchTol: 0.15, // slab step: |plane gradient| within this of 0.5 (half-step 1:2)
  glbRmseTol: 1.5,   // plane-fit source gate: a GLB fit worse than this falls back to voxelFit
});

/** Ascent direction → the proven stair `facing` state (Minecraft: +z is south). */
export const ASCENT_FACING = Object.freeze({ "+x": "east", "-x": "west", "+z": "south", "-z": "north" });

const ASCENT_VEC = Object.freeze({ "+x": [1, 0], "-x": [-1, 0], "+z": [0, 1], "-z": [0, -1] });
const ASCENT_OPPOSITE = Object.freeze({ "+x": "-x", "-x": "+x", "+z": "-z", "-z": "+z" });

const isInt = (n) => Number.isInteger(n);
const isIntVec3 = (v) => Array.isArray(v) && v.length === 3 && v.every(isInt);

function fail(where, msg) { throw new Error(`${where}: ${msg}`); }

/**
 * STAIR RUN — a straight slope segment: cell i sits one block along the ascent and one block up
 * from cell i−1, replicated `width` across the lateral axis (toward +lateral from the origin).
 * @param {{origin:number[], ascent:"+x"|"-x"|"+z"|"-z", steps:number, width?:number,
 *          winding?:"walk"|"soffit", block:string}} spec
 * @returns {{pos:number[], block:string, state:{facing:string, half:string, shape:"straight"}}[]}
 *   canonical order: step-major, then lateral.
 */
export function stairRun(spec) {
  const { origin, ascent, steps, width = 1, winding = "walk", block } = spec ?? {};
  if (!isIntVec3(origin)) fail("stairRun", "spec.origin must be an integer [x,y,z]");
  if (!ASCENT_VEC[ascent]) fail("stairRun", `spec.ascent must be one of ${Object.keys(ASCENT_VEC).join("|")}`);
  if (!isInt(steps) || steps < 1) fail("stairRun", "spec.steps must be an integer ≥ 1");
  if (!isInt(width) || width < 1) fail("stairRun", "spec.width must be an integer ≥ 1");
  if (winding !== "walk" && winding !== "soffit") fail("stairRun", 'spec.winding must be "walk"|"soffit"');
  if (typeof block !== "string" || !block) fail("stairRun", "spec.block must be a non-empty string");

  const [dx, dz] = ASCENT_VEC[ascent];
  const lateral = dx !== 0 ? [0, 1] : [1, 0]; // ascent on x → widen on z, and vice versa
  const facing = ASCENT_FACING[winding === "walk" ? ascent : ASCENT_OPPOSITE[ascent]];
  const half = winding === "walk" ? "bottom" : "top";
  const rows = [];
  for (let i = 0; i < steps; i++) {
    for (let w = 0; w < width; w++) {
      rows.push({
        pos: [origin[0] + i * dx + w * lateral[0], origin[1] + i, origin[2] + i * dz + w * lateral[1]],
        block,
        state: { facing, half, shape: "straight" },
      });
    }
  }
  return rows;
}

/**
 * SLAB STEP — a half-block course at one level: the y+0.5 transition between full-block courses.
 * @param {{origin:number[], axis:"x"|"z", length:number, kind:"bottom"|"top"|"double",
 *          block:string}} spec
 * @returns {{pos:number[], block:string, state:{type:string}}[]}
 */
export function slabStep(spec) {
  const { origin, axis, length, kind, block } = spec ?? {};
  if (!isIntVec3(origin)) fail("slabStep", "spec.origin must be an integer [x,y,z]");
  if (axis !== "x" && axis !== "z") fail("slabStep", 'spec.axis must be "x"|"z"');
  if (!isInt(length) || length < 1) fail("slabStep", "spec.length must be an integer ≥ 1");
  if (kind !== "bottom" && kind !== "top" && kind !== "double") fail("slabStep", 'spec.kind must be "bottom"|"top"|"double"');
  if (typeof block !== "string" || !block) fail("slabStep", "spec.block must be a non-empty string");
  const rows = [];
  for (let j = 0; j < length; j++) {
    rows.push({
      pos: [origin[0] + (axis === "x" ? j : 0), origin[1], origin[2] + (axis === "z" ? j : 0)],
      block,
      state: { type: kind },
    });
  }
  return rows;
}

// --- opening heads --------------------------------------------------------------------------

function checkHeadWindow(where, { span, yRange, depth }) {
  for (const [name, r] of [["span", span], ["depth", depth]]) {
    if (!r || (r.axis !== "x" && r.axis !== "z")) fail(where, `spec.${name}.axis must be "x"|"z"`);
    if (!Array.isArray(r.range) || r.range.length !== 2 || !r.range.every(isInt) || r.range[0] > r.range[1]) {
      fail(where, `spec.${name}.range must be an integer [lo,hi] with lo ≤ hi`);
    }
  }
  if (span.axis === depth.axis) fail(where, "spec.span.axis and spec.depth.axis must differ");
  if (!Array.isArray(yRange) || yRange.length !== 2 || !yRange.every(isInt) || yRange[0] > yRange[1]) {
    fail(where, "spec.yRange must be an integer [lo,hi] with lo ≤ hi");
  }
}

/** Walk the head window with an aperture predicate; shared by archRing and flatHead. */
function headWindow({ span, yRange, depth, block = null }, inside, { jambTopY }) {
  const posOf = span.axis === "z"
    ? (u, y, d) => [d, y, u]   // span along z, depth along x
    : (u, y, d) => [u, y, d];  // span along x, depth along z
  const key = (p) => `${p[0]},${p[1]},${p[2]}`;
  const [uLo, uHi] = span.range;
  const [yLo, yHi] = yRange;
  const aperture = [];
  const ring = [];
  const headCells = [];
  for (let y = yLo; y <= yHi; y++) {
    for (let d = depth.range[0]; d <= depth.range[1]; d++) {
      for (let u = uLo; u <= uHi; u++) {
        const p = posOf(u, y, d);
        if (inside(u, y)) { aperture.push(key(p)); continue; }
        ring.push({ pos: p, block });
        // head label: 4-adjacent (in the wall plane) to an aperture cell — the extrados course
        if (inside(u - 1, y) || inside(u + 1, y) || inside(u, y - 1) || inside(u, y + 1)) {
          headCells.push(key(p));
        }
      }
    }
  }
  // jamb label: the flanking wall columns just OUTSIDE the span, sill row of the window up to the
  // spring/level — where the dressing pass attaches frames. Labels only, never edits.
  const jambCells = [];
  for (let y = yLo; y <= Math.min(yHi, jambTopY); y++) {
    for (let d = depth.range[0]; d <= depth.range[1]; d++) {
      jambCells.push(key(posOf(uLo - 1, y, d)), key(posOf(uHi + 1, y, d)));
    }
  }
  return { aperture, ring, headCells, jambCells };
}

/**
 * ARCH RING — voxel-circle construction over an opening head. A cell is aperture iff its center
 * is inside the fitted disc (`(u−u0)² + (y−y0)² ≤ r²` for y ≥ y0; the full span below the spring
 * center); ring = window cells outside the disc, full cubes.
 * @param {{center:number[], radius:number, span:{axis:string,range:number[]},
 *          yRange:number[], depth:{axis:string,range:number[]}, block?:string|null}} spec
 *   `center` = [u0, y0] in the span axis × y plane (floats allowed — a 13-wide arch centers on
 *   a half cell); `block` may be null when the applier derives fill blocks per cell.
 * @returns {{aperture:string[], ring:{pos:number[],block:string|null}[], headCells:string[],
 *            jambCells:string[]}} cell keys are "x,y,z"; canonical y,d,u walk order.
 */
export function archRing(spec) {
  const { center, radius } = spec ?? {};
  checkHeadWindow("archRing", spec ?? {});
  if (!Array.isArray(center) || center.length !== 2 || !center.every(Number.isFinite)) {
    fail("archRing", "spec.center must be a finite [u0, y0]");
  }
  if (!Number.isFinite(radius) || radius <= 0) fail("archRing", "spec.radius must be > 0");
  const [u0, y0] = center;
  const r2 = radius * radius;
  const inside = (u, y) => (y < y0 ? true : (u - u0) * (u - u0) + (y - y0) * (y - y0) <= r2);
  return headWindow(spec, inside, { jambTopY: Math.floor(y0) });
}

/**
 * FLAT HEAD — the degenerate head construct: aperture iff y ≤ level (a squared lintel line).
 * @param {{level:number, span:object, yRange:number[], depth:object, block?:string|null}} spec
 * @returns same shape as {@link archRing}
 */
export function flatHead(spec) {
  const { level } = spec ?? {};
  checkHeadWindow("flatHead", spec ?? {});
  if (!isInt(level)) fail("flatHead", "spec.level must be an integer");
  return headWindow(spec, (_u, y) => y <= level, { jambTopY: level });
}
