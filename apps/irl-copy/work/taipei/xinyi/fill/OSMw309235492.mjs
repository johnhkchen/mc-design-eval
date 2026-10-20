import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw309235492";
const W = 78, H = 162, D = 44;

// Materials: 1990s Xinyi office tower, blue-green tinted curtain wall on a granite base,
// light precast spandrels, white mullions, corner piers, stepped to a stone-clad crown.
const GLASS = "light_blue_stained_glass";
const SPAN = "light_gray_concrete";
const MULL = "white_concrete";
const PIER = "smooth_quartz";
const BASE = "polished_granite";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const CORE = "gray_concrete";
const CAP = "smooth_quartz";
const ROOF = "gray_concrete";
const SPIRE = "white_concrete";
const PLANT = "light_gray_concrete";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ground per footprint cell
const gnd = new Map();
for (const [x, z, gr] of cells) gnd.set(key(x, z), Math.max(0, Math.round(gr)));

// inset distance from the footprint edge (setback tiers follow this)
const dist = new Map();
const q = [];
for (const k of gnd.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (dirs.some(([dx, dz]) => !gnd.has(key(x + dx, z + dz)))) {
    dist.set(k, 0);
    q.push(k);
  }
}
for (let i = 0; i < q.length; i++) {
  const k = q[i];
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of dirs) {
    const nk = key(x + dx, z + dz);
    if (gnd.has(nk) && !dist.has(nk)) {
      dist.set(nk, dist.get(k) + 1);
      q.push(nk);
    }
  }
}

// storeys (5 blocks each) per tier: podium 6, tower 18, tower 26, crown 30 (~150 blocks)
function storeysFor(d) {
  if (d >= 14) return 30;
  if (d >= 9) return 26;
  if (d >= 4) return 18;
  return 6;
}

const top = new Map();
for (const [k, gr] of gnd) {
  const d = dist.get(k) ?? 0;
  top.set(k, Math.min(H - 2, gr + 5 * storeysFor(d)));
}

function isExp(x, z, y) {
  const k = key(x, z);
  if (!gnd.has(k)) return true;
  return y >= top.get(k);
}
function exposed(x, z, y) {
  return dirs.some(([dx, dz]) => isExp(x + dx, z + dz, y));
}

function put(x, y, z, id, props) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// entrance on the south face (+z), near the middle of that face
const southCells = cells
  .map(([x, z]) => [x, z])
  .filter(([x, z]) => !gnd.has(key(x, z + 1)));
let entX = null;
if (southCells.length) {
  const meanX = southCells.reduce((s, [x]) => s + x, 0) / southCells.length;
  entX = southCells.reduce((best, c) => (Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best))[0];
}
const entCells = new Set(
  southCells.filter(([x]) => entX !== null && Math.abs(x - entX) <= 1).map(([x, z]) => key(x, z))
);
const entDoor = southCells.find(([x]) => x === entX) ?? null;

// pass: foundations, storeys, core, caps, parapets, roof plant
for (const [k, gr] of gnd) {
  const [x, z] = k.split(",").map(Number);
  const d = dist.get(k) ?? 0;
  const T = top.get(k);
  const podiumOnly = storeysFor(d) === 6;

  // foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  // storeys
  for (let y = gr; y < T; y++) {
    const rel = y - gr;
    const s = Math.floor(rel / 5);
    const r = rel % 5;
    const ex = exposed(x, z, y);

    if (ex) {
      const faceX = isExp(x + 1, z, y) || isExp(x - 1, z, y);
      const faceZ = isExp(x, z + 1, y) || isExp(x, z - 1, y);
      const idx = faceX ? z : x;
      const corner = faceX && faceZ;
      const isEnt = s === 0 && entCells.has(k);
      let id;
      if (corner) {
        id = PIER; // full-height corner piers
      } else if (s === 0 && r <= 1) {
        id = BASE;
      } else if (r === 0) {
        id = SPAN;
      } else {
        id = idx % 3 === 0 ? MULL : GLASS;
      }
      // belt course every 4 storeys above the podium base
      if (!corner && r === 0 && s > 0 && s % 4 === 0) id = PIER;
      if (isEnt && s === 0 && r === 3) id = "smooth_quartz"; // canopy band over entrance
      put(x, y, z, id);
    } else if (d >= 6) {
      put(x, y, z, CORE);
    } else {
      // interior: floor plate at r0 and ceiling plate at r4, air gap between
      if (r === 0 || r === 4) put(x, y, z, FLOOR);
      else if (r === 2 && d <= 2 && ((x * 5 + z * 3 + s * 7) % 13 === 0)) put(x, y, z, "glowstone");
    }
  }

  // roof cap at top
  const capExposed = exposed(x, z, T);
  put(x, T, z, capExposed ? CAP : ROOF);

  // parapet on the outer perimeter
  if (d === 0 && T + 1 < H) put(x, T + 1, z, CAP);

  // roof plant boxes on the podium roof (interior cells, sparse)
  if (podiumOnly && d >= 1 && (x * 3 + z) % 7 === 0 && T + 2 < H) {
    put(x, T + 1, z, PLANT);
    put(x, T + 2, z, PLANT);
  }
}

// entrance: wide doorway with canopy and warm lanterns
if (entDoor) {
  const [ex, ez] = entDoor;
  const eg = gnd.get(key(ex, ez));
  // door on the centre cell
  put(ex, eg, ez, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, eg + 1, ez, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // flanking lanterns hanging under the canopy
  for (const dx of [-1, 1]) {
    const lx = ex + dx;
    const lz = southCells.find(([x]) => x === lx)?.[1];
    if (lz === undefined) continue;
    const lg = gnd.get(key(lx, lz));
    put(lx, lg + 2, lz, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// crown spire on the tallest cells, nearest the centroid
let maxT = 0;
for (const T of top.values()) maxT = Math.max(maxT, T);
const crown = [...top.entries()].filter(([, T]) => T === maxT).map(([k]) => k.split(",").map(Number));
if (crown.length) {
  const cx = crown.reduce((s, [x]) => s + x, 0) / crown.length;
  const cz = crown.reduce((s, [, z]) => s + z, 0) / crown.length;
  const [sx, sz] = crown.reduce((best, c) =>
    Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best);
  for (let y = maxT + 1; y <= Math.min(H - 2, maxT + 8); y++) put(sx, y, sz, SPIRE);
  const tip = Math.min(H - 1, maxT + 9);
  put(sx, tip, sz, "lightning_rod", { facing: "up", powered: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
