import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Unrecorded mid-rise office block, c. 1990s-2000s Taipei: stone-clad ground storey
// with shopfronts, grey-concrete and glass-band office floors, a stepped roof
// (ring at 30, core at 35) with plant, and a mast on the core roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw370537815";
const W = 61, H = 47, D = 25;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const vox = new Voxels([W, H, D]);

// ---- footprint and ground heights -------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(30, Math.round(gr))));
}
const key = (x, z) => `${x},${z}`;
const inFp = (x, z) => ground.has(key(x, z));
const gy = (x, z) => ground.get(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => NB.some(([dx, dz]) => !inFp(x + dx, z + dz));
const cellList = () => [...ground.keys()].map((k) => k.split(",").map(Number));

// ---- depth from the outline: ring = 1..4, core = 5+ --------------------------
const dist = new Map();
const queue = [];
for (const [x, z] of cellList()) {
  if (isEdge(x, z)) { dist.set(key(x, z), 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(key(x, z));
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inFp(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push([nx, nz]);
    }
  }
}
const depth = (x, z) => dist.get(key(x, z)) ?? 1;
// Roof tops (multiples of 5): ring 30, core 35 (matches the ~35 block lidar roof).
const topOf = (x, z) => (depth(x, z) < 5 ? 30 : 35);

// A wall face exists at height y if the cell is on the footprint edge, or it stands
// above a neighbouring lower roof.
const isExt = (x, z, y) => {
  if (isEdge(x, z)) return true;
  const T = topOf(x, z);
  return NB.some(([dx, dz]) => {
    const nx = x + dx, nz = z + dz;
    return inFp(nx, nz) && topOf(nx, nz) < T && y > topOf(nx, nz);
  });
};

// ---- ground-floor entrance: the busiest street face, middle of that face ----
const faceCount = NB.map(([dx, dz]) =>
  cellList().filter(([x, z]) => isEdge(x, z) && !inFp(x + dx, z + dz)));
let bestDir = 0;
for (let i = 1; i < NB.length; i++) if (faceCount[i].length > faceCount[bestDir].length) bestDir = i;
const [bdx] = NB[bestDir];
const face = faceCount[bestDir];
const along = ([x, z]) => (bdx !== 0 ? z : x);
const entrance = new Set();
const jambs = new Set();
let entranceCentre = null;
if (face.length) {
  const mean = face.reduce((s, c) => s + along(c), 0) / face.length;
  const a0 = face.reduce((best, c) =>
    Math.abs(along(c) - mean) < Math.abs(along(best) - mean) ? c : best);
  entranceCentre = a0;
  for (const c of face) {
    const d = Math.abs(along(c) - along(a0));
    if (d <= 1) entrance.add(key(c[0], c[1]));
    else if (d === 2) jambs.add(key(c[0], c[1]));
  }
}
const isEntrance = (x, z) => entrance.has(key(x, z));
const isJamb = (x, z) => jambs.has(key(x, z));

// ---- main pass ----------------------------------------------------------------
for (const [x, z] of cellList()) {
  const g0 = gy(x, z);
  const T = topOf(x, z);

  // foundation
  for (let y = 0; y < g0; y++) vox.set(x, y, z, "stone_bricks");

  for (let y = g0; y <= T; y++) {
    const ext = isExt(x, z, y);
    const k = Math.floor(y / 5);
    const r = y % 5;

    // floor slabs / belt courses at every storey line, incl. roofs
    if (r === 0) {
      vox.set(x, y, z, ext ? "smooth_stone" : "light_gray_concrete");
      continue;
    }
    if (!ext) continue; // interior: air behind the glass

    if (r === 4) {
      vox.set(x, y, z, "white_concrete"); // spandrel / storey line
      continue;
    }

    if (k === 0) {
      // ground storey: stone portal around the doorway, shopfront glass elsewhere
      if (isEntrance(x, z)) {
        const isCentre = entranceCentre && x === entranceCentre[0] && z === entranceCentre[1];
        if (r === 3) {
          if (isCentre) vox.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
          else vox.set(x, y, z, "smooth_stone");
        }
        continue; // r 1..2: open doorway
      }
      if (isJamb(x, z)) { vox.set(x, y, z, "polished_andesite"); continue; }
      if (r === 3) { vox.set(x, y, z, "smooth_stone"); continue; } // fascia
      vox.set(x, y, z, (x + z) % 4 === 0 ? "smooth_stone" : "glass");
      continue;
    }

    // office floors: full-height pilasters on a 6-cell rhythm, glass bands between
    if ((x + z) % 6 === 0) { vox.set(x, y, z, "light_gray_concrete"); continue; }
    vox.set(x, y, z, (x + z) % 3 === 0 ? "white_concrete" : "light_blue_stained_glass_pane");
  }

  // parapet / cornice on exposed roof edges
  if (isEdge(x, z) || NB.some(([dx, dz]) => inFp(x + dx, z + dz) && topOf(x + dx, z + dz) < T)) {
    vox.set(x, T + 1, z, "smooth_stone");
  }
}

// ---- warm light behind some office windows (glowstone in the air gap) -------
for (const [x, z] of cellList()) {
  const g0 = gy(x, z);
  const T = topOf(x, z);
  for (let y = Math.max(g0, 6); y <= T; y++) {
    if (y % 5 !== 2) continue;
    if (!isExt(x, z, y) || (x + z) % 3 === 0 || (x + z) % 6 === 0) continue;
    if (((x * 5 + z * 3 + Math.floor(y / 5)) % 4) !== 0) continue;
    for (const [dx, dz] of NB) {
      const nx = x + dx, nz = z + dz;
      if (!inFp(nx, nz)) continue;
      if (y < gy(nx, nz) || y > topOf(nx, nz)) continue;
      if (isExt(nx, nz, y)) continue;
      vox.set(nx, y, nz, "glowstone");
      break;
    }
  }
}

// ---- rooftop plant on the ring roof ------------------------------------------
for (const [x, z] of cellList()) {
  if (topOf(x, z) !== 30 || isEdge(x, z)) continue;
  if (isExt(x, z, 31)) continue;
  if (x % 7 === 3 && z % 5 === 2) {
    vox.set(x, 31, z, "smooth_stone");
    vox.set(x, 32, z, "light_gray_concrete");
  }
}

// ---- mast on the deepest core cell -------------------------------------------
let mastCell = null;
for (const [x, z] of cellList()) {
  if (topOf(x, z) !== 35) continue;
  if (!mastCell || depth(x, z) > depth(mastCell[0], mastCell[1])) mastCell = [x, z];
}
if (mastCell) {
  const [mx, mz] = mastCell;
  for (let y = 36; y <= 39; y++) vox.set(mx, y, mz, "iron_block");
  vox.set(mx, 40, mz, "end_rod");
}

vox.save(`${DIR}/${ID}.nbt`);
