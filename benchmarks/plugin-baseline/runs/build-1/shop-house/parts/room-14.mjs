// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Loft. Open-truss storage loft under the main roof: a lit smoker focal piece on the north wall (the cured-meat
// bay), sacks of hay on the west wall, a worktable with a stool, barrels for stores on the east side, and lanterns
// standing on the barrels and sacks as the light. The hatch (16, 23, 20) is in the floor below the box; the lane from it
// (x 15..16) is kept clear. Drawn as text with layers(): rows along +x (x 7..16), successive rows along +z (z 8..21).
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN_X = 7;
const ORIGIN_Z = 8;
const LOFT_FLOOR_Y = 24;

const FLOOR_LEGEND = {
  "b": ["barrel", { facing: "up" }],
  "S": ["smoker", { facing: "south", lit: "true" }],
  "h": ["hay_block", { axis: "y" }],
  "f": "spruce_fence",
  "i": ["spruce_stairs", { facing: "east", half: "bottom" }],
  "r": "red_carpet",
};

const TOP_LEGEND = {
  "L": ["lantern", { hanging: "false" }],
  "t": ["spruce_slab", { type: "bottom" }],
};

// y 24: the floor layer. Columns x 7..16, rows z 8..21.
const FLOOR_ROWS = [
  "..bbSbb...", // z 8  north wall: barrels either side of the smoker focal
  "..........", // z 9  open, in front of the focal
  "h.rrrr....", // z 10 hay sacks on the west wall, rug in front of the focal
  "h.rrrr....", // z 11
  "h...fi....", // z 12 worktable (fence) and its stool (stairs facing east)
  "..........", // z 13
  "..........", // z 14
  "..........", // z 15
  "..........", // z 16
  ".....bb...", // z 17 stores against the east side (x 12..13)
  ".....bb...", // z 18
  "..b.......", // z 19 one barrel south-west of the stores
  "..........", // z 20 clear: the hatch lane at x 15..16
  "..........", // z 21 clear: the ladder side
];

// y 25: the top layer (lanterns standing on barrels and sacks, the table top).
const TOP_ROWS = [
  "..L...L...", // z 8  lanterns on the focal barrels
  "..........", // z 9
  "..........", // z 10
  "L.........", // z 11 lantern on the hay sack
  "....t.....", // z 12 table top slab over the fence
  "..........", // z 13
  "..........", // z 14
  "..........", // z 15
  "..........", // z 16
  ".....L....", // z 17 lantern on the store barrel
  "..........", // z 18
  "..L.......", // z 19 lantern on the south-west barrel
  "..........", // z 20
  "..........", // z 21
];

/** Furniture and lights for the loft (the box x 7..16, y 24..27, z 8..21). */
export function build(g) {
  layers(g, [ORIGIN_X, LOFT_FLOOR_Y, ORIGIN_Z], { ...FLOOR_LEGEND, ...TOP_LEGEND }, [FLOOR_ROWS, TOP_ROWS]);
  // standing lanterns on the floor for the dim east edge (the room light map: 6..7 at x 15..16, z 11..14)
  g.set(16, LOFT_FLOOR_Y, 13, ...B.lantern(false));
  g.set(14, LOFT_FLOOR_Y, 17, ...B.lantern(false));
}
