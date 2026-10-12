// Helpers from plan.md VOCABULARY (h1 share): the brick course, the door pair, the brace, the shutter pair, the chimney
// stack, the candle rack, the street rows and the candle vat. Each takes its position (and facing) as arguments and
// returns the cells it wrote as [x, y, z]. Writes go only into air (g.isAir) unless opts.overwrite is true; a refused
// cell is skipped, not thrown. Nothing is written outside a helper's own footprint, so no ground, sand or floor under
// it is touched. Facings take n|s|e|w or the full names. Stair `facing` is the side of the full-height back (build.mjs).
import { B, DIRS, OPPOSITE } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LONG = { n: "north", s: "south", e: "east", w: "west" };
const HORIZONTAL = ["north", "south", "east", "west"];

function dirName(d) {
  const f = LONG[d] ?? d;
  if (!HORIZONTAL.includes(f)) throw new Error(`bad horizontal facing: ${d}`);
  return f;
}

// A cell writer: air-only unless opts.overwrite, collects the cells it wrote.
function writer(g, opts = {}) {
  const cells = [];
  const set = (x, y, z, ...rest) => {
    if (!opts.overwrite && !g.isAir(x, y, z)) return false;
    g.set(x, y, z, ...rest);
    cells.push([x, y, z]);
    return true;
  };
  return { set, cells };
}

// Deterministic per-cell roll in [0, 1): the same call always places the same moss and gravel, so a rebuild is identical.
function roll(x, y, z, salt = 0) {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 2147483647) ^ Math.imul(salt, 1442695041);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return (h >>> 0) / 4294967296;
}

// A row of bricks along x at fixed z (x0..x1, at y). mossRate omitted: a plain `bricks` course. A number: the plinth
// variant, `stone_bricks` with `mossy_stone_bricks` at that rate (plan: 1/8), three times as likely at the two ends.
export function brickCourse(g, x0, x1, y, z, mossRate = null, opts = {}) {
  const w = writer(g, opts);
  const a = Math.min(x0, x1), b = Math.max(x0, x1);
  for (let x = a; x <= b; x++) {
    if (mossRate === null || mossRate === undefined) {
      w.set(x, y, z, "bricks");
      continue;
    }
    const end = x === a || x === b;
    const rate = Math.min(1, end ? mossRate * 3 : mossRate);
    w.set(x, y, z, roll(x, y, z) < rate ? "mossy_stone_bricks" : "stone_bricks");
  }
  return w.cells;
}

// Two door halves (lower at y, upper at y+1), same facing and hinge, both written or neither. The step sits outside the
// door at ground level y-1 with its full back toward the door. `block` is the door's wood: "dark_oak" or "spruce".
export function doorPair(g, x, y, z, facing, hinge = "left", block = "dark_oak", opts = {}) {
  const f = dirName(facing);
  if (hinge !== "left" && hinge !== "right") throw new Error(`bad hinge: ${hinge}`);
  const [dx, , dz] = DIRS[f];
  const w = writer(g, opts);
  if (!opts.overwrite && (!g.isAir(x, y, z) || !g.isAir(x, y + 1, z))) return [];
  w.set(x, y, z, ...B.door(block, f, "lower", hinge));
  w.set(x, y + 1, z, ...B.door(block, f, "upper", hinge));
  w.set(x + dx, y - 1, z + dz, ...B.stairs("stone_brick", OPPOSITE[f], "bottom"));
  return w.cells;
}

// One brace of upside-down dark_oak stairs (half top, full back toward the corner post) rising toward that post at
// `dir` (w or e). Three stairs: the foot at (x, y0, z), then two stacked one column nearer the post, so it fits a two-wide side bay.
export function braceStair(g, x, y0, z, dir, opts = {}) {
  const f = dirName(dir);
  const step = f === "west" ? -1 : f === "east" ? 1 : null;
  if (step === null) throw new Error(`braceStair: dir must be w or e, got ${dir}`);
  const w = writer(g, opts);
  w.set(x, y0, z, ...B.stairs("dark_oak", f, "top"));
  w.set(x + step, y0 + 1, z, ...B.stairs("dark_oak", f, "top"));
  w.set(x + step, y0 + 2, z, ...B.stairs("dark_oak", f, "top"));
  return w.cells;
}

