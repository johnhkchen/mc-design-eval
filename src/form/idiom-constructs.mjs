// Idiom gap constructs — the pure clean-construct generators the E-31 pattern book was missing
// (T-124-01, story S-124). Dormer, chimney, jetty, plinth: the named idioms the style pack's
// milestone demands that no canonical generator covered (chimneys existed only as PROTECTED
// masses in roof-swap; dormer/jetty/plinth not at all). Same charter as shaped-vocab.mjs
// (T-105-01): each generator is spec → placements — deterministic, exhaustively
// orientation-tested, block states drawn ONLY from the T-097-proven vocabulary (stairs
// {facing, half, shape:"straight"}, slabs {type}); a malformed spec THROWS (fail-loud, the
// occupancyFromCells precedent); an `unmapped` state in the render is a failure.
//
//   • dormerGable — a gabled dormer projecting from a roof plane: front gable face with a
//     window APERTURE (reported as cell keys for the dressing pass — the archRing label
//     contract, never edits), side cheeks, a 45° stair roof on both pitches, full-cube ridge.
//   • chimneyStack — a solid shaft with an optional cap: "crown" is a one-cell oversail course
//     (the overhang is what makes it read — the dome-belly lesson); "slab" is the proven
//     {type:"bottom"} half-step. `columns` feeds roof-swap's chimney protection.
//   • jettyOverhang — the jettied upper-storey lip: a bressummer beam course projected past the
//     wall line, optional joist ends beneath; returns the new upper wall line so the caller
//     raises the storey flush (geometry metadata, not an edit).
//   • plinthBand — the perimeter base band: N full-cube courses around a footprint rectangle.
//
// Subject-agnostic by construction: specs carry geometry and block ids; no block-name or
// dimension constants live here (the style pack supplies blocks; the recognized program
// supplies dimensions). PURE — no GL, no I/O, no Date/random — runs under `src/**/*.test.mjs`.

export const IDIOM_CONSTRUCTS_SCHEMA = "idiom-constructs/v1";

/** Declared parameter defaults — named in any durable record that uses them, never
 * subject-tuned (the SHAPED_DEFAULTS precedent). */
export const IDIOM_CONSTRUCT_DEFAULTS = Object.freeze({
  dormerWallHeight: 2, // cheek height under the dormer eave
  dormerAperture: Object.freeze({ w: 1, h: 2 }), // window hole punched in the gable face
  jettyOverhang: 1,    // bressummer projection past the wall line (cells)
  jettyJoistEvery: 2,  // joist-end spacing along the jettied edge
});

/** Horizontal facing direction → unit [dx, dz]; facing name reuses the proven stair state
 * vocabulary (Minecraft: +z is south). */
const DIR_VEC = Object.freeze({ "+x": [1, 0], "-x": [-1, 0], "+z": [0, 1], "-z": [0, -1] });
const DIR_FACING = Object.freeze({ "+x": "east", "-x": "west", "+z": "south", "-z": "north" });

const isInt = (n) => Number.isInteger(n);
const isIntVec3 = (v) => Array.isArray(v) && v.length === 3 && v.every(isInt);
const isBlockId = (b) => typeof b === "string" && b.length > 0;
const key = (p) => `${p[0]},${p[1]},${p[2]}`;

function fail(where, msg) { throw new Error(`${where}: ${msg}`); }

/** Direction name for a horizontal unit vector. */
function dirOf(dx, dz) {
  for (const [name, [vx, vz]] of Object.entries(DIR_VEC)) if (vx === dx && vz === dz) return name;
  /* c8 ignore next */ throw new Error(`dirOf: not a unit horizontal vector [${dx},${dz}]`);
}

/**
 * DORMER (gabled) — projects outward along `facing` from a roof plane. Local frame: depth runs
 * INWARD (−facing) from the front face; the lateral axis is the horizontal perpendicular;
 * `origin` is the front face's bottom-CENTER cell (width is odd so the center exists).
 * Gable profile rises 1 block per lateral step toward the center (the 45° stair-legal pitch).
 *
 * @param {{origin:number[], facing:"+x"|"-x"|"+z"|"-z", width:number, depth:number,
 *          wallHeight?:number, wallBlock:string, roofBlock:string, faceBlock?:string,
 *          ridgeBlock?:string, aperture?:{w:number,h:number}}} spec
 *   `width` odd ≥ 3 (lateral); `depth` ≥ 2 (front face + at least one cheek course);
 *   `roofBlock` is a stair id; `faceBlock`/`ridgeBlock` default to `wallBlock`.
 * @returns {{cells:{pos:number[],block:string,state?:object}[], aperture:string[],
 *            ridgeY:number}} aperture keys are "x,y,z" face cells OMITTED from cells — labels
 *   for the dressing pass, never edits.
 */
