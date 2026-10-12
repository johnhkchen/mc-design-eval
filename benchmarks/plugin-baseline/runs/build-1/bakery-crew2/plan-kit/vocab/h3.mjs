// Vocabulary helpers (plan.md VOCABULARY 3, 7, 11, 15, 19, 23, 27, 31, 35, 39): daubPanel, jettyBracket, counterSlab,
// flowerBox, roofMain, woodpile, smallSpruce, breadRack, peelWall, shelfWall.
// Every helper takes its own position and facing, writes only into air (a cell an earlier part built is left alone),
// and returns the [x, y, z] cells it wrote. Blocks come from plan.md's PALETTE.
import { B, DIRS, OPPOSITE, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One block, only into air. Refused writes are simply not returned.
function put(g, out, x, y, z, block, state, nbt) {
  if (!g.isAir(x, y, z)) return;
  g.set(x, y, z, block, state, nbt);
  out.push([x, y, z]);
}

const along = (axis) => {
  if (axis !== "x" && axis !== "z") throw new Error(`axis must be x or z (got ${axis})`);
  return axis;
};

/**
 * A white_wool panel. axis "x": the panel runs along x from a0 to a1 at z = fixed; axis "z": it runs along z at x = fixed.
 * Rows y0..y1. brace "left" / "right": one upside-down spruce_stairs at the bottom row of that end, its back to the post
 * beyond the panel. skip: [x, y, z] cells left open (windows).
 */
export function daubPanel(g, axis, a0, a1, y0, y1, fixed, { brace = null, skip = [] } = {}) {
  along(axis);
  const out = [], lo = Math.min(a0, a1), hi = Math.max(a0, a1);
  const at = (a, y) => (axis === "x" ? [a, y, fixed] : [fixed, y, a]);
  const open = new Set(skip.map((c) => c.join(",")));
  const low = axis === "x" ? "west" : "north", high = axis === "x" ? "east" : "south";
  for (let y = y0; y <= y1; y++) for (let a = lo; a <= hi; a++) {
    const p = at(a, y);
    if (open.has(p.join(","))) continue;
    if (y === y0 && ((brace === "left" && a === lo) || (brace === "right" && a === hi))) {
      put(g, out, ...p, ...B.stairs("spruce", brace === "left" ? low : high, "top"));
    } else put(g, out, ...p, "white_wool");
  }
  return out;
}

/** A jetty bracket: upside-down spruce_stairs at (x, y, z), its back against the wall on the `facing` side. */
export function jettyBracket(g, x, y, z, facing = "south") {
  const out = [];
  put(g, out, x, y, z, ...B.stairs("spruce", facing, "top"));
  return out;
}

/** A counter: top spruce_slabs along x0..x1 at (y, z). y defaults to 2 (plan: counter height). */
export function counterSlab(g, x0, x1, z, y = 2) {
  const out = [];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) put(g, out, x, y, z, ...B.slab("spruce", "top"));
  return out;
}

/** A flower box: top spruce_slabs at x0..x1 on row y (default 7), a pot on each cell above: tulip on even x, poppy on odd. */
export function flowerBox(g, x0, x1, z, y = 7) {
  const out = [];
  for (let x = Math.min(x0, x1); x <= Math.max(x0, x1); x++) {
    put(g, out, x, y, z, ...B.slab("spruce", "top"));
    put(g, out, x, y + 1, z, x % 2 === 0 ? "potted_red_tulip" : "potted_poppy");
  }
  return out;
}

/**
 * The main slate roof through the roof tool, laid in memory. spec is a roof.json object (preset, material, ridgeAxis,
 * front, gable, verge, keep, ...) with footprint [x0, z0, x1, z1] (or a list of those) and y = the eave course. The eaves
 * reach out past the footprint (2 cells on the shop preset). Only air is written: every built cell is protected, so keep
 * boxes and the walls stay as they are. Fascia and soffit default to spruce (the tool's default is birch, off the palette).
 */
export function roofMain(g, spec) {
  const { preset = "shop", footprint, y, ...opts } = spec;
  if (!footprint || y == null) throw new Error("roofMain: spec needs footprint and y (the eave course)");
  const rects = typeof footprint[0] === "number" ? [footprint] : footprint;
  const built = [...g].filter((c) => !g.isAir(...c.pos));
  const protect = new Set(built.map((c) => c.pos.join(",")));
  roof(g, rects, preset, { fascia: "spruce", soffit: "spruce", ...opts, y, protect, grow: false });
  const out = [];
  for (const c of g) if (!protect.has(c.pos.join(",")) && !g.isAir(...c.pos)) out.push(c.pos);
  return out;
}

