// 1201 15th St NW: a Commercial-Office-Large block, c. 1970s-80s Class-A office in cream precast over a granite base.
// Massing follows the lidar roof, smoothed to two clean tiers (wings at 15 blocks, a 17-block core); storeys are 3 blocks:
// a calcite spandrel line, then two rows of glazing. Ring 0 is the facade, ring 1 the air gap behind the glass, ring 2+ solid.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86701.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 41, Y = 29, Z = 22;
const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { x, z, ground, roof }]));
const inF = (x, z) => F.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// ring 0: a footprint cell with an open side; ring 1: the cell just inside it (the air gap behind the glass)
const ring0 = (x, z) => NB.some(([dx, dz]) => !inF(x + dx, z + dz));
const ringOf = new Map();
for (const { x, z } of F.values()) if (ring0(x, z)) ringOf.set(key(x, z), 0);
for (const { x, z } of F.values()) if (!ringOf.has(key(x, z)) && NB.some(([dx, dz]) => ringOf.get(key(x + dx, z + dz)) === 0)) ringOf.set(key(x, z), 1);
const ringAt = (x, z) => ringOf.get(key(x, z)) ?? 2;

// lidar roof smoothed over 5 x 5: the core (16-17 from lidar) becomes one 17-block tier, everything else one 15-block tier
const smooth = (x, z) => {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const c = F.get(key(x + dx, z + dz)); if (c) { s += c.roof; n++; } }
  return s / n;
};
const tierOf = (x, z) => (smooth(x, z) >= 16.3 ? 17 : 15);

const GLASS = "light_blue_stained_glass", FRAME = "calcite", WALL = "white_concrete", BASE = "polished_andesite";
const FOUND = "stone_bricks", CAP = "stone_bricks", ROOF = "gray_concrete", AIR = null;
const ENTRY_X = 20, ENTRY_Z = 21;   // the main door on the south face, under the 18..22 entrance bay

const g = new Voxels([X, Y, Z]);
const set = (x, y, z, b, s) => { if (b) g.set(x, y, z, b, s); };
// warm light: a glowstone in the air gap behind one glazed bay in eight (the lower glass row of each storey)
const lit = new Set();
for (const { x, z } of F.values()) {
  if (ringAt(x, z) !== 0 || (x * 5 + z * 11) % 8 !== 0) continue;
  const inner = NB.map(([dx, dz]) => [x + dx, z + dz]).find(([a, b]) => ringAt(a, b) === 1);
  if (!inner) continue;
  for (const y of [1, 4, 7, 10, 13]) lit.add(`${inner[0]},${y},${inner[1]}`);
}

for (const { x, z, ground } of F.values()) {
  const R = tierOf(x, z);
  const r = ringAt(x, z);
  const outZ = !inF(x, z - 1) || !inF(x, z + 1), outX = !inF(x - 1, z) || !inF(x + 1, z);
  const pier = outZ && outX ? x % 3 === 0 || z % 3 === 0 : outZ ? x % 3 === 0 : z % 3 === 0;

  for (let y = 0; y < R; y++) {
    if (y < ground) { set(x, y, z, FOUND); continue; }
    // the top course: a cornice on the facade, a roof membrane inside
    if (y === R - 1) { set(x, y, z, r === 0 ? CAP : ROOF); continue; }
    // the base course, granite on the facade
    if (y === 0) { set(x, y, z, r === 0 ? BASE : WALL); continue; }
    // storey lines (calcite) every 3 blocks; the slab under each storey is solid all the way across
    if (y % 3 === 0) { set(x, y, z, r === 0 ? FRAME : WALL); continue; }
    // glazed rows between: glass with calcite piers on the facade, an air gap one cell behind the glass
    if (r === 0) {
      if (pier) { set(x, y, z, FRAME); continue; }
      set(x, y, z, GLASS);
      continue;
    }
    if (r === 1) { if (lit.has(`${x},${y},${z}`)) set(x, y, z, "glowstone"); continue; }
    set(x, y, z, WALL);
  }
}

// the entrance bay: a granite plinth, calcite lintel (already on the storey line), a door, and lanterns in the shop glass
for (let x = 18; x <= 22; x++) set(x, 0, ENTRY_Z, BASE);
set(ENTRY_X, 1, ENTRY_Z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
set(ENTRY_X, 2, ENTRY_Z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
set(18, 2, ENTRY_Z, "lantern", { hanging: "false" });
set(22, 2, ENTRY_Z, "lantern", { hanging: "false" });

// roof plant: a few 2x2 light-grey mechanical boxes on the 15-block wings, clear of the facade and the core
for (const { x, z } of F.values()) {
  if (x % 8 !== 4 || z % 6 !== 3) continue;
  const quad = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!quad.every(([a, b]) => inF(a, b) && ringAt(a, b) === 2 && tierOf(a, b) === 15)) continue;
  for (const [a, b] of quad) for (const y of [15, 16]) set(a, y, b, "light_gray_concrete");
}

const stats = g.save(`${DIR}/DC86701.nbt`);
console.log("wrote DC86701.nbt", stats);
