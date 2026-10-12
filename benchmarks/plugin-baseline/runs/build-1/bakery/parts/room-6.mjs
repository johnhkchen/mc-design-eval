// Room part, Mehlboden (flour loft): the interior designer's furniture inside the box [9,12,9,13,16,21].
// Ways in: the attic stair from the bedroom (shell: up the x=10 column, through the hole at (10,11,18..20)), arriving on
// the stair top (10,12,17) and walking onto the floor from there; and the loft door sill (11,15,8) at the top of the
// stair stack (reached only from inside, the door opens onto air).
// The stair stack climbs north: (11,12,12), (11,13,11), (11,14,10), deck (11,14,9). The walk lane x=10..11, z=13..20 stays clear.
// Light: lanterns on posts and barrels at (12,13,11) (focal, at the stair foot), (9,13,14), (13,13,17), (13,13,20).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: ["barrel", { facing: "up" }], // flour barrels
  h: "hay_block", // hay sacks
  f: "spruce_fence", // lantern posts
  l: ["lantern", { hanging: false }], // standing lanterns on a post or barrel
  S: ["spruce_stairs", { facing: "north", half: "bottom" }], // the stair stack, rising north
  P: "spruce_planks", // the deck at the top of the stair
};

// one layer per y (12..14), one row per z (9..21), five columns per row (x 9..13)
const LAYERS = [
  // y=12: sacks and barrels by the walls, the stair foot, the lantern post at the stair
  [
    "h    ", // z=9
    "h   h", // z=10
    "   f ", // z=11
    "  S  ", // z=12
    "     ", // z=13
    "f   h", // z=14 (lantern post at x=9; hay sack at x=13)
    "    b", // z=15
    "    b", // z=16
    "    f", // z=17
    "     ", // z=18
    "     ", // z=19
    "    b", // z=20 (barrel under the entrance lantern)
    "     ", // z=21
  ],
  // y=13: stacked sack and barrel, lanterns
  [
    "h    ", // z=9
    "     ", // z=10
    "  Sl ", // z=11 (stair (11,13,11), focal lantern at (12,13,11))
    "     ", // z=12
    "     ", // z=13
    "l    ", // z=14 (lantern on the post)
    "    b", // z=15
    "     ", // z=16
    "    l", // z=17 (lantern on the post)
    "     ", // z=18
    "     ", // z=19
    "    l", // z=20 (lantern on the barrel)
    "     ", // z=21
  ],
  // y=14: the top of the stair and the deck
  [
    "  P  ", // z=9 (deck (11,14,9))
    "  S  ", // z=10 (stair (11,14,10))
    "     ", // z=11
    "     ", // z=12
    "     ", // z=13
    "     ", // z=14
    "     ", // z=15
    "     ", // z=16
    "     ", // z=17
    "     ", // z=18
    "     ", // z=19
    "     ", // z=20
    "     ", // z=21
  ],
];

export function build(g) {
  let placed = 0;
  LAYERS.forEach((rows, i) => {
    placed += layers(g, [9, 12 + i, 9], LEGEND, rows);
  });
  return placed;
}
