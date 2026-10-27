// Rhema Broadcasting Group: a 1980s concrete-and-glass office block. Four storeys over a stone plinth at the uphill
// ground level, stepping down in tiers to a two-storey wing, with a roof plant box and a broadcast mast on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1098153395.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_1098153395.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const X = 39, Y = 34, Z = 51;
const DATUM = 4;                       // the ground floor: the highest ground under the footprint; storeys run 4 blocks up
const key = (x, z) => `${x},${z}`;
const dirs4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// 1. Tier each cell by its lidar roof, quantised to storey tops 8 / 12 / 16 / 20 (1 to 4 storeys above the datum).
const tierOf = (r) => (r < 10 ? 8 : r <= 13 ? 12 : r <= 17 ? 16 : 20);
const top = new Map();
for (const [x, z, , r] of cells) top.set(key(x, z), tierOf(r));
for (let pass = 0; pass < 2; pass++) {  // majority of the cell (weight 1.5) and its 4 neighbours: flat tiers, no lidar noise
  const next = new Map();
  for (const [k, t] of top) {
    const [x, z] = k.split(",").map(Number), votes = new Map([[t, 1.5]]);
    for (const [dx, dz] of dirs4) { const n = top.get(key(x + dx, z + dz)); if (n !== undefined) votes.set(n, (votes.get(n) || 0) + 1); }
    let best = t, bv = -1;
    for (const [v, c] of votes) if (c > bv) { best = v; bv = c; }
    next.set(k, best);
  }
  for (const [k, v] of next) top.set(k, v);
}

// The faces a voxel looks out of: outside the footprint, or over a neighbour whose tier is at or below it.
const openSides = (x, y, z) => dirs4.filter(([dx, dz]) => { const n = top.get(key(x + dx, z + dz)); return n === undefined || n <= y; });
const outsideSides = (x, z) => dirs4.filter(([dx, dz]) => !top.has(key(x + dx, z + dz)));

// 2. The entrance: the uphill (ground = datum) edge cell on the +z front, nearest the middle of the footprint.
const front = cells.filter(([x, z, g]) => g === DATUM && outsideSides(x, z).some(([, dz]) => dz === 1));
front.sort((a, b) => b[1] - a[1] || Math.abs(a[0] - 19) - Math.abs(b[0] - 19));
const [ex, ez] = front.length ? [front[0][0], front[0][1]] : [-99, -99];

// 3. Shell and storeys. Solid under the roof: plinth to the datum, floor slab per storey, roof slab on each tier.
const vox = new Map();                 // "x,y,z" -> { block, state }
const put = (x, y, z, block, state) => vox.set(`${x},${y},${z}`, { block, state });
const lights = [];                     // glowstone just inside a lit window, on its storey floor

function facade(x, y, z, sides) {
  const rel = y % 4;                   // 1..3 inside a storey (0 is the slab)
  const [dx, dz] = sides[0];           // the face this voxel looks out of
  const along = dx !== 0 ? z : x;      // position along that wall, for the mullion grid
  const bay = dz === 1 && z === ez && Math.abs(x - ex) <= 2 && y < DATUM + 4;   // entrance bay, ground storey
  if (bay && rel === 3) return put(x, y, z, "polished_andesite");                // canopy band over the entrance
  if (bay && x === ex && rel === 1) return put(x, y, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  if (bay && x === ex && rel === 2) return put(x, y, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (rel === 3) return put(x, y, z, "smooth_quartz");                          // storey line
  if (bay) return put(x, y, z, "light_blue_stained_glass_pane");                // lobby glass
  if (along % 4 === 0) return put(x, y, z, "white_concrete");                   // pier between bays
  put(x, y, z, "light_blue_stained_glass_pane");                                // window pane, connected below
  if (rel === 1 && along % 8 === 2 && (y >> 2) % 2 === 1) lights.push([x - dx, y, z - dz]);
}

for (const [k, t] of top) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y <= t; y++) {
    if (y < DATUM) { put(x, y, z, y === DATUM - 1 ? "smooth_stone" : "stone_bricks"); continue; }  // plinth, base course on top
    if (y === t) { put(x, y, z, "light_gray_concrete"); continue; }                                  // roof slab
    if (y % 4 === 0) { put(x, y, z, "light_gray_concrete"); continue; }                              // floor slab
    const sides = openSides(x, y, z);
    if (sides.length) facade(x, y, z, sides);                                                        // else interior air
  }
  if (outsideSides(x, z).length) put(x, t + 1, z, "white_concrete");                                 // parapet on the edge
}

// 4. Roof plant: a box on a flat patch of the tower (plus a broadcast mast), and a low box on the wing.
const flat = (x, z, T, m) => { for (let i = -m; i <= m; i++) for (let j = -m; j <= m; j++) if (top.get(key(x + i, z + j)) !== T) return false; return true; };
const findPatch = (T, m, far) => {
  for (const [k, t] of top) {
    if (t !== T) continue;
    const [x, z] = k.split(",").map(Number);
    if (flat(x, z, T, m) && (!far || Math.abs(x - far[0]) + Math.abs(z - far[1]) > 8)) return [x, z];
  }
  return null;
};
const tower = findPatch(20, 2, null) || findPatch(20, 1, null);
if (tower) {
  const [tx, tz] = tower;
  for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) { put(tx + i, 21, tz + j, "gray_concrete"); put(tx + i, 22, tz + j, "gray_concrete"); }
  for (let y = 23; y <= 27; y++) put(tx, y, tz, "iron_bars", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  put(tx, 28, tz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}
const wing = findPatch(12, 2, tower) || findPatch(12, 1, tower);
if (wing) for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) put(wing[0] + i, 13, wing[1] + j, "gray_concrete");

// 5. Window panes connect to the neighbouring shell; glass with no shell beside it stays free-standing.
for (const [k, v] of vox) {
  if (v.block !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const joins = (dx, dz) => vox.has(`${x + dx},${y},${z + dz}`);
  v.state = { north: String(joins(0, -1)), south: String(joins(0, 1)), east: String(joins(1, 0)), west: String(joins(-1, 0)), waterlogged: "false" };
}

// 6. Warm light behind some windows, on the floor slab; never on a shell voxel.
const g = new Voxels([X, Y, Z]);
for (const [k, v] of vox) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, v.block, v.state); }
let lit = 0;
for (const [x, y, z] of lights) if (!vox.has(`${x},${y},${z}`)) { g.set(x, y, z, "glowstone"); lit++; }

const info = g.save(OUT);
console.log(JSON.stringify({ footprint: cells.length, shellVoxels: vox.size, lights: lit, blocks: info.blocks, palette: info.palette }));