export function dormerGable(spec) {
  const {
    origin, facing, width, depth,
    wallHeight = IDIOM_CONSTRUCT_DEFAULTS.dormerWallHeight,
    wallBlock, roofBlock,
    faceBlock = spec?.wallBlock,
    ridgeBlock = spec?.wallBlock,
    aperture = IDIOM_CONSTRUCT_DEFAULTS.dormerAperture,
  } = spec ?? {};
  if (!isIntVec3(origin)) fail("dormerGable", "spec.origin must be an integer [x,y,z]");
  if (!DIR_VEC[facing]) fail("dormerGable", `spec.facing must be one of ${Object.keys(DIR_VEC).join("|")}`);
  if (!isInt(width) || width < 3 || width % 2 === 0) fail("dormerGable", "spec.width must be an odd integer ≥ 3");
  if (!isInt(depth) || depth < 2) fail("dormerGable", "spec.depth must be an integer ≥ 2");
  if (!isInt(wallHeight) || wallHeight < 2) fail("dormerGable", "spec.wallHeight must be an integer ≥ 2");
  for (const [name, b] of [["wallBlock", wallBlock], ["roofBlock", roofBlock], ["faceBlock", faceBlock], ["ridgeBlock", ridgeBlock]]) {
    if (!isBlockId(b)) fail("dormerGable", `spec.${name} must be a non-empty block id`);
  }
  const { w: apW, h: apH } = aperture ?? {};
  if (!isInt(apW) || !isInt(apH) || apW < 1 || apH < 1 || apW % 2 === 0) {
    fail("dormerGable", "spec.aperture must be {w: odd ≥ 1, h: ≥ 1}");
  }
  const halfW = (width - 1) / 2;
  const apHalf = (apW - 1) / 2;
  if (apHalf > halfW - 1) fail("dormerGable", "spec.aperture.w must leave a solid face column each side");
  // the hole's top row must stay under the gable profile of its OUTERMOST aperture column
  if (1 + apH - 1 > wallHeight - 1 + (halfW - apHalf)) {
    fail("dormerGable", "spec.aperture.h does not fit under the gable profile");
  }

  const [fx, fz] = DIR_VEC[facing];
  const [lx, lz] = fx !== 0 ? [0, 1] : [1, 0]; // lateral = the horizontal perpendicular
  const at = (i, k, yOff) => [ // depth i (inward), lateral k (signed from center), y offset
    origin[0] - i * fx + k * lx,
    origin[1] + yOff,
    origin[2] - i * fz + k * lz,
  ];
  const rise = (k) => halfW - Math.abs(k); // gable profile rise of lateral column k
  const isAperture = (k, yOff) => Math.abs(k) <= apHalf && yOff >= 1 && yOff <= apH;

  const cells = [];
  const apertureKeys = [];
  // front gable face (depth 0): full profile, aperture cells reported, not placed
  for (let k = -halfW; k <= halfW; k++) {
    for (let yOff = 0; yOff <= wallHeight - 1 + rise(k); yOff++) {
      const p = at(0, k, yOff);
      if (isAperture(k, yOff)) apertureKeys.push(key(p));
      else cells.push({ pos: p, block: faceBlock });
    }
  }
  // cheeks (depth 1..depth−1 at the lateral extremes)
  for (let i = 1; i < depth; i++) {
    for (const k of [-halfW, halfW]) {
      for (let yOff = 0; yOff <= wallHeight - 1; yOff++) {
        cells.push({ pos: at(i, k, yOff), block: wallBlock });
      }
    }
  }
  // stair roof, both pitches: course over lateral column k sits at wallHeight + rise(k),
  // facing uphill (toward the center) — the roof-generate facing rule
  for (let i = 0; i < depth; i++) {
    for (let k = -halfW; k <= halfW; k++) {
      if (k === 0) {
        cells.push({ pos: at(i, 0, wallHeight + halfW), block: ridgeBlock });
      } else {
        const uphill = dirOf(-Math.sign(k) * lx, -Math.sign(k) * lz);
        cells.push({
          pos: at(i, k, wallHeight + rise(k)),
          block: roofBlock,
          state: { facing: DIR_FACING[uphill], half: "bottom", shape: "straight" },
        });
      }
    }
  }
  return { cells, aperture: apertureKeys, ridgeY: origin[1] + wallHeight + halfW };
}

