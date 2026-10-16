// P7 east kitchen: a 2 x 2 mirror kitchen (inner air x92..93, z14..15, y3..6). The door is at (93,3..4,13); the
// hearth mouth (92,3,16) is in the back wall, its fire outside. The lit stove stands in the east corner (93,3,15)
// (chimneys.mjs' STOVES), so the stair foot (91,3,15) is reached from (92,3,15). Lanterns hang from the ceiling (y7) at
// (92,6,14) and (93,6,15). The lane from the door runs (93,3,14) -> (92,3,14) -> (92,3,15) and stays clear.
import { hanging_lantern } from "../vocab.mjs";

export function build(g) {
  hanging_lantern(g, 92, 6, 14);
  hanging_lantern(g, 93, 6, 15);
}
