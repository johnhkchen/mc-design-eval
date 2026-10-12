// Shared constants for every part: palette ids (exactly palette.json's), plan.md's site coordinates (all inclusive), rng.

// ---- palette: building roles -----------------------------------------------------------------------------------------
export const DEEPSLATE_BRICKS = "deepslate_bricks"; // ground-storey walls, chimney band
export const DEEPSLATE_BRICK_STAIRS = "deepslate_brick_stairs"; // masonry stairs
export const DEEPSLATE_BRICK_SLAB = "deepslate_brick_slab"; // masonry slab, roof ridge cap
export const DEEPSLATE_BRICK_WALL = "deepslate_brick_wall"; // planter walls
export const POLISHED_DEEPSLATE = "polished_deepslate"; // plinth course at the foot of the masonry
export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs"; // plinth stairs
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab"; // plinth slab
export const COBBLED_DEEPSLATE = "cobbled_deepslate"; // wing walls, oven plinth, kerb, front step, roof
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // front step
export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab"; // step ends, kerb slab
export const COBBLED_DEEPSLATE_WALL = "cobbled_deepslate_wall"; // wall variant of the rough stone
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log"; // frame posts (axis y)
export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood"; // beams, sills, plates, rails, lintels (axis x or z)
export const SPRUCE_STAIRS = "spruce_stairs"; // Mann braces, jetty brackets, bench, steps, verge stairs
export const WHITE_WOOL = "white_wool"; // daub infill panels (and the gable infill)
export const DEEPSLATE_TILES = "deepslate_tiles"; // slate roof covering
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs"; // slate roof stairs made by the roof tool
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab"; // slate roof slab made by the roof tool
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks"; // roof eave course
export const SPRUCE_PLANKS = "spruce_planks"; // floors (main, upper, attic), verges
export const SPRUCE_SLAB = "spruce_slab"; // counters, flower boxes, lids, verge slabs
export const BRICKS = "bricks"; // bread oven body, vault, chimney
export const BRICK_STAIRS = "brick_stairs"; // oven vault edges
export const BRICK_SLAB = "brick_slab"; // oven vault top, chimney cap
export const BRICK_WALL = "brick_wall"; // brick wall variant
export const GLASS_PANE = "glass_pane"; // all glazing
export const SPRUCE_DOOR = "spruce_door"; // front, back, wing side doors
export const SPRUCE_TRAPDOOR = "spruce_trapdoor"; // shutters, vent flap, open hatches
export const SPRUCE_FENCE = "spruce_fence"; // yard fence, sign arm, table legs, railings
export const SPRUCE_FENCE_GATE = "spruce_fence_gate"; // yard gates
export const SPRUCE_HANGING_SIGN = "spruce_hanging_sign"; // Bäckerei sign
export const SPRUCE_WALL_SIGN = "spruce_wall_sign"; // wall sign
export const IRON_CHAIN = "iron_chain"; // hoist chain (axis y)
export const GRAVEL = "gravel"; // street lane
export const COBBLESTONE = "cobblestone"; // sidewalk
export const MOSSY_COBBLESTONE = "mossy_cobblestone"; // sidewalk flecks
export const GRASS_BLOCK = "grass_block"; // ground
export const PODZOL = "podzol"; // yard patches
export const COARSE_DIRT = "coarse_dirt"; // yard patches, wheat border
export const DIRT_PATH = "dirt_path"; // paths to the back and wing doors
export const FARMLAND = "farmland"; // wheat patch soil (moisture 7)
export const WHEAT = "wheat"; // wheat patch (age 4..7)
export const SPRUCE_LOG = "spruce_log"; // woodpile, small spruce trunks
export const SPRUCE_LEAVES = "spruce_leaves"; // small spruce crowns (persistent)

