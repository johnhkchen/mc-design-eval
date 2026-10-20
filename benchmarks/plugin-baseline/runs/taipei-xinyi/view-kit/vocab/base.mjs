// Shared constants for the six-giant-rocks build: palette ids, plan site coordinates, a seeded rng. Places no blocks.
// Palette: block ids from palette.json, one constant each (the role it first sits in is in the comment)
export const GRASS_BLOCK = "grass_block"; // ground
export const COARSE_DIRT = "coarse_dirt"; // ground
export const MOSS_BLOCK = "moss_block"; // ground
export const ROOTED_DIRT = "rooted_dirt"; // ground
export const PODZOL = "podzol"; // ground
export const STONE = "stone"; // ground
export const ANDESITE = "andesite"; // ground
export const DIRT = "dirt"; // ground
export const SMOOTH_SANDSTONE = "smooth_sandstone"; // rock
export const SANDSTONE = "sandstone"; // rock
export const ORANGE_TERRACOTTA = "orange_terracotta"; // rock
export const TERRACOTTA = "terracotta"; // rock
export const BROWN_TERRACOTTA = "brown_terracotta"; // rock
export const TUFF = "tuff"; // rock
export const MOSS_CARPET = "moss_carpet"; // rock
export const SPRUCE_PLANKS = "spruce_planks"; // deck
export const DARK_OAK_SLAB = "dark_oak_slab"; // deck
export const DARK_OAK_PLANKS = "dark_oak_planks"; // deck
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log"; // deck
export const DARK_OAK_LOG = "dark_oak_log"; // deck
export const DARK_OAK_STAIRS = "dark_oak_stairs"; // deck
export const SPRUCE_FENCE = "spruce_fence"; // deck
export const DARK_OAK_FENCE = "dark_oak_fence"; // deck
export const STONE_BRICKS = "stone_bricks"; // deck
export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // trail
export const STONE_BRICK_SLAB = "stone_brick_slab"; // trail
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks"; // trail
export const MOSSY_STONE_BRICK_STAIRS = "mossy_stone_brick_stairs"; // trail
export const MOSSY_STONE_BRICK_SLAB = "mossy_stone_brick_slab"; // trail
export const SPRUCE_STAIRS = "spruce_stairs"; // bench
export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // bench
export const SPRUCE_SIGN = "spruce_sign"; // sign
export const LANTERN = "lantern"; // light
export const AZALEA = "azalea"; // plants
export const FLOWERING_AZALEA = "flowering_azalea"; // plants
export const FERN = "fern"; // plants
export const LARGE_FERN = "large_fern"; // plants
export const SHORT_GRASS = "short_grass"; // plants
export const OAK_LOG = "oak_log"; // plants
export const JUNGLE_LOG = "jungle_log"; // plants
export const OAK_LEAVES = "oak_leaves"; // plants
export const JUNGLE_LEAVES = "jungle_leaves"; // plants
export const AZALEA_LEAVES = "azalea_leaves"; // plants
export const SPRUCE_SLAB = "spruce_slab"; // object

