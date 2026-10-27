// Whybin\TBWA-type office block, Auckland edge of CBD: 1980s glazed-concrete commercial. A podium of four storeys
// (absolute roof 17), an east tower one storey higher (21), and a small corner stack at 24 on the NW corner. Floors
// follow each cell's own ground (the downhill side shows extra storeys). Spandrels sit on absolute storey lines (y % 4 == 0),
// so the grid stays level across the stepped foundation. Glass sits in the facade with a 1-block air gap behind it; the
// rest is solid core. Lanterns and glowstone light some pockets; the street door is on the south face.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_130501839.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..41, z 0..31

const X = 42, Y = 37, Z = 32;
const g = new Voxels([X, Y, Z]);
const key = (x, z) => `${x},${z}`;

// lidar roof heights smoothed into three flat tiers: podium 17, east tower 21, NW corner stack 24
const tier = (r) => (r >= 23 ? 24 : r >= 20 ? 21 : 17);
const cell = new Map();
for (const [x, z, gr, r] of cells) cell.set(key(x, z), { g: gr, t: tier(r) });

// outward normals; a face is exposed on a row when there is no footprint cell beside it or that cell's body ends below the row
const DIRS = [[-1, 0], [1, 0], [0, -1], [0, 1]];
const exposed = (x, z, y, dx, dz) => { const n = cell.get(key(x + dx, z + dz)); return !n || y >= n.t; };

const CORE = "light_gray_concrete", FOUND = "stone_bricks";
const facade = new Map();       // "x,z,y" -> index into DIRS of the face shown there
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g; y < c.t; y++) {
    const f = DIRS.findIndex(([dx, dz]) => exposed(x, z, y, dx, dz));
    if (f >= 0) facade.set(`${x},${z},${y}`, f);
  }
}

// pass 1: foundation, facade skin, solid core
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < c.g; y++) g.set(x, y, z, FOUND);
  for (let y = c.g; y < c.t; y++) {
    const f = facade.get(`${x},${z},${y}`);
    if (f === undefined) { g.set(x, y, z, CORE); continue; }
    const [dx] = DIRS[f];
    const u = dx !== 0 ? z : x;                      // position along the face: piers every 3 blocks
    let block;
    if (y === c.t - 1) block = "smooth_stone";       // coping
    else if (y === c.t - 2) block = "polished_andesite";   // cornice
    else if (y === c.g) block = "polished_andesite";       // base course
    else if (y % 4 === 0) block = "light_gray_concrete";   // storey spandrel on the absolute line
    else if (u % 3 === 0) block = "white_concrete";        // concrete pier / mullion
    else block = c.t >= 21 ? "cyan_stained_glass" : "light_blue_stained_glass";
    g.set(x, y, z, block);
  }
}

// pass 2: air gap behind glass, with lights in some pockets (only where the inner cell is body, not skin)
const isWindow = (y, c) => y !== c.g && y % 4 !== 0 && y < c.t - 2;
for (const [k, c] of cell) {
  const [x, z] = k.split(",").map(Number);
  for (let y = c.g; y < c.t; y++) {
    const f = facade.get(`${x},${z},${y}`);
    if (f === undefined || !isWindow(y, c)) continue;
    const [dx, dz] = DIRS[f];
    const u = dx !== 0 ? z : x;
    if (u % 3 === 0) continue;                        // a pier, solid behind
    const ix = x - dx, iz = z - dz, inner = cell.get(key(ix, iz));
    if (!inner || y < inner.g || y >= inner.t || facade.has(`${ix},${iz},${y}`)) continue;
    g.set(ix, y, iz, "air");
    const h = (x * 7 + z * 13 + Math.floor(y / 4) * 5) % 9;
    if (y % 4 === 1 && h === 0) g.set(ix, y, iz, "lantern", { hanging: "false" });   // stands on the spandrel slab
    else if (y % 4 === 2 && h === 4) g.set(ix, y, iz, "glowstone");
  }
}

// the street door: south face, x 5, on the base course; a 2-block air lobby behind it; a canopy band over it
const door = cell.get(key(5, 16));
if (door) {
  const y0 = door.g;
  g.set(5, y0, 15, "air"); g.set(5, y0 + 1, 15, "air");
  g.set(5, y0, 16, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(5, y0 + 1, 16, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (let x = 4; x <= 7; x++) {
    g.set(x, y0 + 3, 16, "polished_andesite");
    g.set(x, y0 + 3, 17, "polished_andesite");          // canopy projects one block, fixed to the wall
  }
  g.set(4, y0 + 2, 16, "light_gray_concrete");
  g.set(7, y0 + 2, 16, "light_gray_concrete");
}

// roof plant on the tower: two gray boxes on the 21 roof, inside the footprint only
for (let x = 30; x <= 33; x++) for (let z = 9; z <= 12; z++) {
  const c = cell.get(key(x, z));
  if (c && c.t === 21) { g.set(x, 21, z, "gray_concrete"); g.set(x, 22, z, "gray_concrete"); }
}

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_130501839.nbt");
console.log(`way_130501839: ${stats.blocks} blocks, ${stats.palette} palette entries`);
