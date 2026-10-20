// Room: arcade walk (plot 1): the open loggia behind the round arches, inner air x48..63, y1..11, z5..8. Pale stone, no
// furniture (plan.md: the walk is a passage). Its only fittings are lanterns hung on chain from a ceiling-height beam
// (chain up to the smooth_stone ceiling at y12): one under the crown of each arch opening (x 50 and 58) and one in
// the middle of the walk (x 53), and a fourth at the east end to lift the dim corner. They hang at y4, clear of the
// 2-high lane (floor y1) and of every doorway (the openings are in z 3..4 and the walk's ends at x 47 and 64).
import { hangLamp } from "../vocab.mjs";

const LANTERNS = [
  [50, 4, 6],   // under the crown of the west arch (x49..54)
  [53, 4, 7],   // the middle of the walk
  [58, 4, 6],   // under the crown of the east arch (x57..62)
  [62, 4, 7],   // the east end, over the dim corner
];

export function build(g) {
  for (const [x, y, z] of LANTERNS) hangLamp(g, x, y, z);
}
