// Shared constants for every part: palette block ids (palette.json only), site coordinates, seeded rng.

// ---- site (module space: x = plot offset + local x, y = height, z unchanged) ----
export const SITE = { x: 388, y: 86, z: 73 };                 // grid size: x 0..387, y 0..85, z 0..72
export const PLOTS = {                                         // plot: offset along x, place box w x d, height cap
  inn: { offset: 0, w: 61, d: 54, top: 60 },                   // Plot 0 Inn at the Market
  stewart: { offset: 65, w: 64, d: 73, top: 85 },              // Plot 1 101 Stewart
  palihotel: { offset: 133, w: 59, d: 62, top: 43 },           // Plot 2 Palihotel
  fix: { offset: 196, w: 65, d: 65, top: 71 },                 // Plot 3 The Fix building
  hahn: { offset: 265, w: 57, d: 38, top: 37 },                // Plot 4 Hahn building
  pikeSt: { offset: 326, w: 62, d: 62, top: 31 },              // Plot 5 Pike Street Commercial
};
export const GROUND_BLOCK = "dirt";                            // fill under the ground surface (G); not a shell material

// ---- palette: the ids of palette.json, by name ----
export const STUCCO = "smooth_sandstone";                      // Inn body
export const STUCCO_STAIRS = "smooth_sandstone_stairs";        // Inn corbels and lintel pairs (upside down)
export const STUCCO_SLAB = "smooth_sandstone_slab";            // Inn string course, shadow lines, coping
export const CUT_SANDSTONE = "cut_sandstone";                  // Inn quoins and cornice; Pike St terracotta piers
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";        // cut sandstone course caps
export const CHISELED_SANDSTONE = "chiseled_sandstone";        // Pike St parapet panels
export const BRICKS = "bricks";                                // brick bodies: Stewart, Palihotel, Fix, Hahn, Pike St
export const BRICK_STAIRS = "brick_stairs";                    // brick corbels (Palihotel oriel)
export const BRICK_SLAB = "brick_slab";                        // brick slab caps
export const BRICK_WALL = "brick_wall";                        // brick wall caps
export const SMOOTH_STONE = "smooth_stone";                    // base course, Inn deck-area base, terrace decks
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";          // sills, coping, Hahn skylight coping
export const STONE_BRICKS = "stone_bricks";                    // Fix base and rusticated ground storey
export const STONE_BRICK_SLAB = "stone_brick_slab";            // Palihotel belt course, Fix belt courses and crests
export const STONE_BRICK_STAIRS = "stone_brick_stairs";        // Palihotel window lintels (upside down)
export const POLISHED_ANDESITE = "polished_andesite";          // Palihotel plinth, cornice, pilasters; Hahn base
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";  // Palihotel cornice brackets
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";      // Palihotel cap and coping
export const TERRACOTTA = "terracotta";                        // Fix window lintels
export const GREEN_TERRACOTTA = "green_terracotta";            // Palihotel fascia board
export const RED_CONCRETE = "red_concrete";                    // Palihotel and Pike St sign boards
export const GREEN_CONCRETE = "green_concrete";                // Hahn sign board
export const BLACK_CONCRETE = "black_concrete";                // sign backing and trim
export const GLASS_PANE = "glass_pane";                        // every window glass
export const GLASS = "glass";                                  // skylight and pavilion glass
export const WHITE_STAINED_GLASS_PANE = "white_stained_glass_pane";  // pavilion and light panes
export const DARK_OAK_DOOR = "dark_oak_door";                  // every door, both halves
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";          // bulkhead and hatch doors
export const DARK_OAK_STAIRS = "dark_oak_stairs";              // door steps
export const GREEN_WOOL = "green_wool";                        // green awning stripes
export const WHITE_WOOL = "white_wool";                        // white awning stripes; umbrella canopies
export const GREEN_CARPET = "green_carpet";                    // awning hem (green)
export const WHITE_CARPET = "white_carpet";                    // umbrella hem
export const IRON_BARS = "iron_bars";                          // rails, juliet balconies, ladders, hoops
export const IRON_TRAPDOOR = "iron_trapdoor";                  // fire-escape landings, HVAC vents
export const POLISHED_BLACKSTONE_STAIRS = "polished_blackstone_stairs";  // fire-escape stair runs
export const CHAIN = "chain";                                  // hanging lanterns (1.21.1 name; iron_chain is 1.21.2+)
export const LADDER = "ladder";                                // drop-ladders
export const GRAY_CONCRETE = "gray_concrete";                  // roof deck (non-Inn)
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";      // HVAC boxes
export const SPRUCE_PLANKS = "spruce_planks";                  // Inn deck, pavilion floor, water tank
export const SMOOTH_QUARTZ = "smooth_quartz";                  // pavilion corner posts and roof
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";        // pavilion eave
export const SPRUCE_SLAB = "spruce_slab";                      // water tank cone, shop counters
export const DARK_OAK_SLAB = "dark_oak_slab";                  // pergola grid
export const DARK_OAK_FENCE = "dark_oak_fence";                // pergola posts, umbrella poles, lamp posts
export const SPRUCE_FENCE = "spruce_fence";                    // roof furniture
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";              // planter boxes, shop shelves
export const DIRT = GROUND_BLOCK;                              // planter floors (same id as GROUND_BLOCK)
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";  // planting (persistent)
export const FLOWER_POT = "flower_pot";                        // shop shelf pots
export const LANTERN = "lantern";                              // door, awning and band lanterns
export const OCHRE_FROGLIGHT = "ochre_froglight";              // lit-window light behind the glass
export const SHROOMLIGHT = "shroomlight";                      // alternate window light (every 5th lit)
export const GLOWSTONE = "glowstone";                          // lit edges of the blade sign
export const CANDLE = "candle";                                // lit candles in shop windows
export const WHITE_BANNER = "white_banner";                    // sign letters (banner words)
export const DARK_OAK_WALL_SIGN = "dark_oak_wall_sign";        // wall sign carriers
export const DARK_OAK_HANGING_SIGN = "dark_oak_hanging_sign";  // hanging sign carriers

// ---- rng ----
// rng(seed): returns a function giving floats in [0, 1); the same seed always gives the same sequence (mulberry32).
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
