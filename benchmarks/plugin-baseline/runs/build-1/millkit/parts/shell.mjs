// P1 Shell: piers and skirting, decks, walls and gable fills of plots 0-3, coop, store body and false front.
// The writer helpers only fill air, so the first write into a cell wins: protected cells are written first or filtered out.
import { B, carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { henhouse } from "./coop.mjs";
import { pier_skirt, house_walls, false_front, coop } from "../vocab.mjs";

// Proxy grid that refuses writes into cells where skip(x, y, z) is true (chimneys, openings).
function filtered(g, skip) {
  return new Proxy(g, {
    get(t, p) {
      if (p === "set") return (x, y, z, ...a) => { if (!skip(x, y, z)) t.set(x, y, z, ...a); };
      const v = t[p];
      return typeof v === "function" ? v.bind(t) : v;
    },
  });
}
const inBox = (b) => (x, y, z) => x >= b[0] && x <= b[3] && y >= b[1] && y <= b[4] && z >= b[2] && z <= b[5];
const CHIMNEY_BOXES = [[9, 1, 12, 10, 14, 13], [17, 1, 12, 18, 14, 13], [25, 1, 12, 26, 14, 13], [37, 1, 12, 38, 14, 13]]
  .map(inBox);
const chimneyCell = (x, y, z) => CHIMNEY_BOXES.some((f) => f(x, y, z));

// Deck y 2 over the footprint with the crawlspace filled (nothing can spawn under the floor).
function deck(g, x0, z0, x1, z1, block) {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    const edge = x === x0 || x === x1 || z === z0 || z === z1;
    if (!edge) g.set(x, 1, z, ...B.block("coarse_dirt"));
    g.set(x, 2, z, ...B.block(block));
  }
}

function house(g, { box, plank, post, openings, gable, pier = "bricks", skirt, deckBlock = "oak_planks", extra }) {
  const [x0, z0, x1, z1] = box;
  const f = filtered(g, chimneyCell);
  pier_skirt(f, [x0, 7, x1, z1], pier, skirt);
  deck(f, x0, 7, x1, z1, deckBlock);
  if (extra) extra(f);
  house_walls(f, box, plank, post, openings, { gable });
}

// partition wall across x between x0..x1 at z (door cells left air), or along z
function partitionZ(g, x0, x1, z, plank, doorX) {
  for (let y = 3; y <= 6; y++) for (let x = x0; x <= x1; x++) {
    if (x === doorX && y <= 4) continue;
    g.set(x, y, z, ...B.block(plank));
  }
}
function partitionX(g, x, z0, z1, plank, doorZ) {
  for (let y = 3; y <= 6; y++) for (let z = z0; z <= z1; z++) {
    if (z === doorZ && y <= 4) continue;
    g.set(x, y, z, ...B.block(plank));
  }
}

