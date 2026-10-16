// Part: Shell B plots 4-7: boarding house shell (plot 4), smokehouse crib and ham racks (plot 5), bungalow brick shell (plot 7).
// The plot 4 flight (z15) belongs to parts/stairs.mjs, built before this part: its upper-floor cells (x53..57 z15) are left clear.
// The chimney reserved cells (x49..50 z12..13 plot 4, x85..86 z13..14 plot 7) and every opening stay air for later parts.
import { B, carve } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { pier_line, clapboard_wall, log_crib_wall, ham_rack } from "../vocab.mjs";

const inBox = (x, y, z, boxes) => boxes.some(([a, b, c, d, e, f]) => x >= a && x <= d && y >= b && y <= e && z >= c && z <= f);

// ---- plot 4: boarding house, two storeys, side gable -------------------------------------------------------------
const BOARDING_OPEN = [
  [53, 3, 9, 54, 4, 9],                                     // front double door
  [50, 4, 9, 51, 5, 9], [56, 4, 9, 57, 5, 9],               // front ground windows
  [50, 9, 9, 51, 10, 9], [53, 9, 9, 54, 10, 9], [56, 9, 9, 57, 10, 9], // front upper windows
  [49, 4, 15, 49, 5, 15], [49, 9, 15, 49, 10, 15],          // west end windows
  [58, 4, 11, 58, 5, 11], [58, 9, 11, 58, 10, 11],          // east end windows z11
  [58, 4, 14, 58, 5, 14], [58, 9, 14, 58, 10, 14],          // east end windows z14
  [56, 3, 16, 56, 4, 16], [50, 3, 16, 50, 4, 16],           // back doors (kitchen yard door at x50)
  [51, 4, 16, 51, 5, 16], [53, 4, 16, 53, 5, 16],           // back ground windows
  [51, 9, 16, 51, 10, 16], [56, 9, 16, 56, 10, 16],         // back upper windows
  [49, 3, 12, 49, 11, 13],                                  // kitchen chimney breast (parts/chimneys.mjs)
];
const CHIMNEY_4 = (x, z) => (x === 49 || x === 50) && (z === 12 || z === 13);

function boarding(g) {
  const x0 = 49, x1 = 58, z0 = 9, z1 = 16;
  // piers on the outline, cobble, spruce skirt between; the chimney footing stays clear
  pier_line(g, x0, z0, x1, z1, "cobblestone", { y: 1, h: 1, skirt: "spruce_fence" });
  carve(g, [49, 1, 12], [49, 1, 13]);
  // deck and floors (y2 ground deck, y7 upper floor), skipping the chimney and the flight's clear cells
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!CHIMNEY_4(x, z)) g.set(x, 2, z, "spruce_planks");
  }
  for (let x = 50; x <= 57; x++) for (let z = 10; z <= 15; z++) {
    if (CHIMNEY_4(x, z) || (z === 15 && x >= 53)) continue;
    g.set(x, 7, z, "spruce_planks");
  }
  // walls: mangrove field, stripped oak corners and plates (y3 base course, y11 head)
  clapboard_wall(g, [x0, 3, z0, x1, 11, z1], "mangrove_planks", "stripped_oak_log", { open: BOARDING_OPEN });
  // board-and-batten: battens at x52 and x55 on the front and back (no openings on those columns)
  for (const z of [z0, z1]) for (const x of [52, 55]) for (let y = 4; y <= 10; y++) {
    if (y !== 7) g.set(x, y, z, ...B.pillar("stripped_oak_log", "y"));
  }
  // belt course at y7 all round (floor line), axis along each run
  for (let x = 50; x <= 57; x++) {
    g.set(x, 7, z0, ...B.pillar("stripped_oak_log", "x"));
    g.set(x, 7, z1, ...B.pillar("stripped_oak_log", "x"));
  }
  for (let z = 10; z <= 15; z++) {
    if (CHIMNEY_4(49, z)) continue;
    g.set(x0, 7, z, ...B.pillar("stripped_oak_log", "z"));
    g.set(x1, 7, z, ...B.pillar("stripped_oak_log", "z"));
  }
  // upper partition z13 (doors x51 and x56) and the bunk-room wall x54 z10..12
  for (let x = 50; x <= 57; x++) for (let y = 8; y <= 11; y++) {
    if ((x === 51 || x === 56) && y <= 9) continue;
    if (CHIMNEY_4(x, 13)) continue;                         // the breast of the chimney runs through z13 at x50
    g.set(x, y, 13, "mangrove_planks");
  }
  for (let z = 10; z <= 12; z++) for (let y = 8; y <= 11; y++) g.set(54, y, z, "mangrove_planks");
}

