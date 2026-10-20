// Helpers for the north-Mall museums (plan.md VOCABULARY): pilaster, octagonDrum, pediment, grandSteps, corniceBand,
// coronaTier, reflectingPool, oakTree. Each takes its position (and facing where it has one) as arguments and returns
// a tally { placed, held }. Writes go only into air: a cell that already holds a block is left alone and counted in
// held, so no helper digs into ground, sand or a floor an earlier part owns. Pass { over: true } to write over a cell.
import { DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// ---- placement -------------------------------------------------------------------------------------------------------

const tally = () => ({ placed: 0, held: 0 });
const NAME = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };   // horizontal vector -> facing word
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

function put(g, t, x, y, z, block, state, over = false) {
  if (!over && !g.isAir(x, y, z)) { t.held++; return; }
  g.set(x, y, z, block, state);
  t.placed++;
}

// ---- pilaster: a proud column on a wall face -------------------------------------------------------------------------

/** (x, z) is the wall-face cell; the column stands one cell out toward `facing`. Base slab y0, quartz shaft y0+1..y1-1, chiseled capital y1. */
export function pilaster(g, x, y0, y1, z, facing = "south", opts = {}) {
  const t = tally(), o = !!opts.over, [fx, , fz] = DIRS[facing], px = x + fx, pz = z + fz;
  put(g, t, px, y0, pz, "quartz_slab", { type: "bottom" }, o);
  for (let y = y0 + 1; y < y1; y++) put(g, t, px, y, pz, "quartz_pillar", { axis: "y" }, o);
  put(g, t, px, y1, pz, "chiseled_quartz_block", undefined, o);
  return t;
}

// ---- octagonDrum: the rotunda drum -----------------------------------------------------------------------------------

const DRUM_CUT = 5;   // corner cut on the diagonal, in cells

/**
 * [cx, y, cz] is the centre of the bottom course; r = 9 gives the plan's 19-wide octagon (9-long flats, 5-cell cuts).
 * Walls rise `height` courses (8: y12..19). Base course smooth_quartz, body calcite, quartz_pillar at the eight corners,
 * a 1x5 window slot on each face left as air for the glazing part (the four flats centred; each diagonal at (r-2, r-3)),
 * and an upside-down quartz_stairs cornice ring one cell proud on the top course. Hollow inside.
 */
export function octagonDrum(g, [cx, y, cz], r = 9, opts = {}) {
  const t = tally(), o = !!opts.over, height = opts.height ?? 8, top = y + height - 1;
  const inside = (dx, dz) => Math.abs(dx) <= r && Math.abs(dz) <= r && Math.abs(dx) + Math.abs(dz) <= 2 * r - DRUM_CUT;
  const wall = (dx, dz) => inside(dx, dz) && SIDES.some(([a, b]) => !inside(dx + a, dz + b));
  const corner = (dx, dz) => (Math.abs(dx) === r && Math.abs(dz) === r - DRUM_CUT) || (Math.abs(dz) === r && Math.abs(dx) === r - DRUM_CUT);
  const slots = new Set([`${r},0`, `${-r},0`, `0,${r}`, `0,${-r}`]);
  for (const sx of [1, -1]) for (const sz of [1, -1]) slots.add(`${sx * (r - 2)},${sz * (r - 3)}`);
  for (let dx = -r - 1; dx <= r + 1; dx++) for (let dz = -r - 1; dz <= r + 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (wall(dx, dz)) {
      const slot = slots.has(`${dx},${dz}`);
      for (let yy = y; yy <= top; yy++) {
        if (slot && yy > y && yy <= y + height - 3) continue;
        if (corner(dx, dz)) put(g, t, x, yy, z, "quartz_pillar", { axis: "y" }, o);
        else put(g, t, x, yy, z, yy === y ? "smooth_quartz" : "calcite", undefined, o);
      }
    } else if (!inside(dx, dz)) {
      const into = SIDES.find(([a, b]) => inside(dx + a, dz + b));
      if (into) put(g, t, x, top, z, "quartz_stairs", { facing: NAME[into.join()], half: "top", shape: "straight" }, o);
    }
  }
  return t;
}

