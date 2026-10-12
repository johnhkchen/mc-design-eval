// room: Kitchen (plan.md ROOMS/FLOORS: inner air [2,5,25,13,7,31], dark_oak_planks floor at y4).
// Work line on the east party wall (smoker + blast furnace as the focal stove, a water cauldron sink, counters),
// a pantry on the west wall (barrels and a chest), a breakfast table with stair seats, and hanging lanterns.
// The doorways (4..5 and 10..11 at z24) and the French doors (7..8 at z32) stay clear, with a 2-high path between.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const BARREL = "barrel";
const SMOOTH_STONE_SLAB = "smooth_stone_slab";

// A counter cell: a barrel base at y with a smooth stone slab top at y+1 (vocab.mjs counter helper, one cell).
function counterCell(g, x, y, z) {
  g.set(x, y, z, BARREL, { facing: "up", open: "false" });
  g.set(x, y + 1, z, ...B.slab("smooth_stone", "bottom"));
}

// A breakfast table: dark_oak_fence leg at y with a dark_oak_slab top at y+1.
function tableCell(g, x, y, z) {
  g.set(x, y, z, ...B.fence("dark_oak"));
  g.set(x, y + 1, z, ...B.slab("dark_oak", "top"));
}

// A seat: dark_oak_stairs whose open side faces the table (facing = the direction from the seat to the table).
function seat(g, x, y, z, facing) {
  g.set(x, y, z, ...B.stairs("dark_oak", facing, "bottom"));
}

export function build(g) {
  // East work line (x13, facing west): cauldron sink, smoker + blast furnace stove, counters.
  g.set(13, 5, 26, "water_cauldron", { level: "3" });
  g.set(13, 5, 27, "smoker", { facing: "west", lit: "false" });
  g.set(13, 5, 28, "blast_furnace", { facing: "west", lit: "false" });
  for (const z of [25, 29, 30, 31]) counterCell(g, 13, 5, z);

  // Back counter under the right kitchen window (x11..12 at z31), the prep sink corner.
  for (const x of [11, 12]) counterCell(g, x, 5, 31);

  // West pantry (x2 against the party wall): barrel stack, chest, then counters.
  g.set(2, 5, 26, BARREL, { facing: "up", open: "false" });
  g.set(2, 6, 26, BARREL, { facing: "up", open: "false" });
  g.set(2, 5, 27, "chest", { facing: "east", type: "single", waterlogged: "false" });
  g.set(2, 5, 28, BARREL, { facing: "up", open: "false" });
  for (const z of [29, 30, 31]) counterCell(g, 2, 5, z);

  // Breakfast table at (4,28) with four stair seats around it.
  tableCell(g, 4, 5, 28);
  seat(g, 4, 5, 27, "south");
  seat(g, 4, 5, 29, "north");
  seat(g, 3, 5, 28, "east");
  seat(g, 5, 5, 28, "west");

  // Hanging lanterns from the second-floor ceiling (y8): the light for the room, the focal stove brightest.
  for (const [x, z] of [[4, 26], [10, 26], [7, 28], [12, 29], [3, 30], [9, 30]]) g.set(x, 7, z, ...B.lantern(true));
  g.set(13, 7, 27, ...B.lantern(true));
}
