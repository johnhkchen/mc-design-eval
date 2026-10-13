// room: B ground (interior designer): formal hall and dining, symmetrical about x=15.
// Inner air x12..18, y3..6, z13..23. Focal piece: the long dining table on the centre line between the two hearths
// (x=12 and x=18, z18..19). Chairs are spruce stairs (palette), table is a fence-and-slab run, sideboards are slabs
// with a standing lantern on a fence post. Light: hanging lanterns from the first-floor deck (y=7) down the centre
// line, standing lanterns on the sideboards. The entrance cells (15,3,13) and (15,3,23) stay clear, and so do the
// stair well (x12..13, z20..23) and the hearth cells (x12 and x18, z18..19).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  const legend = {
    s: ["spruce_slab", { type: "bottom" }],
    f: ["spruce_fence", {}],
    e: ["spruce_stairs", { facing: "east" }],
    w: ["spruce_stairs", { facing: "west" }],
    t: ["spruce_slab", { type: "bottom" }],
    l: ["lantern", { hanging: "false" }],
    L: ["lantern", { hanging: "true" }],
  };

  // y=3: sideboards on both side walls (slab, fence post, slab), chairs either side of the table legs.
  layers(g, [12, 3, 13], legend, [
    ".......", // z13 (entrance row, kept clear)
    "s.....s", // z14
    "f.....f", // z15
    "s.efw.s", // z16
    ".......", // z17 (table top only, no leg)
    "..efw..", // z18 hearth row
    ".......", // z19 hearth row (table top only, no leg)
    "..efw..", // z20
    ".......", // z21
    ".......", // z22
    ".......", // z23 (back door cell, kept clear)
  ]);

  // y=4: the table top runs z16..20 at x=15; standing lanterns on the sideboard posts.
  layers(g, [12, 4, 13], legend, [
    ".......",
    ".......",
    "l.....l", // z15 lanterns on the fence posts
    "...t...", // z16
    "...t...", // z17
    "...t...", // z18
    "...t...", // z19
    "...t...", // z20
    ".......",
    ".......",
    ".......",
  ]);

  // y=6: hanging lanterns from the deck at y=7: a chandelier over the table and one in each front and back corner.
  layers(g, [12, 6, 13], legend, [
    ".......",
    ".L...L.", // z14
    ".......",
    ".......",
    "...L...", // z17 over the table
    ".......", // z18
    "...L...", // z19 over the table
    ".......",
    ".....L.", // z21 back corner, clear of the stair well (x12..13)
    "..L....", // z22 lifts the stair-well corner from the east side
    ".......", // z23 (back door row)
  ]);
}
