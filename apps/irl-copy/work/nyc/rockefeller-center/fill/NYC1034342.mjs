// 26 West 47th Street (BIN 1034342): Commercial & Office, built 1920. A narrow mid-block lot on the north side of 47th,
// so its street face is the south (high z) end. Six storeys of brick with cream stone belts and a granite base,
// shopfront with a recessed door at the street, and a penthouse bulkhead on a roof that lidar puts at 21 (parapet to 23).
// The lidar roof is 21 over almost every cell, with 22-23 noise along the middle columns: the massing is one flat
// roof at 21 and a penthouse to 23 where that noise sits.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034342.cells.json`, "utf8"));

const W = 5, D = 24, H = 35;
const g = new Voxels([W, H, D]);
const FRONT = D - 1, REAR = 0, WEST = 0, EAST = W - 1;
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });

// Storeys: floor slabs at y = 1, 4, 7, 10, 13, 16, 19 (cornice); windows on the two rows between each pair.
const isFloor = (y) => y >= 1 && y <= 19 && (y - 1) % 3 === 0;
const isGround = (y) => y === 2 || y === 3;

for (const [x, z] of cells) {
  const edge = x === WEST || x === EAST || z === REAR || z === FRONT;
  g.set(x, 0, z, "polished_granite");                          // plinth under every cell
  for (let y = 1; y <= 19; y++) {
    if (!edge) { if (isFloor(y)) g.set(x, y, z, "smooth_stone"); continue; }   // interior: slabs only, air behind glass
    if (isFloor(y)) { g.set(x, y, z, y === 1 ? "polished_granite" : "smooth_sandstone"); continue; }
    if (z === FRONT) {
      if (x === WEST || x === EAST) g.set(x, y, z, isGround(y) ? "polished_granite" : "smooth_sandstone");   // quoins
      else if (x === 2 && isGround(y)) g.set(x, y, z, "dark_oak_door", door("south", y === 2 ? "lower" : "upper"));
      else if (x === 2) g.set(x, y, z, "bricks");                                                           // mullion
      else g.set(x, y, z, "glass");
    } else if (z === REAR) {
      if (x === 2 && isGround(y)) g.set(x, y, z, "dark_oak_door", door("north", y === 2 ? "lower" : "upper"));
      else if (x === 1 || x === 3) g.set(x, y, z, "glass");
      else g.set(x, y, z, isGround(y) ? "polished_granite" : "bricks");
    } else {                                                    // side walls: a window every third cell
      if (isGround(y)) g.set(x, y, z, "polished_granite");
      else g.set(x, y, z, z % 3 === 0 ? "glass" : "bricks");
    }
  }
  // Parapet: a brick ring on the roof deck (y 20), with the street face up to 23 under a stone cap.
  if (edge) g.set(x, 20, z, "bricks");
  else g.set(x, 20, z, "stone");                                // roof membrane
  if (z === FRONT) { g.set(x, 21, z, "bricks"); g.set(x, 22, z, "smooth_sandstone"); }
}

// Penthouse bulkhead over the lidar's 23 cells (middle columns, middle of the lot), resting on the roof deck.
for (let x = 2; x <= 3; x++) for (let z = 7; z <= 14; z++) {
  g.set(x, 21, z, "bricks");
  g.set(x, 22, z, "smooth_sandstone");
}

// Entrance: the door is in the street front, with a lantern hung in the hall under the second floor slab.
g.set(2, 3, 22, "lantern", { hanging: "true", waterlogged: "false" });

// Warm light behind some glass: glowstone in the air gap directly behind the window.
for (const [x, y] of [[1, 2], [3, 2], [3, 5], [1, 8], [3, 11], [1, 14], [3, 17]]) g.set(x, y, 22, "glowstone");

const { blocks, palette } = g.save(`${DIR}/NYC1034342.nbt`);
console.log(`NYC1034342.nbt: ${blocks} blocks, palette ${palette}`);
