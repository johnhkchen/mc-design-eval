import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw462702685";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 58, D = 36, H = 47;
const ROOF = 35;                       // roof slab level above lowest ground
const g = new Voxels([W, H, D]);

// Palette: cream ceramic-tile walls, white pilasters, grey concrete bands,
// blue-tinted glazing, stone base; typical 1980s Taipei residential/commercial mid-rise.
const WALL = "smooth_quartz";
const PILLAR = "white_concrete";
const BASE = "stone_bricks";
const SLAB = "light_gray_concrete";
const LINTEL = "light_gray_concrete";
const GLASS = "light_blue_stained_glass";
const ROOFMAT = "gray_concrete";
const PARAPET = "white_concrete";

const key = (x, z) => x + "," + z;
const GR = new Map();
for (const [x, z, gr] of cells) GR.set(key(x, z), Math.round(gr));
const has = (x, z) => GR.has(key(x, z));
const gnd = (x, z) => GR.get(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Floor levels per cell: its own ground plus every 5-block storey line above it, up to the roof.
const levelsFor = (gr) => {
  const s = new Set([gr]);
  for (let k = 1; k * 5 <= ROOF; k++) if (k * 5 > gr) s.add(k * 5);
  s.add(ROOF);
  return [...s].sort((a, b) => a - b);
};

// 1. Foundations, floor slabs, storey walls and facade.
for (const [x, z, gr] of cells) {
  const X = Math.round(x), Z = Math.round(z);
  const L = levelsFor(gnd(X, Z));
  const edge = isEdge(X, Z);

  for (let y = 0; y < gr; y++) g.set(X, y, Z, BASE);
  for (const lv of L) g.set(X, lv, Z, lv === ROOF ? ROOFMAT : SLAB);

  if (edge) {
    for (let i = 0; i < L.length - 1; i++) {
      const La = L[i], Lb = L[i + 1];
      for (let r = La + 1; r <= Lb - 1; r++) {
        const p = (X + Z) % 4;
        let mat;
        if (p === 0) mat = PILLAR;
        else if (p === 3) mat = WALL;
        else if (r === Lb - 1 && Lb - La >= 3) mat = LINTEL;
        else if (r <= Lb - 2 && Lb - La >= 3) mat = GLASS;
        else mat = WALL;
        g.set(X, r, Z, mat);
      }
    }
    // Cornice-style parapet above roof slab.
    g.set(X, ROOF + 1, Z, PARAPET);
  }
}

// 2. Warm light behind some windows (shroomlight in the room just inside the glass).
for (const [x, z, gr] of cells) {
  const X = Math.round(x), Z = Math.round(z);
  if (!isEdge(X, Z)) continue;
  if ((X + Z) % 4 === 0 || (X + Z) % 4 === 3) continue;
  if (((X * 7 + Z * 13) % 9) !== 0) continue;
  const L = levelsFor(gnd(X, Z));
  for (let i = 0; i < L.length - 1; i++) {
    const La = L[i], Lb = L[i + 1];
    if (Lb - La < 4 || La + 2 > Lb - 2) continue;
    for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
      const nx = X + dx, nz = Z + dz;
      if (has(nx, nz) && !isEdge(nx, nz)) {
        g.set(nx, La + 2, nz, "shroomlight");
        break;
      }
    }
  }
}

// 3. Ground-floor entrance on the minimum-z face: double door under a canopy.
let minZ = Infinity;
for (const [x, z] of cells) minZ = Math.min(minZ, Math.round(z));
const frontCells = cells
  .map(([x, z]) => [Math.round(x), Math.round(z)])
  .filter(([x, z]) => z === minZ);
const meanX = frontCells.reduce((s, [x]) => s + x, 0) / frontCells.length;
const [ex, ez] = frontCells.reduce((best, c) =>
  Math.abs(c[0] - meanX) < Math.abs(best[0] - meanX) ? c : best);
const eg = gnd(ex, ez);

// Clear the door opening and set it.
g.set(ex, eg + 1, ez, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, eg + 2, ez, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
// Canopy over the entrance, spanning the neighbouring front cells.
for (let dx = -2; dx <= 2; dx++) {
  const cx = ex + dx;
  if (has(cx, ez)) g.set(cx, eg + 3, ez, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
}
// Flanking glass shopfront for the entrance bay.
for (const dx of [-2, -1, 1, 2]) {
  const cx = ex + dx;
  if (has(cx, ez) && isEdge(cx, ez)) {
    for (const r of [eg + 1, eg + 2]) g.set(cx, r, ez, GLASS);
  }
}

// 4. Roof plant: a low screen-walled equipment room with a small cooling tower on top.
for (let x = 22; x <= 34; x++) {
  for (let z = 13; z <= 22; z++) {
    if (!has(x, z)) continue;
    const edgeBox = x === 22 || x === 34 || z === 13 || z === 22;
    g.set(x, ROOF + 1, z, edgeBox ? "light_gray_concrete" : "air");
    g.set(x, ROOF + 2, z, edgeBox ? "light_gray_concrete" : "air");
  }
}
for (let x = 26; x <= 30; x++) {
  for (let z = 16; z <= 19; z++) {
    if (has(x, z)) g.set(x, ROOF + 3, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
