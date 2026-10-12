// Room: back bedroom (children's room over the garden), inner air box [2,9,26,13,11,29].
// Entered from the upper hall through (12,9..10,25); windows on the back wall at (4|7|10, 9..11, 30).
// Layout: white bed in the NW corner (head on the north wall), red bed in the SE corner (head on the back wall), toy chest
// (barrel) by the white bed, a bookshelf in the SW corner, and the desk under the middle window with its chair. A red rug
// sits between them. Light: a hanging lantern over the chair and a desk lantern; the x12 column stays clear as the path
// from the door to both beds.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const AIR = ["minecraft:air", "minecraft:cave_air"];
// Add into air only: a cell an earlier part owns is skipped, never overwritten.
const put = (g, x, y, z, block, state = {}) => {
  if (!AIR.includes(g.blockAt(x, y, z))) return false;
  g.set(x, y, z, block, state);
  return true;
};

export function build(g) {
  // Beds: a bed is two cells, and its facing points from the foot to the head.
  put(g, 2, 9, 26, "white_bed", { facing: "north", part: "head", occupied: "false" });
  put(g, 2, 9, 27, "white_bed", { facing: "north", part: "foot", occupied: "false" });
  put(g, 13, 9, 29, "red_bed", { facing: "south", part: "head", occupied: "false" });
  put(g, 13, 9, 28, "red_bed", { facing: "south", part: "foot", occupied: "false" });

  // Toy chest: a barrel with a potted flower on its lid.
  put(g, 4, 9, 27, "barrel", { facing: "up", open: "false" });
  put(g, 4, 10, 27, "potted_red_tulip", {});

  // Bookshelf in the SW corner, a potted fern on top.
  put(g, 2, 9, 29, "bookshelf", {});
  put(g, 2, 10, 29, "potted_fern", {});

  // Desk under the middle window: fence table, standing lantern as the desk lamp, chair facing it (south).
  put(g, 7, 9, 29, "dark_oak_fence", {});
  put(g, 7, 10, 29, ...B.lantern(false));
  put(g, 7, 9, 28, ...B.stairs("dark_oak", "south", "bottom"));

  // Hanging lamp over the rug, clear of the chair's head room.
  put(g, 8, 11, 28, ...B.chain("y"));
  put(g, 8, 10, 28, ...B.lantern(true));

  // Second hanging lamp over the white bed's foot, lighting the NW corner (its lantern sits above the bed, off the path).
  put(g, 2, 11, 27, ...B.chain("y"));
  put(g, 2, 10, 27, ...B.lantern(true));

  // Red rug between the beds and the desk (carpets do not block the path).
  for (let x = 5; x <= 9; x++) for (let z = 27; z <= 28; z++) put(g, x, 9, z, "red_carpet", {});
}
