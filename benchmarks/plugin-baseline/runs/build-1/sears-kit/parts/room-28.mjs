// Room "P3 dormer bedroom" (interior designer's part): front bedroom behind the long shed dormer, one bed.
// Inner air x 58..60, z 15..16, feet y 6 (floor block y 5, ceiling y 9); z 14 is the dormer's solid underside. The bed is
// the focal piece: its head is against the east wall (x 61), so it sits where the doorway (west, x 57) looks. Chest dresser
// by the foot, a spruce-fence table with a top slab and a flower pot, one stair chair, and a standing lantern on a fence
// post for the light.
import { layers, bed } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bed: foot (59,6,15), head (60,6,15) against the east wall, both halves via bed()
  bed(g, [59, 6, 15], "east", "red");

  // feet level (y 6): chest dresser at (58,15) by the foot; chair stairs at (58,16) facing the table; table post and lantern post at z16
  layers(g, [58, 6, 14], {
    c: ["chest", { facing: "east", type: "single" }],
    s: ["spruce_stairs", { facing: "east", half: "bottom", shape: "straight" }],
    f: ["spruce_fence", {}],
  }, [
    ["   ", "c  ", "sff"],
  ]);

  // y 7: the table top slab (top half, sits on the post) and the standing lantern on the lantern post
  layers(g, [58, 7, 14], {
    t: ["spruce_slab", { type: "top" }],
    L: ["lantern", { hanging: "false" }],
  }, [
    ["   ", "   ", " tL"],
  ]);

  // y 8: a potted flower on the table top
  layers(g, [58, 8, 14], {
    p: ["potted_poppy", {}],
  }, [
    ["   ", "   ", " p "],
  ]);
}
