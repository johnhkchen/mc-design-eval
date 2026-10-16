// Part 7: Grounds and yards. The surface patches (coarse dirt, podzol, rooted dirt, gravel apron), the lane,
// lamp posts, plot fences and gates with their dirt paths, the back yards of plots 0, 2 and 4, the work yard (5),
// the orchard and bee yard (6) and the bungalow walk (7). Ground writes only replace grass that is still there,
// so an earlier part's block is never touched; everything above the surface goes into air through the helpers.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  SITE, LAMP_POST_XS, COARSE_DIRT, PODZOL, ROOTED_DIRT, DIRT_PATH, GRAVEL, BRICKS, AZALEA,
  BARREL, WATER_CAULDRON, BEE_NEST, CORNFLOWER, OXEYE_DAISY, DANDELION, AZURE_BLUET, STRIPPED_OAK_LOG, OAK_LOG,
  BRICK_WALL, rng, lane_strip, lamp_post, fence_run, table_set, woodpile, kettle, picnic_table,
  swing, pecan_tree, beehive_row, hanging_lantern,
} from "../vocab.mjs";

// Plot fence woods: the palette has no oak_fence or jungle_fence, so plots 0, 5 and 6 take palette woods.
const FENCE = ["spruce", "acacia", "pale_oak", "dark_oak", "spruce", "dark_oak", "acacia", "spruce"];

// Writes into air only; a cell holding a block is left alone.
const put = (g, x, y, z, block, state) => {
  if (!g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
};

// Writes at the surface row (y 0) only where the grass is still there; this part owns the surface outside the lane.
const ground = (g, x, z, block) => {
  if (!/grass_block$/.test(g.blockAt(x, 0, z))) return;
  g.set(x, 0, z, block);
};

/** Surface: grass patched with coarse dirt, podzol and rooted dirt under the trees, a gravel apron at the smokehouse. */
function surface(g) {
  const r = rng(7);
  for (let x = 0; x < SITE.W; x++) {
    for (let z = 5; z < SITE.D; z++) {
      const plot = Math.floor(x / 12);
      // Plot 5 is packed coarse dirt, the rest a quarter coarse dirt.
      if (plot === 5 || r() < 0.25) ground(g, x, z, COARSE_DIRT);
    }
  }
  // Orchard crowns: podzol, with rooted dirt round each trunk foot.
  const crowns = [[72, 6, 77, 10], [79, 7, 83, 11], [72, 13, 77, 17]];
  for (const [x0, z0, x1, z1] of crowns) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) if (r() < 0.6) ground(g, x, z, PODZOL);
  }
  for (const [tx, tz] of [[74, 8], [81, 9], [74, 15]]) {
    ground(g, tx, tz, ROOTED_DIRT);
    ground(g, tx + 1, tz, ROOTED_DIRT);
  }
  // Smokehouse: podzol and rooted dirt behind it (z 17..18), gravel apron in front (z 10..11).
  for (let x = 60; x <= 66; x++) {
    for (let z = 17; z <= 18; z++) ground(g, x, z, r() < 0.3 ? ROOTED_DIRT : PODZOL);
    for (let z = 10; z <= 11; z++) ground(g, x, z, GRAVEL);
  }
}

/** Gate paths: dirt through each plot's front gap to the lane, the orchard's central path and open side columns. */
function paths(g) {
  for (let i = 0; i < SITE.PLOTS; i++) {
    const gx = 12 * i + 5;
    if (i === 7) continue; // the bungalow walk is brick, below
    for (const x of [gx, gx + 1]) ground(g, x, 5, DIRT_PATH);
  }
  for (let z = 6; z <= 15; z++) for (const x of [77, 78]) ground(g, x, z, DIRT_PATH);
  for (let z = 5; z <= 18; z++) for (const x of [72, 83]) ground(g, x, z, DIRT_PATH);
}

/** Lane, lamp posts, and every plot's fence run with its gate. */
function lanesAndFences(g) {
  lane_strip(g, 0, SITE.W - 1);
  for (const x of LAMP_POST_XS) lamp_post(g, x, 1, 4);
  for (let i = 0; i < SITE.PLOTS; i++) {
    fence_run(g, i, FENCE[i], 12 * i + 5, { sides: i !== 6 });
  }
  // Plot 7's picket is brick, not wood: the bungalow's front walk stays open at 89..90.
  for (const x of [85, 86, 87, 88, 91, 92, 93, 94]) g.set(x, 1, 5, BRICK_WALL);
  for (const x of [89, 90]) g.set(x, 0, 5, BRICKS);
  g.set(89, 0, 6, BRICKS);
  g.set(90, 0, 6, BRICKS);
}

