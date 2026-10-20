import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3395521";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 20, H = 15, D = 5;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground (clamped)
const ground = new Map();
const roofs = [];
for (const [x, z, gr, roof] of cells) {
  ground.set(`${x},${z}`, Math.max(0, Math.min(10, Math.round(gr))));
  roofs.push(Math.round(roof));
}

// Smooth the lidar roof into one flat parapet level: the median, held between
// one storey (about 4 blocks above the lowest ground) and the build limit.
roofs.sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
const lowestGround = Math.min(...ground.values());
const R = Math.min(14, Math.max(lowestGround + 4, median));

const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Brick piers every 3 blocks plus the building ends; glazing between.
const isPier = (x) => x % 3 === 0 || x === 0 || x === W - 1;

// Entrance bay on the street face (z = 0), centred on x = 9.
const DOOR_X = 9;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  // Each cell's top: the flat roof, or higher if the ground is high here.
  const r = Math.min(14, Math.max(R, gr + 4));

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (isPerim(x, z)) {
    // Base course
    g.set(x, gr, z, "polished_granite");

    // Walls: brick piers and glazed bays between them
    for (let y = gr + 1; y <= r - 2; y++) {
      g.set(x, y, z, isPier(x) ? "bricks" : "glass");
    }

    // Stone cornice / parapet
    g.set(x, r - 1, z, "stone_bricks");

    // Entrance: granite door surround on the street face
    if (z === 0 && (x === DOOR_X - 1 || x === DOOR_X + 1)) {
      for (let y = gr + 1; y <= r - 2; y++) g.set(x, y, z, "polished_granite");
    }
    if (z === 0 && x === DOOR_X && r - 2 >= gr + 2) {
      g.set(x, gr + 1, z, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    }
  } else {
    // Interior: floor slab at ground, roof deck at the top, air between.
    g.set(x, gr, z, "stone_bricks");
    g.set(x, r - 1, z, "smooth_stone");

    // Warm light: hanging lanterns from the roof deck
    if (z === 2 && x % 5 === 2 && r - 2 > gr + 1) {
      g.set(x, r - 2, z, "lantern", { hanging: "true", waterlogged: "false" });
    }
    // Shroomlight on the floor behind the front glazing
    if (z === 1 && x % 4 === 1 && gr + 1 <= r - 2) {
      g.set(x, gr + 1, z, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
