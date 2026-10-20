// Shared constants for the Rockefeller Center plaza parts: palette ids (palette.json), plan.md site coordinates, rng.

// Grid size [x, y, z]: plot 0 x 0..50 and plot 1 x 55..108 (z 0..53 and 0..15), y 0..22; plot 1 keeps its own y 0 datum
export const SITE = [109, 23, 54];
export const PLOT0 = { x0: 0, x1: 50, z0: 0, z1: 53 };  // Rockefeller Plaza and the Sunken Lower Plaza
export const PLOT1 = { x0: 55, x1: 108, z0: 0, z1: 15 };  // the Channel Gardens
export const PROMENADE_Y = 4;  // promenade surface; you stand at 5
export const WELL = { x0: 20, x1: 45, z0: 10, z1: 45 };  // sunken lower plaza, floor surface y 0
export const RINK = { x0: 24, x1: 39, z0: 14, z1: 41 };  // ice rink, packed ice at y 0
export const RINK_RIM_Y = 1;  // white rim ring around the rink
export const RINK_GATE = { x: 40, z0: 25, z1: 28 };  // rim gap onto the stairs
export const STAIR_HEAD = { x0: 42, x1: 47, z0: 20, z1: 33, landingX: 48 };  // Channel Gardens steps; landing at y 4
export const PROMETHEUS_WALL = { x0: 18, x1: 19, z0: 18, z1: 37, top: 10 };  // dark wall; x 19 is its east face
export const BASIN = { x0: 20, x1: 22, z0: 20, z1: 35 };  // Prometheus basin: floor y 0, water y 1
export const MOUNT = { x0: 20, x1: 22, z0: 26, z1: 29 };  // gilded mount, in the basin
export const GOLD_RING = { x: 21, y0: 2, y1: 9, z0: 24, z1: 31 };  // vertical gold ring, plane x 21
export const ZODIAC = { y: 5.5, z: 27.5, radius: 4.5 };  // zodiac ring centre and radius on the wall face
export const INSCRIPTION_Y = 9;  // inscription band row on the wall face
export const CASCADE_LEDGE_Y = 5;  // cascade ledge slab; water source on it at y 6
export const ROAD = { x0: 4, x1: 12, z0: 0, z1: 53 };  // Rockefeller Plaza roadway
export const ROAD_Y = { north: 5, south: 4, rampZ0: 20, rampZ1: 21 };  // road surface: 5 north of z 19, 4 south of z 22
export const CROSSWALK_Z = { north: [2, 4], south: [49, 51] };  // crosswalk bands on the road
export const RESTAURANTS = { x0: 22, x1: 43, northZ: 9, southZ: 46, doorX: [32, 33] };  // glass fronts and double doors
export const DINING = { x0: 20, x1: 41, north: { z0: 10, z1: 12 }, south: { z0: 43, z1: 45 } };  // terraces, floor y 0
export const UMBRELLAS = [[25, 11], [30, 11], [35, 11], [25, 44], [30, 44], [35, 44]];  // [x, z] umbrella centres
export const FLAG_RING = { base: 5, top: 11, north: 7, south: 48, west: 17, east: 48, spacing: 2 };  // flagpole lines
export const LAMPS_PLOT0 = { xs: [2, 14], zs: [5, 15, 25, 35, 45] };  // lamp posts on plot 0 (ground surface + 1..5)
export const LAMPS_PLOT1 = { xs: [58, 66, 74, 82, 90, 98, 106], zs: [2, 13] };  // lamp posts on plot 1

// Plot 1 ground levels (y 0 = lowest ground at the west end), by x range
export const PLOT1_LEVELS = [{ x0: 55, x1: 74, g: 0 }, { x0: 75, x1: 96, g: 1 }, { x0: 97, x1: 108, g: 2 }];
// Channel Gardens pools: rim at g+1, prismarine floor at g, water 4 long x 2 wide at z 7..8
export const POOLS = [
  { name: "P1", x0: 59, x1: 64, g: 0 }, { name: "P2", x0: 67, x1: 72, g: 0 }, { name: "P3", x0: 75, x1: 80, g: 1 },
  { name: "P4", x0: 83, x1: 88, g: 1 }, { name: "P5", x0: 91, x1: 96, g: 1 }, { name: "P6", x0: 99, x1: 104, g: 2 },
];
export const PLANTER_Z = { north: [4, 5], south: [10, 11] };  // planter curb rows on plot 1
export const WALKS_Z = { north: [0, 3], south: [12, 15] };  // walks on plot 1
export const CROSSWALK_X = [65, 73, 81, 89, 97];  // open crosswalks on plot 1 (two cells each, walk to walk)

