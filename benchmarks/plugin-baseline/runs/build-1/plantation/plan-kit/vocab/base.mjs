// Palette ids (palette.json's ids only), plan.md's site coordinates, and a seeded rng: every part imports from here.

// ---- site -------------------------------------------------------------------------------------------------------
// build.nbt has no negative y, so the grid is plan y 0..32. Plan y -4..-1 (the river bed, water and dock posts) can't be stored.
export const SITE_SIZE = [96, 33, 96]; // grid size build.mjs makes: x 0..95, y 0..32, z 0..95 (plan.md SITE)
export const GROUND_Y = 0; // grass top; the player stands on y1
export const AXIS_X = 47.5; // house symmetry axis: x mirrors as 95 - x
export const FRONT = "north"; // z0 is the county road edge; the house faces north
export const ENTRANCE = [47, 1, 31]; // where the player stands on the gravel before the front steps

// floor levels (plan.md HOUSE)
export const GROUND_FLOOR_Y = 3; // ground floor; the air is y4..9
export const UPPER_FLOOR_Y = 10; // upper floor; the air is y11..16
export const PLATE_Y = 17; // wall plate and gallery ceiling
export const ROOF_Y = 18; // roofs start here

// masses, [x0, y0, z0, x1, y1, z1], inclusive (plan.md SITE)
export const HOUSE_MAIN = [26, 3, 42, 69, 17, 61];
export const REAR_WING = [37, 3, 62, 58, 17, 75];
export const FRONT_GALLERY = [25, 3, 35, 70, 17, 41];
export const PLINTH = [25, 0, 35, 70, 2, 61];
export const REAR_PORCH = [37, 3, 76, 58, 8, 79];
export const DRIVE = [45, 0, 0, 50, 0, 23];
export const FORECOURT = [37, 0, 24, 58, 0, 31];
export const FRONT_STEPS = [45, 1, 32, 50, 3, 34];
export const FORMAL_GARDEN = [4, 0, 36, 22, 1, 60];
export const FOUNTAIN = [10, 0, 45, 16, 3, 51];
export const GREENHOUSE = [4, 0, 64, 21, 9, 75];
export const GAZEBO = [10, 0, 78, 16, 9, 84];
export const CARRIAGE_HOUSE = [76, 0, 40, 91, 10, 53];
export const COTTAGE = [76, 0, 64, 87, 7, 75];
export const DOCK = [44, 0, 84, 51, 0, 92]; // deck only; the posts are below y0

// the four chimney stacks, 2x2 from (x, z); each runs y0..28
export const CHIMNEYS = [[33, 46], [33, 56], [61, 46], [61, 56]];
// the eight live oaks: trunks 2x2 at these x (west 41..42, east 53..54) and z (2..3, 8..9, 14..15, 20..21)
export const ALLEE_TRUNK_X = [41, 53];
export const ALLEE_TRUNK_Z = [2, 8, 14, 20];

