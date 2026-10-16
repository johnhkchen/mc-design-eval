// P3 master bedroom: upper front room, inner air x 40..42, y 8..11, z 10..12; entered from the landing at (43,8,10).
// Furniture: one purple bed on the west wall (head at (40,8,11), foot (41,8,11), facing the room's west wall, so
// the focal piece sits across from the door), a barrel dresser on the south wall with a flower pot, a standing
// lantern on the dresser top as the bedside lamp, and a hanging lantern over the lane. The doorway's first cell
// (42,8,10) and the lane (40..42, z10) stay clear.
import { hanging_lantern } from "../vocab.mjs";
import { bed, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Bed: foot at (41,8,11), head one step west at (40,8,11) against the solid west wall (x 39).
  bed(g, [41, 8, 11], "west", "purple");

  // Dresser and bedside light, drawn as text: rows along +x (x 40..42), successive rows along +z (z 10..12).
  // y 8: two barrels on the south wall; y 9: a flower pot on the west barrel, a standing lantern on the east one.
  const legend = {
    B: ["barrel", { facing: "up", open: "false" }],
    p: "flower_pot",
    L: ["lantern", { hanging: "false" }],
  };
  layers(g, [40, 8, 10], legend, [
    ["   ", "   ", "BB "],   // y 8
    ["   ", "   ", "pL "],   // y 9
  ]);

  // Hanging lantern over the lane, from the ceiling above (41,11,10).
  hanging_lantern(g, 41, 11, 10);
}
