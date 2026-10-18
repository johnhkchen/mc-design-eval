// Palace of Fine Arts: palette ids as named constants (palette.json's ids only), site coordinates, and a seeded rng.
// SITE: full grid size [x, y, z] for the four plots (x 0..111, y 0..70, z 0..63).
export const SITE = [112, 71, 64];
// PLOTS: each module's inclusive x/z box and its top y (plan.md SITE table).
export const PLOTS = {
  rotunda: { x0: 0, x1: 63, z0: 0, z1: 63, yMax: 70 },
  peristyleBay: { x0: 64, x1: 79, z0: 0, z1: 23, yMax: 32 },
  peristyleEnd: { x0: 80, x1: 95, z0: 0, z1: 23, yMax: 32 },
  hall: { x0: 96, x1: 111, z0: 0, z1: 23, yMax: 34 },
};
// ROTUNDA_CENTRE: the rotunda's centre on x and z (dx = x - 31.5, dz = z - 31.5 in plan.md).
export const ROTUNDA_CENTRE = 31.5;
// rng(seed): a seeded random function returning floats in [0, 1); the same seed gives the same sequence.
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

// Ground and paving
export const SMOOTH_STONE = "smooth_stone";
// Wall body, piers, attic, planter boxes, hall wall
export const SMOOTH_SANDSTONE = "smooth_sandstone";
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
// Plinths, base courses, recess backs
export const SANDSTONE = "sandstone";
export const SANDSTONE_STAIRS = "sandstone_stairs";
export const SANDSTONE_SLAB = "sandstone_slab";
export const SANDSTONE_WALL = "sandstone_wall";
// Architraves, archivolts, bands, pilasters, quoins
export const CUT_SANDSTONE = "cut_sandstone";
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";
// Capitals, keystones, tablets, relief panels
export const CHISELED_SANDSTONE = "chiseled_sandstone";
// Rotunda giant column shafts; hall roof
export const GRANITE = "granite";
export const GRANITE_STAIRS = "granite_stairs";
export const GRANITE_SLAB = "granite_slab";
// Dome ribs; floor medallion
export const POLISHED_GRANITE = "polished_granite";
// Peristyle column shafts; statues, relief and weeping figures
export const WHITE_TERRACOTTA = "white_terracotta";
export const CALCITE = "calcite";
// Dome outer shell; coffer backs
export const TERRACOTTA = "terracotta";
export const BROWN_TERRACOTTA = "brown_terracotta";
// Hidden light
export const GLOWSTONE = "glowstone";
export const LANTERN = "lantern";
// Planting and decor
export const OAK_LEAVES = "oak_leaves";
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";
export const VINE = "vine";
export const DIRT = "dirt";
