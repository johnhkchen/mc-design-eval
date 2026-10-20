// Shared constants for the South Mall kit: palette ids (palette.json only), plan.md's site coordinates, and a seeded rng.
// Coordinates are in the kit frame (x along the Mall, east = high x; north = low z), as plan.md's SITE table gives them.

// ---- site -------------------------------------------------------------------------------------------------------------
/** Grid size [x, y, z] for the whole kit: x0..169, y0..27, z0..41. */
export const SITE_SIZE = [170, 28, 42];
/** Lowest course of the terrain under every plot (the ground layer is laid here). */
export const GROUND_Y = 0;
/** Plot boxes (inclusive) from the SITE table. Plot 1's lowest course is y1; its footings reach y0 in the SE corner. */
export const PLOTS = {
  castle: { x0: 0, x1: 56, z0: 0, z1: 20, y0: 0, y1: 27, ground: 0 },
  ai: { x0: 61, x1: 102, z0: 0, z1: 41, y0: 0, y1: 22, ground: 1 },
  freer: { x0: 107, x1: 136, z0: 0, z1: 25, y0: 0, y1: 16, ground: 0 },
  hirshhorn: { x0: 141, x1: 169, z0: 0, z1: 30, y0: 0, y1: 19, ground: 0 },
};
/** Entrances: [x, y, z] of the door's floor cell; the street cell is the one just north of it (z - 1). */
export const ENTRANCE = {
  castle: [26, 0, 1],
  ai: [81, 1, -1],
  freer: [121, 0, 1],
  hirshhorn: [155, 0, 3],
};

// ---- Castle (plot 0) --------------------------------------------------------------------------------------------------
/** Flagpole column: end_rod x29 z6 y19..22. */
export const CASTLE_FLAGPOLE = { x: 29, z: 6, y0: 19, y1: 22 };
/** Tower shafts T1..T9 from the masses table: x0, x1, z0, z1 (inclusive), wall top y (the parapet or spire base). */
export const CASTLE_TOWERS = {
  T1: { x0: 23, x1: 30, z0: 3, z1: 8, top: 15 },
  T2: { x0: 28, x1: 30, z0: 5, z1: 7, top: 18 },
  T3: { x0: 39, x1: 42, z0: 7, z1: 10, top: 14, chamfer: 1 },
  T4: { x0: 12, x1: 15, z0: 7, z1: 10, top: 12 },
  T5: { x0: 9, x1: 11, z0: 8, z1: 10, top: 12 },
  T6: { x0: 2, x1: 4, z0: 6, z1: 8, top: 10 },
  T7: { x0: 52, x1: 54, z0: 6, z1: 8, top: 12 },
  T8: { x0: 25, x1: 28, z0: 13, z1: 16, top: 11, chamfer: 1 },
  T9: { x0: 25, x1: 28, z0: 17, z1: 20, top: 13, chamfer: 1 },
};

// ---- Arts & Industries (plot 1) ---------------------------------------------------------------------------------------
/** Axes of the Greek cross: the N-S nave is on x81, the E-W nave on z20. */
export const AI_AXES = { x: 81, z: 20 };
/** Lantern box x80..82 z19..21, y19..20 glass, slab cap y21, finial y22; shroomlight core at (81, 19, 20). */
export const AI_LANTERN = { x0: 80, x1: 82, z0: 19, z1: 21, y0: 19, y1: 22, core: [81, 19, 20] };
/** Rotunda (octagon, chamfer 4) x74..88 z13..27, drum (chamfer 3) x76..86 z15..25. */
export const AI_ROTUNDA = { x0: 74, x1: 88, z0: 13, z1: 27, chamfer: 4 };
export const AI_DRUM = { x0: 76, x1: 86, z0: 15, z1: 25, chamfer: 3 };

