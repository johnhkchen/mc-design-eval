// Pike Place north end: the site (plan.md coordinates and the brief's footprint and GROUND maps), the palette as named
// constants (palette.json's ids only), and a seeded rng. Generated from brief.txt and plan.md's PALETTE; edit by hand only
// in step with palette.json.

// The site grid: x 0..117 (Butterworth's pavilion ends at x117), y 0..69 (the Soames roofs and Butterworth stacks), z 0..158.
// Data version 3955 is Minecraft 1.21.1, the server's version.
export const SITE = { size: [118, 70, 159], dataVersion: 3955 };

// Soames-Dunn (plot 0): its box in grid coordinates (= plan.md's plot-local coordinates, x 0..59, z 0..158), top y 69.
export const SOAMES = { x0: 0, x1: 59, z0: 0, z1: 158, top: 69, bay: 9, frontX: 2, frontXC: 6, bXwest: 28 };
// Butterworth (plot 1): its box x 64..117, z 0..157, top y 65; the bays are 6 along z; its east front is x114.
export const BUTTERWORTH = { x0: 64, x1: 117, z0: 0, z1: 157, top: 65, bay: 6, frontX: 114, pavilionX: 116 };

// The footprint rows (brief.txt; char c = x 4c..4c+3 of its plot, row r = z 4r..4r+3; '#' = build here).
const SOAMES_FOOTPRINT = [
 "###....#####...",
 "#############..",
 "##############.",
 "##############.",
 "##############.",
 "#############..",
 "#############..",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "##############.",
 "###########....",
 "###########....",
 "###########....",
 "###########....",
 "###########....",
 ".##########....",
 ".########...##.",
 ".######....####",
 ".######....####",
 ".######....####",
 ".######....####",
 ".######....####",
 ".########..####",
 ".######....####",
 ".######....####",
 ".######.#######",
 ".##############",
 ".##############",
 ".##############",
 ".###########..."
];
// The GROUND rows as the brief prints them: the ground height above y 0 for each cell ('.' = no ground in the map).
const SOAMES_GROUND = [
 " 1  1  2  2  .  .  5  6  7  7  8  9 11  .  .",
 " 1  1  2  3  4  4  5  6  7  8  8  9 11 11  .",
 " 1  1  2  3  4  4  5  6  7  8  8  9 10 11  .",
 " 1  2  2  3  4  5  5  6  7  8  9  9 10 11  .",
 " 1  2  2  3  4  5  5  6  7  8  9 10 10 11  .",
 " 1  2  2  3  4  5  5  6  7  8  9 10 11 11  .",
 " 1  2  2  3  4  5  5  6  7  8  9 10 11 11  .",
 " 1  2  2  3  4  5  5  6  7  8  9 10 10 11  .",
 " 1  2  2  3  4  5  5  6  7  8  9  9 10 11  .",
 " 1  2  2  3  4  4  5  6  7  8  8  9 10 11  .",
 " 1  2  2  3  4  4  5  6  7  7  8  9 10 11  .",
 " 1  2  2  3  4  4  5  6  7  7  8  9 10 11  .",
 " 1  2  2  3  4  4  5  6  6  7  8  9 10 11  .",
 " 1  2  2  3  3  4  5  5  6  7  8  9 10 11  .",
 " 1  2  2  3  3  4  5  5  6  7  8  8  9 11 11",
 " 1  2  2  3  3  4  4  5  6  6  7  8  9 10 11",
 " 1  2  2  3  3  4  4  5  5  6  7  8  9 10 11",
 " 1  2  2  2  3  3  4  4  5  5  6  7  9 11 12",
 " 1  2  2  2  3  3  3  4  4  4  5  6  8 11 12",
 " 1  2  2  2  3  3  3  3  3  3  4  4  6  9 10",
 " 1  2  2  2  2  3  3  3  3  3  2  .  .  .  .",
 " 1  2  2  2  2  2  3  3  3  2  2  .  .  .  .",
 " 1  2  2  2  2  2  2  2  2  2  2  .  .  .  .",
 " 2  2  2  2  2  2  2  2  2  2  2  .  .  .  .",
 " 2  2  2  2  2  2  2  2  2  2  2  .  .  .  .",
 " 2  2  2  2  2  2  3  3  3  3  2  .  .  .  .",
 " 2  2  2  2  2  3  3  3  3  3  3  4  6  9 11",
 " 2  2  2  2  3  3  3  .  .  .  .  5  7  9 11",
 " 2  2  2  2  3  3  3  .  .  .  .  6  8  9 10",
 " 2  2  2  2  3  3  3  .  .  .  .  7  8  9 11",
 " 2  2  2  3  3  3  3  .  .  .  .  7  8 10 11",
 " 2  2  2  3  3  3  3  3  3  .  .  7  8 10 11",
 " 2  2  3  3  3  3  3  3  3  .  .  7  9 10 11",
 " 2  2  3  3  3  3  3  4  3  .  .  8  9 10 11",
 " .  3  3  3  3  4  4  4  .  .  .  8  9 10 11",
 " .  3  3  3  4  4  5  5  6  6  7  8  9 10 10",
 " .  3  3  4  4  4  5  6  6  7  7  8  9 10 11",
 " .  3  3  4  4  5  5  6  6  7  8  8  9 10 11",
 " .  3  3  4  4  5  6  6  7  7  8  9  9 10 10",
 " .  3  3  4  5  5  6  6  7  7  8  9  9 10 10"
];
const BUTTERWORTH_FOOTPRINT = [
 ".....########.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 "#############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 ".############.",
 ".#############",
 ".#############",
 ".#############",
 ".############.",
 "......#......."
];
const BUTTERWORTH_GROUND = [
 " 2  3  4  5  5  6  7  8  8  9 10 11 11  .",
 " 2  3  4  4  5  6  7  7  8  9 10 10 11  .",
 " 2  3  3  4  5  6  6  7  8  9 10 10 11  .",
 " 1  2  3  4  5  5  6  7  8  9 10 10 11  .",
 " 1  2  3  4  4  5  6  7  8  9  9 11 11  .",
 " 1  2  3  3  4  5  6  7  8  8  9 11 11  .",
 " 1  2  2  3  4  5  5  6  7  8  9 11 11  .",
 " 1  1  2  3  3  4  5  6  7  8  9 10 11  .",
 " 1  1  2  2  3  4  5  6  7  8  9 10 10  .",
 " 1  1  1  1  2  3  4  5  6  8  9 10 10  .",
 " 1  1  1  1  1  2  4  5  6  8  9 10 10  .",
 " 1  1  1  1  1  2  4  5  6  7  9 10 10  .",
 " 1  1  1  1  1  2  4  5  6  7  9 10 10  .",
 " 1  1  1  1  1  3  4  5  6  7  9 10 10  .",
 " .  1  1  2  2  3  4  5  6  7  9 10 10  .",
 " .  1  2  2  3  3  4  5  6  7  8 10 10  .",
 " 1  1  2  2  3  4  5  6  7  7  9 10 10  .",
 " 1  1  2  3  3  4  5  6  7  8  9 10 10  .",
 " 1  1  2  3  3  4  5  6  7  8  8 10 10  .",
 " 1  1  2  3  3  4  5  6  7  7  8  9 10  .",
 " 1  1  2  3  4  4  5  6  7  7  8  9  9  .",
 " 1  1  2  3  4  4  5  6  7  7  8  9  9  .",
 " 1  1  2  3  4  4  5  6  7  7  8  9  9  .",
 " 1  1  2  3  4  4  5  6  7  7  8  9  9  .",
 " 1  1  2  3  4  4  5  6  6  7  8  9  9  .",
 " 1  1  2  3  3  4  5  6  6  7  8  9  9  .",
 " 1  1  2  3  3  4  5  6  6  7  8  9  9  .",
 " .  1  2  3  3  4  5  6  6  7  8  8  9  .",
 " .  1  2  3  3  4  5  5  6  7  8  8  9  .",
 " .  1  2  3  3  4  5  5  6  7  7  8  9  .",
 " .  1  2  3  3  4  5  5  6  7  7  8  9  .",
 " .  1  2  3  3  4  5  5  6  7  7  8  9  .",
 " .  1  2  3  3  4  5  5  6  7  7  8  9  .",
 " .  1  2  3  3  4  5  5  6  7  7  8  8  9",
 " .  1  2  3  3  4  5  5  6  6  7  8  8  9",
 " .  1  2  3  3  4  5  5  6  6  7  8  8  8",
 " .  1  2  3  3  4  5  5  6  6  7  8  8  8",
 " .  1  2  3  3  4  5  5  6  6  7  7  8  8",
 " .  2  2  3  4  4  5  5  6  6  7  8  8  8",
 " .  2  2  3  3  4  5  5  6  6  7  7  .  ."
];

