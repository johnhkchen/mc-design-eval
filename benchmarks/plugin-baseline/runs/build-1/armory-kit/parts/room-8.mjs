// Interior designer for "South vestibule" (room 8): a 2-deep glazed strip, 106 long (x 5..110, z 145..146) open to the
// hall at z 144. Its three south doors (x 24..27, 56..59, 88..91) and the side doors (x 4, x 111) keep their first
// cells clear, and the north row z 145 is the lane, so the furniture lives on the south row z 146 only.
// Layout: quartz bench-stairs against the south wall, a luminous focal column at the centre (x 61..63), moss planters
// with azaleas, and lanterns: standing ones on the bench ends, hanging ones from the glass roof down the lane.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const X0 = 5;
const LEN = 106; // x 5..110
const LANE = 145;
const ROW = 146;

// one row of the room's strip: a character per x, '.' where nothing goes
function row(cells) {
  const s = Array(LEN).fill(".");
  for (const [x, c] of cells) s[x - X0] = c;
  return s.join("");
}

// bench seats: a stair per cell, back to the south wall (facing south), in groups clear of every doorway
const BENCHES = [7, 8, 9, 15, 16, 17, 30, 31, 32, 42, 43, 44, 66, 67, 68, 76, 77, 78, 94, 95, 96, 103, 104, 105];
const PLANTERS = [12, 37, 72, 99]; // moss block with an azalea on top
const STANDING = [18, 21, 36, 45, 50, 70, 86, 93, 101]; // lanterns standing on the bare floor, off the lane
const FOCAL = [61, 62, 63]; // luminous plinth at the centre
const HANGING = [9, 16, 22, 28, 34, 40, 46, 52, 58, 64, 70, 76, 79, 82, 94, 100, 104, 106]; // lanterns from the glass roof down the lane

export function build(g) {
  const bench = (xs) => xs.map((x) => [x, "b"]);
  const layersList = [
    // y 1: floor line: the benches, planter bases, focal plinth, floor lanterns
    [
      row([]),
      row([...bench(BENCHES), ...PLANTERS.map((x) => [x, "m"]), ...FOCAL.map((x) => [x, "L"]), ...STANDING.map((x) => [x, "l"])]),
    ],
    // y 2: azaleas on the planters
    [
      row([]),
      row([...PLANTERS.map((x) => [x, "a"])]),
    ],
    // y 3: open
    [
      row([]),
      row([]),
    ],
    // y 4: open
    [
      row([]),
      row([]),
    ],
    // y 5: open lane
    [
      row([]),
      row([]),
    ],
    // y 6: hanging lanterns under the glass roof (in the lane row)
    [
      row(HANGING.map((x) => [x, "h"])),
      row([]),
    ],
  ];

  const legend = {
    b: ["smooth_quartz_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" }],
    m: "moss_block",
    a: "azalea",
    q: "smooth_quartz",
    L: "sea_lantern",
    l: ["lantern", { hanging: "false", waterlogged: "false" }],
    h: ["lantern", { hanging: "true", waterlogged: "false" }],
  };

  // layers(): y offsets from y 1; rows z 145 then z 146
  layers(g, [X0, 1, LANE], legend, layersList);
}
