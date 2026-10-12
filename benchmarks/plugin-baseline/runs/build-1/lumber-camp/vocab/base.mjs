// Shared constants for the lumber camp: palette block ids (palette.json only), site boxes from plan.md, and a seeded rng.
// Boxes are inclusive [x0, y0, z0, x1, y1, z1], the same form as rooms.json.

// Palette block ids: structure roles (palette.json "roles").
export const SPRUCE_LOG = "spruce_log";                       // bunkhouse logs, trees
export const COBBLESTONE = "cobblestone";                     // plinth, chimney
export const MOSSY_COBBLESTONE = "mossy_cobblestone";         // plinth and chimney, 1 in 6
export const STONE_BRICKS = "stone_bricks";                   // chimney band
export const COBBLESTONE_SLAB = "cobblestone_slab";           // chimney cap
export const COBBLESTONE_STAIRS = "cobblestone_stairs";       // hearth lintel
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";     // posts, gables, rails
export const STRIPPED_SPRUCE_WOOD = "stripped_spruce_wood";   // plates, beams, stickers
export const SPRUCE_PLANKS = "spruce_planks";                 // floors, boards, deck
export const SPRUCE_SLAB = "spruce_slab";                     // sills, covers, porch roof
export const SPRUCE_STAIRS = "spruce_stairs";                 // knee braces, porch roof, benches
export const SPRUCE_FENCE = "spruce_fence";                   // rails, legs, lamp posts
export const SPRUCE_FENCE_GATE = "spruce_fence_gate";         // gates
export const SPRUCE_DOOR = "spruce_door";                     // front and back doors
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";             // shutters, loft door
export const SPRUCE_WALL_SIGN = "spruce_wall_sign";           // SAWMILL sign
export const SPRUCE_PRESSURE_PLATE = "spruce_pressure_plate"; // filing bench top
export const GLASS_PANE = "glass_pane";                       // windows
export const COBBLED_DEEPSLATE = "cobbled_deepslate";         // roofs (slate)
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs";
export const COBBLED_DEEPSLATE_SLAB = "cobbled_deepslate_slab";
export const DEEPSLATE_TILES = "deepslate_tiles";             // roofs (slate)
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
export const POLISHED_DEEPSLATE = "polished_deepslate";       // roofs (slate)
export const TUFF_BRICKS = "tuff_bricks";                     // roof eaves
export const TUFF_BRICK_STAIRS = "tuff_brick_stairs";
export const TUFF_BRICK_SLAB = "tuff_brick_slab";
export const STONE_BRICK_STAIRS = "stone_brick_stairs";       // roof ridge
export const STONE_BRICK_SLAB = "stone_brick_slab";
export const DARK_OAK_PLANKS = "dark_oak_planks";             // bunkhouse roof verges
export const DARK_OAK_STAIRS = "dark_oak_stairs";
export const DARK_OAK_SLAB = "dark_oak_slab";
export const BRICKS = "bricks";                               // boiler stack
export const BRICK_SLAB = "brick_slab";                       // boiler stack cap
export const DEEPSLATE_BRICKS = "deepslate_bricks";           // boiler stack band
export const BIRCH_PLANKS = "birch_planks";                   // sawn lumber
export const BIRCH_SLAB = "birch_slab";                       // sawn lumber, top slabs
export const GRASS_BLOCK = "grass_block";                     // ground
export const COARSE_DIRT = "coarse_dirt";                     // ground, ruts
export const PODZOL = "podzol";                               // ground, stump beds
export const ROOTED_DIRT = "rooted_dirt";                     // ground
export const DIRT_PATH = "dirt_path";                         // roads, paths
export const GRAVEL = "gravel";                               // ground, road patches
export const SHORT_GRASS = "short_grass";                     // ground
export const FERN = "fern";                                   // ground
export const SPRUCE_LEAVES = "spruce_leaves";                 // standing spruces (persistent)

