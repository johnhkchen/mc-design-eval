// ICONZ House (way 293020971), Auckland CBD edge: a 1980s-style precast-and-glass office block, 11 storeys of ~4 blocks
// (3.3 m at 1.2 blocks/m) on a stone plinth, footprint 22 x 26, roof from the lidar: a low north shoulder (roof ~40), a
// main block to 44 and a plant-room crown to 46. Storey lines are absolute (slab rows at y = 4k), so the floors line up
// across the building; the foundation fills each cell up to its own ground, so the downhill side shows more storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_293020971.cells.json`, "utf8"));

const X = 22, Z = 26, Y = 59;
const gr = Array.from({ length: X }, () => Array(Z).fill(null));   // ground per cell (null = outside footprint)
const rr = Array.from({ length: X }, () => Array(Z).fill(null));   // raw lidar roof per cell
for (const [x, z, g, r] of cells) { gr[x][z] = g; rr[x][z] = r; }
const inF = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && gr[x][z] !== null;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smooth the lidar roof into flat tiers: drop the stray low returns (roof < 30) and take a 3x3 median of the rest.
const med = (a) => { a.sort((p, q) => p - q); return a[a.length >> 1]; };
const rs = Array.from({ length: X }, () => Array(Z).fill(null));
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const nb = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const u = x + dx, v = z + dz;
    if (inF(u, v) && rr[u][v] >= 30) nb.push(rr[u][v]);
  }
  rs[x][z] = nb.length ? med(nb) : 40;
}

// Massing tiers. B: the main block (roof 44); C: the plant-room crown (roof 46), set back one cell inside B on every side;
// A: the low shoulder (roof 40). Each tier's footprint sits inside the one below, so nothing hangs.
const inB = (x, z) => inF(x, z) && rs[x][z] >= 43;
const isC = (x, z) => inF(x, z) && rs[x][z] >= 45 && DIRS.every(([dx, dz]) => inB(x + dx, z + dz));
const R = (x, z) => (isC(x, z) ? 46 : inB(x, z) ? 44 : 40);     // last row of roof cap
const G = (x, z) => gr[x][z];

// A face at row y is exposed to the outside when the neighbour is outside the footprint, or the neighbour stops below y.
// A neighbour's foundation (below its ground) is solid, so it does not expose the face.
const exposedDirs = (x, z, y) => DIRS.filter(([dx, dz]) => { const u = x + dx, v = z + dz; return !inF(u, v) || y > R(u, v); });

const G_LIGHT = "light_gray_concrete", GLASS = "light_blue_stained_glass_pane", CLEAR = "glass_pane";
const PIER = "white_concrete", BASE = "smooth_stone", FOUND = "stone_bricks";

const g = new Voxels([X, Y, Z]);
const paneState = (dirs, shop) => {
  const wallAlongZ = dirs[0][0] !== 0;   // a wall in the x = const plane runs along z: connect north and south
  return { north: String(!wallAlongZ), south: String(!wallAlongZ), east: String(wallAlongZ), west: String(wallAlongZ), waterlogged: "false" };
};

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  const ground = G(x, z), roof = R(x, z), crown = isC(x, z);
  for (let y = 0; y <= roof + 1 && y < Y; y++) {
    if (y < ground) { g.set(x, y, z, FOUND); continue; }                 // foundation: solid up to this cell's ground
    if (y === roof) { g.set(x, y, z, G_LIGHT); continue; }               // roof deck
    if (y === roof + 1) {                                                // parapet on the open edge of a shoulder or the main block
      if (!crown && exposedDirs(x, z, y).length) g.set(x, y, z, G_LIGHT);
      continue;
    }
    if (y % 4 === 0) { g.set(x, y, z, G_LIGHT); continue; }             // storey slab, full footprint: no empty course
    if (crown && y === 45) {                                              // plant room, solid: a stone band on its faces
      g.set(x, y, z, exposedDirs(x, z, y).length ? "smooth_stone" : G_LIGHT);
      continue;
    }
    const dirs = exposedDirs(x, z, y);
    if (!dirs.length) continue;                                           // interior: air behind the glass
    const [dx, dz] = dirs[0], along = dx !== 0 ? z : x;
    const ground_floor = y < 4;
    if (y % 4 === 3) { g.set(x, y, z, G_LIGHT); continue; }              // spandrel at each storey line
    if (ground_floor && y % 4 === 1) { g.set(x, y, z, BASE); continue; }  // base course at street level
    const pier = dirs.length > 1 || along % 3 === 0;
    if (pier) { g.set(x, y, z, PIER); continue; }
    g.set(x, y, z, ground_floor ? CLEAR : GLASS, ground_floor ? { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" } : paneState(dirs));
  }
}

// Warm light behind some panes: a glowstone one cell inside the glass, on the upper storeys (dusk reads).
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!inF(x, z)) continue;
  for (let y = 5; y < R(x, z); y += 4) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    const dirs = exposedDirs(x, z, y);
    if (dirs.length !== 1 || (x * 7 + z * 5 + y * 3) % 11 !== 0) continue;
    const [dx, dz] = dirs[0], u = x - dx, v = z - dz;
    if (inF(u, v) && y >= G(u, v) && !exposedDirs(u, v, y).length && y <= R(u, v) && y % 4 !== 0) g.set(u, y, v, "glowstone");
  }
}

// Entrance: the middle street-level cell on the north edge (z = 0): a dark-oak door, a lantern under the canopy (the
// first-floor slab), and a canopy-lit recess; the glazing either side stays.
const streetCells = [];
for (let x = 0; x < X; x++) if (inF(x, 0) && G(x, 0) === 0) streetCells.push(x);
const ex = streetCells[streetCells.length >> 1];
g.set(ex, 1, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(ex, 2, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
g.set(ex, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: a few units on the main roof and the shoulder roof, one block high.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!isC(x, z) && inB(x, z) && !exposedDirs(x, z, 45).length && (x * 5 + z * 3) % 17 === 0) g.set(x, 45, z, "iron_block");
  if (!inB(x, z) && inF(x, z) && !exposedDirs(x, z, 41).length && (x + 2 * z) % 13 === 0) g.set(x, 41, z, "iron_block");
}

const out = g.save(`${DIR}/way_293020971.nbt`);
console.log("saved", out, "cells in footprint", cells.length, "crown cells", [...Array(X * Z).keys()].filter((i) => isC(Math.floor(i / Z), i % Z)).length);