// ---- palette: lights, flowers, objects (functional and soft furnishing) ----------------------------------------------
export const LANTERN = "lantern"; // hanging lights (hanging: true)
export const CAMPFIRE = "campfire"; // oven fire (19,2,24) and chimney top (19,17,24), lit
export const CANDLE = "candle"; // candles
export const WHITE_CANDLE = "white_candle"; // candles
export const POTTED_RED_TULIP = "potted_red_tulip"; // flower boxes
export const POTTED_POPPY = "potted_poppy"; // flower boxes
export const FLOWER_POT = "flower_pot"; // flower pot with an item
export const SMOKER = "smoker"; // beside the oven mouth (18,2,21)
export const BLAST_FURNACE = "blast_furnace"; // bakery equipment
export const FURNACE = "furnace"; // tile stove front (Stube)
export const BARREL = "barrel"; // flour barrels, hoisted sack
export const HAY_BLOCK = "hay_block"; // flour sacks
export const COMPOSTER = "composter"; // yard prop
export const GRINDSTONE = "grindstone"; // yard prop, peel wall
export const CAULDRON = "cauldron"; // kneading trough
export const WATER_CAULDRON = "water_cauldron"; // kneading trough, filled
export const LOOM = "loom"; // soft furnishing
export const CHEST = "chest"; // bedroom chest at the foot of the bed
export const LECTERN = "lectern"; // Stube recipe stand
export const CRAFTING_TABLE = "crafting_table"; // work table end
export const BOOKSHELF = "bookshelf"; // Stube shelf
export const CHISELED_BOOKSHELF = "chiseled_bookshelf"; // Stube shelf top row
export const DECORATED_POT = "decorated_pot"; // decoration
export const CAKE = "cake"; // bread racks and shop display
export const CANDLE_CAKE = "candle_cake"; // shop display
export const LADDER = "ladder"; // attic ladder (facing north)
export const WHITE_BED = "white_bed"; // soft furnishing
export const RED_BED = "red_bed"; // bedroom bed (head to the wall)
export const WHITE_CARPET = "white_carpet"; // flour cloth strip
export const RED_CARPET = "red_carpet"; // rugs and the red accent
export const BROWN_CARPET = "brown_carpet"; // rugs
export const RED_WOOL = "red_wool"; // soft furnishing
export const BROWN_WOOL = "brown_wool"; // soft furnishing

