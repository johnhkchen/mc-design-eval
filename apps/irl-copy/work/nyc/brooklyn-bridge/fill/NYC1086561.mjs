import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1086561.cells.json`, "utf8"));

const W = 18, H = 28, D = 17;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const raw = new Map();
for (const [x, z, gr, rf] of cells) raw.set(`${x},${z}`, { g: Math.round(gr), r: rf });
const has = (x, z) => raw.has(`${x},${z}`);
const info = new Map();

// Wider smoothing (5x5) and snap to even block counts so each setback is a
// clean two-block storey tier rather than a jagged step.
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number);
  let s = 0, n = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) {
    const k = `${x + dx},${z + dz}`;
    if (raw.has(k)) { s += raw.get(k).r; n++; }
  }
  const avg = s / n;
  let T = Math.round(avg / 2) * 2;
  T = Math.max(c.g + 6, Math.min(24, T));
  info.set(key, { x, z, g: c.g, T });
}

const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// deterministic pseudo-random for sparse lit windows
const hsh = (x, y, z) => Math.abs(Math.imul(x * 73856093 ^ y * 19349663 ^ z * 83492791, 2654435761)) % 97;

// ---- entrance: street-facing perimeter cell nearest the frontage middle ------
const mid = Math.floor(W / 2);
let doorX = null, doorZ = null, doorFace = null, best = Infinity;
for (const { x, z } of info.values()) {
  if (!isPerim(x, z)) continue;
  let face = null;
  if (!has(x, z - 1)) face = "north";
  else if (!has(x, z + 1)) face = "south";
  if (!face) continue;
  const d = Math.abs(x - mid);
  if (d < best) { best = d; doorX = x; doorZ = z; doorFace = face; }
}

// ---- facade material for one perimeter voxel ---------------------------------
function facade(u, x, y, z, gr, doorHere, doorHalf) {
  const rel = y - gr;
  if (rel === 0) return ["polished_granite"];                 // base course
  if (rel === 1 || rel === 2) {                               // ground-floor shopfront
    if (doorHere) return ["oak_door", doorHalf];
    if (u % 4 === 0) return ["polished_granite"];             // shopfront piers
    if (rel === 1 && hsh(x, y, z) < 9) return ["glowstone"];  // warm shop light
    return ["glass"];
  }
  if (rel === 3) return ["stone_bricks"];                     // ground-floor lintel band
  const s = rel - 4;
  const k = s % 2;
  const storey = Math.floor(s / 2);
  if (k === 1) {                                              // spandrel / belt course
    if (storey % 3 === 2) return ["stone_bricks"];
    return ["bricks"];
  }
  if (u % 3 === 0) return ["bricks"];                         // brick piers between windows
  if (hsh(x, y, z) < 9) return ["glowstone"];                 // lit window behind glass
  return ["glass"];
}

// ---- build walls, foundations and roofs --------------------------------------
for (const { x, z, g: gr, T } of info.values()) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (!isPerim(x, z)) {
    for (let y = gr; y <= T - 2; y++) g.set(x, y, z, "bricks");
    g.set(x, T - 1, z, "smooth_stone");
    continue;
  }

  const missingNS = !has(x, z - 1) || !has(x, z + 1);
  const u = missingNS ? x : z;
  const doorHere = x === doorX && z === doorZ;

  for (let y = gr; y <= T - 2; y++) {
    const rel = y - gr;
    if (doorHere && rel === 3) {                              // stone lintel over door
      g.set(x, y, z, "stone_bricks");
      continue;
    }
    if (doorHere && (rel === 1 || rel === 2)) {
      g.set(x, y, z, "oak_door", {
        facing: doorFace, half: rel === 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    const [blk] = facade(u, x, y, z, gr, false, null);
    g.set(x, y, z, blk);
  }
  g.set(x, T - 1, z, "stone_bricks");   // cornice
  g.set(x, T, z, "stone_bricks");       // parapet
}

// ---- rooftop water tower on an interior 2x2 block of cells -------------------
let tower = null;
for (const { x, z } of info.values()) {
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (x + 1 >= W || z + 1 >= D) continue;
  if (!quad.every(([a, b]) => info.has(`${a},${b}`) && !isPerim(a, b))) continue;
  const tops = quad.map(([a, b]) => info.get(`${a},${b}`).T);
  const Tm = Math.max(...tops);
  if (Tm > 22) continue;
  tower = { quad, Tm };
  break;
}
if (tower) {
  const { quad, Tm } = tower;
  for (const [a, b] of quad) {
    const T = info.get(`${a},${b}`).T;
    for (let y = T; y <= Tm + 1; y++) g.set(a, y, b, "oak_fence");
  }
  for (const [a, b] of quad) {
    for (let y = Tm + 2; y <= Tm + 4; y++) g.set(a, y, b, "spruce_planks");
    g.set(a, Tm + 5, b, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC1086561.nbt`);
