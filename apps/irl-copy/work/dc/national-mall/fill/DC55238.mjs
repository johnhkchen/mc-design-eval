// 1419 10th St NW: a three-storey brick commercial block on a narrow 3 x 8 lot. Street front on the west face (x = 0)
// with shopfront glass on the ground floor, a stone belt course, one row of upper windows and a calcite cornice. The
// lidar roof is flat at 6 blocks, with a 1-block lower wing at the north-east corner and a 1-block attic on the raised
// south-west corner (its ground is 1 block up, so it carries the foundation).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC55238.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const g = new Voxels([3, 19, 8]);

const BRICK = "bricks", TRIM = "calcite", PLINTH = "stone_bricks", PANE = "glass_pane";
const pane = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const isGlassBay = (z) => z === 1 || z === 2 || z === 4 || z === 5;   // bays 1,2 and 4,5 are glazed; 0, 3 (door), 6, 7 are piers
const DOOR = { facing: "east", hinge: "left", open: "false", powered: "false" };

for (const [x, z, ground, roof] of cells) {
  const top = roof - 1;                       // highest block in this column
  g.set(x, 0, z, PLINTH);                     // base course and foundation under every cell

  for (let y = 1; y <= top; y++) {
    let block = BRICK, state;

    if (x === 0) {                            // street front
      if (y === top) block = TRIM;            // cornice / parapet course
      else if (y === 3) {                     // stone belt course; dark awning over the entrance
        if (z >= 2 && z <= 4) { block = "dark_oak_slab"; state = { type: "bottom", waterlogged: "false" }; }
        else block = TRIM;
      }
      else if (y <= 2 && z === 3) {           // entrance door, sill on the plinth
        block = "dark_oak_door";
        state = { ...DOOR, half: y === 1 ? "lower" : "upper" };
      }
      else if ((y === 1 || y === 2 || y === 4) && isGlassBay(z)) { block = PANE; state = pane; }
    } else if (x === 1) {                     // air behind the street glass: the two storeys' rooms, floor slab at y 3
      if (y === 1 || y === 2 || y === 4) {
        if (y === 4 && (z === 1 || z === 5)) block = "glowstone";       // warm light behind the upper glass
        else if (y === 1 && (z === 2 || z === 5)) { block = "lantern"; state = { hanging: "false", waterlogged: "false" }; }
        else continue;                        // air
      }
    } else {                                  // x = 2: rear wall, with some rear windows on the upper storey
      if (y === 4 && (z === 2 || z === 4 || z === 5)) { block = PANE; state = pane; }
    }

    g.set(x, y, z, block, state);
  }
}

// roof: a chimney stack on the back and a rooftop unit by the parapet
g.set(2, 6, 2, BRICK); g.set(2, 7, 2, BRICK);
g.set(1, 6, 4, "iron_block");

const res = g.save(`${DIR}/DC55238.nbt`);
console.log(JSON.stringify(res));
