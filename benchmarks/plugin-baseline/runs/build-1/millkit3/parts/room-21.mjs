// P3 kitchen-dining: back kitchen and dining room, inner air x40..43, y3..6, z14..15 (plan.md ROOMS).
// Ways in: the opening x42..43 z13 from the stair hall; the back door (44,3..4,16) opens onto the flight foot, outside.
// Focal piece: the stove (41,3,15) against the hearth wall, facing the doorway; the table sits on the west side.
// Layout (x40..43 across, z14 along the doorway row, z15 by the hearth):
//   z14: table | free  | lane | lane      (x41 stays free: the stove's front and the table's stand; x42/x43 are the doorway's first cells)
//   z15: table | stove | stool | lane    (x43 stays clear: the flight's foot (44,3,15) is reached from it)
import { chair, stove, hanging_lantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Dining table: spruce fence legs at (40,3,14) and (40,3,15), a TOP spruce slab at y4 over them (table_set's slab is
  // a bottom slab, which would leave the pot on it floating).
  for (const z of [14, 15]) {
    g.set(40, 3, z, ...B.fence("spruce"));
    g.set(40, 4, z, ...B.slab("spruce", "top"));
  }
  // A stool by the hearth, its sitter looking west at the stove; (41,14) stays free so the table and the stove's front
  // are both reachable from the doorway lane.
  chair(g, 42, 3, 15, "west");
  // Kitchen stove on the hearth wall, its front toward the room.
  stove(g, 41, 3, 15, "north");
  // A flower pot on the table, the dining room's centre piece.
  g.set(40, 5, 14, "flower_pot", {});
  // Hanging lanterns from the ceiling block at y7 (floor light across the room).
  hanging_lantern(g, 41, 6, 14);
  hanging_lantern(g, 43, 6, 15);
}
