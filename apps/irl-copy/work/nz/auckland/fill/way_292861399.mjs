// Fiore Wakefield 3: a 1970s concrete-framed office tower on a volcanic basalt plinth, 13 storeys of 4 blocks (about
// 3.3 m) to a flat roof at 59 with a parapet at 60, a lower court wing in the middle of its footprint, a plant room on the
// roof, and a shopfront storey with a lintel-canopied entrance. The lidar's roof heights are median-smoothed and snapped
// to storey tops (every tier is 4n + 3), so the massing reads as flat tiers, not lidar noise.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861399.cells.json`, "utf8"));   // [x, z, ground, roof]
const DATUM = 7;   // the ground floor's slab: just above the highest ground (7), so every cell's plinth is solid up to it
const g = new Voxels([44, 73, 34]);

const key = (x, z) => `${x},${z}`;
const raw = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const NB = [[0, -1, "N", "north"], [0, 1, "S", "south"], [1, 0, "E", "east"], [-1, 0, "W", "west"]];

// Each cell's tier: the median of its 3x3 neighbourhood (lidar noise out), snapped to 4n + 3 so tops fall on storey lines.
const med = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const H = new Map();   // roof height (the column's top is H - 1); 0 outside the footprint
for (const [k] of raw) {
  const [x, z] = k.split(",").map(Number), near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = raw.get(key(x + dx, z + dz)); if (c) near.push(c.roof); }
  H.set(k, Math.min(59, Math.max(11, 3 + 4 * Math.round((med(near) - 3) / 4))));
}
const hOf = (x, z) => H.get(key(x, z)) ?? 0;
// A face is exposed at height y when its neighbour is outside the footprint or its column stops below y (setbacks).
const faces = (x, z, y) => NB.filter(([dx, dz]) => { const h = hOf(x + dx, z + dz); return h === 0 || h - 1 < y; });
const exposed = (x, z, y) => faces(x, z, y).length > 0;

// The entrance: a cell on the outside, near the street level (7) and near the middle of the footprint.
let door = null, best = Infinity;
for (const [k, { ground }] of raw) {
  const [x, z] = k.split(",").map(Number), outs = NB.filter(([dx, dz]) => hOf(x + dx, z + dz) === 0);
  if (!outs.length) continue;
  const score = Math.abs(ground - DATUM) * 10 + Math.hypot(x - 21, z - 17) / 10;
  if (score < best) { best = score; door = { x, z, facing: outs[0][3] }; }
}

// The plant room: a 7 x 5 block of tower roof whose ring is all tower roof too, nearest the middle.
let plant = null; best = Infinity;
for (let z0 = 1; z0 + 5 < 33; z0++) for (let x0 = 1; x0 + 7 < 43; x0++) {
  let ok = true;
  for (let z = z0 - 1; z <= z0 + 5 && ok; z++) for (let x = x0 - 1; x <= x0 + 7 && ok; x++) if (hOf(x, z) !== 59) ok = false;
  if (!ok) continue;
  const score = Math.hypot(x0 + 3 - 21, z0 + 2 - 17);
  if (score < best) { best = score; plant = { x0, z0, x1: x0 + 6, z1: z0 + 4 }; }
}

const glassFor = (k) => (k % 2 === 0 ? "light_blue_stained_glass" : "cyan_stained_glass");   // shops and office bands alternate
const isPier = (faceNames, x, z) => {
  const ns = faceNames.some((f) => f === "N" || f === "S"), ew = faceNames.some((f) => f === "E" || f === "W");
  return (ns && ew) || (ns && x % 3 === 0) || (ew && z % 3 === 0);
};

for (const [k, { ground }] of raw) {
  const [x, z] = k.split(",").map(Number), h = hOf(x, z), top = h - 1;
  const nbs = NB.map(([dx, dz]) => hOf(x + dx, z + dz));
  const isDoor = door && door.x === x && door.z === z;

  // Foundation and plinth: solid from y 0 up to the datum, so a downhill cell's extra storeys stand on stone.
  for (let y = 0; y < DATUM; y++) g.set(x, y, z, "stone_bricks");

  for (let y = DATUM; y <= top; y++) {
    const k_ = Math.floor((y - DATUM) / 4), rel = (y - DATUM) % 4, ext = exposed(x, z, y);
    if (y === top) { g.set(x, y, z, "smooth_stone"); continue; }                   // roof surface
    if (rel === 0) { g.set(x, y, z, k_ === 0 && ext ? "polished_andesite" : "light_gray_concrete"); continue; }   // base course, floor slabs, spandrels
    if (rel === 3) { if (ext) g.set(x, y, z, k_ === 0 ? "polished_andesite" : "light_gray_concrete"); continue; }  // head bands, shopfront fascia
    if (ext) {
      if (isDoor && k_ === 0) { g.set(x, y, z, "dark_oak_door", { facing: door.facing, half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (isPier(faces(x, z, y).map((f) => f[2]), x, z)) g.set(x, y, z, k_ === 0 ? "polished_andesite" : "white_concrete");
      else g.set(x, y, z, glassFor(k_));
      continue;
    }
    // inside: air, except a lantern on the floor behind some windows
    const nearWindow = NB.some(([dx, dz]) => { const n = [x + dx, z + dz]; return hOf(n[0], n[1]) > 0 && exposed(n[0], n[1], y); });
    if (rel === 1 && nearWindow && (x * 5 + z * 7 + k_ * 3) % 4 === 0) g.set(x, y, z, "lantern", { hanging: "false" });
  }

  // Parapet on the roof's edge wherever a neighbour is outside or lower.
  if (nbs.some((n) => n === 0 || n < h)) g.set(x, h, z, "light_gray_concrete");
}

// The plant room on the tower roof: walls with louvres, a gray cap, air inside.
if (plant) {
  for (let z = plant.z0; z <= plant.z1; z++) for (let x = plant.x0; x <= plant.x1; x++) {
    const edge = x === plant.x0 || x === plant.x1 || z === plant.z0 || z === plant.z1;
    for (let y = 59; y <= 61; y++) if (edge) g.set(x, y, z, y === 60 ? "iron_bars" : "light_gray_concrete");
    g.set(x, 62, z, "gray_concrete");
  }
}

g.save(`${DIR}/way_292861399.nbt`);
console.log(JSON.stringify({ door, plant, cells: cells.length, roofTiers: [...new Set([...H.values()])].sort((a, b) => a - b) }));
