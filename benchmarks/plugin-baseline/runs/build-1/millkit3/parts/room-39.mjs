// P7 west kitchen (box x86..87, y3..6, z14..15): the hearth is in the back wall (mouth 87,3,16, fire outside). The lit
// furnace stove stands in the west corner (86,3,15) (chimneys.mjs' STOVES), and a hanging lantern lights the room from
// the ceiling. The stair foot (88,3,15) is reached from (87,3,15), so that cell stays clear, and the lane from the door
// (86,3,13) runs (86,3,14) -> (87,3,14) -> (87,3,15).
import { hanging_lantern } from "../vocab.mjs";

export function build(g) {
  hanging_lantern(g, 86, 6, 14);                // ceiling light over the lane from the door
}
