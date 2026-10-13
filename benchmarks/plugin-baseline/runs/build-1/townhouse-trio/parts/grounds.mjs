// grounds (part 6): road, kerb, pavement, ground patches, side paths, street trees, lamp posts, rear gardens with beds,
// garden walls, gates, back doors and their steps. Everything here sits at y=0 (ground) or above it outside the house
// footprint, so no earlier part's cell is written. Ground is grass_block from build.mjs; this part lays the rest.
import {
  rng, ANDESITE, GRAVEL, SMOOTH_STONE, POLISHED_ANDESITE, COARSE_DIRT, PODZOL, ROOTED_DIRT, DIRT_PATH,
  STONE_BRICK_STAIRS, SPRUCE_DOOR, BRICKS, streetTree, lampPost, gardenWall, gardenBed, doorFit,
} from "../vocab.mjs";

export function build(g) {
  const r = rng(6);
  const ground = (x, z, block) => g.set(x, 0, z, block);

  // ---- road, kerb, pavement (plan SITE: road z0..4, kerb z=5, pavement z6..8)
  g.fill([0, 0, 0], [30, 0, 4], ANDESITE);
  for (const [x, z] of [[4, 1], [5, 1], [5, 2], [18, 3], [19, 3], [24, 1], [24, 2], [25, 2]]) ground(x, z, GRAVEL);
  g.fill([0, 0, 5], [30, 0, 5], SMOOTH_STONE);
  g.fill([0, 0, 6], [30, 0, 8], POLISHED_ANDESITE);

  // ---- lot edges outside the terrace: grass with coarse dirt and rooted patches; gravel side paths at x=1 and x=29
  for (const [x0, x1] of [[0, 2], [28, 30]]) {
    for (let x = x0; x <= x1; x++) for (let z = 9; z <= 34; z++) {
      if (x === 1 || x === 29) { ground(x, z, GRAVEL); continue; }
      const roll = r();
      if (roll < 0.12) ground(x, z, COARSE_DIRT);
      else if (roll < 0.16) ground(x, z, ROOTED_DIRT);
    }
  }

  // ---- street trees: podzol pit in the pavement edge, then the tree
  for (const x of [2, 15, 28]) {
    ground(x, 7, PODZOL);
    streetTree(g, x, 7);
  }

  // ---- lamp posts at z=8: the pavement's street lamps every ~4-6 cells, clear of the trees' crowns (x2, 15, 28 reach
  // x0..4, 13..17, 26..30 at y4..7); the side paths at x=0 and x=30 get one post every ~9 cells; each rear garden gets
  // one post on its outer edge column, so the beds and the path are lit.
  for (const x of [5, 9, 12, 18, 21, 25]) lampPost(g, x, 8);
  for (const z of [12, 21, 30]) { lampPost(g, 0, z); lampPost(g, 30, z); }
  for (const x of [1, 29]) lampPost(g, x, 1);   // the road's far corners, out of reach of the pavement lamps
  for (const x of [4, 12, 18, 26]) lampPost(g, x, 30);

  // ---- rear gardens: a central dirt path per garden, coarse dirt beds either side, one gate on each back wall
  // garden A x4..10, B x12..18, C x20..26; path columns x=7, 15, 23 (the gate columns)
  for (const xp of [7, 15, 23]) {
    for (let x = xp - 2; x <= xp + 2; x++) for (let z = 27; z <= 33; z++) {
      if (x === xp) continue;
      if (r() < 0.6) ground(x, z, COARSE_DIRT);
    }
    for (let z = 25; z <= 34; z++) ground(xp, z, DIRT_PATH);
  }
  // back-door paths: A's step at (5,1,25) stands on dirt and joins the central path at x=7 along z=26; B's door is
  // on its central path already; C's step at (25,1,25) joins C's central path at x=23 along z=26
  ground(5, 25, DIRT_PATH);
  for (const x of [5, 6]) ground(x, 26, DIRT_PATH);
  ground(25, 25, DIRT_PATH);
  for (const x of [24, 25]) ground(x, 26, DIRT_PATH);

  // garden beds (the two cells either side of each path, z27..33) planted by the gardener helper
  for (const xp of [7, 15, 23]) gardenBed(g, xp, 27, 33);

  // ---- garden walls: x=3, 11, 19, 27 (z25..33) and the back wall z=34 (x3..27) with three gates
  for (const x of [3, 11, 19, 27]) gardenWall(g, x, 25, x, 33, { block: BRICKS });
  gardenWall(g, 3, 34, 27, 34, { block: BRICKS, gates: [[7, 34], [15, 34], [23, 34]], gateFacing: "north" });

  // ---- back doors (spruce, facing out to the garden) and their single step at y=1
  for (const x of [5, 15, 25]) {
    doorFit(g, x, 24, SPRUCE_DOOR, "south");
    g.set(x, 1, 25, STONE_BRICK_STAIRS, { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
  }
}