/**
 * CHIMNEY STACK — a solid w×d shaft with an optional cap course.
 * @param {{base:number[], footprint?:{w:number,d:number}, height:number, block:string,
 *          cap?:"crown"|"slab"|null, capBlock?:string}} spec
 *   `base` is the bottom min-corner cell; `cap:"crown"` oversails one cell on every side
 *   (full cubes of `capBlock`); `cap:"slab"` lays {type:"bottom"} half-steps over the shaft
 *   (`capBlock` should be a slab id — the spec carries it, this module never derives names).
 * @returns {{cells:{pos:number[],block:string,state?:object}[], topY:number,
 *            columns:Set<string>}} columns are "x,z" shaft keys (roof-swap protection input).
 */
export function chimneyStack(spec) {
  const { base, footprint = { w: 1, d: 1 }, height, block, cap = null, capBlock = spec?.block } = spec ?? {};
  if (!isIntVec3(base)) fail("chimneyStack", "spec.base must be an integer [x,y,z]");
  const { w, d } = footprint ?? {};
  if (!isInt(w) || !isInt(d) || w < 1 || d < 1) fail("chimneyStack", "spec.footprint must be {w≥1, d≥1}");
  if (!isInt(height) || height < 1) fail("chimneyStack", "spec.height must be an integer ≥ 1");
  if (!isBlockId(block)) fail("chimneyStack", "spec.block must be a non-empty block id");
  if (cap !== null && cap !== "crown" && cap !== "slab") fail("chimneyStack", 'spec.cap must be "crown"|"slab"|null');
  if (cap !== null && !isBlockId(capBlock)) fail("chimneyStack", "spec.capBlock must be a non-empty block id");

  const [bx, by, bz] = base;
  const cells = [];
  const columns = new Set();
  for (let yOff = 0; yOff < height; yOff++) {
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < d; j++) {
        cells.push({ pos: [bx + i, by + yOff, bz + j], block });
        if (yOff === 0) columns.add(`${bx + i},${bz + j}`);
      }
    }
  }
  let topY = by + height - 1;
  if (cap === "crown") {
    // one-cell oversail on every side — the overhang is what makes the crown read
    topY = by + height;
    for (let i = -1; i <= w; i++) {
      for (let j = -1; j <= d; j++) {
        cells.push({ pos: [bx + i, topY, bz + j], block: capBlock });
      }
    }
  } else if (cap === "slab") {
    topY = by + height;
    for (let i = 0; i < w; i++) {
      for (let j = 0; j < d; j++) {
        cells.push({ pos: [bx + i, topY, bz + j], block: capBlock, state: { type: "bottom" } });
      }
    }
  }
  return { cells, topY, columns };
}

/**
 * JETTY OVERHANG — the jettied upper-storey lip along one wall edge: a bressummer beam course
 * projected `overhang` cells past the wall line, with optional joist ends one course beneath
 * the beam's outermost line.
 * @param {{edge:{axis:"x"|"z", at:number, side:"+"|"-", range:number[]}, y:number,
 *          overhang?:number, beamBlock:string, joistBlock?:string|null, joistEvery?:number}} spec
 *   `edge.axis` is the axis the edge RUNS ALONG (`range` on that axis); `edge.at` is the wall
 *   face's perpendicular coordinate; `side` is the outward sign on the perpendicular axis.
 * @returns {{cells:{pos:number[],block:string}[], upperWallLine:{axis:"x"|"z", at:number}}}
 *   upperWallLine is the perpendicular line the raised storey builds flush to.
 */
