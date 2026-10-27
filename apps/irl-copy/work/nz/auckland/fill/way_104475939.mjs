// WE Building, Auckland: a 1970s-80s concrete-framed office block on a podium. Six storeys (a 5-block ground floor, then
// 4-block floors) over most of the footprint, a seven-storey core set back in the middle of the podium roof, and low
// two- and three-storey wings at the edges. Precast light grey spandrels and piers between tinted glass, a base course,
// a parapet, a rooftop plant box, and a central entrance on the south face. The lidar's roof heights are read as tiers
// (a 5x5 mode over the 3x3 median of each cell's roof), not as noise. Each cell fills from y 0 to its roof tier, with
// the foundation and plinth below its ground. The downhill side shows a basement strip and a lower storey where the
// ground is low. The shell is a facade cell, a one-block air gap behind the glass, and a solid stone core, with a
// slab per storey, so every storey rests on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/";
const cells = JSON.parse(readFileSync(DIR + "way_104475939.cells.json", "utf8"));

const W = 83, D = 49, H = 50, N = W * D;
const LEVELS = [11, 15, 19, 23, 27, 31, 35];           // tier tops: the lintel row under each is 10, 14, ... 34
const SLAB = new Set([2, 6, 11, 15, 19, 23, 27, 31, 35]);
const LINTEL = new Set([5, 10, 14, 18, 22, 26, 30, 34]);
const LOWER_WINDOW = new Set([3, 7, 12, 16, 20, 24, 28, 32]);  // the first row above each slab, so a light never floats
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];      // +x, -x, +z (south), -z

const inF = new Uint8Array(N), G = new Int32Array(N), R = new Int32Array(N);
for (const [x, z, g, r] of cells) { const i = z * W + x; inF[i] = 1; G[i] = g; R[i] = r; }
const at = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? z * W + x : -1);
const xz = (i) => [i % W, Math.floor(i / W)];
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const nearest = (h) => LEVELS.reduce((b, l) => (Math.abs(l - h) < Math.abs(b - h) ? l : b));
const hh = (...a) => { let h = 2166136261; for (const v of a) h = Math.imul(h ^ v, 16777619); return h >>> 0; };

// 1. the roof tier: lidar noise (roof under 9 is a no-data edge) out, 3x3 median, nearest tier, then a 5x5 mode
const lvl = new Int32Array(N);
for (let i = 0; i < N; i++) {
  if (!inF[i]) continue;
  const [x, z] = xz(i), vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const j = at(x + dx, z + dz); if (j >= 0 && inF[j] && R[j] >= 9) vals.push(R[j]);
  }
  lvl[i] = nearest(vals.length ? med(vals) : 31);
}
const T = new Int32Array(N);
for (let i = 0; i < N; i++) {
  if (!inF[i]) continue;
  const [x, z] = xz(i), count = new Map();
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const j = at(x + dx, z + dz); if (j >= 0 && inF[j]) count.set(lvl[j], (count.get(lvl[j]) || 0) + 1);
  }
  let best = lvl[i], bc = -1;                          // a tie goes to the taller tier
  for (const [l, c] of count) if (c > bc || (c === bc && l > best)) { best = l; bc = c; }
  T[i] = best;
}

// 2. exposure: a face on the outside, or on a lower neighbour (a setback). d0 cells are the facade; depth grows inward
const expo = Array.from({ length: N }, () => []), outside = Array.from({ length: N }, () => []);
for (let i = 0; i < N; i++) {
  if (!inF[i]) continue;
  const [x, z] = xz(i);
  DIRS.forEach(([dx, dz], d) => {
    const j = at(x + dx, z + dz);
    if (j < 0 || !inF[j]) { expo[i].push(d); outside[i].push(d); }
    else if (T[j] < T[i]) expo[i].push(d);
  });
}
const depth = new Int32Array(N).fill(-1), queue = [];
for (let i = 0; i < N; i++) if (inF[i] && expo[i].length) { depth[i] = 0; queue.push(i); }
for (let q = 0; q < queue.length; q++) {
  const i = queue[q], [x, z] = xz(i);
  for (const [dx, dz] of DIRS) { const j = at(x + dx, z + dz); if (j >= 0 && inF[j] && depth[j] < 0) { depth[j] = depth[i] + 1; queue.push(j); } }
}

