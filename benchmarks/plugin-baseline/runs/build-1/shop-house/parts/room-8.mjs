// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Second-floor hall (top landing, inner air x5..8 y19..22 z7..16). The stair well (x5..6 z12..16) and its
// rail at x7 are built by the stair joiner; the landing stays a clear lane from the stair arrival (z11) to the
// corridor door (x9 z13) and the bath door (x7 z17). Focal piece: a linen cupboard (barrels and three shelves) across
// the north end (z7..10, floor to ceiling). A hanging lantern lights the landing.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the hall ends at a built-in linen cupboard across its north end (z7..10, floor to ceiling: barrels below, three
  // shelves above them, a spruce cornice on top), not a dead-end alcove
  const cup = { b: ["barrel", { facing: "up", open: "false" }], B: "bookshelf", p: "spruce_planks" };
  layers(g, [5, 19, 7], cup, ["bbbb", "bbbb", "bbbb", "bbbb"]);                  // z7..10, y19
  layers(g, [5, 20, 7], cup, ["bbbb", "bbbb", "bbbb", "bbbb"]);                  // y20
  layers(g, [5, 21, 7], cup, ["bBBB", "bbbb", "bbbb", "bbbb"]);                  // y21: shelves on the north row
  layers(g, [5, 22, 7], cup, ["pppp", "pppp", "pppp", "pppp"]);                  // y22: cornice to the ceiling
  // a hanging lantern under the loft floor (y23) over the stair well's east edge
  const lamps = { l: ["lantern", { hanging: "true" }] };
  layers(g, [5, 22, 7], lamps, [
    "    ", // z7
    "    ", // z8 (under the cupboard)
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