// ---- plot 5: smokehouse, log crib on a fieldstone plinth, front gable ---------------------------------------------
function smokehouse(g) {
  const door = (x, z) => x === 63 && z === 12;               // gap in the plinth for spruce_door x63 z12
  for (let x = 61; x <= 65; x++) for (let z = 12; z <= 16; z++) {
    if (x !== 61 && x !== 65 && z !== 12 && z !== 16) continue; // ring only
    if (!door(x, z)) g.set(x, 1, z, "cobblestone");
  }
  for (let x = 62; x <= 64; x++) for (let z = 13; z <= 15; z++) g.set(x, 0, z, "packed_mud");
  log_crib_wall(g, [61, 2, 12, 65, 4, 16], "stripped_spruce_log", {
    keep: [[63, 2, 12, 63, 2, 12], [63, 2, 16, 63, 2, 16]],  // door head, and the 1x1 flue hole to the smoker
  });
  // tie beams (axis z) over the hams, y4
  for (const x of [62, 64]) for (let z = 13; z <= 15; z++) g.set(x, 4, z, ...B.pillar("stripped_oak_log", "z"));
  ham_rack(g, [62, 64], [13, 14, 15], 3);
}

// ---- plot 7: 1920s bungalow, brick walls on a brick foundation ---------------------------------------------------
const BUNGALOW_OPEN = [
  [89, 3, 10, 89, 4, 10],                                   // front door
  [90, 3, 10, 90, 4, 10],                                   // sidelight (glass, later)
  [86, 4, 10, 87, 5, 10], [92, 4, 10, 93, 5, 10],           // front paired windows
  [85, 3, 13, 85, 6, 14],                                   // west chimney footprint (parts/chimneys.mjs)
  [85, 4, 15, 85, 5, 16],                                   // west window (kitchen)
  [94, 4, 15, 94, 5, 16], [94, 4, 12, 94, 5, 12],           // east windows
  [88, 3, 17, 88, 4, 17], [92, 4, 17, 93, 5, 17],           // back door and window
];
const CHIMNEY_7 = (x, z) => x >= 85 && x <= 86 && z >= 13 && z <= 14;

function bungalow(g) {
  // continuous brick foundation y1 under body and porch; the chimney footing stays clear
  for (let x = 85; x <= 94; x++) for (let z = 7; z <= 17; z++) {
    if (!CHIMNEY_7(x, z)) g.set(x, 1, z, "bricks");
  }
  // floor deck y2 under the body
  for (let x = 85; x <= 94; x++) for (let z = 10; z <= 17; z++) {
    if (!CHIMNEY_7(x, z)) g.set(x, 2, z, "spruce_planks");
  }
  // brick walls y3..6, stripped pale oak corners and head plate y6
  clapboard_wall(g, [85, 3, 10, 94, 6, 17], "bricks", "stripped_pale_oak_log", { open: BUNGALOW_OPEN });
  // the y3 plate reads as brick, not white trim: base course is brick
  for (let x = 85; x <= 94; x++) for (const z of [10, 17]) {
    if (!inBox(x, 3, z, BUNGALOW_OPEN) && !((x === 85 || x === 94) && (z === 10 || z === 17))) g.set(x, 3, z, "bricks");
  }
  for (let z = 10; z <= 17; z++) for (const x of [85, 94]) {
    if (!inBox(x, 3, z, BUNGALOW_OPEN) && !((z === 10 || z === 17))) g.set(x, 3, z, "bricks");
  }
  // interior partitions, spruce planks y3..6: z14 (door x88 to the kitchen, door x91 to the bedroom), x90 z15..16
  for (let x = 87; x <= 93; x++) for (let y = 3; y <= 6; y++) {
    if ((x === 88 || x === 91) && y <= 4) continue;
    g.set(x, y, 14, "spruce_planks");
  }
  for (let z = 15; z <= 16; z++) for (let y = 3; y <= 6; y++) g.set(90, y, z, "spruce_planks");
}

export function build(g) {
  boarding(g);
  smokehouse(g);
  bungalow(g);
}
