// Part: room: cart lean-to. Interior of box [45,1,9,46,3,15]: a wheelwright's stock corner along the west end (barrels of
// spokes, logs of rim stock), a fence-and-slab bench with a lantern over it as the focal piece, a stair seat at the bench.
// The lane from the archway (x44 z11..12) runs through x45..46 z11..12 to the open east side, and stays clear.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  B: "barrel",
  N: ["lantern", { hanging: "false" }],
  L: ["stripped_spruce_log", { axis: "x" }],
  F: "spruce_fence",
  T: ["spruce_slab", { type: "top" }],
  C: ["spruce_stairs", { facing: "east", half: "bottom" }],
};

// Floor cells x 45..46 (two columns), rows z 9..15, layers y 1..3. Posts at (46,1..3,9/12/15) are already built: '.' skips them.
const LAYERS = [
  [ // y 1
    "B.", // z 9
    "..", // z 10 (cart bed, earlier part)
    "..", // z 11 (lane from the archway)
    "..", // z 12 (lane from the archway)
    "..", // z 13 (cart bed, earlier part)
    "FC", // z 14: bench fence, seat stair
    "L.", // z 15
  ],
  [ // y 2
    "N.", // z 9: lantern on the barrel
    "..", // z 10
    "..", // z 11
    "..", // z 12
    "..", // z 13 (one log high: a second course would make a step nobody can stand on)
    "..", // z 14: bench top slab dropped (cell taken by an earlier fence)
    "..", // z 15
  ],
  [ // y 3
    "..", // z 9
    "..", // z 10
    "..", // z 11
    "..", // z 12
    "..", // z 13
    "N.", // z 14: focal lantern on the bench
    "..", // z 15
  ],
];

export function build(g) {
  layers(g, [45, 1, 9], LEGEND, LAYERS);
}