// ---- pediment: the triangular gable over the portico ------------------------------------------------------------------

/**
 * [bx, y, bz] is the bottom-centre cell of the first row, on the front plane; `facing` is the way the front looks.
 * Rows step in 2 cells a course from halfWidth (10: y17 x47..67) to the apex. Tympanum smooth_quartz; the two rakes are
 * quartz_stairs facing into the tympanum, running `proud` (1) cells out in front of the plane.
 */
export function pediment(g, [bx, y, bz], facing = "south", opts = {}) {
  const t = tally(), o = !!opts.over, hw0 = opts.halfWidth ?? 10, proud = opts.proud ?? 1;
  const [fx, , fz] = DIRS[facing];
  const [ax, az] = fz !== 0 ? [1, 0] : [0, 1];   // across the front
  for (let i = 0; i <= hw0 / 2; i++) {
    const hw = hw0 - 2 * i, yy = y + i;
    for (let a = -hw; a <= hw; a++) {
      const x0 = bx + a * ax, z0 = bz + a * az;
      if (hw > 0 && Math.abs(a) === hw) {
        const into = a < 0 ? NAME[`${ax},${az}`] : NAME[`${-ax},${-az}`];
        for (let k = 0; k <= proud; k++) put(g, t, x0 + k * fx, yy, z0 + k * fz, "quartz_stairs", { facing: into, half: "bottom", shape: "straight" }, o);
      } else put(g, t, x0, yy, z0, "smooth_quartz", undefined, o);
    }
  }
  return t;
}

// ---- grandSteps: the half-step approach ------------------------------------------------------------------------------

/**
 * Half steps down from a platform toward the Mall (plan OPENINGS; never stairs). Across x0..x1, from row z0 going
 * `facing` ('south' = +z, 'north' = -z): a bottom slab at course y, a full block at y-1, a bottom slab at y-1.
 */
export function grandSteps(g, x0, x1, z0, y, opts = {}) {
  const t = tally(), o = !!opts.over, mat = opts.material ?? "smooth_quartz", facing = opts.facing ?? "south";
  if (facing !== "south" && facing !== "north") throw new Error(`grandSteps: facing ${facing} (south or north)`);
  const s = facing === "south" ? 1 : -1;
  for (let x = x0; x <= x1; x++) {
    put(g, t, x, y, z0, `${mat}_slab`, { type: "bottom" }, o);
    put(g, t, x, y - 1, z0 + s, mat, undefined, o);
    put(g, t, x, y - 1, z0 + 2 * s, `${mat}_slab`, { type: "bottom" }, o);
  }
  return t;
}

// ---- corniceBand: the deep band over a wall --------------------------------------------------------------------------

/**
 * wall = { x0, x1, z0, z1 } is the wall face's rectangle. The band is the ring one cell out round it: at course y a
 * smooth_quartz_slab (top half, the lined underside) and at y+1 white_terracotta. The inside of the wall line stays free.
 */
export function corniceBand(g, { x0, x1, z0, z1 }, y, opts = {}) {
  const t = tally(), o = !!opts.over, block = opts.block ?? "white_terracotta", lining = opts.lining ?? "smooth_quartz_slab";
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) continue;
    put(g, t, x, y, z, lining, { type: "top" }, o);
    put(g, t, x, y + 1, z, block, undefined, o);
  }
  return t;
}

// ---- coronaTier: one bronze tier of the corona -----------------------------------------------------------------------

const CORONA_HALF = 13;   // the top tier's square is 27 cells (x 188..214, z 0..26: centre 201, 13)

/**
 * One tier at `inset` (its lattice on the square of half-size 13 - inset); [cx, cz] is the corona's centre. Lattice:
 * waxed_copper_grate sides with waxed_cut_copper corners, for `rows` courses from y. One cell inside it a brown_stained_glass
 * ring, with an ochre_froglight every 3rd cell on its top row (the amber glow). The flare lip, one cell out at inset-1,
 * is a solid waxed_cut_copper ring on the course above the lattice.
 */
