// Shared constants for every part: palette ids (palette.json only), the site, and a seeded rng.
// Import what you need: import { SPRUCE_PLANKS, SITE, rng } from "../vocab/base.mjs";

/** Site footprint and levels: 96 x 19 plan, surface y 0, standing level y 1, build top y 21 (grid y 0..21). */
export const SITE = { W: 96, D: 19, H: 22, SURFACE_Y: 0, STAND_Y: 1, PLOT_W: 12, PLOTS: 8, LANE_Z0: 0, LANE_Z1: 4, FRONT_Z: 0 };

/** Full grid size, passed to new Grid(). */
export const SIZE = [SITE.W, SITE.H, SITE.D];

/** Lantern post x positions on the lane's south edge (z 4); the last is the far end at x 95. */
export const LAMP_POST_XS = [0, 12, 24, 36, 48, 60, 72, 84, 95];

/** x of plot i's left edge (module cut: plot i spans x 12i..12i+11). */
export const plotX0 = (i) => SITE.PLOT_W * i;

/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1). Same seed, same sequence. */
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

// ---- piers and foundation: brick and cobble family --------------------------------------------------------------
/** Brick pier block. */
export const BRICKS = "bricks";
/** Brick stair (pier skirt, step). */
export const BRICK_STAIRS = "brick_stairs";
/** Brick slab. */
export const BRICK_SLAB = "brick_slab";
/** Brick wall (tapered post band). */
export const BRICK_WALL = "brick_wall";
/** Cobblestone (fieldstone plinth, kerbs). */
export const COBBLESTONE = "cobblestone";
/** Mossy cobblestone (about 10% of the plinth). */
export const MOSSY_COBBLESTONE = "mossy_cobblestone";
/** Cobblestone wall. */
export const COBBLESTONE_WALL = "cobblestone_wall";
/** Cobblestone stair. */
export const COBBLESTONE_STAIRS = "cobblestone_stairs";
/** Cobblestone slab. */
export const COBBLESTONE_SLAB = "cobblestone_slab";
/** Stone brick band on piers. */
export const STONE_BRICKS = "stone_bricks";
/** Deepslate brick band on piers. */
export const DEEPSLATE_BRICKS = "deepslate_bricks";

// ---- decks, floors and joinery --------------------------------------------------------------------------------
/** Spruce plank deck and floor. */
export const SPRUCE_PLANKS = "spruce_planks";
/** Spruce stair (steps, bench seats). */
export const SPRUCE_STAIRS = "spruce_stairs";
/** Spruce slab (table tops, ledges). */
export const SPRUCE_SLAB = "spruce_slab";
/** Spruce fence (posts, rails, rafter tails). */
export const SPRUCE_FENCE = "spruce_fence";
/** Spruce trapdoor (shutters, shelves, washboard). */
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
/** Spruce door (both halves). */
export const SPRUCE_DOOR = "spruce_door";
/** Packed mud (smokehouse floor). */
export const PACKED_MUD = "packed_mud";

// ---- walls and trim -------------------------------------------------------------------------------------------
/** Oak log (roof verge, trusses on trim). */
export const OAK_LOG = "oak_log";
/** Stripped oak log (trusses, corner posts). */
export const STRIPPED_OAK_LOG = "stripped_oak_log";
/** Stripped oak wood (all-sided log, trim). */
export const STRIPPED_OAK_WOOD = "stripped_oak_wood";
/** Acacia planks (house 1 field). */
export const ACACIA_PLANKS = "acacia_planks";
/** Acacia fence. */
export const ACACIA_FENCE = "acacia_fence";
/** Acacia door. */
export const ACACIA_DOOR = "acacia_door";
/** Acacia slab. */
export const ACACIA_SLAB = "acacia_slab";
/** White terracotta (house 2 field). */
export const WHITE_TERRACOTTA = "white_terracotta";
/** Smooth quartz (house 2 trim, verge, sills). */
export const SMOOTH_QUARTZ = "smooth_quartz";
/** Smooth quartz slab. */
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
/** Quartz stair (fascia, verge). */
export const QUARTZ_STAIRS = "quartz_stairs";
/** Pale oak door. */
export const PALE_OAK_DOOR = "pale_oak_door";
/** Pale oak fence. */
export const PALE_OAK_FENCE = "pale_oak_fence";
/** Stripped pale oak log (house 2 trim, tapered posts, verge). */
export const STRIPPED_PALE_OAK_LOG = "stripped_pale_oak_log";
/** Pale oak planks (house 3 gable). */
export const PALE_OAK_PLANKS = "pale_oak_planks";
/** Stripped dark oak log (house 3 trim). */
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log";
/** Dark oak fence (house 3). */
export const DARK_OAK_FENCE = "dark_oak_fence";
/** Mangrove planks (house 4 field). */
export const MANGROVE_PLANKS = "mangrove_planks";
/** Mangrove door (house 1 and 3 accents). */
export const MANGROVE_DOOR = "mangrove_door";
/** Stripped spruce log (house 5 trim). */
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";
/** Blackstone (smokehouse walls and roof). */
export const BLACKSTONE = "blackstone";
/** Bricks (house 7 field). */
export const BRICKS_WALL = "bricks";

// ---- shutters ---------------------------------------------------------------------------------------------------
/** Mangrove trapdoor (shutters, houses 1 and 3). */
export const MANGROVE_TRAPDOOR = "mangrove_trapdoor";
/** Warped trapdoor (shutters, house 2). */
export const WARPED_TRAPDOOR = "warped_trapdoor";

