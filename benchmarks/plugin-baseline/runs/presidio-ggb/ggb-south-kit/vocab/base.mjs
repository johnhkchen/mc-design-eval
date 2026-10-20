// Shared constants for the Golden Gate south kit: palette ids (palette.json only), plan.md site coordinates, seeded rng.
// Two plots in one grid. Plot 1 (the bridge) is at the grid origin; plot 0 (Fort Point) is built in its own frame and
// build.mjs shifts it by PLOT0_ORIGIN. Parts write plan.md's local coordinates; nothing here changes them.

// ---- palette (bare ids as in palette.json; the toolkit adds minecraft:) ------------------------------------------
/** Fort wall body and parapet. */
export const BRICKS = "bricks";
/** Arch heads (placed upside down), buttress risers. */
export const BRICK_STAIRS = "brick_stairs";
/** Embrasure sills, gallery bottom slabs, landward ledges. */
export const BRICK_SLAB = "brick_slab";
/** Parade rail (y 7) on the courtyard side. */
export const BRICK_WALL = "brick_wall";
/** Fort base course, coping, sally port lintel. */
export const POLISHED_GRANITE = "polished_granite";
/** Stair tower cap ring (y 10). */
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";
/** Polished granite stairs (shape variant, unused by the plan's facades). */
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";
/** Dark casemate backs and loophole backs. */
export const BLACK_CONCRETE = "black_concrete";
/** Fort quoins on the stair towers, alternating courses. */
export const STONE_BRICKS = "stone_bricks";
/** Quoin and paving stair variant. */
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
/** Quoin and paving slab variant. */
export const STONE_BRICK_SLAB = "stone_brick_slab";
/** Sally port keystone (x 26, y 4). */
export const CHISELED_STONE_BRICKS = "chiseled_stone_bricks";
/** Plot 0 ground course, the walk, and the sidewalk. */
export const SMOOTH_STONE = "smooth_stone";
/** Ground and sidewalk slab variant. */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
/** Shore rock boulders (mixed with cobblestone). */
export const ANDESITE = "andesite";
/** Shore rock boulders (mixed with andesite). */
export const COBBLESTONE = "cobblestone";
/** Shore rock boulders, sparse. */
export const MOSSY_COBBLESTONE = "mossy_cobblestone";
/** Sparse decor, at most 1 in 10, near ground. */
export const MOSSY_STONE_BRICKS = "mossy_stone_bricks";
/** Lighthouse legs, gallery, cap. */
export const POLISHED_BLACKSTONE = "polished_blackstone";
/** Lighthouse legs and lamp posts. */
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";
/** Lighthouse gallery top (3x3), lamp posts' slab variant. */
export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab";
/** Lighthouse cap ring, rising inward. */
export const POLISHED_BLACKSTONE_STAIRS = "polished_blackstone_stairs";
/** Lighthouse core column (x 3 z 11, y 7..10). */
export const GREEN_TERRACOTTA = "green_terracotta";
/** Lighthouse lantern-room centre. */
export const GLOWSTONE = "glowstone";
/** Lighthouse lantern-room edges. */
export const GLASS_PANE = "glass_pane";
/** Lighthouse lightning rod (y 14). */
export const LIGHTNING_ROD = "lightning_rod";
/** Bridge steel, primary: ribs' body, chords, verticals, curbs. */
export const ORANGE_TERRACOTTA = "orange_terracotta";
/** Bridge steel, secondary: Warren diagonals, cross struts, bents' X bracing. */
export const RED_TERRACOTTA = "red_terracotta";
/** Steel highlight: rib intrados, bent caps, cable, lamp posts. */
export const RED_CONCRETE = "red_concrete";
/** Steel highlight: railing, lamp bases. */
export const ORANGE_CONCRETE = "orange_concrete";
/** Pylons, anchorage, beams, piers (cream concrete). */
export const SMOOTH_SANDSTONE = "smooth_sandstone";
/** Concrete slab variant: exposed ledges and slab steps. */
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
/** Plinths, anchorage base and cornice, abutment top, pylon bands. */
export const CUT_SANDSTONE = "cut_sandstone";
/** Concrete slab variant for cut sandstone. */
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";
/** Road surface. */
export const POLISHED_DEEPSLATE = "polished_deepslate";
/** Road surface on slab steps. */
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";
/** Dashed lane lines (x 12, x 18). */
export const SMOOTH_QUARTZ = "smooth_quartz";
/** Dashed lane lines on slab steps. */
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
/** Centre lane line (x 15). */
export const YELLOW_CONCRETE = "yellow_concrete";
/** Deck floor under the road and sidewalks (Y-1). */
export const GRAY_CONCRETE = "gray_concrete";
/** Lamps, lanterns on pedestals and pier caps, hanging lanterns. */
export const LANTERN = "lantern";

// ---- site (plan.md coordinates; grid = plot 1's frame, plot 0 shifted by PLOT0_ORIGIN) ----------------------------
/** Whole kit grid: x 0..42, y 0..50, z 0..190 (MC 1.21.1). */
export const SITE_SIZE = [43, 51, 191];
/** Grid offset of plot 0 (Fort Point): its footprint is x 0..42, z 17..53 in the grid (the arch's Fort Point box). */
export const PLOT0_ORIGIN = [0, 0, 17];
/** Grid offset of plot 1 (the bridge): none, plot 1 is the grid's own frame. */
export const PLOT1_ORIGIN = [0, 0, 0];
/** Plot 0 local extent (inclusive): Fort Point, y 0 is the ground course. */
export const PLOT0 = { x: [0, 42], y: [0, 16], z: [0, 36] };
/** Plot 1 local extent (inclusive): the bridge, y 0 is the water surface and stays empty. */
export const PLOT1 = { x: [0, 30], y: [1, 50], z: [0, 190] };
/** Water surface: plot 1 builds nothing at this y. */
export const WATER_Y = 0;
/** Bridge centre line (road and lane line x). */
export const CENTRE_X = 15;
/** Cable and rib/truss planes (x). */
export const CABLE_X = [8, 22];
/** Road x (plot 1). */
export const ROAD_X = [11, 19];
/** Deck top steps by z (inclusive): the road, sidewalks and curbs sit at y, railing at y+1, truss at y-4..y-1. */
export const DECK_STEPS = [
  { z: [11, 110], y: 34, slab: false },
  { z: [111, 116], y: 34, slab: false },
  { z: [117, 123], y: 34, slab: true },
  { z: [124, 129], y: 33, slab: false },
  { z: [130, 136], y: 33, slab: true },
  { z: [137, 143], y: 32, slab: false },
  { z: [144, 149], y: 32, slab: true },
  { z: [150, 156], y: 31, slab: false },
  { z: [157, 163], y: 31, slab: true },
  { z: [164, 169], y: 30, slab: false },
  { z: [170, 176], y: 30, slab: true },
  { z: [177, 183], y: 29, slab: false },
  { z: [184, 189], y: 29, slab: true },
  { z: [190, 190], y: 28, slab: false },
];

// ---- seeded random ------------------------------------------------------------------------------------------------
/** rng(seed) -> a function returning floats in [0, 1), the same sequence for the same seed (mulberry32). */
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