// ---- site ----------------------------------------------------------------------------------------------------------------
export const SITE_SIZE = [24, 25, 32]; // the grid: lot x 0..23, height y 0..24, lot z 0..31
export const LOT = { x0: 0, x1: 23, z0: 0, z1: 31 }; // the lot's footprint, inclusive
export const GROUND_Y = 0; // ground block (street, kerb and sidewalk also sit here)
export const WALK_Y = 1; // outdoor walking surface; interior floors are y=1 (player walks at y=2)
export const STREET_Z = [0, 2]; // gravel lane
export const KERB_Z = 3; // cobbled kerb
export const SIDEWALK_Z = [4, 7]; // cobblestone sidewalk
export const FRONT_STEP = { x: 11, y: 1, z: 8 }; // the low step faces the street
export const MAIN = { x0: 6, x1: 16, z0: 9, z1: 22, groundY: [1, 5], upperY: [6, 10], jettyZ: 8 }; // main body; upper storey jetties to z=8
export const WING = { x0: 17, x1: 21, z0: 13, z1: 22, y: [1, 5], gableY: [6, 7] }; // bakehouse wing; gable end to the street at z=13
export const OVEN = { x0: 17, x1: 21, z0: 23, z1: 26, plinthY: 1 }; // bread oven footprint, projecting south of the wing
export const OVEN_CHAMBER = { x0: 18, x1: 20, y0: 2, y1: 3, z0: 23, z1: 25 }; // the oven's air chamber (inside the oven)
export const OVEN_MOUTH = { x0: 19, x1: 19, y0: 2, y1: 3, z: 22 }; // opening from the wing into the oven
export const CHIMNEY = { x0: 19, x1: 20, z0: 24, z1: 25, y0: 1, y1: 17, flue: { x: 19, y0: 4, y1: 16, z: 24 } }; // stack; the flue stays air
export const CHIMNEY_TOP_CAMPFIRE = { x: 19, y: 17, z: 24 }; // lit campfire on the chimney top
export const FRONT_DOOR = { x: 11, y0: 2, y1: 3, z: 9 }; // the front door (transom above at (11,4,9))
export const ENTRANCE = [11, 2, 8]; // where the player stands, outside the door on the step
export const LOFT_DOOR = { x: 11, y0: 15, y1: 16, z: 8 }; // open loft door in the front gable
export const HOIST = { x: 11, y: 19, z0: 5, z1: 8 }; // hoist beam, projecting past the verge
export const STAIR_HOLE = { x0: 7, x1: 8, y: 6, z0: 14, z1: 17 }; // stairwell hole in the upper floor
export const ATTIC_HOLE = { x0: 8, x1: 9, y: 11, z0: 19, z1: 20 }; // attic ladder hole in the upper floor
export const STAIR_HOUSING = { x: [7, 8], y: [2, 6], z: [14, 18] }; // stairs rise north along the west wall
export const SIGN = { arm: [[16, 7, 7], [16, 7, 6]], hanging: { x: 16, y: 6, z: 6 }, lantern: { x: 16, y: 6, z: 7 } }; // Bäckerei sign arm (fence cells, sign, lantern)
export const ROOF_MAIN = { footprint: [6, 8, 16, 22], eaveY: 10, roofY: 11, ridgeX: 11, ridgeY: 21 }; // slate roof (roof tool, preset shop)
export const ROOF_WING = { rects: [[17, 13, 21, 22]], y: 6, ridgeX: 19, ridgeY: 8 }; // wing roof (roof(), gable, ridge along z)
export const ARCHWAY = { x0: 11, x1: 12, y0: 2, y1: 3, z: 16 }; // shop to Backstube (ground partition)
export const UPPER_DOORWAY = { x0: 11, x1: 12, y0: 7, y1: 8, z: 14 }; // Stube to bedroom (upper partition)
export const WING_DOORWAY = { x0: 16, x1: 17, y0: 2, y1: 3, z: 15 }; // shop to bakehouse, through both east walls
export const BACK_DOOR = { x: 8, y0: 2, y1: 3, z: 22 }; // spruce door to the back yard
export const WING_SIDE_DOOR = { x: 21, y0: 2, y1: 3, z: 17 }; // spruce door on the wing's east face
export const YARD = {
  fenceGates: [[1, 1, 20], [23, 1, 16]], // spruce fence gates
  smallSpruces: [[2, 1, 15], [3, 1, 29]], // [x, y, z] of each tree
  bench: { x0: 2, x1: 4, z: 10 }, // bench along the west fence
  woodpile: { x0: 7, x1: 10, z0: 24, z1: 25 }, // oven fuel
  wheat: { x0: 2, x1: 5, z0: 24, z1: 28 }, // herb and wheat patch
  props: { x0: 12, x1: 15, z0: 24, z1: 26 }, // flour sacks and yard props
};

// ---- room boxes: inner air [x0, y0, z0, x1, y1, z1] ------------------------------------------------------------------
export const ROOM_BOX = {
  shop: [7, 2, 10, 15, 5, 15], // Verkaufsraum, the sales floor
  backstube: [7, 2, 17, 15, 5, 21], // proofing and prep room
  bakehouse: [18, 2, 14, 20, 7, 21], // Backhaus, open to the rafters
  stube: [7, 7, 9, 15, 10, 13], // living room over the street
  schlafkammer: [9, 7, 15, 15, 10, 21], // bedroom at the back
  mehlboden: [9, 12, 9, 13, 16, 21], // flour loft under the slate roof
};

// ---- helpers ---------------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns the next float in [0, 1); the same seed always gives the same stream. */
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
