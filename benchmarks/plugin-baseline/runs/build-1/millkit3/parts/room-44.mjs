// P7 east bedroom front: upper front bedroom of the east unit, inner air x91..93, y8..11, z10..12.
// Bed head on the solid east wall (x94) at z10; a dresser of barrels on the same wall; a small table with a lantern
// by the stair landing side; the gallery door (91, 8..9, 9) and the stair landing (91, 8, 11) keep the x91 lane clear.
// Lighting: a lantern standing on the table (y10) lights the room; the dresser's flower pot sits on a barrel top.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed_set } from "../vocab.mjs";

export function build(g) {
  // Bed: foot (92,8,10), head (93,8,10) against the solid east wall, facing east, orange (east unit colour).
  bed_set(g, [92, 8, 10], "east", "orange");

  // Dresser: a barrel against the east wall, a flower pot on its top. (93,8,12) stays clear: the way to the back
  // bedroom's door at (93,8,13).
  g.set(93, 8, 11, "barrel", { facing: "up" });
  g.set(93, 9, 11, "flower_pot");

  // Rug in the middle of the room, between the bed and the table.
  g.set(92, 8, 11, "white_wool");

  // Table: spruce fence post at y8 with a top slab at y9 (its top face at y10), lantern standing on it.
  g.set(92, 8, 12, "spruce_fence");
  g.set(92, 9, 12, ...B.slab("spruce", "top"));
  g.set(92, 10, 12, "lantern", { hanging: "false" });
}
