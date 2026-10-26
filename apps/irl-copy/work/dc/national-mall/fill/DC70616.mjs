// A 2-storey Federal-style brick block (c. 1800-1830) on the Mall: red brick walls, white marble trim, stone plinth,
// a flat roof behind a quartz cornice, and a 1-block taller pavilion over the middle bays (the lidar's 7 against 6).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC70616.cells.json`, "utf8"));

const g = new Voxels([9, 19, 3]);

const FRONT_WINDOWS = new Set([1, 3, 5, 7]);   // z = 0, the street face; x = 4 is the entrance pier
const BACK_WINDOWS = new Set([3, 5, 7]);       // z = 2; x = 1 has no back cell, so no window there
const ROOMS = new Set([3, 5, 7]);              // z = 1 air behind a window pair (glass on both faces)
const GLASS = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const DOOR = { facing: "north", hinge: "left", open: "false", powered: "false" };
const has = new Set(cells.map(([x, z]) => `${x},${z}`));

for (const [x, z, ground, roof] of cells) {
  // outer skin: the street and back faces, the end piers, and any middle cell with a missing neighbour front or back
  const facade = z !== 1 || !has.has(`${x},0`) || !has.has(`${x},2`) || x === 0 || x === 8;
  const windows = z === 0 ? FRONT_WINDOWS.has(x) : z === 2 ? BACK_WINDOWS.has(x) : false;
  for (let y = ground; y < roof; y++) {
    const top = y === roof - 1;
    let block = null, state;
    if (y === 0) block = "stone_bricks";                            // plinth, and the window sills
    else if (top) block = facade ? "smooth_quartz" : "stone";      // cornice; roof deck inside the parapet
    else if (y === 3) block = facade ? "smooth_quartz" : "smooth_stone"; // belt course; floor slab
    else if (y === 5) block = "bricks";                             // frieze (pavilion bays only)
    else if (!facade) {
      // interior core: solid brick, with the air gap behind the glass in the storey rows
      if (ROOMS.has(x) && (y === 1 || y === 2 || y === 4)) {
        if ((x === 5 && y === 1) || (x === 3 && y === 4)) block = "glowstone";   // warm light behind the glass
      } else block = "bricks";
    } else if (x === 0 || x === 8) {
      block = y % 2 === 1 ? "smooth_quartz" : "bricks";            // quoins on the end piers
    } else if (windows && (y === 1 || y === 2 || y === 4)) {
      block = "glass_pane"; state = GLASS;
    } else if (z === 0 && x === 4 && (y === 1 || y === 2)) {
      block = "oak_door"; state = { ...DOOR, half: y === 1 ? "lower" : "upper" };  // the entrance
    } else if (z === 0 && x === 4 && y === 4) {
      block = "lantern"; state = { hanging: "false", waterlogged: "false" };     // lamp over the door
    } else block = "bricks";
    if (block) g.set(x, y, z, block, state);
  }
}

// a brick chimney stack on the pavilion's deck
g.set(5, 7, 1, "bricks");
g.set(5, 8, 1, "bricks");
g.set(5, 9, 1, "stone_brick_slab", { type: "bottom", waterlogged: "false" });

const out = g.save(`${DIR}/DC70616.nbt`);
console.log(`DC70616.nbt: ${out.blocks} blocks, ${out.palette} palette entries`);
