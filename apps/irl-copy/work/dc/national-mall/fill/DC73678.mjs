// 1300 19th St NW: a 1980s precast-and-glass office on a stone base. Podium at 11 blocks across the south and east wings,
// tower at 13 behind it, a centred 14 penthouse set back inside the tower. Storeys are 2 blocks (a solid band and a glass
// row); the shell is one cell thick, the rest of each footprint cell is air above the floor slabs (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73678.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC73678.nbt";
const W = 25, D = 11, H = 26;

const key = (x, z) => `${x},${z}`;
const footprint = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFP = (x, z) => footprint.has(key(x, z));

// lidar roof -> clean tiers: a 3x3 mean smooths the stair-stepped noise, then snaps to podium 11 / tower 13 / penthouse 14
const tier = new Map();
for (const [k] of footprint) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = footprint.get(key(x + dx, z + dz)); if (c) { sum += c.roof; n++; } }
  const s = sum / n;
  tier.set(k, s < 12 ? 11 : s < 13.5 ? 13 : 14);
}
const tierAt = (x, z) => tier.get(key(x, z));

// a cell is shell on a face whose neighbour is outside the footprint or has no building at this row
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inFP(x + dx, z + dz) || tierAt(x + dx, z + dz) <= y);

// the palette of one storey: 0 plinth, 1 base band, 2 shopfront glass, 3 transom, then 2-block storeys with floor bands at even rows
const BANDS = new Set([1, 3, 4, 6, 8, 10, 12]);
const SOLID_INTERIOR = new Set([0, 1, 4, 6, 8, 10, 12]);
const GLASS_ROWS = new Set([2, 5, 7, 9, 11]);

const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { x, y, z, block, state });
const occupied = (x, y, z) => blocks.has(`${x},${y},${z}`);

for (const [k] of footprint) {
  const [x, z] = k.split(",").map(Number);
  const T = tierAt(x, z);
  put(x, 0, z, "stone_bricks");                                     // plinth on the lowest ground; base course on the downhill side
  for (let y = 1; y < T; y++) {
    const ex = exposed(x, z, y);
    const shell = ex.length > 0;
    if (shell && BANDS.has(y)) { put(x, y, z, y === 1 || y === 3 ? "stone_bricks" : "smooth_quartz"); continue; }
    if (!shell && SOLID_INTERIOR.has(y)) { put(x, y, z, "smooth_stone"); continue; }
    if (!shell && y === 13) { put(x, y, z, "smooth_stone"); continue; }                  // penthouse roof, solid inside
    if (!shell) continue;                                            // interior air behind the glass
    if (!(GLASS_ROWS.has(y) || y === 2 || y === 13)) continue;
    // mullions: piers on the long faces every third bay, a solid pier at each corner and the back edge
    const zFace = ex.some(([, dz]) => dz !== 0);
    const pier = zFace ? x % 3 === 0 : (z % 3 === 0 || z === 10);
    if (pier) put(x, y, z, "quartz_pillar", { axis: "y" });
    else put(x, y, z, "light_blue_stained_glass_pane");
  }
}

// entrance: a recessed double door in the front (z 0) bay between the piers at x 9 and 12, with a canopy over it
const DOOR = { facing: "north", open: "false", powered: "false" };
for (const x of [10, 11]) {
  const hinge = x === 10 ? "left" : "right";
  put(x, 1, 0, "iron_door", { ...DOOR, half: "lower", hinge });
  put(x, 2, 0, "iron_door", { ...DOOR, half: "upper", hinge });
  for (const z of [0, 1]) put(x, 3, z, "smooth_stone");
}

// warm light in some windows: glowstone on the air side of the front glass
for (const [k] of footprint) {
  const [x, z] = k.split(",").map(Number);
  if (z !== 0) continue;
  for (const y of [2, 5, 7, 9, 11]) {
    const b = blocks.get(`${x},${y},${z}`);
    if (!b || b.block !== "light_blue_stained_glass_pane") continue;
    if ((x * 7 + y * 3) % 11 !== 0) continue;
    if (inFP(x, 1) && tierAt(x, 1) > y) put(x, y, 1, "glowstone");
  }
}

// rooftop units on the tower roof, where the tier is 13 for the whole 2x2
for (const [x0, z0] of [[3, 6], [16, 6], [19, 3]]) {
  const quad = [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]];
  if (quad.every(([x, z]) => inFP(x, z) && tierAt(x, z) === 13)) for (const [x, z] of quad) put(x, 13, z, "light_gray_concrete");
}

// glass panes connect to their horizontal neighbours, as they would in the world
for (const b of blocks.values()) {
  if (b.block !== "light_blue_stained_glass_pane") continue;
  const c = (on) => (on ? "true" : "false");
  b.state = {
    north: c(occupied(b.x, b.y, b.z - 1)), south: c(occupied(b.x, b.y, b.z + 1)),
    east: c(occupied(b.x + 1, b.y, b.z)), west: c(occupied(b.x - 1, b.y, b.z)),
  };
}

const g = new Voxels([W, H, D]);
for (const b of blocks.values()) g.set(b.x, b.y, b.z, b.block, b.state);
const stats = g.save(OUT);
console.log(JSON.stringify({ cells: footprint.size, blocks: stats.blocks, palette: stats.palette }));
