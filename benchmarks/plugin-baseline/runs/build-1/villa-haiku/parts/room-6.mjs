// room: atrium (plan.md ROOMS, box [10,2,9,25,5,20]): the open heart. The mosaic floor, the impluvium and the lamps
// belong to other parts; this part adds four potted plants at the room's corners and a low dark oak bench on the north side.
// Keeps the fauces opening (z=8, x16..19), the four doors and the tablinum opening (z=21, x14..21) and their walkways clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { pot } from "../vocab.mjs";

export function build(g) {
  // four potted plants, one per corner pair, clear of the doors at x=9 and x=26 (z=10, z=17) and the lamps at z=9 and z=20
  pot(g, 10, 15, "fern");
  pot(g, 25, 15, "azalea");
  pot(g, 10, 18, "azalea");
  pot(g, 25, 18, "fern");

  // a low bench along the north wall (z=10, x12..14): dark oak stairs, seats facing south onto the court
  for (let x = 12; x <= 14; x++) g.set(x, 2, 10, ...B.stairs("dark_oak", "south"));
  return g;
}
