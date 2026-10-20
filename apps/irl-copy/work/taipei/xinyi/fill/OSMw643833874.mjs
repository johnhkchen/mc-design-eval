import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw643833874.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw643833874.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 24, H = 23, D = 30;
const g = new Voxels([W, H, D]);

// Two-storey mid-rise commercial block, c. 1990s Taipei: tiled white-concrete
// walls, stone base and string courses, shopfront ground floor, punched
// window grid above, stone cornice, white parapet, rooftop plant.
const FLOOR = 5;   // storey line (top of ground storey)
const DECK = 10;   // cornice / roof deck level
const ROOF = 11;   // parapet top, ~11 blocks above lowest ground
const TOP_UPPER = 9;

const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr] of cells) map.set(key(x, z), gr);
const has = (x, z) => map.has(key(x, z));

const paneProps = { north: "true", south: "true", east: "true", west: "true" };

for (const [x, z, g0] of cells) {
  const gr = Math.max(0, Math.min(H - 3, Math.round(g0)));

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Exposed faces decide shell vs interior.
  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const perim = exN || exS || exW || exE;
  const corner = (exN || exS) && (exW || exE);

  // Floor slab per storey and roof deck on every cell.
  if (FLOOR >= gr) g.set(x, FLOOR, z, "smooth_stone");
  if (DECK >= gr) g.set(x, DECK, z, "stone_bricks");

  if (!perim) {
    // Interior: air gap, plus a few rooftop plant boxes on the deck.
    if (DECK >= gr && ROOF > gr && x % 6 === 3 && z % 8 === 4) {
      g.set(x, ROOF, z, "iron_block");
    }
    continue;
  }

  const front = exN ? "north" : exS ? "south" : exW ? "west" : "east";
  const alongX = exN || exS;
  const c = alongX ? x : z;
  const inward = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] }[front];

  if (corner) {
    // Corner pier: solid masonry from ground to the cornice.
    for (let y = gr; y <= TOP_UPPER; y++) g.set(x, y, z, "stone_bricks");
  } else {
    const entAt = alongX ? 12 : 15;
    const isEntrance = c === entAt;
    const nearEnt = Math.abs(c - entAt) === 1;
    const isPier = c % 4 === 0;

    for (let y = gr; y <= TOP_UPPER; y++) {
      if (y <= 4) {
        // Ground storey: shopfront.
        if (y === gr && gr > 0) {
          g.set(x, y, z, "stone_bricks"); // base course
        } else if (isEntrance) {
          if (y <= gr + 1) {
            // door handled below
          } else {
            g.set(x, y, z, "stone_bricks");
          }
        } else if (isPier || nearEnt) {
          g.set(x, y, z, "stone_bricks");
        } else {
          g.set(x, y, z, "glass");
        }
      } else if (y === FLOOR) {
        g.set(x, y, z, "smooth_stone"); // string course
      } else if (y === TOP_UPPER) {
        g.set(x, y, z, "white_concrete"); // spandrel
      } else {
        // Upper storey window grid: 3-block bays, mullion column every third.
        if (c % 3 === 0) {
          g.set(x, y, z, "white_concrete");
        } else {
          g.set(x, y, z, "glass_pane", paneProps);
          // Warm light behind the glass on some windows.
          if (y === 7 && c % 9 === 1 && has(x + inward[0], z + inward[1])) {
            g.set(x + inward[0], y, z + inward[1], "glowstone");
          }
        }
      }
    }

    // Entrance door, two blocks tall, on the ground storey.
    if (isEntrance && gr + 1 <= 4) {
      g.set(x, gr, z, "dark_oak_door", {
        facing: front, half: "lower", hinge: "left", open: "false", powered: "false",
      });
      g.set(x, gr + 1, z, "dark_oak_door", {
        facing: front, half: "upper", hinge: "left", open: "false", powered: "false",
      });
    }
  }

  // Cornice and parapet on every perimeter cell.
  if (DECK >= gr) g.set(x, DECK, z, "smooth_stone");
  if (ROOF > gr) g.set(x, ROOF, z, "white_concrete");
}

g.save(OUT);
