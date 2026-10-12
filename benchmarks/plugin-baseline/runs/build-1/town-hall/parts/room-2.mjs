// Part: room: Entrance hall (parts/room-2.mjs). Grand civic hall, inner air x11..29, z15..25, y4..9. A red runner down the
// centre line from the vestibule archway to the rear door; two notice boards flank the archway; two waiting groups
// (a fence-and-slab table with a bench either side, at x15 and x25); barrels and flower pots in the back corners; hanging
// lanterns from the upper floor over the runner and each table. The stair flights (x11..12, x28..29) and the arcade gaps
// belong to the shell and the bays, so z15 stays bare at x12..16 and x24..28, and the lanes are kept open.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Origin [11, 4, 15]: rows run along +x (x11..29), one string per z row, z15..25. Each row is given as {x: char}.
const ORIGIN = [11, 4, 15];
const rowOf = (marks) => Array.from({ length: 19 }, (_, j) => marks[11 + j] ?? ".").join("");

const FLOOR_LEGEND = {
  R: "red_carpet",
  N: ["dark_oak_stairs", { facing: "north" }], // bench, back to the north: the seat faces south, to the table
  S: ["dark_oak_stairs", { facing: "south" }], // bench, back to the south: the seat faces north, to the table
  T: "dark_oak_fence", // table post
  B: "barrel",
  P: "flower_pot",
};

// y4, the walkable floor
const FLOOR = [
  { 20: "R" }, // z15
  { 20: "R" }, // z16
  { 15: "N", 20: "R", 25: "N" }, // z17
  { 15: "T", 20: "R", 25: "T" }, // z18
  { 15: "S", 20: "R", 25: "S" }, // z19
  { 20: "R" }, // z20
  { 15: "N", 20: "R", 25: "N" }, // z21
  { 15: "T", 20: "R", 25: "T" }, // z22
  { 15: "S", 20: "R", 25: "S" }, // z23
  { 13: "B", 20: "R", 27: "B" }, // z24
  { 13: "P", 20: "R", 27: "P" }, // z25
].map(rowOf);

const TOP_LEGEND = { L: ["dark_oak_slab", { type: "bottom" }] }; // table tops at y5, on each post

// y5, the table tops
const TOP = [
  {}, {}, {},
  { 15: "L", 25: "L" }, // z18
  {}, {}, {},
  { 15: "L", 25: "L" }, // z22
  {}, {}, {},
].map(rowOf);

const LAMP_LEGEND = { G: ["lantern", { hanging: "true" }] }; // hanging from the upper floor at y10

// y9, the hanging lanterns: down the runner, and one over each table
const LAMPS = [
  { 20: "G" }, // z15
  { 20: "G" }, // z16
  {},
  { 15: "G", 25: "G" }, // z18
  {},
  { 20: "G" }, // z20
  {},
  { 15: "G", 25: "G" }, // z22
  {},
  { 20: "G" }, // z24
  {},
].map(rowOf);

export function build(g) {
  layers(g, ORIGIN, FLOOR_LEGEND, [FLOOR]);
  layers(g, [11, 5, 15], TOP_LEGEND, [TOP]);
  layers(g, [11, 9, 15], LAMP_LEGEND, [LAMPS]);
  // notice boards flanking the archway, on the north wall z14
  g.set(18, 5, 15, ...B.sign("dark_oak", ["NOTICES", "COUNCIL"], { facing: "south" }));
  g.set(22, 5, 15, ...B.sign("dark_oak", ["NOTICES", "COUNCIL"], { facing: "south" }));
  // standing lanterns on the floor, where the room check lifts the dim cells to 8+ (beside the benches and at the stair foot)
  g.set(16, 4, 19, ...B.lantern(false));
  g.set(26, 4, 21, ...B.lantern(false));
  g.set(11, 4, 25, ...B.lantern(false));
  g.set(17, 4, 15, ...B.lantern(false));
  g.set(23, 4, 15, ...B.lantern(false));
  g.set(15, 4, 25, ...B.lantern(false));
}
