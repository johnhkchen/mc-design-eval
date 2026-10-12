// Part "room: Sales floor" (parts/room-1.mjs): the convenience-store hall, inside [10,1,25,22,5,32].
// Layout (floor plan origin [10,1,25], rows along +z from z25, columns along +x from x10):
//   - checkout counter (focal) at x15..18 z26..27, red front to the door, staff side at z28;
//   - coffee corner at x10..11 z27..28 (cauldron urn, standing lantern);
//   - three N-S shelf runs at x13, x17, x20 (z28..31), 1 wide, aisles 14..16, 18..19, 21..22 stay open;
//   - cooler wall on the south (z32): light-gray base, glass pane band at y2 (no cap: a cap would be a walkable y4 cell);
//   - hanging lanterns from the roof deck (y6) at y5, spread across the room (one over the counter) so no floor cell is dark.
// The entrance lane (door x16..17 z25) runs west to x14 or east to x19 round the counter; nothing stands in a
// doorway's first cell and the stock-side wall (x=23) is left as the shell built it.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [10, 1, 25];

const LEGEND = {
  R: "red_concrete",
  W: "white_concrete",
  G: "light_gray_concrete",
  S: ["smooth_quartz_slab", { type: "bottom" }],
  K: "cauldron",
  l: ["lantern", { hanging: "false" }],
  h: ["lantern", { hanging: "true" }],
  F: "flower_pot",
  P: ["light_blue_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true" }],
};

const EMPTY = Array(8).fill(" ".repeat(13));

// y1 floor-level furniture bases: counter body, coffee base, shelf bases, cooler base.
const Y1 = [
  "             ",
  "     RRRR    ",
  "GG   WWWW    ",
  "GG G   G  G  ",
  "   G   G  G  ",
  "   G   G  G  ",
  "   G   G  G  ",
  "GGGGGGGGGGGGG",
];

// y2: counter top slabs, urn and lantern on the coffee base, shelf products, cooler glass.
const Y2 = [
  "             ",
  "     SSSS    ",
  "Kl   SSSS    ",
  "   F      F  ",
  "       F     ",
  "   F      F  ",
  "       F     ",
  "PPPPPPPPPPPPP",
];

// y5: hanging lanterns from the roof deck above.
const Y5 = [
  "     h       ",
  "  h      h  h",
  "      h      ",
  "             ",
  "      h      ",
  "  h        h ",
  "             ",
  "      h      ",
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [Y1, Y2, EMPTY, EMPTY, Y5]);
}
