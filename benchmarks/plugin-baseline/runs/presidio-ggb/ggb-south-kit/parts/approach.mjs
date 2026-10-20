// Plot 1 approach and lighting (braced bents, abutment, hanging and pedestal lanterns), at plan.md's coordinates.
// Every write goes into air through the vocabulary helpers; lanterns are placed only where a block holds them up.
import { bent, abutment, hangLantern } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// plan.md bent table: c -> pedestal top and leg range (the cap runs at the row above the legs)
const BENTS = [
  [120, { pedTop: 12, legs: [13, 28] }],
  [136, { pedTop: 16, legs: [17, 27] }],
  [152, { pedTop: 20, legs: [21, 25] }],
  [168, { pedTop: 23, legs: [24, 24] }],
];

// plan.md deck level Y(z) for the descent (full and slab steps share a level)
const DECK_Y = [
  [11, 110, 34],
  [111, 123, 34],
  [124, 136, 33],
  [137, 149, 32],
  [150, 163, 31],
  [164, 176, 30],
  [177, 189, 29],
  [190, 190, 28],
];
const deckY = (z) => DECK_Y.find(([a, b]) => z >= a && z <= b)[2];

// hanging lanterns every 8 along the deck: under the arch (z 16..62) and the approach bents (z 112..190)
// z 189 is added past the every-8 rhythm: the abutment's far corners (feet y 24) read light 0 without it
const HANG_Z = [16, 24, 32, 40, 48, 56, 112, 120, 128, 136, 144, 152, 160, 168, 176, 184, 189];

// plan.md pier cap beams: x 7..23 at y 29, z 88..90 and 104..106
const PIER_CAP_Z = [89, 105];

export function build(g) {
  // the four bents, each with its cap, legs and X bracing
  for (const [c, row] of BENTS) bent(g, c, row, { span: [8, 22] });

  // the south abutment, top course y 24 (y 23 at z 190)
  abutment(g, 8, 22, 184, 190, { top: (z) => (z === 190 ? 23 : 24) });

  // hanging lanterns under the deck floor (Y-1) at x 15: lantern at Y-2, hung from the floor above it
  for (const z of HANG_Z) hangLantern(g, 15, deckY(z) - 2, z);

  // standing lanterns on each pedestal top (west pedestal at x 7, east at x 23), one per pedestal
  for (const [c, row] of BENTS) {
    const top = row.pedTop + 1;
    for (const [x, z] of [[7, c - 1], [23, c]]) if (g.isAir(x, top, z)) g.set(x, top, z, ...B.lantern(false));
  }

  // standing lanterns on the pier cap ends (cap top at y 29, lantern at y 30) on both caps
  for (const z of PIER_CAP_Z) {
    for (const x of [7, 23]) if (g.isAir(x, 30, z)) g.set(x, 30, z, ...B.lantern(false));
  }
}
