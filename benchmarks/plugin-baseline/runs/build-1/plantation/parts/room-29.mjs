// Part: room: ground gallery. The ground colonnade porch, inside the box x25..70 z35..41 (floor y4).
// Two bistro sets (a fence table with a top slab, three stair chairs, a standing lantern on the table) flank the central
// lane that runs from the front steps to the front door, and stand in the room's focal light. Benches (dark oak stairs)
// sit at the two ends, decorated pots as planters sit between, lamp posts stand between the columns, and hanging lanterns
// run down the centre line on chains from the upper deck. The lane z39..41 and x45..50 stays clear for walking.
// Drawn as text: a 46 x 7 canvas (x25..70, z35..41) per layer, placed with layers(). Chars not in the legend are skipped.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 25;
const Z0 = 35;
const W = 46;
const D = 7;

const LEGEND = {
  S: ["dark_oak_stairs", { facing: "south", half: "bottom" }], // bench, back to the south
  N: ["dark_oak_stairs", { facing: "north", half: "bottom" }], // chair, back to the north
  W: ["dark_oak_stairs", { facing: "west", half: "bottom" }], // chair, back to the west
  E: ["dark_oak_stairs", { facing: "east", half: "bottom" }], // chair, back to the east
  F: "dark_oak_fence", // table post, lamp post
  T: ["dark_oak_slab", { type: "top" }], // table top
  P: "decorated_pot", // planter
  L: ["lantern", { hanging: "false" }], // standing lantern
  H: ["lantern", { hanging: "true" }], // hanging lantern
  I: ["iron_chain", { axis: "y" }], // chain from the upper deck
};

const canvas = () => Array.from({ length: D }, () => Array(W).fill("."));
const put = (c, x, z, ch) => { c[z - Z0][x - X0] = ch; };

export function build(g) {
  const R = { 4: canvas(), 5: canvas(), 6: canvas(), 7: canvas(), 8: canvas(), 9: canvas() };

  // benches at the two ends, backs to the south, seats to the lawn
  for (const x of [28, 29, 66, 67]) put(R[4], x, 37, "S");

  // bistro set west of the lane: table (43,38), chairs N/W/E of it, lantern on the top slab
  put(R[4], 43, 37, "N"); put(R[4], 42, 38, "W"); put(R[4], 43, 38, "F"); put(R[4], 44, 38, "E");
  put(R[5], 43, 38, "T"); put(R[6], 43, 38, "L");
  // bistro set east of the lane, mirrored about x = 47.5
  put(R[4], 52, 37, "N"); put(R[4], 51, 38, "W"); put(R[4], 52, 38, "F"); put(R[4], 53, 38, "E");
  put(R[5], 52, 38, "T"); put(R[6], 52, 38, "L");

  // planters between the bistro sets and the benches
  put(R[4], 39, 37, "P"); put(R[4], 56, 37, "P");

  // lamp posts between the columns (fence y4..6, standing lantern y7)
  for (const x of [34, 61]) {
    put(R[4], x, 36, "F"); put(R[5], x, 36, "F"); put(R[6], x, 36, "F"); put(R[7], x, 36, "L");
  }

  // standing lanterns on the floor at the two ends and mid-gallery, clear of the window shutter cells (x27, 53, 56, 59, 62, 65, 68)
  for (const x of [26, 57, 69]) put(R[4], x, 41, "L");
  put(R[4], 38, 37, "L");

  // hanging lanterns down the centre line: chain y8..9 from the deck (ceiling y10), lantern y7.
  // x47 is already hung by the colonnade's porchLantern (lantern y8, chain y9), so it is left to that part.
  for (const x of [29, 35, 41, 54, 60, 66]) {
    put(R[9], x, 38, "I"); put(R[8], x, 38, "I"); put(R[7], x, 38, "H");
  }

  const rows = [4, 5, 6, 7, 8, 9].map((y) => R[y].map((r) => r.join("")));
  layers(g, [X0, 4, Z0], LEGEND, rows);

  // lamplighter: the three dim cells on the front row of the lane (x46, x48, x49 at z41, light 7). One lantern hangs
  // from the deck on a chain at x47 z40, on the lane's centre line (the colonnade's porchLantern hangs at z38, x47),
  // and lifts them to 8+. It hangs above head height, so the entry stays clear. Not under the door cap: the cap
  // (z41, y9) is not built yet, and the cells there are air.
  g.set(47, 9, 40, "iron_chain", { axis: "y" });
  g.set(47, 8, 40, "lantern", { hanging: "true" });
}
