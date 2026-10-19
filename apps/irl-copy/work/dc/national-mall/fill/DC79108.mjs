// DC79108: 25 Massachusetts Avenue NW, Washington DC 20001 (Commercial-Office-Large), as a 1.21.1 module.
// Read as a mid-century (c. 1960s-70s) pale-limestone office block: four storeys of window bands on a stone base,
// with a fifth storey set back over the core. Lidar roof heights are median-smoothed (3x3) and snapped to two tiers:
// 17 (the outer wing, parapet on top) and 19 (the core, one storey higher). Floors sit every 3 blocks on the
// footprint; each column is solid from y 0 up to the datum (2), so nothing floats on the slope.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79108.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC79108.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const outside = (x, z) => !inF(x, z);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Smoothed massing: 3x3 median of the lidar roof, snapped to the 17 wing or the 19 core.
const TOP = new Map();
for (const c of F.values()) {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  TOP.set(key(c.x, c.z), vals[vals.length >> 1] >= 18 ? 19 : 17);
}
const top = (x, z) => (inF(x, z) ? TOP.get(key(x, z)) : 0);
const exposed = (x, z) => DIRS.some(([dx, dz]) => outside(x + dx, z + dz));
// A window-row cell is wall when a neighbour is outside, or a lower tier whose top is at or below this row's cap.
const edge = (x, y, z) => DIRS.some(([dx, dz]) => outside(x + dx, z + dz) || top(x + dx, z + dz) <= y + 1);
const corner = (x, z) => (outside(x - 1, z) || outside(x + 1, z)) && (outside(x, z - 1) || outside(x, z + 1));

// Palette: pale limestone piers and bands, blue-tinted glass, a dark granite base and stone-brick cap.
const PIER = "calcite", GLASS = "light_blue_stained_glass", BASE = "polished_granite", CAP = "stone_bricks";
const FLOOR = "smooth_stone", FOUND = "stone_bricks";
const FLOORS = new Set([3, 6, 9, 12, 15]);     // storey lines: floor slab (exterior = limestone band) every 3 blocks
const STAIR = { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" };

const V = new Voxels([37, 31, 32]);

for (const c of F.values()) {
  const { x, z } = c, h = TOP.get(key(x, z)), ext = exposed(x, z);
  // Foundation: solid from 0 to the datum at 2 (covers every column's ground, the downhill side too).
  for (let y = 0; y < 3; y++) V.set(x, y, z, y === 2 && ext ? BASE : FOUND);
  for (let y = 3; y < h; y++) {
    if (FLOORS.has(y)) {
      const band = y === 3 ? (ext ? BASE : FLOOR) : edge(x, y, z) ? PIER : FLOOR;
      V.set(x, y, z, band);
    } else if (y === 18 && h === 19) {
      V.set(x, y, z, CAP);                                              // core roof deck
    } else if (y === 16 && h === 17) {
      V.set(x, y, z, CAP);                                              // wing parapet course
    } else if (edge(x, y, z)) {
      const pier = corner(x, z) || (x + z) % 3 === 0;                   // a pier every third cell, corners always
      V.set(x, y, z, pier ? PIER : GLASS);
    }
  }
  // Core cornice where it rises above the wing.
  if (h === 19 && DIRS.some(([dx, dz]) => outside(x + dx, z + dz) || top(x + dx, z + dz) < 19)) V.set(x, 19, z, CAP);
}

// Street front on the north face (z 0): a glass vestibule with a door at the centre and two hanging lanterns.
for (const x of [9, 10, 11]) {
  V.set(x, 2, 0, "stone_brick_stairs", STAIR);
  V.set(x, 3, 0, "stone_brick_stairs", STAIR);
  if (x === 10) {
    V.set(x, 4, 0, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    V.set(x, 5, 0, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  } else {
    V.set(x, 4, 0, GLASS);
    V.set(x, 5, 0, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// Warm light behind some of the glass: a glowstone in the air gap one cell inside the window.
for (const c of F.values()) {
  const { x, z } = c;
  for (const y of [4, 7, 10, 13]) {
    if (!edge(x, y, z) || (x + z) % 3 === 0 || (x * 5 + z * 7 + y * 3) % 9 !== 0) continue;
    const d = DIRS.find(([dx, dz]) => outside(x + dx, z + dz));
    if (!d) continue;
    const ix = x - d[0], iz = z - d[1];
    if (inF(ix, iz) && V.get(ix, y, iz) === null) V.set(ix, y, iz, "glowstone");
  }
}

// Roof plant: a solid penthouse on the core's interior, two storeys of calcite under a stone-brick cap.
for (const c of F.values()) {
  const { x, z } = c;
  if (TOP.get(key(x, z)) !== 19 || x < 16 || x > 22 || z < 11 || z > 16) continue;
  if (!DIRS.every(([dx, dz]) => inF(x + dx, z + dz) && TOP.get(key(x + dx, z + dz)) === 19)) continue;
  V.set(x, 19, z, PIER); V.set(x, 20, z, PIER); V.set(x, 21, z, CAP);
}

const res = V.save(OUT);
console.log(`DC79108: ${res.blocks} blocks, palette ${res.palette}`);
