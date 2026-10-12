// Part: Fittings (doors, glass windows, shutters, porch and mill lanterns, loft ladder, mill sign and loft door).
// Every element writes only into air, so the openings the shell left as air are the only cells touched here.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { doorPair, paneWindow, shutterPair, hangLantern, loftLadder, wallSign } from "../vocab.mjs";

export function build(g) {
  // Doors (plan OPENINGS): front from the porch, back into the woodshed. Both face out of the building.
  doorPair(g, 13, 2, 8, "north", "left");
  doorPair(g, 7, 2, 17, "south", "left");

  // Glass windows (plan OPENINGS). Sills and the wall plane come from paneWindow.
  // Front (north, z=8): bunkroom x=6..7, mess x=15..16; sills outside at z=7.
  paneWindow(g, 6, 7, 3, 4, 8, "x", { out: -1 });
  paneWindow(g, 15, 16, 3, 4, 8, "x", { out: -1 });
  // East (x=18): mess window z=9..10; loft window z=15 (1 wide x 2 high).
  paneWindow(g, 9, 10, 3, 4, 18, "z", { out: 1 });
  paneWindow(g, 15, 15, 8, 9, 18, "z", { out: 1 });
  // West (x=4): bunkroom window z=12..13; loft window z=12..13 (2 x 2).
  paneWindow(g, 12, 13, 3, 4, 4, "z", { out: -1 });
  paneWindow(g, 12, 13, 8, 9, 4, "z", { out: -1 });
  // Back (south, z=17): mess window x=14..15; sill outside at z=18.
  paneWindow(g, 14, 15, 3, 4, 17, "x", { out: 1 });

  // Shutters (plan FACADES): open trapdoors one cell either side of each ground window, flat on the wall.
  shutterPair(g, 6, 3, 8, "north", 2);    // bunkroom front: x=5 and x=8
  shutterPair(g, 15, 3, 8, "north", 2);   // mess front: x=14 and x=17
  shutterPair(g, 18, 3, 9, "east", 2);    // mess east: z=8 and z=11 at x=19
  shutterPair(g, 4, 3, 12, "west", 2);    // bunkroom west: z=11 and z=14 at x=3
  shutterPair(g, 14, 3, 17, "south", 2);  // mess back: x=13 and x=16 at z=18

  // Porch lanterns (plan FACADES): hung on iron chain from the porch roof slab at y=5, either side of the door.
  hangLantern(g, 12, 3, 6, 1);
  hangLantern(g, 14, 3, 6, 1);

  // Mill lanterns (plan SAWMILL lamps): hanging under the top plate at y=6, either side of the north opening.
  hangLantern(g, 25, 5, 8, 0);
  hangLantern(g, 33, 5, 8, 0);

  // Loft ladder (plan RESERVED): the ladder runs y=2..4 and the hatch is the loft floor cell above it, (5,5,16).
  // The plan's "2..5" would put the ladder in the hatch cell itself, so the column stops at 4.
  loftLadder(g, 5, 16, 2, 4, "north");

  // Sawmill sign on the plate face, pointing north over the road (plan SAWMILL).
  wallSign(g, 29, 6, 7, "north", "SAWMILL");

  // Mill gable loft door (plan OPENINGS): 1 wide x 2 high, filled with open trapdoors, hinged on the inside.
  for (const y of [8, 9]) {
    if (g.isAir(29, y, 8)) g.set(29, y, 8, ...B.trapdoor("spruce", "south", "bottom", true));
  }
}
