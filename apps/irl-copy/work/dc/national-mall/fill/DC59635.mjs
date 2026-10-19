// DC59635: United States Tax Court, 400 2nd St NW, DC 20217, as a 1.21.1 module.
// A 1930s-60s federal block in pale limestone (calcite): a 9-block main body of three storeys with a stone
// cornice, two 4-block single-storey wings at the north and south ends (lidar ~2), and a 2-block penthouse
// set back on the middle of the roof. Each cell's lidar roof is 3x3-median smoothed and snapped to those
// tiers. Every column is solid from y 0 up to its ground and its storey floors, and every floor or deck
// stands on the solid row below, so nothing floats. Walls are one block thick with an air gap behind the
// windows and an open interior between floor slabs. Entrances: a recessed door on the east face and one on
// the south wing, each with stone piers, a glass transom and the storey band as its lintel.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59635.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59635.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // E/W first, so corner cells take their long face

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise and the 2-block dips drop out).
const smooth = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  smooth.set(key(c.x, c.z), vals[vals.length >> 1]);
}

// Penthouse: the lidar's 10-block core, set back 4 cells from the long walls and 14 from the ends. Top at 11.
const PH = (x, z) => x >= 4 && x <= 10 && z >= 14 && z <= 36;
// Top (first empty row) of each column: the wings stop at 4, the main body at 9, the penthouse at 11.
const top = (x, z) => (PH(x, z) ? 11 : smooth.get(key(x, z)) <= 5 ? 4 : 9);

const WALL = "calcite";            // pale limestone walls, piers
const BASE = "stone_bricks";       // foundation, ground course, cornice, entrance piers
const BAND = "smooth_stone";       // storey bands on the outside
const FLOOR = "smooth_stone";      // interior floor slabs and the roof deck
const GLASS = "glass_pane";
const LAMP = "glowstone";
const AC = "iron_block";           // rooftop mechanical units
const DOOR = "dark_oak_door";

const g = new Voxels([15, 22, 52]);

// Floor rows of a column (its ground row and storey bands), below its cap row.
const floors = (x, z, gr) => { const cap = top(x, z) - 1; return [gr, 3, 6, ...(PH(x, z) ? [8] : [])].filter((y) => y < cap); };
// A cell's row is on the outside when a neighbour is off the footprint or its top is at or below that row (open sky).
const exposed = (x, z, y) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) <= y);
const outFace = (x, z, y) => DIRS.find(([dx, dz]) => !inF(x + dx, z + dz) || top(x + dx, z + dz) <= y);

const GLASS_E_W = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const GLASS_N_S = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const windows = [];

for (const c of F.values()) {
  const { x, z } = c, gr = c.g, cap = top(x, z) - 1, fl = floors(x, z, gr);
  for (let y = 0; y <= cap; y++) {
    if (y < gr) { g.set(x, y, z, BASE); continue; }                       // foundation under the ground
    const out = exposed(x, z, y);
    if (y === cap) { g.set(x, y, z, out ? BASE : FLOOR); continue; }      // cornice ring, roof deck inside
    if (fl.includes(y)) { g.set(x, y, z, out ? (y === gr ? BASE : BAND) : FLOOR); continue; }
    if (!out) continue;                                                   // interior air between floors
    const [dx, dz] = outFace(x, z, y);
    const along = dx !== 0 ? z : x, maxAlong = dx !== 0 ? 51 : 14;
    if (along % 3 === 0 || along === maxAlong) { g.set(x, y, z, WALL); continue; }   // pier between bays
    g.set(x, y, z, GLASS, dx !== 0 ? GLASS_E_W : GLASS_N_S);
    windows.push({ x, y, z, dx, dz });
  }
}

// Warm light behind some windows: a glowstone on the floor just inside the glass (only where the air is empty).
for (const w of windows) {
  if ((w.x * 7 + w.z * 3 + w.y) % 11 !== 0) continue;
  const ix = w.x - w.dx, iz = w.z - w.dz;
  if (!inF(ix, iz) || w.y - 1 < 0) continue;
  if (!floors(ix, iz, F.get(key(ix, iz)).g).includes(w.y - 1)) continue;
  if (w.y >= top(ix, iz) - 1 || exposed(ix, iz, w.y)) continue;
  g.set(ix, w.y, iz, LAMP);
}

// Entrances, recessed one cell into the east face and the south wing: door, glass transom, stone piers.
const door = (half, facing) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
g.set(14, 0, 25, DOOR, door("lower", "east"));
g.set(14, 1, 25, DOOR, door("upper", "east"));
g.set(14, 2, 25, "glass");
for (let y = 0; y <= 2; y++) { g.set(14, y, 24, BASE); g.set(14, y, 26, BASE); }

g.set(7, 0, 51, DOOR, door("lower", "south"));
g.set(7, 1, 51, DOOR, door("upper", "south"));
g.set(7, 2, 51, "glass");
for (let y = 0; y <= 2; y++) { g.set(6, y, 51, BASE); g.set(8, y, 51, BASE); }

// Rooftop mechanical units on the main deck, clear of the penthouse.
for (const [x, z] of [[1, 20], [2, 20], [1, 21], [2, 21], [12, 44], [13, 44], [12, 45], [13, 45]]) g.set(x, 9, z, AC);

const stats = g.save(OUT);
console.log(`DC59635: ${stats.blocks} blocks, ${stats.palette} palette entries, ${windows.length} glass panes -> ${OUT}`);
