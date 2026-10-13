// Part: room: H2 loft (attic drying loft for flowers). Interior designer's layout, drawn as text over the plan grid
// (origin [13, 19, 8]: rows run along +z from z 8, columns along +x from x 13; the ladder hatch is (22, 18, 10)).
// Layer 0 = floor y 19, layer 1 = y 20, layer 2 = y 21. Blank text = left alone.
//   Focal piece: the drying table at z 13 (x 15..19), pots and a lantern on its top, chairs (stairs) either side.
//   Drying fire and hay stack in the south-west corner, barrel stores with lanterns on them.
//   Lanes: x 14 and x 20 north to south, z 11 across to the hatch side; the hatch cell and x 22..23 z 9..11 stay clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  B: ["barrel", { facing: "up", open: "false" }],
  N: ["spruce_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" }],
  S: ["spruce_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" }],
  f: ["spruce_fence", {}],
  T: ["spruce_slab", { type: "top", waterlogged: "false" }],
  H: ["hay_block", { axis: "y" }],
  K: ["campfire", { lit: "true", facing: "north", signal_fire: "false", waterlogged: "false" }],
  L: ["lantern", { hanging: "false", waterlogged: "false" }],
  P: ["potted_azalea_bush", {}],
  Q: ["potted_pink_tulip", {}],
  F: ["flower_pot", {}],
};

// z 8..24, one string per z; column 0 is x 13
const FLOOR_Y19 = [
  "", // z 8  wall
  "           B", // z 9  barrel store, x 24
  "           B", // z 10 barrel store, x 24 (the hatch at x 22 stays clear)
  "", // z 11 lane
  "   N N", // z 12 chairs facing the table
  "  f f f", // z 13 table legs
  "   S S", // z 14 chairs facing the table
  "     L", // z 15 standing lantern in the south lane, x 18
  "", "", "", "", // z 16..19 lane and stair well
  "", // z 20 (x 15 is the lighting part's lantern: no barrel here)
  "  B KL", // z 21 barrel, drying fire at x 17, standing lantern at x 18
  "  HH", // z 22 hay stack, x 15..16
  "", // z 23
  "", // z 24 wall
];

export function build(g) {
  // rows for y 20 and y 21 are indexed by z - 8, the same as the floor rows
  const y20 = Array(17).fill("");
  y20[5] = "  TTTTT"; // z 13 table top, x 15..19
  y20[13] = "  L"; // z 21 lantern on barrel top

  const y21 = Array(17).fill("");
  y21[5] = "   QLF"; // z 13 pots and the focal lantern on the table top (x 15 is roof stairs: no azalea)

  layers(g, [13, 19, 8], LEGEND, [FLOOR_Y19, y20, y21]);
}