// Seeded rng(seed): a function returning floats in [0, 1); the same seed gives the same sequence (mulberry32).
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

// Palette: fill and ground
export const STONE = "stone";  // fill under all ground
export const SMOOTH_STONE = "smooth_stone";  // promenade and walk field, curbs
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";  // curbs, crosswalk stripes, bench seats
export const POLISHED_ANDESITE = "polished_andesite";  // granite bands, borders, parapets, piers, steps, rims
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";  // half steps and slab caps
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";  // benches
export const ANDESITE_WALL = "andesite_wall";  // parapet posts and lamp-free wall posts (not polished_andesite_wall)
export const IRON_BARS = "iron_bars";  // railing between parapet posts
export const GRAY_CONCRETE = "gray_concrete";  // road
// Palette: dark stone (Prometheus wall, fountain rim)
export const POLISHED_BLACKSTONE_BRICKS = "polished_blackstone_bricks";  // Prometheus wall body
export const DEEPSLATE_TILES = "deepslate_tiles";  // Prometheus wall panels
export const POLISHED_BLACKSTONE = "polished_blackstone";  // wall base, fountain rim, planter curb
export const POLISHED_BLACKSTONE_SLAB = "polished_blackstone_slab";  // fountain rim cap
export const CHISELED_POLISHED_BLACKSTONE = "chiseled_polished_blackstone";  // zodiac sign marks
// Palette: gold and fire
export const GOLD_BLOCK = "gold_block";  // statue gilding, gold ring, mount, zodiac ring
export const RAW_GOLD_BLOCK = "raw_gold_block";  // statue modelling, inscription band
export const YELLOW_TERRACOTTA = "yellow_terracotta";  // statue accent
// Palette: water, rink, glass
export const WATER = "water";  // basin, pools, jets
export const PACKED_ICE = "packed_ice";  // rink surface
export const WHITE_CONCRETE = "white_concrete";  // rink rim
export const GLASS_PANE = "glass_pane";  // restaurant glass
// Palette: birch (umbrellas, door, tables)
export const BIRCH_FENCE = "birch_fence";  // umbrella poles, table legs
export const BIRCH_DOOR = "birch_door";  // restaurant double doors
export const BIRCH_PRESSURE_PLATE = "birch_pressure_plate";  // restaurant table tops
// Palette: pool floor, planters, flags
export const PRISMARINE_BRICKS = "prismarine_bricks";  // pool floors
export const GRASS_BLOCK = "grass_block";  // planter soil
export const MOSS_BLOCK = "moss_block";  // planter soil
export const RED_WOOL = "red_wool";  // flag colour
export const WHITE_WOOL = "white_wool";  // flag colour, umbrella canopies
export const BLUE_WOOL = "blue_wool";  // flag colour
export const GREEN_WOOL = "green_wool";  // flag colour
export const YELLOW_WOOL = "yellow_wool";  // flag colour
export const BLACK_WOOL = "black_wool";  // flag colour
export const ORANGE_WOOL = "orange_wool";  // flag colour
export const LIGHT_BLUE_WOOL = "light_blue_wool";  // flag colour
// Palette: decor objects (fixtures, light, plants)
export const LANTERN = "lantern";  // lamp heads, parapet and rim lanterns, umbrella lanterns
export const CANDLE = "candle";  // lit candles on restaurant tables
export const OCHRE_FROGLIGHT = "ochre_froglight";  // restaurant ceiling glow
export const SHROOMLIGHT = "shroomlight";  // the fire in Prometheus's hand
export const END_ROD = "end_rod";  // flagpoles
export const WAXED_EXPOSED_COPPER = "waxed_exposed_copper";  // bronze fountain jets
export const AZALEA = "azalea";  // clipped shrubs
export const FLOWERING_AZALEA = "flowering_azalea";  // clipped shrubs
export const AZALEA_LEAVES = "azalea_leaves";  // shrub leaves
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves";  // shrub leaves
export const OAK_LEAVES = "oak_leaves";  // shrub leaves (persistent)
export const ALLIUM = "allium";  // flowers
export const RED_TULIP = "red_tulip";  // flowers
export const ORANGE_TULIP = "orange_tulip";  // flowers
export const PINK_TULIP = "pink_tulip";  // flowers
export const WHITE_TULIP = "white_tulip";  // flowers
export const PEONY = "peony";  // flowers
export const ROSE_BUSH = "rose_bush";  // flowers
export const LILAC = "lilac";  // flowers
export const CORNFLOWER = "cornflower";  // flowers
export const OXEYE_DAISY = "oxeye_daisy";  // flowers
export const POLISHED_BLACKSTONE_WALL = "polished_blackstone_wall";  // lamp posts (both plots)
