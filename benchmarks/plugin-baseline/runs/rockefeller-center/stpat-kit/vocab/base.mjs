// Shared constants for every part: palette ids (palette.json only), plan.md site coordinates, and a seeded rng.
// Coordinates are SITE grid coordinates unless a name says LOCAL; use site(plot, x, z) to turn a plot-local x, z into site.

// ---- palette (palette.json ids) -----------------------------------------------------------------------------------
export const CALCITE = "calcite";                                   // marble body, 55 %
export const POLISHED_DIORITE = "polished_diorite";                 // marble body 30 %, trim, quoins, rose-window ring
export const DIORITE = "diorite";                                   // marble body 15 %, more at plinth and buttress bases
export const POLISHED_DIORITE_STAIRS = "polished_diorite_stairs";   // trim: pointed heads, string courses, weatherings
export const POLISHED_DIORITE_SLAB = "polished_diorite_slab";       // trim: sills, copings, louvre tops
export const DIORITE_WALL = "diorite_wall";                         // tracery, mullions, pierced parapets, spire lace, shafts
export const IRON_BARS = "iron_bars";                               // rare tracery
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";         // crockets, wimperg crockets, pinnacle crockets
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";             // sparse highlights
export const END_ROD = "end_rod";                                   // pinnacle and gable tips, lightning rods
export const POLISHED_ANDESITE = "polished_andesite";               // plinth course y 0..2, steps
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";     // plinth top course, sidewalk edge
export const SMOOTH_STONE = "smooth_stone";                         // sidewalk
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";       // main roof slate (80 %), residence slate
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";           // slate at eaves
export const COBBLED_DEEPSLATE_STAIRS = "cobbled_deepslate_stairs"; // slate patches (20 %)
export const COPPER_SLAB = "waxed_oxidized_cut_copper_slab";        // ridge crest, copper coping
export const COPPER_STAIRS = "waxed_oxidized_cut_copper_stairs";    // copper roof edges, fleche roof
export const COPPER_BLOCK = "waxed_oxidized_cut_copper";            // small caps, finials
export const COPPER_GRATE = "waxed_oxidized_copper_grate";          // fleche lantern sides
export const PANE_PURPLE = "purple_stained_glass_pane";             // lancet glass
export const PANE_BLUE = "blue_stained_glass_pane";                 // lancet glass (dominant)
export const PANE_RED = "red_stained_glass_pane";                   // lancet glass
export const PANE_YELLOW = "yellow_stained_glass_pane";             // lancet glass (accents)
export const GLASS_PURPLE = "purple_stained_glass";                 // rose window sector (full block)
export const GLASS_BLUE = "blue_stained_glass";                     // rose window sector (full block)
export const GLASS_RED = "red_stained_glass";                       // rose window sector (full block)
export const GLASS_YELLOW = "yellow_stained_glass";                 // rose window sector (full block)
export const GLASS_PANE = "glass_pane";                             // residence windows
export const OCHRE_FROGLIGHT = "ochre_froglight";                   // light one cell behind every pane and glass
export const DOOR_COPPER = "waxed_exposed_copper_door";             // cathedral portals
export const DOOR_DARK_OAK = "dark_oak_door";                       // residence doors
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall"; // lamp post shaft
export const LANTERN = "lantern";                                   // lamps, hanging lights, roof lights
export const BELL = "bell";                                         // belfry bells
export const GRASS = "grass_block";                                 // ground surface
export const MOSS = "moss_block";                                   // ground patches
export const OAK_LOG = "oak_log";                                   // tree trunks
export const OAK_LEAVES = "oak_leaves";                             // tree crowns (persistent)
export const DEEPSLATE_BRICKS = "deepslate_bricks";                 // residence chimney band

