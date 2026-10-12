// Room: Kitchen (interior designer). Inner air box [1,5,24,14,8,29]: a back kitchen with a stone floor, a counter line
// along the rear wall under the rear windows (furnace and smoker lit as the focal hearth, crafting table, barrels, a
// cauldron sink), a farm table with stair-seats in the middle, hanging lanterns, and a dark oak railing round the
// cellar-stair hole at x13..14 z25..28. Doorways (4..5,5..6,23) and (11,5..6,23) and the French doors (7..8,5..7,30)
// stay clear; the path from the cellar arrival (13..14,5,29) runs west along z29 and z28.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { STONE } from "../vocab.mjs";

export function build(g) {
  // counter line along the rear wall (z29): stone bricks with the working pieces standing on it
  for (const x of [2, 5]) g.set(x, 5, 29, STONE);     // x=9 left open: a shell partition may stand there
  g.set(1, 5, 29, "barrel", { facing: "up", open: "false" });                   // pantry barrel in the corner
  g.set(3, 5, 29, "furnace", { facing: "north", lit: "true" });                  // focal hearth, lit
  g.set(4, 5, 29, "smoker", { facing: "north", lit: "true" });
  g.set(6, 5, 29, "crafting_table");
  g.set(10, 5, 29, "barrel", { facing: "up", open: "false" });
  g.set(11, 5, 29, "cauldron");                                                 // sink under the east window
  g.set(2, 6, 29, "flower_pot");                                                // potted sill plant
  // (7..8,5,29) is the French-door approach and (12,5,29) the cellar-stair path: left as air

  // west pantry on the party wall
  g.set(1, 5, 24, "barrel", { facing: "up", open: "false" });
  g.set(1, 5, 25, "barrel", { facing: "up", open: "false" });
  g.set(1, 5, 27, "composter", { level: "0" });

  // farm table at x6..8 z25..26: spruce slab top on four fence legs, stair chairs round it
  for (const x of [6, 7, 8]) for (const z of [25, 26]) g.set(x, 6, z, ...B.slab("spruce", "bottom"));
  for (const [x, z] of [[6, 25], [8, 25], [6, 26], [8, 26]]) g.set(x, 5, z, ...B.fence("spruce"));
  g.set(6, 5, 24, ...B.stairs("spruce", "south", "bottom"));                    // chairs face the table
  g.set(8, 5, 24, ...B.stairs("spruce", "south", "bottom"));
  g.set(7, 5, 27, ...B.stairs("spruce", "north", "bottom"));

  // railing round the cellar-stair hole (x13..14 z25..27 open at y5 over the stair; fenced on W, N and S)
  for (const z of [25, 26, 27]) g.set(12, 5, z, ...B.fence("dark_oak"));
  for (const x of [13, 14]) g.set(x, 5, 24, ...B.fence("dark_oak"));
  for (const x of [13, 14]) g.set(x, 5, 28, ...B.fence("dark_oak"));

  // hanging lanterns: over the table, over the hearth and the sink; the focal hearth sits in the brightest light
  g.set(7, 8, 25, ...B.lantern(true));
  g.set(3, 8, 27, ...B.lantern(true));
  g.set(10, 8, 27, ...B.lantern(true));
}
