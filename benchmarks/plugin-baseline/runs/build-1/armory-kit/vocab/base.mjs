// Shared constants for every part: palette ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// ---- site (plan.md SITE; global kit coordinates, y 0 = the smooth_stone ground) -----------------------------------
/** Full kit footprint in cells: x 0..296, y 0..41, z 0..148. */
export const SITE = { x: 297, y: 42, z: 149 };
/** Per plot: its x/z range (inclusive) and the top y its builds may reach. */
export const PLOTS = {
  armory: { plot: 0, x0: 0, x1: 220, z0: 0, z1: 148, yMax: 41 },
  glasshouse: { plot: 1, x0: 221, x1: 252, z0: 0, z1: 47, yMax: 22 },
  galleries: { plot: 2, x0: 253, x1: 296, z0: 0, z1: 104, yMax: 17 },
};
/** Ground: the smooth_stone layer at y 0, flush with every door threshold. */
export const GROUND_Y = 0;
/** Armory floor lines (ground, then the three upper floors); the flat deck sits on DECK_Y. */
export const FLOOR_YS = [0, 7, 14, 21];
export const DECK_Y = 28;
/** The Armory masses as [x0, z0, x1, z1] (inclusive). A and B and C share the flat roof. */
export const MASSES = {
  A: [0, 4, 107, 35], B: [4, 36, 103, 131], C: [0, 132, 123, 143], C1: [4, 144, 111, 147],
  D: [136, 96, 207, 119], D1: [208, 100, 211, 103], D2a: [208, 112, 219, 119], D2b: [212, 120, 219, 123],
  E1: [104, 120, 199, 123], E2: [104, 124, 171, 127], E3: [108, 128, 123, 131],
  G1a: [257, 12, 296, 91], G1b: [257, 8, 292, 11], G2: [253, 0, 292, 7], G3a: [261, 92, 296, 95], G3b: [269, 96, 296, 103],
  H1: [233, 0, 240, 3], H2: [233, 44, 236, 47],
};
/** The Armory's atrium (open under the deck, no floors) and the two roof light shafts (deck left out). */
export const ATRIUM = { x0: 20, z0: 36, x1: 87, z1: 142, yTop: 27 };
export const MONITORS = [{ x0: 29, z0: 45, x1: 38, z1: 122 }, { x0: 69, z0: 45, x1: 78, z1: 122 }];
/** Glasshouse vault: bay k (0..9) runs z = zAt(k) .. zAt(k)+3 with its axis at cx = cxAt(k); ridge y 20. */
export const VAULT = { bays: 10, ridgeY: 20, zAt: (k) => 4 + 4 * k, cxAt: (k) => 231 + k };
/** Steel truss k (0..11) lies at z = trussZ(k) across the atrium. */
export const trussZ = (k) => 40 + 8 * k;
/** Stair flights (plan.md ROOMS): F1..F3 at x 8..9 (and mirrored x 98..99), z 8..14 and 16..22. */
export const STAIR_X = [[8, 9], [98, 99]];
/** Doorways between the Armory's room boxes (x 12..13 and x 94..95, z 34..35). */
export const ARMORY_DOORWAY_X = [[12, 13], [94, 95]];

// ---- palette (palette.json ids only) --------------------------------------------------------------------------------
export const SMOOTH_SANDSTONE = "smooth_sandstone";
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
export const BROWN_TERRACOTTA = "brown_terracotta";
export const POLISHED_ANDESITE = "polished_andesite";
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";
export const GLASS_PANE = "glass_pane";
export const GLASS = "glass";
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";
export const LIGHT_GRAY_STAINED_GLASS_PANE = "light_gray_stained_glass_pane";
export const SMOOTH_QUARTZ = "smooth_quartz";
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
export const SMOOTH_STONE = "smooth_stone";
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";
export const ANDESITE_WALL = "andesite_wall";
export const CHAIN = "chain";
export const IRON_BARS = "iron_bars";
export const RED_TERRACOTTA = "red_terracotta";
export const RED_CONCRETE = "red_concrete";
export const WHITE_CONCRETE = "white_concrete";
export const POLISHED_BLACKSTONE = "polished_blackstone";
export const SEA_LANTERN = "sea_lantern";
export const LIGHTNING_ROD = "lightning_rod";
export const ORANGE_STAINED_GLASS = "orange_stained_glass";
export const RED_STAINED_GLASS = "red_stained_glass";
export const YELLOW_STAINED_GLASS = "yellow_stained_glass";
export const BLUE_STAINED_GLASS = "blue_stained_glass";
export const SHROOMLIGHT = "shroomlight";
export const END_ROD = "end_rod";
export const GRAY_CONCRETE = "gray_concrete";
export const DEEPSLATE_TILES = "deepslate_tiles";
export const POLISHED_DEEPSLATE = "polished_deepslate";
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
export const BLACK_CONCRETE = "black_concrete";
export const MOSS_BLOCK = "moss_block";
export const GRASS_BLOCK = "grass_block";
export const AZALEA = "azalea";
export const FLOWERING_AZALEA = "flowering_azalea";
export const SHORT_GRASS = "short_grass";
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";
export const DIRT_PATH = "dirt_path";
export const OAK_LOG = "oak_log";
export const OAK_LEAVES = "oak_leaves";
export const BIRCH_LOG = "birch_log";
export const BIRCH_LEAVES = "birch_leaves";
export const OAK_FENCE = "oak_fence";
export const LANTERN = "lantern";
export const GLOWSTONE = "glowstone";
export const BIRCH_DOOR = "birch_door";
export const BIRCH_TRAPDOOR = "birch_trapdoor";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const WHITE_WALL_BANNER = "white_wall_banner";
export const BLACK_WALL_BANNER = "black_wall_banner";
export const WHITE_BANNER = "white_banner";
export const BLACK_BANNER = "black_banner";

// ---- seeded random -----------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving floats in [0, 1), the same sequence for the same seed (mulberry32). */
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
