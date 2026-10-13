// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: First-floor stair hall. Inner air x5..8 y14..17 z7..21. Flight 1 arrives at x7..8 z16 and flight 2 rises
// from x5..6 z15, so the arrival lane (x7..8 z16..21, out to the dining door x9 z18 and the wing door x7 z22) stays
// clear. Furniture sits on the west side: a settle (spruce stairs facing east, backs on the wall) with a fence-and-
// slab table in front of it, and a barrel store at the south-west corner. Hanging lanterns from the second floor's
// underside light the hall, the north part included.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { hangLantern } from "../vocab.mjs";

export function build(g) {
  // y14: settle seats (x5, z17..19), table base (x6 z18), barrels (x5 z20, x5..6 z21). Rows run along +x (x5..8),
  // successive rows along +z (z16..21).
  layers(g, [5, 14, 16], {
    "S": ["spruce_stairs", { facing: "east", half: "bottom", shape: "straight" }],
    "F": "spruce_fence",
    "B": "barrel",
  }, [
    ["    ", "S   ", "SF  ", "S   ", "B   ", "BB  "],
  ]);

  // y15: the table top, a bottom spruce slab on the fence.
  layers(g, [5, 15, 16], { "T": ["spruce_slab", { type: "bottom" }] }, [
    ["    ", "    ", " T  ", "    ", "    ", "    "],
  ]);

  // Lanterns hang from the second floor's underside (floor y18 is solid over these cells).
  hangLantern(g, 6, 17, 9);
  hangLantern(g, 8, 17, 13);
  hangLantern(g, 6, 17, 17);
  hangLantern(g, 6, 17, 20);
}
