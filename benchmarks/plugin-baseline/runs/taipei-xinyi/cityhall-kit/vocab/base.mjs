// Shared constants for Taipei City Hall (plot 0): site coordinates, the 1.21.1 palette, and a seeded rng.
// Every part imports from here. Local coordinates: x 0..202, y 0..80, z 0..374. Map cell (row r, column c) covers
// z 9r..9r+8 and x 9c..9c+8 (from plan.md SITE and brief.txt).

// ---- site ----------------------------------------------------------------------------------------------------------
/** Grid size [x, y, z] of the whole plot: nothing leaves it. */
export const SIZE = [203, 81, 375];
/** Highest y a block may take (nothing above y 80). */
export const TOP_Y = 80;
/** Map cell edge in blocks. */
export const CELL = 9;
/** Footprint map (brief.txt): '#' = build here, row r = z 9r..9r+8, column c = x 9c..9c+8. */
export const FOOTPRINT = [
  ".........#.............",
  ".........#.............",
  ".........#.............",
  ".........#####.........",
  "...###########.........",
  "...###########.........",
  "...###########.........",
  "....##########.........",
  "....##########.........",
  "....##########.........",
  "....##########.........",
  "....##########.........",
  "....##########.........",
  "...###################.",
  "..####################.",
  "...###################.",
  "...###################.",
  ".......########........",
  "######################.",
  "######################.",
  "######################.",
  "######################.",
  "######################.",
  "######################.",
  ".......########........",
  "...###################.",
  "...###################.",
  "..#####################",
  "....##########.........",
  "....##########.........",
  "....##########.........",
  "....##########.........",
  "....##########.........",
  "....##########.........",
  "....##########.........",
  "...###########.........",
  "...###########.........",
  "........######.........",
  ".........#####.........",
  ".........#.............",
  ".........#.............",
  ".........#.............",
];
/** Ground map (brief.txt): the highest ground above y 0 per cell, '.' = none. */
export const GROUND = [
  "........000............",
  "........000............",
  "........000............",
  "........1111111........",
  "..1111111111111........",
  "..1111111111111........",
  "..1111111111111........",
  "...111111111111........",
  "...111111111111........",
  "...111111111111........",
  "...111111111111........",
  "...111111111111........",
  "...111111111111........",
  "..222222222222222222222",
  "..222222222222222222222",
  "..22222222222222222222.",
  "..22222222222222222222.",
  "..2222222222222..22222.",
  "1122222222222222222222.",
  "1122222222222222222222.",
  "1122222222222222222222.",
  "1122222222222222222222.",
  "1122222222222222222222.",
  "1122222222222222222222.",
  "..22222222222222222222.",
  "..22222222222222222222.",
  "..222222222222222222222",
  "..222222222222222222222",
  "..222222222222222222222",
  "...222222222222........",
  "...222222222222........",
  "...222222222222........",
  "...222222222222........",
  "...222222222222........",
  "...222222222222........",
  "..2222222222222........",
  "..2222222222222........",
  "..2222222222222........",
  "........2222222........",
  "........222............",
  "........222............",
  "........222............",
];
/** Plinth top and ground-floor level (the spurs' ground floor is y 1). */
export const PLINTH_TOP = 2;
/** Wing parapet top (12 storeys); roof deck of the wings at y 62. */
export const WING_TOP = 64;
/** Tower parapet top (13 storeys); tower roof deck at y 67. */
export const TOWER_TOP = 69;
/** Crown penthouse (M7c) roof slab; its masts rise to y 79. */
export const CROWN_TOP = 74;
/** Office storey floors, y 7..57 (each storey is 5 blocks; the glass sits at f+2..f+3). */
export const STOREY_FLOORS = [7, 12, 17, 22, 27, 32, 37, 42, 47, 52, 57];
/** West main entrance (Shifu Road front): x of the doors, z span of the entrance hall. */
export const ENTRANCE_X = 18;
export const ENTRANCE_HALL_Z = [176, 201];
/** The four double doors on the west front: z pairs at x 18, y 2..4. */
export const MAIN_DOOR_Z = [[180, 181], [186, 187], [190, 191], [196, 197]];
/** West apron (x 0..17) z spans beside the portico: north, south. */
export const APRON_Z = [[162, 169], [208, 215]];
/** Courtyards and courts as [x0, x1, z0, z1] (plan.md COURTYARDS). */
export const COURTS = {
  CN: [56, 105, 55, 116], CS: [56, 105, 252, 314],
  CNE: [135, 179, 135, 152], CSE: [135, 179, 225, 232],
  CNW: [45, 62, 135, 152], CSW: [45, 62, 225, 232],
};
/** Fountain basins as [x0, x1, z0, z1], sunk 1 below the court surface (CN, CS). */
export const FOUNTAINS = { CN: [76, 85, 81, 90], CS: [76, 85, 278, 287] };
/** Flagpole columns (x) and the z of the north and south apron rows. */
export const FLAG_X = [4, 9, 14];
export const FLAG_Z = { north: 165, south: 212 };
/** Antenna masts on the crown (M7c): [x, z]. */
export const MASTS = [[83, 172], [114, 172], [83, 204], [114, 204]];
/** City emblem disc on the west face: centre (x, y, z) and radius. */
export const EMBLEM = { x: 17, y: 30, z: 188, r: 4 };

