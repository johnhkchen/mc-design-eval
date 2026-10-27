// The YMCA, Auckland (way 374195048): a 1930s-style block of cream render on a brick base, stepped by the lidar roof
// into tiers (a tower at the south end, a podium, a low north wing). Blue-glass bays between white piers, a brick base
// course on the first storey, a recessed door with a lintel, parapets on every exposed roof edge, a plant room on the tower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_374195048.cells.json", "utf8"));
const W = 58, D = 106, H = 45;
const G = new Array(W * D).fill(null), R = new Array(W * D).fill(null);
for (const [x, z, g, r] of cells) { G[z * W + x] = g; R[z * W + x] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && G[z * W + x] !== null;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Roof tiers: the lidar roof smoothed by a 5x5 median, then rounded to whole storeys (4 blocks) and capped at 32.
// Each column reaches at least one storey above its own ground, so every column stands on its foundation.
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const T = new Array(W * D).fill(null);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const vals = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (inF(x + dx, z + dz)) vals.push(R[(z + dz) * W + x + dx]);
  const gr = G[z * W + x];
  T[z * W + x] = Math.min(32, Math.max(4 * Math.round(med(vals) / 4), 4 * Math.ceil((gr + 4) / 4)));
}
const top = (x, z) => T[z * W + x];
const occ = (x, z, y) => inF(x, z) && y <= top(x, z);                              // solid column at height y
const interior = (x, z, y) => occ(x, z, y) && NB.every(([dx, dz]) => occ(x + dx, z + dz, y));
const hsh = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const gr = G[z * W + x], t = top(x, z);
  // a parapet where the roof meets air: the footprint's edge, or a step down to a lower tier
  const parapet = NB.some(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) < t);
  for (let y = 0; y <= t; y++) {
    if (y < gr) { put(x, y, z, "stone_bricks"); continue; }                         // foundation up to the lidar ground
    if (y === t) { put(x, y, z, parapet ? "smooth_stone" : "light_gray_concrete"); continue; }   // cornice or roof covering
    if (y % 4 === 0) { put(x, y, z, "smooth_stone"); continue; }                   // floor slab / storey line
    if (interior(x, z, y)) continue;                                               // air: no interiors
    // facade cell: the neighbour in the open side gives the wall's direction
    const nx = !occ(x - 1, z, y), px = !occ(x + 1, z, y), nz = !occ(x, z - 1, y), pz = !occ(x, z + 1, y);
    const k = y % 4, base = y - k < gr + 4;                                         // first storey of this column
    const pier = base ? "bricks" : "white_concrete";
    if ((nx || px) === (nz || pz)) { put(x, y, z, pier); continue; }               // corner or stair step: solid
    const alongX = nz || pz, along = alongX ? x : z;
    const [dx, dz] = alongX ? [0, nz ? 1 : -1] : [nx ? 1 : -1, 0];                  // inward
    const bay = along % 3 !== 0 && (k === 1 || k === 2) && interior(x + dx, z + dz, y);
    if (!bay) { put(x, y, z, pier); continue; }
    const pane = alongX ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
                        : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "light_blue_stained_glass_pane", pane);
    const h = hsh(x, y, z);
    if (h % 5 === 0) put(x + dx, y, z + dz, h % 2 ? "glowstone" : "shroomlight");   // warm light behind the glass
  }
}

// The recessed door: the lowest storey's facade cell nearest the middle of the footprint, on a row where the two
// door cells and the lintel above sit inside one storey (ground 1, 2, 5 or 6).
const cx = 28, cz = 52;
let door = null;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const gr = G[z * W + x];
  if (![1, 2, 5, 6].includes(gr) || top(x, z) < gr + 8) continue;
  const nx = !inF(x - 1, z), px = !inF(x + 1, z), nz = !inF(x, z - 1), pz = !inF(x, z + 1);
  if ((nx || px) === (nz || pz)) continue;
  const alongX = nz || pz;
  const [dx, dz] = alongX ? [0, nz ? 1 : -1] : [nx ? 1 : -1, 0];
  if (!interior(x + dx, z + dz, gr) || !interior(x + dx, z + dz, gr + 1)) continue;
  const d = Math.abs(x - cx) + Math.abs(z - cz);
  if (!door || d < door.d) door = { x, z, gr, alongX, dx, dz, d };
}
if (door) {
  const { x, z, gr, alongX, dx, dz } = door;
  const [ax, az] = alongX ? [1, 0] : [0, 1];
  const facing = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" }[`${-dx},${-dz}`];
  const st = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  for (const s of [-1, 1]) for (let r = 0; r < 2; r++) put(x + s * ax, gr + r, z + s * az, "stone_bricks");   // door surround
  for (let s = -1; s <= 1; s++) put(x + s * ax, gr + 2, z + s * az, "smooth_stone");                       // lintel canopy
  put(x, gr, z, "dark_oak_door", st("lower"));
  put(x, gr + 1, z, "dark_oak_door", st("upper"));
}

// Roof plant room: a 3 x 3 block of light concrete, two high, on the tallest tier, near its middle.
let plant = null;
for (let z = 3; z < D - 3; z++) for (let x = 3; x < W - 3; x++) {
  if (!inF(x, z) || top(x, z) !== 32) continue;
  let ok = true;
  for (let dz = -2; dz <= 2 && ok; dz++) for (let dx = -2; dx <= 2 && ok; dx++) if (top(x + dx, z + dz) !== 32) ok = false;
  if (!ok) continue;
  const d = Math.abs(x - cx) + Math.abs(z - cz);
  if (!plant || d < plant.d) plant = { x, z, d };
}
if (plant) for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) for (let y = 33; y <= 34; y++)
  put(plant.x + dx, y, plant.z + dz, "gray_concrete");

const counts = {};
for (const v of T) if (v !== null) counts[v] = (counts[v] || 0) + 1;
console.log("roof tiers (top y: cells)", JSON.stringify(counts), "door", door ? `${door.x},${door.z} at y${door.gr}` : "none", "plant", plant ? `${plant.x},${plant.z}` : "none");
console.log(g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_374195048.nbt"));
