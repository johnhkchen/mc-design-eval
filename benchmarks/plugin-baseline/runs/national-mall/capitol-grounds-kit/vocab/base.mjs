// Shared constants for the Capitol grounds build (plan.md): palette ids, site coordinates, a seeded rng.
// Palette: the ids in palette.json, named (roles first, then objects).
export const SMOOTH_QUARTZ = "smooth_quartz";                       // marble walls, platform, pedestals
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";             // marble trim and coping slabs
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";         // marble cornice stairs and cheek tops
export const QUARTZ_PILLAR = "quartz_pillar";                       // pilasters, pedestal shafts, piers
export const QUARTZ_STAIRS = "quartz_stairs";                       // terrace flight treads
export const QUARTZ_SLAB = "quartz_slab";                           // quartz course slabs
export const QUARTZ_BRICKS = "quartz_bricks";                       // a course that needs brick (only if one does)
export const POLISHED_DIORITE = "polished_diorite";                 // terrace plinth courses
export const POLISHED_DIORITE_SLAB = "polished_diorite_slab";       // plinth course slabs
export const DIORITE_WALL = "diorite_wall";                         // terrace balustrades
export const POLISHED_BLACKSTONE = "polished_blackstone";           // bronze figures, lions, group bodies
export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab"; // bronze hats and top slabs
export const POLISHED_BLACKSTONE_STAIRS = "polished_blackstone_stairs"; // bronze heads and lion heads
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall"; // bronze legs, gun barrel, lamp posts
export const POLISHED_ANDESITE = "polished_andesite";               // pool coping, plaza bands
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";     // plaza band slabs
export const SMOOTH_STONE = "smooth_stone";                         // pool floor, plaza paving
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";               // coping lip (inner row, bottom type)
export const WATER = "water";                                       // pool and fountain water (source blocks)
export const SMOOTH_SANDSTONE = "smooth_sandstone";                 // Olmsted and central walks
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";       // walk half-steps at each rise
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";   // walk stairs (rarely)
export const GRASS_BLOCK = "grass_block";                           // lawn surface
export const DIRT = "dirt";                                         // fill under the surface (three courses)
export const STONE = "stone";                                       // fill below the dirt; the sub-floor at y 0
export const PODZOL = "podzol";                                     // tree soil patch, under crowns only
export const ROOTED_DIRT = "rooted_dirt";                           // tree soil patch, under crowns only
export const MOSS_BLOCK = "moss_block";                             // planting bed base
export const DIRT_PATH = "dirt_path";                               // never on the main walks
export const DARK_OAK_LOG = "dark_oak_log";                         // tree trunks (axis y)
export const DARK_OAK_LEAVES = "dark_oak_leaves";                   // tree crowns (persistent)
export const OAK_LEAVES = "oak_leaves";                             // outer crown patches (persistent)
export const AZALEA_LEAVES = "azalea_leaves";                       // hedge beds (persistent)
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";   // hedge accents (persistent)
export const DECORATED_POT = "decorated_pot";                       // urns on the piers
export const LANTERN = "lantern";                                   // lamp tops and pier lanterns
export const SHROOMLIGHT = "shroomlight";                           // hidden floodlights in crowns and hedges
export const GLOWSTONE = "glowstone";                               // hidden floodlight under the Grant rim

// Site: plan.md's coordinates. Ranges are inclusive cells; y is the module's (module y 0 = world y 4).
export const SITE_SIZE = [185, 33, 125];                           // the module box: x 0..184, y 0..32, z 0..124
export const POOL = { x0: 20, x1: 55, z0: 16, z1: 109 };           // reflecting pool basin (floor y 1, water y 2)
export const POOL_WATER_Y = 2;                                     // reflecting pool water surface
export const COPING_RING = { x0: 18, x1: 57, z0: 14, z1: 111 };    // 2-wide pool coping ring (top y 3)
export const COPING_Y = 3;                                         // coping top, also the plaza paving level
export const PLAZA = { x0: 60, x1: 70, z0: 10, z1: 114 };          // Union Square paving (y 3)
export const GRANT_PLATFORM = { x0: 60, x1: 66, z0: 67, z1: 89 };  // memorial platform (top y 6)
export const GRANT_TOP_Y = 6;                                      // Grant platform top
export const GRANT_PEDESTAL = { x0: 62, x1: 64, z0: 77, z1: 79, y0: 7, y1: 11 }; // pedestal (plinth course y 11)
export const RIDER_TOP_Y = 15;                                     // top of the equestrian statue
export const CENTRAL_WALK = { x0: 71, x1: 155, z0: 58, z1: 64 };   // the open axial walk (7 wide)
export const TERRACE_TIER1 = { x0: 159, x1: 182, z0: 14, z1: 110, top: 9 };  // lower terrace (paving y 9, balustrade 10)
export const TERRACE_TIER2 = { x0: 171, x1: 182, z0: 30, z1: 94, top: 11 };  // upper terrace (paving y 11, balustrade 12)
export const CORRIDOR = { x0: 0, x1: 184, z0: 44, z1: 80 };        // view corridor: monuments, terrace, walk lamps only
export const ENTRANCE = [71, 4, 61];                               // a visitor stands here at the start of the central walk
export const STREET = [60, 4, 61];                                 // the street end, on the plaza
export const TREE_CROWN_MAX_Y = 18;                                // tree crowns reach y 13..18
export const MAX_Y = 20;                                           // nothing is built above this y

// Random: rng(seed) returns a function giving floats in [0, 1), the same sequence every run for one seed (mulberry32).
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
