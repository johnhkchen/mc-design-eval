// Interior designer for "Kiosk D1" (room 17): a 2x2 air box, x 209..210, z 101..102, y 1..6, entered from the east
// door (x 211). Focal piece: a smooth_quartz counter along the west wall (x 209), facing the door. The lane is the
// east column (x 210), kept clear from the door to the counter. A white banner on the west wall marks the kiosk; a
// lantern stands on the counter top as its light. Only palette.json blocks are used (no barrels, chests or carpets in
// the palette), and nothing hangs from a deck that the roof part has not built yet.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { SMOOTH_QUARTZ, LANTERN } from "../vocab.mjs";

export function build(g) {
  // y1: the counter, two full quartz blocks against the west wall (x 209, both rows); the lane x 210 stays free
  layers(g, [209, 1, 101], { "Q": SMOOTH_QUARTZ }, [
    ["Q.",
     "Q."],
  ]);
  // the kiosk sign: a white wall banner on the west wall at head height, pointing out into the room
  g.set(209, 2, 101, ...B.banner("white", [], { facing: "east" }));
  // the counter's light: a standing lantern on the counter top, at the focal piece
  layers(g, [209, 2, 102], { "L": [LANTERN, { hanging: "false" }] }, [
    ["L."],
  ]);
}
