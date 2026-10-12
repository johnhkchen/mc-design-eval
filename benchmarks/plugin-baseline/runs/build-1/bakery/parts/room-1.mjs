// Room: shop (Verkaufsraum). Interior designer's part: fills the inner air box [7,2,10,15,5,15] only.
// Layout (x 7..15 across, z 10..15 down; front door at x=11 on z=9, wing doorway landing (15,2,15), archway (11..12,15)):
//   - customers' side at the front: a bench under the west window (7,2,11..12), a red rug (9..10,11..12)
//   - the counter at z=13 with a gate at x=11..12 (the shopkeeper's passage) and the bread racks behind it at z=14
//   - cake and candle_cake display on the counter and racks: the focal piece, lit by the candles and the hanging lanterns
//   - flour store in the corners: barrels and hay sacks at the east (14..15, 10..11) and the back-west (7,13), (9..10,15)
//   - the corridor z=15 (x 11..15) and the gate x=11..12 stay clear: archway and wing doorway stay walkable
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ORIGIN = [7, 2, 10]; // x0 y0 z0 of the room box

const LEGEND = {
  B: ["spruce_stairs", { facing: "west", half: "bottom", shape: "straight" }], // bench seat, back to the west window
  P: "spruce_planks", // counter body and bread racks
  b: ["barrel", { facing: "up" }], // flour barrels
  h: "hay_block", // flour sacks
  r: "red_carpet", // the one red accent, a rug in front of the bench
  c: "cake", // bread and cake display
  C: ["candle_cake", { lit: true }], // lit display: a light source at the focal counter
  l: ["lantern", { hanging: true }], // hanging lanterns from the upper floor (y=6)
};

// rows run along +x (x=7..15), successive rows along +z (z=10..15); '.' is free air
const LAYERS = [
  [ // y=2
    ".......bb",   // z=10 barrels at (14,2,10),(15,2,10)
    "B.rr...hb",   // z=11 bench (7), rug (9..10), flour sack (14), barrel (15)
    "B.rr.....",   // z=12 bench (7), rug (9..10)
    "bPPP..PP.",   // z=13 flour barrel (7), counter (8..10) and (13..14), gate at 11..12
    "..PP..PP.",   // z=14 bread racks behind the counter, gate at 11..12 kept clear
    "..hb.....",   // z=15 flour sack (9) and barrel (10); corridor x=11..15 kept clear
  ],
  [ // y=3: what sits on the counters and racks
    ".........",   // z=10
    ".........",   // z=11
    ".........",   // z=12
    ".cCc..cC.",   // z=13 cakes and candle cakes on the counter (lit focal piece)
    "..cc..cc.",   // z=14 cakes on the bread racks
    "..h......",   // z=15 hay sack on the barrel stack
  ],
  [ // y=4: nothing, the room is open to y=5
    ".........", ".........", ".........", ".........", ".........", ".........",
  ],
  [ // y=5: hanging lanterns from the upper floor (y=6), on the rhythm of the room
    ".........",   // z=10
    "..l...l..",   // z=11 lanterns at (9,5,11) and (13,5,11) over the customers
    ".........",   // z=12
    ".........",   // z=13 keep the counter's light on the candles, not on the ceiling
    "..l...l..",   // z=14 lanterns at (9,5,14),(13,5,14) over the bread racks
    ".........",   // z=15
  ],
];

export function build(g) {
  layers(g, ORIGIN, LEGEND, LAYERS);
}
