// DC86687: Hotel-Large at 1400 M St NW, Washington DC 20005, as a 1.21.1 module. Downtown Washington hotel in
// the 1920s-30s commercial idiom: buff brick walls, calcite storey courses and quoins, a stone-bricks plinth, a
// shopfront lobby on the south (M St) face with a double door under a canopy, and a calcite cornice over a parapet.
// The lidar roof (median-smoothed 3x3) snaps to three tiers: 17 (lower wing), 19 (main block), 20 (central tower).
// A storey is 4 blocks: a calcite course, two rows of glass, a brick spandrel. Every column is solid from y 0 up to
// its tier, so nothing hangs; air is kept only in a one-cell gap behind each window and door, and some gaps hold a
// glowstone so the glass reads lit at dusk.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86687.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC86687.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outs = (x, z) => DIRS.filter(([dx, dz]) => !inF(x + dx, z + dz));   // outward faces of a footprint cell

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 0-1 gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Three roof tiers: 17 (lower wing), 19 (main block), 20 (central tower). A column's solid stack runs y 0..T-1.
const tier = (h) => (h <= 17 ? 17 : h <= 19 ? 19 : 20);
const tierOf = (x, z) => tier(smooth.get(key(x, z)));

// Palette
const PLINTH = "stone_bricks";
const BRICK = "bricks";
const BAND = "calcite";              // storey courses, quoins and the cornice
const GLASS = "glass_pane";
const PIER = "stone_bricks";         // window piers and shopfront mullions
const PARAPET = "stone_brick_wall";
const DOOR = "dark_oak_door";
const CANOPY = "stone_brick_slab";
const ROOF = "smooth_stone";         // the roof membrane on top of the interior
const HIDDEN = "stone";              // interior fill, never seen through glass
const LAMP = "glowstone";
const AC = "iron_block";

// Entrance: a double door on the south (+z) face at x 11..12, z 19; the canopy runs x 10..13 at y 3.
const DOOR_X = [11, 12];
const isDoor = (x, z, y) => z === 19 && DOOR_X.includes(x) && (y === 1 || y === 2);
const isCanopy = (x, z, y) => z === 19 && x >= 10 && x <= 13 && y === 3;

// The exterior skin of one shell cell (a non-corner cell has one outward face, o = [ox, oz]) at height y.
// Returns the block and state, and whether the cell is glazed (its inward neighbour is then an air gap).
function skin(x, z, y, T, o) {
  const corner = o.length >= 2;
  const [ox, oz] = o.length ? o[0] : [0, 0];
  const idx = oz !== 0 ? x : z;                       // position along the face
  if (y === 0) return { block: PLINTH };              // base course
  if (y === T - 1) return { block: PARAPET };         // parapet
  if (y === T - 2) return { block: BAND };            // cornice
  if (corner) return { block: BAND };                 // quoins
  if (isCanopy(x, z, y)) return { block: CANOPY, state: { type: "bottom", waterlogged: "false" } };
  if (y % 4 === 0) return { block: BAND };            // storey course
  if (y % 4 === 3) return { block: BRICK };           // brick spandrel
  if (isDoor(x, z, y)) {
    return {
      block: DOOR, gap: true,
      state: { facing: "north", half: y === 1 ? "lower" : "upper", hinge: x === 11 ? "left" : "right", open: "false", powered: "false" },
    };
  }
  if (y < 4) return idx % 4 === 0 ? { block: PIER } : { block: GLASS, gap: true };   // shopfront
  return idx % 3 === 0 ? { block: PIER } : { block: GLASS, gap: true };              // window grid
}

// Pass 1: the air gap behind each glazed cell, and which gaps get a glowstone.
const gap = new Set();                 // "x,y,z" cells left as air
const lamp = new Set();                // "x,y,z" gap cells that hold a glowstone
for (const c of F.values()) {
  const o = outs(c.x, c.z);
  if (!o.length) continue;
  const T = tierOf(c.x, c.z);
  const [ox, oz] = o[0];
  for (let y = 1; y < T - 2; y++) {
    const s = o.length >= 2 ? null : skin(c.x, c.z, y, T, o);
    if (!s || !s.gap) continue;
    const gx = c.x - ox, gz = c.z - oz;
    if (!inF(gx, gz)) continue;
    const k3 = `${gx},${y},${gz}`;
    gap.add(k3);
    if ((c.x + c.z) % 7 === 0 && y % 4 === 1) lamp.add(k3);
  }
}

const g = new Voxels([24, 32, 20]);

// Pass 2: fill each footprint column from y 0 to its tier.
for (const c of F.values()) {
  const { x, z } = c;
  const T = tierOf(x, z);
  const o = outs(x, z);
  for (let y = 0; y < T; y++) {
    const k3 = `${x},${y},${z}`;
    if (o.length) {
      const s = skin(x, z, y, T, o);
      g.set(x, y, z, s.block, s.state);
      continue;
    }
    if (gap.has(k3)) { if (lamp.has(k3)) g.set(x, y, z, LAMP); continue; }
    g.set(x, y, z, y === T - 1 ? ROOF : HIDDEN);
  }
}

// Roof equipment on the main roof: a few air-handler units on the interior, standing on the membrane.
for (const c of F.values()) {
  const { x, z } = c;
  if (outs(x, z).length || tierOf(x, z) !== 19) continue;
  if (x % 6 === 3 && z % 5 === 2) g.set(x, 19, z, AC);
}

const stats = g.save(OUT);
console.log(`DC86687: ${stats.blocks} blocks, palette ${stats.palette}`);
