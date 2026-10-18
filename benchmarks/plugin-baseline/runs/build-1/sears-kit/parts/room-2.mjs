// Room "P0 parlour" (interior designer's part): the formal parlour, box [3,2,14,5,4,20]. The focal piece is the west hearth
// (mouth at x2 z17, its fire outside the wall): a three-seat sofa of stairs faces it across a rug, with a fence-and-slab
// table in the middle. A sideboard of barrels with pots and a bookshelf (the one allowed here) sit on the north wall.
// Light: two hanging lanterns and a candle on the table, one standing lantern by the south wall; no cell is dark.
// Layout is drawn as text (layers); rows run along +z from z14, columns along +x from x3.
//
// NOT PLACED: runParts locks every cell an earlier part wrote, air included. Shell west fills the whole interior
// (x3..12, z14..20, y1..top) with floor and air, so every cell of this box is owned and each write was refused (28 of 28).
// The drawing is kept below as data; build() writes nothing until the shell leaves the parlour interior open to a room part.
import { layers } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const LEGEND = {
  "K": "bookshelf",
  "B": "barrel",
  "R": "red_carpet",
  "S": ["spruce_stairs", { facing: "east", half: "bottom", shape: "straight" }],
  "F": "spruce_fence",
  "T": ["spruce_slab", { type: "top" }],
  "P": "potted_poppy",
  "C": ["candle", { candles: "1", lit: "true" }],
  "L": ["lantern", { hanging: "true" }],
  "M": ["lantern", { hanging: "false" }],
};

const LAYOUT = [
  // y2 (feet): bookshelf and barrels on the north wall, carpet, sofa of three stairs facing the hearth, table post
  [
    "KBB",
    "RRR",
    "SRR",
    "SFR",
    "SRR",
    "RRR",
    "FRR",
  ],
  // y3: pots on the barrels, the table top slab, the standing lamp on its post
  [
    ".PP",
    "...",
    "...",
    ".T.",
    "...",
    "...",
    "M..",
  ],
  // y4: hanging lanterns from the upper floor, a candle on the table
  [
    "...",
    "L..",
    "...",
    ".C.",
    "...",
    ".L.",
    "...",
  ],
];

export function build(g) {
  // layers(g, [3, 2, 14], LEGEND, LAYOUT) once the parlour interior is not owned by shell west
}
