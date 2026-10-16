// Part: room: Camelback front room (interior of box 16,3,10 .. 19,6,12; door x17..18 z9; stair x19 z11..12 locked).
// Parlour/bedroom: the bed is the focal piece, against the front wall under the window; a barrel dresser with a
// lantern on it, a fence-and-top-slab table with a stair chair against the back wall. Lane x17 stays clear
// (first cell inside the door is x17/x18 z10; x17 z12 is the way to the kitchen door at x17 z13).
import { bed, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Bed: foot z11, head z10 against the front wall (z9), pillow end facing north.
  bed(g, [16, 3, 11], "north", "blue");

  // Floor layer y3 (x16..19, rows z10..12): "B" dresser barrel, "F" table leg, "S" chair (stairs, back to the wall at z13).
  // Stairs x19 z11..12 are the locked stair flight ("."), so nothing is written there.
  layers(g, [16, 3, 10], {
    B: "barrel",
    F: "spruce_fence",
    S: ["spruce_stairs", { facing: "south", half: "bottom" }],
  }, [
    ["....", "..F.", "B.S."],
  ]);

  // Layer y4 (x16..19): table top slab (top half, sits on the fence) and a standing lantern on the dresser.
  layers(g, [16, 4, 10], {
    t: ["spruce_slab", { type: "top" }],
    L: ["lantern", { hanging: "false" }],
  }, [
    ["....", "..t.", "L..."],
  ]);
}
