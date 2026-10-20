// Shared constants for the Presidio kit: palette block ids (all in palette.json), site coordinates from plan.md, rng.

// ---- site (plan.md SITE, storey grid) ----------------------------------------------------------------------------
/** Grid size: x 0..93 (eight plots in a row), y 0..11 (belfry cap is the highest block, y10), z 0..23. */
export const SITE = { size: [94, 12, 24] };
/** Ground course y: smooth stone over each plot box; street level, every door threshold at y1. */
export const GROUND_Y = 0;
/** Floor course y of every house (flush string course). */
export const FLOOR_Y = 3;
/** Upper storey air is y4..5; roofs start at y6 (ROOF_Y). */
export const UPPER_Y = 4;
export const ROOF_Y = 6;
/** Plot boxes, inclusive x0..x1 and z0..z1 (the ground course lies over each whole box); cap = height limit y. */
export const PLOTS = [
  { name: "family house", x0: 0, z0: 0, x1: 7, z1: 7, cap: 8 },
  { name: "duplex", x0: 8, z0: 0, x1: 17, z1: 9, cap: 8 },
  { name: "garage", x0: 18, z0: 0, x1: 23, z1: 5, cap: 5 },
  { name: "shed", x0: 24, z0: 0, x1: 27, z1: 3, cap: 4 },
  { name: "barracks", x0: 28, z0: 0, x1: 43, z1: 13, cap: 9 },
  { name: "hall", x0: 44, z0: 0, x1: 63, z1: 19, cap: 10 },
  { name: "officers' house", x0: 64, z0: 0, x1: 75, z1: 11, cap: 8 },
  { name: "coastal battery", x0: 76, z0: 0, x1: 93, z1: 23, cap: 5 },
];

// ---- palette: block ids, the same names as palette.json (plan.md PALETTE and MATERIALS) ----------------------------
export const SMOOTH_STONE = "smooth_stone"; // ground course
export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // battery banquette
export const WHITE_CONCRETE = "white_concrete"; // white wood walls: plots 0, 2, 3, 6; dormer walls
export const SMOOTH_QUARTZ = "smooth_quartz"; // white trim, corner boards, string courses, verges
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // trim variant
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // trim variant, sills
export const QUARTZ_PILLAR = "quartz_pillar"; // corner boards, porch and colonnade columns (axis y)
export const SMOOTH_SANDSTONE = "smooth_sandstone"; // cream stucco: plots 1, 5; belfry
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs"; // stucco stairs; arch heads; Mission coping
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab"; // stucco slab; parapet coping; belfry cap
export const TERRACOTTA = "terracotta"; // stucco accent band, door surrounds, battery rust
export const BRICKS = "bricks"; // brick body (plot 4), chimneys
export const BRICK_STAIRS = "brick_stairs"; // brick variant
export const BRICK_SLAB = "brick_slab"; // chimney cap
export const DEEPSLATE_BRICKS = "deepslate_bricks"; // chimney band one course below the top
export const POLISHED_ANDESITE = "polished_andesite"; // grey plinth; battery deck; magazine frames
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // plinth/deck variant
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // plinth/deck variant
export const GRANITE = "granite"; // red tile roofs (plots 1, 5)
export const POLISHED_GRANITE = "polished_granite"; // red tile; hall nave floor
export const GRANITE_STAIRS = "granite_stairs"; // clay-tile hand roofs; door hoods; aisle lean-tos
export const GRANITE_SLAB = "granite_slab"; // clay-tile hand roof, arcade
export const DEEPSLATE_TILES = "deepslate_tiles"; // shed and grey roofs; dormer tops
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // shed roof ring; porch step
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // shed roof top; dormer top; gallery roof
export const SPRUCE_PLANKS = "spruce_planks"; // porch and gallery floors (plots 0, 4)
export const DARK_OAK_PLANKS = "dark_oak_planks"; // house floors (plot 6)
export const MANGROVE_PLANKS = "mangrove_planks"; // barn-red roof field (plot 0)
export const DARK_OAK_STAIRS = "dark_oak_stairs"; // barn-red roof courses, eave and ridge (plot 0)
export const DARK_OAK_SLAB = "dark_oak_slab"; // barn-red roof soffit and top slabs (plot 0)
export const BIRCH_FENCE = "birch_fence"; // porch and gallery rails, post fences
export const IRON_BARS = "iron_bars"; // battery deck rail; lamp posts
export const WARPED_TRAPDOOR = "warped_trapdoor"; // dark green shutters
export const GLASS_PANE = "glass_pane"; // every window
export const ORANGE_STAINED_GLASS_PANE = "orange_stained_glass_pane"; // hall rose window
export const BIRCH_DOOR = "birch_door"; // plot 0 and plot 2 doors
export const DARK_OAK_DOOR = "dark_oak_door"; // plot 1 and plot 5 and plot 6 doors
export const SPRUCE_DOOR = "spruce_door"; // plot 3 and plot 4 doors
export const IRON_DOOR = "iron_door"; // magazine doors
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete"; // battery body courses y2..3
export const ANDESITE = "andesite"; // battery weathered foot course
export const CRACKED_STONE_BRICKS = "cracked_stone_bricks"; // battery weathered foot, 1 in 8
export const GRASS_BLOCK = "grass_block"; // battery glacis and side mound tops
export const COARSE_DIRT = "coarse_dirt"; // glacis speckle, 1 in 6
export const DIRT = "dirt"; // earth fill under the glacis and mounds
export const IRON_BLOCK = "iron_block"; // gun pit mounting rings
export const POLISHED_BLACKSTONE = "polished_blackstone"; // gun pit pivots
export const CAMPFIRE = "campfire"; // lit chimney fire (hay_block under it)
export const HAY_BLOCK = "hay_block"; // under each chimney campfire
export const BELL = "bell"; // belfry, two bells
export const LANTERN = "lantern"; // room, door and lamp-post lights

// ---- randomness ---------------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving floats in [0, 1) (mulberry32): the same seed always gives the same sequence. */
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
