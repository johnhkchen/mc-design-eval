// Shared constants for the City Hall kit: palette block ids, site coordinates from plan.md, and a seeded rng.

// Block ids (palette.json only; chain, not iron_chain, which 1.21.1 lacks)
export const SMOOTH_STONE = "smooth_stone";                       // ground and flat decks
export const SMOOTH_STONE_SLAB = "smooth_stone_slab";            // ground-level slab
export const POLISHED_ANDESITE = "polished_andesite";            // plinth course, dome ribs
export const POLISHED_ANDESITE_STAIRS = "polished_andesite_stairs";
export const POLISHED_ANDESITE_SLAB = "polished_andesite_slab";
export const POLISHED_DIORITE = "polished_diorite";              // granite body: base, recessed walls, attic, drum
export const POLISHED_DIORITE_STAIRS = "polished_diorite_stairs";
export const POLISHED_DIORITE_SLAB = "polished_diorite_slab";    // sills, balustrade rail
export const DIORITE = "diorite";                                // rustication joints
export const DIORITE_WALL = "diorite_wall";                      // balusters
export const QUARTZ_PILLAR = "quartz_pillar";                    // fluted column shafts (axis y)
export const SMOOTH_QUARTZ = "smooth_quartz";                    // capitals, architrave, string courses, lintels
export const SMOOTH_QUARTZ_STAIRS = "smooth_quartz_stairs";      // cornices, hoods, raking cornice
export const SMOOTH_QUARTZ_SLAB = "smooth_quartz_slab";
export const CALCITE = "calcite";                                // frieze, spandrels, tympanum, panels
export const CHISELED_QUARTZ_BLOCK = "chiseled_quartz_block";    // triglyphs, keystones, relief, urns, acroteria
export const QUARTZ_BRICKS = "quartz_bricks";                    // relief figures
export const GRAY_STAINED_GLASS_PANE = "gray_stained_glass_pane";// glass (connection states set)
export const DARK_OAK_DOOR = "dark_oak_door";                    // both halves
export const POLISHED_TUFF = "polished_tuff";                    // dome shell, pediment roof
export const POLISHED_TUFF_STAIRS = "polished_tuff_stairs";
export const POLISHED_TUFF_SLAB = "polished_tuff_slab";
export const GOLD_BLOCK = "gold_block";                          // gilding: plot 0 at y >= 71 only
export const LIGHTNING_ROD = "lightning_rod";                    // finial point
export const LANTERN = "lantern";                                // hanging true/false
export const CHAIN = "chain";                                    // hanging-lantern chain, axis y
export const GLOWSTONE = "glowstone";                            // dome inner shell only

// Site (plan.md): the full site is 176 x 126 x 64 blocks; plots are inclusive x0..x1 / z0..z1
export const SITE = [176, 126, 64];
export const PLOTS = {
  dome: { x0: 0, z0: 0, x1: 63, z1: 63 },                        // plot 0: dome and pavilion
  portico: { x0: 64, z0: 0, x1: 127, z1: 23 },                   // plot 1: east portico
  wing: { x0: 128, z0: 0, x1: 143, z1: 23 },                     // plot 2: wing bay
  pavilion: { x0: 144, z0: 0, x1: 175, z1: 31 },                 // plot 3: corner pavilion
};
export const DOME_CENTER = 31.5;                                 // dome axis: x and z (dx = x - 31.5)
export const DRUM_RINGS = { inner: 18.5, outer: 20.5 };          // drum wall, round the axis
export const ROTUNDA_BOX = [8, 2, 8, 55, 33, 55];                // inner air of the Rotunda room
export const VESTIBULE_BOX = [65, 2, 4, 126, 8, 22];             // inner air of the Portico vestibule
export const ENTRANCE = [95, 2, 2];                              // the centre door's landing
export const STREET = [95, 1, -1];                               // in front of the centre slab step

// A seeded rng: rng(seed)() returns a float in [0, 1), the same sequence for the same seed
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
