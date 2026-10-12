// Room: Kitchen and great room (interior designer), parts/room-4.mjs. Inner air x19..34, y1..4, z18..24.
// Layout: counters on the south wall z=24 (fridge, sink under the window x20..21, range, prep counter); back-door gap
// x25..28 left open. Focal piece: the island x25..29 z20..21 with pendant lanterns and six oak_stairs stools (z19 and
// z22). West: a counter run along z=18 x19..23, walked round on z=19. Breakfast nook x31..34 z22..24: a quartz table
// at x32..33 z23 with two stair chairs. Walkways: foyer z17 -> z18 row; mudroom (18,21) -> z19..21; dining (33,17)
// -> x33..34 column; cased opening (35,19..22) -> x34 column and the z=24 row.
import { B } from "../vocab.mjs";

const block = (g, x, y, z, name) => g.set(x, y, z, ...B.block(name));
const counter = (g, x, z) => { block(g, x, 1, z, "dark_oak_planks"); g.set(x, 2, z, ...B.slab("quartz", "bottom")); };
const stool = (g, x, z, facing) => g.set(x, 1, z, ...B.stairs("oak", facing));
const pendant = (g, x, y, z) => g.set(x, y, z, ...B.lantern(true));

export function build(g) {
  // south wall (z=24): fridge, sink, range, prep counter; the back door gap x25..28 stays open
  for (let y = 1; y <= 3; y++) block(g, 19, y, 24, "white_concrete");
  counter(g, 20, 24);
  block(g, 21, 1, 24, "dark_oak_planks");
  g.set(21, 2, 24, ...B.block("cauldron"));
  block(g, 22, 1, 24, "black_concrete");
  block(g, 22, 2, 24, "iron_bars");
  block(g, 23, 1, 24, "black_concrete");
  g.set(23, 2, 24, ...B.lantern(false));
  counter(g, 24, 24);
  counter(g, 29, 24);
  counter(g, 30, 24);
  g.set(30, 3, 24, ...B.block("flower_pot"));

  // west run along the north wall (z=18), walked round on z=19; the gap at x21 is the way to the office's south door
  for (let x = 19; x <= 23; x++) if (x !== 21) counter(g, x, 18);

  // focal island x25..29 z20..21: dark base, quartz top, potted plants, pendant lights
  for (let x = 25; x <= 29; x++) for (let z = 20; z <= 21; z++) {
    block(g, x, 1, z, "dark_oak_planks");
    g.set(x, 2, z, ...B.slab("quartz", "bottom"));
  }
  g.set(26, 3, 20, ...B.block("flower_pot"));
  g.set(28, 3, 21, ...B.block("flower_pot"));
  for (const x of [25, 27, 29]) {
    stool(g, x, 19, "south");
    stool(g, x, 22, "north");
  }

  // breakfast nook x31..34 z22..24: quartz table at x32..33 z23, two chairs on its north side
  for (const x of [32, 33]) {
    block(g, x, 1, 23, "quartz_block");
    g.set(x, 2, 23, ...B.slab("quartz", "bottom"));
    stool(g, x, 22, "south");
  }

  // light: pendant lanterns over the island and the nook, one standing lantern on the range counter
  pendant(g, 27, 4, 20);
  pendant(g, 21, 4, 21);
  pendant(g, 31, 4, 20);
  pendant(g, 33, 4, 18);
  pendant(g, 25, 4, 18);
  pendant(g, 32, 4, 23);
}
