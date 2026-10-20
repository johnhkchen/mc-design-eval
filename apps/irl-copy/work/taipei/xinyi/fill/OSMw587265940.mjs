import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587265940.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw587265940.nbt";

const W = 32, H = 33, D = 17;
const TOP = 19;      // roof deck level
const PARAPET = 20;  // parapet / plant level
const cells = JSON.parse(readFileSync(CELLS, "utf8"));

// footprint lookup: "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => G.has(`${x},${z}`);

// per-cell facade info
function info(x, z) {
  const oN = !has(x, z - 1), oS = !has(x, z + 1), oW = !has(x - 1, z), oE = !has(x + 1, z);
  const count = +oN + +oS + +oW + +oE;
  const boundary = count > 0;
  const corner = (oN || oS) && (oW || oE);
  let ox = 0, oz = 0;
  if (oN) oz = -1; else if (oS) oz = 1; else if (oW) ox = -1; else if (oE) ox = 1;
  const along = (oN || oS) ? x : z;
  const pillar = corner || (boundary && along % 3 === 0);
  return { oN, oS, oW, oE, boundary, corner, ox, oz, along, pillar };
}

// storey floor level for a height y
function floorOf(y) { return y >= 15 ? 15 : y >= 10 ? 10 : y >= 5 ? 5 : 0; }

// choose entrance: the face with the most single-outward cells, its middle cell
const faces = { north: [], south: [], west: [], east: [] };
for (const [x, z] of G.keys().map(k => k.split(",").map(Number))) {
  const i = info(x, z);
  if (!i.boundary || i.corner) continue;
  if (i.oN) faces.north.push([x, z]);
  else if (i.oS) faces.south.push([x, z]);
  else if (i.oW) faces.west.push([x, z]);
  else if (i.oE) faces.east.push([x, z]);
}
let doorKey = null, doorFacing = "south";
let bestFace = Object.entries(faces).sort((a, b) => b[1].length - a[1].length)[0];
if (bestFace && bestFace[1].length) {
  const list = bestFace[1].sort((a, b) =>
    (bestFace[0] === "north" || bestFace[0] === "south") ? a[0] - b[0] : a[1] - b[1]);
  const mid = list[Math.floor(list.length / 2)];
  doorKey = `${mid[0]},${mid[1]}`;
  doorFacing = bestFace[0];
}

// lightning rod: interior cell nearest the footprint centroid
let cx = 0, cz = 0;
for (const k of G.keys()) { const [x, z] = k.split(",").map(Number); cx += x; cz += z; }
cx /= G.size; cz /= G.size;
let rodCell = null, rodD = Infinity;
for (const k of G.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (info(x, z).boundary) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < rodD) { rodD = d; rodCell = [x, z]; }
}

const g = new Voxels([W, H, D]);

// ---- main column build ----
for (const [key, gr] of G) {
  const [x, z] = key.split(",").map(Number);
  const ground = Math.min(gr, H - 1);
  const i = info(x, z);

  // foundation up to local ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  if (ground > TOP) continue;

  // base course / interior floor at local ground
  g.set(x, ground, z, i.boundary ? "polished_granite" : "light_gray_concrete");

  for (let y = ground + 1; y <= TOP; y++) {
    const F = floorOf(y);
    const rel = y - F;

    // storey floor slab
    if (y % 5 === 0 && y > 0 && y < TOP) {
      g.set(x, y, z, i.boundary ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    // roof deck
    if (y === TOP) {
      g.set(x, y, z, i.boundary ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (!i.boundary) continue; // air gap behind the facade

    // entrance
    if (key === doorKey && (y === ground + 1 || y === ground + 2)) {
      const half = y === ground + 1 ? "lower" : "upper";
      g.set(x, y, z, "oak_door", { facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (i.pillar) { g.set(x, y, z, "white_concrete"); continue; }
    if (rel === 4) { g.set(x, y, z, "smooth_quartz"); continue; }
    if (rel >= 1 && rel <= 3) {
      g.set(x, y, z, y <= 4 ? "glass" : "light_blue_stained_glass");
    }
  }

  // parapet cap
  if (i.boundary) g.set(x, PARAPET, z, "smooth_quartz");
}

// ---- roof plant on interior cells ----
for (const key of G.keys()) {
  const [x, z] = key.split(",").map(Number);
  const i = info(x, z);
  if (i.boundary) continue;
  if ((x * 3 + z * 5) % 11 === 0 && G.get(key) <= TOP - 1) {
    g.set(x, PARAPET, z, "light_gray_concrete");
    g.set(x, PARAPET + 1, z, "gray_concrete");
  }
}

// ---- warm lights standing behind window glass ----
for (const key of G.keys()) {
  const [x, z] = key.split(",").map(Number);
  const i = info(x, z);
  if (!i.boundary || i.corner) continue;
  const ground = Math.min(G.get(key), H - 1);
  const ix = x - i.ox, iz = z - i.oz;
  if (!has(ix, iz) || info(ix, iz).boundary) continue;
  for (let y = ground + 1; y < TOP; y++) {
    const F = floorOf(y), rel = y - F;
    if (rel !== 2) continue;
    if (i.pillar || (key === doorKey)) continue;
    if (((i.along + F) % 2) !== 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// ---- lightning rod mast ----
if (rodCell) {
  for (let y = PARAPET; y <= PARAPET + 3; y++) {
    g.set(rodCell[0], y, rodCell[1], "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(OUT);