// ---- Freer (plot 2) ---------------------------------------------------------------------------------------------------
/** The open court x117..125 z11..18 (the fountain and trees sit in it). */
export const FREER_COURT = { x0: 117, x1: 125, z0: 11, z1: 18 };
/** Court fountain: water x120..122 z14..15 at y0, rim ring x119..123 z13..16. */
export const FREER_FOUNTAIN = { cx: 121, cz: 14.5, rim: { x0: 119, x1: 123, z0: 13, z1: 16 }, water: { x0: 120, x1: 122, z0: 14, z1: 15 } };
/** Court trees: oak log at these cells, crowns of radius 1 at y3..4. */
export const FREER_TREES = [[118, 12], [124, 12], [118, 17], [124, 17]];

// ---- Hirshhorn (plot 3) -----------------------------------------------------------------------------------------------
/** Drum centre; outer radius 14.5 (the footprint circle), inner radius 7.5 (the court hole). */
export const HIRSHHORN = { cx: 155, cz: 15, rOut: 14.5, rIn: 7.5, deckY: 10, soffitY: 3, balconyY: 8 };
/** Curved piers: arcs between radius 9 and 12, on the four diagonals, each spanning ±20°, at y0..2. */
export const HIRSHHORN_PIER_ANGLES = [45, 135, 225, 315];
/** Plaza low wall gaps: x153..157 (north and south), z13..17 (west and east). */
export const HIRSHHORN_WALL_GAPS = { ns: { x0: 153, x1: 157 }, ew: { z0: 13, z1: 17 } };
/** Sculptures: [x, z, height] (1x1 or 2x1 columns, polished_blackstone and basalt). */
export const HIRSHHORN_SCULPTURES = [[143, 2, 3], [167, 2, 2], [143, 28, 2], [166, 28, 3]];

// ---- rng ----------------------------------------------------------------------------------------------------------------
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

// ---- palette (palette.json ids, bare names) -----------------------------------------------------------------------------
// Castle
export const RED_TERRACOTTA = "red_terracotta";
export const POLISHED_GRANITE = "polished_granite";
export const POLISHED_GRANITE_STAIRS = "polished_granite_stairs";
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";
export const RED_NETHER_BRICKS = "red_nether_bricks";
export const RED_NETHER_BRICK_STAIRS = "red_nether_brick_stairs";
export const RED_NETHER_BRICK_SLAB = "red_nether_brick_slab";
export const RED_NETHER_BRICK_WALL = "red_nether_brick_wall";
export const DEEPSLATE_TILES = "deepslate_tiles";
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";
// Arts & Industries
export const BRICKS = "bricks";
export const BRICK_STAIRS = "brick_stairs";
export const YELLOW_TERRACOTTA = "yellow_terracotta";
export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta";
export const ORANGE_TERRACOTTA = "orange_terracotta";
export const POLISHED_ANDESITE = "polished_andesite";
export const STONE_BRICKS = "stone_bricks";
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
export const STONE_BRICK_SLAB = "stone_brick_slab";
export const ANDESITE_STAIRS = "andesite_stairs";
export const ANDESITE_SLAB = "andesite_slab";
export const GLASS_PANE = "glass_pane";
// Freer
export const WHITE_TERRACOTTA = "white_terracotta";
export const POLISHED_DIORITE = "polished_diorite";
export const POLISHED_DIORITE_STAIRS = "polished_diorite_stairs";
export const POLISHED_DIORITE_SLAB = "polished_diorite_slab";
export const SMOOTH_STONE = "smooth_stone";
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
// Hirshhorn
export const SMOOTH_SANDSTONE = "smooth_sandstone";
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";
export const BLACK_STAINED_GLASS_PANE = "black_stained_glass_pane";
export const POLISHED_BLACKSTONE = "polished_blackstone";
export const BASALT = "basalt";
// Ground and plants
export const GRASS_BLOCK = "grass_block";
export const GRAVEL = "gravel";
export const PODZOL = "podzol";
export const WATER = "water";
export const OAK_LOG = "oak_log";
export const OAK_LEAVES = "oak_leaves";
export const POPPY = "poppy";
export const AZURE_BLUET = "azure_bluet";
export const DANDELION = "dandelion";
// Light and fittings
export const SHROOMLIGHT = "shroomlight";
export const OCHRE_FROGLIGHT = "ochre_froglight";
export const LANTERN = "lantern";
export const LIGHTNING_ROD = "lightning_rod";
export const END_ROD = "end_rod";
