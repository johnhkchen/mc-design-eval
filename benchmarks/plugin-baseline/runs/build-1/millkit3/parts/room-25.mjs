// P3 tower room: 2 x 2 bedroom in the superintendent's corner tower (x 44..45, z 8..9, y 8..11), entered north-to-south
// from the landing via (44,8,10). One bed (head against the solid east wall x 46 at y 8, under the east window),
// a barrel dresser with a flower pot, one hanging lantern. The ladder (44, 8..12, 9) is the stair joiner's: its cells
// are never written here, and the bed's foot sits beside it so the ladder foot stays clear.
import { bed_set, hanging_lantern } from "../vocab.mjs";
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // Bed: foot (44,8,8), head (45,8,8) against the solid wall x 46, facing east, purple (plan: tower room bed).
  bed_set(g, [44, 8, 8], "east", "purple");

  // Dresser: a barrel on the floor at (45,8,9) with a flower pot on its top face (45,9,9). Drawn as text.
  layers(g, [45, 8, 9], { b: ["barrel", { facing: "up" }], p: "flower_pot" }, [["b"], ["p"]]);

  // Light: a lantern hanging from the belvedere floor (45,12,8), centre of the room.
  hanging_lantern(g, 45, 11, 8);
}
