// ROOM bedroom 1 (interior designer): guest/child room in blue-teal. Inner air x=26..30, z=9..12, y=2..4 (floor spruce
// planks at y=1). Doorway (25,10) on the west wall; east window x=31 z=10..12 (not covered). Layout:
//   - double bed, cyan, head to the east, headboard against the east wall under the window; spruce_fence nightstands
//     with birch slabs flank the head (bed_double, facing east, centre row z=10);
//   - a single spruce wardrobe on the west wall, north of the doorway (fronts face the room);
//   - cyan carpet rug at the foot of the bed; a barrel at the south-east corner;
//   - two hung lanterns over the room's clear middle as the light (the bed reads brightest).
// The path: door (26,10) -> (26,11..12) -> row z=12 east -> up the east column to the bed's head side.
import { bed_double, wardrobe, hung_lantern } from "../vocab.mjs";
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

export function build(g) {
  // the bed: foot (28,10), head (29,10), headboard (30,10); nightstands at (29,9) and (29,11)
  bed_double(g, 28, 10, "east", "cyan");
  // the wardrobe: one cell on the west wall, north of the doorway; open fronts face east into the room
  wardrobe(g, 26, 9, 1, "z", "east");
  // rug on the floor between the wardrobe and the bed foot (walkable)
  layers(g, [27, 2, 11], { "c": "cyan_carpet" }, ["cc"]);
  // a potted cactus in the corner beside the headboard (unreachable corner: furniture, not floor)
  g.set(30, 2, 9, "potted_cactus");
  // lights: hung lanterns in the middle of the room, under the ceiling (y=5 is the ceiling or a beam)
  hung_lantern(g, 27, 4, 11);
  hung_lantern(g, 30, 4, 9);
}