// Two open spruce trapdoors either side of a window, flat to the wall. (x, y, z) is the window's first cell; the wall
// runs across facing (east/west: along z; north/south: along x). opts.width is the window's width (default 2).
export function shutterPair(g, x, y, z, facing, opts = {}) {
  const f = dirName(facing);
  const width = opts.width ?? 2;
  const across = f === "east" || f === "west";
  const [a, b] = across ? [[x, y, z - 1], [x, y, z + width]] : [[x - 1, y, z], [x + width, y, z]];
  const w = writer(g, opts);
  for (const [sx, sy, sz] of [a, b]) w.set(sx, sy, sz, ...B.trapdoor("spruce", f, "bottom", true));
  return w.cells;
}

// A 2x2 brick chimney from y=base (default 1) to yTop, with a deepslate_bricks band at bandY and a brick_slab cap at
// yTop+1 on three cells. The fourth cell (corner: [x, z], default the south-east cell) carries a lit campfire over
// its brick, or over a hay_block when opts.hay is set (the rendering fire's plume).
export function chimneyStack(g, x, z, yTop, bandY, opts = {}) {
  const base = opts.base ?? 1;
  const [cx, cz] = opts.corner ?? [x + 1, z + 1];
  const w = writer(g, opts);
  for (let y = base; y <= yTop; y++)
    for (let xx = x; xx <= x + 1; xx++)
      for (let zz = z; zz <= z + 1; zz++) {
        const corner = xx === cx && zz === cz;
        let block = "bricks";
        if (y === bandY) block = "deepslate_bricks";
        else if (y === yTop && corner && opts.hay) block = "hay_block";
        w.set(xx, y, zz, ...B.block(block));
      }
  for (let xx = x; xx <= x + 1; xx++)
    for (let zz = z; zz <= z + 1; zz++) {
      if (xx === cx && zz === cz) w.set(xx, yTop + 1, zz, "campfire", { facing: "north", lit: "true" });
      else w.set(xx, yTop + 1, zz, ...B.slab("brick", "top"));
    }
  return w.cells;
}

// A candle rack at (x, y, z): dark_oak fence uprights at z and z+2, a flat (closed) dark_oak trapdoor shelf at z+1 on
// top of cell y, and a white_candle cluster standing on the shelf. opts.candles is the cluster size (default 3).
export function candleRack(g, x, y, z, opts = {}) {
  const w = writer(g, opts);
  const none = { north: "false", east: "false", south: "false", west: "false" };
  w.set(x, y, z, "dark_oak_fence", none);
  w.set(x, y, z + 2, "dark_oak_fence", none);
  w.set(x, y, z + 1, ...B.trapdoor("dark_oak", "north", "top", false));
  w.set(x, y + 1, z + 1, "white_candle", { candles: String(opts.candles ?? 3), lit: "false" });
  return w.cells;
}

// The street, kerb and pavement rows for x0..x1 (default 0..25), starting at z0 (default 0): cobblestone with gravel
// patches (about 1 cell in 5) on z0..z0+3, a stone_bricks kerb at z0+4, polished_andesite on z0+5..z0+7. Ground row y=0.
export function streetRows(g, x0 = 0, x1 = 25, z0 = 0, opts = {}) {
  const y = opts.y ?? 0;
  const w = writer(g, opts);
  const a = Math.min(x0, x1), b = Math.max(x0, x1);
  for (let x = a; x <= b; x++)
    for (let z = z0; z <= z0 + 7; z++) {
      let block;
      if (z <= z0 + 3) block = roll(x, y, z, 7) < 0.2 ? "gravel" : "cobblestone";
      else if (z === z0 + 4) block = "stone_bricks";
      else block = "polished_andesite";
      w.set(x, y, z, block);
    }
  return w.cells;
}

// A brewing/dipping vat at (x, y, z): a cauldron (opts.water: water_cauldron, full) with a closed dark_oak trapdoor
// lid lying flat on the cell beside it, at opts.lid (a compass direction, default east).
export function candleVat(g, x, y, z, opts = {}) {
  const lid = dirName(opts.lid ?? "e");
  const [dx, , dz] = DIRS[lid];
  const w = writer(g, opts);
  if (opts.water) w.set(x, y, z, "water_cauldron", { level: "3" });
  else w.set(x, y, z, "cauldron");
  w.set(x + dx, y, z + dz, ...B.trapdoor("dark_oak", lid, "top", false));
  return w.cells;
}
