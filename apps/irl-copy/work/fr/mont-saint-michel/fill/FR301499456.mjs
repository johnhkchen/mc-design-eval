import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499456";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 28, H = 24, D = 16;
const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p = {}) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  g.set(x, y, z, id, p);
};
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// ---- footprint and lidar record -------------------------------------------
const cm = new Map();
for (const [x, z, gr, rf] of cells) cm.set(`${x},${z}`, { g: Math.round(gr), r: rf });
const has = (x, z) => cm.has(`${x},${z}`);

let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const key of cm.keys()) {
  const [x, z] = key.split(",").map(Number);
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

// Smooth the lidar roof over a 3x3 neighbourhood.
const smooth = new Map();
for (const [key] of cm) {
  const [x, z] = key.split(",").map(Number);
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (has(x + dx, z + dz)) { s += cm.get(`${x + dx},${z + dz}`).r; n++; }
  }
  smooth.set(key, s / n);
}

// Snap to flat tiers: one main roof level T, with a lower wing and a higher
// pavilion one storey either side, so the massing reads as clean setbacks.
const vals = [...smooth.values()].sort((a, b) => a - b);
const median = vals[Math.floor(vals.length / 2)];
const T = clamp(Math.round(median), 10, H - 3);
const tierOf = new Map();
for (const [key, sm] of smooth) {
  const gr = cm.get(key).g;
  const diff = sm - T;
  let top = T;
  if (diff >= 3) top = T + 5;
  else if (diff <= -3) top = T - 5;
  tierOf.set(key, clamp(top, gr + 6, H - 2));
}

// ---- massing, shell, floors, windows ----------------------------------------
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];
const paneProps = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };

for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.g;
  const top = tierOf.get(key);
  const exposed = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  const perim = exposed.length > 0;

  // Foundation to the cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    if (!perim) {
      if (rel % 5 === 0 && rel > 0) put(x, y, z, "stone_bricks"); // floor slab
      continue;
    }
    if (rel === 0) { put(x, y, z, "granite"); continue; }
    if (rel % 5 === 0) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }

    let isWin = false;
    if (exposed.length === 1 && rel % 5 >= 1 && rel % 5 <= 3 && y <= top - 3) {
      const d = exposed[0];
      const a = d.dz !== 0 ? x : z;
      const lo = d.dz !== 0 ? minX : minZ;
      const hi = d.dz !== 0 ? maxX : maxZ;
      if (a % 3 === 1 && a > lo && a < hi) isWin = true;
    }
    if (isWin) put(x, y, z, "glass_pane", paneProps);
    else put(x, y, z, "stone_bricks");
  }

  // Cornice band and roof deck, perimeter parapet kept tidy.
  if (perim) put(x, top - 1, z, "chiseled_stone_bricks");
  put(x, top, z, "deepslate_tiles");
}

// ---- pilaster bays on the long faces (articulation) -------------------------
for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  const exposed = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  if (exposed.length !== 1) continue;
  const d = exposed[0];
  const a = d.dz !== 0 ? x : z;
  const lo = d.dz !== 0 ? minX : minZ;
  const hi = d.dz !== 0 ? maxX : maxZ;
  if (a % 3 !== 0 || a <= lo || a >= hi) continue;
  const gr = c.g;
  const top = tierOf.get(key);
  for (let y = gr + 1; y < top - 1; y++) {
    if ((y - gr) % 5 === 0) continue;
    put(x, y, z, "stone_bricks");
  }
}

// ---- warm lights behind some windows ---------------------------------------
for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.g;
  const top = tierOf.get(key);
  const exposed = DIRS.filter(d => !has(x + d.dx, z + d.dz));
  if (exposed.length !== 1) continue;
  const d = exposed[0];
  const a = d.dz !== 0 ? x : z;
  const lo = d.dz !== 0 ? minX : minZ;
  const hi = d.dz !== 0 ? maxX : maxZ;
  if (!(a % 3 === 1 && a > lo && a < hi)) continue;
  for (let storey = 0; ; storey++) {
    const b = gr + 5 * storey;
    if (b + 3 > top - 3) break;
    if ((a + storey) % 4 === 0) {
      const ix = x - d.dx, iz = z - d.dz;
      if (has(ix, iz)) put(ix, b + 2, iz, "glowstone");
    }
  }
}

// ---- entrance on the north face, with a canopy ----------------------------
{
  const dx = Math.floor((minX + maxX) / 2);
  const dz = minZ;
  if (has(dx, dz)) {
    const gr = cm.get(`${dx},${dz}`).g;
    const base = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(dx, gr + 1, dz, "dark_oak_door", { ...base, half: "lower" });
    put(dx, gr + 2, dz, "dark_oak_door", { ...base, half: "upper" });
    // Lintel slab over the door, and a stone-brick canopy step on the street side.
    put(dx, gr + 3, dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
    for (const ox of [-1, 1]) {
      if (has(dx + ox, dz)) {
        put(dx + ox, gr + 3, dz, "stone_brick_slab", { type: "top", waterlogged: "false" });
      }
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