/** Firewood: spruce_log rows along x at y0..y0+1 over x0..x1, z0..z1 (y0 = the bottom row, default 1, the walking surface), a bottom spruce_slab lid at y0+2. */
export function woodpile(g, x0, x1, z0, z1, y0 = 1) {
  const out = [];
  const [xa, xb] = [Math.min(x0, x1), Math.max(x0, x1)], [za, zb] = [Math.min(z0, z1), Math.max(z0, z1)];
  for (let z = za; z <= zb; z++) for (let y = y0; y <= y0 + 1; y++) for (let x = xa; x <= xb; x++) put(g, out, x, y, z, ...B.log("spruce", "x"));
  for (let z = za; z <= zb; z++) for (let x = xa; x <= xb; x++) put(g, out, x, y0 + 2, z, ...B.slab("spruce", "bottom"));
  return out;
}

/**
 * A small spruce on the walking surface y0 (default 1). h is the absolute top: trunk y0..h-2, a 3x3 ring of leaves at
 * h-4 (trunk centre left as log), a plus of leaves at h-3, a tip leaf at h-1. Leaves are persistent (as terrain.mjs).
 */
export function smallSpruce(g, x, z, h, y0 = 1) {
  if (h - 4 <= y0) throw new Error(`smallSpruce: h=${h} is too low for a trunk on y=${y0}`);
  const out = [], LEAF = ["spruce_leaves", { persistent: "true", distance: "1", waterlogged: "false" }];
  for (let y = y0; y <= h - 2; y++) put(g, out, x, y, z, ...B.log("spruce", "y"));
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (dx || dz) put(g, out, x + dx, h - 4, z + dz, ...LEAF);
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) put(g, out, x + dx, h - 3, z + dz, ...LEAF);
  put(g, out, x, h - 1, z, ...LEAF);
  return out;
}

/**
 * A baker's rack: spruce_planks end columns at y..y+3 at both ends of len cells (run along axis from x or z), a top
 * spruce_slab deck at y+1 (it carries the cakes: cake needs a full top face) and bottom spruce_slabs at y+2 with a cake on
 * every other cell. Footprint: 1 deep, 4 high, len wide.
 */
export function breadRack(g, x, y, z, axis, len) {
  along(axis);
  if (len < 3) throw new Error("breadRack: len must be at least 3");
  const out = [], a0 = axis === "x" ? x : z;
  const P = (a, yy) => (axis === "x" ? [a, yy, z] : [x, yy, a]);
  for (const a of [a0, a0 + len - 1]) for (let yy = y; yy <= y + 3; yy++) put(g, out, ...P(a, yy), "spruce_planks");
  for (let i = 1; i < len - 1; i++) {
    const a = a0 + i;
    put(g, out, ...P(a, y + 1), ...B.slab("spruce", "top"));
    if (i % 2 === 1) put(g, out, ...P(a, y + 2), "cake", { bites: "0" });
    else put(g, out, ...P(a, y + 2), ...B.slab("spruce", "bottom"));
  }
  return out;
}

/**
 * Baker's tools on a wall. facing = the direction of the wall from the cell (the back of the tools). Along the wall, at the
 * row beside it: a spruce_fence post at (x, y, z) with a top spruce_slab on its head (the peel); a grindstone on the wall at
 * +1 along the wall, face wall, facing out from the wall; an open spruce_trapdoor flat on the wall at +2, one row up.
 */
export function peelWall(g, x, y, z, facing) {
  const wall = DIRS[facing];
  if (!wall) throw new Error(`peelWall: facing must be north, south, east or west (got ${facing})`);
  const lat = wall[0] !== 0 ? [0, 0, 1] : [1, 0, 0];
  const out = [];
  put(g, out, x, y, z, "spruce_fence");
  put(g, out, x, y + 1, z, ...B.slab("spruce", "top"));
  put(g, out, x + lat[0], y, z + lat[2], "grindstone", { face: "wall", facing: OPPOSITE[facing] });
  put(g, out, x + 2 * lat[0], y + 1, z + 2 * lat[2], ...B.trapdoor("spruce", facing, "top", true));
  return out;
}

/**
 * A bookshelf run of len cells from (x, y, z) along axis, h rows high against a wall. The top row is chiseled_bookshelf,
 * facing `front` (default: south for axis x, east for axis z, i.e. the room side of a wall on the north or west). A lectern
 * stands on the floor row in front of the run's first cell, facing front.
 */
export function shelfWall(g, x, y, z, axis, len, h, { front } = {}) {
  along(axis);
  const dir = front ?? (axis === "x" ? "south" : "east"), d = DIRS[dir];
  if (!d) throw new Error(`shelfWall: front must be north, south, east or west (got ${dir})`);
  const out = [], a0 = axis === "x" ? x : z;
  const P = (a, yy) => (axis === "x" ? [a, yy, z] : [x, yy, a]);
  for (let i = 0; i < len; i++) for (let r = 0; r < h; r++) {
    if (r === h - 1) put(g, out, ...P(a0 + i, y + r), "chiseled_bookshelf", { facing: dir });
    else put(g, out, ...P(a0 + i, y + r), "bookshelf");
  }
  put(g, out, x + d[0], y, z + d[2], "lectern", { facing: dir });
  return out;
}
