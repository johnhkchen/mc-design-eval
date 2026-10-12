// Room 12: walk-in closet, inner air [13,6,19,15,8,24]. Entered from the primary bedroom (x12, z22) and the bath (x16, z22).
// Design: a 3-wide, 6-long closet. Drawer barrels and clothes rails line both side walls (x13, x15) on every row except the
// z22 cross-aisle, which is kept clear so both doors reach the centre. The focal piece is a smooth quartz ottoman at the
// centre (14,6,21) under a hanging lantern. A second lantern is not needed: the ottoman's lamp lights the whole floor.
import { hangLamp } from "../vocab.mjs";

const BARREL_ROWS = [19, 20, 21, 23, 24];
const RAIL_ROWS = [19, 20, 21, 23, 24];
const SIDE_X = [13, 15];

export function build(g) {
  // Drawers: two-high barrel stacks on both side walls, opening into the room.
  for (const x of SIDE_X) {
    for (const z of BARREL_ROWS) {
      g.set(x, 6, z, "barrel", { facing: "up", open: "false" });
      g.set(x, 7, z, "barrel", { facing: "up", open: "false" });
    }
  }
  // Clothes rails hung across the top of each drawer run.
  for (const x of SIDE_X) {
    for (const z of RAIL_ROWS) g.set(x, 8, z, "iron_bars", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  }
  // Focal piece: the ottoman on the centre line, lit from directly above.
  g.set(14, 6, 21, "smooth_quartz");
  hangLamp(g, 14, 8, 21);
}
