// 581 Fifth Avenue, 1930: a seven-storey limestone office block with an eight-storey tower
// at the south-middle, an 18-block setback on the north, and a two-storey wing on the east.
// The lidar roof per cell is smoothed (3x3 median) and snapped to four tiers: 6, 18, 22, 25.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035409.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 28, D = 11, TIERS = [6, 18, 22, 25];

// Raw lidar roof and ground per footprint cell, [z][x].
const roof = Array.from({ length: D }, () => new Array(W).fill(0));
const ground = Array.from({ length: D }, () => new Array(W).fill(0));
for (const [x, z, g, r] of cells) { ground[z][x] = g; roof[z][x] = r; }

// Smooth: 3x3 median of the positive roofs around each cell, then snap to the nearest tier. A roof of 0 is no building.
function median(x, z) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz;
    if (xx >= 0 && zz >= 0 && xx < W && zz < D && roof[zz][xx] > 0) v.push(roof[zz][xx]);
  }
  v.sort((a, b) => a - b);
  return v[Math.floor(v.length / 2)];
}
const tier = Array.from({ length: D }, () => new Array(W).fill(0));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (roof[z][x] <= 0) continue;
  const m = median(x, z);
  tier[z][x] = TIERS.reduce((best, t) => (Math.abs(t - m) < Math.abs(best - m) ? t : best));
}
// Second pass: each cell takes the majority tier of its 3x3 (ties go lower), so a one-cell fin joins the mass it sits on.
const snapped = tier.map((row, z) => row.map((t, x) => {
  if (!t) return 0;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz;
    if (xx >= 0 && zz >= 0 && xx < W && zz < D && tier[zz][xx]) v.push(tier[zz][xx]);
  }
  const count = (k) => v.filter((u) => u === k).length;
  return [...TIERS].filter((k) => count(k) > 0).sort((a, b) => count(b) - count(a) || a - b)[0];
}));
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) tier[z][x] = snapped[z][x];
// Third: the top tier needs a neighbour across the row and down the column. A one-cell-wide edge fin at 25 drops to 22.
const top = Math.max(...TIERS);
const topRun = (x, z) => tier[z]?.[x - 1] === top || tier[z]?.[x + 1] === top;
const topCol = (x, z) => tier[z - 1]?.[x] === top || tier[z + 1]?.[x] === top;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (tier[z][x] === top && !(topRun(x, z) && topCol(x, z))) tier[z][x] = TIERS[TIERS.indexOf(top) - 1];
}
const tierAt = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : tier[z][x]);
const inR = (x, z, y) => tierAt(x, z) > y;                       // this column still has building at height y
const NEIGH = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const shell = (x, z, y) => inR(x, z, y) && NEIGH.some(([dx, dz]) => !inR(x + dx, z + dz, y));

// Storey plan: 3 blocks a storey. Layer 0 is the spandrel (or base course), layers 1-2 are the glazing.
// Piers run every third bay; corners are always piers. The roof is the top layer of each tier (cornice outside,
// deck inside), and the layer under it is a ceiling so the deck rests on something.
const topY = Math.max(...TIERS) + 3;
const v = new Voxels([W, topY, D]);

const DOOR = { facing: "west", hinge: "left", open: "false", powered: "false" };
function facade(x, z, y, T) {
  const k = Math.floor(y / 3), l = y % 3;
  if (y === T - 1) return ["smooth_quartz"];                       // cornice
  const missX = !inR(x - 1, z, y) || !inR(x + 1, z, y);
  const missZ = !inR(x, z - 1, y) || !inR(x, z + 1, y);
  const corner = missX && missZ;
  const along = missZ ? x : z;
  const pier = corner || along % 3 === 0;
  // The Fifth Avenue entrance on the west face, middle bay, with a granite marquee above it.
  if (x === 0 && z === 5 && y <= 1) return ["dark_oak_door", { ...DOOR, half: y === 0 ? "lower" : "upper", facing: "west" }];
  if (x === 0 && z >= 4 && z <= 6 && y === 3) return ["polished_granite"];
  if (x === 0 && z === 5 && y === 2) return ["calcite"];          // door head
  if (k === 0 && l === 0) return ["polished_andesite"];            // base course
  if (pier) return ["calcite"];
  if (l === 0) return ["smooth_quartz"];                           // spandrel
  return ["glass_pane"];                                           // glazing, connected in the pass below
}

for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const T = tier[z][x];
  if (!T) continue;
  const g = ground[z][x];
  for (let y = 0; y < g; y++) v.set(x, y, z, "polished_granite");   // foundation (zero here, kept for slopes)
  for (let y = 0; y < T; y++) {
    if (!inR(x, z, y)) continue;
    if (shell(x, z, y)) {
      const [block, state] = facade(x, z, y, T);
      v.set(x, y, z, block, state);
    } else if (y === T - 1) {
      v.set(x, y, z, "smooth_stone");                              // roof deck
    } else if (y % 3 === 0 || y === T - 2) {
      v.set(x, y, z, "stone_bricks");                              // floor slab per storey, ceiling under the roof
    }
  }
}

// Warm light behind some of the glazing: a shroomlight on the inside air cell of the window.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const T = tier[z][x];
  if (!T) continue;
  for (let y = 1; y < T - 2; y++) {
    if (y % 3 === 0 || !shell(x, z, y) || v.get(x, y, z)?.block !== "minecraft:glass_pane") continue;
    const missX = !inR(x - 1, z, y) || !inR(x + 1, z, y);
    const missZ = !inR(x, z - 1, y) || !inR(x, z + 1, y);
    if (missX === missZ) continue;                                 // corners and pits: no light
    if (((x * 31 + z * 17 + y * 7) % 15) !== 0) continue;
    const ix = missX ? (x === 0 ? 1 : x === W - 1 ? W - 2 : x) : x;
    const iz = missZ ? (z === 0 ? 1 : z === D - 1 ? D - 2 : z) : z;
    if (!inR(ix, iz, y) || shell(ix, iz, y)) continue;
    if (v.get(ix, y, iz)) continue;
    v.set(ix, y, iz, "shroomlight");
  }
}

// Roof plant: a 2x2 mechanical box on the roof deck of the tallest and the middle tier.
function plant(T, h) {
  for (let z = 0; z < D - 1; z++) for (let x = 0; x < W - 1; x++) {
    const ok = [[0, 0], [1, 0], [0, 1], [1, 1]].every(([dx, dz]) =>
      tierAt(x + dx, z + dz) === T && !shell(x + dx, z + dz, T - 1));
    if (!ok) continue;
    for (let dz = 0; dz < 2; dz++) for (let dx = 0; dx < 2; dx++) {
      for (let y = T; y < T + h; y++) v.set(x + dx, y, z + dz, y === T + h - 1 ? "smooth_quartz" : "calcite");
    }
    return;
  }
}
plant(25, 2);
plant(22, 2);

// Glass panes connect to their neighbours in the vanilla way: to panes, and to any solid block beside them.
const SIDES = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) for (let y = 0; y < topY; y++) {
  const b = v.get(x, y, z);
  if (!b || b.block !== "minecraft:glass_pane") continue;
  const state = {};
  for (const [side, [dx, dz]] of Object.entries(SIDES)) {
    const n = v.get(x + dx, y, z + dz);
    state[side] = String(!!n && !n.block.includes("door"));
  }
  v.set(x, y, z, "glass_pane", { ...state, waterlogged: "false" });
}

const out = `${DIR}/NYC1035409.nbt`;
const info = v.save(out);
console.log(`saved ${out}: ${info.blocks} blocks, ${info.palette} palette entries, size ${W} x ${topY} x ${D}`);
