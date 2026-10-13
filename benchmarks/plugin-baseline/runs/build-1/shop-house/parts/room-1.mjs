// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Lobby stair hall. Family entrance hall under the stairs: the lane x5..6 is kept clear from the double door
// (z5) to the keeper's door (x9 z20) and the wing door (x6 z22). The east strip x7..8 holds a coat stand and bench
// by the front door (NE), and a table with a chair and a boot barrel to the south, out of the stair's foot approach
// (z8) and the keeper's door cell (x8 z20). Light: a standing lantern on the coat stand, a candle on the table, and
// hanging lanterns under the first-floor floor down the lane's centre line.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const Z0 = 6; // the room's first floor row (z 6); rows run z 6..21, columns x 5..8
const Z1 = 21;

/** One layer's rows from a map of z -> row text; any z not given is '....' (nothing written). */
function layer(rows) {
  const out = [];
  for (let z = Z0; z <= Z1; z++) out.push(rows[z] ?? "....");
  return out;
}

export function build(g) {
  const legend = {
    f: "spruce_fence",
    b: "barrel",
    s: ["spruce_stairs", { facing: "west", half: "bottom" }],
    p: "flower_pot",
    t: "spruce_slab",
    L: ["lantern", { hanging: "false" }],
    H: ["lantern", { hanging: "true" }],
    c: ["candle", { candles: "1", lit: "true" }],
  };

  // Floor level y 6. Stair cells (x7..8, z9..15) are already placed and '.' writes nothing.
  layers(g, [5, 6, Z0], legend, [layer({
    6: "...f",  // coat post at the NE corner (door's first cell x7 stays clear)
    7: "..bs",  // boot barrel and coat bench (seat faces west, into the lane)
    // z 8 stays clear: approach to the stair foot at z 9
    17: "..sf", // table fence (x8) and chair (x7, back to the west)
    21: "..b.", // boot barrel by the wing door approach (x7, off the keeper's door side)
  })]);

  // Level y 7: standing lantern on the coat post, a pot on the boot barrel, the table top.
  layers(g, [5, 7, Z0], legend, [layer({
    6: "...L",  // lantern standing on the coat post
    7: "..p.",  // flower pot on the boot barrel
    17: "...t", // table top (slab) over the table fence
    21: "..L.", // lantern standing on the boot barrel by the wing door
  })]);

  // Level y 8: a lit candle on the table.
  layers(g, [5, 8, Z0], legend, [layer({
    17: "...c",
  })]);

  // Level y 12: hanging lanterns under the first-floor floor, down the lane's centre (x6) and over the table (x8).
  layers(g, [5, 12, Z0], legend, [layer({
    6: ".H..",  // lane centre, north
    8: "H...",  // lane west column, by the stair foot (lifts the west edge)
    11: "H...",
    14: ".H..", // lane centre, middle
    16: ".H..", // lane centre, south of the stair foot
    17: "...H", // over the table
  })]);

  // Level y 12, east strip: a hanging lantern under the first-floor floor at x8 z16, off the lane (x5..6). It lifts the
  // one dim cell (x8 z15, level 7) to 8+ without standing in the approach to the stair foot.
  layers(g, [5, 12, Z0], legend, [layer({
    16: "...H",
  })]);
}
