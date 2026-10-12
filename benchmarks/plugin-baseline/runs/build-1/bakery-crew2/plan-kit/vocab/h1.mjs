// Helpers from plan.md VOCABULARY (h1 share): beams, braces, windows, doors, lights, the oven vault, benches, ground
// blend, the trough, the table set and the stair housing. Each takes its position (and facing) as arguments and returns
// the cells it wrote as [x, y, z]. Writes go only into air (g.isAir) unless opts.overwrite is true; a refused cell is
// skipped, not thrown. Nothing is written below a helper's own footprint, so no ground, sand or floor is touched.
// Facings take n|s|e|w or the full names. Stair `facing` is the side of the full-height back (build.mjs B.stairs).
import { B, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LONG = { n: "north", s: "south", e: "east", w: "west" };
const HORIZONTAL = ["north", "south", "east", "west"];

function dirName(d) {
  const f = LONG[d] ?? d;
  if (!HORIZONTAL.includes(f)) throw new Error(`bad horizontal facing: ${d}`);
  return f;
}

function axisName(axis) {
  if (axis !== "x" && axis !== "z") throw new Error(`bad axis: ${axis}`);
  return axis;
}

// A cell writer: air-only unless opts.overwrite, collects the cells it wrote.
function writer(g, opts = {}) {
  const cells = [];
  const set = (x, y, z, block, state) => {
    if (!opts.overwrite && !g.isAir(x, y, z)) return false;
    g.set(x, y, z, block, state);
    cells.push([x, y, z]);
    return true;
  };
  return { set, cells };
}

const free = (g, opts, x, y, z) => opts.overwrite || g.isAir(x, y, z);

// Horizontal `stripped_spruce_wood` run. axis x: a0..a1 along x at z = fixed; axis z: along z at x = fixed. y is the height.
export function beamRun(g, axis, a0, a1, fixed, y, opts = {}) {
  axisName(axis);
  const w = writer(g, opts);
  for (let a = Math.min(a0, a1); a <= Math.max(a0, a1); a++) {
    const [x, z] = axis === "x" ? [a, fixed] : [fixed, a];
    w.set(x, y, z, ...B.wood("stripped_spruce", axis));
  }
  return w.cells;
}

// One upside-down spruce stair braced toward the post at `toward` (its full-height back faces that way).
export function mannBrace(g, x, y, z, toward, opts = {}) {
  const w = writer(g, opts);
  w.set(x, y, z, ...B.stairs("spruce", dirName(toward), "top"));
  return w.cells;
}

// Glass pane filling the opening x0..x1 (axis x wall at z = fixed) or z0..z1 (axis z wall at x = fixed), y0..y1.
// Panes connect along the wall axis only; nothing is set proud of the wall.
export function glazedWindow(g, axis, x0, x1, y0, y1, fixed, opts = {}) {
  axisName(axis);
  const w = writer(g, opts);
  const link = axis === "x"
    ? { north: "false", south: "false", east: "true", west: "true" }
    : { north: "true", south: "true", east: "false", west: "false" };
  for (let y = y0; y <= y1; y++)
    for (let a = Math.min(x0, x1); a <= Math.max(x0, x1); a++) {
      const [x, z] = axis === "x" ? [a, fixed] : [fixed, a];
      w.set(x, y, z, "glass_pane", { ...link });
    }
  return w.cells;
}

// Spruce door, both halves (lower at y, upper at y+1), hinge left, closed. Writes both or neither.
export function doorAt(g, x, y, z, facing, opts = {}) {
  const f = dirName(facing);
  if (!free(g, opts, x, y, z) || !free(g, opts, x, y + 1, z)) return [];
  const w = writer(g, opts);
  w.set(x, y, z, ...B.door("spruce", f, "lower", "left"));
  w.set(x, y + 1, z, ...B.door("spruce", f, "upper", "left"));
  return w.cells;
}

// Hanging lantern at (x, y, z). It hangs from the block above; if that is air but the block two up is solid, one iron
// chain is hung from it at y+1. With neither, nothing is written and [] comes back.
export function hangingLantern(g, x, y, z, opts = {}) {
  const hangs = (yy) => opts.overwrite || !g.isAir(x, yy, z);
  if (!free(g, opts, x, y, z)) return [];
  let chain = false;
  if (!hangs(y + 1)) {
    if (!hangs(y + 2) || !free(g, opts, x, y + 1, z)) return [];
    chain = true;
  }
  const w = writer(g, opts);
  if (chain) w.set(x, y + 1, z, ...B.chain("y"));
  w.set(x, y, z, ...B.lantern(true));
  return w.cells;
}

// Brick bread oven, footprint x..x+4 by z..z+3, plinth at y. Plinth y, body walls y+1..y+2 (south row and both sides;
// the north side is the wing wall, so the mouth is open there), vault y+3 (bricks, brick stairs at the edges facing out),
// brick slab y+4 over the chamber. The chamber air x+1..x+3, z..z+2 (y+1..y+2) holds a lit campfire at (x+2, y+1, z+1).
// The chimney footprint (x+2..x+3, z+1..z+2) at y+3..y+4 is left for chimneyStack. Only facing north is laid out.
export function ovenVault(g, x, y, z, facing = "north", opts = {}) {
  if (dirName(facing) !== "north") throw new Error("ovenVault: only facing north is laid out (mouth on the north side)");
  const w = writer(g, opts);
  const inChimney = (xx, yy, zz) => yy >= y + 3 && yy <= y + 4 && xx >= x + 2 && xx <= x + 3 && zz >= z + 1 && zz <= z + 2;
  for (let xx = x; xx <= x + 4; xx++) for (let zz = z; zz <= z + 3; zz++) w.set(xx, y, zz, ...B.block("cobbled_deepslate"));
  for (let yy = y + 1; yy <= y + 2; yy++) {
    for (let xx = x; xx <= x + 4; xx++) w.set(xx, yy, z + 3, ...B.block("bricks"));
    for (let zz = z; zz <= z + 2; zz++) {
      w.set(x, yy, zz, ...B.block("bricks"));
      w.set(x + 4, yy, zz, ...B.block("bricks"));
    }
  }
  w.set(x + 2, y + 1, z + 1, "campfire", { facing: "north", lit: "true" });
  for (let zz = z; zz <= z + 3; zz++) {
    w.set(x, y + 3, zz, ...B.stairs("brick", "west", "bottom"));
    w.set(x + 4, y + 3, zz, ...B.stairs("brick", "east", "bottom"));
  }
  for (let xx = x + 1; xx <= x + 3; xx++)
    for (let zz = z; zz <= z + 3; zz++) {
      if (!inChimney(xx, y + 3, zz)) w.set(xx, y + 3, zz, ...B.block("bricks"));
      if (!inChimney(xx, y + 4, zz)) w.set(xx, y + 4, zz, ...B.slab("brick", "bottom"));
    }
  return w.cells;
}

// Bench of spruce stairs (bottom half) along x0..x1 at (y, z). `facing` is the way the sitter looks; the stairs' back
// (facing) is the opposite side, so the seat faces that way.
export function benchRun(g, x0, x1, z, y, facing = "north", opts = {}) {
  const back = OPPOSITE[dirName(facing)];
  const w = writer(g, opts);
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) w.set(x, y, z, ...B.stairs("spruce", back, "bottom"));
  return w.cells;
}

