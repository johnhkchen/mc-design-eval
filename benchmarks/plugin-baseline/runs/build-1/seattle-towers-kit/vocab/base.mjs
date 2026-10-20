// Shared constants for the Seattle Center kit: palette block ids (palette.json only), site coordinates from plan.md, and a seeded rng.

// Ground and walking level
export const SMOOTH_STONE = "smooth_stone";                              // ground course y 0, paving, flat deck
export const GROUND_Y = 0;                                               // ground course
export const WALK_Y = 1;                                                 // floor level people stand on (floor block y 0); every door is flush here
// KOMO bodies, piers and glass
export const WHITE_CONCRETE = "white_concrete";                          // KOMO body, spandrel bands, parapets, curtain rings
export const LIGHT_GRAY_CONCRETE = "light_gray_concrete";                // KOMO piers, columns, fins; Hyatt grey panels
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";        // KOMO ribbon windows (dark band against white)
export const CYAN_STAINED_GLASS = "cyan_stained_glass";                  // curtain wall of the drums and bows (reads teal-green)
export const CYAN_STAINED_GLASS_PANE = "cyan_stained_glass_pane";        // bow thin edges only
export const GLASS = "glass";                                            // ground-storey glazing, lift shafts
export const GLASS_PANE = "glass_pane";                                  // Aperture windows and balcony rails
export const LIGHT_BLUE_STAINED_GLASS_PANE = "light_blue_stained_glass_pane"; // Hyatt punched windows
// Canopies, lids and copings
export const SMOOTH_QUARTZ = "smooth_quartz";                            // crown lids, dish rim, penthouse lid
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";                  // canopy lips, crown rings (top), lobby band
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";              // dish rim where the bowl steps, benches
export const QUARTZ_STAIRS = "quartz_stairs";                            // stair flights in the cores
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";                    // copings, lids, roof coping, balcony floors
// Dishes and rails
export const POLISHED_ANDESITE = "polished_andesite";                    // dish pedestal, planter kerb
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";          // dish pedestal top
export const IRON_BLOCK = "iron_block";                                  // dish yoke
export const IRON_BARS = "iron_bars";                                    // rails, dish feed arms, plant screens
export const IRON_CHAIN = "iron_chain";                                  // plant screens, rails
export const END_ROD = "end_rod";                                        // dish feed tips
export const IRON_DOOR = "iron_door";                                    // entrance door pairs (both halves)
// Hyatt and Aperture panels
export const SMOOTH_SANDSTONE = "smooth_sandstone";                      // Hyatt beige panels, return walls
export const SMOOTH_SANDSTONE_SLAB = "smooth_sandstone_slab";            // Hyatt window sills
export const GRAY_CONCRETE = "gray_concrete";                            // Aperture dark bay frames, dark parapet, annex
export const POLISHED_DEEPSLATE = "polished_deepslate";                  // Aperture dark spandrels, shop piers
export const BLACK_CONCRETE = "black_concrete";                          // Aperture shop fascia
// Signs and emblem
export const BLUE_CONCRETE = "blue_concrete";                            // KOMO 4 emblem
export const RED_CONCRETE = "red_concrete";                              // KOMO 4 emblem
// Floors, lights, lift
export const POLISHED_DIORITE = "polished_diorite";                      // KOMO office floors
export const BIRCH_PLANKS = "birch_planks";                              // Hyatt and Aperture floors
export const SEA_LANTERN = "sea_lantern";                                // flush ceiling light
export const LANTERN = "lantern";                                        // parapet and lamp-post lights
export const SOUL_SAND = "soul_sand";                                    // lift base
export const BUBBLE_COLUMN = "bubble_column";                            // water elevator (drag false)
export const LADDER = "ladder";                                          // only where a stair can't fit
// Grounds
export const MOSS_BLOCK = "moss_block";                                  // planter fill
export const AZALEA_LEAVES = "azalea_leaves";                            // planter clumps (persistent)
export const OAK_LOG = "oak_log";                                        // tree trunks
export const OAK_LEAVES = "oak_leaves";                                  // tree crowns (persistent)
export const OAK_FENCE = "oak_fence";                                    // lamp posts, pergola posts
export const OAK_SLAB = "oak_slab";                                      // pergola rafters

