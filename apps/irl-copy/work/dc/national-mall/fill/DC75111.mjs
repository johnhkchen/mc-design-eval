// DC75111: GSA Regional Office Building, 315 7th St SW, DC 20002, as a 1.21.1 module.
// A 1960s federal office slab on a stone base: a glazed curtain-wall ring with white spandrel bands, seven storeys
// (the ground floor and six above) in 2-block bands. Lidar roof heights are smoothed (3x3 median over the footprint)
// and snapped to two tiers, 14 and 16 blocks, with a 6-block annex where the roof reads low. The tall east wing is the
// stepped-up tower; its roof steps up above the centre's cornice line. The datum is the street-side ground (2): the
// entrance is at grade on the west face, and where the ground drops east a stone plinth shows the lower storey.
// No interiors: each glazed band has an air row behind the glass, every floor is a full slab, and a 6-block column
// grid carries the slabs. Roof plant sits on the roofs.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75111.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC75111.nbt";

const key = (x, z) => `${x},${z}`;
const F = new Map(cells.map(([x, z, g, r]) => [key(x, z), { x, z, g, r }]));
const inF = (x, z) => F.has(key(x, z));
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const ring = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));   // edge of the plan: the envelope

// Smoothed roof: median of the footprint cells in the 3x3 around each cell (lidar noise drops out).
const smooth = (c) => {
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const n = F.get(key(c.x + dx, c.z + dz)); if (n) vals.push(n.r);
  }
  vals.sort((a, b) => a - b);
  return vals[vals.length >> 1];
};
// Massing tiers: the low annex, the centre at 14, the east tower at 16.
const topOf = (r) => (r < 8 ? 6 : r >= 15 ? 16 : 14);
const CELL = new Map();
for (const c of F.values()) {
  const s = smooth(c);
  CELL.set(key(c.x, c.z), { x: c.x, z: c.z, ring: ring(c.x, c.z), top: topOf(s) });
}
const at = (x, z) => CELL.get(key(x, z));

// Storey rows: 0-1 plinth, 2 base slab, 3-4 ground-floor glazing, then slab (5,7,9,11,13,15) over glazing (6,8,10,12,14).
const GLAZE = new Set([3, 4, 6, 8, 10, 12, 14]);
const BASE = 2;

const g = new Voxels([30, 28, 34]);

// The structural column grid: solid through every row, inside the plan.
const isColumn = (x, z) => x % 6 === 0 && z % 6 === 0 && !ring(x, z);

// Entrance on the west face at grade (ground 2 there): two doors at z 15 and 16, flanked by polished-stone jambs.
const DOOR_Z = [15, 16];
const isDoor = (x, y, z) => x === 0 && DOOR_Z.includes(z) && (y === 3 || y === 4);
const isJamb = (x, y, z) => x === 0 && (z === 14 || z === 17) && (y === 3 || y === 4);

// Plan all cells first, then write: a column of solid under each cell up to its top.
for (const c of CELL.values()) {
  const { x, z, top, ring: edge } = c;
  for (let y = 0; y < top; y++) {
    if (y <= 1) { g.set(x, y, z, "stone_bricks"); continue; }               // plinth (and foundation under ground)
    if (y === BASE) { g.set(x, y, z, edge ? "polished_andesite" : "light_gray_concrete"); continue; }   // base course
    if (y === top - 1) { g.set(x, y, z, edge ? "polished_andesite" : "stone"); continue; }            // cornice / roof
    if (!GLAZE.has(y)) { g.set(x, y, z, edge ? "white_concrete" : "light_gray_concrete"); continue; }   // spandrel / floor slab
    // Glazed band: the envelope has glass between frames; the interior stays air behind it.
    if (edge) {
      if (isDoor(x, y, z)) {
        const half = y === 3 ? "lower" : "upper";
        const hinge = z === DOOR_Z[0] ? "left" : "right";
        g.set(x, y, z, "dark_oak_door", { facing: "west", half, hinge, open: "false", powered: "false" });
      } else if (isJamb(x, y, z)) g.set(x, y, z, "polished_andesite");
      else if ((x + z) % 3 === 0) g.set(x, y, z, "light_gray_concrete");   // mullion
      else g.set(x, y, z, "light_blue_stained_glass");
    } else if (isColumn(x, z)) g.set(x, y, z, "light_gray_concrete");
  }
}

// Entrance lantern in the lobby, hung from the slab above (interior air at row 4).
g.set(1, 4, 15, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light in some windows: an interior cell behind a glazed envelope cell, on a slab (never on glass).
for (const c of CELL.values()) {
  if (!c.ring) continue;
  for (let y = 3; y < c.top; y++) {
    if (!GLAZE.has(y) || isDoor(c.x, y, c.z) || isJamb(c.x, y, c.z)) continue;
    if ((c.x + c.z) % 3 === 0) continue;                                  // mullions only
    if ((c.x * 7 + c.z * 3 + y) % 11 !== 0) continue;                     // roughly one bay in eleven
    const n = DIRS.map(([dx, dz]) => at(c.x + dx, c.z + dz)).find((m) => m && !m.ring && !isColumn(m.x, m.z));
    if (!n) continue;
    g.set(n.x, y, n.z, (c.x + y) % 3 === 0 ? "shroomlight" : "glowstone");
  }
}

// Roof plant: 2x2 air-handling units on the centre roof (14) and on the tower roof (16), clear of the edge.
for (const c of CELL.values()) {
  if (c.ring || c.x % 9 !== 4 || c.z % 9 !== 5) continue;
  const quad = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => at(c.x + dx, c.z + dz));
  if (quad.some((m) => !m || m.ring || m.top !== c.top) || c.top < 14) continue;
  for (const m of quad) g.set(m.x, c.top, m.z, "iron_block");
}

const r = g.save(OUT);
console.log(`DC75111: ${r.blocks} blocks, palette ${r.palette}`);
