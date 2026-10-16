// Part: room: I-house upper west bedroom (parts/room-11.mjs). Inner air x26..27, y8..11, z10..15; door x28 z11.
// Two white beds along the back wall (heads against z16), a barrel dresser with a lamp, and a spruce side table with
// a lamp on its top. Column x26 z11..13 and x27 z11..13 stay clear: the lane from the door to both beds.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed_set } from "../vocab.mjs";

export function build(g) {
  // Dresser and side table, drawn as text. Rows run along +z from z10; columns are x26, x27.
  const legend = {
    B: ["barrel", { facing: "up" }],
    F: B.fence("spruce"),
    S: B.slab("spruce", "top"),
    L: B.lantern(false),
  };
  layers(g, [26, 8, 10], legend, [
    ["BF", "..", "..", "..", "..", ".."], // y8: barrel dresser, fence post of the side table
    ["LS", "..", "..", "..", "..", ".."], // y9: lamp on the barrel, table top slab
    [".L", "..", "..", "..", "..", ".."], // y10: lamp standing on the table's top
  ]);

  // Two beds: foot on z14, head on z15 against the back wall (the window at x27 sits above the headboard).
  bed_set(g, [26, 8, 14], "south", "white");
  bed_set(g, [27, 8, 14], "south", "white");
}