// ---- palette ----------------------------------------------------------------------------------------------------
export const WHITE_CONCRETE = "white_concrete"; // wall body: house, wing, cottage
export const QUARTZ_PILLAR = "quartz_pillar"; // columns, corner pilasters, slim porch columns
export const SMOOTH_QUARTZ = "smooth_quartz"; // floors, plate, cornice, sills, steps, fountain
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab"; // sills, balustrade top, mantels
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs"; // steps, grand stair, volutes
export const QUARTZ_STAIRS = "quartz_stairs"; // capital volutes, vault cove, proud caps
export const QUARTZ_SLAB = "quartz_slab"; // quartz trim slab
export const CHISELED_QUARTZ = "chiseled_quartz_block"; // capitals, urn, apex
export const BRICKS = "bricks"; // plinth, chimneys, gate piers, carriage body, greenhouse wall
export const BRICK_STAIRS = "brick_stairs"; // vent flanks, chimney caps, hearth lintels
export const BRICK_SLAB = "brick_slab"; // base caps
export const IRON_BARS = "iron_bars"; // vent grilles
export const DEEPSLATE_BRICKS = "deepslate_bricks"; // chimney band
export const SMOOTH_STONE = "smooth_stone"; // kerbs, hearth floors, carriage floor
export const SMOOTH_STONE_SLAB = "smooth_stone_slab"; // kerb caps, coping
export const STONE_BRICKS = "stone_bricks"; // carriage plinth, entrance hall checker
export const DEEPSLATE_TILES = "deepslate_tiles"; // slate roof
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // slate hip stairs, porch shed roof
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // slate slab courses
export const POLISHED_DEEPSLATE = "polished_deepslate"; // roof detail
export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // roof mix
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log"; // roof trusses
export const DARK_OAK_DOOR = "dark_oak_door"; // front, gallery, garden and service doors
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor"; // shutters (open, flat on the wall)
export const GLASS_PANE = "glass_pane"; // windows, sidelights, transoms
export const GLASS = "glass"; // greenhouse panels
export const DARK_OAK_FENCE = "dark_oak_fence"; // lamp posts, hitching rail, furniture trim
export const DARK_OAK_PLANKS = "dark_oak_planks"; // furniture trim
export const DARK_OAK_SLAB = "dark_oak_slab"; // furniture trim
export const DARK_OAK_STAIRS = "dark_oak_stairs"; // furniture trim
export const BIRCH_FENCE = "birch_fence"; // balustrades, boundary picket line
export const BIRCH_FENCE_GATE = "birch_fence_gate"; // balustrade gates
export const SPRUCE_FENCE = "spruce_fence"; // dock rail
export const SPRUCE_PLANKS = "spruce_planks"; // upper porch floor, dock deck, room floors
export const SPRUCE_SLAB = "spruce_slab"; // dock and porch trim
export const OAK_PLANKS = "oak_planks"; // room floors
export const RED_CARPET = "red_carpet"; // rugs
export const BLUE_CARPET = "blue_carpet"; // rugs
export const WHITE_CARPET = "white_carpet"; // rugs
export const GRASS_BLOCK = "grass_block"; // lawns and the forecourt island
export const GRAVEL = "gravel"; // drive, forecourt oval, garden paths, service lane
export const DIRT_PATH = "dirt_path"; // minor walks
export const PODZOL = "podzol"; // root patches under the oaks
export const COARSE_DIRT = "coarse_dirt"; // root patches under the oaks
export const MOSS_BLOCK = "moss_block"; // root patches under the oaks
export const SAND = "sand"; // river bank
export const FARMLAND = "farmland"; // garden beds
export const HANGING_ROOTS = "hanging_roots"; // under the oaks
export const WATER = "water"; // river, fountain
export const LILY_PAD = "lily_pad"; // river edge
export const DARK_OAK_LOG = "dark_oak_log"; // live oak trunks
export const DARK_OAK_LEAVES = "dark_oak_leaves"; // live oak crowns (persistent)
export const VINE = "vine"; // Spanish moss under the crowns
export const CHERRY_LOG = "cherry_log"; // cherry trunks
export const CHERRY_LEAVES = "cherry_leaves"; // cherry crowns (persistent)
export const OAK_LOG = "oak_log"; // magnolia trunks
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves"; // magnolia crowns
export const FLOWERING_AZALEA = "flowering_azalea"; // lawn ring, forecourt island
export const SPRUCE_LEAVES = "spruce_leaves"; // boxwood hedges (persistent)
export const SPRUCE_LOG = "spruce_log"; // dock posts (axis y)
export const PEONY = "peony"; // parterre flowers
export const ROSE_BUSH = "rose_bush"; // parterre flowers
export const ALLIUM = "allium"; // parterre flowers
export const LILY_OF_THE_VALLEY = "lily_of_the_valley"; // parterre flowers
export const POPPY = "poppy"; // parterre flowers
export const LILAC = "lilac"; // parterre flowers
export const SUNFLOWER = "sunflower"; // parterre flowers
export const LANTERN = "lantern"; // the only light outdoors and in the rooms (hanging: see porchLantern)
export const BARREL = "barrel"; // room storage and fittings
export const CHEST = "chest"; // dressers, fittings
export const SMOKER = "smoker"; // kitchen
export const FURNACE = "furnace"; // kitchen
export const CAMPFIRE = "campfire"; // chimney tops and hearths only, never where walked
export const CAULDRON = "cauldron"; // kitchen sink
export const WATER_CAULDRON = "water_cauldron"; // master bath tub
export const FLOWER_POT = "flower_pot"; // planters, basins
export const DECORATED_POT = "decorated_pot"; // planters
export const CANDLE = "candle"; // candles
export const IRON_CHAIN = "iron_chain"; // porch lanterns, hall chandelier
export const WHITE_BED = "white_bed"; // bedrooms
export const RED_BED = "red_bed"; // bedrooms
export const LECTERN = "lectern"; // library
export const LOOM = "loom"; // service rooms
export const COMPOSTER = "composter"; // kitchen garden
export const ANVIL = "anvil"; // service rooms
export const JUKEBOX = "jukebox"; // living room piano
export const BELL = "bell"; // carriage house
export const LADDER = "ladder"; // carriage loft, dock
export const HAY_BLOCK = "hay_block"; // carriage loft, stacks
export const LIGHTNING_ROD = "lightning_rod"; // cupola weathervane, gazebo finial
export const WHITE_WOOL = "white_wool"; // cushions
export const RED_WOOL = "red_wool"; // cushions
export const BOOKSHELF = "bookshelf"; // library only

// ---- rng ------------------------------------------------------------------------------------------------------
/** A seeded random source (mulberry32): rng(seed)() -> 0..1, the same sequence for the same seed. */
export function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
