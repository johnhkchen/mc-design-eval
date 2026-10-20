// Palette ids (palette.json only), plan.md site coordinates, and a seeded rng for the crissy-west build.

// ---- palette: plan.md PALETTE, one constant per block id ------------------------------------------------------------
/** White walls (plots 0, 2, 4, 6, 7, 8, 9). */
export const WHITE_CONCRETE = "white_concrete";
/** Sill, trim, quoin, frame and verge block. */
export const QUARTZ_BLOCK = "quartz_block";
/** Quartz bottom slab: sills, deck coping, C2 rail. */
export const QUARTZ_SLAB = "quartz_slab";
/** Quartz stairs: gable verges and barge boards. */
export const QUARTZ_STAIRS = "quartz_stairs";
/** Cream stucco (plots 1, 3). */
export const SMOOTH_SANDSTONE = "smooth_sandstone";
/** Cream stucco stairs: Mission arches (upside down) in the A2 arcade. */
export const SMOOTH_SANDSTONE_STAIRS = "smooth_sandstone_stairs";
/** Cream stucco slab. */
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
/** Cream string course (plot 1 storey line at y3). */
export const CUT_SANDSTONE = "cut_sandstone";
/** Plinth and base course (plots 1, 2, 4, 5, 6, 7, 8). */
export const STONE_BRICKS = "stone_bricks";
/** Plinth stairs. */
export const STONE_BRICK_STAIRS = "stone_brick_stairs";
/** Plinth slab. */
export const STONE_BRICK_SLAB = "stone_brick_slab";
/** Flag pole foot (plot 6). */
export const STONE_BRICK_WALL = "stone_brick_wall";
/** Plinth course on plots 0 and 3, and the grey roof mix. */
export const POLISHED_ANDESITE = "polished_andesite";
/** Green trim, door panels, awning. */
export const DARK_PRISMARINE = "dark_prismarine";
/** Green trim and awning stairs (facing south). */
export const DARK_PRISMARINE_STAIRS = "dark_prismarine_stairs";
/** Green trim slab (cupola band). */
export const DARK_PRISMARINE_SLAB = "dark_prismarine_slab";
/** Green shutters, open flat on the wall. */
export const WARPED_TRAPDOOR = "warped_trapdoor";
/** Grey roof mix (6 parts), stairs. */
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";
/** Grey roof ridge slab. */
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";
/** Grey roof mix (3 parts). */
export const ANDESITE = "andesite";
/** Grey roof mix stairs. */
export const ANDESITE_STAIRS = "andesite_stairs";
/** Grey roof mix (1 part). */
export const STONE = "stone";
/** Grey roof mix stairs. */
export const STONE_STAIRS = "stone_stairs";
/** Red roof palette (red-tile): bricks, brick stairs and slab. */
export const BRICKS = "bricks";
/** Red roof stairs. */
export const BRICK_STAIRS = "brick_stairs";
/** Red roof slab. */
export const BRICK_SLAB = "brick_slab";
/** Red roof palette (red-tile) mix. */
export const GRANITE = "granite";
/** Red roof palette (red-tile) mix. */
export const POLISHED_GRANITE = "polished_granite";
/** Red roof palette (red-tile) mix. */
export const MANGROVE_PLANKS = "mangrove_planks";
/** Red roof eave (red-tile). */
export const MUD_BRICKS = "mud_bricks";
/** Red roof eave stairs (red-tile). */
export const MUD_BRICK_STAIRS = "mud_brick_stairs";
/** Windows (connected panes). */
export const GLASS_PANE = "glass_pane";
/** Walk-in doors (both halves). */
export const SPRUCE_DOOR = "spruce_door";
/** Porch deck. */
export const BIRCH_PLANKS = "birch_planks";
/** Porch posts and rails. */
export const BIRCH_FENCE = "birch_fence";
/** Ground (y0) and the ground under the warehouse. */
export const SMOOTH_STONE = "smooth_stone";
/** Bottom door-step slab and paths. */
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
/** Lawns. */
export const GRASS_BLOCK = "grass_block";
/** Ground mix. */
export const COARSE_DIRT = "coarse_dirt";
/** Path replacement. */
export const DIRT_PATH = "dirt_path";
/** Hedges and tree crowns (persistent). */
export const OAK_LEAVES = "oak_leaves";
/** Tree trunks. */
export const OAK_LOG = "oak_log";
/** Flagpole (flag part). */
export const END_ROD = "end_rod";
/** Cupola ridge rod (plot 6). */
export const LIGHTNING_ROD = "lightning_rod";
/** Flag banner and sign banners (patterns set in NBT). */
export const WHITE_WALL_BANNER = "white_wall_banner";
/** Hanging and standing lanterns. */
export const LANTERN = "lantern";
/** Lamp posts and light fences. */
export const SPRUCE_FENCE = "spruce_fence";
/** Flower bed on the lawns. */
export const POPPY = "poppy";
/** Flower bed on the lawns. */
export const AZURE_BLUET = "azure_bluet";

// ---- site: plan.md SITE table (row coordinates, inclusive) -----------------------------------------------------------
/** Full site size [x, y, z]: x 0..155, y 0..10 (highest course: cupola lightning rod), z 0..38. */
export const SITE_SIZE = [156, 11, 39];
/** Ground course y (each plot's smooth_stone ground). */
export const GROUND_Y = 0;
/** First wall course y (the plinth row). */
export const WALL_Y = 1;
/** The nine plots: x and z ranges inclusive, cap = the highest block y allowed. */
export const PLOTS = [
  { id: 0, name: "warehouse", x: [0, 28], z: [0, 38], cap: 10 },
  { id: 1, name: "army admin", x: [29, 56], z: [0, 22], cap: 10 },
  { id: 2, name: "army housing", x: [57, 83], z: [0, 19], cap: 10 },
  { id: 3, name: "storehouse", x: [84, 97], z: [0, 35], cap: 9 },
  { id: 4, name: "office", x: [98, 107], z: [0, 10], cap: 8 },
  { id: 5, name: "bike shop", x: [108, 118], z: [0, 8], cap: 7 },
  { id: 6, name: "coast guard", x: [119, 131], z: [0, 11], cap: 10 },
  { id: 7, name: "OCC", x: [132, 139], z: [0, 7], cap: 8 },
  { id: 8, name: "garage", x: [140, 148], z: [0, 8], cap: 6 },
  { id: 9, name: "boathouse", x: [149, 155], z: [0, 7], cap: 6 },
];

// ---- seeded random -----------------------------------------------------------------------------------------------------
/** rng(seed): a function returning the next float in [0, 1) from a 32-bit seed (mulberry32; same seed, same sequence). */
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
