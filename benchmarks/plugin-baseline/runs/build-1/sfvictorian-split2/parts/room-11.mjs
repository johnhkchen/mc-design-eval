// room: Study and nursery (plan ROOMS: box [2,9,17,9,11,23], spruce_planks floor y8, ceiling y12).
// Children's room and study in one: a cyan bed on the west wall, a bookcase wall and a study desk with a lectern
// on the north wall (the focal piece, under the brightest lantern), a toy chest in the SW corner, and a yellow and
// green striped rug. Lanterns hang from the y12 ceiling and a candle sits on the desk. Only air is written.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { bed, bookwall, chair, desk, nightstand, rug } from "../vocab.mjs";

export function build(g) {
  // North wall z17: bookcase wall, lectern on the floor, study desk with a chair facing it, bookcase wall.
  bookwall(g, 2, 4, 9, 17, 2);
  bookwall(g, 8, 9, 9, 17, 2);
  g.set(5, 9, 17, "lectern", { facing: "south", has_book: "false", powered: "false" });
  desk(g, 6, 9, 17, 2, "x");
  g.set(7, 11, 17, "candle", { candles: "1", lit: "true", waterlogged: "false" });
  chair(g, 6, 9, 18, "north");

  // West wall: child's bed (head against the wall at x2, foot at x3) with a barrel nightstand.
  bed(g, 3, 9, 21, "cyan", "west");
  nightstand(g, 2, 9, 20);

  // SW corner: toy chest.
  g.set(2, 9, 23, "chest", { facing: "east", type: "single", waterlogged: "false" });

  // Colourful rug: yellow and green stripes across the middle of the floor (keeps the walking lanes clear).
  rug(g, 4, 5, 9, 19, 22, "yellow");
  rug(g, 6, 7, 9, 19, 22, "green");

  // Light as a room at night: lanterns hang from the y12 ceiling; the focal desk gets the brightest one.
  g.set(6, 11, 18, ...B.lantern(true));
  g.set(3, 11, 20, ...B.lantern(true));
  g.set(8, 11, 22, ...B.lantern(true));
}
