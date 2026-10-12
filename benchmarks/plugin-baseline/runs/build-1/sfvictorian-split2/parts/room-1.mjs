// room: Garage (plan.md ROOMS: inner air [2,1,8,9,3,19], floor smooth_stone y0).
// Bare and practical: a parked car bay in the middle (the focal piece), a tool wall with barrels and a chest on the
// west party wall, a workbench with a stool at the back, and hanging lanterns. The garage door (z7 x2..5), the cellar
// doorway (10,1..2,12) and the laundry doorway (6..7,1..2,20) and the path between them stay clear.
// Stairs facing = the open front (the low side); the car's nose and rear slope follow that.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const NO_LINKS = { north: "false", south: "false", east: "false", west: "false" };

export function build(g) {
  // ---- parked car: iron chassis x6..7 z12..16, cabin y2 z13..15, nose and rear slopes as stairs -----------------
  g.fill([6, 1, 12], [7, 1, 16], "iron_block");
  g.fill([6, 2, 13], [7, 2, 15], "iron_block");
  for (const x of [6, 7]) {
    g.set(x, 1, 11, ...B.stairs("dark_oak", "north", "bottom"));   // nose: low toward the garage door
    g.set(x, 1, 17, ...B.stairs("dark_oak", "south", "bottom"));   // rear: low toward the laundry
    g.set(x, 2, 11, ...B.lantern(false));                          // headlights
  }
  g.set(6, 3, 14, ...B.lantern(true));                             // hanging light over the car

  // ---- tool wall on the west party wall (x2, z12..15): chest, barrels, a shelf on the barrel ----------------------
  g.set(2, 1, 12, "chest", { facing: "east", type: "single", waterlogged: "false" });
  for (const z of [13, 14, 15]) g.set(2, 1, z, "barrel", { facing: "up", open: "false" });
  g.set(2, 2, 15, ...B.slab("oak", "bottom"));

  // ---- workbench at the back (x3, z18..19) with a stool on the room side (x4, z18) ------------------------------
  g.set(3, 1, 18, "crafting_table");
  g.set(3, 1, 19, "smithing_table");
  g.set(4, 1, 18, ...B.stairs("dark_oak", "west", "bottom"));
  g.set(9, 1, 18, "barrel", { facing: "up", open: "false" });      // stock barrel on the east side

  // ---- hanging lanterns from the main-floor slab: the room's light (y3, clear of the 2-high path) -------------
  for (const [x, z] of [[3, 10], [8, 10], [3, 17], [8, 16]]) g.set(x, 3, z, ...B.lantern(true));
}
