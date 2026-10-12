// Room: Drying lean-to (interior designer's part, box [15,1,18,18,3,24]).
// Floor grid from `mcd plan`, origin [15, 1, 18] (x 15..18, z 18..24). Layout:
//  - the candle racks on the east side (x=17) and the tallow barrels at the back-west (x=15, z=18..19) are built by
//    grounds.mjs (P6); this part puts the lit candles on the barrels and the lanterns over the racks, so the racks'
//    east side is the brightest corner.
//  - the lane x=16 stays clear from the back door (16,2..3,18) to the south opening; x=18 stays clear to the east.
// Light: 2 hanging lanterns from the lean-to slab roof (y=4), 2 lit candle clusters on the barrels (the racks' two
// clusters come from P6).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  b: "barrel",
  F: "dark_oak_fence",
  T: ["dark_oak_trapdoor", { facing: "north", half: "top", open: "false", powered: "false", waterlogged: "false" }],
  C: ["white_candle", { candles: "3", lit: "true", waterlogged: "false" }],
  c: ["white_candle", { candles: "2", lit: "true", waterlogged: "false" }],
  L: ["lantern", { hanging: "true", waterlogged: "false" }],
};

// The floor row (y=1: the barrels, the rack uprights and shelves) is built by grounds.mjs (P6), so this part starts at
// y=2 (candles) and adds y=3 (lanterns); rows run along +z from z=18, columns along +x from x=15
const ROWS = [
  [ // y=2
    "c...", // z18
    "C...", // z19
    "....", // z20
    "....", // z21
    "....", // z22
    "....", // z23
    "....", // z24
  ],
  [ // y=3
    "....", // z18
    "....", // z19
    "..L.", // z20
    "....", // z21
    "....", // z22
    "..L.", // z23
    "....", // z24
  ],
];

export function build(g) {
  layers(g, [15, 2, 18], LEGEND, ROWS);
}
