// Room: East bedchamber (interior designer's part, box [12,7,14,14,10,16]). Focal piece: the red bed against the west
// wall, seen from the doorway at (13,7..8,13). Chair (stairs) by the north wall, a table (fence + top slab) with a
// lit candle cluster, a chest with a lantern standing on it, a potted poppy by the bed. The lane x=13, z=14..16 stays
// clear: the doorway's first cell (13,7,14) and the bed's east side (13,7,15..16) are air.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed, candleCluster } from "../vocab.mjs";

export function build(g) {
  // the bed: foot (12,7,16), head (12,7,15), both halves on the floor row y=7, facing north
  bed(g, 12, 7, 16, "north", "red");
  // the candle table's light, lit, on the table top (cell y=9 sits on the top slab at y=8)
  candleCluster(g, 14, 9, 15, "candle", 4);
  // furniture drawn as text: rows along +z (z 14, 15, 16), columns along +x (x 12, 13, 14); layers are y 7, 8
  const legend = {
    p: ["potted_poppy"],
    S: B.stairs("dark_oak", "north", "bottom"),   // chair, back to the north wall, seat facing the table
    F: B.fence("dark_oak"),                       // table post
    T: B.slab("dark_oak", "top"),                 // table top, under the candles
    C: ["chest", { facing: "west" }],             // chest in the corner, front into the room
    L: B.lantern(false),                          // standing lantern on the chest
  };
  layers(g, [12, 7, 14], legend, [
    [
      "p S",   // y=7, z=14: potted poppy by the bed, chair at (14,14)
      "  F",   // z=15: table post (bed head is written by bed())
      "  C",   // z=16: chest (bed foot is written by bed())
    ],
    [
      "   ",   // y=8, z=14
      "  T",   // z=15: table top slab (top half)
      "  L",   // z=16: lantern on the chest
    ],
  ]);
}
