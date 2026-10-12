// Room: Chandler's workshop (interior designer's part, box [6,2,18,12,5,26]). Dipping and moulding room, hot and dim,
// open to the rafters. Focal piece: the rendering hearth at the south (its firebox and campfire are the chimney part's),
// with a pair of tallow cauldrons in front of it. Two candle vats and a dipping wheel stand in the middle; a moulding
// bench runs along the north-west wall; barrels line the west and east walls, each lit by a lantern or a candle cluster
// on its top. Lanes: the shop doorway (10,18) runs south down x=10 to the wheel; the east column x=12 and the west
// column x=6 go round the wheel to the hearth front (z=26).
import { layers, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { candleVat, dippingWheel, candleCluster } from "../vocab.mjs";

// Floor grid: x 6..12 (seven columns), z 18..26 (nine rows), both inclusive; origin [6, y, 18].
export function build(g) {
  // ground-level furniture (y=2, standing on the stone_bricks floor at y=1)
  layers(g, [6, 2, 18], {
    p: "dark_oak_planks",   // moulding bench base
    b: "barrel",
    h: "cauldron",          // tallow pots in front of the rendering hearth
    s: B.stairs("dark_oak", "south"),  // the bench's stool, its back to the south
    g: "grindstone",        // moulding station on the east side of the lane
  }, [
    "ppp....",  // z18: moulding bench, x6..8
    "bs....b",  // z19: barrels west and east, lanterns on top; stool at (7,19)
    ".......",  // z20: vat at (8,20) (candleVat below)
    "....g..",  // z21: grindstone at (11,21), beside the lane
    "b......",  // z22: barrel west, candles on top
    ".......",  // z23
    ".......",  // z24: dipping wheel post at (9,24)
    ".......",  // z25
    "b.hh..b",  // z26: barrels in the corners, tallow cauldrons at x8..9
  ]);

  // bench top, bottom slab over the planks
  layers(g, [6, 3, 18], {
    q: ["dark_oak_slab", { type: "bottom", waterlogged: "false" }],
    l: B.lantern(false),    // lanterns standing on the west and east barrels
  }, [
    "qqq....",  // z18
    "l.....l",  // z19: lanterns on the barrels at (6,19) and (12,19)
    ".......",  // z20
    ".......",  // z21
    ".......",  // z22
    ".......",  // z23
    ".......",  // z24
    ".......",  // z25
    "l.....l",  // z26: lanterns on the corner barrels at (6,26) and (12,26)
  ]);

  // the candle vats: a water cauldron and a dry one, each with a trapdoor lid to the east
  candleVat(g, 8, 2, 20, { water: true, lid: "east" });
  candleVat(g, 8, 2, 22, { lid: "east" });

  // the dipping wheel: post at (9,2,24), a five-wide bar at y=3, candles lit on the bar
  dippingWheel(g, 9, 2, 24);

  // the lit candle cluster on the west barrel at (6,22)
  candleCluster(g, 6, 3, 22, "yellow_candle", 4);
}