export function build(g) {
  // ---- plot 0 shotgun (birch)
  house(g, {
    box: [3, 9, 8, 17], plank: "birch_planks", post: "stripped_birch_log", skirt: "spruce_fence", gable: "z",
    openings: [[5, 3, 9, 6, 4, 9], [4, 4, 9, 4, 5, 9], [7, 4, 9, 7, 5, 9], [3, 4, 11, 3, 5, 11], [3, 4, 15, 3, 5, 15],
      [8, 4, 10, 8, 5, 10], [8, 4, 15, 8, 5, 15], [6, 3, 17, 6, 4, 17], [4, 4, 17, 4, 5, 17], [5, 8, 9, 6, 8, 9]],
    extra: (f) => partitionZ(f, 4, 7, 13, "birch_planks", 5),
  });

  // ---- plot 1 saddlebag duplex (spruce board-and-batten); battens first, the first write wins
  {
    const f = filtered(g, chimneyCell);
    for (const x of [13, 17, 18, 22]) for (const z of [9, 16]) for (let y = 3; y <= 5; y++) f.set(x, y, z, ...B.pillar("stripped_spruce_log", "y"));
    for (const x of [13, 22]) for (const z of [11, 14]) for (let y = 3; y <= 5; y++) f.set(x, y, z, ...B.pillar("stripped_spruce_log", "y"));
    house(g, {
      box: [13, 9, 22, 16], plank: "spruce_planks", post: "stripped_spruce_log", skirt: "spruce_fence", gable: "x",
      openings: [[15, 3, 9, 15, 4, 9], [20, 3, 9, 20, 4, 9], [14, 4, 9, 14, 5, 9], [16, 4, 9, 16, 5, 9], [19, 4, 9, 19, 5, 9],
        [21, 4, 9, 21, 5, 9], [15, 4, 16, 15, 5, 16], [20, 4, 16, 20, 5, 16], [13, 9, 12, 13, 9, 13], [22, 9, 12, 22, 9, 13]],
      extra: (ff) => { for (const x of [17, 18]) partitionX(ff, x, 10, 15, "spruce_planks", -1); },
    });
  }

  // ---- plot 2 hall-and-parlour (oak clapboard, white corner boards)
  house(g, {
    box: [26, 9, 34, 16], plank: "oak_planks", post: "stripped_birch_log", skirt: "oak_fence", gable: "x",
    openings: [[29, 3, 9, 29, 4, 9], [27, 4, 9, 28, 5, 9], [32, 4, 9, 33, 5, 9], [26, 4, 10, 26, 5, 10], [26, 4, 15, 26, 5, 15],
      [34, 4, 11, 34, 5, 11], [34, 4, 14, 34, 5, 14], [28, 3, 16, 28, 4, 16], [32, 4, 16, 32, 5, 16], [34, 9, 12, 34, 9, 13]],
    extra: (f) => partitionX(f, 30, 10, 15, "oak_planks", 14),
  });

  // ---- plot 3 shotgun, mirrored (jungle)
  house(g, {
    box: [39, 9, 44, 17], plank: "jungle_planks", post: "stripped_dark_oak_log", skirt: "dark_oak_fence", gable: "z",
    openings: [[41, 3, 9, 42, 4, 9], [40, 4, 9, 40, 5, 9], [43, 4, 9, 43, 5, 9], [39, 4, 10, 39, 5, 10], [39, 4, 15, 39, 5, 15],
      [44, 4, 11, 44, 5, 11], [44, 4, 15, 44, 5, 15], [41, 3, 17, 41, 4, 17], [43, 4, 17, 43, 5, 17], [41, 8, 9, 42, 8, 9]],
    extra: (f) => partitionZ(f, 40, 43, 13, "jungle_planks", 42),
  });

  // ---- plot 5 coop
  henhouse(g);

  // ---- plot 7 company store
  {
    const [x0, z0, x1, z1] = [85, 9, 94, 17];
    // cobblestone piers every 3 with closed cobblestone skirting between; deck spruce
    for (let x = 85; x <= 94; x++) for (let z = 7; z <= 17; z++) {
      const edge = x === 85 || x === 94 || z === 7 || z === 17;
      if (edge) g.set(x, 1, z, ...B.block((x * 7 + z * 13) % 10 === 0 ? "mossy_cobblestone" : "cobblestone"));
      else g.set(x, 1, z, ...B.block("coarse_dirt"));
      g.set(x, 2, z, ...B.block("spruce_planks"));
    }
    const sideOpen = [[85, 4, 12, 85, 5, 12], [85, 4, 15, 85, 5, 15], [94, 4, 12, 94, 5, 12], [94, 4, 15, 94, 5, 15], [93, 3, 17, 93, 4, 17]];
    house_walls(g, [x0, z0, x1, z1], "dark_oak_planks", "stripped_dark_oak_log", [[85, 3, 9, 94, 6, 9], ...sideOpen]);
    // y 7 course on the sides and back (the front is the false front)
    for (let x = x0; x <= x1; x++) for (let z = z0 + 1; z <= z1; z++) {
      if (x !== x0 && x !== x1 && z !== z1) continue;
      const corner = (x === x0 || x === x1) && z === z1;
      g.set(x, 7, z, ...(corner ? B.pillar("stripped_dark_oak_log", "y") : B.block("dark_oak_planks")));
    }
    // false front, with the door, transom and shop windows left open
    const open = (x, y, z) => z === 9 && y <= 5 && ((x >= 89 && x <= 90) || (x >= 86 && x <= 87) || (x >= 92 && x <= 93));
    false_front(filtered(g, open), 85, 94, 9);
  }
}
