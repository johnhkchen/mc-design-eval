// Part: room: Sawmill hall. The interior furnisher's layout for the box [24,1,9,34,5,19], drawn as text over the
// plan's floor grid (origin [24,1,9]; rows run along +x, successive rows along +z; '.' is left alone).
// Kept clear: the saw carriage on x=28..30 (sawmill part), the 1-wide lanes at x=27 and x=31 from the north opening to the
// south doorway and the filing bench, and the filing bench, grindstone and barrel at (33..34, 1, 17..19) (fire part).
// Light: standing lanterns on fence posts, one each side of the saw and along the west bay.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [24, 1, 9];

const LEGEND = {
  "B": ["barrel", { facing: "up" }],                        // offcuts and tool bins
  "C": ["chest", { facing: "west" }],                      // tool chest
  "F": "spruce_fence",                                     // table leg and lamp post
  "L": ["lantern", { hanging: "false" }],                  // standing lamp on a post or table top
  "A": ["anvil", { facing: "north" }],                     // saw-sharpening anvil
  "S": ["spruce_stairs", { facing: "west", half: "bottom" }], // seat, back to the west
  "E": ["spruce_stairs", { facing: "east", half: "bottom" }], // seat, back to the east
  "P": ["spruce_slab", { type: "top" }],                   // table top
  "M": ["lectern", { facing: "west" }],                    // tally book
};

// y=1 (floor), then y=2, then y=3; rows are z=9..19, columns x=24..34.
const LAYERS = [
  [
    "B..........", // z 9
    "BF.......F.", // z 10
    "C.........M", // z 11
    ".A.........", // z 12
    "...........", // z 13
    "........F..", // z 14
    "........F.B", // z 15
    "SFE........", // z 16
    "F..........", // z 17
    "B..........", // z 18
    "B..........", // z 19
  ],
  [
    "...........", // z 9
    ".F.......F.", // z 10
    "...........", // z 11
    "...........", // z 12
    "...........", // z 13
    "........F..", // z 14
    "........L..", // z 15
    ".P.........", // z 16
    "L..........", // z 17
    "L..........", // z 18
    "...........", // z 19
  ],
  [
    "...........", // z 9
    ".L.......L.", // z 10
    "...........", // z 11
    "...........", // z 12
    "...........", // z 13
    "........L..", // z 14
    "...........", // z 15
    ".L.........", // z 16
    "...........", // z 17
    "...........", // z 18
    "...........", // z 19
  ],
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, LAYERS);
}
