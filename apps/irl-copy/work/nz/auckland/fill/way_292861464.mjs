// Way 292861464: a 1970s concrete-framed office block, six storeys over a shopfront ground floor (Auckland's
// 1960s-70s office stock: white concrete piers and light grey spandrels, blue tinted glass, a volcanic basalt plinth
// and cornice). Massing follows the lidar roof, median-smoothed and clamped to three flat tiers (29, 30, 31). The body
// is solid so nothing floats; each window cuts one air cell behind its glass (glowstone behind some), and every storey
// keeps a solid slab row.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861464.cells.json`, "utf8"));
const g = new Voxels([41, 44, 28]);

const M = {
  foundation: "stone",
  plinth: "polished_andesite",
  body: "light_gray_concrete",
  pier: "white_concrete",
  glass: "light_blue_stained_glass",
  door: "dark_oak_door",
  lamp: "glowstone",
  lantern: "lantern",
  roofBox: "light_gray_concrete",
  roofCap: "white_concrete",
};

const key = (x, z) => `${x},${z}`;
const byXZ = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inF = (x, z) => byXZ.has(key(x, z));
const NB4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };

// lidar roof: median over the footprint's 3x3 neighbourhood, clamped to the three tiers (a plant tier at 31)
const roofTier = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inF(x + dx, z + dz)) v.push(byXZ.get(key(x + dx, z + dz)).roof);
  v.sort((a, b) => a - b);
  return Math.min(31, Math.max(29, v[v.length >> 1]));
};
// the sides of a cell that face outside the footprint
const exposures = (x, z) => NB4.filter(([dx, dz]) => !inF(x + dx, z + dz));

// distance in cells from the outer edge (0 on the edge), for the plant set-backs
const dist = new Map();
const queue = [];
for (const [x, z] of cells) if (exposures(x, z).length) { dist.set(key(x, z), 0); queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = dist.get(key(x, z));
  for (const [dx, dz] of NB4) if (inF(x + dx, z + dz) && !dist.has(key(x + dx, z + dz))) { dist.set(key(x + dx, z + dz), d + 1); queue.push([x + dx, z + dz]); }
}

// a few lit windows, deterministic per cell so a re-run gives the same building
const lit = (x, y, z) => {
  let h = Math.imul(x, 73856093) ^ Math.imul(y, 19349663) ^ Math.imul(z, 83492791);
  h = Math.imul(h ^ (h >>> 13), 0x5bd1e995);
  return (h >>> 0) % 100 < 12;
};

// the solid mass before any opening is cut
function solidAt(y, R, ex, a) {
  if (ex.length === 0) return y < 4 ? M.foundation : M.body;   // interior: solid, no rooms
  if (y < 4) return M.plinth;                                  // downhill plinth to the datum
  if (y === 4 || y === R - 1) return M.plinth;                 // base course and cornice
  if (y > 27) return M.body;                                   // attic / roof-tier band above the top windows
  if (y === 7 || y % 4 === 0) return M.body;                   // fascia and storey slabs
  return ex.length > 1 || a % 4 === 0 ? M.pier : M.glass;      // window rows; piers at corners and every 4th cell
}

// pass 1: the solid volume; windows records the glass cells (x,y,z) that pass 2 gives an air gap
const windows = new Set();
for (const [x, z] of cells) {
  const R = roofTier(x, z), ex = exposures(x, z);
  const a = ex.length ? (ex[0][0] !== 0 ? z : x) : 0;
  for (let y = 0; y < R; y++) {
    let b = solidAt(y, R, ex, a);
    // a glass cell with no footprint cell behind it gets no air gap, so it is a solid pier instead
    if (b === M.glass && !inF(x - ex[0][0], z - ex[0][1])) b = M.body;
    if (b === M.glass) windows.add(`${x},${y},${z}`);
    g.set(x, y, z, b);
  }
}

// the entrance: two dark oak doors on the most common single-sided facade, centred on its run, flanked by piers
const facade = new Map();
for (const [x, z] of cells) {
  const ex = exposures(x, z);
  if (ex.length !== 1) continue;
  const k = `${ex[0][0]},${ex[0][1]}`;
  if (!facade.has(k)) facade.set(k, []);
  facade.get(k).push([x, z, ex[0][0] !== 0 ? z : x]);
}
const [dirKey, run] = [...facade.entries()].sort((p, q) => q[1].length - p[1].length)[0];
const sorted = run.sort((p, q) => p[2] - q[2]);
const mid = Math.floor(sorted.length / 2);
const doorCells = sorted.slice(mid, mid + 2);
const [ddx, ddz] = dirKey.split(",").map(Number);
const flanks = [sorted[mid - 1], sorted[mid + 2]].filter(Boolean);
const facing = FACING[dirKey];
const inward = (x, z) => [x - ddx, z - ddz];

for (const [x, z] of flanks) for (const y of [5, 6]) g.set(x, y, z, M.pier);
doorCells.forEach(([x, z], i) => {
  const hinge = i === 0 ? "left" : "right";
  const st = (half) => ({ facing, half, hinge, open: "false", powered: "false" });
  g.set(x, 4, z, M.plinth);
  g.set(x, 5, z, M.door, st("lower"));
  g.set(x, 6, z, M.door, st("upper"));
  g.set(x, 7, z, M.plinth);
});

// pass 2: openings. Each window cuts the air cell behind it (glowstone in some), each door a foyer with a lantern.
for (const [x, z] of cells) {
  const ex = exposures(x, z);
  if (ex.length !== 1) continue;
  const [ix, iz] = inward(x, z);
  for (let y = 5; y <= 27; y++) {
    if (!windows.has(`${x},${y},${z}`)) continue;
    if (lit(x, y, z)) g.set(ix, y, iz, M.lamp);
    else g.set(ix, y, iz, "air");
  }
}
for (const [x, z] of doorCells) {
  const [ix, iz] = inward(x, z);
  g.set(ix, 5, iz, "air");
  g.set(ix, 6, iz, M.lantern, { hanging: "true", waterlogged: "false" });
}

// roof plant: 2x2 boxes with a cap on the top tier, set in from the edge
for (const [x, z] of cells) {
  if (roofTier(x, z) !== 31 || dist.get(key(x, z)) < 3) continue;
  if ((x % 6 === 2 || x % 6 === 3) && (z % 6 === 2 || z % 6 === 3)) {
    g.set(x, 31, z, M.roofBox);
    g.set(x, 32, z, M.roofCap);
  }
}

const out = g.save(`${DIR}/way_292861464.nbt`);
console.log(`way_292861464: ${out.blocks} blocks, palette ${out.palette}, entrance on ${facing} facade`);
