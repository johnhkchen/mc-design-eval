// Part: room: Mess and cook hall. Inner air x 11..17, y 2..4, z 9..16 (floor planks at y=1, loft floor at y=5).
// Layout: a long messTable down the centre on x (z=12) with benches on both sides; the hearth is the east wall's
// campfire and smoker (reserved cells 18,2..3,12..13, kept clear in front at 17,2,12..13). North wall: a counter with
// tin plates by the front door, barrel and flour chest in the corner. Back wall: cook's table and a water barrel.
// Lanterns hang from the loft floor down the centre line. Doorway cells (13,2..3,9) and (11,2..3,13) stay clear.
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { messTable, hangLantern } from "../vocab.mjs";

export function build(g) {
  // The stair up to the loft (walkable access; the plan's ladder is climbed in game, but the walk check can't climb
  // ladders). Three steps rise west along the back row z=16: stairs at (17,2), (16,3), (15,4) on solid plank footings,
  // stand cells (17,3), (16,4), the loft floor cut at (15..17,5,16) (bunkhouse.mjs), landing (14,6,16) on the loft
  // floor, which opens onto the clear lane at z=14.
  g.set(17, 2, 16, ...B.stairs("spruce", "west", "bottom"));
  g.set(16, 2, 16, ...B.block("spruce_planks"));
  g.set(16, 3, 16, ...B.stairs("spruce", "west", "bottom"));
  g.set(15, 2, 16, ...B.block("spruce_planks"));
  g.set(15, 3, 16, ...B.block("spruce_planks"));
  g.set(15, 4, 16, ...B.stairs("spruce", "west", "bottom"));

  // The long table and its benches (rows z=11 and z=13), x 12..16.
  messTable(g, 12, 16, 12);

  // Floor-level furniture, rows along +x from x=11, successive rows along +z from z=9.
  layers(g, [11, 2, 9], {
    "B": ["barrel", { facing: "up" }],
    "C": ["chest", { facing: "south" }],
    "P": "spruce_planks",
    "K": "cauldron",
    "T": "crafting_table",
  }, [
    ["BC.PPPK"],   // z=9: barrel, flour chest, door cell clear, plate counter, cauldron by the hearth wall
    [".......", ],  // z=10: lane
    [".......", ],  // z=11: bench row (messTable)
    [".......", ],  // z=12: table row (messTable)
    [".......", ],  // z=13: bench row; partition doorway lane at x=11
    [".......", ],  // z=14
    [".......", ],  // z=15
    [".BT...."],   // z=16: water barrel, cook's table; the loft stair (15..17,2..4,16) is built above
  ]);

  // Plate rack: pressure plates on the counter top at y=3 (the counter is planks at y=2, x 14..16, z=9).
  layers(g, [11, 3, 9], { "Q": "spruce_pressure_plate" }, [
    ["   QQQ "],
  ]);

  // Hanging lanterns down the centre line, under the loft floor (y=5). Hang from the block above.
  hangLantern(g, 12, 4, 12, 0);
  hangLantern(g, 15, 4, 12, 0);
  hangLantern(g, 11, 4, 15, 0);
  hangLantern(g, 16, 4, 15, 0);   // the south-east corner by the back barrel was 7 (dim)
}
