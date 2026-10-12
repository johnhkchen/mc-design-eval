// Shared constants for the town hall: the palette's block ids, the site's coordinates, and a seeded rng.
// Block ids mirror palette.json (roles and objects); the grid is x 0..40, y 0..43, z 0..36.

// ---- site ---------------------------------------------------------------------------------------------------------
export const SITE_SIZE = [41, 44, 37]; // grid size: x 0..40, y 0..43 (the spire finial), z 0..36
export const GROUND_Y = 0; // the grass top; the ground course is this y
export const WALK_Y = 1; // the y a person stands on outside
export const AXIS_X = 20; // the symmetry line of the plan (x)
export const FRONT_Z = 10; // the main front wall plane, north face (pavilions stand at z 9)
export const REAR_Z = 26; // the main rear wall plane, south face
export const BODY_X0 = 4; // the main body's west edge (x)
export const BODY_X1 = 36; // the main body's east edge (x)
export const PORTICO_Z0 = 6; // the portico's north face (z), where the columns and lettering stand
export const TOWER_X0 = 18; // the clock tower shaft's west edge (x)
export const TOWER_X1 = 22; // the clock tower shaft's east edge (x)
export const TOWER_Z0 = 10; // the clock tower shaft's north edge (z), flush with the front wall
export const TOWER_Z1 = 14; // the clock tower shaft's south edge (z)
export const GROUND_FLOOR_Y = 3; // the ground storey's floor block (walkable 4..9)
export const UPPER_FLOOR_Y = 10; // the upper storey's floor block (walkable 11..15)
export const CEILING_Y = 16; // the top of the main body (cornice course)
export const ROOF_Y = 17; // the first course of the main roof

