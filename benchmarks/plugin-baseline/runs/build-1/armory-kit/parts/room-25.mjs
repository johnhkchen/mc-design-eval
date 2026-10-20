// Interior designer for "Galleries lobby and shop" (room 25): dark glass-backed lobby behind the entrance wall.
// Box x 255..294, z 2..5, y 1..6. Origin [255, 1, 2]: rows run along +x (dx = x - 255), successive rows along +z.
// Furniture lives in the north pair of rows (dz 0..1, z 2..3); the row dz 2 (z 4, the door plane) is the clear lane
// from the three door pairs at x 270..275 to every other place, and dz 3 holds two bench seats at its ends.
// The galleries part carves the entrance recess (x 263..282, z 0..3, y 1..6) to air, and earlier parts lock it, so
// nothing sits in dx 8..27 of the north rows. The shop shelves are dropped and the focal piece, a stained-glass
// sculpture on a deepslate plinth, moves to dx 28..31 (x 283..286), the first free cells east of the recess.
// Light: lanterns standing on the counters and plinth (y 2), about 7 blocks apart; one on a pier at the east end.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// One 40-cell row: a blank run of dots with each [dx, text] span written in (keeps the columns honest).
const row = (...spans) => {
  const r = Array(40).fill(".");
  for (const [dx, text] of spans) [...text].forEach((c, i) => (r[dx + i] = c));
  return r.join("");
};

export function build(g) {
  layers(
    g,
    [255, 1, 2],
    {
      "#": "polished_deepslate",
      b: "deepslate_tiles",
      t: "deepslate_tiles",
      S: ["deepslate_tile_stairs", { facing: "south", half: "bottom" }],
      L: ["lantern", { hanging: "false" }],
      g: "red_stained_glass",
      o: "orange_stained_glass",
      y: "yellow_stained_glass",
      e: "end_rod",
    },
    [
      // y 1: reception desk (dx 2..5), focal plinth (28..31), cash counter (32..35, clear of the east wall at x 291)
      [
        row([2, "####"], [28, "####"], [32, "####"]),
        row([2, "####"], [28, "####"], [32, "####"], [38, "t"]),
        row(),
        row([3, "SSSS"], [30, "SSSS"]),
      ],
      // y 2: glass pieces on the desk and barrels, lanterns standing on the supports, the sculpture's base
      [
        row([2, "o"], [5, "g"], [29, "go"], [34, "L"], [35, "y"]),
        row([3, "L"], [5, "g"], [28, "L"], [29, "oo"], [31, "L"], [38, "L"]),
        row(),
        row(),
      ],
      // y 3: the sculpture rises
      [row([29, "og"]), row([29, "gy"]), row(), row()],
      // y 4
      [row([29, "yo"]), row(), row(), row()],
      // y 5: end rods finish the sculpture
      [row([29, "ee"]), row(), row(), row()],
    ],
  );
}