// Palette block ids: objects (palette.json "objects").
export const BARREL = "barrel";                               // furniture, offcuts
export const CHEST = "chest";                                 // furniture, filing bench
export const LADDER = "ladder";                               // loft ladder
export const RED_BED = "red_bed";                             // bunks
export const WHITE_WOOL = "white_wool";                       // bedding
export const WHITE_CARPET = "white_carpet";                   // rugs
export const BOOKSHELF = "bookshelf";                         // furniture
export const CRAFTING_TABLE = "crafting_table";               // workstation
export const COMPOSTER = "composter";                         // furniture
export const ANVIL = "anvil";                                 // workstation
export const LECTERN = "lectern";                             // workstation
export const CAMPFIRE = "campfire";                           // cook fire, signal fire
export const SMOKER = "smoker";                               // hearth
export const FURNACE = "furnace";                             // boiler firebox
export const BLAST_FURNACE = "blast_furnace";                 // boiler firebox
export const STONECUTTER = "stonecutter";                     // saw
export const GRINDSTONE = "grindstone";                       // filing bench
export const CAULDRON = "cauldron";                           // hearth
export const LANTERN = "lantern";                             // light
export const IRON_CHAIN = "iron_chain";                       // hanging lights
export const HAY_BLOCK = "hay_block";                         // signal fire base

// Site: the grid is 40 x 22 x 34; the ground lies at y = GROUND_Y across x 0..39, z 0..33.
export const SIZE = [40, 22, 34];
export const GROUND_Y = 0;

// Site: masses from plan.md's SITE table (inclusive boxes).
export const BUNKHOUSE = [4, 1, 8, 18, 5, 17];                // log cabin walls (y=1 plinth, y=2..5 logs)
export const BUNKHOUSE_ROOF = [3, 6, 7, 19, 14, 18];          // steep gable incl. overhang, top y=14
export const PORCH = [5, 1, 5, 17, 5, 7];                     // deck, posts, rails, shed roof
export const WOODSHED = [5, 1, 18, 12, 5, 21];                // open lean-to behind the bunkhouse
export const SAWMILL = [23, 0, 8, 35, 6, 20];                 // open pole frame, floor y=0, plate y=6
export const SAWMILL_ROOF = [22, 7, 7, 36, 14, 21];           // 45 degree gable with monitor, top y=14
export const COOK_CHIMNEY = [19, 1, 12, 20, 17, 13];          // fieldstone stack, cap y=17
export const BOILER_STACK = [36, 1, 17, 37, 19, 18];          // red brick stack, cap y=19
export const LOG_DECK = [24, 1, 4, 34, 3, 7];                 // skids and log tiers feeding the mill
export const LUMBER_YARD = [24, 1, 24, 36, 4, 29];            // three sawn-lumber stacks

// Site: doors and the entrance cell (plan.md OPENINGS and ROOMS).
export const FRONT_DOOR = [13, 2, 8];                         // bunkhouse front door, from the porch
export const BACK_DOOR = [7, 2, 17];                          // bunkhouse back door, into the woodshed
export const ENTRANCE = [13, 1, 3];                           // camp path cell outside the porch step

// Interior room boxes, the same as rooms.json (keyed by room name).
export const ROOMS = {
  "Bunkroom": [5, 2, 9, 9, 4, 16],                            // bunkhouse ground floor, west
  "Mess and cook hall": [11, 2, 9, 17, 4, 16],                // bunkhouse ground floor, east
  "Loft": [5, 6, 10, 17, 8, 15],                              // under the steep roof
  "Front porch": [5, 2, 5, 17, 3, 7],                         // covered deck, north of the bunkhouse
  "Woodshed": [5, 1, 18, 12, 3, 20],                          // open lean-to, south of the bunkhouse
  "Sawmill hall": [24, 1, 9, 34, 5, 19],                      // tall open work floor
};

/** A seeded random generator (mulberry32): rng(seed)() returns a float in [0, 1), the same sequence for the same seed. */
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
