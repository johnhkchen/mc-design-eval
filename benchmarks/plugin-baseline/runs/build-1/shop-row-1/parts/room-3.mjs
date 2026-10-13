// Part "room: stair lobby" (parts/room-3.mjs): the flats' entrance hall. Inner air [22,7,15,25,12,18]; origin [22,7,15].
// Clear by design: the flight 1 foot at x22..23 z15 (and its head), the north opening's first cells x24..25 z15, the
// street door's first cells x23..24 z18, and the lane x23..24 z16..17 from the street door to the stair. The focal piece
// is the hall table by the stair foot (fence leg, slab top, standing lantern), with the letterboxes on the east wall
// and a stair-seat bench on the west wall. Light: a hanging lantern under the landing floor over the lane.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // y 7..9: floor furniture, letterboxes and the table. Columns run x22..25, rows z15..18 ("o" is the stair, left alone).
  layers(g, [22, 7, 15], {
    "T": ["dark_oak_fence", {}],                                   // table leg
    "Q": ["dark_oak_slab", { type: "bottom" }],                    // table top
    "l": ["lantern", { hanging: "false" }],                        // standing lantern on the table
    "S": ["dark_oak_stairs", { facing: "west", half: "bottom", shape: "straight" }], // seat, back to the west wall
    "D": ["dark_oak_trapdoor", { facing: "east", half: "top", open: "false" }],     // letterbox flap on the east wall
  }, [
    [   // y 7
      "oo  ",   // z15: stair foot (o), clear
      "    ",   // z16: lane
      "T   ",   // z17: table leg
      "S   ",   // z18: bench; the door's first cells x23..24 stay clear
    ],
    [   // y 8
      "    ",
      "    ",
      "Q   ",   // table top
      "    ",
    ],
    [   // y 9
      "    ",
      "   D",   // letterboxes on the east wall, z16..18
      "l  D",
      "   D",
    ],
  ]);

  // y 12: hanging lantern under the landing floor (y 13), over the lane, so the walk stays clear at head height.
  layers(g, [22, 12, 15], {
    "h": ["lantern", { hanging: "true" }],
  }, [
    [
      "    ",
      "    ",
      "  h ",   // x24 z17
      "    ",
    ],
  ]);
}