export function coronaTier(g, [cx, cz], inset, y, opts = {}) {
  const t = tally(), o = !!opts.over, rows = opts.rows ?? 2, h = CORONA_HALF - inset;
  const ring = (half, fn) => {   // fn(dx, dz, n) for each perimeter cell of a square of this half-size
    let n = 0;
    for (let dx = -half; dx <= half; dx++) for (let dz = -half; dz <= half; dz++) if (Math.abs(dx) === half || Math.abs(dz) === half) fn(dx, dz, n++);
  };
  ring(h, (dx, dz) => {
    const corner = Math.abs(dx) === h && Math.abs(dz) === h;
    for (let r = 0; r < rows; r++) put(g, t, cx + dx, y + r, cz + dz, corner ? "waxed_cut_copper" : "waxed_copper_grate", undefined, o);
  });
  ring(h - 1, (dx, dz, n) => {
    for (let r = 0; r < rows; r++) {
      const frog = r === rows - 1 && n % 3 === 0;
      put(g, t, cx + dx, y + r, cz + dz, frog ? "ochre_froglight" : "brown_stained_glass", undefined, o);
    }
  });
  ring(h + 1, (dx, dz) => put(g, t, cx + dx, y + rows, cz + dz, "waxed_cut_copper", undefined, o));
  return t;
}

// ---- reflectingPool: water in a coping ---------------------------------------------------------------------------------

/**
 * Water fills x0..x1, z0..z1 at course waterY, over a basin one course lower (smooth_stone unless opts.basin), with a
 * smooth_stone coping ring one cell out round it on waterY.
 */
export function reflectingPool(g, x0, x1, z0, z1, waterY, opts = {}) {
  const t = tally(), o = !!opts.over, basin = opts.basin ?? "smooth_stone", coping = opts.coping ?? "smooth_stone";
  for (let x = x0 - 1; x <= x1 + 1; x++) for (let z = z0 - 1; z <= z1 + 1; z++) {
    if (x >= x0 && x <= x1 && z >= z0 && z <= z1) {
      put(g, t, x, waterY - 1, z, basin, undefined, o);
      put(g, t, x, waterY, z, "water", undefined, o);
    } else put(g, t, x, waterY, z, coping, undefined, o);
  }
  return t;
}

// ---- oakTree: an oak with a crown that is not a sphere ----------------------------------------------------------------

/**
 * (x, y, z) is the first trunk cell above the ground: oak_log, axis y, `height` (4 or 5) cells. Crown: two 5x5 courses
 * with the corners cut, a 3x3 course at the trunk top, and a plus-shaped cap one course above it. Every leaf persistent=true.
 */
export function oakTree(g, x, y, z, opts = {}) {
  const t = tally(), o = !!opts.over, h = opts.height ?? 4, top = y + h - 1;
  if (h !== 4 && h !== 5) throw new Error(`oakTree: height ${h} (4 or 5)`);
  for (let i = 0; i < h; i++) put(g, t, x, y + i, z, "oak_log", { axis: "y" }, o);
  const crown = (yy, keep) => {
    for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
      if (!keep(dx, dz) || (dx === 0 && dz === 0 && yy <= top)) continue;
      put(g, t, x + dx, yy, z + dz, "oak_leaves", { persistent: "true" }, o);
    }
  };
  crown(top - 2, (dx, dz) => Math.abs(dx) < 2 || Math.abs(dz) < 2);   // 5x5 without corners
  crown(top - 1, (dx, dz) => Math.abs(dx) < 2 || Math.abs(dz) < 2);
  crown(top, (dx, dz) => Math.abs(dx) < 2 && Math.abs(dz) < 2);       // 3x3
  crown(top + 1, (dx, dz) => Math.abs(dx) + Math.abs(dz) <= 1);       // plus cap
  return t;
}
