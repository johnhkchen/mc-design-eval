// Part: Grounds, yard and woodshed (ground patches, logging road and ruts, camp paths, log deck, lumber stacks, stumps,
// standing spruces, woodshed posts and cordwood, lamp posts). Ground first: the patches and roads go down before anything
// stands on them. Footprints (bunkhouse, mill floor, woodshed roof, chimney) are left alone.
import {
  groundPatch, ruts, pathRun, logDeck, lumberStack, stump, spruceTree, leanToPost, cordwood, lampPost,
  COARSE_DIRT, PODZOL, SPRUCE_SLAB, STRIPPED_SPRUCE_LOG,
} from "../vocab.mjs";

// Yard ground reads bare: more coarse dirt and podzol around the mill and the lumber yard.
const YARD_MIX = { coarse_dirt: 4, podzol: 2, rooted_dirt: 2, grass_block: 1, gravel: 1 };
// The lot: mostly grass, with a cut-over clearing's patches of bare earth.
const LOT_MIX = { grass_block: 6, coarse_dirt: 3, podzol: 2, rooted_dirt: 1 };

// The standing spruces at the edges (plan SITE table).
const TREES = [[1, 27], [2, 32], [7, 32], [31, 32], [38, 24], [38, 31]];
// Stumps: [x, z, height]; the stands on podzol.
const STUMPS = [[2, 6, 1], [21, 26, 2], [15, 26, 1], [37, 5, 2], [1, 18, 1], [19, 30, 1], [11, 30, 1]];

export function build(g) {
  // 1. Ground patches over the lot, then the bare yard by the mill.
  groundPatch(g, 0, 0, 39, 33, LOT_MIX, { seed: 3 });
  groundPatch(g, 22, 22, 39, 33, YARD_MIX, { seed: 7 });

  // 2. Logging road: coarse dirt along the north edge, two wheel ruts.
  g.fill([0, 0, 0], [39, 0, 3], COARSE_DIRT);
  ruts(g, 0, 39, 1);
  ruts(g, 0, 39, 2);

  // 3. Skid road: from the road down x=28..30 into the mill's north opening, a dirt path with coarse dirt beside it.
  g.fill([28, 0, 4], [30, 0, 7], COARSE_DIRT);
  pathRun(g, 29, 0, 29, 7, 1);

  // 4. Camp paths: the entrance path to the porch step, the porch-to-mill path, and the back path to the yard.
  pathRun(g, 13, 0, 13, 3, 1);
  pathRun(g, 19, 6, 22, 6, 2);
  pathRun(g, 13, 22, 27, 22, 1);

  // 5. Yard lanes between the three lumber stacks.
  pathRun(g, 27, 21, 27, 30, 2);
  pathRun(g, 32, 21, 32, 30, 2);

  // 6. Log deck feeding the mill, and the three stacks of sawn lumber.
  logDeck(g, 24, 34, 4, 7);
  for (const x0 of [24, 29, 34]) lumberStack(g, x0, 24);
  // Cover boards on the middle stack only (bottom slabs laid on its top course at y=4).
  for (let x = 29; x <= 31; x++) for (let z = 24; z <= 29; z++) g.set(x, 5, z, SPRUCE_SLAB, { type: "bottom", waterlogged: "false" });

  // 7. Stumps on podzol, and the chopping block by the back path.
  for (const [x, z, h] of STUMPS) {
    g.set(x, 0, z, PODZOL);
    stump(g, x, z, h);
  }
  g.set(14, 0, 23, PODZOL);
  stump(g, 14, 23, 1);
  g.set(14, 2, 23, STRIPPED_SPRUCE_LOG, { axis: "y" });

  // 8. Standing spruces at the edges.
  for (const [x, z] of TREES) spruceTree(g, x, z);

  // 9. Woodshed: three lean-to posts and the cordwood stack.
  for (const x of [5, 8, 12]) leanToPost(g, x, 21);
  // The beam at y=3 (z=21) is the Roofs part's (parts/roofs.mjs), not repeated here.
  cordwood(g, 9, 18, 12, 19, 1, 3, "z");

  // 10. Lamp posts: by the road (beside the entrance path, which the plan's cell would block) and at the yard lane.
  lampPost(g, 12, 2, 2);
  lampPost(g, 28, 22, 2);
  // Dark south and west ground (the lit cells of the lamp map): posts clear of the spruces' leaves and the stumps.
  lampPost(g, 5, 27, 2);
  lampPost(g, 13, 31, 2);
  lampPost(g, 22, 31, 2);
  lampPost(g, 34, 31, 2);
  // The road's ends: the west corner by the road and the east road beyond the skid road.
  lampPost(g, 3, 3, 2);
  lampPost(g, 34, 3, 2);
}
