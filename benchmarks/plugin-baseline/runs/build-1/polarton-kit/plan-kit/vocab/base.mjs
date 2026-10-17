// Shared constants for the Polarton row: palette block ids (palette.json only), the site's coordinates, and a seeded rng.
// Plan y 0 is the surface and the grid starts there: the subsurface (y -2..-1) is not in the grid.

/** Grid size x 0..95, y 0..26, z 0..18 (y 0 = surface), and the data version of 26.3. */
export const SITE = { size: [96, 27, 19], dataVersion: 5023 };
/** Plan y levels: surface y0; standing level outdoors y1; raised floor block y1 (stand y2); upper floor block y6 (stand y7). */
export const LEVEL = { surface: 0, stand: 1, raisedFloor: 1, raisedStand: 2, upperFloor: 6, upperStand: 7 };
/** The lane across the whole row: x 0..95, z 0..4. */
export const LANE = { x0: 0, x1: 95, z0: 0, z1: 4 };
/** Plot i's pad: x 12i..12i+11, z 5..18; its fence ring and gate (x 12i+5..6, z 5) sit on that pad. */
export function plot(i) { return { i, x0: 12 * i, x1: 12 * i + 11, z0: 5, z1: 18, gateX: [12 * i + 5, 12 * i + 6] }; }
/** Seeded PRNG (mulberry32): rng(seed)() gives the next float in [0, 1). */
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

// Ground and lane
export const GRASS_BLOCK = "minecraft:grass_block";
export const COARSE_DIRT = "minecraft:coarse_dirt";
export const PODZOL = "minecraft:podzol";
export const ROOTED_DIRT = "minecraft:rooted_dirt";
export const GRAVEL = "minecraft:gravel";

// Plot ring and lanterns
export const SPRUCE_FENCE = "minecraft:spruce_fence";
export const SPRUCE_FENCE_GATE = "minecraft:spruce_fence_gate";
export const LANTERN = "minecraft:lantern";

// Gin
export const BIRCH_PLANKS = "minecraft:birch_planks";
export const STRIPPED_SPRUCE_LOG = "minecraft:stripped_spruce_log";
export const STRIPPED_SPRUCE_WOOD = "minecraft:stripped_spruce_wood";
export const COBBLESTONE = "minecraft:cobblestone";
export const DEEPSLATE_TILES = "minecraft:deepslate_tiles";
export const DEEPSLATE_TILE_STAIRS = "minecraft:deepslate_tile_stairs";
export const DEEPSLATE_TILE_SLAB = "minecraft:deepslate_tile_slab";
export const SPRUCE_TRAPDOOR = "minecraft:spruce_trapdoor";
export const IRON_CHAIN = "minecraft:iron_chain";
export const HAY_BLOCK = "minecraft:hay_block";
export const BARREL = "minecraft:barrel";
export const LADDER = "minecraft:ladder";

// Schoolhouse, and the church's stone and trim
export const WHITE_CONCRETE = "minecraft:white_concrete";
export const STONE_BRICKS = "minecraft:stone_bricks";
export const ANDESITE = "minecraft:andesite";
export const CALCITE = "minecraft:calcite";
export const MANGROVE_DOOR = "minecraft:mangrove_door";
export const STONE_BRICK_SLAB = "minecraft:stone_brick_slab";
export const ANDESITE_STAIRS = "minecraft:andesite_stairs";
export const ANDESITE_SLAB = "minecraft:andesite_slab";
export const PALE_OAK_FENCE = "minecraft:pale_oak_fence";
export const PALE_OAK_FENCE_GATE = "minecraft:pale_oak_fence_gate";
export const BELL = "minecraft:bell";
export const LIGHTNING_ROD = "minecraft:lightning_rod";
export const CARTOGRAPHY_TABLE = "minecraft:cartography_table";
export const GLASS_PANE = "minecraft:glass_pane";

// Farmhouse
export const SPRUCE_PLANKS = "minecraft:spruce_planks";
export const MANGROVE_PLANKS = "minecraft:mangrove_planks";
export const MANGROVE_STAIRS = "minecraft:mangrove_stairs";
export const MANGROVE_SLAB = "minecraft:mangrove_slab";
export const MANGROVE_TRAPDOOR = "minecraft:mangrove_trapdoor";
export const DARK_OAK_DOOR = "minecraft:dark_oak_door";
export const SPRUCE_STAIRS = "minecraft:spruce_stairs";
export const CAMPFIRE = "minecraft:campfire";
export const FURNACE = "minecraft:furnace";

// Smithy
export const DARK_OAK_PLANKS = "minecraft:dark_oak_planks";
export const BRICKS = "minecraft:bricks";
export const DEEPSLATE_BRICKS = "minecraft:deepslate_bricks";
export const ANVIL = "minecraft:anvil";
export const SMITHING_TABLE = "minecraft:smithing_table";
export const WATER_CAULDRON = "minecraft:water_cauldron";
export const COAL_BLOCK = "minecraft:coal_block";
export const IRON_BARS = "minecraft:iron_bars";

// Church
export const POLISHED_ANDESITE = "minecraft:polished_andesite";
export const POLISHED_ANDESITE_SLAB = "minecraft:polished_andesite_slab";
export const SPRUCE_DOOR = "minecraft:spruce_door";
export const LECTERN = "minecraft:lectern";

// Tobacco barn
export const STRIPPED_DARK_OAK_LOG = "minecraft:stripped_dark_oak_log";
export const WAXED_EXPOSED_CUT_COPPER = "minecraft:waxed_exposed_cut_copper";
export const WAXED_EXPOSED_CUT_COPPER_STAIRS = "minecraft:waxed_exposed_cut_copper_stairs";
export const WAXED_EXPOSED_CUT_COPPER_SLAB = "minecraft:waxed_exposed_cut_copper_slab";

// Corn crib and granary
export const OAK_PLANKS = "minecraft:oak_planks";
export const STRIPPED_OAK_LOG = "minecraft:stripped_oak_log";
export const BAMBOO_FENCE = "minecraft:bamboo_fence";
export const BAMBOO_PLANKS = "minecraft:bamboo_planks";
export const BAMBOO_STAIRS = "minecraft:bamboo_stairs";
export const BAMBOO_SLAB = "minecraft:bamboo_slab";
export const OAK_TRAPDOOR = "minecraft:oak_trapdoor";
export const OAK_DOOR = "minecraft:oak_door";
export const SPRUCE_SLAB = "minecraft:spruce_slab";
export const COMPOSTER = "minecraft:composter";
export const STONE_PRESSURE_PLATE = "minecraft:stone_pressure_plate";

// Owner's house
export const WAXED_OXIDIZED_CUT_COPPER = "minecraft:waxed_oxidized_cut_copper";
export const WAXED_OXIDIZED_CUT_COPPER_STAIRS = "minecraft:waxed_oxidized_cut_copper_stairs";
export const WAXED_OXIDIZED_CUT_COPPER_SLAB = "minecraft:waxed_oxidized_cut_copper_slab";
export const PALE_OAK_LOG = "minecraft:pale_oak_log";
export const PALE_OAK_STAIRS = "minecraft:pale_oak_stairs";
export const PALE_OAK_TRAPDOOR = "minecraft:pale_oak_trapdoor";
export const SMOOTH_STONE_SLAB = "minecraft:smooth_stone_slab";

// Hearths
export const BRICK_STAIRS = "minecraft:brick_stairs";

// Interior furnishings
export const CANDLE = "minecraft:candle";
export const RED_BED = "minecraft:red_bed";
export const WHITE_BED = "minecraft:white_bed";
export const BLUE_BED = "minecraft:blue_bed";
