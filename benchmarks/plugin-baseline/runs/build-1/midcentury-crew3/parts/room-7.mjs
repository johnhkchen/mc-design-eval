// ROOM bedroom 1 (interior designer): guest/child room in sea-blue. Interior air box [26,2,9,30,4,12]; door (25,10) from the
// corridor on the west; window x=31 z=10..12 on the east. Spruce floor and ceiling (shell).
// Layout: a cyan double bed with its spruce headboard against the north wall, a birch-slab nightstand on the west side of the
// head, a spruce wardrobe down the east wall, an end_rod floor lamp in the north-west corner, a cyan rug along the lane at the
// foot of the bed. Light: a lantern hung over the bed head (the focal piece), one over the rug, one over the wardrobe, plus the
// floor lamp, so every floor cell is lit.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { wardrobe } from "../vocab.mjs";

// Rows run along +x from x=25 (the wall column) to x=31; successive rows run along +z from z=8 (the north wall).
const ORIGIN = [25, 2, 8];

const LEGEND = {
  H: ["spruce_planks"],
  N: ["spruce_fence"],
  L: ["birch_slab", { type: "bottom" }],
  f: ["cyan_bed", { facing: "north", part: "foot" }],
  b: ["cyan_bed", { facing: "north", part: "head" }],
  c: ["cyan_carpet"],
  F: ["spruce_fence"],
  E: ["end_rod", { facing: "up" }],
  l: ["lantern", { hanging: "true" }],
};

// y=2 (standing layer): headboard, bed, nightstand, floor-lamp post, rug
const FLOOR = [
  "#######", // z=8 north wall
  "#.FHTP#", // z=9 floor lamp in the corner beside the headboard
  "D.NbTP#", // z=10 (door west, window east)
  "#..fTP#", // z=11
  "#.ccc.#", // z=12 rug at the foot of the bed
  "#######", // z=13 partition
];
// y=3: floor-lamp head, nightstand top, wardrobe upper half
const UPPER = [
  "#######",
  "#.E.TP#",
  "D.L.TP#",
  "#...TP#",
  "#.....#",
  "#######",
];
// y=4: hanging lanterns from the beams and ceiling
const LIGHTS = [
  "#######",
  "#.....#",
  "#..l..#", // over the bed head (beam line x=28)
  "#....l#", // over the wardrobe
  "#l....#", // over the rug
  "#######",
];

export function build(g) {
  // the wardrobe: spruce_planks back row on x=30, open trapdoor fronts on x=29, z=9..11, facing west (into the room)
  wardrobe(g, 30, 9, 3, "z", "west");
  // the bed, nightstand, lamp, rug and lights, drawn as one floor plan
  layers(g, ORIGIN, LEGEND, [FLOOR, UPPER, LIGHTS]);
}