/** Plot 0 back yard: a woodblock and its stump in the yard behind the east pen. */
function backYard0(g) {
  g.set(8, 1, 17, STRIPPED_OAK_LOG, { axis: "y" });
  g.set(9, 1, 17, OAK_LOG, { axis: "y" });
}

/** Plot 2 back yard: a bench, a wash bench with barrels, the stoop at x 29 left clear. */
function backYard2(g) {
  put(g, 26, 1, 17, BARREL, { facing: "up" });
  for (const x of [27, 28]) g.set(x, 1, 17, ...B.stairs("spruce", "south"));
  put(g, 30, 1, 17, BARREL, { facing: "up" });
  table_set(g, 31, 1, 17, 2);
  put(g, 33, 1, 17, BARREL, { facing: "up" });
}

/** Plot 4 back yard: a wash bench and a rain barrel; the step out of the back door (x 56, z 17) stays clear. */
function backYard4(g) {
  table_set(g, 51, 1, 17, 2);
  put(g, 54, 1, 17, WATER_CAULDRON, { level: "3" });
}

/** Plot 5 work yard: bench, kettle and rinse tubs with the washboard, woodpile, chopping block. */
function workYard(g) {
  for (const x of [61, 62]) g.set(x, 1, 9, ...B.stairs("spruce", "south"));
  kettle(g, 68, 9);
  put(g, 69, 1, 9, BARREL, { facing: "up" });
  put(g, 70, 1, 9, BARREL, { facing: "up" });
  g.set(70, 2, 9, ...B.trapdoor("spruce", "north", "bottom", false));
  woodpile(g, [67, 1, 14, 70, 4, 17]);
  g.set(66, 1, 11, STRIPPED_OAK_LOG, { axis: "y" });
}

/** Plot 6 orchard and bee yard: bee nest first (it sits in the NE crown), then the trees, swing, table and hives. */
function orchard(g) {
  put(g, 82, 5, 9, BEE_NEST, { facing: "north" });
  pecan_tree(g, [81, 1, 9], 6, [79, 5, 7, 83, 10, 11]);
  pecan_tree(g, [74, 1, 8], 6, [72, 5, 6, 77, 10, 10]);
  // The swing's branch goes in before the SW crown so the crown leaves stop short of it.
  swing(g, 76, 2, 15);
  pecan_tree(g, [74, 1, 15], 7, [72, 6, 13, 77, 11, 17]);
  picnic_table(g, 77, 11, 3, 1);
  beehive_row(g, 79, 82, 17, { y: 1, facing: "north" });
  const row15 = [CORNFLOWER, OXEYE_DAISY, DANDELION, AZURE_BLUET];
  const row16 = [DANDELION, AZURE_BLUET, CORNFLOWER, OXEYE_DAISY];
  row15.forEach((b, k) => put(g, 79 + k, 1, 15, b));
  row16.forEach((b, k) => put(g, 79 + k, 1, 16, b));
  for (const [x, z] of [[72, 5], [83, 5], [72, 18], [83, 18]]) put(g, x, 1, z, AZALEA);
}

/** Plot 7 bungalow: shrubs either side of the front walk. */
function bungalow(g) {
  put(g, 86, 1, 6, AZALEA);
  put(g, 93, 1, 6, AZALEA);
}

/** Yard light for the dark cells of the standing level: a lamp post in plot 0's back corner (x1 z17), and a lantern
 *  hung from the swing branch over the path and the bee yard (75,5,15 under the log at y6). */
function yardLight(g) {
  lamp_post(g, 1, 1, 17);
  hanging_lantern(g, 75, 5, 15);
}

export function build(g) {
  surface(g);
  paths(g);
  lanesAndFences(g);
  backYard0(g);
  backYard2(g);
  backYard4(g);
  workYard(g);
  orchard(g);
  bungalow(g);
  yardLight(g);
}
