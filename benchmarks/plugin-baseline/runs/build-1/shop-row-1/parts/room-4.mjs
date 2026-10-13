// Part "room: bin store" (parts/room-4.mjs): the bin store behind the stairs, 2 wide x 12 long, y 7..12, entered from the
// rear door (23,7..8,2) and the stair lobby (z 15). The x 24 column is kept clear as the lane from end to end; the bins,
// crates and the bicycle rail stand along the x 25 wall. The focal piece is the crate stack and hay at the far (south)
// end, where the rear door looks. Lanterns hang from the landing floor (y 13) and stand on the crates.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  "#": "dark_oak_planks",                 // crates and bin boxes
  "h": "hay_block",                       // bales of straw, the produce at the focal end
  "i": "iron_bars",                       // bicycle rail
  "L": ["lantern", { hanging: "false" }], // standing on a crate
  "H": ["lantern", { hanging: "true" }],  // hanging under the landing floor
};

// Rows z 3..14 (x 24, x 25), one layer per y from 7 to 12. A space leaves the cell as it is (air, the lane).
const ROWS = {
  7: [" #", " #", " h", " h", " i", " i", " i", "  ", " #", " #", " h", " h"],
  8: [" #", "  ", "  ", "  ", "  ", "  ", "  ", "  ", " #", " #", "  ", "  "],
  9: [" L", "  ", "  ", "  ", "  ", "  ", "  ", "  ", " L", "  ", "  ", "  "],
  10: Array(12).fill("  "),
  11: Array(12).fill("  "),
  12: ["  ", "H ", "  ", "  ", "  ", "  ", "H ", "  ", "  ", "  ", "  ", "  "],
};

export function build(g) {
  layers(g, [24, 7, 3], LEGEND, [7, 8, 9, 10, 11, 12].map((y) => ROWS[y]));
}
