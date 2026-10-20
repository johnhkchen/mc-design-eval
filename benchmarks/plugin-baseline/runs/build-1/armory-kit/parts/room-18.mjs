// Interior designer for "Annex D2 restrooms" (room 18): a plain, bright restroom and storeroom inside the box
// x 210..217, y 1..6, z 114..121. Entered from the south at x 215..216 (z 123), so the first cells inside, (215..216,
// z 121), stay clear. Focal piece: the wash counter straight ahead on the north wall, with a mirror over it.
// Toilets are stair seats against the west wall; the storeroom crates sit in the east corner; four hanging lanterns
// on chains from the deck light the room evenly (every floor cell 8+).
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  // counter: two full blocks, a mirror of glass panes above
  K: ["light_gray_concrete", {}],
  P: ["glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }],
  // toilet stall: a stair seat, back to the west wall, facing into the room
  T: ["smooth_quartz_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" }],
  // storeroom crates
  S: ["smooth_quartz", {}],
  // hanging lantern under a chain, chain under the deck
  L: ["lantern", { hanging: "true", waterlogged: "false" }],
  C: ["chain", { axis: "y", waterlogged: "false" }],
};

// rows run along +x (i = x - 210), successive rows along +z (j = z - 114); layers run up from y 1
const FURNITURE = [
  // y 1: floor level
  [
    ".KKKKKK.", // j0 counter base, north wall
    "......SS", // j1 crates, east corner
    "T.....SS", // j2 toilet seat at the west wall; crates
    "........", // j3
    "T.......", // j4 toilet
    "........", // j5
    "T.......", // j6 toilet
    "........", // j7 entrance lane, clear
  ],
  // y 2: counter top, one crate on top
  [
    ".KKKKKK.",
    ".......S",
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
  ],
  // y 3: mirror over the counter
  [
    ".PPPPPP.",
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
    "........",
  ],
  // y 4: lanterns hang over the room's four quarter points
  [
    "........",
    "........",
    "..L..L..",
    "........",
    "........",
    "..L..L..",
    "........",
    "........",
  ],
  // y 5: chains under the deck
  [
    "........",
    "........",
    "..C..C..",
    "........",
    "........",
    "..C..C..",
    "........",
    "........",
  ],
  // y 6: chains up to the deck at y 7
  [
    "........",
    "........",
    "..C..C..",
    "........",
    "........",
    "..C..C..",
    "........",
    "........",
  ],
];

export function build(g) {
  layers(g, [210, 1, 114], LEGEND, FURNITURE);
}
