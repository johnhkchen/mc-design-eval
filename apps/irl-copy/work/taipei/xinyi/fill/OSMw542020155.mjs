import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020155";
const W = 12, H = 23, D = 8;

// Footprint: [x, z, ground] per cell
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, gr);
}
const cellList = [...ground.keys()].map((k) => k.split(",").map(Number));
const has = (x, z) => ground.has(`${x},${z}`);
const minG = Math.min(...ground.values());

// Roof slab row: about 11 blocks above the lowest ground. Parapet sits one above.
const TOP = minG + 11;
const gOf = (x, z) => Math.min(ground.get(`${x},${z}`), TOP - 1);

const faces = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const faceCount = (f) => (f.N ? 1 : 0) + (f.S ? 1 : 0) + (f.W ? 1 : 0) + (f.E ? 1 : 0);
const isBoundary = (x, z) => faceCount(faces(x, z)) > 0;

// Street-level entrance: a single-face south-facing cell nearest the middle of the front.
let entry = null;
{
  const cx = (W - 1) / 2;
  let best = Infinity;
  for (const [x, z] of cellList) {
    const f = faces(x, z);
    if (f.S && faceCount(f) === 1 && Math.abs(x - cx) < best) {
      best = Math.abs(x - cx);
      entry = `${x},${z}`;
    }
  }
  if (!entry) {
    for (const [x, z] of cellList) {
      const f = faces(x, z);
      if (f.N && faceCount(f) === 1 && Math.abs(x - cx) < best) {
        best = Math.abs(x - cx);
        entry = `${x},${z}`;
      }
    }
  }
}

// Warm light positions: glowstone sitting in the air gap just behind selected windows.
const glow = new Set();
for (const [x, z] of cellList) {
  const f = faces(x, z);
  if (faceCount(f) !== 1) continue;
  const gb = gOf(x, z);
  const i = (f.N || f.S) ? x : z;
  let ix = x, iz = z;
  if (f.N) iz = z + 1;
  else if (f.S) iz = z - 1;
  else if (f.W) ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || isBoundary(ix, iz)) continue;
  if (i % 6 === 1) glow.add(`${ix},${gb + 7},${iz}`);
  if (i % 6 === 2) glow.add(`${ix},${gb + 2},${iz}`);
}

function blockFor(x, z, y) {
  const gb = gOf(x, z);
  const f = faces(x, z);
  const n = faceCount(f);
  const bnd = n > 0;

  // Foundation from y 0 up to this cell's ground
  if (y < gb) return "stone_bricks";

  // Roof slab
  if (y === TOP) return bnd ? "smooth_stone" : "light_gray_concrete";

  // Parapet and roof plant
  if (y === TOP + 1) {
    if (bnd) return "white_concrete";
    if (x >= 4 && x <= 5 && z >= 2 && z <= 3) return "light_gray_concrete";
    return null;
  }
  if (y === TOP + 2) {
    if (!bnd && x === 4 && z === 2) return "lightning_rod";
    return null;
  }
  if (y > TOP + 2) return null;

  const rel = y - gb;

  // Interior: floor slabs at storey lines, air gap otherwise
  if (!bnd) {
    if (rel === 0 || rel === 5 || rel === 10) return "light_gray_concrete";
    if (glow.has(`${x},${y},${z}`)) return "glowstone";
    return null;
  }

  // Corner columns
  if (n >= 2) {
    if (rel === 0) return "stone_bricks";
    if (rel === 5 || rel === 10) return "smooth_stone";
    return "light_gray_concrete";
  }

  // Single-face facade
  const i = (f.N || f.S) ? x : z;
  const isEntry = entry === `${x},${z}`;
  const shopWin = i % 3 !== 0;
  const upperWin = i % 3 === 1;

  if (rel === 0) return "stone_bricks";
  if (rel >= 1 && rel <= 3) {
    if (isEntry) return null;
    if (shopWin) return "cyan_stained_glass";
    return "light_gray_concrete";
  }
  if (rel === 4) return "smooth_stone";
  if (rel === 5) return "smooth_stone";
  if (rel >= 6 && rel <= 8) return upperWin ? "light_blue_stained_glass" : "light_gray_concrete";
  if (rel === 9) return "white_concrete";
  if (rel === 10) return "smooth_stone";
  return null;
}

const vox = new Voxels([W, H, D]);
for (const [x, z] of cellList) {
  for (let y = 0; y <= TOP + 2; y++) {
    const id = blockFor(x, z, y);
    if (id) vox.set(x, y, z, id);
  }
}

vox.save(`${DIR}/${ID}.nbt`);
