// 1600 20th St NW (Dupont Circle): a 1910s-20s red-brick commercial office block, three storeys over a stone base,
// calcite string courses and cornice, a shopfront ground floor with a central door, and a flat roof behind a parapet.
// The footprint's lidar roof (6-8 blocks) is smoothed into three tiers; the wings drop a storey where the roof does.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC72395.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([14, 20, 7]);

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const inF = (x, z) => cell.has(`${x},${z}`);
const edge = (x, z) => !inF(x - 1, z) || !inF(x + 1, z) || !inF(x, z - 1) || !inF(x, z + 1);
const corner = (x, z) => (!inF(x - 1, z) || !inF(x + 1, z)) && (!inF(x, z - 1) || !inF(x, z + 1));

// lidar roof smoothed: the median of the footprint cells around it, so a lone lidar spike never stands proud of its
// neighbours, clamped to the 6 / 7 / 8 tiers
const medianH = (x, z) => {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = cell.get(`${x + dx},${z + dz}`); if (c) vals.push(c.roof);
  }
  vals.sort((a, b) => a - b);
  return Math.min(8, Math.max(6, vals[Math.floor(vals.length / 2)]));
};
// a cell stands no higher than its tallest footprint neighbour, so a lone tab never sticks up above the roofline
const tierH = (x, z) => {
  const nb = [[1, 0], [-1, 0], [0, 1], [0, -1]].filter(([dx, dz]) => inF(x + dx, z + dz)).map(([dx, dz]) => medianH(x + dx, z + dz));
  return Math.min(medianH(x, z), Math.max(6, ...nb));
};

// the block planned at each cell (before glass states are known): key "x,y,z" -> [block, state?]
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, [block, state]);

const WINDOW_LIT = (x, z) => (x + 2 * z) % 5 === 1;   // a fifth of the upper windows show a warm glow
const PIER = (x, z) => (x + z) % 3 === 0;             // limestone pilaster bay
const WINDOW = (x, z) => (x + z) % 3 === 1;           // one window bay in three; the rest is brick

for (const [key, { ground, roof }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const h = tierH(x, z), top = h - 1;
  const e = edge(x, z), k = corner(x, z);
  for (let y = 0; y < h; y++) {
    if (y < ground) { put(x, y, z, "stone_bricks"); continue; }          // foundation under the lower cells
    if (y === 0) { put(x, y, z, "stone_bricks"); continue; }             // base course
    if (y === top) { put(x, y, z, e ? "calcite" : "smooth_stone"); continue; }   // cornice / roof deck
    if (y === 3 || y === 6) {                                           // storey lines and floor slabs
      put(x, y, z, e ? "calcite" : "smooth_stone"); continue;
    }
    if (!e) continue;                                                   // interior: air behind the glass
    if (k) { put(x, y, z, "calcite"); continue; }                       // corner quoins
    if (y <= 2) {                                                       // ground floor: shopfront
      if (x === 6 && z === 0) {                                         // central entrance
        put(x, y, z, "dark_oak_door", { facing: "north", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      } else if (PIER(x, z)) put(x, y, z, "calcite");
      else put(x, y, z, "glass_pane");
    } else {                                                            // upper storey: limestone pilasters, brick, windows
      if (PIER(x, z)) put(x, y, z, "calcite");
      else if (!WINDOW(x, z)) put(x, y, z, "bricks");
      else if (WINDOW_LIT(x, z) && y === 4) put(x, y, z, "glowstone");
      else put(x, y, z, "glass_pane");
    }
  }
}

// glass panes connect to their neighbours in the wall (solid blocks or other panes), as vanilla does
const solid = (x, y, z) => { const p = plan.get(`${x},${y},${z}`); return !!p && p[0] !== "glass_pane"; };
const pane = (x, y, z) => { const p = plan.get(`${x},${y},${z}`); return !!p && p[0] === "glass_pane"; };
const joins = (x, y, z) => (solid(x, y, z) || pane(x, y, z) ? "true" : "false");
for (const [key, [block]] of plan) {
  if (block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  put(x, y, z, "glass_pane", { north: joins(x, y, z - 1), south: joins(x, y, z + 1), west: joins(x - 1, y, z), east: joins(x + 1, y, z), waterlogged: "false" });
}

for (const [key, [block, state]] of plan) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
g.save(`${DIR}/DC72395.nbt`);
console.log("saved", g.count(), "blocks");