// Site (plan.md): the full site is 251 x 48 x 125 blocks, x 0..250, y 0..47, z 0..124
export const SITE = [251, 48, 125];
// Plots, inclusive x0..x1 and z0..z1, with the highest block y1 (plan.md)
export const PLOTS = {
  plot0: { name: "KOMO PLAZA EAST", x0: 0, x1: 104, z0: 0, z1: 124, maxY: 47 },
  plot1: { name: "KOMO PLAZA WEST", x0: 105, x1: 151, z0: 0, z1: 61, maxY: 45 },
  plot2: { name: "HYATT HOUSE", x0: 152, x1: 200, z0: 0, z1: 92, maxY: 44 },
  plot3: { name: "APERTURE ON FIFTH", x0: 201, x1: 250, z0: 0, z1: 52, maxY: 40 },
};
// Storeys and roofs (plan.md FLOORS and ROOFS): floor block y of each storey, and the roof slab y of each mass
export const STOREY = 5;                                                 // blocks per storey (3.6 m at 1.4 blocks per metre)
export const GROUND_STOREY = 7;                                          // the ground storey is 7 blocks tall (floor y 0 to slab y 7)
export const KOMO_FLOORS = [0, 7, 12, 17, 22, 27, 32];                   // KOMO office storey slabs
export const KOMO_E_NORTH_ROOF_Y = 37;                                   // KOMO E north block roof slab (parapet 38)
export const KOMO_E_SOUTH_ROOF_Y = 32;                                   // KOMO E south wing roof slab (parapet 33)
export const KOMO_PODIUM_ROOF_Y = 12;                                    // KOMO E west podium and W podium roof slab (parapet 13)
export const KOMO_TAIL_ROOF_Y = 17;                                      // KOMO E south tail roof slab (parapet 18)
export const KOMO_W_ROOF_Y = 37;                                         // KOMO W body roof slab (parapet 38)
export const DRUM_CROWN_Y = 42;                                          // drum and bow crown ring (rail y 43)
export const DRUM_LID_Y = 41;                                            // drum lid under the crown
export const PENTHOUSE_LID_Y = 44;                                       // KOMO E penthouse lid
export const HYATT_ROOF_Y = 37;                                          // Hyatt wedge and south block roof slab (parapet 38)
export const HYATT_ANNEX_ROOF_Y = 17;                                    // Hyatt west annex roof slab
export const HYATT_PLANT_LID_Y = 44;                                     // Hyatt plant enclosure lid (screen y 38..43)
export const APERTURE_ROOF_Y = 37;                                       // Aperture roof slab (parapet 38)
export const APERTURE_OVERRUN_Y = 40;                                    // Aperture stair/lift overrun top and pergola rafters
// Vertical circulation cores (plan.md ROOMS): inclusive x0..x1, z0..z1
export const CORE_KOMO_E = { x0: 60, x1: 67, z0: 30, z1: 37 };
export const CORE_KOMO_W = { x0: 124, x1: 131, z0: 36, z1: 43 };
export const CORE_HYATT = { x0: 184, x1: 191, z0: 72, z1: 79 };
export const CORE_APERTURE = { x0: 230, x1: 237, z0: 20, z1: 27 };
// Entrances (plan.md OPENINGS): cells of each door, inclusive
export const DOORS = {
  komoEDrum: { x0: 12, x1: 13, z: 9 },                                   // KOMO E drum lobby (north)
  komoENorthBow: { x0: 61, x1: 62, z: 0 },                               // KOMO E north bow lobby (north)
  komoEEast: { x: 103, z0: 30, z1: 31 },                                 // KOMO E east entrance
  komoESouthEast: { x: 103, z0: 80, z1: 81 },                            // KOMO E south wing east
  komoEPlaza: { x: 56, z0: 90, z1: 91 },                                 // KOMO E plaza door (west)
  komoWBow: { x0: 126, x1: 127, z: 1 },                                  // KOMO W bow lobby (north)
  komoWEast: { x: 144, z0: 30, z1: 31 },                                 // KOMO W east door
  hyattMain: { x0: 172, x1: 175, z: 64 },                                // Hyatt main lobby, off the court (north)
  hyattTip: { x0: 195, x1: 196, z: 8 },                                  // Hyatt tip entrance (north)
  apertureResidents: { x: 201, z0: 20, z1: 21 },                         // Aperture residents' lobby (west)
};

// Seeded random numbers (mulberry32): rng(seed)() gives a float in [0, 1); the same seed gives the same build
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