export function jettyOverhang(spec) {
  const {
    edge, y,
    overhang = IDIOM_CONSTRUCT_DEFAULTS.jettyOverhang,
    beamBlock, joistBlock = null,
    joistEvery = IDIOM_CONSTRUCT_DEFAULTS.jettyJoistEvery,
  } = spec ?? {};
  const { axis, at, side, range } = edge ?? {};
  if (axis !== "x" && axis !== "z") fail("jettyOverhang", 'spec.edge.axis must be "x"|"z"');
  if (!isInt(at)) fail("jettyOverhang", "spec.edge.at must be an integer");
  if (side !== "+" && side !== "-") fail("jettyOverhang", 'spec.edge.side must be "+"|"-"');
  if (!Array.isArray(range) || range.length !== 2 || !range.every(isInt) || range[0] > range[1]) {
    fail("jettyOverhang", "spec.edge.range must be an integer [lo,hi] with lo ≤ hi");
  }
  if (!isInt(y)) fail("jettyOverhang", "spec.y must be an integer");
  if (!isInt(overhang) || overhang < 1) fail("jettyOverhang", "spec.overhang must be an integer ≥ 1");
  if (!isBlockId(beamBlock)) fail("jettyOverhang", "spec.beamBlock must be a non-empty block id");
  if (joistBlock !== null && !isBlockId(joistBlock)) fail("jettyOverhang", "spec.joistBlock must be a block id or null");
  if (!isInt(joistEvery) || joistEvery < 1) fail("jettyOverhang", "spec.joistEvery must be an integer ≥ 1");

  const s = side === "+" ? 1 : -1;
  const pos = (along, perp, yy) => (axis === "x" ? [along, yy, perp] : [perp, yy, along]);
  const [lo, hi] = range;
  const cells = [];
  // bressummer course: every projected line from the wall face out to the overhang line
  for (let o = 1; o <= overhang; o++) {
    for (let t = lo; t <= hi; t++) {
      cells.push({ pos: pos(t, at + s * o, y), block: beamBlock });
    }
  }
  // joist ends under the outermost beam line
  if (joistBlock !== null) {
    for (let t = lo; t <= hi; t += joistEvery) {
      cells.push({ pos: pos(t, at + s * overhang, y - 1), block: joistBlock });
    }
  }
  return { cells, upperWallLine: { axis: axis === "x" ? "z" : "x", at: at + s * overhang } };
}

/**
 * PLINTH BAND — N full-cube courses around the perimeter of a footprint rectangle (optionally
 * inset). The base band every storeyed style starts from.
 * @param {{footprint:{x0:number,x1:number,z0:number,z1:number}, y0:number, courses:number,
 *          block:string, inset?:number}} spec  footprint bounds are inclusive.
 * @returns {{cells:{pos:number[],block:string}[]}}
 */
export function plinthBand(spec) {
  const { footprint, y0, courses, block, inset = 0 } = spec ?? {};
  const { x0, x1, z0, z1 } = footprint ?? {};
  if (![x0, x1, z0, z1].every(isInt) || x0 > x1 || z0 > z1) {
    fail("plinthBand", "spec.footprint must be integer {x0≤x1, z0≤z1}");
  }
  if (!isInt(y0)) fail("plinthBand", "spec.y0 must be an integer");
  if (!isInt(courses) || courses < 1) fail("plinthBand", "spec.courses must be an integer ≥ 1");
  if (!isBlockId(block)) fail("plinthBand", "spec.block must be a non-empty block id");
  if (!isInt(inset) || inset < 0) fail("plinthBand", "spec.inset must be an integer ≥ 0");
  const xi0 = x0 + inset, xi1 = x1 - inset, zi0 = z0 + inset, zi1 = z1 - inset;
  if (xi0 > xi1 || zi0 > zi1) fail("plinthBand", "spec.inset leaves no footprint");

  const cells = [];
  for (let yOff = 0; yOff < courses; yOff++) {
    for (let x = xi0; x <= xi1; x++) {
      for (let z = zi0; z <= zi1; z++) {
        if (x === xi0 || x === xi1 || z === zi0 || z === zi1) {
          cells.push({ pos: [x, y0 + yOff, z], block });
        }
      }
    }
  }
  return { cells };
}
