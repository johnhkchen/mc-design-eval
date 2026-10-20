// Palette ids (palette.json only), plan.md site coordinates, and a seeded rng for the Main Post build.

// ---- site: plan.md SITE (build coordinates: x 0..93, y 0..13, z 0..25) ----------------------------------------------
/** Full site grid size [x, y, z] (x 0..93, y 0..13, z 0..25). */
export const SITE_SIZE = [94, 14, 26];
/** Ground course level: the smooth_stone course under each footprint (laid by the parts, see plan.md SITE). */
export const GROUND_Y = 0;
/** Plot rectangles [x0, z0, x1, z1], inclusive: museum, barracks, Officers' Club, Visitor Center. */
export const PLOT_RECTS = { museum: [0, 0, 23, 19], barracks: [24, 0, 49, 17], club: [50, 0, 77, 25], visitorCenter: [78, 0, 93, 9] };
/** Max build height per plot (museum, barracks, club, visitor center): the roof must stay at or below these. */
export const MAX_Y = { museum: 13, barracks: 13, club: 10, visitorCenter: 9 };
/** Water table and door sill course (y 1), shared by the three brick buildings. */
export const WATER_TABLE_Y = 1;
/** Lower floor band of the brick buildings (y 4). */
export const BAND_LOW_Y = 4;
/** Upper floor band of the brick buildings (y 7). */
export const BAND_HIGH_Y = 7;
/** White eave cornice course (y 9). */
export const CORNICE_Y = 9;
/** First roof course of the brick buildings (y 10). */
export const ROOF_BASE_Y = 10;

// ---- palette: plan.md PALETTE, one constant per block id -------------------------------------------------------------
/** Ground course block (plot foundations, porch decks). */
export const SMOOTH_STONE = "smooth_stone";
/** Ground course bottom slab: the half step in front of each door. */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
/** Brick body of the barracks, museum, Visitor Center, chimneys and dormer cheeks. */
export const BRICKS = "bricks";
/** Brick stairs (brick body detail). */
export const BRICK_STAIRS = "brick_stairs";
/** Brick slab (chimney caps, brick detail). */
export const BRICK_SLAB = "brick_slab";
/** Water table and base course. */
export const POLISHED_ANDESITE = "polished_andesite";
/** Base course slab. */
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";
/** Chimney band. */
export const STONE_BRICKS = "stone_bricks";
/** Red clay-tile roof block (salmon-red granite). */
export const POLISHED_GRANITE = "polished_granite";
/** Red clay-tile roof stairs. */
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";
/** Red clay-tile roof slab. */
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";
/** White trim: cornice fascia, beams, dormer lids, porch roof fascia. */
export const SMOOTH_QUARTZ = "smooth_quartz";
/** White trim stairs: upside-down cornice and arch stairs. */
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
/** White trim slab: sills, gallery deck, dormer lids. */
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
/** White porch posts and gallery railing. */
export const DIORITE_WALL = "diorite_wall";
/** Black iron rails and handrails. */
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";
/** Dark frame block (pavilion mullions, cannon breech). */
export const POLISHED_BLACKSTONE = "polished_blackstone";
/** Dark frame slab (pavilion roof deck). */
export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab";
/** Window glass (sash). */
export const GLASS_PANE = "glass_pane";
/** Deep-set dark glass in the Officers' Club. */
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";
/** Grille bars in the Officers' Club outer windows, and the flagpole. */
export const IRON_BARS = "iron_bars";
/** Officers' Club stucco. */
export const WHITE_CONCRETE = "white_concrete";
/** Dark wood doors of the barracks, museum and Visitor Center. */
export const SPRUCE_DOOR = "spruce_door";
/** Dark oak doors of the Officers' Club. */
export const DARK_OAK_DOOR = "dark_oak_door";
/** Open cannon carriage wheels. */
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
/** Banner with white letters (museum DISNEY and MUSEUM runs). */
export const RED_WALL_BANNER = "red_wall_banner";
/** Red panels and flag field. */
export const RED_WOOL = "red_wool";
/** Red sign band (Visitor Center fascia). */
export const RED_CONCRETE = "red_concrete";
/** Flag canton. */
export const BLUE_WOOL = "blue_wool";
/** Flag star field. */
export const WHITE_WOOL = "white_wool";
/** Persistent shrub leaves. */
export const AZALEA_LEAVES = "azalea_leaves";
/** Persistent shrub and crown leaves. */
export const OAK_LEAVES = "oak_leaves";
/** Courtyard tree trunk. */
export const OAK_LOG = "oak_log";
/** Hanging porch, arcade and interior light. */
export const LANTERN = "lantern";
/** Flagpole finial. */
export const LIGHTNING_ROD = "lightning_rod";

// ---- rng --------------------------------------------------------------------------------------------------------------
/** rng(seed): returns a function giving floats in [0, 1); the same seed always gives the same sequence (mulberry32). */
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
