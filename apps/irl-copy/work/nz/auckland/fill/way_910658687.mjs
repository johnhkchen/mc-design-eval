// Mt Eden village, a two-storey brick shop-and-flat block (c. 1910s-20s): brick walls on a stone plinth, a shopfront
// with a dark-wood fascia on the street (z = 0) face, sash-style upper windows with white painted surrounds, a smooth
// stone string course and cornice, a flat roof behind the parapet with a small plant box. Lidar roof is flat at 10.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658687.cells.json", "utf8"));   // [x, z, ground, roof]

const foot = new Map(cells.map(([x, z, gr, roof]) => [`${x},${z}`, { gr, roof }]));
const inFoot = (x, z) => foot.has(`${x},${z}`);
// a footprint cell whose neighbour is missing (or off the edge of the box) is on the outside
const perimeter = (x, z) => [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => !inFoot(x + dx, z + dz));

// Storey plan (y): 0 plinth, 1-3 shopfront / ground walls, 4 string course + floor, 5-8 upper storey, 9 cornice + roof deck, 10 plant.
const WALL = "bricks", PLINTH = "stone_bricks", STRING = "smooth_stone", FRAME = "white_concrete", FASCIA = "dark_oak_planks";
const shopfront = (x, z) => z === 0 && x >= 1 && x <= 6;                                 // the street face
const upperBay = (x, z) => (z === 0 && [1, 2, 4, 5].includes(x)) || (x === 7 && (z === 2 || z === 3)) || (x === 0 && (z === 2 || z === 4));
const groundBay = (x, z) => (x === 7 && (z === 2 || z === 3)) || (x === 0 && (z === 2 || z === 4));

// Blocks are collected first so panes can take their connections from what stands beside them.
const blocks = new Map(); const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => blocks.get(`${x},${y},${z}`);

for (const [x, z, , roof] of cells) {
  if (roof !== 10) throw new Error(`roof ${roof} at ${x},${z}: this build's levels are fixed for 10`);
  // interiors: a stone floor at 0, a slab per storey (oak at 4, the roof deck at 9), air between; no rooms
  put(x, 0, z, PLINTH);
  if (!perimeter(x, z)) {
    put(x, 4, z, "oak_planks"); put(x, 9, z, "gray_concrete"); continue;
  }
  for (let y = 1; y <= 9; y++) {
    if (y === 4) { put(x, y, z, STRING); continue; }
    if (y === 9) { put(x, y, z, STRING); continue; }                                    // cornice, the parapet's top course
    if (shopfront(x, z)) {
      if (y <= 2 && x === 3) { put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      if (y <= 2 && [2, 4, 5].includes(x)) { put(x, y, z, "glass"); continue; }
      if (y === 3) { put(x, y, z, FASCIA); continue; }
      if (y <= 2) { put(x, y, z, WALL); continue; }                                    // the pillars either side of the shop
    }
    if (y <= 2 && groundBay(x, z)) { put(x, y, z, "glass_pane"); continue; }
    if (y === 3 && groundBay(x, z)) { put(x, y, z, FRAME); continue; }
    if (y === 5 && upperBay(x, z)) { put(x, y, z, FRAME); continue; }                 // sill
    if (y === 8 && upperBay(x, z)) { put(x, y, z, FRAME); continue; }                 // head
    if ((y === 6 || y === 7) && upperBay(x, z)) { put(x, y, z, "glass_pane"); continue; }
    put(x, y, z, WALL);
  }
  if (shopfront(x, z)) put(x, 0, z, PLINTH);
}

// the roof: a light plant box on the deck, two cells across
for (const [x, z] of [[5, 3], [6, 3], [5, 4], [6, 4]]) put(x, 10, z, "light_gray_concrete");

// warm light: glowstone and shroomlight behind the upper glass, lanterns on the shop floor behind the glass
put(2, 6, 1, "glowstone"); put(5, 6, 1, "shroomlight");
put(2, 1, 1, "lantern", { hanging: "false" }); put(5, 1, 1, "lantern", { hanging: "false" });

// panes take their connections from the blocks beside them (a pane meets a pane or a solid block)
const solidish = (b) => b && b.block !== "glass" && b.block !== "glass_pane" && !b.block.endsWith("_door");
const link = (x, y, z, dx, dz) => { const n = at(x + dx, y, z + dz); return n && (n.block === "glass_pane" || solidish(n)) ? "true" : "false"; };
for (const [k, b] of blocks) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  b.state = { north: link(x, y, z, 0, -1), south: link(x, y, z, 0, 1), east: link(x, y, z, 1, 0), west: link(x, y, z, -1, 0), waterlogged: "false" };
}

const g = new Voxels([8, 23, 6]);
for (const [k, b] of blocks) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, b.block, b.state); }
g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_910658687.nbt");
