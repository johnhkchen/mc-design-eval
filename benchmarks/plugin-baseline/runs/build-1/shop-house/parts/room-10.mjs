// SPDX-License-Identifier: AGPL-3.0-or-later
// Room: Upper corridor (the interior designer fills this in; inner air box is in rooms.json).
// A one-cell landing (z 13, x 9..18) from the hall door (x 8) to the bedroom doors (x 17 north, x 11 and x 16 south).
// The lane must stay clear, so the furniture is the runner rug on the floor and the lanterns hung from the loft
// floor above (y 23), which keep the 2-high path free. Nothing over a doorway head.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLOOR = 19;
const LANE_Z = 13;

export function build(g) {
  // Runner rug: red carpet along the landing, walkable at floor level. x 9 is the hall door the joinery part
  // already placed (locked), so the rug starts at x 10.
  for (let x = 10; x <= 18; x++) g.set(x, FLOOR, LANE_Z, "red_carpet");

  // Hanging lanterns from the loft floor: one over the middle of the landing, one toward the far end.
  // Each hangs from the block above it (y 23); the lantern sits at y 22, clear of the 2-high path (y 19..20).
  for (const x of [13, 16]) g.set(x, 22, LANE_Z, ...B.lantern(true));
}
