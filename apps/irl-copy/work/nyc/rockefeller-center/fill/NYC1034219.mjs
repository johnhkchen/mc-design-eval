// NYC1034219: 55 West 44th Street, commercial/office, built 1904. A brick-and-stone loft in the Renaissance Revival
// manner: granite base, shopfront glass at street level, brick walls in a stone pier grid, stone belts per storey,
// a stone cornice and parapet. Each cell's lidar roof is smoothed (dropouts take the neighbours' median, then a 3x3
// median) and rounded to whole 3-block storeys; walls follow exposure, so setbacks and lower wings get their own facades.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const ID = "NYC1034219";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));   // [x, z, ground, roof]

const WALL = "bricks", STONE = "smooth_sandstone", BASE = "polished_granite", CORE = "stone";
const ROOF = "gray_concrete", PARAPET = "stone_brick_wall", AWNING = "dark_oak_planks";
const NB8 = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];
const DIRS = [[0, 1], [0, -1], [-1, 0], [1, 0]];   // front (+z, the street face), rear, west, east; front wins corners

const key = (x, z) => `${x},${z}`;
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };
const lidar = new Map(cells.map(([x, z, , r]) => [key(x, z), r]));
const inF = (x, z) => lidar.has(key(x, z));

// Lidar under 8 blocks is a dropout on a 24-30 block building: take the neighbours' median instead.
const roofAt = (x, z) => {
  const v = lidar.get(key(x, z)); if (v >= 8) return v;
  const near = NB8.map(([dx, dz]) => lidar.get(key(x + dx, z + dz))).filter((u) => u >= 8);
  return near.length ? median(near) : 24;
};
const smoothRoof = (x, z) => median([[0, 0], ...NB8].map(([dx, dz]) => (inF(x + dx, z + dz) ? roofAt(x + dx, z + dz) : null)).filter((u) => u !== null));
// Whole storeys of 3 blocks per cell: top(x, z) is the roof level, 0 outside the footprint.
const top = (x, z) => (inF(x, z) ? 3 * Math.max(1, Math.round(smoothRoof(x, z) / 3)) : 0);
const exposed = (x, z, y, [dx, dz]) => top(x + dx, z + dz) <= y;   // neighbour is air at this height
const rim = (x, z) => DIRS.some(([dx, dz]) => top(x + dx, z + dz) < top(x, z));

const glass = (dx, dz) => ({ block: "glass_pane", state: dz ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" } : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }, recess: true });

// The facade block for a cell exposed in direction d at height y. Facades run along x (front/rear) or z (sides).
function facade(x, z, y, [dx, dz]) {
  const k = Math.floor(y / 3), r = y % 3, i = dz ? x : z;
  const shop = k === 0 && dz === 1;
  const pier = dz ? i % 3 === 0 || i === 11 : i % 3 === 0;
  if (y === 0) return { block: BASE };                                          // granite plinth
  if (dz === 1 && y === 3 && i >= 3 && i <= 6) return { block: AWNING };        // entrance canopy
  if (shop && (i === 4 || i === 5)) {                                           // double entrance doors
    return { block: "dark_oak_door", state: { facing: "south", half: r === 1 ? "lower" : "upper", hinge: i === 4 ? "left" : "right", open: "false", powered: "false" }, recess: true };
  }
  if (r === 0) return { block: STONE };                                         // storey belt course
  if (pier) return { block: k === 0 ? BASE : STONE };
  if (shop || i % 3 === 1) return glass(dx, dz);                                // shopfront glass / window
  return { block: WALL };
}

const grid = new Map();   // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => grid.set(`${x},${y},${z}`, { block, state });
const recesses = [];      // [x, y, z, pocket x, pocket z, i + storey] for each window or door

for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const ex = DIRS.filter((d) => exposed(x, z, y, d));
    if (!ex.length) { put(x, y, z, y === t - 1 ? ROOF : CORE); continue; }
    const f = facade(x, z, y, ex[0]);
    put(x, y, z, f.block, f.state);
    if (f.recess) recesses.push([x, y, z, x - ex[0][0], z - ex[0][1], x + Math.floor(y / 3)]);
  }
  if (rim(x, z)) { put(x, t, z, STONE); put(x, t + 1, z, PARAPET); }   // cornice and parapet on the rim
}

// Each window or door has an air gap behind its glass (the cell inside it), walled and floored by the core.
// Some windows show a glowstone lamp at the bottom of that gap.
for (const [x, y, z, px, pz, seed] of recesses) {
  const r = y % 3;
  if (r === 0 || !grid.has(`${px},${y},${pz}`)) continue;
  if (!inF(px, pz) || y >= top(px, pz) || DIRS.some((d) => exposed(px, pz, y, d))) continue;
  if (r === 1 && grid.get(`${x},${y},${z}`).block === "glass_pane" && seed % 4 === 1) put(px, y, pz, "glowstone");
  else grid.delete(`${px},${y},${pz}`);
}

// Roof water tower: a spruce tank on the highest clear interior roof (3x3, else 2x2), with a capped top.
const clear = (x0, z0, n) => {
  const cs = [];
  for (let dx = 0; dx < n; dx++) for (let dz = 0; dz < n; dz++) {
    const x = x0 + dx, z = z0 + dz;
    if (!inF(x, z) || rim(x, z) || top(x, z) !== top(x0, z0)) return null;
    cs.push([x, z]);
  }
  return cs;
};
let tank = null;
for (const n of [3, 2]) {
  for (const [x, z] of cells.map(([x, z]) => [x, z])) {
    const cs = clear(x, z, n);
    if (cs && (!tank || top(x, z) > tank.t)) tank = { cs, t: top(x, z) };
  }
  if (tank) break;
}
if (tank) {
  for (const [x, z] of tank.cs) {
    for (let y = tank.t; y < tank.t + 3; y++) put(x, y, z, "spruce_planks");
    put(x, tank.t + 3, z, "spruce_slab", { type: "bottom", waterlogged: "false" });
  }
}

const g = new Voxels([12, 42, 10]);
for (const [k, { block, state }] of grid) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/${ID}.nbt`);
console.log(`${ID}: ${out.blocks} blocks, ${out.palette} palette entries; tallest ${Math.max(...cells.map(([x, z]) => top(x, z)))} blocks; tank ${tank ? tank.cs.length + " cells" : "none"}`);
