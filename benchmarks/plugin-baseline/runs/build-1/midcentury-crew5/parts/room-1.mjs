// ROOM gallery (interior designer): the entrance hall behind the orange door. Inner air is the box [16,2,10,22,4,10]:
// one cell deep (z=10), seven long (x=16..22). The 2-high lane along z=10 is the only walkable row, so nothing solid
// stands in it. What fits beside it: an orange carpet runner on the floor (walkable), a low birch bench as bottom slabs
// at floor level (a step up, headroom kept), and two hung lanterns over the lane (y=4, clear of the 2-high walk) that
// light the hall. Nothing on the thresholds at x=16 and x=22 (kitchen and corridor openings) or under the atrium doors.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // origin [16,2,10]: rows run along +x (x=16..22), one row (z=10). Layers: y=2 floor level (carpet runner, bench
  // slabs), y=3 clear walk, y=4 hung lanterns (ceiling spruce_planks over them at y=5 on x=17 and x=21, clear of beams).
  layers(g, [16, 2, 10], {
    c: "orange_carpet",
    b: ["birch_slab", { type: "bottom" }],
    L: ["lantern", { hanging: "true", waterlogged: "false" }],
  }, [
    [" bbccc "],
    [],
    [" L   L "],
  ]);
}
