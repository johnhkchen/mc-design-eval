// ROOM bedroom 2 (interior designer): small yellow-accented bedroom, inner air x=26..30, z=18..20, y=2..4.
// Doors: west (25,2..3,19) from the corridor, north (29,2..3,17) to bath 2. The lane x=26..29 z=19 links them.
// Plan (x runs 26..30, rows z=18, 19, 20; top = north):
//   z18  wardrobe (26..27)            bath-door cell (29) kept clear
//   z19  yellow carpet lane (26..28)  nightstand (30) with a lantern on top
//   z20  desk (26..27) with a lantern  yellow bed: foot (29), head (30) against the east wall
// Light: standing lanterns on the desk (26,4,20) and nightstand (30,4,19). The vault gives no ceiling at y=5 here,
// so no hung lanterns.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  W: B.block("spruce_planks"),                       // wardrobe body (2 high)
  F: B.fence("spruce"),                              // desk legs and nightstand base
  C: B.block("yellow_carpet"),                       // lane runner
  S: B.slab("birch", "bottom"),                      // desk top and nightstand top
  f: ["yellow_bed", { facing: "east", part: "foot" }],
  h: ["yellow_bed", { facing: "east", part: "head" }],
  p: B.block("potted_cactus"),                       // on the wardrobe top
};

// y=2 (floor level) and y=3 (second level); rows are z=18, 19, 20, columns x=26..30
const LEVELS = [
  [
    "WW...",
    "CCC.F",
    "FF.fh",
  ],
  [
    "WW...",
    "....S",
    "SS...",
  ],
];

export function build(g) {
  layers(g, [26, 2, 18], LEGEND, LEVELS);
  // the pot stands on the wardrobe top (y=4)
  g.set(26, 4, 18, ...LEGEND.p);
  // standing lanterns on the desk top and the nightstand top (y=3 slabs), lighting the lane and the bed
  g.set(26, 4, 20, ...B.lantern(false));
  g.set(30, 4, 19, ...B.lantern(false));
}
