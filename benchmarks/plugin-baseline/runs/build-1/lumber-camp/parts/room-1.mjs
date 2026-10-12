// Part: room: Bunkroom (interior furnisher + lamplighter). Inner air x5..9, y2..4, z9..16 (plan.md ROOMS).
// Layout: two double-decker bunks, one on the west wall (x=5) and one on the east wall (x=9), both at z=10..11 with
// their posts at z=9 and z=12. The 3-wide lane x=6..8 runs from the partition doorway (10,2..3,13) down to the back door
// (7,2..3,17), and stays clear. Footlockers and the washstand sit in the south-west and south-east corners; the
// loft ladder cells (5,2,15..16) and the back-door front cell (7,2,16) stay clear. Two lanterns hang from the loft floor.
import { bunkBed, hangLantern } from "../vocab.mjs";
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Double-decker bunks against the west and east walls.
  bunkBed(g, 5, 10, "south");
  bunkBed(g, 9, 10, "south");

  // Footlockers (chests), the washstand (a barrel and a cauldron) in the south corners. Rows run along +x from x=5,
  // successive rows along +z from z=13. Blocks not in the legend are left as they are.
  layers(g, [5, 2, 13], {
    "C": ["chest", { facing: "east" }],
    "D": ["chest", { facing: "west" }],
    "B": ["barrel", { facing: "up" }],
    "K": ["cauldron", {}],
  }, [
    "C....",   // z=13: west footlocker; the east cell (9,13) is the partition doorway's front, kept clear
    "B...D",   // z=14: washstand barrel; east footlocker
    ".....",   // z=15: clear, loft ladder access at (5,15)
    "....K",   // z=16: washstand cauldron in the south-east corner
  ]);

  // Two lanterns hanging from the loft floor (y=5), down the lane's centre line.
  hangLantern(g, 7, 4, 11, 0);
  hangLantern(g, 7, 4, 15, 0);
}
