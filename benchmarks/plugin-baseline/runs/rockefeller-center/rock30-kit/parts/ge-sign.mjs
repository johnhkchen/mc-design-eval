// Part 5: GE crown sign. Big red "GE" (11 tall, rounded block glyphs, 2-block strokes) on the north face (z12) and south
// face (z43) of the tower crown, centred on the flank (x68..111), in the band x76..103, y197..209. Letters are
// red_stained_glass in the face line (layer 0) over the shroomlight backing at layer -1, so they glow; every other band
// cell on layer 0 is a white_terracotta board, and layer -2 limestone holds the sign. Glyphs are drawn here (the plaque
// alphabet came out too small to read from the air); each face is laid in its own viewer's reading order.
import { GE_SIGN, LIMESTONE, SHROOMLIGHT, SIGN_RED } from "../vocab.mjs";

const free = (g, x, y, z) => { const c = g.get(x, y, z); return !c || c.block === "minecraft:air"; };

// Rows top to bottom, columns in reading order (left to right as the viewer sees them).
const G = [
  "..#####..",
  ".#######.",
  "##.....##",
  "##.......",
  "##.......",
  "##..#####",
  "##..#####",
  "##.....##",
  "##.....##",
  ".#######.",
  "..#####..",
];
const E = [
  ".######",
  "#######",
  "##.....",
  "##.....",
  "##.....",
  "######.",
  "######.",
  "##.....",
  "##.....",
  "#######",
  ".######",
];
const GAP = 3;
const WORD = G.map((row, i) => row + ".".repeat(GAP) + E[i]);   // 19 x 11
const FACE_MID = 89.5;                                           // the flank x68..111
const Y_TOP = 208;                                               // glyphs y198..208

// side: "north" (inward is +z) or "south" (inward is -z). Layer k (0 = face line, -1, -2 inward) is line + s*k with s = -1 north, +1 south.
function sign(g, side, line, [x0, x1], [y0, y1]) {
  const s = side === "north" ? -1 : 1;
  const w = WORD[0].length;
  const lo = Math.round(FACE_MID - (w - 1) / 2);                 // lowest x the word covers
  // a north-face viewer looks south and has +x on the left; a south-face viewer has -x on the left
  const xAt = (col) => (side === "north" ? lo + w - 1 - col : lo + col);
  const letter = new Set();
  WORD.forEach((row, r) => [...row].forEach((ch, c) => { if (ch === "#") letter.add(`${xAt(c)},${Y_TOP - r}`); }));
  for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) {
    if (free(g, x, y, line)) g.set(x, y, line, letter.has(`${x},${y}`) ? SIGN_RED : LIMESTONE);   // letters / board (layer 0)
    if (free(g, x, y, line - s)) g.set(x, y, line - s, SHROOMLIGHT);                              // lit backing (layer -1)
    if (free(g, x, y, line - 2 * s)) g.set(x, y, line - 2 * s, LIMESTONE);                        // back layer (-2)
  }
}

export function build(g) {
  const { x, y, z: [zN, zS] } = GE_SIGN;
  sign(g, "north", zN, x, y);
  sign(g, "south", zS, x, y);
}
