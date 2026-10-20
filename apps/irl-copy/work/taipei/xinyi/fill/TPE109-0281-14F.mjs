import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE109-0281-14F";
const W = 43, D = 31, H = 81;
const ROOF = 69;      // roof surface y (about 69 blocks above lowest ground)
const STOREY = 5;     // 14 storeys of about 5 blocks

// ---- read footprint: [x, z, ground] per cell ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);
const GR = new Map();
for (const c of list) {
  const [x, z, gnd] = Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? 0];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  GR.set(`${x},${z}`, Math.max(0, Math.min(58, Math.round(gnd ?? 0))));
}

const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => GR.has(key(x, z));
const ground = (x, z) => GR.get(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const cellList = [...GR.keys()].map((k) => k.split(",").map(Number));

// ---- distance inward from the outer edge of the footprint (edge cells = 1) ----
const DIST = new Map();
const queue = [];
for (const [x, z] of cellList) {
  if (NB.some(([dx, dz]) => !inFp(x + dx, z + dz))) {
    DIST.set(key(x, z), 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = DIST.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz, nk = key(nx, nz);
    if (inFp(nx, nz) && !DIST.has(nk)) {
      DIST.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dist = (x, z) => DIST.get(key(x, z)) ?? 3;

// ---- setback tiers: full height to y 59; inset 3 for 60..64; inset 5 for 65..69 ----
function tierOK(d, y) {
  if (y <= 59) return true;
  if (y <= 64) return d >= 3;
  return d >= 5;
}
function present(x, z, y) {
  if (!inFp(x, z)) return false;
  if (y > ROOF) return false;
  const gr = ground(x, z);
  if (y < gr) return false;
  return tierOK(dist(x, z), y);
}
function missing(x, z, y) {
  return NB.filter(([dx, dz]) => !present(x + dx, z + dz, y));
}
function exterior(x, z, y) {
  return present(x, z, y) && missing(x, z, y).length > 0;
}
function interiorNb(x, z, y) {
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (present(nx, nz, y) && !exterior(nx, nz, y)) return [nx, nz];
  }
  return null;
}
const isSlab = (y) => y >= 0 && y <= ROOF && (ROOF - y) % STOREY === 0;

// ---- centroid and entrance (south-facing edge, centred) ----
const cx = cellList.reduce((s, [x]) => s + x, 0) / cellList.length;
const cz = cellList.reduce((s, [, z]) => s + z, 0) / cellList.length;
let ring = cellList.filter(([x, z]) => dist(x, z) === 1 && !inFp(x, z + 1));
if (!ring.length) ring = cellList.filter(([x, z]) => dist(x, z) === 1);
ring.sort((a, b) => Math.abs(a[0] - cx) - Math.abs(b[0] - cx));
const ENTR = new Set(ring.slice(0, 3).map(([x, z]) => key(x, z)));

const vox = new Voxels([W, H, D]);

// ---- foundation, ground slab, storeys, facades, windows ----
for (const [x, z] of cellList) {
  const gr = ground(x, z);
  const k = key(x, z);
  for (let y = 0; y < gr; y++) vox.set(x, y, z, "stone_bricks");
  vox.set(x, gr, z, "smooth_stone");

  for (let y = gr + 1; y <= ROOF; y++) {
    if (!present(x, z, y)) continue;
    const ext = exterior(x, z, y);

    if (isSlab(y)) {
      vox.set(x, y, z, ext ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (!ext) continue; // air gap behind the glass

    const base = y <= gr + 4;
    if (base && ENTR.has(k)) {
      if (y <= gr + 3) continue;                 // entrance opening
      if (y === gr + 4) {                        // quartz lintel over the door
        vox.set(x, y, z, "smooth_quartz");
        continue;
      }
    }
    if (base && y === gr + 1) {
      vox.set(x, y, z, "stone_bricks"); // base course
      continue;
    }

    const m = missing(x, z, y);
    const xFace = m.some(([dx]) => dx !== 0);
    const fin = xFace ? (z % 3 === 0) : (x % 3 === 0);
    if (fin) {
      vox.set(x, y, z, "white_concrete");
      continue;
    }
    vox.set(x, y, z, "light_blue_stained_glass");

    // warm light behind some windows, standing on the floor slab
    const sb = ROOF - STOREY * (Math.floor((ROOF - y) / STOREY) + 1);
    if (y === sb + 1) {
      const h = (Math.imul(x, 73856093) ^ Math.imul(z, 19349663) ^ Math.imul(y, 83492791)) >>> 0;
      if (h % 7 === 0) {
        const n = interiorNb(x, z, y);
        if (n) vox.set(n[0], y, n[1], "glowstone");
      }
    }
  }

  // lit lobby behind the entrance opening
  if (ENTR.has(k)) {
    const n = interiorNb(x, z, gr + 1);
    if (n) vox.set(n[0], gr + 1, n[1], "glowstone");
  }
}

// ---- terrace parapets and roof parapet ----
for (const [x, z] of cellList) {
  for (const Y of [59, 64, 69]) {
    if (!present(x, z, Y) || present(x, z, Y + 1)) continue;
    if (Y === ROOF) {
      if (exterior(x, z, ROOF)) vox.set(x, ROOF + 1, z, "smooth_quartz");
    } else if (NB.some(([dx, dz]) => present(x + dx, z + dz, Y + 1))) {
      vox.set(x, Y + 1, z, "smooth_quartz");
    }
  }
}

// ---- roof plant ----
for (const [x, z] of cellList) {
  if (!present(x, z, ROOF) || exterior(x, z, ROOF)) continue;
  if (dist(x, z) >= 7 && (x * 2 + z * 3) % 13 === 0) {
    vox.set(x, ROOF + 1, z, "light_gray_concrete");
    vox.set(x, ROOF + 2, z, "light_gray_concrete");
  }
}

// ---- crown: stepped pinnacle on the deepest roof cell nearest the centroid ----
let best = null, bestScore = -Infinity;
for (const [x, z] of cellList) {
  if (!present(x, z, ROOF)) continue;
  const score = dist(x, z) - 0.01 * Math.hypot(x - cx, z - cz);
  if (score > bestScore) { bestScore = score; best = [x, z]; }
}
if (best) {
  const [px, pz] = best;
  for (let dx = -1; dx <= 1; dx++) {
    for (let dz = -1; dz <= 1; dz++) {
      if (!present(px + dx, pz + dz, ROOF)) continue;
      for (const y of [70, 71]) vox.set(px + dx, y, pz + dz, "white_concrete");
    }
  }
  for (let y = 72; y <= 76; y++) vox.set(px, y, pz, "light_blue_stained_glass");
  vox.set(px, 77, pz, "shroomlight");
  vox.set(px, 78, pz, "lightning_rod");
}

vox.save(`${DIR}/${ID}.nbt`);
