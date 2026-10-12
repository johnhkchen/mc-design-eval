// room: Kitchen (open plan): the open-plan kitchen inside [20,2,16,32,4,22]. Counters (spruce cabinets under
// dark_oak_slab worktops) run along the south wall (cauldron sink under the south windows, smoker + blast_furnace
// cooktop) and the north wall; a 3x2 island at x25..27 z18..19 with spruce_stairs stools on its north and south
// sides; hanging lanterns over the island. Walking lanes: z21 east-west, x20 and x29 north-south columns.
// Writes only into air inside the box, so earlier parts' blocks are never touched.
import { B, DIRS } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BOX = { x0: 20, y0: 2, z0: 16, x1: 32, y1: 4, z1: 22 };
const inBox = (x, y, z) => x >= BOX.x0 && x <= BOX.x1 && y >= BOX.y0 && y <= BOX.y1 && z >= BOX.z0 && z <= BOX.z1;

// Place a block only into air inside this room's box.
function put(g, x, y, z, block, state, nbt) {
  if (!inBox(x, y, z)) return;
  const here = g.blockAt(x, y, z);
  if (here && here !== "minecraft:air" && here !== "minecraft:cave_air") return;
  if (nbt) g.set(x, y, z, block, state, nbt);
  else g.set(x, y, z, block, state);
}

// A counter cell: spruce cabinet at y2 with a dark_oak_slab worktop at y3.
const counter = (g, x, z) => {
  put(g, x, 2, z, "spruce_planks");
  put(g, x, 3, z, ...B.slab("dark_oak", "bottom"));
};

export function build(g) {
  // ---- south wall (z22): sink under the south windows, cooktop, cabinets ------------------------------------------
  counter(g, 20, 22);
  counter(g, 21, 22);
  put(g, 22, 2, 22, "spruce_planks");
  put(g, 22, 3, 22, "cauldron");                       // sink, under the window at x21..23
  counter(g, 23, 22);
  put(g, 24, 2, 22, "barrel", { facing: "up", open: "false" });
  // x25..26 stay open: the way to the French doors at z23
  counter(g, 27, 22);
  counter(g, 28, 22);
  counter(g, 29, 22);
  put(g, 30, 2, 22, "smoker", { facing: "north", lit: "false" });      // cooktop, under the windows at x29..31
  put(g, 31, 2, 22, "blast_furnace", { facing: "north", lit: "false" });
  put(g, 32, 2, 22, "spruce_planks");
  put(g, 32, 3, 22, "flower_pot");

  // ---- north wall (z16): cabinets east of the foyer opening and west of the dining door -----------------------------
  // x20..25 stay open to the foyer hall; x29 stays open to the dining door
  counter(g, 26, 16);
  counter(g, 27, 16);
  counter(g, 28, 16);
  counter(g, 30, 16);
  counter(g, 31, 16);
  put(g, 32, 2, 16, "barrel", { facing: "up", open: "false" });

  // ---- island: 3 wide (x25..27) x 2 deep (z18..19), stools as seats on both long sides ---------------------------------
  for (let x = 25; x <= 27; x++) {
    for (let z = 18; z <= 19; z++) counter(g, x, z);
  }
  for (let x = 25; x <= 27; x++) {
    put(g, x, 2, 17, ...B.stairs("spruce", "north"));  // north stools, back to the north, facing the island
    put(g, x, 2, 20, ...B.stairs("spruce", "south"));  // south stools, back to the south
  }

  // ---- pendant lanterns over the island and the cooktop side -------------------------------------------------------
  put(g, 26, 4, 18, ...B.lantern(true));
  put(g, 26, 4, 19, ...B.lantern(true));
  put(g, 30, 4, 18, ...B.lantern(true));
  put(g, 22, 4, 18, ...B.lantern(true));
  put(g, 22, 4, 20, ...B.lantern(true));
}
