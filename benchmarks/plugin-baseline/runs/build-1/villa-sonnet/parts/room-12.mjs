// ROOM 12: Culina (kitchen), plan.md ROOMS [1,2,23,9,5,30]. Working kitchen, warm and smoky: the hearth against the west
// wall (pad, lit campfire, stone-brick hood under the open flue), a counter of smoker, furnace and crafting table along
// the north wall with a water cauldron at its west end, barrels in the south-west corner, a dark-oak table with stair seats.
// Writes only inside the room air x1..9, y2..5, z23..30. Nothing over the doorway (10,2..3,27), the window (0,3..4,26) or
// the colonnade opening (7..8,2..4,31); the walkways stay clear for the 2-high path from every way in.
import {
  STONE_BRICKS, STONE_BRICK_STAIRS, CAMPFIRE, FURNACE, SMOKER, CRAFTING_TABLE, BARREL, WATER_CAULDRON, CANDLE,
  DARK_OAK_STAIRS, table, hangLamp, pot,
} from "../vocab.mjs";

export function build(g) {
  // Hearth on the west wall: a 3x3 stone_bricks pad at y2 (x1..3, z25..27), the lit campfire on it at (2,3,26).
  for (let x = 1; x <= 3; x++) for (let z = 25; z <= 27; z++) g.set(x, 2, z, STONE_BRICKS);
  g.set(2, 3, 26, CAMPFIRE, { lit: "true", facing: "north", signal_fire: "false", waterlogged: "false" });

  // Hood: a ring of upside-down stone_brick_stairs at y5 around the flue (2,5,26); the centre stays open for the smoke.
  const hood = [
    [1, 25, "east"], [1, 26, "east"], [1, 27, "east"],
    [3, 25, "west"], [3, 26, "west"], [3, 27, "west"],
    [2, 25, "south"], [2, 27, "north"],
  ];
  for (const [x, z, facing] of hood) g.set(x, 5, z, ...stairsTop(STONE_BRICK_STAIRS, facing));

  // Counter along the north wall (z=23, x5..9): a stone_bricks base at y2, the workstations on it at y3.
  for (let x = 5; x <= 9; x++) g.set(x, 2, 23, STONE_BRICKS);
  g.set(5, 3, 23, SMOKER, { facing: "south", lit: "false" });
  g.set(6, 3, 23, FURNACE, { facing: "south", lit: "false" });
  g.set(7, 3, 23, CRAFTING_TABLE);

  // Water cauldron at the north-west corner, filled to the top; a potted fern on a pedestal beside it.
  g.set(1, 2, 23, WATER_CAULDRON, { level: "3" });
  pot(g, 1, 24, "fern");

  // Barrels in the south-west corner (stored stock, lids closed).
  for (const [x, z] of [[1, 29], [1, 30], [2, 30]]) g.set(x, 2, z, BARREL, { facing: "up", open: "false" });

  // Work table in the middle of the room, x5..6 z27..28, with a stair seat on each long side and a lit candle on top.
  table(g, 5, 27, 2, 2);
  g.set(4, 2, 27, ...stairsBottom(DARK_OAK_STAIRS, "east"));
  g.set(4, 2, 28, ...stairsBottom(DARK_OAK_STAIRS, "east"));
  g.set(7, 2, 27, ...stairsBottom(DARK_OAK_STAIRS, "west"));
  g.set(7, 2, 28, ...stairsBottom(DARK_OAK_STAIRS, "west"));
  g.set(5, 4, 28, CANDLE, { lit: "true", candles: "1", waterlogged: "false" });

  // Bronze lamps hung from the ceiling over the counter and the table; light the room away from the hearth.
  hangLamp(g, 5, 24);
  hangLamp(g, 8, 28);
}

// Stairs as [block, state] pairs (the vocab B.stairs helper, with the half given here).
function stairsTop(mat, facing) {
  return [`${mat}`, { facing, half: "top", shape: "straight", waterlogged: "false" }];
}
function stairsBottom(mat, facing) {
  return [`${mat}`, { facing, half: "bottom", shape: "straight", waterlogged: "false" }];
}
