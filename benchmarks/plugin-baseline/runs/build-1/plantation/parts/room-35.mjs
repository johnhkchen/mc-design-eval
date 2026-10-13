// Part: room: cottage bath. Tiny bath in the cottage's NE corner: inner air x84..86 z71..74, floor y1 (stand y2),
// entered by the door at z70 x85 from the parlour. Focal piece: a three-cell water-cauldron tub on the south wall,
// in line with the door. Washstand (cauldron basin) under the east window, a barrel cabinet with candles on its top,
// a flower pot, a white carpet mat in front of the tub, and one standing lantern on the floor inside the door.
// The cottage chimney takes x85..86 z72..73 from the floor up, and the bath has no ceiling over x84..86 to hang from,
// so the mat sits at x84 and the lantern stands on the floor.
// Rows run along +x (x84..86), successive rows along +z (z71..74). A space leaves the cell as it is.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [84, 2, 71];

export function build(g) {
  // Stand layer, y2: barrel cabinet NW, lantern on the floor just inside the door lane, basin cauldron NE under the
  // window, pot by the cabinet, mat in front of the tub, tub along the south wall.
  layers(g, ORIGIN, {
    B: "barrel",
    C: "cauldron",
    F: "flower_pot",
    L: "lantern",
    W: "white_carpet",
    T: ["water_cauldron", { level: "3" }],
  }, [
    ["BLC", "F  ", "W  ", "TTT"],
  ]);

  // Cabinet top, y3: three lit candles on the barrel.
  layers(g, [84, 3, 71], {
    c: ["candle", { candles: "3", lit: "true" }],
  }, [
    ["c  ", "   ", "   ", "   "],
  ]);
}
