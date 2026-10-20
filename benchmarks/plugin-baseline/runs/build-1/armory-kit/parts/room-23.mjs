// Interior designer for "Glasshouse north vestibule" (room 23): a 6 x 2 x 5 glass entry box. The ticket counter sits
// west (a lamp on top, a seat before it), a glass-column focal piece sits east (a sea lantern and a plinth at its foot,
// a bench before it), and the two-wide lane between the entrance and the inner opening stays clear. Light: a standing
// lantern on the counter and a sea lantern at the focal column's foot. No hanging lanterns: the glass roof is another
// part's, so a lantern under it would hang from air in any build that leaves that roof out.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// origin [234, 1, 1]: rows run along +x (x 234..239), successive rows along +z (z 1..2), one layer per y (1..5)
const LEGEND = {
  "#": "smooth_quartz",                                                 // ticket counter
  "t": ["smooth_quartz_stairs", { facing: "south", half: "bottom" }],   // seats, backs to the south wall
  "L": ["lantern", { hanging: "false" }],                               // standing lamp on the counter
  "S": "sea_lantern",                                                   // light at the focal column's foot
  "P": "polished_blackstone",                                           // focal plinth
  "R": "red_stained_glass",                                             // focal column, bottom to top:
  "O": "orange_stained_glass",                                          //   red, orange, yellow
  "Y": "yellow_stained_glass",
  "e": "end_rod",                                                       // tip of the column
};

export function build(g) {
  layers(g, [234, 1, 1], LEGEND, [
    // y 1: counter, seats, plinth and sea lantern
    [
      "##..SP",
      "#t..tt",
    ],
    // y 2: the counter lamp and the column's first course
    [
      "L....R",
      "......",
    ],
    // y 3
    [
      ".....O",
      "......",
    ],
    // y 4
    [
      ".....Y",
      "......",
    ],
    // y 5: the end rod
    [
      ".....e",
      "......",
    ],
  ]);
}
