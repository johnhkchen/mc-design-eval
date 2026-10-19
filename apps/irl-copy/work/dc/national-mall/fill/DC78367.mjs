// DC78367: Commercial-Office-Large at 215 D St SW, Washington DC 20024, as a 1.21.1 module.
// Read from the record: a post-war federal-style office (c. 1965-75, the Southwest redevelopment): a precast
// light-grey concrete perimeter of three storeys round a four-storey body, a taller core on the body, and a
// one-storey lobby on the street face (roof 4 at the lobby, 11 on the rim, 13 on the body, 15 on the core).
// The lidar roof is smoothed (3x3 median over the footprint) and snapped to those four tiers, so every
// storey is a flat tier. Every column is solid from y 0 up to its tier, so nothing floats or hangs.
// Facades: a granite plinth, a smooth-stone floor band each storey, glass between iron mullions every third
// cell, a stone cornice at each roof. A glass cell has a one-block air gap behind it (no interiors), and some
// gaps hold glowstone for warm light. Roof: rooftop units on the body, a penthouse on the core, lanterns.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78367.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC78367.nbt";
const SIZE = [42, 27, 29];

const MAT = {
  mass: "light_gray_concrete", base: "polished_granite", band: "smooth_stone", cornice: "stone_bricks",
  roof: "gray_concrete", frame: "iron_block", glass: "cyan_stained_glass", glow: "glowstone",
};

const key = (x, z) => `${x},${z}`;
const k3 = (x, y, z) => `${x},${y},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: the 3x3 median of the footprint's lidar roof heights round each cell.
const smooth = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const c = F.get(key(x + dx, z + dz)); if (c) v.push(c.r); }
  v.sort((a, b) => a - b);
  return v[v.length >> 1];
};
// Clean tiers: 4 = lobby, 11 = perimeter wings, 13 = body, 15 = core.
const tier = (s) => (s >= 15 ? 15 : s >= 13 ? 13 : s >= 6 ? 11 : 4);
const TOP = new Map();
for (const c of F.values()) TOP.set(key(c.x, c.z), tier(smooth(c.x, c.z)));
const top = (x, z) => TOP.get(key(x, z));

// Solid mass: each footprint cell from the foundation (y 0) up to its tier.
const S = new Set();
for (const c of F.values()) for (let y = 0; y < top(c.x, c.z); y++) S.add(k3(c.x, y, c.z));
const solid = (x, y, z) => S.has(k3(x, y, z));

// Facade: exposed faces get their role. Row y % 3 === 1 is a floor band, the rest are windows, mullions every
// third cell (u = x on north and south faces, z on east and west); the top course is the cornice.
const outDirs = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const B = new Map();
for (const k of S) {
  const [x, y, z] = k.split(",").map(Number);
  const out = outDirs(x, y, z);
  const roofOpen = !solid(x, y + 1, z);
  let m = null;
  if (y === 0 && out.length) m = MAT.base;
  else if (roofOpen) m = out.length ? MAT.cornice : MAT.roof;
  else if (out.length) {
    if (y % 3 === 1) m = MAT.band;
    else if (out.length >= 2) m = MAT.frame;
    else { const [dx] = out[0]; const u = dx ? z : x; m = u % 3 === 0 ? MAT.frame : MAT.glass; }
  }
  if (m) B.set(k, m);
}

// Air gap behind each glass cell (one block deep, sealed by the mass round it). A few hold glowstone instead.
const FINAL = new Map();
for (const k of S) FINAL.set(k, B.get(k) ?? MAT.mass);
for (const [k, m] of B) {
  if (m !== MAT.glass) continue;
  const [x, y, z] = k.split(",").map(Number);
  const [dx, dz] = outDirs(x, y, z)[0];
  const ix = x - dx, iz = z - dz, ik = k3(ix, y, iz);
  if (!solid(ix, y, iz) || B.has(ik)) continue;
  // Every other side of the inward cell must be mass, so the gap stays sealed and never opens to the air.
  const sides = [[ix - dx, y, iz - dz], [ix, y + 1, iz], [ix, y - 1, iz], [ix + dz, y, iz + dx], [ix - dz, y, iz - dx]];
  if (!sides.every(([sx, sy, sz]) => solid(sx, sy, sz))) continue;
  if ((x * 7 + y * 5 + z * 3) % 11 === 0) { FINAL.set(ik, MAT.glow); continue; }
  S.delete(ik); FINAL.delete(ik);
}

// Entrance: the lobby's north face, a door (dark oak, two halves) between glazing.
FINAL.set(k3(16, 1, 0), "dark_oak_door");
FINAL.set(k3(16, 2, 0), "dark_oak_door");

// Roof: rooftop units on the body (two 2x2 units, iron cap), a penthouse on the core, and lanterns.
const place = [];
for (const [x0, z0] of [[4, 10], [33, 10], [31, 20]]) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) {
  const x = x0 + dx, z = z0 + dz;
  if (top(x, z) !== 13) continue;   // only on the body's roof, so each unit stands on solid mass
  place.push([x, 13, z, MAT.frame]); place.push([x, 14, z, MAT.mass]);
}
// Penthouse on the core (top 15): mass to y 15, glass ring at y 16, cap at 17.
for (let x = 17; x <= 21; x++) for (let z = 13; z <= 15; z++) {
  const ring = x === 17 || x === 21 || z === 13 || z === 15;
  const corner = (x === 17 || x === 21) && (z === 13 || z === 15);
  place.push([x, 15, z, MAT.mass]);
  place.push([x, 16, z, corner ? MAT.frame : ring ? MAT.glass : MAT.mass]);
  place.push([x, 17, z, MAT.roof]);
}
const LANTERNS = [[0, 11, 5], [41, 11, 5], [0, 11, 28], [41, 11, 28], [14, 4, 0], [19, 4, 0], [17, 18, 13], [21, 18, 15]];

const g = new Voxels(SIZE);
for (const [k, block] of FINAL) {
  const [x, y, z] = k.split(",").map(Number);
  if (block === "dark_oak_door") {
    const half = y === 1 ? "lower" : "upper";
    g.set(x, y, z, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
  } else g.set(x, y, z, block);
}
for (const [x, y, z, block] of place) g.set(x, y, z, block);
for (const [x, y, z] of LANTERNS) g.set(x, y, z, "lantern", { hanging: "false" });
const { blocks, palette } = g.save(OUT);
console.log(`DC78367: ${blocks} blocks, palette ${palette}`);