const parseGround = (rows) => rows.map((r) => r.trim().split(/\s+/).map((v) => (v === "." ? null : Number(v))));
const GROUND = { soames: parseGround(SOAMES_GROUND), butterworth: parseGround(BUTTERWORTH_GROUND) };
const FOOTPRINT = { soames: SOAMES_FOOTPRINT, butterworth: BUTTERWORTH_FOOTPRINT };

// The plot whose box holds cell (x, z), as { plot, key } with key "soames" or "butterworth", or null.
export function plotAt(x, z) {
  if (x >= SOAMES.x0 && x <= SOAMES.x1 && z >= SOAMES.z0 && z <= SOAMES.z1) return { plot: SOAMES, key: "soames" };
  if (x >= BUTTERWORTH.x0 && x <= BUTTERWORTH.x1 && z >= BUTTERWORTH.z0 && z <= BUTTERWORTH.z1) return { plot: BUTTERWORTH, key: "butterworth" };
  return null;
}
// The GROUND height of cell (x, z): the top ground block's y, or null where the map has no ground.
export function groundAt(x, z) {
  const p = plotAt(x, z);
  if (!p) return null;
  return GROUND[p.key][Math.floor(z / 4)]?.[Math.floor((x - p.plot.x0) / 4)] ?? null;
}
// True when cell (x, z) is on the footprint ('#' in the brief): build only there.
export function onFootprint(x, z) {
  const p = plotAt(x, z);
  if (!p) return false;
  return FOOTPRINT[p.key][Math.floor(z / 4)]?.[Math.floor((x - p.plot.x0) / 4)] === "#";
}

