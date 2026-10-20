// Palette ids (palette.json), plan.md's site coordinates (kit frame), footprint and ground lookups, and a seeded rng.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

// ---- palette: every id in palette.json, named (1.21.1) ----------------------------------------------------------
// pier deck, pilings, timber trim
export const SPRUCE_PLANKS = "spruce_planks";
export const STRIPPED_SPRUCE_LOG = "stripped_spruce_log";
export const DARK_OAK_PLANKS = "dark_oak_planks";
export const DARK_OAK_STAIRS = "dark_oak_stairs";
export const DARK_OAK_SLAB = "dark_oak_slab";
export const DARK_OAK_FENCE = "dark_oak_fence";
export const DARK_OAK_DOOR = "dark_oak_door";
export const DARK_OAK_TRAPDOOR = "dark_oak_trapdoor";
// shed walls and roof
export const BIRCH_PLANKS = "birch_planks";
export const DEEPSLATE_TILES = "deepslate_tiles";
export const DEEPSLATE_TILE_SLAB = "deepslate_tile_slab";
export const DEEPSLATE_TILE_STAIRS = "deepslate_tile_stairs";
export const POLISHED_DEEPSLATE = "polished_deepslate";
export const POLISHED_DEEPSLATE_SLAB = "polished_deepslate_slab";
export const POLISHED_DEEPSLATE_STAIRS = "polished_deepslate_stairs";
export const POLISHED_DEEPSLATE_WALL = "polished_deepslate_wall";
// aquarium concrete, decks, plinth
export const SMOOTH_SANDSTONE = "smooth_sandstone";
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";
export const CUT_SANDSTONE = "cut_sandstone";
export const CUT_SANDSTONE_SLAB = "cut_sandstone_slab";
export const SMOOTH_STONE = "smooth_stone";
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";
export const STONE_BRICKS = "stone_bricks";
// glass and mullions
export const GLASS = "glass";
export const GLASS_PANE = "glass_pane";
export const LIGHT_BLUE_STAINED_GLASS = "light_blue_stained_glass";
export const LIGHT_BLUE_STAINED_GLASS_PANE = "light_blue_stained_glass_pane";
export const SMOOTH_QUARTZ = "smooth_quartz";
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";
// floor bands, murals, sign board
export const WHITE_CONCRETE = "white_concrete";
export const BLUE_CONCRETE = "blue_concrete";
export const BLACK_CONCRETE = "black_concrete";
export const CYAN_TERRACOTTA = "cyan_terracotta";
export const LIGHT_BLUE_TERRACOTTA = "light_blue_terracotta";
export const YELLOW_TERRACOTTA = "yellow_terracotta";
export const PRISMARINE_BRICKS = "prismarine_bricks";
export const PRISMARINE_BRICK_STAIRS = "prismarine_brick_stairs";
export const PRISMARINE_BRICK_SLAB = "prismarine_brick_slab";
// brick base, awnings, rails
export const BRICKS = "bricks";
export const BRICK_STAIRS = "brick_stairs";
export const WARPED_STAIRS = "warped_stairs";
export const WARPED_SLAB = "warped_slab";
export const SPRUCE_FENCE = "spruce_fence";
export const IRON_BARS = "iron_bars";
// lights, planting, water
export const LANTERN = "lantern";
export const SHROOMLIGHT = "shroomlight";
export const PEARLESCENT_FROGLIGHT = "pearlescent_froglight";
export const END_ROD = "end_rod";
export const SEA_LANTERN = "sea_lantern";
export const CANDLE = "candle";
export const CHAIN = "chain";
export const OAK_LEAVES = "oak_leaves";
export const AZALEA_LEAVES = "azalea_leaves";
export const OAK_LOG = "oak_log";
export const WATER = "water";
// spruce trim and fittings
export const SPRUCE_SLAB = "spruce_slab";
export const SPRUCE_STAIRS = "spruce_stairs";
export const SPRUCE_DOOR = "spruce_door";
export const SPRUCE_TRAPDOOR = "spruce_trapdoor";
export const SPRUCE_WALL_SIGN = "spruce_wall_sign";
export const HAY_BLOCK = "hay_block";
export const BARREL = "barrel";

