import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Cathay Financial Center, Xinyi, Taipei.
// Read as a late-2000s to 2010s glass office tower of about 29 storeys (roof ~147 blocks,
// 5 blocks per storey). Granite-clad podium with a shopfront and tinted entrance,
// light-blue glass curtain wall with pale frames and spandrels, stepped setbacks,
// a cyan-glass crown, a louvred plant penthouse and a thin mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309155290";
const W = 93, D = 164, H = 159;
const ROOF = 147;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const N = W * D;
const idx = (x, z) => x + z * W;
const inBox = (x, z) => x >= 0 && x < W && z >= 0 && z < D;

// ground per footprint cell (-1 = not in footprint)
const gnd = new Int32Array(N).fill(-1);
let minG = Infinity;
for (const [x, z, g] of cells) {
  if (!inBox(x, z)) continue;
  const gy = Math.round(g);
  gnd[idx(x, z)] = gy;
  if (gy < minG) minG = gy;
}
if (!Number.isFinite(minG)) minG = 0;
const inFp = (x, z) => inBox(x, z) && gnd[idx(x, z)] >= 0;

// Chebyshev distance from the footprint edge (1 = outer ring)
const dist = new Int32Array(N);
const q = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  let edge = false;
  for (let dz = -1; dz <= 1 && !edge; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!inFp(x + dx, z + dz)) { edge = true; break; }
  }
  if (edge) { dist[idx(x, z)] = 1; q.push([x, z]); }
}
for (let i = 0; i < q.length; i++) {
  const [x, z] = q[i];
  const d = dist[idx(x, z)];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz) || dist[idx(nx, nz)]) continue;
    dist[idx(nx, nz)] = d + 1;
    q.push([nx, nz]);
  }
}
// any unreached footprint cell (island) counts as outer ring
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (inFp(x, z) && !dist[idx(x, z)]) dist[idx(x, z)] = 1;
}

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (p) vox.set(x, y, z, id, p);
  else vox.set(x, y, z, id);
};

// entrance: centre of the outer edge on the lowest-z side
let zEdge = Infinity;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (inFp(x, z) && dist[idx(x, z)] === 1 && z < zEdge) zEdge = z;
}
let sx = 0, sn = 0;
for (let x = 0; x < W; x++) {
  if (inFp(x, zEdge) && dist[idx(x, zEdge)] === 1) { sx += x; sn++; }
}
const xc = sn ? sx / sn : W / 2;
const isEntrance = (x, z, e) => e === 1 && z === zEdge && Math.abs(x - xc) <= 4;

// stepped massing: offsets from the lowest ground, inset from the footprint edge
const TIERS = [
  { kind: "podium", from: 0,   to: 20,  inset: 0  },
  { kind: "tower",  from: 20,  to: 90,  inset: 6  },
  { kind: "upper",  from: 90,  to: 125, inset: 14 },
  { kind: "crown",  from: 125, to: 145, inset: 22 },
  { kind: "mech",   from: 145, to: 150, inset: 28 },
];

const MAT = {
  podium: { glass: "light_blue_stained_glass", spandrel: "polished_granite", slab: "smooth_quartz",     frame: "light_gray_concrete" },
  tower:  { glass: "light_blue_stained_glass", spandrel: "white_concrete",   slab: "smooth_quartz",     frame: "light_gray_concrete" },
  upper:  { glass: "light_blue_stained_glass", spandrel: "white_concrete",   slab: "smooth_quartz",     frame: "light_gray_concrete" },
  crown:  { glass: "cyan_stained_glass",       spandrel: "smooth_quartz",    slab: "smooth_quartz",     frame: "light_gray_concrete" },
  mech:   { glass: "iron_bars",                spandrel: "white_concrete",   slab: "light_gray_concrete", frame: "light_gray_concrete" },
};

// warm light just inside a window, on some bays only; always backed by a glass pane
const lightAt = (x, z, rel, e, ringE) => {
  if (e !== ringE + 1 || rel % 5 !== 2) return null;
  let backed = false;
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = x + dx, nz = z + dz;
    if (!inBox(nx, nz)) continue;
    if (dist[idx(nx, nz)] === ringE && !(nx % 4 === 0 || nz % 4 === 0)) backed = true;
  }
  if (!backed) return null;
  const h = (Math.floor(x / 4) * 7 + Math.floor(z / 4) * 3 + rel) % 3;
  return h === 0 ? "shroomlight" : h === 1 ? "glowstone" : null;
};

// ---- main build: every footprint column ----
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const gy = gnd[idx(x, z)];
  if (gy < 0) continue;
  const e = dist[idx(x, z)];

  // foundation up to this cell's ground
  for (let y = 0; y < gy && y < H; y++) put(x, y, z, "stone");

  for (const t of TIERS) {
    if (e <= t.inset) continue;
    const from = minG + t.from;
    const to = minG + t.to;
    const ringE = t.inset + 1;
    const ring = e === ringE;
    const M = MAT[t.kind];
    const start = Math.max(from, gy);

    for (let y = start; y <= to && y < H; y++) {
      const rel = y - from;
      const floorRow = y === gy || rel % 5 === 0;

      if (floorRow) {
        put(x, y, z, ring ? M.spandrel : M.slab);
        continue;
      }
      if (!ring) {
        if (t.kind !== "mech") {
          const L = lightAt(x, z, rel, e, ringE);
          if (L) put(x, y, z, L);
        }
        continue;
      }
      if (t.kind === "podium" && isEntrance(x, z, e)) {
        put(x, y, z, rel === 4 ? "polished_granite" : "tinted_glass");
        continue;
      }
      if (t.kind === "mech") {
        put(x, y, z, M.glass);
        continue;
      }
      if (x % 4 === 0 || z % 4 === 0) put(x, y, z, M.frame);
      else put(x, y, z, M.glass);
    }
  }
}

// parapet on the crown's outer ring
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (gnd[idx(x, z)] < 0) continue;
  if (dist[idx(x, z)] === 23) put(x, minG + 146, z, "white_concrete");
}

// thin mast on the plant penthouse, nearest the footprint centre
let cx = 0, cz = 0, cn = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (gnd[idx(x, z)] < 0) continue;
  cx += x; cz += z; cn++;
}
if (cn) {
  cx /= cn; cz /= cn;
  let best = null, bd = Infinity;
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (gnd[idx(x, z)] < 0 || dist[idx(x, z)] < 29) continue;
    const d = (x - cx) ** 2 + (z - cz) ** 2;
    if (d < bd) { bd = d; best = [x, z]; }
  }
  if (best) {
    const [mx, mz] = best;
    for (let y = minG + 151; y <= minG + 157; y++) put(mx, y, mz, "iron_bars");
    put(mx, minG + 158, mz, "lightning_rod");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
