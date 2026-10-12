// room-4: Taberna E3 (plan ROOMS [21,2,3,26,5,8]), the mirror of W2: a wine shop. The street window x22..25 at z=2 has its counter
// (P3). Inside: a masonry bar along z=4 with decorated pots on it, spruce stools on the customer side (z=5, stairs facing the
// bar), barrel stacks and a pot on the back wall (z=8), red carpet at z=7, bronze light at two corners and one hung over the
// middle. The 2-high walkway runs along z=6 from the fauces door (20,6) to the door to E4 (27,6); the shopkeeper's strip at
// z=3 is reached up the west column x=21.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { STONE_BRICKS, BARREL, DECORATED_POT, RED_CARPET, hangLamp, lampStand } from "../vocab.mjs";

export function build(g) {
  // The bar: a solid masonry counter across x22..25 at z=4, with two pots on it (y3).
  for (let x = 22; x <= 25; x++) g.set(x, 2, 4, STONE_BRICKS);
  g.set(22, 3, 4, DECORATED_POT);
  g.set(25, 3, 4, DECORATED_POT);

  // Stools: spruce stairs facing north (the seat faces the bar, its back is to the walkway at z=6).
  for (let x = 22; x <= 25; x++) g.set(x, 2, 5, ...B.stairs("spruce", "north", "bottom"));

  // Back wall storage: a row of barrels at z=8, two stacked at the ends, a pot on each stack.
  for (let x = 22; x <= 25; x++) g.set(x, 2, 8, BARREL, { facing: "up", open: "false" });
  for (const x of [22, 25]) {
    g.set(x, 3, 8, BARREL, { facing: "up", open: "false" });
    g.set(x, 4, 8, DECORATED_POT);
  }

  // Red carpet strip in front of the back storage, clear of the walkway.
  for (let x = 22; x <= 25; x++) g.set(x, 2, 7, RED_CARPET);

  // Light: a standing bronze lamp in each back corner of the shop's west side, one hung over the middle.
  lampStand(g, 21, 8);
  lampStand(g, 26, 3);
  hangLamp(g, 23, 6);
}
