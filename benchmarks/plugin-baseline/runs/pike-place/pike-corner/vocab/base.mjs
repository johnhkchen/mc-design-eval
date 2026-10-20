// Shared constants for the Pike Place build: palette ids (palette.json only), site coordinates, ground lookup, seeded rng.
import { readFileSync } from "node:fs";

// ---- palette (every id is in palette.json; the role is the comment) ---------------------------------------------------
export const BRICKS = "bricks"; // brick body
export const BRICK_STAIRS = "brick_stairs"; // brick body
export const BRICK_SLAB = "brick_slab"; // brick body
export const SMOOTH_SANDSTONE = "smooth_sandstone"; // cream trim
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs"; // cream trim
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab"; // cream trim
export const SMOOTH_QUARTZ = "smooth_quartz"; // white frames
export const QUARTZ_BLOCK = "quartz_block"; // white frames
export const QUARTZ_STAIRS = "quartz_stairs"; // white frames
export const QUARTZ_SLAB = "quartz_slab"; // white frames
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // white frames
export const STONE_BRICKS = "stone_bricks"; // plinth and deck
export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // plinth and deck
export const STONE_BRICK_SLAB = "stone_brick_slab"; // plinth and deck
export const GLASS = "glass"; // glass
export const RED_WOOL = "red_wool"; // awnings
export const WHITE_WOOL = "white_wool"; // awnings
export const GREEN_WOOL = "green_wool"; // awnings
export const SPRUCE_PLANKS = "spruce_planks"; // shop fittings
export const SPRUCE_STAIRS = "spruce_stairs"; // shop fittings
export const SPRUCE_SLAB = "spruce_slab"; // shop fittings
export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab"; // fire escape
export const POLISHED_BLACKSTONE_STAIRS = "polished_blackstone_stairs"; // fire escape
export const LANTERN = "lantern"; // light
export const SHROOMLIGHT = "shroomlight"; // light
export const GLOWSTONE = "glowstone"; // light
export const CHAIN = "chain"; // light
export const CANDLE = "candle"; // light
export const MELON = "melon"; // produce
export const PUMPKIN = "pumpkin"; // produce
export const HAY_BLOCK = "hay_block"; // produce
export const BARREL = "barrel"; // produce
export const COMPOSTER = "composter"; // produce
export const ORANGE_WOOL = "orange_wool"; // produce
export const YELLOW_WOOL = "yellow_wool"; // produce
export const WHITE_CONCRETE = "white_concrete"; // skylight and vents
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete"; // skylight and vents
export const RED_BANNER = "red_banner"; // banners
export const GREEN_BANNER = "green_banner"; // banners
export const WHITE_BANNER = "white_banner"; // banners
export const DEEPSLATE_BRICKS = "deepslate_bricks"; // chimney band
export const WHITE_TERRACOTTA = "white_terracotta"; // frame detail
export const GRANITE = "granite"; // objects and other
export const BRICK_WALL = "brick_wall"; // objects and other
export const CUT_SANDSTONE = "cut_sandstone"; // objects and other
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab"; // objects and other
export const CHISELED_SANDSTONE = "chiseled_sandstone"; // objects and other
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks"; // objects and other
export const CRACKED_STONE_BRICKS = "cracked_stone_bricks"; // objects and other
export const STONE_BRICK_WALL = "stone_brick_wall"; // objects and other
export const POLISHED_ANDESITE = "polished_andesite"; // objects and other
export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // objects and other
export const GLASS_PANE = "glass_pane"; // objects and other
export const WHITE_STAINED_GLASS_PANE = "white_stained_glass_pane"; // objects and other
export const RED_CARPET = "red_carpet"; // objects and other
export const WHITE_CARPET = "white_carpet"; // objects and other
export const GREEN_CARPET = "green_carpet"; // objects and other
export const SPRUCE_FENCE = "spruce_fence"; // objects and other
export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // objects and other
export const SPRUCE_DOOR = "spruce_door"; // objects and other
export const SPRUCE_WALL_SIGN = "spruce_wall_sign"; // objects and other
export const SPRUCE_HANGING_SIGN = "spruce_hanging_sign"; // objects and other
export const SPRUCE_LOG = "spruce_log"; // objects and other
export const IRON_BARS = "iron_bars"; // objects and other
export const IRON_TRAPDOOR = "iron_trapdoor"; // objects and other
export const LADDER = "ladder"; // objects and other
export const FLOWER_POT = "flower_pot"; // objects and other
export const DIRT = "dirt"; // objects and other
export const POTTED_FERN = "potted_fern"; // objects and other
export const POTTED_RED_TULIP = "potted_red_tulip"; // objects and other
export const POTTED_AZALEA_BUSH = "potted_azalea_bush"; // objects and other
export const OAK_LEAVES = "oak_leaves"; // objects and other
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves"; // objects and other

// ---- site (module coordinates, inclusive; each plot starts at its own y 0) ----------------------------------------------
/** Full module size: the grid is x 0..252, y 0..84, z 0..154. */
export const SITE = { x: 253, y: 85, z: 155 };
/** Plot 0: Economy Market (street face east, +x). */
export const ECONOMY = { x0: 0, x1: 57, z0: 0, z1: 101, maxY: 84 };
/** Plot 1: Corner Market (street face west, -x; Pike Street south). */
export const CORNER = { x0: 62, x1: 123, z0: 0, z1: 101, maxY: 62 };
/** Plot 2: Sanitary Market (street face west, -x, ~64 long). */
export const SANITARY = { x0: 128, x1: 206, z0: 0, z1: 154, maxY: 53 };
/** Plot 3: Garden Center Building (shopfronts west, Post Alley north). */
export const GARDEN = { x0: 211, x1: 252, z0: 0, z1: 31, maxY: 33 };

const PLOTS = [ECONOMY, CORNER, SANITARY, GARDEN];
const SITE_MAPS = JSON.parse(readFileSync(new URL("../site.json", import.meta.url), "utf8")).plots;

/** Ground height above the plot's y 0 at (x, z), from the footprint maps; null off the footprint. */
export function groundAt(x, z) {
  for (let i = 0; i < PLOTS.length; i++) {
    const P = PLOTS[i], M = SITE_MAPS[i];
    if (x < P.x0 || x > P.x1 || z < P.z0 || z > P.z1) continue;
    const col = Math.floor((x - M.x0) / M.cell), row = Math.floor((z - P.z0) / M.cell);
    if (M.footprint[row]?.[col] !== "#") return null;
    return M.ground[row][col];
  }
  return null;
}

/** True when (x, z) is a footprint cell (# on the map): mass and wall cells must be on it. */
export const onFootprint = (x, z) => groundAt(x, z) !== null;

/** A seeded random source: rng(seed)() gives numbers in [0, 1), the same sequence for the same seed. */
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
