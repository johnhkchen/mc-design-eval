// Interior designer for "Armory lobby and shops" (room 1): the ticket desk is the focal piece, east of the north-door lane;
// shop counters flank the lane; a bank of fence-and-slab tables with stair chairs fills the middle; hanging lanterns from
// the 2F ceiling light the room. Everything sits inside the room box x2..105, y1..6, z7..33; the stair holes (x8..9 and
// x98..99, z8..14) and the lanes from the north door and the two hall doorways stay clear.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const QUARTZ = "smooth_quartz";
const SANDSTONE = "smooth_sandstone";
const ANDESITE = "polished_andesite";

// a table: oak fence post at y1, a top quartz slab at y2 (its bottom meets the fence top), four stair chairs whose
// full-height back faces away from the table
function table(g, x, z) {
  g.set(x, 1, z, "oak_fence");
  g.set(x, 2, z, ...B.slab(QUARTZ, "top"));
  g.set(x, 1, z - 1, ...B.stairs(SANDSTONE, "north"));
  g.set(x, 1, z + 1, ...B.stairs(SANDSTONE, "south"));
  g.set(x - 1, 1, z, ...B.stairs(SANDSTONE, "west"));
  g.set(x + 1, 1, z, ...B.stairs(SANDSTONE, "east"));
}

// a shop counter: full blocks at y1 along x, a standing lantern on top at each end and one in the middle
function counter(g, x0, x1, z, lamps) {
  for (let x = x0; x <= x1; x++) g.set(x, 1, z, ANDESITE);
  for (const x of lamps) g.set(x, 2, z, ...B.lantern(false));
}

function hang(g, x, z) {
  g.set(x, 6, z, ...B.lantern(true));
}

export function build(g) {
  // ticket desk (focal): the quartz counter runs east of the north-door lane, facing north towards the doors
  for (let x = 64; x <= 77; x++) g.set(x, 1, 12, QUARTZ);
  g.set(66, 2, 12, ...B.lantern(false));
  g.set(75, 2, 12, ...B.lantern(false));
  hang(g, 70, 10);
  hang(g, 76, 10);

  // shop counters flanking the lane
  counter(g, 44, 56, 12, [46, 54]);
  counter(g, 80, 92, 12, [82, 90]);

  // seating: six tables in two rows, leaving the east-west lane at z19..28 and the north-south lanes clear
  for (const z of [17, 30]) {
    for (const x of [20, 36, 52]) table(g, x, z);
  }
  table(g, 72, 17);
  table(g, 86, 17);
  table(g, 72, 30);
  table(g, 86, 30);

  // hanging lanterns from the 2F ceiling: down the north-door lane, over the tables, over the east zone
  for (const z of [10, 20, 28]) hang(g, 62, z);
  for (const x of [20, 36, 52]) {
    hang(g, x, 17);
    hang(g, x, 30);
  }
  for (const x of [72, 86]) {
    hang(g, x, 17);
    hang(g, x, 30);
  }
}
