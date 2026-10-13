// Part "room: flat 1W back room" (parts/room-8.mjs): bedroom and kitchen of flat 1W, inner air x 4..11, y 14..17, z 5..10.
// Entered by the flat door at (8,14..15,5); the front room opens at (7,14..15,11). The lane x 7..8 stays clear from the door
// to the opening. Kitchen (east): a campfire hearth on the counter end, counter with a slab worktop. Table and chairs in the
// middle, lit by a standing lantern on the table top. Wardrobe (west) with a flower pot. Two hanging lanterns for the dark.
// No bed: palette.json has no bed block, so the bedroom has no bed yet (see plan notes).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const legend = {
  P: "dark_oak_planks",                                  // counter base, wardrobe
  S: ["dark_oak_slab", { type: "bottom" }],              // counter top, table top
  F: "dark_oak_fence",                                   // table pedestal
  n: ["dark_oak_stairs", { facing: "north", half: "bottom", shape: "straight" }], // chair, back to the north
  s: ["dark_oak_stairs", { facing: "south", half: "bottom", shape: "straight" }], // chair, back to the south
  e: ["dark_oak_stairs", { facing: "east", half: "bottom", shape: "straight" }],  // chair, back to the east
  C: ["campfire", { facing: "west", lit: "true", signal_fire: "false" }],         // kitchen hearth
  f: "flower_pot",                                       // wardrobe top
  L: ["lantern", { hanging: "false" }],                  // standing lamp on the table
  h: ["lantern", { hanging: "true" }],                   // hanging lamp under the ceiling
};

// rows run along +x from x 4 to x 11, successive rows along +z from z 6 to z 10
const floor14 = [
  "P......C", // z 6: wardrobe, hearth on the counter end
  "P....n.P", // z 7: chair north of the table, counter
  ".....FeP", // z 8: table pedestal, chair east of it, counter
  ".....s.P", // z 9: chair south of the table, counter
  "........", // z 10: lane to the front opening
];
const top15 = [
  "f.......", // z 6: flower pot on the wardrobe
  ".......S", // z 7: counter worktop
  ".....S.S", // z 8: table top, counter worktop
  ".......S", // z 9: counter worktop
];
const lamp16 = [
  "........", // z 6
  "........", // z 7
  ".....L..", // z 8: standing lamp on the table top
  "........", // z 9
  "........", // z 10
];
const ceil17 = [
  "..h.....", // z 7: hanging lamp over the west lane
  "........",
  "......h.", // z 9: hanging lamp over the counter end
  "h.......", // z 10: hanging lamp over the south-west corner, which reads dimmest
];

export function build(g) {
  layers(g, [4, 14, 6], legend, floor14);
  layers(g, [4, 15, 6], legend, top15);
  layers(g, [4, 16, 6], legend, lamp16);
  layers(g, [4, 17, 7], legend, ceil17);
}
