// Room 20, Aperture apartments south (interior designer): a flat's living and dining room. A kitchen counter runs along
// the west wall, a three-cell dining table with four stools sits in the middle, and a planted winter bay in the south-east
// corner is the focal piece. Palette blocks only (the palette has no beds, stairs or barrels), so no bed and no chair
// shapes. Light: lanterns hung under the ceiling and standing on the counter.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { planter } from "../vocab.mjs";

const FLOOR = 8;                       // walking level: the floor block is y 7
const ROWS = 24, COLS = 44;            // the room's interior: rows are z 27..50, columns are x 203..246

// Marks are [column, row, char]: column = x - 203, row = z - 27.
const grid = (marks) => {
  const cells = Array.from({ length: ROWS }, () => Array(COLS).fill("."));
  for (const [c, r, ch] of marks) cells[r][c] = ch;
  return cells.map((a) => a.join(""));
};

// y 8, on the floor: counter base (2 wide along the west wall, z 29..35), table legs and stool posts
const floor = [];
for (let r = 2; r <= 8; r++) for (const c of [0, 1]) floor.push([c, r, "S"]);
for (const c of [13, 14, 15, 16, 17]) floor.push([c, 11, "F"]);       // table x 217..219 at z 38, stools x 216 and 220
floor.push([15, 9, "F"], [15, 13, "F"]);                              // stools x 218 at z 36 and z 40

// y 9: counter lanterns standing on the counter, table top and stool seats
const top = [[0, 3, "L"], [0, 7, "L"]];
for (const c of [14, 15, 16]) top.push([c, 11, "T"]);
top.push([13, 11, "U"], [17, 11, "U"], [15, 9, "U"], [15, 13, "U"]);

// y 11: lanterns hung under the ceiling (y 12)
const hang = [[5, 5, "H"], [11, 5, "H"], [5, 17, "H"], [23, 5, "H"], [33, 5, "H"], [23, 17, "H"], [33, 17, "H"], [17, 13, "H"], [40, 15, "H"]];

export function build(g) {
  const legend = {
    S: "smooth_stone",
    F: "oak_fence",
    T: ["oak_slab", { type: "top" }],
    U: ["smooth_stone_slab", { type: "top" }],
    L: ["lantern", { hanging: "false" }],
    H: ["lantern", { hanging: "true" }],
  };
  layers(g, [203, FLOOR, 27], legend, grid(floor));
  layers(g, [203, FLOOR + 1, 27], legend, grid(top));
  layers(g, [203, 11, 27], legend, grid(hang));
  // the focal piece: a planted winter bay in the south-east corner
  planter(g, [236, FLOOR, 40, 240, FLOOR + 1, 44]);
}
