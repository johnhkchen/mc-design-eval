// Part: room: farmhouse loft (interior designer). Sleeping loft, box [26,7,11,33,9,13], floor y7, entered by the flight's
// top step (30,6,13) whose landing is (30,7,13). Three beds with heads against the back wall z14 (x26, x32, x33); the
// east end is the focal pair. The lane z11 is kept clear across the room; the landing's way out is (30,7,12) -> (30,7,11).
// Light: one standing lantern on a barrel by the bed group, a lit candle on a hay bale beside it.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Beds: foot at z12, head one step south (z13) against the back wall (z14).
  bed(g, [26, 7, 12], "south", "white");
  bed(g, [32, 7, 12], "south", "red");
  bed(g, [33, 7, 12], "south", "blue");

  // Floor items (y7): a storage barrel west of the flight's headroom, and a barrel + hay bale by the bed group.
  // Rows run along +x from x26 (z11, z12, z13); a space is left alone.
  const legend = {
    R: ["barrel", { facing: "up" }],
    H: "hay_block",
    L: ["lantern", { hanging: "false" }],
    C: ["candle", { candles: "2", lit: "true" }],
  };
  layers(g, [26, 7, 11], legend, [
    ["        ", " R   R  ", "     H  "],
  ]);
  // Items on top (y8): the standing lantern on the east barrel, the lit candle on the hay bale.
  layers(g, [26, 8, 11], legend, [
    ["        ", "     L  ", "     C  "],
  ]);
}