// ---- palette: structural roles -----------------------------------------------------------------------------------
export const BRICKS = "bricks"; // wall body
export const BRICK_STAIRS = "brick_stairs"; // brick lintels and wall stairs
export const BRICK_SLAB = "brick_slab"; // brick caps
export const QUARTZ_BLOCK = "quartz_block"; // quoins, cornice course and frieze
export const SMOOTH_QUARTZ = "smooth_quartz"; // string course, architrave and tympanum
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // the roof's quartz cornice lip
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // quartz slab courses
export const CHISELED_QUARTZ_BLOCK = "chiseled_quartz_block"; // keystones, column bases and clock frames
export const QUARTZ_PILLAR = "quartz_pillar"; // portico columns (axis y)
export const QUARTZ_STAIRS = "quartz_stairs"; // arches, hoods and cornice lips
export const QUARTZ_SLAB = "quartz_slab"; // window sills and string course caps
export const POLISHED_ANDESITE = "polished_andesite"; // the plinth
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // plinth stairs
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab"; // plinth slabs
export const STONE_BRICKS = "stone_bricks"; // water table, steps and podium
export const STONE_BRICK_STAIRS = "stone_brick_stairs"; // front steps and the water table lip
export const STONE_BRICK_SLAB = "stone_brick_slab"; // chimney caps
export const STONE_BRICK_WALL = "stone_brick_wall"; // flagpole and lamp post bases
export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // step treads
export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // slate roof body
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // slate roof edges
export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab"; // slate roof slabs
export const DEEPSLATE_TILES = "deepslate_tiles"; // slate roof tiles
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // slate roof tile stairs
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // slate roof tile slabs
export const POLISHED_DEEPSLATE = "polished_deepslate"; // slate roof accents
export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs"; // slate roof accent stairs
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab"; // slate roof accent slabs
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks"; // the roof's eave course
export const POLISHED_BLACKSTONE_BRICK_STAIRS = "polished_blackstone_brick_stairs"; // eave stairs
export const POLISHED_BLACKSTONE_BRICK_SLAB = "polished_blackstone_brick_slab"; // eave slabs
export const WEATHERED_CUT_COPPER = "weathered_cut_copper"; // spire, verdigris green
export const WEATHERED_CUT_COPPER_STAIRS = "weathered_cut_copper_stairs"; // spire stairs
export const WEATHERED_CUT_COPPER_SLAB = "weathered_cut_copper_slab"; // spire slabs
export const OXIDIZED_CUT_COPPER = "oxidized_cut_copper"; // spire, the bluer green
export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs"; // spire stairs, oxidized
export const OXIDIZED_CUT_COPPER_SLAB = "oxidized_cut_copper_slab"; // spire slabs, oxidized
export const CUT_COPPER = "cut_copper"; // spire, the raw copper
export const CUT_COPPER_STAIRS = "cut_copper_stairs"; // spire stairs, raw
export const CUT_COPPER_SLAB = "cut_copper_slab"; // spire slabs, raw
export const LIGHTNING_ROD = "lightning_rod"; // the spire finial at x20 z12
export const WHITE_CONCRETE = "white_concrete"; // clock faces
export const BLACK_CONCRETE = "black_concrete"; // clock hands
export const GLASS_PANE = "glass_pane"; // windows, sidelights and the fanlight
export const DARK_OAK_DOOR = "dark_oak_door"; // the main and rear doors
export const DARK_OAK_PLANKS = "dark_oak_planks"; // wood trim and benches
export const DARK_OAK_STAIRS = "dark_oak_stairs"; // benches and chairs
export const DARK_OAK_SLAB = "dark_oak_slab"; // desks and tables
export const DARK_OAK_LOG = "dark_oak_log"; // the bell beam
export const STRIPPED_DARK_OAK_LOG = "stripped_dark_oak_log"; // stripped beams
export const DARK_OAK_FENCE = "dark_oak_fence"; // rails, lamp posts and flagpoles
export const DARK_OAK_FENCE_GATE = "dark_oak_fence_gate"; // the back gate
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor"; // clock works and shelves
export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign"; // signage
export const DEEPSLATE_BRICKS = "deepslate_bricks"; // the chimney band at y21
export const CAMPFIRE = "campfire"; // lit chimney tops and fireboxes
export const OAK_PLANKS = "oak_planks"; // the ground-storey floor
export const SPRUCE_PLANKS = "spruce_planks"; // the council chamber floor
export const RED_CARPET = "red_carpet"; // the runner
export const WHITE_CARPET = "white_carpet"; // rugs
export const BOOKSHELF = "bookshelf"; // bookwalls
export const CHISELED_BOOKSHELF = "chiseled_bookshelf"; // bookwalls, chiseled
export const LECTERN = "lectern"; // the mayor's lectern
export const BARREL = "barrel"; // storage
export const FLOWER_POT = "flower_pot"; // plants
export const RED_WOOL = "red_wool"; // soft red accents
export const BELL = "bell"; // the belfry bell
export const LADDER = "ladder"; // the tower ladder
export const LANTERN = "lantern"; // lamps, door lanterns and the chandeliers
export const IRON_CHAIN = "iron_chain"; // the chandelier chains and the bell hang
export const CANDLE = "candle"; // table light
export const GRASS_BLOCK = "grass_block"; // the lawns and rear garden
export const COARSE_DIRT = "coarse_dirt"; // the patches near the trees
export const DIRT_PATH = "dirt_path"; // paths
export const ANDESITE = "andesite"; // the road
export const GRAVEL = "gravel"; // the kerb and the rear path
export const SMOOTH_STONE = "smooth_stone"; // the sidewalk
export const OAK_LOG = "oak_log"; // the garden trees' trunks
export const OAK_LEAVES = "oak_leaves"; // the garden trees' crowns
export const BLUE_BANNER = "blue_banner"; // the flags on the flagpoles

// ---- rng ----------------------------------------------------------------------------------------------------------
/** A seeded PRNG: rng(seed)() returns a float in [0, 1), the same sequence every run for the same seed. */
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
