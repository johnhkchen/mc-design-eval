// Part: room: H1 lobby and stair hall (Bookseller). Furnished inside its box only: a residents' post desk and cabinet
// on the east side of the lane, a waiting chair and table at the rear, a barrel for parcels, and lanterns on every
// piece so no floor cell is dark. Frame: world coordinates (feet level y 2; the room tool prints it as y 7). The lane
// x 34 stays clear from the front door (35,7) to the rear door (35,24) and the keeper's door (33,22); nothing in a
// doorway's first cell.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Rows run along +z (z 7..24), columns along +x (x 33..37); '.' = left alone.
const LEGEND = {
  p: "spruce_planks",                      // desk
  s: ["spruce_slab", { type: "bottom" }],  // desk top, table top
  F: "flower_pot",                         // post desk ornament
  b: "bookshelf",                          // residents' pigeonhole cabinet
  f: "spruce_fence",                       // table post
  c: ["spruce_stairs", { facing: "west", half: "bottom" }],  // seat at the table, back to the lane
  e: ["spruce_stairs", { facing: "east", half: "bottom" }],  // waiting seat, back to the east wall
  B: ["barrel", { facing: "up" }],         // parcels
  l: ["lantern", { hanging: "false" }],    // standing lights, each on a block
  h: ["lantern", { hanging: "true" }],     // hanging lights from the floor above
};

// y 2: floor-level furniture (18 rows, z 7..24)
const FEET = [
  ".....", // z 7
  ".....", // z 8
  "..pb.", // z 9   desk (35), cabinet (36)
  "..pb.", // z 10
  "...b.", // z 11
  ".....", // z 12  stair foot (locked)
  ".....", // z 13
  ".....", // z 14
  ".....", // z 15
  ".....", // z 16
  ".....", // z 17
  "...e.", // z 18  waiting seat
  ".....", // z 19
  ".....", // z 20
  "..cf.", // z 21  table seat (35), table post (36)
  ".....", // z 22  keeper's door first cell: clear
  "...B.", // z 23  barrel by the rear door
  ".....", // z 24
];

// y 3: tops and lamps on them (18 rows)
const TOPS = [
  ".....", // z 7
  ".....", // z 8
  "..s..", // z 9   desk top
  "..Fl.", // z 10  pot on the desk, lamp on the cabinet
  ".....", // z 11
  ".....", // z 12
  ".....", // z 13
  ".....", // z 14
  ".....", // z 15
  ".....", // z 16
  ".....", // z 17
  ".....", // z 18
  ".....", // z 19
  ".....", // z 20
  "...s.", // z 21  table top
  ".....", // z 22
  "...l.", // z 23  lamp on the barrel
  ".....", // z 24
];

// y 4: lamp standing on the desk top (18 rows)
const LAMPS = [
  ".....", // z 7
  ".....", // z 8
  "..l..", // z 9   focal lamp over the post desk
  ".....", // z 10
  ".....", // z 11
  ".....", // z 12
  ".....", // z 13
  ".....", // z 14
  ".....", // z 15
  ".....", // z 16
  ".....", // z 17
  ".....", // z 18
  ".....", // z 19
  ".....", // z 20
  "...l.", // z 21  table lamp
  ".....", // z 22
  ".....", // z 23
  ".....", // z 24
];

// y 7: lanterns hung from the flat-1 floor over the lane (the lane cells at light 5 and 6)
const CEILING = [
  ".....", // z 7
  ".....", // z 8
  ".....", // z 9
  ".....", // z 10
  ".....", // z 11
  ".....", // z 12
  ".....", // z 13
  ".....", // z 14
  ".h...", // z 15 hung over the lane (x 34) from the floor at y 8
  ".....", // z 16
  ".....", // z 17
  ".....", // z 18
  ".....", // z 19
  ".....", // z 20
  ".....", // z 21
  ".....", // z 22
  ".....", // z 23
  ".....", // z 24
];

export function build(g) {
  layers(g, [33, 2, 7], LEGEND, [FEET, TOPS, LAMPS]);
  layers(g, [33, 7, 7], LEGEND, [CEILING]);
}
