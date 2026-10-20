import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi shophouse / commercial block, c. 1990s: white concrete facade,
// glazed shopfront, red sign band, parapet roof with a cornice line.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341337589.cells.json", "utf8"));
const W = 18, H = 19, D = 5;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "smooth_stone");
  // Ground-floor slab / base course.
  g.set(x, gr, z, isPerim(x, z) ? "polished_andesite" : "smooth_stone");

  // Roof slab over every cell (interior ceiling and roof deck), at the cornice level.
  g.set(x, gr + 5, z, "smooth_stone");

  if (!isPerim(x, z)) {
    // Interior cells: floor slab only, plus a warm light behind the front glass.
    if (z === 1 && (x === 4 || x === 13)) g.set(x, gr + 2, z, "glowstone");
    continue;
  }

  // Perimeter walls, storey body gr+1..gr+4.
  for (let y = gr + 1; y <= gr + 4; y++) g.set(x, y, z, "white_concrete");
  // Parapet on the roof edge.
  g.set(x, gr + 6, z, "white_concrete");

  if (z === 0) {
    // Front (street) facade: shopfront glazing with piers, door and red sign band.
    const isPier = x === 0 || x === W - 1 || x === 1 || x === W - 2;
    const isDoor = x === 9;
    for (let y = gr + 1; y <= gr + 3; y++) {
      if (isDoor && y <= gr + 2) continue;
      if (isPier) g.set(x, y, z, "gray_concrete");
      else g.set(x, y, z, "glass_pane");
    }
    if (isDoor) {
      g.set(x, gr + 1, z, "oak_door", DOOR_LOWER);
      g.set(x, gr + 2, z, "oak_door", DOOR_UPPER);
      g.set(x, gr + 3, z, "glass_pane");
    }
    // Sign band / lintel under the parapet line.
    g.set(x, gr + 4, z, "red_concrete");
  } else if (z === D - 1) {
    // Back wall: punched windows on alternate bays.
    if (x % 2 === 0) {
      g.set(x, gr + 2, z, "glass_pane");
      g.set(x, gr + 3, z, "glass_pane");
    }
  } else {
    // Side walls (x = 0 or W-1): single window per cell in the middle row.
    if (z === 2) {
      g.set(x, gr + 2, z, "glass_pane");
      g.set(x, gr + 3, z, "glass_pane");
    }
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1341337589.nbt");