// ---- site (plan.md SITE; grid = the whole site) -------------------------------------------------------------------
export const SITE_SIZE = [150, 96, 42];                 // grid size: x 0..149 (plots 0-2), y 0..95 (limit 96), z 0..41
export const PLOT_X = [0, 109, 132];                    // site x of each plot's local x 0 (plot 0 cathedral, 1 Archbishop, 2 Rectory); z origin is 0 for all
export const PLOT_TOP = [96, 30, 34];                   // plan limit y per plot
export const AXIS_Z = 20;                               // church long axis: everything mirrors across z = 20
export const FRONT_X = 4;                               // west front plane (Fifth Avenue, faces -x); portals and rose window sit here
export const PLINTH_TOP = 2;                            // top of the polished andesite plinth / church floor block (floor walk y 3)
export const WALK_Y = 3;                                // interior walk level of the church floor
export const TOWER_NORTH = { x0: 0, x1: 10, z0: 3, z1: 13 };     // north tower footprint (11 x 11)
export const TOWER_SOUTH = { x0: 0, x1: 10, z0: 27, z1: 37 };    // south tower footprint (11 x 11)
export const TOWER_TOP = 43;                            // tower walls end here; parapet y 44..45
export const SPIRE_BASE_Y = 44;                         // octagonal openwork spires start here ...
export const SPIRE_TOP_Y = 93;                          // ... and the cross tip is here
export const CENTRE_FRONT = { x0: 4, x1: 10, z0: 14, z1: 26, top: 33 };  // centre west front between the towers
export const GREAT_GABLE = { x0: 4, x1: 6, z0: 14, z1: 26, y0: 34, apex: 41 };  // great west gable, apex at z = 20
export const NAVE = { x0: 11, x1: 45, z0: 14, z1: 26, wallTop: 33 };    // high vessel; clerestory walls at z 14 and z 26
export const NAVE_AISLE_N = { x0: 11, x1: 45, z0: 4, z1: 13, top: 20 }; // north aisle, outer wall z 4
export const NAVE_AISLE_S = { x0: 11, x1: 45, z0: 27, z1: 36, top: 20 }; // south aisle, outer wall z 36
export const CROSSING = { x0: 46, x1: 58, z0: 14, z1: 26, top: 33 };    // 13 x 13 crossing under the fleche
export const FLECHE = { x0: 51, x1: 53, z0: 19, z1: 21, y0: 41, top: 58 };  // fleche: open lantern y 42..47, spire to y 56, rod y 57..58
export const TRANSEPT_N = { x0: 46, x1: 58, z0: 0, z1: 13, top: 33 };   // north transept high vessel; end facade z 0
export const TRANSEPT_S = { x0: 46, x1: 58, z0: 27, z1: 40, top: 33 };  // south transept high vessel; end facade z 40
export const CHOIR = { x0: 59, x1: 79, z0: 14, z1: 26, top: 33 };       // choir high vessel
export const APSE = { x0: 80, x1: 84, z0: 14, z1: 26, top: 33 };        // three-sided apse, tapering to z 17..23 at x 84
export const LADY_CHAPEL = { x0: 85, x1: 99, z0: 16, z1: 24, top: 21 };  // Lady Chapel walls
export const LADY_APSE = { x0: 100, x1: 104, z0: 16, z1: 24, top: 21 };  // five-sided Lady Chapel end
export const RIDGE_Y = 41;                              // nave, transept and choir ridge (copper cap at y 42)
export const EAVE_Y = 34;                               // first roof course over the clerestory
export const ROSE_CENTRE = [4, 26, 20];                 // rose window centre (x, y, z); diameter 9
export const PORTAL_MAIN = { z0: 18, z1: 22, y0: 3, y1: 12 };           // main west portal opening (x 4..6)
export const RESIDENCE_1 = { x0: 0, x1: 18, z0: 0, z1: 14, top: 30 };   // Archbishop's residence, LOCAL to plot 1
export const RESIDENCE_2 = { x0: 0, x1: 17, z0: 0, z1: 14, top: 34 };   // Rectory, LOCAL to plot 2

/** Site [x, z] of a plot-local (x, z): site(1, 0, 9) is the Archbishop's garden corner on the site grid. */
export const site = (plot, x, z) => [PLOT_X[plot] + x, z];

// ---- seeded random ------------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving a repeatable float in [0, 1) (mulberry32), for hashed variation. */
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
