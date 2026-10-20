// Shared constants for every part: palette ids (the ones in palette.json only), plan.md's site coordinates, and rng.
// Ids are bare names; stairs and slabs need their own state, which the part sets.

// ---- palette: limestone, trim, glass ----
export const LIMESTONE = "smooth_sandstone";                // limestone body, piers, walls
export const LIMESTONE_STAIRS = "smooth_sandstone_stairs";  // cornice; string course (upside down, 1 proud)
export const LIMESTONE_SLAB = "smooth_sandstone_slab";      // parapet coping where the plan says
export const FRIEZE = "cut_sandstone";                      // frieze band under each parapet, fascias, sills
export const FRIEZE_SLAB = "cut_sandstone_slab";            // half-height frieze course
export const PLINTH = "polished_granite";                   // base plinth, entrance surrounds
export const PLINTH_STAIRS = "polished_granite_stairs";     // plinth steps
export const PLINTH_SLAB = "polished_granite_slab";         // steps and kerbs at the entrances
export const SPANDREL = "polished_deepslate";               // dark spandrel rows in the window strips
export const SPANDREL_SLAB = "polished_deepslate_slab";     // half-height spandrel
export const GLASS_OFFICE = "gray_stained_glass";           // office window strips (dark)
export const GLASS = "glass";                               // lit shopfront and lobby glass, door panes
export const GLASS_PANE = "glass_pane";                     // tall narrow windows, shopfront panes
export const GLASS_SKYLIGHT = "light_gray_stained_glass";   // skylights, the crown lantern skin

// ---- palette: bronze, marquee, light ----
export const BRONZE = "waxed_cut_copper";                   // frames, mullions, roundel rims, sills
export const BRONZE_STAIRS = "waxed_cut_copper_stairs";     // tall-window sills
export const BRONZE_SLAB = "waxed_cut_copper_slab";         // thin bronze trim
export const SILVER = "light_gray_concrete";                // marquee letter band (silver face), tower decks
export const IRON = "iron_block";                           // marquee end cheeks, blade cap, vent boxes
export const NEON_BLUE = "blue_stained_glass";              // blue neon line over sea_lantern
export const NEON_RED = "red_stained_glass";                // red neon line over shroomlight
export const BLUE_CONCRETE = "blue_concrete";               // blade faces
export const QUARTZ_SLAB = "smooth_quartz_slab";            // marquee top layer
export const SEA_LANTERN = "sea_lantern";                   // roof lights, floodlights, marquee backing
export const SHROOMLIGHT = "shroomlight";                   // lit-window backing, red neon backing, ceilings
export const GLOWSTONE = "glowstone";                       // soffit bulbs, skylight backing
export const END_ROD = "end_rod";                           // marquee bulbs (facing up), crown and blade caps

// ---- palette: banners, roundels, roofs, garden, ground ----
export const WHITE_BANNER = "white_banner";                 // standing white banner (RADIO CITY letters)
export const BLUE_BANNER = "blue_banner";                   // standing blue banner (MUSIC HALL letters)
export const WHITE_WALL_BANNER = "white_wall_banner";       // wall banner on the banner row
export const BLUE_WALL_BANNER = "blue_wall_banner";         // wall banner on the banner row
export const TERRA_LIGHT_BLUE = "light_blue_terracotta";    // roundel discs, dominant blue
export const TERRA_ORANGE = "orange_terracotta";            // roundel figures and dominant orange
export const TERRA_YELLOW = "yellow_terracotta";            // roundel figures
export const TERRA_WHITE = "white_terracotta";              // roundel figures
export const TERRA_PURPLE = "purple_terracotta";            // roundel dominant purple
export const TERRA_LIME = "lime_terracotta";                // roundel figures
export const DECK_LIGHT = "light_gray_concrete";            // tower and setback roof decks
export const DECK_DARK = "gray_concrete";                   // hall and podium roof decks
export const TRAPDOOR = "iron_trapdoor";                    // vent lids, fly-loft vent row
export const LIGHTNING_ROD = "lightning_rod";               // crown mast
export const RAIL = "iron_bars";                            // parapet rails (none in this build; for the roof tool)
export const MOSS = "moss_block";                           // roof garden beds
export const HEDGE = "oak_leaves";                          // roof garden hedges (persistent=true)
export const AZALEA = "azalea";                             // roof garden planting
export const AZALEA_FLOWERING = "flowering_azalea";         // roof garden planting
export const SIDEWALK = "smooth_stone";                     // ground and sidewalk course
export const KERB = "polished_andesite";                    // kerb on the outer sidewalk row
export const KERB_SLAB = "polished_andesite_slab";          // half-height kerb
export const LANTERN = "lantern";                           // lamp on a polished_granite stub; garden kerb lanterns

// ---- site coordinates (plan.md; x, y, z in the shared module frame) ----
export const SITE_SIZE = [156, 125, 55];                    // grid size: x 0..155, y 0..124, z 0..54
export const Z_NORTH = 0;                                   // 51st St edge
export const Z_SOUTH = 54;                                  // 50th St edge (the hero face)
export const PLOT0 = { x0: 0, x1: 33, cap: 124 };           // 1270 Avenue of the Americas and the Radio City corner
export const PLOT1 = { x0: 38, x1: 100, cap: 45 };          // Radio City Music Hall auditorium
export const PLOT2 = { x0: 105, x1: 155, cap: 78 };         // east end toward Rockefeller Plaza
export const PLOT1_RAISED_FROM = 59;                        // plot 1 ground is 1 from this x east (plan says ~58)
export const PLOT2_RAISED_FROM = 127;                       // plot 2 ground is 1 from this x east
export const MARQUEE_Y = [6, 10];                           // marquee volume y range, inclusive
export const SIDEWALK_Y = 0;                                // sidewalk course on plot 0 and the open ground

// ---- seeded random ----
/** rng(seed) returns a function giving floats in [0, 1); the same seed repeats the same sequence (mulberry32). */
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), a | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
