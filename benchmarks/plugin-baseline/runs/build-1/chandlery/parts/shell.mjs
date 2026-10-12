// Masonry shell: plinth, brick ground walls (main house + workshop), quoins, floors, partitions, the stair, openings.
import { brickCourse, quoin } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const HOLES = [
  [7, 2, 8, 7, 4, 8],       // shop door + transom
  [15, 2, 8, 15, 3, 8],     // family door
  [10, 2, 8, 12, 4, 8],     // shop bay opens into the shop
  [17, 2, 11, 17, 3, 12],   // kitchen firebox (chimney part)
  [17, 3, 14, 17, 4, 15],   // east kitchen window
  [5, 2, 11, 5, 4, 13],     // west shop window
  [16, 2, 17, 16, 3, 17],   // back door
  [10, 2, 17, 10, 3, 17],   // shop to workshop doorway
  [13, 2, 21, 13, 3, 21],   // workshop side door
  [5, 2, 20, 5, 4, 21], [5, 2, 24, 5, 4, 25],   // workshop west windows
  [13, 2, 24, 13, 4, 25],   // workshop east window
  [6, 3, 27, 6, 4, 27], [12, 3, 27, 12, 4, 27], // workshop gable windows
  [8, 2, 27, 9, 3, 27],     // rendering-hearth firebox
  [12, 2, 10, 12, 3, 10],   // partition opening
];
const inHole = (x, y, z) => HOLES.some(([a, b, c, d, e, f]) => x >= a && x <= d && y >= b && y <= e && z >= c && z <= f);
const hash = (x, y, z) => { let h = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791); h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };

export function build(g) {
  const put = (x, y, z, b, s) => { if (g.isAir(x, y, z) && !inHole(x, y, z)) s ? g.set(x, y, z, b, s) : g.set(x, y, z, b); };
  const fillBox = (x0, y0, z0, x1, y1, z1, b, s) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) for (let z = z0; z <= z1; z++) put(x, y, z, b, s); };

  // quoins first (they write only into air): long and short at the four main corners and the workshop's south corners
  for (const [x, z, sx, sz] of [[5, 8, "east", "south"], [17, 8, "west", "south"], [5, 17, "east", "north"], [17, 17, "west", "north"]]) {
    quoin(g, x, z, 2, 5, sx); quoin(g, x, z, 2, 5, sz);
  }
  for (const [x, sx] of [[5, "east"], [13, "west"]]) { quoin(g, x, 27, 2, 5, sx); quoin(g, x, 27, 2, 5, "north"); }
  for (const [x, sx] of [[5, "east"], [13, "west"]]) quoin(g, x, 18, 2, 5, "south");

  // plinth y=1 (stone bricks, moss about 1 in 8 and more at the ends), as rows on z and columns on x
  const plinth = [[5, 17, 8], [5, 17, 17], [5, 13, 27]];
  for (const [a, b, z] of plinth) brickCourse(g, a, b, 1, z, 0.125);
  const col = (x, z0, z1) => { for (let z = z0; z <= z1; z++) if (g.isAir(x, 1, z)) g.set(x, 1, z, hash(x, 1, z) < 0.15 ? "mossy_stone_bricks" : "stone_bricks"); };
  col(5, 9, 16); col(17, 9, 16); col(5, 18, 26); col(13, 18, 26);

  // brick walls y=2..5 (skip openings), main ring then workshop ring
  fillBox(5, 2, 8, 17, 5, 8, "bricks"); fillBox(5, 2, 17, 17, 5, 17, "bricks");
  fillBox(5, 2, 8, 5, 5, 17, "bricks"); fillBox(17, 2, 8, 17, 5, 17, "bricks");
  fillBox(5, 2, 18, 5, 5, 27, "bricks"); fillBox(13, 2, 18, 13, 5, 27, "bricks"); fillBox(5, 2, 27, 13, 5, 27, "bricks");
  // doors' lintel courses stay brick; the head beam over the front is the bressumer
  for (let x = 6; x <= 16; x++) { g.set(x, 5, 8, ...B.wood("stripped_dark_oak", "x")); }
  g.set(15, 4, 8, "bricks");
  // window sills outside the east kitchen window
  for (const z of [14, 15]) g.set(18, 2, z, ...B.slab("stone_brick", "top"));

  // ground floors
  fillBox(6, 1, 9, 11, 1, 16, "spruce_planks"); fillBox(13, 1, 9, 16, 1, 16, "oak_planks");
  fillBox(12, 1, 9, 12, 1, 16, "dark_oak_planks"); fillBox(10, 1, 8, 12, 1, 8, "stone_bricks");
  fillBox(6, 1, 18, 12, 1, 26, "stone_bricks");
  fillBox(17, 1, 11, 17, 1, 12, "stone_bricks"); // firebox floor

  // partition shop | hall at x=12 (opening at z=10)
  fillBox(12, 2, 9, 12, 5, 16, "dark_oak_planks");

  // upper floor y=6, with the stairwell hole at x=16, z=13..16
  for (let x = 6; x <= 16; x++) for (let z = 8; z <= 16; z++) if (!(x === 16 && z >= 13)) put(x, 6, z, "dark_oak_planks");

  // bedchamber partitions upstairs: z=13 (doorways at x=8 and x=13, y=7..8) and x=11 between the bedchambers
  for (let x = 6; x <= 15; x++) for (let y = 7; y <= 10; y++) if (!((x === 8 || x === 13) && y <= 8)) put(x, y, 13, "spruce_planks");
  fillBox(11, 7, 14, 11, 10, 16, "spruce_planks");

  // the stair, rising north
  [[16, 2, 16], [16, 3, 15], [16, 4, 14], [16, 5, 13]].forEach(([x, y, z]) => g.set(x, y, z, ...B.stairs("dark_oak", "north", "bottom")));
}
