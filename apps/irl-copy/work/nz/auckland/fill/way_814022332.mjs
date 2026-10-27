// WQ Building (way 814022332): a late-20th-century Auckland office complex, a stepped concrete frame with a
// glass curtain wall over a volcanic-stone plinth. The lidar roof, smoothed and snapped to 4-block storeys, gives the
// massing: a core at 72, rings at 68 and 64, wings at 60 and a low block at 32. Solid foundation to the ground, a base
// course, a floor slab per storey, a 1-block glass skin with an air gap behind it, a column grid, parapets and roof plant.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_814022332.cells.json`, "utf8"));
const W = 68, H = 84;

// Blocks
const GLASS = "light_blue_stained_glass", PIER = "light_gray_concrete", SPANDREL = "smooth_stone";
const BASE = "polished_andesite", FOUND = "stone_bricks", ROOF = "gray_concrete", PARAPET = "polished_andesite";
const PLANT = "iron_block", DOOR = "dark_oak_door", GLOW = "glowstone";

// The footprint: one record per cell, its ground and its (smoothed, storey-snapped) top
const F = new Map();
for (const [x, z, g, r] of cells) F.set(`${x},${z}`, { x, z, g, r, top: 0 });
const cell = (x, z) => F.get(`${x},${z}`);
for (const c of F.values()) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const o = cell(c.x + dx, c.z + dz); if (o) { s += o.r; n++; } }
  c.top = Math.min(72, Math.max(4 * Math.round(s / n / 4), c.g + 4));
}

// A layer is open where the footprint ends or the column is lower than it
const open = (x, z, y) => { const n = cell(x, z); return !n || y >= n.top; };
const exposed = (x, z, y) => [[-1, 0], [1, 0], [0, -1], [0, 1]].filter(([dx, dz]) => open(x + dx, z + dz, y));
const isCol = (x, z) => x % 4 === 2 && z % 4 === 2;     // structural column grid, inside the skin

const v = new Voxels([W, H, W]);
const glowCandidates = [];

for (const c of F.values()) {
  const { x, z, g, top } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, FOUND);
  for (let y = g; y < top; y++) {
    if (y === g) { v.set(x, y, z, BASE); continue; }                        // base course / ground slab
    if (y === top - 1) { v.set(x, y, z, ROOF); continue; }                   // roof deck
    if (y % 4 === 0) { v.set(x, y, z, PIER); continue; }                     // floor slab per storey
    const faces = exposed(x, z, y);
    if (faces.length) {
      const xFace = faces.some(([dx]) => dx !== 0), zFace = faces.some(([, dz]) => dz !== 0);
      const corner = xFace && zFace, a = xFace ? z : x;                       // position along the wall
      const ground = y <= g + 3;
      if (ground && !corner && a % 16 === 8 && (g + 1) % 4 !== 0 && (g + 2) % 4 !== 0 && (y === g + 1 || y === g + 2) && g + 2 < top - 1) {
        // an entrance: a dark-oak door facing out of the building
        const [dx, dz] = faces[0];
        const facing = dx === -1 ? "east" : dx === 1 ? "west" : dz === -1 ? "south" : "north";
        const half = y === g + 1 ? "lower" : "upper";
        v.set(x, y, z, DOOR, { facing, half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (ground) { v.set(x, y, z, corner || a % 3 === 0 ? BASE : GLASS); continue; }   // shopfronts: piers and glass
      if (y % 4 === 3) { v.set(x, y, z, SPANDREL); continue; }                 // spandrel band under the window
      if (corner || a % 3 === 0) { v.set(x, y, z, PIER); continue; }           // mullion piers
      v.set(x, y, z, GLASS);
      if (y % 4 === 1) glowCandidates.push({ x, y, z, faces });
      continue;
    }
    if (isCol(x, z)) v.set(x, y, z, PIER);
  }
  // parapet on the roof edge, standing on the roof deck below
  if (top < H - 1 && [[-1, 0], [1, 0], [0, -1], [0, 1]].some(([dx, dz]) => { const n = cell(x + dx, z + dz); return !n || n.top < top; })) v.set(x, top, z, PARAPET);
}

// roof plant: a 3x3 box on the flat core roofs, standing on the deck
for (const c of F.values()) {
  const { x, z, top } = c;
  if (top < 64 || x % 8 !== 4 || z % 8 !== 4) continue;
  let flat = true;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const o = cell(x + dx, z + dz); if (!o || o.top !== top) flat = false; }
  if (!flat) continue;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) for (let y = top; y < top + 2; y++) v.set(x + dx, y, z + dz, PLANT);
}

// warm light behind some windows: a glowstone in the air gap, on the floor slab, behind a glass skin cell
let lit = 0;
for (const { x, y, z, faces } of glowCandidates) {
  if ((x * 7 + z * 13 + y * 3) % 13 !== 0) continue;
  for (const [dx, dz] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) {
    const nx = x - dx, nz = z - dz;                                       // inward is opposite the outward face
    if (!faces.some(([fx, fz]) => fx === dx && fz === dz)) continue;
    const n = cell(nx, nz);
    if (!n || y >= n.top || isCol(nx, nz) || exposed(nx, nz, y).length) continue;
    v.set(nx, y, nz, GLOW); lit++; break;
  }
}

const out = `${DIR}/way_814022332.nbt`;
const info = v.save(out);
console.log(`cells ${cells.length}, lit windows ${lit}, blocks ${info.blocks}, palette ${info.palette} -> ${out}`);
