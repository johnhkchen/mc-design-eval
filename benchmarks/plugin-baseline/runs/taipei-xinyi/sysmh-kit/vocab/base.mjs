// Palette ids, plan.md site coordinates and a seeded rng, shared by every part. Ids are palette.json's (1.21.1);
// coordinates are plot-local, y 0 = ground course (people stand on y 1).

// ---- palette: one constant per palette.json id ----
export const YELLOW_CONCRETE = "yellow_concrete";                 // roof tile (60%)
export const YELLOW_TERRACOTTA = "yellow_terracotta";            // roof tile courses, every 3rd ring
export const OCHRE_FROGLIGHT = "ochre_froglight";                // roof lights set into the tiles
export const SMOOTH_STONE = "smooth_stone";                      // ridges, fascia, fins, beams, capitals
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";            // coping, brackets, dentils
export const STONE_STAIRS = "stone_stairs";                      // roof corner curls and fin flicks
export const STONE_BRICK_STAIRS = "stone_brick_stairs";          // stone-brick curls and steps
export const GOLD_BLOCK = "gold_block";                          // tips, name board frame, top-deck corners
export const QUARTZ_PILLAR = "quartz_pillar";                    // column shafts (axis y)
export const SMOOTH_QUARTZ = "smooth_quartz";                    // lobby floor, statue plinth
export const QUARTZ_SLAB = "quartz_slab";                        // chandelier ring, plinth slabs
export const QUARTZ_STAIRS = "quartz_stairs";                    // plinth steps
export const POLISHED_ANDESITE = "polished_andesite";            // podium body, column bases, paving
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";  // step slabs, coping
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs"; // step ramps
export const STONE_BRICKS = "stone_bricks";                      // podium bottom course, step cheeks
export const STONE_BRICK_WALL = "stone_brick_wall";              // cheek copings
export const ANDESITE_WALL = "andesite_wall";                    // lamp posts (no polished_andesite_wall in 1.21.1)
export const RED_TERRACOTTA = "red_terracotta";                  // hall walls and door-bay panels
export const POLISHED_GRANITE = "polished_granite";              // red-brown band under the eave
export const POLISHED_GRANITE_SLAB = "polished_granite_slab";    // band caps
export const GLASS_PANE = "glass_pane";                          // lobby wall, door bays
export const POLISHED_DEEPSLATE = "polished_deepslate";          // mullions and transoms
export const BLACK_CONCRETE = "black_concrete";                  // name board field
export const YELLOW_BANNER = "yellow_banner";                    // gold letters, standing
export const YELLOW_WALL_BANNER = "yellow_wall_banner";          // gold letters, on the board
export const GRASS_BLOCK = "grass_block";                        // park ground, y 0
export const DIRT_PATH = "dirt_path";                            // edging
export const COARSE_DIRT = "coarse_dirt";                        // topiary bases
export const AZALEA_LEAVES = "azalea_leaves";                    // hedges (persistent)
export const FLOWERING_AZALEA_LEAVES = "flowering_azalea_leaves"; // hedge flecks (persistent)
export const SPRUCE_LEAVES = "spruce_leaves";                    // topiary cones (persistent)
export const IRON_BARS = "iron_bars";                            // flagpoles
export const RED_BANNER = "red_banner";                          // flags
export const LANTERN = "lantern";                                // chandeliers, gallery and lamp-post lanterns
export const SHROOMLIGHT = "shroomlight";                        // floodlight wells in the deck
export const SEA_LANTERN = "sea_lantern";                        // vestibule backing, hidden
export const CHAIN = "chain";                                    // hanging lanterns (1.21.1 id; never iron_chain)

// ---- site (plan.md) ----
export const SIZE = [153, 51, 159];                              // x 0..152, y 0..50, z 0..158
export const GROUND_Y = 0;                                       // the ground course
export const FOOTPRINT = [[4, 147, 4, 147], [52, 99, 148, 155], [56, 95, 156, 158], [4, 7, 0, 3], [0, 7, 144, 151]]; // [x0, x1, z0, z1] rects: buildable, apron, lawn scraps
export const PODIUM = { x0: 8, x1: 143, z0: 8, z1: 143, top: 2 };  // stone plinth, y 0..2 (deck top = y 2)
export const COLUMN_CENTRES = [17, 26, 35, 44, 53, 62, 71, 80, 89, 98, 107, 116, 125, 134]; // 14 a side, both axes
export const COLUMN_TOP = 19;                                    // short column capital y
export const PORTAL_COLUMN_TOP = 36;                             // tall portal columns (centres 53..98 on z 134)
export const HALL = { x0: 21, x1: 130, z0: 21, z1: 130 };        // red wall planes (wall at 21 and 130)
export const ROOF = { x0: 10, x1: 141, z0: 10, z1: 141 };        // concave hip roof footprint (eave y 24)
export const DECK = { x0: 40, x1: 111, z0: 40, z1: 111, y: 41 }; // flat top deck
export const PORTAL = { x0: 49, x1: 102, z0: 120, z1: 143 };     // raised south eave, cut out of the roof
export const GLASS_Z = 130;                                      // lobby glass wall plane
export const LOBBY = { x0: 55, x1: 96, z0: 122, z1: 129, y0: 3, y1: 36 }; // lit lobby air behind the glass
export const ENTRANCE = [67, 3, 131];                            // main way in, at the top of the steps
export const STEPS = { x0: 56, x1: 95, z0: 144, z1: 157 };       // accessible slab ramp, 40 wide
export const BEAM_Y = [22, 23];                                  // eave beam ring
export const BAND_Y = [20, 21];                                  // granite frieze under the beam
export const DOOR_BAY_CENTRE = 75.5;                             // E/W/N door bays span 73..78

/** True if (x, z) is a footprint cell (buildable rectangle, apron or lawn scrap). */
export function onFootprint(x, z) {
  return FOOTPRINT.some(([x0, x1, z0, z1]) => x >= x0 && x <= x1 && z >= z0 && z <= z1);
}

/** Seeded PRNG: rng(seed)() returns a float in [0, 1); the same seed gives the same sequence (mulberry32). */
export function rng(seed) {
  let a = seed | 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
