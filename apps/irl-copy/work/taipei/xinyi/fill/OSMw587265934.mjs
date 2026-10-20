import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise office/commercial block, Xinyi, c. 1995-2005:
// six storeys of ~5 blocks, white tile/concrete piers, blue-tinted glass,
// stone plinth and base course, cornice, parapet, rooftop plant.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265934";
const W = 23, H = 41, D = 13;
const ROOF = 29;                       // parapet top index (roof slab at 28)
const SLABS = [5, 10, 15, 20, 25, 28]; // floor / spandrel rows
const CORNICE = 27;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);

const ground = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? 0];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(27, Math.round(gr))));
}

const has = (x, z) => ground.has(`${x},${z}`);
const gOf = (x, z) => ground.get(`${x},${z}`);
const OUT = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

const facesOf = (x, z) =>
  Object.keys(OUT).filter((f) => !has(x + OUT[f][0], z + OUT[f][1]));
const primaryOf = (faces) =>
  faces.find((f) => f === "N" || f === "S") ?? faces[0];

// Per-face extent along the facade (N/S run along x, W/E run along z).
const faceRange = {};
const faceCount = { N: 0, S: 0, W: 0, E: 0 };
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const fs = facesOf(x, z);
  for (const f of fs) faceCount[f]++;
  if (!fs.length) continue;
  const p = primaryOf(fs);
  const i = p === "N" || p === "S" ? x : z;
  const r = faceRange[p] ?? (faceRange[p] = { lo: Infinity, hi: -Infinity });
  r.lo = Math.min(r.lo, i);
  r.hi = Math.max(r.hi, i);
}

// Front = face with most exposed cells (ties favour S).
const front = Object.keys(faceCount).sort((a, b) =>
  faceCount[b] - faceCount[a] || (a === "S" ? -1 : b === "S" ? 1 : 0))[0];
const frontCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => facesOf(x, z).includes(front));
const frontMid = front === "N" || front === "S"
  ? (faceRange[front]?.lo + faceRange[front]?.hi) / 2
  : (faceRange[front]?.lo + faceRange[front]?.hi) / 2;
const doorCell = frontCells.reduce((best, c) => {
  const i = front === "N" || front === "S" ? c[0] : c[1];
  const bi = front === "N" || front === "S" ? best[0] : best[1];
  return Math.abs(i - frontMid) < Math.abs(bi - frontMid) ? c : best;
}, frontCells[0]);
const doorKey = doorCell ? `${doorCell[0]},${doorCell[1]}` : null;
const doorFacing = { N: "north", S: "south", W: "west", E: "east" }[front];

const g = new Voxels([W, H, D]);
const S = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

function isPier(x, z, faces) {
  if (faces.length >= 2) return true;             // corner column
  const p = primaryOf(faces);
  const i = p === "N" || p === "S" ? x : z;
  const r = faceRange[p];
  return (i - r.lo) % 3 === 0 || i === r.hi;
}

function facade(x, z, gr, y, faces) {
  if (y === gr) return "polished_granite";        // plinth
  if (y === ROOF) return "white_concrete";        // parapet
  if (y === CORNICE) return "smooth_quartz";      // cornice
  if (SLABS.includes(y)) return "white_concrete"; // spandrel / floor line
  const pier = isPier(x, z, faces);
  if (y <= 4) {                                   // ground storey shopfront
    if (y === gr + 1) return "polished_andesite"; // base course
    return pier ? "white_concrete" : "light_blue_stained_glass";
  }
  const slab = Math.max(0, ...SLABS.filter((s) => s < y));
  if (y === slab + 1) return "smooth_quartz";     // sill
  return pier ? "white_concrete" : "light_blue_stained_glass";
}

// ---- Main pass: foundations, shell, interior slabs and columns ----
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const faces = facesOf(x, z);

  for (let y = 0; y < gr; y++) S(x, y, z, "stone_bricks");

  for (let y = gr; y <= ROOF; y++) {
    if (faces.length) {
      S(x, y, z, facade(x, z, gr, y, faces));
    } else {
      if (y === gr || (SLABS.includes(y) && y > gr)) S(x, y, z, "light_gray_concrete");
      if (x % 6 === 0 && z % 6 === 0 && y > gr && y <= 28) S(x, y, z, "white_concrete");
    }
  }

  if (key === doorKey) {
    S(x, gr + 1, z, "dark_oak_door", { facing: doorFacing, half: "lower", hinge: "left", open: "false", powered: "false" });
    S(x, gr + 2, z, "dark_oak_door", { facing: doorFacing, half: "upper", hinge: "left", open: "false", powered: "false" });
  }
}

// ---- Warm light behind some windows (inside the air gap) ----
for (const k of ground.keys()) {
  const [x, z] = k.split(",").map(Number);
  const faces = facesOf(x, z);
  if (!faces.length || faces.length >= 2) continue;
  const p = primaryOf(faces);
  const i = p === "N" || p === "S" ? x : z;
  const r = faceRange[p];
  if ((i - r.lo) % 6 !== 1) continue;
  const gr = gOf(x, z);
  for (let y = 6; y <= 26; y++) {
    if (SLABS.includes(y) || y === CORNICE || y === y % 5 && false) continue;
    const slab = Math.max(0, ...SLABS.filter((s) => s < y));
    if (y !== slab + 2 || y <= gr) continue;
    if (isPier(x, z, faces)) continue;
    const [ox, oz] = OUT[p];
    const ix = x - ox, iz = z - oz;
    if (!has(ix, iz)) continue;
    const useShroom = ((i - r.lo) / 6) % 2 === 1;
    S(ix, y, iz, useShroom ? "shroomlight" : "glowstone");
  }
}

// ---- Roof plant and mast ----
for (let x = 9; x <= 13; x++)
  for (let z = 4; z <= 8; z++)
    if (has(x, z)) for (let y = ROOF; y <= 31; y++) S(x, y, z, "light_gray_concrete");
if (has(11, 6)) {
  S(11, 32, 6, "lightning_rod");
  S(11, 33, 6, "lightning_rod");
}
if (has(4, 4)) S(4, ROOF, 4, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

g.save(`${DIR}/${ID}.nbt`);