// Fill x0..x1 by z0..z1 at height y with `base`, replacing `ratio` of the cells (a deterministic hash of x,z) with `fleck`.
// This writes ground, so it may replace the lot's grass_block (or opts.replaces, a list of block names) as well as air.
export function scatterBlend(g, x0, x1, y, z0, z1, base, fleck, ratio, opts = {}) {
  const replaces = new Set(opts.replaces ?? ["grass_block"]);
  const cells = [];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++)
    for (let z = Math.min(z0, z1); z <= Math.max(z0, z1); z++) {
      const here = g.blockAt(x, y, z).replace(/^minecraft:/, "");
      if (!opts.overwrite && !g.isAir(x, y, z) && !replaces.has(here)) continue;
      g.set(x, y, z, hash01(x, z) < ratio ? fleck : base);
      cells.push([x, y, z]);
    }
  return cells;
}

function hash01(x, z) {
  let h = Math.imul(x, 374761393) ^ Math.imul(z, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Kneading trough along x: `len` empty cauldrons at (x.., y, z), a spruce stair seat on each long side (backs outward),
// and a closed spruce trapdoor (half top) as the lid over the first cell at y+1.
export function kneadingTrough(g, x, y, z, len, opts = {}) {
  if (len < 1) throw new Error("kneadingTrough: len must be at least 1");
  const w = writer(g, opts);
  for (let i = 0; i < len; i++) {
    w.set(x + i, y, z, ...B.block("cauldron"));
    w.set(x + i, y, z - 1, ...B.stairs("spruce", "north", "bottom"));
    w.set(x + i, y, z + 1, ...B.stairs("spruce", "south", "bottom"));
  }
  w.set(x, y + 1, z, ...B.trapdoor("spruce", "north", "top", false));
  return w.cells;
}

// Table at (x, y, z): a spruce fence leg, a spruce slab top at y+1, and a spruce stair seat on each side (x-1 looks east,
// x+1 looks west; the stairs' backs face outward).
export function tableSet(g, x, y, z, opts = {}) {
  const w = writer(g, opts);
  w.set(x, y, z, ...B.fence("spruce"));
  w.set(x, y + 1, z, ...B.slab("spruce", "top"));
  w.set(x - 1, y, z, ...B.stairs("spruce", "west", "bottom"));
  w.set(x + 1, y, z, ...B.stairs("spruce", "east", "bottom"));
  return w.cells;
}

// Stair housing: `steps` spruce stairs, two cells wide (x, x+1), rising north from (x, y, z) with one step per row.
// Under each step, spruce planks fill up to the step below it. The stairwell rail sits at height y+steps: along x+2 for
// the rows above the last step, and across the top at z (cells x..x+1).
export function stairHousing(g, x, y, z, steps, opts = {}) {
  const w = writer(g, opts);
  const rail = { north: "true", south: "true", east: "false", west: "false" };
  const railX = { north: "false", south: "false", east: "true", west: "true" };
  for (let i = 0; i < steps; i++)
    for (let dx = 0; dx < 2; dx++) {
      w.set(x + dx, y + i, z - i, ...B.stairs("spruce", "north", "bottom"));
      for (let j = 0; j < i; j++) w.set(x + dx, y + j, z - i, ...B.block("spruce_planks"));
    }
  for (let zz = z - steps + 1; zz <= z - 1; zz++) w.set(x + 2, y + steps, zz, "spruce_fence", { ...rail });
  for (let dx = 0; dx < 2; dx++) w.set(x + dx, y + steps, z, "spruce_fence", { ...railX });
  return w.cells;
}
