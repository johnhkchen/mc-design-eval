// Interior designer for "Glasshouse south vestibule" (room 24): a 2 x 2 exit box with a small gift shelf.
// Floor cells x234..235, z45..46 (the lane runs down x234 from the inner z43 doorway to the exit at z47). The gift
// stand sits on the east side: a smooth_quartz pedestal at y1 under a standing lantern (the focal light). The lantern
// on its top lights the whole 2 x 2 box, so no lamp hangs in the lane.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // y1: the pedestal (x235, z45..46) in smooth_quartz; x234 is the lane and stays free
  layers(g, [234, 1, 45], { c: "smooth_quartz" }, [
    [".c", ".c"],
  ]);
  // y2: a standing lantern on the south pedestal cell (the focal piece)
  layers(g, [234, 2, 45], { L: ["lantern", { hanging: "false" }] }, [
    ["..", ".L"],
  ]);
}
