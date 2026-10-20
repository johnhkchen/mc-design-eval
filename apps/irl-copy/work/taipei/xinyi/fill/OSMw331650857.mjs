import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw331650857";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 36, H = 71, D = 26;
const g = new Voxels([W, H, D]);

// ---- footprint and ground ----
const key = (x, z) => `${x},${z}`;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
let minG = Infinity;
for (const [, , gr] of cells) minG = Math.min(minG, gr);
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr - minG);
const has = (x, z) => ground.has(key(x, z));
const gOf = (x, z) => ground.get(key(x, z));

// distance (in cells) from the exterior of the footprint
const dist = new Map();
const queue = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (NB.some(([dx, dz]) => !has(x + dx, z + dz))) {
    dist.set(k, 0);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dOf = (x, z) => dist.get(key(x, z)) ?? 0;

// ---- constants ----
const ROOF = 59;        // top of the main body
const TIER_Y = 45;      // setback level
const TIER_D = 3;       // upper tier is inset 3 cells from the edge
const CENTRE = [18, 13];

const put = (x, y, z, id, props) => {
  if (!has(x, z)) return;
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const outwardOf = (x, z) => {
  const d = dOf(x, z);
  for (const [dx, dz] of NB) {
    if (!has(x + dx, z + dz) || dOf(x + dx, z + dz) < d) return [dx, dz];
  }
  return [0, 0];
};

// ---- entrance: centre of the +z face, five cells wide ----
const southEdge = [];
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (dOf(x, z) === 0 && !has(x, z + 1)) southEdge.push(x);
}
southEdge.sort((a, b) => a - b);
const cx = southEdge.length ? southEdge[Math.floor(southEdge.length / 2)] : 18;
const entranceCell = (x, z) =>
  dOf(x, z) === 0 && !has(x, z + 1) && Math.abs(x - cx) <= 3;
const entranceBackCell = (x, z) =>
  dOf(x, z) === 1 && has(x, z + 1) && Math.abs(x - cx) <= 3 && !has(x, z + 2) ? false
    : (dOf(x, z) === 1 && Math.abs(x - cx) <= 3 && has(x, z + 1) && !has(x, z + 2));

// ---- mast position: deepest tier cell nearest the centre ----
let mast = null, mastD = -1, mastDist = Infinity;
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const d = dOf(x, z);
  if (d < TIER_D) continue;
  const dc = Math.hypot(x - CENTRE[0], z - CENTRE[1]);
  if (d > mastD || (d === mastD && dc < mastDist)) {
    mast = [x, z]; mastD = d; mastDist = dc;
  }
}

// ---- palette ----
const BASE = "polished_granite";
const PIER = "white_concrete";
const SPANDREL = "smooth_quartz";
const GLASS = "light_blue_stained_glass";
const LIT = "glowstone";
const SLAB = "light_gray_concrete";
const PARAPET = "white_concrete";
const FOUND = "stone";
const PLANT = "smooth_stone";

const lit = (x, z, sb) => (x * 7 + z * 13 + sb) % 11 === 0;

// ---- pass 1: foundations, ground and floor slabs, roof caps ----
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gc = gOf(x, z);
  const d = dOf(x, z);

  for (let y = 0; y < gc; y++) put(x, y, z, FOUND);

  // ground-level floor slab for every cell (interior too)
  put(x, gc, z, SLAB);

  for (let yy = 5; yy <= 55; yy += 5) {
    if (yy <= gc || yy >= ROOF) continue;
    if (yy < TIER_Y || yy === TIER_Y || d >= TIER_D) put(x, yy, z, SLAB);
  }

  if (d >= TIER_D && gc < ROOF) put(x, ROOF, z, SLAB);
}

// ---- pass 2: facades ----
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gc = gOf(x, z);
  const d = dOf(x, z);
  if (gc > ROOF) continue;

  const [odx, odz] = outwardOf(x, z);
  const alongX = odz !== 0;
  const idx = alongX ? x : z;

  for (let y = gc; y <= ROOF - 1; y++) {
    const lowerFacade = d === 0 && y <= TIER_Y - 1;
    const tierFacade = d === TIER_D && y >= TIER_Y + 1 && y <= ROOF - 1;
    if (!lowerFacade && !tierFacade) continue;

    // entrance opening
    if (entranceCell(x, z)) {
      if (y >= gc + 1 && y <= gc + 3) continue;
      if (y === gc + 4) { put(x, y, z, SPANDREL); continue; }
    }

    if (y === gc) { put(x, y, z, BASE); continue; }

    const sb = Math.floor(y / 5) * 5;
    const jj = y - sb;
    if (jj === 0 || jj === 4) { put(x, y, z, SPANDREL); continue; }
    if (idx % 3 === 0) { put(x, y, z, PIER); continue; }
    if (jj === 2 && lit(x, z, sb)) { put(x, y, z, LIT); continue; }
    put(x, y, z, GLASS);
  }

  // entrance canopy over the opening (outer and first interior cell)
  if (entranceCell(x, z) || (dOf(x, z) === 1 && Math.abs(x - cx) <= 3 && has(x, z + 1) && !has(x, z + 2))) {
    put(x, gc + 4, z, SPANDREL);
  }

  // parapets
  if (d === 0 && gc < TIER_Y) put(x, TIER_Y + 1, z, PARAPET);
  if (d === TIER_D) put(x, ROOF + 1, z, PARAPET);
}

// hanging lanterns under the canopy, at the entrance centre and both ends
for (const x of [cx - 2, cx, cx + 2]) {
  for (const k of ground.keys()) {
    const [kx, kz] = k.split(",").map(Number);
    if (kx === x && entranceCell(kx, kz)) {
      const gc = gOf(kx, kz);
      put(kx, gc + 3, kz, "lantern", { hanging: "true" });
    }
  }
}

// ---- pass 3: lower terrace plant and tier roof plant ----
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const gc = gOf(x, z);
  const d = dOf(x, z);
  if (gc > TIER_Y) continue;

  if (d === 1 && x % 6 === 3 && z % 5 === 2) {
    put(x, TIER_Y + 1, z, PLANT);
    put(x, TIER_Y + 2, z, PLANT);
  }

  if (d >= 6 && x % 5 < 2 && !(mast && mast[0] === x && mast[1] === z)) {
    put(x, ROOF + 1, z, SPANDREL);
    put(x, ROOF + 2, z, SPANDREL);
    put(x, ROOF + 3, z, SPANDREL);
  }
}

// mast and beacon
if (mast) {
  const [mx, mz] = mast;
  for (let y = ROOF + 1; y <= ROOF + 8; y++) put(mx, y, mz, "lightning_rod");
  put(mx, ROOF + 9, mz, "sea_lantern");
}

g.save(`${DIR}/${ID}.nbt`);