// ---- site: plan.md's coordinates, kit frame (no turning) --------------------------------------------------------
/** The whole site: grid size [x, y, z] and the 1.21.1 DataVersion. */
export const SITE = { size: [310, 42, 172], dataVersion: 3955 };
/** The four plots: kit-frame x0..x1 and z0..z1; the footprint and ground maps (site.json) are per plot. */
export const PLOTS = {
  0: { name: "Pier 59", x0: 0, x1: 119, z0: 0, z1: 171 },
  1: { name: "Bay Wing", x0: 124, x1: 172, z0: 0, z1: 94 },
  2: { name: "Waterfront Landings North", x0: 177, x1: 242, z0: 0, z1: 110 },
  3: { name: "Waterfront Landings South", x0: 247, x1: 309, z0: 0, z1: 102 },
};
/** Deck levels: pier deck y3 (ground-level planks), pier floor and aquarium floors y4, landings shops y1. */
export const LEVELS = { deck: 3, floor: 4, landingsShop: 1 };
/** Pier 59 shed: d = x - z in [dLo, dHi], s = x + z in [sLo, sHi]; walls y4..17, roof y17..26, ridge d = ridgeD. */
export const SHED = { dLo: -40, dHi: -14, sLo: 100, sHi: 243, wallTop: 17, roofTop: 26, ridgeD: -27, eaveY: 18, eaveE: 14 };
/** Entrance pavilion (modern glass), axis-aligned: y4..16 walls, flat roof y17, parapet y18. */
export const PAVILION = { x0: 100, x1: 117, z0: 131, z1: 151, roofY: 17, parapetY: 18 };
/** Low dock lobe on plot 0: deck y2, posts to ground; 2-wide slab ramp at x44..45, z30..33. */
export const LOW_DOCK = { x0: 44, x1: 67, z0: 12, z1: 43, deckY: 2, ramp: { x0: 44, x1: 45, z0: 30, z1: 33 } };
/** Raised seal and tide pools on the bay end of plot 0: rim y4..5, water y4..5 inside. */
export const SEAL_POOL = { rim: { x0: 8, x1: 19, z0: 24, z1: 35 }, water: { x0: 9, x1: 18, z0: 25, z1: 34 } };
export const TIDE_POOL = { rim: { x0: 24, x1: 35, z0: 38, z1: 47 }, water: { x0: 25, x1: 34, z0: 39, z1: 46 } };
/** Planters on plot 0: 3x3 boxes, given as [x, z] of the NW corner; rim y4, tree to y9. */
export const PLANTERS = [[4, 8], [30, 16], [14, 42], [60, 92], [84, 116]];
/** Bay Wing (plot 1) halls: kit-frame boxes and roof deck y. Court x136..155, z12..29 stays empty. */
export const BAY_HALLS = {
  N: { x0: 128, x1: 169, z0: 8, z1: 11, roofY: 11 },
  W: { x0: 128, x1: 133, z0: 12, z1: 29, roofY: 11 },
  E: { x0: 156, x1: 171, z0: 12, z1: 29, roofY: 11 },
  S: { x0: 128, x1: 171, z0: 30, z1: 39, roofY: 11 },
  Stail: { x0: 136, x1: 171, z0: 40, z1: 43, roofY: 8 },
  Link: { x0: 156, x1: 173, z0: 44, z1: 61, roofY: 8 },
};
/** Bay Wing dome hall: the footprint cells of z62..93, floor y4, walls y4..9, roof deck y10. */
export const DOME_HALL = { z0: 62, z1: 93, floorY: 4, wallTop: 9, roofY: 10 };
/** Glass underwater dome: hemisphere centre, radius; occupies x138..154, z72..88, y10..18. */
export const DOME = { cx: 146, cy: 10, cz: 80, r: 8 };
/** Bay Wing pools on the roofs: otter on Hall E, seal on Hall S; rim y12..13, water inside. */
export const OTTER_POOL = { x0: 158, x1: 169, z0: 14, z1: 27, rimY: 12 };
export const BAY_SEAL_POOL = { x0: 134, x1: 149, z0: 31, z1: 38, rimY: 12 };
/** Landings masses (kit frame): storeys, roof slab y. Penthouses roof at y27..29, flat cap y30. */
export const LANDINGS = [
  { plot: 2, name: "A north street", x0: 221, x1: 239, z0: 12, z1: 38, storeys: 6, roofY: 26 },
  { plot: 2, name: "B1 north mid", x0: 198, x1: 220, z0: 12, z1: 38, storeys: 5, roofY: 22 },
  { plot: 2, name: "B2 north bay end", x0: 180, x1: 197, z0: 12, z1: 38, storeys: 4, roofY: 18 },
  { plot: 2, name: "C spine", x0: 231, x1: 239, z0: 39, z1: 74, storeys: 4, roofY: 18 },
  { plot: 2, name: "D south street", x0: 221, x1: 239, z0: 75, z1: 104, storeys: 6, roofY: 26 },
  { plot: 2, name: "E1 south mid", x0: 198, x1: 220, z0: 75, z1: 104, storeys: 5, roofY: 22 },
  { plot: 2, name: "E2 south bay end", x0: 183, x1: 197, z0: 75, z1: 104, storeys: 4, roofY: 18 },
  { plot: 2, name: "penthouse on A", x0: 227, x1: 235, z0: 18, z1: 30, penthouse: true },
  { plot: 2, name: "penthouse on D", x0: 227, x1: 235, z0: 83, z1: 95, penthouse: true },
  { plot: 3, name: "A north street", x0: 291, x1: 309, z0: 9, z1: 35, storeys: 6, roofY: 26 },
  { plot: 3, name: "B1 north mid", x0: 268, x1: 290, z0: 9, z1: 35, storeys: 5, roofY: 22 },
  { plot: 3, name: "B2 north bay end", x0: 250, x1: 267, z0: 9, z1: 35, storeys: 4, roofY: 18 },
  { plot: 3, name: "C spine", x0: 301, x1: 306, z0: 36, z1: 65, storeys: 4, roofY: 18 },
  { plot: 3, name: "D south street", x0: 289, x1: 303, z0: 69, z1: 86, storeys: 6, roofY: 26 },
  { plot: 3, name: "E1 south mid", x0: 268, x1: 288, z0: 69, z1: 89, storeys: 5, roofY: 22 },
  { plot: 3, name: "E2 south bay end", x0: 250, x1: 267, z0: 69, z1: 89, storeys: 4, roofY: 18 },
  { plot: 3, name: "E3 south tail", x0: 274, x1: 300, z0: 87, z1: 95, storeys: 4, roofY: 18 },
  { plot: 3, name: "penthouse on A", x0: 296, x1: 304, z0: 15, z1: 27, penthouse: true },
  { plot: 3, name: "penthouse on D", x0: 292, x1: 300, z0: 72, z1: 82, penthouse: true },
];
/** Shop-street corner bays (kit frame x, z range): wrap 3 cells round the corner. */
export const CORNER_BAYS = [
  { x: 239, z0: 13, z1: 17 }, { x: 239, z0: 33, z1: 37 }, { x: 239, z0: 76, z1: 80 }, { x: 239, z0: 99, z1: 103 },
  { x: 309, z0: 10, z1: 14 }, { x: 309, z0: 30, z1: 34 }, { x: 303, z0: 70, z1: 74 }, { x: 303, z0: 81, z1: 85 },
];
/** Residential entries: a 3-wide glass door at the centre of each spine. */
export const SPINE_ENTRIES = { 2: { x: 239, z0: 55, z1: 57 }, 3: { x: 306, z0: 49, z1: 51 } };

// ---- footprint and ground (site.json, from the brief's maps) ----------------------------------------------------
const SITE_MAP = JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), "..", "site.json"), "utf8"));

/** Ground value g of kit cell (x, z): the y of its surface block (build the floor at g; fill down to it). null off the footprint. */
export function groundAt(x, z) {
  for (const p of SITE_MAP.plots) {
    const lx = x - p.x0, lz = z - p.z0;
    if (lx < 0 || lz < 0 || lx >= p.w || lz >= p.d) continue;
    const c = Math.floor(lx / p.cell), r = Math.floor(lz / p.cell);
    return p.footprint[r][c] === "#" ? p.ground[r][c] : null;
  }
  return null;
}
/** True when kit cell (x, z) is a footprint (#) cell: build only on these. */
export const onFootprint = (x, z) => groundAt(x, z) !== null;

// ---- seeded rng ---------------------------------------------------------------------------------------------------
/** rng(seed) returns a function giving floats in [0, 1); the same seed gives the same sequence (mulberry32). */
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