// ---- roofs ------------------------------------------------------------------------------------------------------
/** Exposed cut copper (weathered brown tin roof). */
export const EXPOSED_CUT_COPPER = "exposed_cut_copper";
/** Exposed cut copper stair (roof edge). */
export const EXPOSED_CUT_COPPER_STAIRS = "exposed_cut_copper_stairs";
/** Exposed cut copper slab (roof edge, ridge). */
export const EXPOSED_CUT_COPPER_SLAB = "exposed_cut_copper_slab";
/** Stone (galvanized tin roof, house 1). */
export const STONE = "stone";
/** Stone slab (house 1 ridge). */
export const STONE_SLAB = "stone_slab";
/** Deepslate tile stair (house 2 roof). */
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
/** Deepslate tile slab (house 2 roof). */
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
/** Polished granite stair (pyramid roof). */
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";
/** Polished granite slab (pyramid roof). */
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";
/** Tuff brick stair (boarding house roof). */
export const TUFF_BRICK_STAIRS = "tuff_brick_stairs";
/** Tuff brick slab (boarding house roof). */
export const TUFF_BRICK_SLAB = "tuff_brick_slab";
/** Polished tuff (boarding house eave). */
export const POLISHED_TUFF = "polished_tuff";
/** Blackstone stair (smokehouse roof). */
export const BLACKSTONE_STAIRS = "blackstone_stairs";
/** Blackstone slab (smokehouse roof). */
export const BLACKSTONE_SLAB = "blackstone_slab";
/** Oxidized cut copper (bungalow roof). */
export const OXIDIZED_CUT_COPPER = "oxidized_cut_copper";
/** Oxidized cut copper stair (bungalow roof). */
export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs";
/** Oxidized cut copper slab (bungalow roof). */
export const OXIDIZED_CUT_COPPER_SLAB = "oxidized_cut_copper_slab";
/** Weathered cut copper (bungalow roof mix). */
export const WEATHERED_CUT_COPPER = "weathered_cut_copper";
/** Weathered cut copper stair (bungalow roof mix). */
export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs";
/** Weathered cut copper slab (bungalow roof mix). */
export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab";

// ---- glass ------------------------------------------------------------------------------------------------------
/** Glass pane (all windows). */
export const GLASS_PANE = "glass_pane";

// ---- plants and ground -----------------------------------------------------------------------------------------
/** Jungle log (pecan tree trunks and limbs). */
export const JUNGLE_LOG = "jungle_log";
/** Jungle leaves (pecan crowns, persistent). */
export const JUNGLE_LEAVES = "jungle_leaves";
/** Oak leaves (crown fill, persistent). */
export const OAK_LEAVES = "oak_leaves";
/** Azalea (shrubs). */
export const AZALEA = "azalea";
/** Cornflower (bee yard). */
export const CORNFLOWER = "cornflower";
/** Oxeye daisy (bee yard). */
export const OXEYE_DAISY = "oxeye_daisy";
/** Dandelion (bee yard, gardens). */
export const DANDELION = "dandelion";
/** Azure bluet (bee yard, gardens). */
export const AZURE_BLUET = "azure_bluet";
/** Grass block (surface y 0). */
export const GRASS_BLOCK = "grass_block";
/** Coarse dirt (surface patches, lane edges). */
export const COARSE_DIRT = "coarse_dirt";
/** Podzol (under trees, by the smokehouse). */
export const PODZOL = "podzol";
/** Rooted dirt (under trees, by the smokehouse). */
export const ROOTED_DIRT = "rooted_dirt";
/** Dirt path (lane ruts, gate paths). */
export const DIRT_PATH = "dirt_path";
/** Gravel (lane centre). */
export const GRAVEL = "gravel";

// ---- fire, functional and furnishing objects -------------------------------------------------------------------
/** Furnace (lit: stove and hearth nooks). */
export const FURNACE = "furnace";
/** Smoker (lit: smokehouse, kitchen smoker). */
export const SMOKER = "smoker";
/** Campfire (lit, sunk: kettle, chimney fires). */
export const CAMPFIRE = "campfire";
/** Hay block (chimney signal fire base). */
export const HAY_BLOCK = "hay_block";
/** Cauldron (empty). */
export const CAULDRON = "cauldron";
/** Water cauldron (rain barrel, kettle water). */
export const WATER_CAULDRON = "water_cauldron";
/** Barrel (storage, rinse tubs, hams). */
export const BARREL = "barrel";
/** Iron chain (ham racks, hanging lanterns). */
export const IRON_CHAIN = "iron_chain";
/** Lantern (standing and hanging light). */
export const LANTERN = "lantern";
/** Beehive (bee yard). */
export const BEEHIVE = "beehive";
/** Bee nest (under the NE crown). */
export const BEE_NEST = "bee_nest";

// ---- beds (colour per house) -----------------------------------------------------------------------------------
/** Red bed (house 0). */
export const RED_BED = "red_bed";
/** Blue bed (house 1). */
export const BLUE_BED = "blue_bed";
/** White bed (house 2). */
export const WHITE_BED = "white_bed";
/** Green bed (house 3). */
export const GREEN_BED = "green_bed";
/** Brown bed (house 4). */
export const BROWN_BED = "brown_bed";
/** Yellow bed (house 7). */
export const YELLOW_BED = "yellow_bed";