// 3. the entrance: the south (+z) face's outside cells, at the middle of the run that sits nearest the centre
let zMax = -1; const south = [];
for (let i = 0; i < N; i++) if (inF[i] && outside[i].includes(2) && T[i] >= 15) { const [x, z] = xz(i); if (z > zMax) zMax = z; }
for (let i = 0; i < N; i++) if (inF[i] && outside[i].includes(2) && T[i] >= 15 && xz(i)[1] === zMax) south.push(xz(i)[0]);
const midX = south.length ? med([...south]) : W / 2;
const entrance = south.length ? at(south.reduce((b, x) => (Math.abs(x - midX) < Math.abs(b - midX) ? x : b)), zMax) : -1;

// 4. rooftop plant: a 6 x 4 box on the tallest tier, set in from its edge, three blocks high
const plant = new Set();
{
  const tall = [];
  for (let i = 0; i < N; i++) if (inF[i] && T[i] === 35 && depth[i] >= 3) tall.push(xz(i));
  if (tall.length) {
    const cx = Math.round(tall.reduce((s, [x]) => s + x, 0) / tall.length), cz = Math.round(tall.reduce((s, [, z]) => s + z, 0) / tall.length);
    for (let dz = -2; dz <= 1; dz++) for (let dx = -3; dx <= 2; dx++) {
      const j = at(cx + dx, cz + dz); if (j >= 0 && inF[j] && T[j] === 35 && depth[j] >= 3) plant.add(j);
    }
  }
}

// 5. the voxels: each footprint cell from y 0 to its tier
const g = new Voxels([W, H, D]);
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
for (let i = 0; i < N; i++) {
  if (!inF[i]) continue;
  const [x, z] = xz(i), t = T[i], gr = G[i], d = depth[i];
  const faceX = expo[i].some((k) => k < 2);
  const u = faceX ? z : x;                             // the bay runs along the face the cell shows
  for (let y = 0; y < t; y++) {
    if (y < gr) { g.set(x, y, z, d === 0 ? "stone_bricks" : "stone"); continue; }   // foundation and plinth
    if (y < 2) { g.set(x, y, z, d === 0 ? "stone_bricks" : "stone"); continue; }    // basement strip on the downhill side
    if (d === 0 && i === entrance && (y === 7 || y === 8)) {                            // the entrance door, outward (south)
      g.set(x, y, z, "iron_door", { ...DOOR, half: y === 7 ? "lower" : "upper" });
      continue;
    }
    if (d === 0 && i === entrance && y === 9) { g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" }); continue; }
    if (LINTEL.has(y) || SLAB.has(y)) {                 // a slab or lintel row: the base course, spandrels, the roof top
      if (y === t - 1) g.set(x, y, z, "smooth_stone");
      else if (d === 0) g.set(x, y, z, y === 6 ? "polished_andesite" : "light_gray_concrete");
      else g.set(x, y, z, "stone");
      continue;
    }
    // window rows: the facade's piers and glass; the air gap behind; a light behind some glass; the core
    if (d === 0) g.set(x, y, z, u % 4 === 0 ? "light_gray_concrete" : "light_blue_stained_glass");
    else if (d === 1) { if (LOWER_WINDOW.has(y) && hh(x, y, z) % 9 === 0) g.set(x, y, z, "glowstone"); }
    else g.set(x, y, z, "stone");
  }
  // the parapet on the outside edge of a tier; the plant box stands on the tallest tier's roof
  if (outside[i].length) g.set(x, t, z, "light_gray_concrete");
  if (plant.has(i)) for (let y = t; y < t + 3; y++) g.set(x, y, z, "gray_concrete");
}

const stats = g.save(DIR + "way_104475939.nbt");
console.log("tiers", Object.fromEntries(LEVELS.map((l) => [l, [...T].filter((v, k) => inF[k] && v === l).length])), "entrance", entrance >= 0 ? xz(entrance) : "none", "plant", plant.size, stats);
