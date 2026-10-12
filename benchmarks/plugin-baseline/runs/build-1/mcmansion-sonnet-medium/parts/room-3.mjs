// Formal dining room (interior designer): inner air x31..34, y1..4, z12..16 (plan.md ROOMS).
// Long table for six down the middle (x32..33, z12..15) with oak-stair chairs on each side, a sideboard on the east wall,
// and a hanging lantern chandelier over the table. The foyer door (30,1..2,14) and the kitchen door (33,1..2,17) are
// placed here; each cell is written only if it is still air. Two-wide walkway along z=16 and the x=31 column keeps
// both doors connected to every seat.
import { B } from "../vocab.mjs";

const AIR = "minecraft:air";
const TABLE = "dark_oak_planks";
const TOP = "dark_oak_trapdoor";
const CHAIR = "oak";
const SIDEBOARD = "dark_oak_planks";

// Writes only into air: an earlier part's block is never replaced.
function place(g, x, y, z, block, state) {
  const here = g.blockAt(x, y, z);
  if (here && here !== AIR) return;
  g.set(x, y, z, block, state);
}

export function build(g) {
  // Table body and flush trapdoor top, x32..33 z12..15.
  for (let z = 12; z <= 15; z++) {
    for (const x of [32, 33]) {
      place(g, x, 1, z, TABLE);
      place(g, x, 2, z, ...B.trapdoor("dark_oak", "north", "bottom", false));
    }
  }

  // Chairs as stairs: facing = the low front, toward the table.
  for (const z of [12, 13]) place(g, 31, 1, z, ...B.stairs(CHAIR, "east", "bottom"));
  for (let z = 12; z <= 15; z++) place(g, 34, 1, z, ...B.stairs(CHAIR, "west", "bottom"));

  // Sideboard on the east wall, south end, with a lantern on top.
  place(g, 34, 1, 16, SIDEBOARD);
  place(g, 34, 2, 16, ...B.lantern(false));

  // Chandelier: chain hanging from the y5 ceiling, lantern over the table middle.
  place(g, 32, 4, 13, ...B.chain("y"));
  place(g, 32, 3, 13, ...B.lantern(true));

  // Foyer door (west wall, z=14) and kitchen door (south wall, x=33), both halves.
  place(g, 30, 1, 14, ...B.door("dark_oak", "east", "lower", "left"));
  place(g, 30, 2, 14, ...B.door("dark_oak", "east", "upper", "left"));
  place(g, 33, 1, 17, ...B.door("dark_oak", "north", "lower", "left"));
  place(g, 33, 2, 17, ...B.door("dark_oak", "north", "upper", "left"));
}
