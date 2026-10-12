// ROOM bedroom 2 (interior designer): small yellow-accented bedroom. Inner air x26..30, z18..20, y2..4; spruce floor (y=1,
// the shell's). Ways in: doorway (25,19) from the corridor (west) and the en-suite door (29,17) from bath 2 (north).
// The bed lies against the east wall with its head on the wall (x=30), its foot at x=29, so the bath door lane (29,18)
// and the corridor lane (26..28, z=18..20) stay open and meet across the room. Wardrobe on the north wall, desk and
// stair-seat chair in the south-west corner, hung lantern under the x=28 beam as the focal light.
// Layers are drawn per height: y=2 (floor level), y=3, y=4. Rows run along +z (18, 19, 20); columns along +x (26..30).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [26, 2, 18];

const LEGEND = {
  W: "spruce_planks",                                  // wardrobe body
  f: "spruce_fence",                                   // nightstand and desk legs
  S: ["birch_slab", { type: "top" }],                  // nightstand and desk tops
  o: ["yellow_bed", { facing: "east", part: "foot" }], // bed foot at x=29
  h: ["yellow_bed", { facing: "east", part: "head" }], // bed head at x=30, against the east wall
  c: "yellow_carpet",                                  // runner in front of the bed
  C: ["birch_stairs", { facing: "east", half: "bottom" }], // desk chair: stairs as the seat, back to the east
  P: "flower_pot",                                     // on the wardrobe top
  L: ["lantern", { hanging: "false" }],                // desk lamp on the desk top
  H: ["lantern", { hanging: "true" }],                 // hung from the beam at x=28
};

// y=2 (floor level): wardrobe on the north wall, nightstands at x=30, the bed, the runner and the desk chair
const FLOOR = [
  "WW..f", // z=18: wardrobe x26-27; bath-door lane x28-29 free; nightstand x30
  ".ccoh", // z=19: corridor lane free at x26; runner x27-28; bed foot x29, head x30
  "fC..f", // z=20: desk leg x26; chair x27; lane x28-29; nightstand x30
];
// y=3: wardrobe top, nightstand and desk tops
const MID = [
  "WW..S",
  ".....",
  "S...S",
];
// y=4: flower pot on the wardrobe, hung lantern under the beam, desk lamp
const TOP = [
  "P....",
  "..H..",
  "L....",
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, [FLOOR, MID, TOP]);
}
