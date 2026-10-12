// Grounds (P4): street, sidewalk and kerb, driveway, front walk, lawn with tufts, foundation beds, the young birch,
// lamp posts. Never the deck, never y0 under the house (P1 owns the foundation). vocab.lawn() writes every cell of its
// rectangle, so lawnOutside() below is the local helper that skips house, deck and paved cells.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  SIZE, YOUNG_TREE, LAMP_POSTS, street, driveway, frontWalk, shrub, bed, youngTree, lampPost, hash,
  GRASS_BLOCK, SHORT_GRASS, COARSE_DIRT, ALLIUM, PINK_TULIP, AZURE_BLUET, AZALEA_LEAVES, FLOWERING_AZALEA_LEAVES,
} from "../vocab.mjs";

// house footprints (x0,x1,z0,z1): garage G, centre C, east wing E, turret T, portico, chimney
const HOUSE = [[0, 12, 6, 19], [12, 33, 8, 23], [33, 43, 12, 27], [29, 33, 4, 8], [19, 26, 4, 7], [37, 39, 10, 12]];
const DECK = [14, 32, 24, 30];     // P5's deck; its steps sit at (22..24, 1, 31)
const inRect = (r, x, z) => x >= r[0] && x <= r[1] && z >= r[2] && z <= r[3];
const occupied = (x, z) => HOUSE.some((r) => inRect(r, x, z)) || inRect(DECK, x, z) || (z === 31 && x >= 22 && x <= 24);
// paving: street z0..1, the driveway apron x0..12 z1..5, the front walk x21..24 z1..3 (border included)
const paved = (x, z) => z <= 1 || (x <= 12 && z <= 5) || (x >= 21 && x <= 24 && z <= 3);

/** Grass_block y0 and short_grass tufts (one cell in ten by hash, none beside paving or a house) on every free cell
 * of the lot from z2 to the back edge. Skips house, deck and paved cells, so no earlier part's block is written. */
function lawnOutside(g) {
  for (let x = 0; x < SIZE[0]; x++) for (let z = 2; z < SIZE[2]; z++) {
    if (occupied(x, z) || paved(x, z)) continue;
    g.set(x, 0, z, GRASS_BLOCK, {});
    const near = [[0, 0], [1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => occupied(x + dx, z + dz) || paved(x + dx, z + dz));
    if (hash(x, 0, z) % 10 === 0 && !near) g.set(x, 1, z, SHORT_GRASS, {});
  }
}

export function build(g) {
  // street edge (z0 asphalt, z1 sidewalk, kerb slabs from x13) and the driveway apron x0..12 z1..5
  street(g, 0, SIZE[0] - 1, { kerbFrom: 13 });
  driveway(g, 0, 1, 12, 5);
  frontWalk(g);
  // the step row up to the portico (E23): air-only, since plan.md gives the steps to P3 and P3 may already be there
  for (let x = 20; x <= 25; x++) if (g.isAir(x, 1, 4)) g.set(x, 1, 4, ...B.stairs("stone_brick", "south", "bottom"));
  lawnOutside(g);

  // foundation beds: F1 and F2 flank the garage and the portico, flowers on the street side, shrubs on the house side
  bed(g, 13, 6, 18, 7, "north");
  bed(g, 27, 5, 28, 7, "north");

  // F3, the front of the turret bay: flowers on z2, low azalea on z3 only (no tall shrubs in front of the glass)
  for (let x = 29; x <= 33; x++) {
    g.set(x, 0, 2, COARSE_DIRT, {});
    g.set(x, 0, 3, COARSE_DIRT, {});
    g.set(x, 1, 2, [ALLIUM, PINK_TULIP, AZURE_BLUET][(x - 29) % 3], {});
    g.set(x, 1, 3, AZALEA_LEAVES, { persistent: "true" });
  }

  // F4, shrubs either side of the chimney
  for (const x of [34, 35, 36, 40, 41, 42]) for (const z of [10, 11]) shrub(g, x, z, (x + z) % 3 === 0 ? "flower" : "plain");

  // F5, the flowering shrub row either side of the front walk border (the stone brick border stays at y0)
  for (const x of [21, 24]) for (const z of [2, 3]) g.set(x, 1, z, FLOWERING_AZALEA_LEAVES, { persistent: "true" });

  // the young birch with its stakes and mulch ring
  youngTree(g, YOUNG_TREE.x, YOUNG_TREE.z);

  for (const [x, z] of LAMP_POSTS) lampPost(g, x, z);
}
