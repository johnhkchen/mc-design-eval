import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541458735";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 12, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup and lowest ground
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);
const G0 = Math.min(...cells.map((c) => c[2]));

// Storey levels (absolute y). Two storeys of ~5 blocks plus parapet, roof at G0+11.
const GF_TOP = G0 + 4;   // top of ground-floor glass
const F1 = G0 + 5;       // first-floor slab / storey band
const S2_LO = G0 + 6;    // second-storey window band
const S2_HI = G0 + 9;
const F2 = G0 + 10;      // roof slab / cornice
const ROOF = G0 + 11;    // parapet top

// Exposed faces: N = z-1, S = z+1, W = x-1, E = x+1
const DIRS = {
  N: { dx: 0, dz: -1, facing: "north", axisX: true },
  S: { dx: 0, dz: 1, facing: "south", axisX: true },
  W: { dx: -1, dz: 0, facing: "west", axisX: false },
  E: { dx: 1, dz: 0, facing: "east", axisX: false },
};
const faceOf = new Map();
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  const f = [];
  for (const k of ["N", "S", "W", "E"]) {
    const d = DIRS[k];
    if (!has(x + d.dx, z + d.dz)) f.push(k);
  }
  faceOf.set(`${x},${z}`, f);
}

// Along-face extents per face
const lo = {}, hi = {};
for (const k of ["N", "S", "W", "E"]) {
  const vals = [];
  for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
    if (faceOf.get(`${x},${z}`).includes(k)) vals.push(DIRS[k].axisX ? x : z);
  }
  if (vals.length) { lo[k] = Math.min(...vals); hi[k] = Math.max(...vals); }
}

// Front (street) face: prefer south, else first exposed
const front = faceOf.size && ["S", "N", "E", "W"].find((k) => lo[k] !== undefined);
const frontMid = front !== undefined ? Math.floor((lo[front] + hi[front]) / 2) : -1;
const alongOf = (k, x, z) => (DIRS[k].axisX ? x : z);

// Door cell: boundary cell on the front face at the middle
let doorKey = null;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (front && faceOf.get(`${x},${z}`).includes(front) && alongOf(front, x, z) === frontMid) {
    doorKey = `${x},${z}`;
  }
}

const paneProps = (k) =>
  DIRS[k].axisX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const glowSpots = [];

// Build every footprint cell
for (const [x, z, gy] of cells) {
  const key = `${x},${z}`;
  const faces = faceOf.get(key);
  const bnd = faces.length > 0;

  // Foundation under the cell, then base course / floor at its own ground
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
  g.set(x, gy, z, bnd ? "polished_andesite" : "smooth_stone");

  if (!bnd) {
    // Interior: floor slabs per storey and roof deck; air between
    if (F1 > gy) g.set(x, F1, z, "smooth_stone");
    if (F2 > gy) g.set(x, F2, z, "smooth_stone");
    g.set(x, ROOF, z, "gray_concrete");
    continue;
  }

  // Boundary: pick primary face for articulation
  const k = faces.includes("S") ? "S" : faces.includes("N") ? "N" : faces[0];
  const a = alongOf(k, x, z);
  const i = a - lo[k];
  const corner = faces.length > 1;
  const pier = corner || i % 3 === 0 || a === hi[k];
  const isDoor = key === doorKey;

  for (let y = gy + 1; y <= ROOF; y++) {
    if (y === ROOF) { g.set(x, y, z, "white_concrete"); continue; }   // parapet
    if (y === F2) { g.set(x, y, z, "stone_bricks"); continue; }       // cornice
    if (y === F1) { g.set(x, y, z, "smooth_stone"); continue; }       // storey band

    if (y <= GF_TOP) {
      // Ground floor shopfront
      if (isDoor && (y === gy + 1 || y === gy + 2)) {
        g.set(x, y, z, "oak_door", {
          facing: DIRS[k].facing,
          half: y === gy + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
      } else if (pier || (isDoor && k === front)) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass_pane", paneProps(k));
        if (i % 4 === 2 && y === gy + 2) glowSpots.push([x, z, k, y]);
      }
      continue;
    }

    if (y >= S2_LO && y <= S2_HI) {
      // Upper storey windows
      if (pier) {
        g.set(x, y, z, "white_concrete");
      } else {
        g.set(x, y, z, "glass_pane", paneProps(k));
        if (i % 6 === 1 && y === S2_LO + 1) glowSpots.push([x, z, k, y]);
      }
    }
  }
}

// Warm light behind some windows (inside air gap, on interior cell)
for (const [x, z, k, y] of glowSpots) {
  const d = DIRS[k];
  const ix = x - d.dx, iz = z - d.dz;
  if (!has(ix, iz)) continue;
  if (faceOf.get(`${ix},${iz}`).length) continue; // only interior cells
  g.set(ix, y, iz, "glowstone");
}

// Roof plant: small block on the roof near the centroid, interior cells only
const cx = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const cz = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let best = null, bestD = Infinity;
for (const [x, z] of cells.map((c) => [c[0], c[1]])) {
  if (faceOf.get(`${x},${z}`).length) continue;
  const d = (x - cx) ** 2 + (z - cz) ** 2;
  if (d < bestD) { bestD = d; best = [x, z]; }
}
if (best) {
  const [bx, bz] = best;
  for (let dx = 0; dx <= 1; dx++) {
    const x = bx + dx;
    if (!has(x, bz) || faceOf.get(`${x},${bz}`).length) continue;
    g.set(x, ROOF + 1, bz, "light_gray_concrete");
    g.set(x, ROOF + 2, bz, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
