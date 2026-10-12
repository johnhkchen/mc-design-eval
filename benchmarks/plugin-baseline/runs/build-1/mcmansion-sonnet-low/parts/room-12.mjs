// Room 12: Bedroom 2, interior designer. Inner air x27..34, y7..9, z17..27; door (30, y7..8, z16) from the upper hall;
// rear window x29..31 at z28. Palette-only build: the palette has no bed, bookshelf, dresser, barrel or carpet, so the
// bed and storage pieces are left out (see plan.md Notes) rather than stood in for with other blocks.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const FLOOR = 7;                       // walking level (oak floor y6 is the shell's)
const SPRUCE_FENCE = "spruce_fence";

export function build(g) {
  // Reading nook under the rear window (the focal piece): a pedestal table at (30,25) with a seat either side on the
  // z axis, facing the table. Stairs' tall back faces away from the table: north seat faces north, south seat faces south.
  g.set(30, FLOOR, 25, SPRUCE_FENCE);
  g.set(30, FLOOR + 1, 25, ...B.slab("spruce", "bottom"));
  g.set(30, FLOOR, 24, ...B.stairs("spruce", "north", "bottom"));
  g.set(30, FLOOR, 26, ...B.stairs("spruce", "south", "bottom"));
  // Pendant lantern hangs from the ceiling over the table: the brightest light sits on the focal piece.
  g.set(30, 9, 25, ...B.lantern(true));

  // Floor lanterns in the corners away from the door, and ceiling pendants over the room's open floor.
  g.set(27, FLOOR, 17, ...B.lantern(false));
  g.set(34, FLOOR, 27, ...B.lantern(false));
  g.set(28, 9, 21, ...B.lantern(true));
  g.set(33, 9, 21, ...B.lantern(true));
}
