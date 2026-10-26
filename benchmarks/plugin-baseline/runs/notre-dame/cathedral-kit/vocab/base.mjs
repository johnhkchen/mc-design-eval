// Shared constants for every part: palette ids (palette.json), plan.md site coordinates, a seeded rng.

// ---- palette (bare ids, as in palette.json; the build library adds minecraft:) ----
export const SMOOTH_SANDSTONE = "smooth_sandstone";                   // wall body (60%)
export const SANDSTONE = "sandstone";                                 // lower-course ashlar (<=10%)
export const CUT_SANDSTONE = "cut_sandstone";                         // string courses, frames, lintels
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";               // hoods, sills
export const CHISELED_SANDSTONE = "chiseled_sandstone";               // carving: tympana, tracery, heads, niches
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";     // mouldings, set-offs, flyers, coping
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";         // flat coping and deck caps
export const SANDSTONE_WALL = "sandstone_wall";                       // balustrades, colonnettes, posts
export const END_STONE_BRICKS = "end_stone_bricks";                   // pale accent stone
export const END_STONE_BRICK_WALL = "end_stone_brick_wall";           // pinnacles, crockets, spikes
export const STONE_BRICKS = "stone_bricks";                           // plinth course
export const STONE_BRICK_STAIRS = "stone_brick_stairs";               // plinth edge
export const POLISHED_ANDESITE = "polished_andesite";                 // plinth top course, paving, ground
export const DEEPSLATE_TILES = "deepslate_tiles";                     // lead roof field, spire body
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";         // lead roof edges
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";             // lean-to roof edges
export const POLISHED_DEEPSLATE = "polished_deepslate";               // ridges, spire structure
export const POLISHED_DEEPSLATE_WALL = "polished_deepslate_wall";     // spire cross and ridge walls
export const IRON_BARS = "iron_bars";                                 // ridge cresting, cross arms
export const DARK_OAK_LOG = "dark_oak_log";                           // spire frame lines
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";                 // belfry louvres, spire louvres
export const CHAIN = "chain";                                         // 1.21.1 chain (not iron_chain)
export const GOLD_BLOCK = "gold_block";                               // rooster
export const LIGHTNING_ROD = "lightning_rod";                         // spire tip and pinnacle finials
export const OXIDIZED_CUT_COPPER = "oxidized_cut_copper";             // apostle bodies
export const OXIDIZED_CUT_COPPER_STAIRS = "oxidized_cut_copper_stairs"; // apostle heads
export const BLUE_GLASS_PANE = "blue_stained_glass_pane";             // rose field, lancets
export const RED_GLASS_PANE = "red_stained_glass_pane";               // rose ring
export const PURPLE_GLASS_PANE = "purple_stained_glass_pane";         // rose centre, lancet heads
export const YELLOW_GLASS_PANE = "yellow_stained_glass_pane";         // rose centre
export const BLUE_STAINED_GLASS = "blue_stained_glass";               // solid blue in 1-thick fills
export const DARK_OAK_DOOR = "dark_oak_door";                         // portal doors
export const OCHRE_FROGLIGHT = "ochre_froglight";                     // floodlights in plinth and paving
export const SHROOMLIGHT = "shroomlight";                             // light behind glass
export const LANTERN = "lantern";                                     // hanging and post lamps
export const SMOOTH_STONE = "smooth_stone";                           // paving
export const GRASS_BLOCK = "grass_block";                             // garden, Square Jean-XXIII
export const MOSS_BLOCK = "moss_block";                               // garden
export const AZALEA = "azalea";                                       // garden bushes
export const ROCK = "stone";                                          // rock under the plot (laid by build.mjs, not in the palette)

// ---- site (plan.md SITE: plot blocks) ----
export const SITE_SIZE = [189, 140, 111];                             // x 0..188, y 0..139 (the hard height limit), z 0..110
export const FLOOR_Y = 3;                                             // the common floor line: every plinth runs up to y 3
export const MAIN_AXIS_Z = 37;                                        // the main axis; north/south pairs mirror about it
export const SPIRE_CENTRE = [95, 37];                                 // x, z of the spire and crossing centre
export const SPIRE_TIP = [95, 137, 37];                               // lightning_rod tip: the highest block of the build
export const CHEVET_CENTRE = [150, 37];                               // polar centre (x, z) for the chevet: angle 0 = due east
export const WEST_FRONT_X = 0;                                        // the west front plane (the facade is the west face)
export const CHEVET_X = 150;                                          // the apse and chevet sit at x >= 150

// ---- rng ----
/** rng(seed): a seeded generator (mulberry32) returning floats in [0, 1); the same seed gives the same sequence. */
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
