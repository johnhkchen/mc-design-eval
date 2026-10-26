import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1205 7th St NW: a red-brick walk-up apartment over a shop ground floor, c.1910s. Ground floor at y0 (the lowest
// ground), three upper storeys at 1 block each (y1..y3), a calcite cornice/parapet course at y4, and a central
// pediment bump (lidar roof 6) at x3..4 on the deck.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66588.cells.json", "utf8"));
const foot = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const g = new Voxels([7, 18, 5]);

const put = (x, y, z, block, state) => { if (foot.has(`${x},${z}`)) g.set(x, y, z, block, state); };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };   // on a front/back wall
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };   // on a side wall
const DOOR = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

const cellsIn = [...foot.keys()].map((k) => k.split(",").map(Number));
for (const [x, z] of cellsIn) {
  const ring = x === 0 || x === 6 || z === 0 || z === 4;
  const pier = x === 0 || x === 3 || x === 6;
  for (let y = 0; y <= 4; y++) {
    if (!ring) { if (y === 4) put(x, y, z, "smooth_stone"); continue; }   // hollow interior; roof deck over it
    if (y === 4) { put(x, y, z, "calcite"); continue; }                  // cornice / parapet course
    if (z === 0 || z === 4) {                                              // street and rear facades
      if (pier) put(x, y, z, y === 0 ? "stone_bricks" : "calcite", null);
      else put(x, y, z, "glass_pane", PANE_EW);
    } else {                                                               // side walls (x 0 / 6)
      if (y === 0) put(x, y, z, "stone_bricks", null);
      else if (z === 2) put(x, y, z, "glass_pane", PANE_NS);
      else put(x, y, z, "bricks", null);
    }
  }
}

// Street entrance: door under a canopy over the shopfront
put(3, 0, 0, "dark_oak_door", DOOR("lower"));
put(3, 1, 0, "dark_oak_door", DOOR("upper"));
for (const x of [2, 3, 4]) put(x, 2, 0, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// Central bay rises one block above the parapet (lidar roof 6 at x 3..4)
for (const x of [3, 4]) for (let z = 0; z <= 4; z++) put(x, 5, z, z === 0 || z === 4 ? "calcite" : "bricks");

// Roof: two brick chimney stacks on the deck
put(1, 5, 1, "bricks"); put(1, 6, 1, "bricks");
put(5, 5, 3, "bricks"); put(5, 6, 3, "bricks");

// Warm lights set into the facade as lit windows
put(5, 0, 0, "glowstone");      // shopfront
put(2, 1, 0, "shroomlight");    // street, storey 2
put(5, 2, 0, "glowstone");      // street, storey 3
put(1, 1, 4, "shroomlight");    // rear, storey 2
put(4, 3, 4, "glowstone");      // rear, top storey

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC66588.nbt");
console.log(stats);
