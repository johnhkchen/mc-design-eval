// Shared constants for the Taipei 101 parts: palette blocks, site coordinates (plan.md), and a seeded rng.

// ---- palette (palette.json ids only) ----------------------------------------------------------------------------
/** Cyan stained glass: the tower glass body. */
export const CYAN_GLASS = "minecraft:cyan_stained_glass";
/** Light blue stained glass: the glass course under each floor line, pinnacle and observatory body, lit bands. */
export const LIGHT_BLUE_GLASS = "minecraft:light_blue_stained_glass";
/** Light gray concrete: mullions, corner noses, ledge tops, spire middle. */
export const LIGHT_GRAY_CONCRETE = "minecraft:light_gray_concrete";
/** Dark prismarine: floor lines, step courses, base courses. */
export const DARK_PRISMARINE = "minecraft:dark_prismarine";
/** Dark prismarine slab (bottom): pedestal step sills. */
export const DARK_PRISMARINE_SLAB = "minecraft:dark_prismarine_slab";
/** Smooth quartz: fascias, coping, canopy frames, cap steps. */
export const SMOOTH_QUARTZ = "minecraft:smooth_quartz";
/** Smooth quartz slab. */
export const SMOOTH_QUARTZ_SLAB = "minecraft:smooth_quartz_slab";
/** Smooth quartz stairs. */
export const SMOOTH_QUARTZ_STAIRS = "minecraft:smooth_quartz_stairs";
/** Quartz pillar (axis y): canopy and mall columns. */
export const QUARTZ_PILLAR = "minecraft:quartz_pillar";
/** Ochre froglight: warm lit offices, corner light strips. */
export const OCHRE_FROGLIGHT = "minecraft:ochre_froglight";
/** Pearlescent froglight: cool lit offices. */
export const PEARLESCENT_FROGLIGHT = "minecraft:pearlescent_froglight";
/** Sea lantern: lit bands, deck lights, sign letters, aircraft centres. */
export const SEA_LANTERN = "minecraft:sea_lantern";
/** Shroomlight: coin medallion uplights. */
export const SHROOMLIGHT = "minecraft:shroomlight";
/** Iron block: ruyi bodies, spire lower section, cap middle. */
export const IRON_BLOCK = "minecraft:iron_block";
/** Gray concrete: ruyi eyes, mall sign band. */
export const GRAY_CONCRETE = "minecraft:gray_concrete";
/** Iron bars: spire upper section, observatory and deck rails. */
export const IRON_BARS = "minecraft:iron_bars";
/** End rod (facing up): spire tip. */
export const END_ROD = "minecraft:end_rod";
/** Lightning rod (facing up): spire top. */
export const LIGHTNING_ROD = "minecraft:lightning_rod";
/** Red stained glass: aircraft light rings. */
export const RED_STAINED_GLASS = "minecraft:red_stained_glass";
/** Gold block: coin medallion rim and frame. */
export const GOLD_BLOCK = "minecraft:gold_block";
/** Raw gold block: coin medallion field. */
export const RAW_GOLD_BLOCK = "minecraft:raw_gold_block";
/** Yellow terracotta: coin medallion inner ring. */
export const YELLOW_TERRACOTTA = "minecraft:yellow_terracotta";
/** Polished diorite: mall piers. */
export const POLISHED_DIORITE = "minecraft:polished_diorite";
/** Smooth stone: mall spandrels, roof decks, foot floor, ground body. */
export const SMOOTH_STONE = "minecraft:smooth_stone";
/** Smooth stone slab: the entrance ramp's first step. */
export const SMOOTH_STONE_SLAB = "minecraft:smooth_stone_slab";
/** Polished andesite: plinths, paving, ground top. */
export const POLISHED_ANDESITE = "minecraft:polished_andesite";
/** Polished andesite slab. */
export const POLISHED_ANDESITE_SLAB = "minecraft:polished_andesite_slab";
/** Clear glass: mall shopfronts and halls. */
export const GLASS = "minecraft:glass";
/** Glass pane. */
export const GLASS_PANE = "minecraft:glass_pane";
/** Moss block: roof gardens. */
export const MOSS_BLOCK = "minecraft:moss_block";
/** Grass block: roof gardens. */
export const GRASS_BLOCK = "minecraft:grass_block";
/** Oak log (axis y): roof-garden tree trunks. */
export const OAK_LOG = "minecraft:oak_log";
/** Oak leaves (persistent): roof-garden trees, planters. */
export const OAK_LEAVES = "minecraft:oak_leaves";
/** Lantern: standing lamps and hanging garden lights. */
export const LANTERN = "minecraft:lantern";
/** Cobblestone wall: lamp post posts. */
export const COBBLESTONE_WALL = "minecraft:cobblestone_wall";

// ---- site (plan.md; world x = plot-local x + plot origin; world y = plot-local y) --------------------------------
/** Full site size [x, y, z] of the grid: plot 2 reaches x 352, the crown reaches y 175, plot 0 reaches z 205. */
export const SITE = [353, 176, 206];
/** Plot footprints in world coordinates: the lot's x0..x1 and z0..z1, inclusive. */
export const PLOTS = {
  0: { x0: 0, x1: 192, z0: 0, z1: 205 },
  1: { x0: 197, x1: 272, z0: 0, z1: 75 },
  2: { x0: 277, x1: 352, z0: 0, z1: 75 },
};
/** Plot 1 (segment) and plot 2 (crown) world x offset from plot 0's origin. */
export const PLOT_ORIGIN = { 0: [0, 0, 0], 1: [197, 0, 0], 2: [277, 0, 0] };
/** Pedestal footprint at the ground, world x and z (76 square, box-local origin x 96, z 108). */
export const PEDESTAL_BOX = { x0: 96, x1: 171, z0: 108, z1: 183 };
/** Pedestal roof y: the solid flat roof the first segment's foot stands on. */
export const PEDESTAL_ROOF_Y = 157;
/** Pedestal roof footprint in world x/z, 62 square; the segment and crown feet are the same 62 square (box-local 7..68). */
export const FOOT = { x0: 103, x1: 164, z0: 115, z1: 176 };
/** Segment box size: 76 square in plot 1 (box-local 0..75), 46 tall. */
export const SEGMENT_SIZE = 76;
/** Segment top ledge y. */
export const SEGMENT_TOP_Y = 46;
/** Crown top y: the spire's lightning rod. */
export const CROWN_TOP_Y = 175;
/** Mall deck y: base, middle and NW terraces. */
export const MALL_DECK_Y = { base: 35, middle: 46, nw: 68 };
/** Mall north face z (Xinyi Road front) and main entrance x range. */
export const MALL_NORTH_Z = 10;
export const MALL_ENTRANCE_X = { x0: 74, x1: 90 };
/** Medallion uplight row y, in front of each coin medallion's wall. */
export const UPLIGHT_Y = 129;
/** Lit-band rows on the pedestal: y 155..156. */
export const PEDESTAL_LIT_Y = { y0: 155, y1: 156 };

// ---- seeded rng --------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1), the same sequence for the same seed. */
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
