// Mt Eden / Newton: a 1970s reinforced-concrete office and apartment block, stepped down on its west side.
// Volcanic deepslate plinth, white precast piers, light-grey spandrels, blue-tinted glazing, a black awning over the
// entrance, a parapet band on each tier, and a plant box on the main roof. The lidar roof is smoothed into three flat
// tiers (13, 21, 28 blocks: the west wing, a lower step, the main mass); the thin 34-block rim is lidar noise.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_370374256.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const foot = new Map(cells.map(([x, z, g, r]) => [key(x, z), { g, r }]));
const inF = (x, z) => foot.has(key(x, z));

// lidar roof → clean flat tiers: the median of each cell's 3x3 footprint neighbourhood, then the nearest tier
const tier = new Map();
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const rs = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) rs.push(foot.get(key(x + dx, z + dz)).r);
  rs.sort((a, b) => a - b);
  const m = rs[rs.length >> 1];
  tier.set(k, m <= 17 ? 13 : m <= 24.5 ? 21 : 28);
}
const H = (x, z) => tier.get(key(x, z));

// the outer skin: a cell with a neighbour outside the footprint, or on another tier
const ring = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inF(x + dx, z + dz) || H(x + dx, z + dz) !== H(x, z));

// the block grid, by key, so panes can be connected to their neighbours afterwards
const B = new Map();
const put = (x, y, z, block, state) => B.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => B.get(`${x},${y},${z}`);

// the entrance: a pair of doors on the south face, under a black awning
const DOOR_X = [26, 27];
const DOOR_Z = 21;

for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const h = H(x, z), out = ring(x, z);
  for (let y = 0; y < h; y++) {
    if (y === 0) { put(x, y, z, "deepslate_bricks"); continue; }                                  // base course, on the ground
    if (y % 4 === 0) { put(x, y, z, out ? "light_gray_concrete" : "smooth_stone"); continue; }   // a floor slab per storey
    if (y >= h - 3) {                                                                             // parapet band; cornice on top
      if (!out) put(x, y, z, "smooth_stone");
      else put(x, y, z, y === h - 1 ? "light_gray_concrete" : "white_concrete");
      continue;
    }
    if (!out) continue;                                                                           // air gap inside the skin
    const pier = (x + z) % 3 === 0;
    if (y < 4 && DOOR_Z === z && DOOR_X.includes(x) && y <= 2) {                                  // entrance doors
      put(x, y, z, "iron_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: x === 26 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    if (y === 3 && DOOR_Z === z && x >= 25 && x <= 27) { put(x, y, z, "black_concrete"); continue; } // awning over the doors
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    if (y % 4 === 1) { put(x, y, z, "light_gray_concrete"); continue; }                            // sill / spandrel
    put(x, y, z, y < 4 ? "glass" : "light_blue_stained_glass_pane");                              // glazing
  }
}

// plant box on the main roof, clear of the stepped tiers
for (let z = 10; z <= 13; z++) for (let x = 13; x <= 17; x++) {
  if (!inF(x, z) || H(x, z) !== 28 || ring(x, z)) continue;
  put(x, 28, z, "light_gray_concrete");
  put(x, 29, z, "light_gray_concrete");
}

// warm lights: hanging lanterns from each storey's ceiling, in some cells just inside the glass
for (const [k] of foot) {
  const [x, z] = k.split(",").map(Number);
  const h = H(x, z);
  if (ring(x, z)) continue;
  const nextToSkin = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => inF(x + dx, z + dz) && ring(x + dx, z + dz));
  if (!nextToSkin) continue;
  for (let base = 4; base + 3 < h - 3; base += 4) {
    if ((x * 7 + z * 13 + base) % 5 === 0) put(x, base + 3, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
  if ((x * 5 + z * 3) % 7 === 0) put(x, 3, z, "lantern", { hanging: "true", waterlogged: "false" });
}

// glass panes connect to whatever stands beside them in the skin, so the grid reads as one wall
const WALL = /glass|concrete|deepslate|stone|pane/;
for (const [k, b] of B) {
  if (!b.block.endsWith("glass_pane")) continue;
  const [x, y, z] = k.split(",").map(Number);
  const joins = (dx, dz) => { const n = at(x + dx, y, z + dz); return n && WALL.test(n.block); };
  B.set(k, { block: b.block, state: { east: String(joins(1, 0)), north: String(joins(0, -1)), south: String(joins(0, 1)), west: String(joins(-1, 0)), waterlogged: "false" } });
}

const g = new Voxels([32, 47, 23]);
for (const [k, { block, state }] of B) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const { blocks, palette } = g.save(`${DIR}/way_370374256.nbt`);
console.log(`way_370374256.nbt: ${blocks} blocks, ${palette} palette entries`);
