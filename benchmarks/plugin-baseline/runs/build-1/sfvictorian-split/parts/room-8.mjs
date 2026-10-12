// Dining room (plan.md ROOMS: inner box x1..8, y5..8, z17..22; floor oak_planks at y4 is the shell's).
// Doorways: north (4..5, 5..6, 16) from the parlour, east (9, 5..6, 19) from the hall, south (4..5, 5..6, 23) to the kitchen.
// Kept clear for walking: the north door step (4..5, z17), the east door step (x8, z19) and the route between them
// and the south door down the east side (x6..7, z17..22).
// Design: a candlelit table for six (dark oak legs, oak slab top) on the middle of the room, chairs as oak stairs
// facing in, a hanging lantern pair over the table as the focal light, a sideboard of chests and barrels on the W
// party wall, a bookcase on the E wall, standing lanterns in the corners.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const TOP = 6;          // table top slab (bottom half) on the leg fences
const LEG = "dark_oak_fence";
const SEAT = "oak";     // chairs: oak_stairs, back toward the wall side

export function build(g) {
  // table: four dark oak fence legs at y5, an oak slab top at y6, candles on top, a red runner under it
  for (const [x, z] of [[3, 19], [6, 19], [3, 20], [6, 20]]) g.set(x, 5, z, LEG, { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
  for (let x = 3; x <= 6; x++) for (let z = 19; z <= 20; z++) g.set(x, TOP, z, ...B.slab(SEAT, "bottom"));
  for (let x = 4; x <= 5; x++) for (let z = 19; z <= 20; z++) g.set(x, 5, z, "red_carpet");
  g.set(4, 7, 19, "candle", { candles: "3", lit: "true", waterlogged: "false" });
  g.set(6, 7, 20, "candle", { candles: "2", lit: "true", waterlogged: "false" });

  // six chairs: two on each long side, two at the west end; each back faces the wall
  g.set(4, 5, 18, ...B.stairs(SEAT, "north"));
  g.set(5, 5, 18, ...B.stairs(SEAT, "north"));
  g.set(4, 5, 21, ...B.stairs(SEAT, "south"));
  g.set(5, 5, 21, ...B.stairs(SEAT, "south"));
  g.set(2, 5, 19, ...B.stairs(SEAT, "west"));
  g.set(2, 5, 20, ...B.stairs(SEAT, "west"));

  // focal light: a hanging lantern pair under the ceiling over the table
  g.set(4, 8, 19, ...B.lantern(true));
  g.set(5, 8, 20, ...B.lantern(true));

  // sideboard on the W party wall (x1): barrel, chest, gap for the walk, chest, barrel
  g.set(1, 5, 17, "barrel", { facing: "up", open: "false" });
  g.set(1, 6, 17, ...B.lantern(false));
  g.set(1, 5, 18, "chest", { facing: "east", type: "single", waterlogged: "false" });
  g.set(1, 5, 21, "chest", { facing: "east", type: "single", waterlogged: "false" });
  g.set(1, 5, 22, "barrel", { facing: "up", open: "false" });

  // bookcase on the E wall, south of the hall doorway (x8 z19 stays clear)
  for (const z of [21, 22]) for (const y of [5, 6]) g.set(8, y, z, "bookshelf");

  // corner lanterns for the room's ambient light
  g.set(8, 5, 17, ...B.lantern(false));
  g.set(2, 5, 22, ...B.lantern(false));
}