// Seeded random numbers: rng(seed) returns a function giving floats in [0, 1), the same sequence for the same seed.
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

// The palette: palette.json's ids as names (roles, then objects).
// brick
export const BRICKS = "bricks";
export const BRICK_STAIRS = "brick_stairs";
export const BRICK_SLAB = "brick_slab";
export const BRICK_WALL = "brick_wall";
export const RED_NETHER_BRICKS = "red_nether_bricks";

// stone
export const STONE_BRICKS = "stone_bricks";
export const STONE_BRICK_SLAB = "stone_brick_slab";
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
export const STONE_BRICK_WALL = "stone_brick_wall";
export const DEEPSLATE_BRICKS = "deepslate_bricks";

// pale trim
export const SMOOTH_SANDSTONE = "smooth_sandstone";
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
export const CUT_SANDSTONE = "cut_sandstone";
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";

// deck
export const GRAY_CONCRETE = "gray_concrete";

// timber
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";
export const DARK_OAK_PLANKS = "dark_oak_planks";
export const DARK_OAK_SLAB = "dark_oak_slab";
export const DARK_OAK_STAIRS = "dark_oak_stairs";
export const DARK_OAK_DOOR = "dark_oak_door";
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
export const DARK_OAK_FENCE = "dark_oak_fence";

// timber starbucks
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";
export const SPRUCE_PLANKS = "spruce_planks";
export const SPRUCE_DOOR = "spruce_door";
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";

// glass
export const GLASS_PANE = "glass_pane";
export const BROWN_STAINED_GLASS_PANE = "brown_stained_glass_pane";

// signs
export const BROWN_CONCRETE = "brown_concrete";
export const BROWN_TERRACOTTA = "brown_terracotta";
export const BIRCH_PLANKS = "birch_planks";
export const BLUE_CONCRETE = "blue_concrete";
export const GREEN_CONCRETE = "green_concrete";

// banners
export const WHITE_BANNER = "white_banner";
export const BLACK_BANNER = "black_banner";
export const LIGHT_BLUE_BANNER = "light_blue_banner";
export const WHITE_WALL_BANNER = "white_wall_banner";
export const BLACK_WALL_BANNER = "black_wall_banner";
export const LIGHT_BLUE_WALL_BANNER = "light_blue_wall_banner";

// objects: light, planting, stock
export const POTTED_POPPY = "potted_poppy";
export const POTTED_DANDELION = "potted_dandelion";
export const POTTED_AZURE_BLUET = "potted_azure_bluet";
export const FLOWER_POT = "flower_pot";
export const LANTERN = "lantern";
export const CHAIN = "chain";
export const OCHRE_FROGLIGHT = "ochre_froglight";
export const GLOWSTONE = "glowstone";
export const SHROOMLIGHT = "shroomlight";
export const BARREL = "barrel";
export const HAY_BLOCK = "hay_block";
