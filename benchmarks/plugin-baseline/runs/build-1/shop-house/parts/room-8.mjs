// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Second-floor hall (top landing, inner air x5..8 y19..22 z7..16). The stair well (x5..6 z12..16) and its
// rail at x7 are built by the stair joiner; the landing stays a clear lane from the stair arrival (z11) to the
// corridor door (x9 z13) and the bath door (x7 z17). Focal piece: a bookshelf wall in the north-east corner, with
// a barrel stack in front of it. Two hanging lanterns light the landing.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // floor layer y19 (x5..8 across, z7..16 down); ' ' is left as it is
  const floor = {
    B: "bookshelf",
    b: "barrel",
    c: "red_carpet",
  };
  layers(g, [5, 19, 7], floor, [
    "BB  ", // z7
    "b  B", // z8
    "  cB", // z9
    " ccB", // z10
    "    ", // z11 stair arrival: x5..6 kept clear
    "    ", // z12 well x5..6, rail x7
    "    ", // z13 lane to the corridor door x9
    "    ", // z14
    "    ", // z15
    "    ", // z16 lane to the bath door x7 z17
  ]);
  // second layer y20: the shelf tops and a flower pot on the barrel
  const upper = {
    B: "bookshelf",
    f: "flower_pot",
  };
  layers(g, [5, 20, 7], upper, [
    "BB  ", // z7
    "f  B", // z8
    "   B", // z9
    "   B", // z10
  ]);
  // hanging lanterns under the loft floor (y23): one over the shelves, one over the stair well's east edge
  const lamps = { l: ["lantern", { hanging: "true" }] };
  layers(g, [5, 22, 7], lamps, [
    "    ", // z7
    " l  ", // z8 (x6)
    "    ", // z9
    "    ", // z10
    "    ", // z11
    "    ", // z12
    "    ", // z13
    "  l ", // z14 (x7)
    "    ", // z15
    "    ", // z16
  ]);
}
