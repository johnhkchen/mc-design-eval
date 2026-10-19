// 21 East 47th Street (1936): a 5 x 25 block commercial and office building around an open light court.
// Massing follows the lidar roof per cell (smoothed): three-storey east and west walls, a one-block north wing,
// an eight-block street front with a low gap into the court. Each wall is a one-cell skin with air behind it
// (the court, or the rooms' air), so the glass has air behind and each storey line is a spandrel course.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035419.cells.json`, "utf8"));

// Lidar roof per cell, smoothed into clean tiers: single-cell 1s and 10s on the east wall are noise, (1,20) is noise,
// (4,9) has no return (roof 0) so it is filled as the wall it sits in. Every ground is 1 (a one-block foundation).
function roofOf(x, z) {
  if (z <= 1) return 1;                          // north lower wing
  if (x === 4) return 10;                        // east wall, three storeys
  if (x === 0) return z <= 5 ? 1 : 10;           // west wall from z 6
  if (z === 24) return x === 3 ? 1 : 8;          // street front: lobby at 8, low gap at x 3
  return 1;                                      // light court, open to the sky
}

const PANE = "light_blue_stained_glass_pane";
const SOLID = new Set(["minecraft:calcite", "minecraft:polished_granite", "minecraft:smooth_quartz",
  "minecraft:smooth_stone", "minecraft:glowstone"]);
// Lit windows (warm glowstone in the glass position), keyed x,y,z
const LIT = new Set(["4,4,8", "4,5,8", "4,4,20", "4,5,20", "4,7,14", "4,8,14",
  "0,1,10", "0,2,10", "0,1,17", "0,2,17", "0,7,22", "0,8,22", "2,4,24", "2,5,24"]);

const g = new Voxels([5, 21, 25]);
const panes = [];

// One wall cell above the foundation: spandrel course at each storey line, piers and glass between.
function skin(x, y, z, R) {
  if (y === R - 1 || y === 3 || y === 6) return "smooth_quartz";      // cornice / cap and storey lines
  if (z === 24 && (x === 1 || x === 2)) {                              // street front
    if (y <= 2) {
      if (x === 2) return null;                                       // door, placed below
      return PANE;
    }
    if (LIT.has(`${x},${y},${z}`)) return "glowstone";
    return PANE;
  }
  const pier = z % 3 === 0;                                           // piers every third block along the face
  if (y <= 2) return pier ? "polished_granite" : PANE;                // granite base storey
  if (LIT.has(`${x},${y},${z}`)) return "glowstone";
  return pier ? "calcite" : PANE;
}

for (const [x, z] of cells) {
  const R = roofOf(x, z);
  g.set(x, 0, z, R > 1 ? "polished_granite" : "smooth_stone");        // foundation, or the court and wing floor
  if (R === 1) {
    // parapets on the outer edge of the low wing and the court's west side
    if (z === 0 || (x === 0 && z <= 5) || (x === 4 && z <= 1)) g.set(x, 1, z, "calcite");
    continue;
  }
  for (let y = 1; y < R; y++) {
    const b = skin(x, y, z, R);
    if (b === null) continue;
    g.set(x, y, z, b);
    if (b === PANE) panes.push([x, y, z]);
  }
}

// Court dressing on the court floor (sits on the y 0 layer)
for (const [x, y, z] of [[1, 1, 4], [3, 1, 4], [1, 1, 20], [3, 1, 20]]) g.set(x, y, z, "flowering_azalea");
for (const [x, y, z] of [[2, 1, 8], [2, 1, 16]]) g.set(x, y, z, "lantern");

// Street door: two blocks tall, opening onto the street (facing north: the front faces the viewer outside, at +z)
const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
g.set(2, 1, 24, "dark_oak_door", door("lower"));
g.set(2, 2, 24, "dark_oak_door", door("upper"));

// Roof equipment: bulkheads on the cornice of the east and west walls
for (const [x, y, z] of [[4, 10, 14], [4, 10, 15], [4, 10, 16], [4, 11, 15], [0, 10, 11], [0, 10, 12], [0, 11, 11]])
  g.set(x, y, z, "calcite");

// Glass panes connect to neighbouring panes and solid blocks, not to air or the door
const at = (x, y, z) => g.get(x, y, z);
const connects = (nb) => !!nb && (nb.block.endsWith("glass_pane") || SOLID.has(nb.block));
for (const [x, y, z] of panes) {
  const state = {
    north: String(connects(at(x, y, z - 1))),
    south: String(connects(at(x, y, z + 1))),
    east: String(connects(at(x + 1, y, z))),
    west: String(connects(at(x - 1, y, z))),
    waterlogged: "false",
  };
  g.set(x, y, z, PANE, state);
}

const out = g.save(`${DIR}/NYC1035419.nbt`);
console.log(out);
