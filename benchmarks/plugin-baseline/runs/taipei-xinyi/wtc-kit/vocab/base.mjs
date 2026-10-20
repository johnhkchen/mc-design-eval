// Shared constants for every part: palette ids (palette.json only), site coordinates (plan.md), and a seeded rng.
// All ranges below are INCLUSIVE cell ranges in kit-local blocks, as plan.md writes them.

/** Data version of the server (Minecraft 1.21.1); build.mjs passes it to the Grid. */
export const DATA_VERSION = 3955;

// ---- palette: glass, frames and piers ------------------------------------------------------------------------------
/** ITB glass bays and back-lit glass. */
export const ITB_GLASS = "brown_stained_glass";
/** ITB spandrels, mullions and chamfer steps. */
export const ITB_FRAME = "brown_terracotta";
/** ITB full-height corner piers. */
export const ITB_PIER = "brown_concrete";
/** Cornices, coping and the top band's stone edge (full block). */
export const STONE_COPING = "smooth_stone";
/** Cornices, coping and paving bands (slab). */
export const STONE_COPING_SLAB = "smooth_stone_slab";
/** Plinths and bases (full block). */
export const GRANITE = "polished_granite";
/** Plinth coping at edges (slab). */
export const GRANITE_SLAB = "polished_granite_slab";
/** Monumental stair treads (grand stair). */
export const GRANITE_STAIRS = "polished_granite_stairs";
/** Hall body, frieze and spandrel bands. */
export const HALL_BODY = "light_gray_concrete";
/** Hall window bays. */
export const HALL_GLASS = "gray_stained_glass";
/** Hall window panes (glass_pane shape). */
export const HALL_GLASS_PANE = "gray_stained_glass_pane";
/** Hall arcade columns and TICC colonnade piers (axis y). */
export const QUARTZ_PILLAR = "quartz_pillar";
/** Pale cornices, fascias and copings (full block). */
export const PALE_QUARTZ = "smooth_quartz";
/** Pale copings (slab). */
export const PALE_QUARTZ_SLAB = "smooth_quartz_slab";
/** Pale stair treads. */
export const PALE_QUARTZ_STAIRS = "smooth_quartz_stairs";
/** Hall plinth and paving bands (full block). */
export const PAVING = "polished_andesite";
/** Paving bands (slab). */
export const PAVING_SLAB = "polished_andesite_slab";
/** Hyatt body bands (full block). */
export const SANDSTONE = "smooth_sandstone";
/** Hyatt body bands (slab). */
export const SANDSTONE_SLAB = "smooth_sandstone_slab";
/** Hyatt window mullions. */
export const CUT_SANDSTONE = "cut_sandstone";
/** TICC curtain-wall glass. */
export const TICC_GLASS = "black_stained_glass";
/** TICC curtain-wall panes (glass_pane shape). */
export const TICC_GLASS_PANE = "black_stained_glass_pane";
/** TICC mullions, transoms and plant. */
export const TICC_MULLION = "gray_concrete";
/** Lit lobby glass. */
export const LOBBY_GLASS = "glass";
/** Lobby glass panes. */
export const LOBBY_GLASS_PANE = "glass_pane";
/** Dark office backing behind every glass cell. */
export const DARK_BACKING = "black_concrete";

// ---- palette: light and detail ---------------------------------------------------------------------------------------
/** Warm window backing and lit lobby ceilings. */
export const WARM_LIGHT = "ochre_froglight";
/** Cool window backing, hall skylight glow. */
export const COOL_LIGHT = "pearlescent_froglight";
/** Flush roof and terrace lights, crown lit rims (under the rim glass). */
export const ROOF_LIGHT = "sea_lantern";
/** Glass laid over sea_lantern for the lit crown rims. */
export const RIM_GLASS = "light_gray_stained_glass";
/** Aircraft warning lights (on a polished_andesite post). */
export const AIRCRAFT_LIGHT = "redstone_torch";
/** Floodlights on the crown decks. */
export const FLOODLIGHT = "end_rod";
/** Railings and grilles. */
export const RAIL = "iron_bars";
/** Crown and penthouse louvres. */
export const LOUVRE = "iron_trapdoor";
/** Flag cloth. */
export const FLAG_RED = "red_wool";
/** Flag cloth. */
export const FLAG_WHITE = "white_wool";
/** Flag cloth. */
export const FLAG_BLUE = "blue_wool";
/** Lamp post base. */
export const LAMP_POST = "stone_brick_wall";
/** Lamp post head (standing). */
export const LAMP = "lantern";
/** Planter and plaza tree trunks. */
export const TREE_LOG = "oak_log";
/** Planter and plaza tree crowns (persistent). */
export const TREE_LEAVES = "oak_leaves";
/** Planter top (grass). */
export const PLANTER_TOP = "grass_block";
/** Planter soil (coarse dirt). */
export const PLANTER_SOIL = "coarse_dirt";
/** Ground fill under the site surface, laid by build.mjs. */
export const GROUND_FILL = "dirt";

// ---- site -----------------------------------------------------------------------------------------------------------
/** Full site grid size in blocks: x 0..717, y 0..205, z 0..274. */
export const SITE = { x: 718, y: 206, z: 275 };

/** Each plot's inclusive bounds and tallest height (plan.md SITE). x0 is the plot's offset along x. */
export const PLOT = {
  itb: { x0: 0, x1: 89, z0: 0, z1: 91, maxY: 205 },
  hall: { x0: 93, x1: 386, z0: 0, z1: 274, maxY: 45 },
  hyatt: { x0: 391, x1: 566, z0: 0, z1: 115, maxY: 125 },
  ticc: { x0: 570, x1: 717, z0: 0, z1: 111, maxY: 75 },
};

/** Main masses as [x0, y0, z0, x1, y1, z1], inclusive (plan.md SITE tables). */
export const MASS = {
  itbPlinth: [0, 0, 0, 89, 4, 91],
  itbLobby: [22, 4, 12, 59, 14, 19],
  itbShaft: [18, 4, 20, 67, 182, 69],
  itbCrown1: [20, 183, 22, 65, 190, 67],
  itbCrown2: [24, 191, 26, 61, 197, 63],
  itbPenthouse: [34, 198, 36, 51, 202, 53],
  hallMain: [156, 0, 35, 365, 40, 258],
  hallNorth: [212, 0, 0, 372, 36, 34],
  hallArcade: [163, 0, 259, 365, 24, 265],
  hallPorch: [240, 0, 259, 281, 26, 272],
  hyattPodium: [403, 0, 16, 554, 24, 100],
  hyattSlab: [430, 24, 46, 530, 111, 72],
  hyattCrown: [430, 112, 46, 530, 118, 72],
  hyattPenthouse: [460, 119, 52, 500, 123, 66],
  ticcPlinth: [598, 0, 32, 713, 6, 95],
  ticcHall: [610, 6, 40, 697, 56, 87],
  ticcRoof: [600, 57, 32, 703, 61, 95],
  ticcAttic: [606, 62, 38, 697, 67, 89],
  ticcStair: [702, 1, 48, 713, 6, 79],
};

// ---- rng --------------------------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving floats in [0, 1); the same seed always gives the same sequence (mulberry32). */
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
