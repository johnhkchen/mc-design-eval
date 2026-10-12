// ROOM dining (interior designer): inner air x 11..15, y 2..4, z 14..18 (rooms.json). Drawn as text with layers():
// the table (spruce slab top on spruce fence legs, x 12..14, z 15..16) runs across the room with three birch chairs on
// each long side (north row z=14 facing north, south row z=17 facing south); the birch sideboard stands under the west
// window (x=11, z 14..16); spruce panelling (open trapdoors) lies on the west wall at z=17..18; two hung lanterns hang
// from the beam line x=13 (the pendant over the table is the focal light). Walk lane: x=15, z 14..18; both openings
// (north z=13 to the kitchen, south z=19 to the living room) stay clear across x=15.
import { B, layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// legend: one character per block; "." is left as the shell has it (free air)
const LEGEND = {
  S: B.trapdoor("birch", "east", "bottom", false), // sideboard cabinet fronts
  b: B.slab("birch", "top"), // sideboard top
  N: B.stairs("birch", "north", "bottom"), // chair, back to the north, facing the table
  O: B.stairs("birch", "south", "bottom"), // chair, back to the south, facing the table
  F: B.fence("spruce"), // table leg
  T: B.slab("spruce", "top"), // table top
  P: B.trapdoor("spruce", "west", "bottom", true), // spruce panelling against the west wall
  C: B.block("potted_cactus"), // sideboard plant
  f: B.block("flower_pot"), // table pot
  L: B.lantern(true), // hung lantern from the beam at y=5
};

// rows run along +x (x=11..15), successive rows along +z (z=14..18); one layer per y (2, 3, 4)
const LAYERS = [
  [ // y=2: floor level, chairs, table legs, sideboard fronts, panelling
    "SNNN.",
    "SF.F.",
    "SF.F.",
    "POOO.",
    "P....",
  ],
  [ // y=3: sideboard top, table top, panelling
    "b....",
    "bTTT.",
    "bTTT.",
    "P....",
    "P....",
  ],
  [ // y=4: plant, pendant lantern over the table, second lantern, panelling
    ".....",
    "C.L..",
    "...f.",
    "P.L..",
    "P....",
  ],
];

export function build(g) {
  layers(g, [11, 2, 14], LEGEND, LAYERS);
}
