import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// TPE107-0138-16F-2: 2018 Xinyi office/residential tower, 16 storeys (~5 blocks each),
// roof ~78 blocks above lowest ground. Light-blue glass curtain wall, pale concrete
// piers and spandrels, quartz corners, a shopfront base with a framed centre entrance
// under a projecting canopy, lit interiors seen through some bays, a parapet,
// and a set-back central penthouse with a mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE107-0138-16F-2";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 18, H = 90, D = 28;
const ROOF = 76;          // top of the main body (roof slab level)
const PH_BASE = ROOF + 1; // penthouse floor (77)
const PH_CAP = 81;        // penthouse roof cap
const MAST_TOP = 86;

const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const has = (x, z) => ground.has(key(x, z));

// Entrance: centre of the -z face (the street side of the footprint)
const midX = Math.floor(W / 2);
const isEntrance = (x, z) => !has(x, z - 1) && x >= midX - 1 && x <= midX + 1;
// Canopy wider than the doorway so it reads from the street
const isCanopy = (x, z) => !has(x, z - 1) && x >= midX - 2 && x <= midX + 2;
// Door frame piers flanking the doorway
const isDoorPier = (x, z) => !has(x, z - 1) && (x === midX - 2 || x === midX + 2);

// Penthouse footprint: cells with a full 7x7 block of footprint around them
const P = new Set();
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) {
  let ok = true;
  for (let dx = -3; dx <= 3 && ok; dx++)
    for (let dz = -3; dz <= 3 && ok; dz++)
      if (!has(x + dx, z + dz)) ok = false;
  if (ok) P.add(key(x, z));
}
const inP = (x, z) => P.has(key(x, z));

// Centre cell of the penthouse for the mast
let mast = null;
if (P.size) {
  let sx = 0, sz = 0;
  for (const k of P) { const [x, z] = k.split(",").map(Number); sx += x; sz += z; }
  sx /= P.size; sz /= P.size;
  let best = Infinity;
  for (const k of P) {
    const [x, z] = k.split(",").map(Number);
    const d = (x - sx) ** 2 + (z - sz) ** 2;
    if (d < best) { best = d; mast = [x, z]; }
  }
}

// 1. Foundation: solid from y 0 up to each cell's ground
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
}

// 2. Body
for (const [x, z, gr] of cells) {
  const edgeX = !has(x - 1, z) || !has(x + 1, z);
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const perim = edgeX || edgeZ;
  const corner = edgeX && edgeZ;
  // Facade bays run along the face: x-facing faces are bayed by z, others by x
  const along = edgeX ? z : x;
  const pillar = along % 3 === 0;

  // Inward direction for lanterns behind glass
  let dx = 0, dz = 0;
  if (!has(x - 1, z)) dx = 1; else if (!has(x + 1, z)) dx = -1;
  if (!has(x, z - 1)) dz = 1; else if (!has(x, z + 1)) dz = -1;

  const entr = perim && isEntrance(x, z);
  const canopy = perim && isCanopy(x, z);
  const doorPier = perim && isDoorPier(x, z);

  for (let y = gr; y <= ROOF; y++) {
    const rel = y - gr;
    const k = Math.floor(rel / 5);
    const line = rel % 5 === 0;

    if (y === ROOF) { g.set(x, y, z, "light_gray_concrete"); continue; }

    if (!perim) {
      // Interior: air, with a floor slab each storey
      if (line) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (canopy) {
      // Projecting canopy band over the entrance at storey 1 height
      if (rel === 4) { g.set(x, y, z, "white_concrete"); continue; }
      if (rel === 3 && !entr) { g.set(x, y, z, "white_concrete"); continue; }
    }

    if (entr) {
      if (rel === 0) { g.set(x, y, z, "quartz_block"); continue; }
      if (rel >= 1 && rel <= 2) { g.set(x, y, z, "glass"); continue; }   // glass door
      if (rel === 3) { g.set(x, y, z, "white_concrete"); continue; }     // door head
      if (rel === 4) { g.set(x, y, z, "white_concrete"); continue; }     // canopy
      if (line) { g.set(x, y, z, "light_gray_concrete"); continue; }
      g.set(x, y, z, "white_stained_glass");
      continue;
    }

    if (doorPier) {
      if (rel <= 4) { g.set(x, y, z, "quartz_block"); continue; }
    }

    if (corner) { g.set(x, y, z, "quartz_block"); continue; }

    if (line) {
      // Storey spandrels: pale on the base, darker band on alternate storeys for rhythm
      if (k === 0) g.set(x, y, z, "quartz_block");
      else g.set(x, y, z, k % 2 === 0 ? "light_gray_concrete" : "stone");
      continue;
    }

    if (pillar) { g.set(x, y, z, "white_concrete"); continue; }

    // Glass bay; ground storey is a clear shopfront
    g.set(x, y, z, k === 0 ? "white_stained_glass" : "light_blue_stained_glass");

    // Warm light: some bays have a lit office behind the glass
    if (rel % 5 === 2 && has(x + dx, z + dz) && ((x * 7 + z * 13 + k * 5) % 9 === 0)) {
      g.set(x + dx, y, z + dz, "sea_lantern");
    }
  }

  // Parapet on the main roof edge (not under the penthouse)
  if (perim && !inP(x, z)) {
    for (let y = ROOF + 1; y <= ROOF + 2; y++) {
      g.set(x, y, z, corner ? "quartz_block" : "light_gray_concrete");
    }
  }
}

// 3. Central penthouse, set back on the main roof
for (const k of P) {
  const [x, z] = k.split(",").map(Number);
  const edgeX = !inP(x - 1, z) || !inP(x + 1, z);
  const edgeZ = !inP(x, z - 1) || !inP(x, z + 1);
  const along = edgeX ? z : x;
  const corner = edgeX && edgeZ;
  const edge = edgeX || edgeZ;

  g.set(x, PH_BASE, z, "light_gray_concrete");
  g.set(x, PH_CAP, z, "light_gray_concrete");
  if (!edge) continue;
  for (let y = PH_BASE + 1; y < PH_CAP; y++) {
    if (corner) g.set(x, y, z, "quartz_block");
    else if (along % 3 === 0) g.set(x, y, z, "white_concrete");
    else g.set(x, y, z, "light_blue_stained_glass");
  }
}

// 4. Mast on the penthouse
if (mast) {
  const [mx, mz] = mast;
  for (let y = PH_CAP + 1; y <= MAST_TOP; y++) g.set(mx, y, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
