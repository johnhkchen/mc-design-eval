// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Child's room A (the interior designer fills this in; inner air box is in rooms.json).
// Small rear bedroom: the red bed on the west wall is the focal piece, a toy chest (barrel) in the NW corner, a desk
// (spruce fence and slab) with a stair-seat chair on the east wall under the window. Light: a standing lantern on
// the desk and a hanging lantern over the middle of the room. Walkable: door x11 z14 -> lane x11 z15..18 -> bed foot.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Floor grid for the inner air box x10..13, z15..21 (origin [10, 19, 15]); rows run along +x, successive rows along +z.
// Layer y19: floor furniture and rugs. Layer y20: desk top. Layer y21: lantern on the desk. Layer y22: hanging lantern.
const ORIGIN = [10, 19, 15];

const LEGEND = {
  C: "barrel",                                             // toy chest
  k: ["spruce_stairs", { facing: "west", half: "bottom" }], // desk chair, seat faces east
  f: "spruce_fence",                                       // desk leg
  H: ["red_bed", { facing: "west", part: "head" }],        // bed head against the west wall
  F: ["red_bed", { facing: "west", part: "foot" }],        // bed foot, same facing
  r: "red_carpet",                                         // rug at the foot of the bed
  S: ["spruce_slab", { type: "top" }],                     // desk top, on the fence
  l: ["lantern", { hanging: "false" }],                    // lamp on the desk
  h: ["lantern", { hanging: "true" }],                     // hanging lamp from the ceiling
};

const FLOOR = [                  // y19, rows z15..21
  "C   ",                        // z15: toy chest in the NW corner; x11 z15 is the doorway's first cell, kept clear
  "    ",                        // z16
  "  kf",                        // z17: chair (x12) and desk (x13) under the window
  "    ",                        // z18
  "HFrr",                        // z19: bed, head on the west wall
  "l rr",                        // z20: rug continues; standing lamp on the floor in the SW corner
  "    ",                        // z21: clear in front of the window
];
const DESK_TOP = [               // y20: desk top (z17)
  "    ", "    ", "   S", "    ", "    ", "    ", "    ",
];
const DESK_LAMP = [              // y21
  "    ", "    ", "   l", "    ", "    ", "    ", "    ",
];
const CEILING_LAMP = [           // y22
  "    ", "    ", " h  ", "    ", "    ", "    ", "    ",
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [FLOOR, DESK_TOP, DESK_LAMP, CEILING_LAMP]);
}
