// Part: room: H2 lobby and stair hall (florist). Interior box x 22..24, y 2..7, z 8..23. The front door (23,7), the rear
// door (23,24) and the keeper's door (21,22) stay open; the stair foot (z 12) and the x 22 lane stay clear.
// Furniture sits on the east side (x 23..24) at the front and back of the hall; the lane runs down x 22.
// Focal piece: a florist's stand of two barrels with pots (pink tulip, azalea) at z 9..10, lit by the lantern above.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  T: "dark_oak_fence",                          // table leg
  U: ["dark_oak_slab", { type: "top" }],        // table top
  C: ["dark_oak_stairs", { facing: "south" }],  // chair, back to the south, facing the table to its north
  E: ["dark_oak_stairs", { facing: "east" }],   // chair, back to the east wall, facing the table to its west
  B: "barrel",                                  // plant stand
  Q: "potted_pink_tulip",
  R: "potted_azalea_bush",
  P: "flower_pot",
  L: ["lantern", { hanging: "true" }],
};

// Rows run along +x (x 22, 23, 24); successive rows along +z (z 8 .. 23). '.' is left as it is.
// A layer is 16 rows of z 8..23 built from a map of z -> row.
function layer(rows) {
  const out = [];
  for (let z = 8; z <= 23; z++) out.push(rows[z] ?? "...");
  return out;
}

// y 2: the floor level, the furniture's feet
const Y2 = layer({
  9: ".TB",   // table leg (23,9); focal barrel (24,9)
  10: ".CB",  // chair (23,10) facing north to the table; focal barrel (24,10)
  19: "..B",  // barrel (24,19) carrying a flower pot
  21: ".TE",  // table leg (23,21); chair (24,21) facing west to the table
  23: "..B",  // barrel by the rear door's inner cell
});

// y 3: table tops and what stands on the barrels
const Y3 = layer({
  9: ".UQ",   // table top (23,9); pink tulip pot on the focal barrel (24,9)
  10: "..R",  // azalea pot on the focal barrel (24,10)
  19: "..P",  // flower pot on a barrel (24,19)  (barrel at z 19 below: see Y2 note)
  21: ".U.",  // table top (23,21)
  23: "..P",  // flower pot on the barrel (24,23)
});

// y 7: hanging lanterns from the ceiling (floor y 8 is solid over z 8..11, 18..23, and x 22 at z 12..17)
const Y7 = layer({
  8: "L..",   // at the front, lighting the entry cell (22,8,8)
  9: ".L.",   // above the focal table, from the solid floor at (23,8,9)
  11: ".L.",  // over the stair foot's clear strip, from the solid floor at (23,8,11)
  13: "L..",  // at x 22, z 13, the lane beside the stair well, from the solid floor at (22,8,13)
  14: "L..",  // at x 22, z 14, from the solid floor at (22,8,14)
  17: "L..",  // at x 22, z 17, the stair-foot side of the lane (the dim cells the lamp report named)
  20: ".L.",  // above the back table, from the landing floor at (23,8,20)
  22: ".L.",  // over the keeper's route, from the landing floor at (23,8,22)
});

const EMPTY = layer({});

export function build(g) {
  const origin = [22, 2, 8];
  layers(g, origin, LEGEND, [Y2, Y3, EMPTY, EMPTY, EMPTY, Y7]);
}
