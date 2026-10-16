// P0 east back room: the mirror kitchen-bedroom of the west back room. Inner air x7..9, y3..6, z14..15.
// Entered from the partition door (7,3..4,13) and the back door (9,3..4,16). The hearth is in the back wall at
// (7,3,16); its stove stands at (7,3,15) against it. One bed (cyan) with its head against the east wall x10.
import { bed_set, stove, hanging_lantern } from "../vocab.mjs";

export function build(g) {
  // focal piece: the stove by the hearth, facing the room
  stove(g, 7, 3, 15, "north");
  // the bed: foot (8,3,14), head (9,3,14) against the solid east wall
  bed_set(g, [8, 3, 14], "east", "cyan");
  // kitchen barrel between the stove and the back door, with a pot on top
  g.set(8, 3, 15, "barrel", { facing: "up" });
  g.set(8, 4, 15, "flower_pot");
  // light: the lit stove plus one hanging lantern over the bed foot
  hanging_lantern(g, 8, 6, 14);
}