/** True if the block column at (x, z) stands on a footprint cell ('#'). */
export function onFootprint(x, z) {
  return FOOTPRINT[Math.floor(z / CELL)]?.[Math.floor(x / CELL)] === "#";
}

/** Ground height at (x, z): the grass surface sits at y = height, dirt below. -1 = no ground.
 *  The slots on rows 17 and 24 outside x 63..134 are not footprint and stay untouched (plan.md). */
export function groundAt(x, z) {
  const r = Math.floor(z / CELL), c = Math.floor(x / CELL);
  const ch = GROUND[r]?.[c];
  if (ch === undefined || ch === ".") return -1;
  if ((r === 17 || r === 24) && (c < 7 || c > 14)) return -1;
  return Number(ch);
}

/** Seeded PRNG (mulberry32): rng(seed)() returns floats in [0, 1); the same seed gives the same sequence. */
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

// ---- palette (1.21.1; every id here is in palette.json) ------------------------------------------------------------
export const smoothSandstone = "smooth_sandstone";                 // body: piers, parapets, tower faces
export const smoothSandstoneSlab = "smooth_sandstone_slab";       // string course
export const smoothSandstoneStairs = "smooth_sandstone_stairs";   // body variant
export const whiteTerracotta = "white_terracotta";                // spandrels, tower panels
export const cutSandstone = "cut_sandstone";                      // quoins, tower joint lines
export const smoothQuartz = "smooth_quartz";                      // coping, emblem disc, canopy
export const smoothQuartzSlab = "smooth_quartz_slab";             // coping and cornice line
export const smoothQuartzStairs = "smooth_quartz_stairs";         // coping variant
export const quartzPillar = "quartz_pillar";                      // portico columns, spur piers
export const polishedAndesite = "polished_andesite";              // plinth, paving, flagpole bases
export const polishedAndesiteSlab = "polished_andesite_slab";     // slab ramp
export const andesiteWall = "andesite_wall";                      // lamp posts
export const smoothStone = "smooth_stone";                        // ground-storey piers, lintels, floors
export const smoothStoneSlab = "smooth_stone_slab";               // roof decks
export const grayStainedGlass = "gray_stained_glass";             // office glass
export const lightBlueStainedGlass = "light_blue_stained_glass";  // lobby and entrance glass
export const grayStainedGlassPane = "gray_stained_glass_pane";    // glass pane variant
export const lightBlueStainedGlassPane = "light_blue_stained_glass_pane";
export const glassPane = "glass_pane";                            // door openings
export const blackConcrete = "black_concrete";                    // dark backing behind the glass
export const shroomlight = "shroomlight";                         // warm lit window
export const seaLantern = "sea_lantern";                          // cool lit window, lobby ceilings
export const ochreFroglight = "ochre_froglight";                  // warm crown light, floodlit course
export const pearlescentFroglight = "pearlescent_froglight";      // cool crown band
export const lantern = "lantern";                                 // roof and lamp lanterns
export const lightGrayConcrete = "light_gray_concrete";           // mechanical penthouses, plant boxes
export const ironBars = "iron_bars";                              // louvres, flagpoles, masts
export const blueConcrete = "blue_concrete";                      // emblem ring
export const yellowConcrete = "yellow_concrete";                  // emblem core
export const lightningRod = "lightning_rod";                      // mast tips, flagpole tips
export const redstoneTorch = "redstone_torch";                    // aircraft lights
export const redBanner = "red_banner";                            // national flags
export const whiteBanner = "white_banner";                        // city flags, name letters
export const blueBanner = "blue_banner";                          // national canton, name letters
export const grassBlock = "grass_block";                          // courtyard lawn
export const mossBlock = "moss_block";                            // planters, plant boxes
export const floweringAzaleaLeaves = "flowering_azalea_leaves";   // planters
export const oakLog = "oak_log";                                  // tree trunks
export const jungleLog = "jungle_log";                            // tree trunks
export const oakLeaves = "oak_leaves";                            // tree crowns (persistent)
export const jungleLeaves = "jungle_leaves";                      // tree crowns (persistent)
export const water = "water";                                     // fountain basins
export const dirtPath = "dirt_path";                              // court paths
export const ironDoor = "iron_door";                              // main and courtyard doors
export const dirt = "dirt";                                       // subsoil under the ground surface (build.mjs)
