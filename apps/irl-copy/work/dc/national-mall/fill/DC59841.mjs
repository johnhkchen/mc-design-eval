// DC59841: a three-bay Federal-era brick row building on the Mall's flank. Lidar roof: 5 blocks over the main body,
// a 3-high rear wing at the z=0 end. Read as a late-19th-century commercial block: stone plinth, a smooth sandstone
// belt course and cornice, red brick walls with paired windows on the long sides, a shopfront and a central door on
// the z=9 front, a brick chimney and one rooftop unit. Walls are one block thick around an air-filled interior with
// a floor slab per storey (y=2 floor, y=4 roof).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59841.cells.json", "utf8"));
const roof = new Map(cells.map(([x, z, ground, top]) => [`${x},${z}`, { ground, top }]));

const g = new Voxels([3, 17, 10]);

const PLINTH = "stone_bricks";
const BRICK = "bricks";
const STONE = "smooth_sandstone";   // belt course, sills, cornice
const ROOF = "smooth_stone";        // flat roof membrane (interior cap)
const FLOOR = "oak_planks";         // floor slab per storey
const GLASS = "glass_pane";
const GLOW = "glowstone";

const paneState = (x, z) => {
  // long walls (x 0 and 2) run along z; the front (z 9) runs along x and meets the wall at z 8 to its north
  if (z === 9) return { north: "true", south: "false", east: "false", west: "false" };
  return { north: "true", south: "true", east: "false", west: "false" };
};
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });

for (const [key, { ground, top }] of roof) {
  const [x, z] = key.split(",").map(Number);
  const perimeter = x === 0 || x === 2 || z === 0 || z === 9;
  const interior = !perimeter;

  // foundation: solid from y 0 up to the cell's ground (plinth course; ground 1 cells fill their y 0)
  for (let y = 0; y < Math.max(1, ground); y++) g.set(x, y, z, PLINTH);

  for (let y = 1; y < top; y++) {
    const isTop = y === top - 1;

    if (isTop) {
      // cornice / parapet on the perimeter, roof membrane over the interior
      g.set(x, y, z, perimeter ? STONE : ROOF);
      continue;
    }

    if (interior) {
      if (y === 2) g.set(x, y, z, FLOOR);     // floor slab between the storeys
      continue;                               // otherwise air behind the glass
    }

    // perimeter walls
    if (y === 2) {
      if (z === 9 && x === 1) g.set(x, y, z, "oak_door", doorState("upper"));
      else g.set(x, y, z, STONE);             // belt course: sills above the ground floor, lintels below the upper
      continue;
    }

    if (z === 9 && x === 1) {
      if (y === 1) g.set(x, y, z, "oak_door", doorState("lower"));
      else g.set(x, y, z, GLASS, { north: "true", south: "false", east: "false", west: "false" });  // fanlight over the door
      continue;
    }

    const windowBay = (x === 0 || x === 2) && z % 2 === 0 && z >= 2 && z <= 8;
    const frontWindow = z === 9 && (x === 0 || x === 2);
    if (windowBay || frontWindow) g.set(x, y, z, GLASS, paneState(x, z));
    else g.set(x, y, z, BRICK);                // piers and the rear wall
  }
}

// rooftop: a rooftop unit mid-roof and a brick chimney on the east cornice, capped
g.set(1, 5, 3, "iron_block");
g.set(2, 5, 6, BRICK);
g.set(2, 6, 6, BRICK);
g.set(2, 7, 6, STONE);

// warm lights behind the glass, and a hanging lantern in the front hall
g.set(1, 1, 4, GLOW);
g.set(1, 3, 6, GLOW);
g.set(1, 1, 8, GLOW);
g.set(1, 3, 2, "lantern", { hanging: "true", waterlogged: "false" });

const stats = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59841.nbt");
console.log(JSON.stringify(stats));
