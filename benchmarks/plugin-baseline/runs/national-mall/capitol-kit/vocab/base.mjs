// Shared constants for the Capitol parts: palette block ids (palette.json only), plan.md site coordinates, a seeded rng.
// Plot-local coordinates throughout (plan.md SITE): x 0..35 west to east, z 0..95 north to south, y 0 = lowest ground.

// ---- site ---------------------------------------------------------------------------------------------------------
/** Grid size and height cap: the lot is 36 x 96, the top course is y 45. */
export const SITE = { x: 36, y: 46, z: 96, yCap: 45 };
/** Dome axis in continuous coordinates (between cells 19|20 and 47|48); the building is symmetric about z = 47.5. */
export const DOME_AXIS = { x: 20, z: 48 };
/** Mirror plane of the building in z: a z maps to MIRROR_Z - z. */
export const MIRROR_Z = 95;
/** Ground course g at (x, z): the first course a column is built on (plan.md SITE: 0 west, 2 east). */
export const G = (x, z) => (x < 12 ? 0 : x < 24 ? 1 : 2);
/** Level courses (plan.md SITE): podium top, main floor, principal and upper storeys, entablature, balustrade, decks. */
export const LEVELS = { podiumTop: 4, mainFloor: 5, principalTop: 8, upperTop: 10, entablature: 11, balustrade: 12, deck: 12 };
/** The main masses as box ranges, inclusive (plan.md SITE table): x0..x1, z0..z1, top course y. */
export const MASS = {
  senateWing: { x0: 3, x1: 34, z0: 2, z1: 18, top: 12 },
  houseWing: { x0: 3, x1: 34, z0: 77, z1: 93, top: 12 },
  northConnector: { x0: 15, x1: 27, z0: 19, z1: 25, top: 12 },
  southConnector: { x0: 15, x1: 27, z0: 70, z1: 76, top: 12 },
  centralBlock: { x0: 10, x1: 29, z0: 26, z1: 69, top: 12 },
  eastPortico: { x0: 30, x1: 32, z0: 41, z1: 54, top: 15 },
  westFrontPodium: { x0: 0, x1: 9, z0: 41, z1: 54, top: 4 },
  westFrontLoggia: { x0: 8, x1: 9, z0: 41, z1: 54, top: 12 },
  domeBase: { x0: 11, x1: 28, z0: 39, z1: 56, top: 14 },
};
/** Dome shell courses (plan.md SITE): [y, outer diameter] for y26..y33, bell profile. */
export const DOME_SHELL = [[26, 12], [27, 12], [28, 12], [29, 10], [30, 10], [31, 8], [32, 6], [33, 4]];
/** Statue of Freedom: pedestal at y38, figure y39..41 at (x 19, z 47). */
export const STATUE = { x: 19, z: 47, pedestalY: 38, topY: 41 };

// ---- palette (palette.json ids only) ------------------------------------------------------------------------------
/** Wall body, all masses and the dome base (smooth_quartz). */
export const WALL = "smooth_quartz";
/** Stairs of the wall body: pediment rakes, shell edges, the dome's stepped courses. */
export const WALL_STAIRS = "smooth_quartz_stairs";
/** Slab of the wall body: entablature cornices, sill band, dome cornice course. */
export const WALL_SLAB = "smooth_quartz_slab";
/** Rusticated basement, podium and arcade face (quartz_bricks). */
export const RUSTIC = "quartz_bricks";
/** Columns, pilasters and corner piers (quartz_pillar, axis y). */
export const PILLAR = "quartz_pillar";
/** Drum wall behind the peristyle and the cupola drums (calcite). */
export const DRUM = "calcite";
/** Balustrades on every roofline, terrace and dome (diorite_wall). */
export const BALUSTRADE = "diorite_wall";
/** Ornament panels and the pediment tympanum centre (chiseled_quartz_block). */
export const ORNAMENT = "chiseled_quartz_block";
/** Shadow trim: window lintels, dome ribs, statue pedestal (polished_diorite). */
export const TRIM = "polished_diorite";
/** Stairs of the shadow trim: the upside-down window lintels, stepped rib edges. */
export const TRIM_STAIRS = "polished_diorite_stairs";
/** Slab of the shadow trim. */
export const TRIM_SLAB = "polished_diorite_slab";
/** Decks, terraces, portico floors and landings (smooth_stone_slab, bottom). */
export const DECK_SLAB = "smooth_stone_slab";
/** Skylight curbs (polished_andesite). */
export const CURB = "polished_andesite";
/** Cupola caps (oxidized_cut_copper). */
export const COPPER = "oxidized_cut_copper";
/** Cupola cap ring (oxidized_cut_copper_stairs). */
export const COPPER_STAIRS = "oxidized_cut_copper_stairs";
/** Cupola cap slab (oxidized_cut_copper_slab). */
export const COPPER_SLAB = "oxidized_cut_copper_slab";
/** Window glass panes (gray_stained_glass_pane). */
export const PANE = "gray_stained_glass_pane";
/** Skylight glass (glass). */
export const GLASS = "glass";
/** Hidden warm light behind panes, under skylights, in the lantern core (glowstone). */
export const GLOWSTONE = "glowstone";
/** Warm light in the arcade recesses (shroomlight). */
export const SHROOMLIGHT = "shroomlight";
/** Visible lamps, hanging or standing (lantern). */
export const LANTERN = "lantern";
/** Doors, read as bronze (dark_oak_door). */
export const DOOR = "dark_oak_door";
/** Statue figure (polished_blackstone). */
export const STATUE_BLOCK = "polished_blackstone";
/** Statue top cell at y41 (polished_blackstone_wall). */
export const STATUE_WALL = "polished_blackstone_wall";
/** Unseen interior core (smooth_stone). */
export const CORE = "smooth_stone";
/** Lantern chains (chain: iron_chain is not in 1.21.1). */
export const CHAIN = "chain";
/** Extra white ornament (white_concrete). */
export const WHITE = "white_concrete";

// ---- rng ----------------------------------------------------------------------------------------------------------
/** Seeded PRNG (mulberry32): rng(seed)() returns a float in [0, 1); the same seed gives the same sequence. */
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
