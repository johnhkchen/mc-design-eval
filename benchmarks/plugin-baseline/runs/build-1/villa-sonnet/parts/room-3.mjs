// Taberna W2 (plan ROOMS): inner shop/tavern off the street window x10..13, air box [9,2,3,14,5,8].
// Layout: the bar runs along the street window (focal, lit by a hanging lamp), two stools face it from the room side,
// a barrel pair sits in the west corner and one barrel in the east, two dining tables with a corner lampstand and a
// flower pot. Doorways (15,2..3,6) east and (8,2..3,6) west stay clear, with a 2-high walkway from each to every piece.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { BARREL, DARK_OAK_STAIRS, STONE_BRICKS, lampStand, hangLamp, table, pot } from "../vocab.mjs";

export function build(g) {
  // Bar: a stone base at y2 with a dark-oak slab counter at y3, along the street window (x10..13, z3).
  for (let x = 10; x <= 13; x++) {
    g.set(x, 2, 3, STONE_BRICKS);
    g.set(x, 3, 3, ...B.slab("dark_oak", "bottom"));
  }

  // Stools: dark-oak stairs as seats, facing the bar (stairs rise toward the back, south).
  g.set(10, 2, 4, DARK_OAK_STAIRS, { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
  g.set(12, 2, 4, DARK_OAK_STAIRS, { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });

  // Barrels behind the bar in the west corner, and one in the east corner.
  for (const [x, z] of [[9, 3], [9, 4], [14, 3]]) g.set(x, 2, z, BARREL, { facing: "up", open: "false" });

  // Two dining tables (dark-oak fence legs, slab tops) in the middle of the room, clear of both doorways.
  table(g, 10, 6, 2, 2);
  table(g, 12, 7, 2, 2);

  // Light: two hanging lamps (over the room centre and the second table) and a standing lamp in the south-west corner.
  hangLamp(g, 11, 5);
  hangLamp(g, 13, 7);
  lampStand(g, 9, 8);

  // A potted plant in the south-east corner.
  pot(g, 14, 8, "poppy");
}
