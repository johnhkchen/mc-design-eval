// DC53940: vacant brick-and-stone commercial block on Massachusetts Ave NE, DC 20002, as a 1.21.1 module.
// The footprint is a diagonal comb of 2-3 cell wings around a solid south-west mass. Lidar roof heights are
// smoothed (3x3 median over the footprint) and snapped to four storey tiers of 4 blocks (3 + a floor course),
// so the massing is 1, 2, 3 or 4 storeys. Every column is solid from y 0 up to its tier, so nothing floats.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53940.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC53940.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and 0-1 gaps drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}
// Storey tiers: 4, 8, 12 or 16 blocks above y 0 (one module = 3 blocks of room + 1 course of floor or stone band).
const tier = (h) => (h <= 5 ? 4 : h <= 9 ? 8 : h <= 13 ? 12 : 16);

// Palette
const BASE = "stone_bricks";      // plinth, string courses, window heads and sills, cornice
const BRICK = "bricks";           // the walls
const GLASS = "glass_pane";
const FLOOR = "smooth_stone";     // interior floor slabs and the roof membrane
const BOARD = "spruce_planks";    // boarded ground-floor windows (vacant)
const PARAPET = "stone_brick_wall";
const DOOR = "dark_oak_door";
const LAMP = "glowstone";
const AC = "iron_block";

const g = new Voxels([60, 28, 93]);

const shell = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));  // touches the outside of the footprint

// Pick the entrances: shell cells whose outer neighbour is on the south (+z) face of the building, spread along it.
const frontCells = [];
for (const c of F.values()) {
  if (!inF(c.x, c.z + 1) && c.z + 1 < 93 && smooth.get(key(c.x, c.z)) >= 8 && (c.x + c.z) % 2 === 0) frontCells.push(c);
}
frontCells.sort((a, b) => a.x - b.x);
const doors = new Map();
for (let i = 0; i < 3 && frontCells.length; i++) {
  const c = frontCells[Math.floor(((i + 0.5) * frontCells.length) / 3)];
  doors.set(key(c.x, c.z), c);
}

for (const c of F.values()) {
  const T = tier(smooth.get(key(c.x, c.z)));
  const b = shell(c.x, c.z);
  for (let y = 0; y < T; y++) {
    if (y < c.g) { g.set(c.x, y, c.z, BASE); continue; }           // foundation under the cell's ground
    if (y === T - 1) { g.set(c.x, y, c.z, b ? BASE : FLOOR); continue; } // cornice or roof membrane
    const k = Math.floor(y / 4), r = y % 4;
    if (r === 0) { g.set(c.x, y, c.z, b || y === 0 ? BASE : FLOOR); continue; } // string course / interior slab
    if (r === 3) { if (b) g.set(c.x, y, c.z, BASE); continue; }     // head course; interior stays air
    // r = 1 or 2: the window band. Shell carries glass in bays and brick piers; interior is air behind the glass.
    if (!b) continue;
    const bay = (c.x + c.z) % 2 === 0;
    const lit = k >= 1 && bay && (c.x * 7 + c.z * 13 + k) % 10 === 0;
    if (!bay) g.set(c.x, y, c.z, BRICK);
    else if (k === 0 && (c.x * 5 + c.z * 3) % 3 === 0) g.set(c.x, y, c.z, BOARD);
    else if (lit) g.set(c.x, y, c.z, LAMP);
    else g.set(c.x, y, c.z, GLASS);
  }
  if (b && T >= 8) g.set(c.x, T, c.z, PARAPET);                    // parapet on the roof edge of the taller tiers (single-storey wings keep the cornice only)
  if (!b && T === 16 && c.x % 6 === 3 && c.z % 6 === 3) g.set(c.x, T, c.z, AC); // roof units on the tall tops
}

// Entrances: a dark oak door (lower and upper halves) in a shell bay on the south face, under the stone head course.
for (const c of doors.values()) {
  g.set(c.x, 1, c.z, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, 2, c.z, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(c.x, 3, c.z, BASE);
}

// Glass panes connect to whatever is beside them in the wall plane.
for (const c of F.values()) {
  const T = tier(smooth.get(key(c.x, c.z)));
  if (!shell(c.x, c.z)) continue;
  for (let y = 1; y < T - 1; y++) {
    const p = g.get(c.x, y, c.z);
    if (!p || p.block !== GLASS) continue;
    const st = {};
    if (g.get(c.x, y, c.z - 1)) st.north = "true";
    if (g.get(c.x, y, c.z + 1)) st.south = "true";
    if (g.get(c.x + 1, y, c.z)) st.east = "true";
    if (g.get(c.x - 1, y, c.z)) st.west = "true";
    g.set(c.x, y, c.z, GLASS, st);
  }
}

console.log(g.save(OUT));
