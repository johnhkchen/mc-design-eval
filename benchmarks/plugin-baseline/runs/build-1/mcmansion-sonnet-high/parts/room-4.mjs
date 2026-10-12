// room: Formal dining room: inner air [27,2,9,32,4,14]. Formal evening dining: a long dark-oak table for six (slab tops on
// fence posts, dark-oak stair chairs), a sideboard on the west wall, hanging lanterns over the table, a red rug.
// Clear 2-high paths: from the foyer cased opening (x26, z10..12) across x28..29 to every chair; from the kitchen door
// (x29, z15) via x29 z14; from the bay opening (x30..32, z8) via x31..32 z9. No walls, doors or windows are written.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // rug under the table zone (carpets are walkable; furniture below overwrites its own cells)
  g.fill([28, 2, 10], [32, 2, 13], "red_carpet");

  // long table: dark_oak_fence legs in one column at x30, dark_oak_slab top at y3, z10..13
  for (let z = 10; z <= 13; z++) {
    g.set(30, 2, z, ...B.fence("dark_oak"));
    g.set(30, 3, z, ...B.slab("dark_oak", "bottom"));
  }

  // six dark-oak stair chairs: two per long side, one at each end; a stair's facing = its full-height back side
  g.set(29, 2, 10, ...B.stairs("dark_oak", "west", "bottom"));
  g.set(29, 2, 13, ...B.stairs("dark_oak", "west", "bottom"));
  g.set(31, 2, 10, ...B.stairs("dark_oak", "east", "bottom"));
  g.set(31, 2, 13, ...B.stairs("dark_oak", "east", "bottom"));
  g.set(30, 2, 9, ...B.stairs("dark_oak", "north", "bottom"));
  g.set(30, 2, 14, ...B.stairs("dark_oak", "south", "bottom"));

  // sideboard against the west wall, south end: planks cabinet, slab top, a potted fern
  g.set(27, 2, 13, ...B.block("dark_oak_planks"));
  g.set(27, 2, 14, ...B.block("dark_oak_planks"));
  g.set(27, 3, 13, ...B.slab("dark_oak", "bottom"));
  g.set(27, 3, 14, ...B.slab("dark_oak", "bottom"));
  g.set(27, 4, 14, ...B.block("potted_fern"));

  // hanging lanterns over the table (they hang from the y5 ceiling); candles on the table ends as centrepieces
  g.set(30, 4, 11, ...B.lantern(true));
  g.set(30, 4, 12, ...B.lantern(true));
  g.set(30, 4, 10, ...B.block("candle"));
  g.set(30, 4, 13, ...B.block("candle"));
}
