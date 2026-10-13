// Part: room: master bath (master ensuite: a water_cauldron tub on the east wall, a cauldron basin by the north window,
// a dark_oak dressing table with a stool and a standing lantern, a barrel dresser, a white carpet rug, hanging lanterns).
// Inner air x65..68, z43..49, y11..16. Doorways: west x64 z46..47 (from the master bedroom), south x66..67 z50 (from the
// east upper corridor). Lanes kept clear: x65 z46..47 and x66..67 z49 (plus x67 z48 to link them).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The shell leaves this room unclaimed, so the layout is placed.
export function build(g) {
  const origin = [65, 11, 43];
  const legend = {
    C: ["cauldron", { level: "0" }], // basin, by the north window
    T: ["water_cauldron", { level: "3" }], // the tub, along the east wall (focal piece, seen from the west door)
    F: "dark_oak_fence", // dressing-table post
    t: ["dark_oak_slab", { type: "top" }], // dressing-table top
    s: ["dark_oak_stairs", { facing: "east", half: "bottom", shape: "straight" }], // stool, back to the east
    B: "barrel", // linen dresser
    W: "white_carpet", // rug between the tub and the doors
    L: ["lantern", { hanging: "false" }], // standing lantern on the table top
    h: ["lantern", { hanging: "true" }], // hanging lanterns from the ceiling
  };
  const blank = ["    ", "    ", "    ", "    ", "    ", "    ", "    "];
  const rows = (...r) => r;
  const layersByY = [
    // y11: floor furniture (rows z43..49, columns x65..68)
    rows(
      "C   ", // z43 basin
      "   T", // z44 tub
      "   T", // z45 tub
      " WW ", // z46 rug (x65 kept clear for the west door)
      " WW ", // z47 rug
      "Fs B", // z48 table, stool, barrel
      "B  B", // z49 barrels (x66..67 kept clear for the south door)
    ),
    // y12: table top slab
    rows("    ", "    ", "    ", "    ", "    ", "t   ", "    "),
    // y13: lantern on the table
    rows("    ", "    ", "    ", "    ", "    ", "L   ", "    "),
    blank, // y14
    blank, // y15
    // y16: hanging lanterns under the ceiling
    rows("  h ", "    ", " h  ", "    ", "    ", "  h ", "    "),
  ];
  layers(g, origin, legend, layersByY);
  // Lamplighter: one standing lantern on the floor against the west wall, off the door lanes (x65 z45 is free). Measured on
  // a scratch copy: min 8, no dim cell, the tub at the east wall 11..12. The designer's three hanging lanterns alone give
  // min 7 (3 cells dim), so they are not needed for the 8 bar.
  g.set(65, 11, 45, "lantern", { hanging: "false" });
  return { placed: "layout and lamplighter" };
}