// Site (plan.md SITE). Coordinates are plot-local; boxes are inclusive
/** Grid size [x, y, z]: x 0..105, y 0..74 (nothing at y 75 or above), z 0..100 */
export const PLOT = [106, 75, 101];
/** Highest block y anywhere in the build */
export const HEIGHT_CAP = 74;
/** GROUND cell width: cell (column c, row r) covers x 3c..3c+2, z 3r..3r+2 (column 35 and row 33 clipped to the plot) */
export const GROUND_STEP = 3;
/** GROUND[r][c]: y of the top ground block in that cell, rows = z, columns = x. Centres (3c+1, 3r+1) keep their value */
export const GROUND = [
  [17, 17, 18, 18, 19, 19, 18, 18, 16, 15, 14, 14, 13, 13, 12, 12, 11, 10, 10, 9, 9, 8, 8, 7, 6, 6, 5, 5, 4, 4, 3, 3, 3, 2, 1, 1],
  [18, 18, 19, 19, 20, 20, 19, 18, 17, 16, 16, 15, 15, 14, 14, 13, 12, 12, 11, 11, 11, 10, 9, 9, 8, 8, 7, 6, 6, 6, 5, 5, 4, 3, 3, 2],
  [19, 19, 20, 20, 21, 20, 20, 19, 18, 18, 17, 16, 16, 16, 15, 14, 14, 14, 13, 12, 12, 11, 11, 10, 10, 9, 9, 8, 7, 7, 7, 6, 6, 5, 4, 3],
  [20, 21, 21, 22, 22, 22, 21, 20, 20, 19, 19, 18, 17, 17, 17, 16, 16, 15, 15, 14, 14, 13, 12, 12, 11, 11, 10, 10, 9, 9, 8, 8, 7, 6, 5, 5],
  [21, 22, 22, 23, 23, 23, 22, 22, 21, 21, 20, 19, 19, 19, 18, 18, 17, 17, 16, 16, 15, 14, 14, 13, 13, 12, 11, 11, 11, 10, 10, 9, 8, 7, 6, 6],
  [22, 23, 23, 24, 25, 24, 23, 23, 22, 22, 21, 21, 20, 20, 20, 19, 19, 19, 18, 18, 17, 16, 15, 15, 14, 14, 13, 12, 12, 12, 11, 10, 9, 8, 7, 7],
  [23, 24, 24, 25, 25, 25, 24, 24, 24, 23, 23, 23, 22, 22, 22, 21, 21, 20, 20, 19, 18, 18, 17, 16, 16, 15, 14, 14, 14, 13, 13, 12, 10, 9, 9, 8],
  [24, 25, 26, 26, 26, 26, 25, 25, 25, 25, 25, 24, 24, 24, 24, 23, 23, 23, 22, 21, 20, 19, 18, 18, 18, 17, 16, 16, 16, 15, 14, 13, 13, 11, 10, 10],
  [24, 25, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 26, 25, 25, 25, 25, 24, 24, 23, 22, 22, 21, 20, 19, 19, 18, 18, 18, 18, 17, 16, 15, 14, 13, 12],
  [25, 25, 26, 26, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 27, 26, 26, 26, 25, 24, 24, 23, 22, 22, 21, 21, 20, 20, 20, 20, 19, 18, 17, 16, 15],
  [25, 25, 26, 27, 28, 28, 28, 28, 29, 29, 28, 28, 28, 28, 28, 28, 28, 28, 28, 27, 27, 26, 26, 25, 24, 24, 24, 23, 23, 23, 22, 22, 21, 20, 19, 18],
  [25, 26, 27, 28, 29, 29, 29, 29, 30, 30, 29, 29, 30, 30, 30, 30, 30, 30, 30, 29, 29, 29, 29, 28, 27, 27, 26, 26, 25, 25, 25, 24, 23, 22, 22, 21],
  [26, 27, 28, 29, 30, 30, 30, 30, 30, 30, 30, 30, 31, 31, 31, 31, 32, 32, 32, 31, 31, 31, 31, 30, 29, 29, 28, 28, 28, 28, 27, 27, 26, 25, 25, 24],
  [27, 28, 29, 30, 30, 31, 31, 31, 31, 31, 31, 32, 32, 33, 33, 33, 33, 33, 33, 33, 33, 33, 32, 32, 31, 31, 31, 31, 31, 30, 30, 29, 29, 28, 27, 27],
  [28, 28, 29, 31, 32, 32, 32, 33, 33, 33, 33, 33, 33, 34, 34, 35, 35, 35, 35, 35, 35, 35, 34, 34, 33, 33, 33, 33, 33, 33, 33, 32, 31, 30, 30, 29],
  [28, 29, 30, 32, 33, 35, 35, 35, 35, 34, 34, 34, 35, 35, 36, 36, 37, 37, 36, 36, 36, 36, 35, 35, 35, 35, 35, 35, 35, 35, 35, 34, 34, 33, 33, 32],
  [29, 30, 31, 33, 36, 38, 39, 39, 39, 38, 36, 36, 36, 37, 37, 38, 38, 38, 38, 37, 37, 37, 37, 37, 37, 37, 36, 37, 37, 37, 37, 37, 37, 36, 35, 34],
  [29, 30, 32, 33, 36, 39, 40, 41, 41, 40, 37, 37, 38, 38, 39, 39, 40, 40, 40, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 39, 40, 39, 39, 38, 38, 37],
  [30, 31, 32, 33, 36, 38, 40, 41, 41, 40, 38, 38, 39, 40, 40, 41, 41, 41, 41, 41, 41, 41, 41, 41, 41, 40, 40, 40, 41, 42, 42, 42, 41, 41, 40, 40],
  [31, 31, 32, 34, 35, 36, 39, 40, 41, 41, 39, 40, 40, 41, 42, 42, 43, 43, 43, 43, 43, 43, 43, 43, 43, 42, 42, 43, 43, 44, 44, 44, 44, 43, 43, 42],
  [32, 32, 33, 34, 35, 37, 39, 41, 43, 43, 41, 41, 42, 42, 43, 44, 44, 45, 45, 45, 45, 45, 45, 45, 45, 45, 44, 45, 45, 46, 47, 47, 47, 46, 46, 45],
  [32, 33, 33, 35, 36, 38, 40, 42, 44, 44, 43, 43, 43, 44, 45, 45, 46, 47, 47, 47, 46, 47, 47, 47, 47, 47, 47, 47, 48, 49, 49, 50, 49, 49, 48, 48],
  [33, 33, 34, 36, 37, 39, 40, 43, 44, 44, 44, 44, 45, 46, 46, 47, 48, 48, 48, 48, 48, 48, 48, 48, 49, 49, 48, 49, 50, 51, 52, 52, 52, 51, 51, 50],
  [33, 33, 34, 36, 37, 39, 40, 42, 44, 44, 44, 44, 45, 46, 47, 47, 48, 49, 49, 49, 49, 49, 49, 49, 50, 50, 50, 50, 51, 52, 52, 53, 53, 53, 52, 51],
  [32, 33, 33, 35, 37, 38, 39, 40, 42, 42, 43, 44, 45, 46, 47, 47, 48, 49, 49, 50, 50, 50, 50, 51, 51, 51, 51, 52, 52, 53, 54, 54, 54, 54, 53, 53],
  [32, 32, 33, 34, 36, 36, 38, 39, 40, 40, 41, 43, 44, 45, 46, 47, 48, 49, 50, 50, 50, 51, 51, 52, 52, 53, 53, 53, 54, 55, 56, 56, 55, 55, 55, 55],
  [32, 32, 32, 33, 35, 36, 37, 39, 39, 40, 41, 42, 44, 45, 46, 47, 48, 50, 50, 51, 51, 51, 52, 53, 53, 54, 55, 55, 56, 57, 57, 57, 57, 56, 56, 56],
  [31, 31, 31, 32, 34, 35, 37, 38, 38, 39, 40, 42, 43, 44, 46, 47, 48, 49, 50, 51, 51, 52, 53, 53, 54, 55, 56, 57, 57, 58, 59, 58, 58, 58, 57, 57],
  [29, 30, 31, 32, 33, 35, 36, 37, 38, 38, 40, 41, 42, 44, 45, 47, 48, 49, 50, 51, 52, 53, 53, 54, 55, 56, 57, 58, 59, 59, 60, 60, 60, 59, 59, 59],
  [28, 30, 32, 32, 33, 34, 35, 36, 37, 38, 40, 41, 42, 44, 46, 47, 48, 50, 51, 51, 52, 53, 54, 54, 55, 56, 57, 58, 59, 60, 60, 60, 60, 60, 60, 60],
  [28, 31, 32, 32, 32, 33, 35, 35, 37, 38, 39, 41, 42, 44, 46, 47, 48, 50, 51, 51, 52, 53, 54, 55, 55, 56, 57, 58, 59, 60, 61, 61, 61, 61, 61, 61],
  [28, 30, 32, 31, 31, 33, 34, 35, 37, 38, 39, 41, 42, 44, 46, 47, 48, 50, 51, 52, 53, 54, 54, 55, 56, 57, 58, 58, 60, 60, 61, 62, 62, 62, 62, 62],
  [26, 29, 30, 30, 31, 32, 34, 35, 37, 38, 39, 41, 42, 44, 45, 47, 49, 50, 51, 52, 53, 54, 54, 55, 56, 57, 58, 59, 60, 61, 62, 63, 63, 63, 63, 63],
  [26, 28, 29, 30, 30, 32, 34, 36, 37, 38, 39, 40, 42, 43, 45, 47, 49, 50, 51, 52, 53, 54, 55, 55, 57, 57, 58, 59, 60, 62, 63, 63, 63, 63, 63, 63],
];
/** Rock boxes R1..R6: boulders sit in these; gaps between them stay air */
export const ROCKS = {
  R1: { x0: 34, x1: 47, y0: 35, y1: 52, z0: 46, z1: 58 },
  R2: { x0: 49, x1: 59, y0: 37, y1: 50, z0: 47, z1: 57 },
  R3: { x0: 62, x1: 75, y0: 35, y1: 53, z0: 46, z1: 59 },
  R4: { x0: 38, x1: 50, y0: 43, y1: 56, z0: 60, z1: 71 },
  R5: { x0: 53, x1: 64, y0: 45, y1: 61, z0: 61, z1: 70 },
  R6: { x0: 66, x1: 76, y0: 46, y1: 56, z0: 62, z1: 71 },
};
/** Viewing deck: joists at y 36, deck top y 37, walking level y 38; footprint x 42..66, z 30..45 */
export const DECK = { x0: 42, x1: 66, z0: 30, z1: 45, joistY: 36, topY: 37, walkY: 38 };
/** The deck's stepped prow footprint: west block, middle step, east step */
export const PRONGS = [
  { x0: 42, x1: 56, z0: 30, z1: 45 },
  { x0: 57, x1: 62, z0: 34, z1: 45 },
  { x0: 63, x1: 66, z0: 38, z1: 45 },
];
/** Two spruce benches at y 38 facing north: x0..x1 at row z */
export const BENCHES = [
  { x0: 49, x1: 51, z: 44 },
  { x0: 58, x1: 60, z: 44 },
];
/** Trail sign base cell; the sign stands at ground + 1 to +2 */
export const SIGN = { x: 69, z: 41 };
/** The 13 lantern post base cells [x, z], beside the trail or at the deck corners */
export const LANTERN_POSTS = [
  [42, 30], [56, 30], [66, 38], [42, 45], [66, 45],
  [69, 10], [69, 20], [69, 30],
  [79, 52], [79, 64], [86, 82], [94, 96],
  [61, 58],
];
/** Hanging lanterns [x, y, z] under the deck's north fascia */
export const HANG_LANTERNS = [[46, 35, 30], [52, 35, 30]];
/** Trees T1..T3: trunk cell [x, z], crown envelope box (inclusive; trunk from ground + 1) and ground y */
export const TREES = {
  T1: { trunk: [98, 44], box: { x0: 94, x1: 102, y0: 32, y1: 44, z0: 40, z1: 48 }, ground: 31 },
  T2: { trunk: [88, 93], box: { x0: 84, x1: 92, y0: 61, y1: 71, z0: 89, z1: 97 }, ground: 60 },
  T3: { trunk: [20, 95], box: { x0: 16, x1: 24, y0: 35, y1: 46, z0: 91, z1: 99 }, ground: 34 },
};
/** The view corridor (nothing above ground + 2 here except the deck to y 39 and the rocks) */
export const VIEW_CORRIDOR = { x0: 0, x1: 80, z0: 0, z1: 70 };
/** Reserved trail boxes (ground parts leave them to the trail part): lower, upper east, upper south, cleft spur */
export const TRAIL = {
  lower: { x0: 67, x1: 68, z0: 0, z1: 45 },
  upperEast: { x0: 67, x1: 79, z0: 42, z1: 43 },
  upperSouth: { x0: 78, x1: 79, z0: 44, z1: 74 },
  spur: { x0: 60, x1: 61, z0: 45, z1: 59 },
};

/**
 * True if the column (x, z) is reserved trail: the TRAIL boxes, or the 2-wide diagonal from (78, 74) to (96..97, 100).
 * @param {number} x
 * @param {number} z
 * @returns {boolean}
 */
export function onTrail(x, z) {
  const inBox = (b) => x >= b.x0 && x <= b.x1 && z >= b.z0 && z <= b.z1;
  if (Object.values(TRAIL).some(inBox)) return true;
  if (z < 74 || z > 100) return false;
  const c = 78 + Math.round((18 * (z - 74)) / 26);
  return x === c || x === c + 1;
}

/**
 * Seeded random numbers (mulberry32): rng(seed)() returns a float in [0, 1), the same sequence for the same seed.
 * @param {number} seed
 * @returns {() => number}
 */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
