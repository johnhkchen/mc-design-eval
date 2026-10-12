// Room: West passage (interior designer). Inner air box [19,6,18,22,8,19]; ways in: the gallery door (23,6..7,18) east,
// bedroom 2 door (20,6..7,17) north, bedroom 4 door (21,6..7,20) south, the tunnel (18,6..7,18) west to the bonus room.
// Layout: the z=18 row and the cells in front of each door stay clear (2 high), so every way in reaches every piece.
// Linen shelves on the west wall, a bench (oak stairs as a seat) against the south wall, and the linen press at the
// east end as the focal piece, under a hanging lantern. Lanterns hang from the top plate (y9); no runner (no carpet
// in palette.json), see plan.md Notes.
import { B } from "../vocab.mjs";

export function build(g) {
  // Floor is laid by the shell (oak_planks); this part only adds into the air above it.

  // Linen shelves on the west wall (x19, z19): a white press base, a slab shelf, and a flower pot on the shelf.
  g.set(19, 6, 19, "white_concrete");
  g.set(19, 7, 19, ...B.slab("birch", "bottom"));
  g.set(19, 8, 19, "flower_pot");

  // Bench: an oak stair as a seat against the south wall, facing north into the room.
  g.set(20, 6, 19, ...B.stairs("oak", "north", "bottom"));

  // Linen press (focal piece) at the east end, against the gallery-side wall: solid base, closed drawer front.
  g.set(22, 6, 19, "dark_oak_planks");
  g.set(22, 7, 19, ...B.trapdoor("dark_oak", "west", "bottom", false));

  // Light: two lanterns hung from the top plate; the east one sits over the press so the focal piece is brightest.
  g.set(20, 8, 19, ...B.lantern(true));
  g.set(22, 8, 19, ...B.lantern(true));
}
