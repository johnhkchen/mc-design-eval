// P5 Facade fittings: windowBay for every OPENINGS row (tall with diorite lintels, short, every third lit from behind),
// archOpening on the wing podium and the West Front arcade, bronzeDoor x3. Pilasters and the y11 chiseled panels are not
// placed: their cells are shell wall (locked), see plan.md Notes. Every cell written here is air the shell reserved.
import { G, windowBay, archOpening, bronzeDoor, CORE } from "../vocab.mjs";

const MZ = (z) => 95 - z;                          // the House mirror (plan.md: z -> 95 - z)
const FLIP = { north: "south", south: "north", east: "east", west: "west" };
const IN = { west: [1, 0], east: [-1, 0], north: [0, 1], south: [0, -1] }; // inward step from the outer cell
const BOTH = [[6, 7, true], [9, 10, false]];      // tall window (lintel at y8) over a short one
const TALL = [[6, 7, true]];                      // tall window only
const TALL3 = [[6, 8, true]];                     // the West Front loggia's three-high windows (lit, all six)

const seq = (a, b, step = 1) => Array.from({ length: Math.floor((b - a) / step) + 1 }, (_, i) => a + i * step);

// Unlit window: its glow cell (two in from the outer cell) is solid core, so no air pocket is left inside the wall.
function closeCore(g, face, wall, pos, y0, y1) {
  const [dx, dz] = IN[face];
  const along = face === "west" || face === "east";
  for (let y = y0; y <= y1; y++) {
    const x = along ? wall + 2 * dx : pos, z = along ? pos : wall + 2 * dz;
    if (g.isAir(x, y, z)) g.set(x, y, z, CORE);
  }
}

// One wall's bays: entries [pos, rows, forceLit]. Sorted along the face; every third bay (index 2, 5, ...) is lit.
function bays(g, face, wall, entries) {
  const sorted = [...entries].sort((a, b) => a[0] - b[0]);
  sorted.forEach(([pos, rows, forceLit], i) => {
    const lit = forceLit ?? i % 3 === 2;
    for (const [y0, y1, tall] of rows) {
      windowBay(g, { face, wall, pos, y0, y1, tall, lit });
      if (!lit) closeCore(g, face, wall, pos, y0, y1);
    }
  });
}

export function build(g) {
  // Wings: Senate (north, m = false) and House (south, m = true, the mirror of every z and the north/south faces).
  for (const m of [false, true]) {
    const z = (v) => (m ? MZ(v) : v);
    const side = (face) => (m ? FLIP[face] : face);
    const wallNS = (n, s) => (m ? s : n);

    // west colonnade wall x5: windows at every even z 4..16 (House 79..91)
    bays(g, "west", 5, seq(4, 16, 2).map((p) => [z(p), BOTH]));

    // east wall x33: z 3,5,15,17 tall and short; 7,9,11,13 tall only (inside the portico); the door is at z10 / z85
    const eastRows = (p) => ([3, 5, 15, 17].includes(p) ? BOTH : [7, 9, 11, 13].includes(p) ? TALL : null);
    bays(g, "east", 33, seq(3, 17).filter((p) => eastRows(p)).map((p) => [z(p), eastRows(p)]));

    // north end (Senate z2, House z93) and south inner end (Senate z18, House z77): odd x, both rows
    bays(g, side("north"), wallNS(2, 93), seq(5, 31, 2).map((x) => [x, BOTH]));
    bays(g, side("south"), wallNS(18, 77), [5, 7, 9, 11, 13, 29, 31, 33].map((x) => [x, BOTH]));

    // podium arches (x2): opening y G..2, head at y3, z 4..16 even (House 79..91 odd)
    for (const p of seq(4, 16, 2)) {
      const zz = z(p);
      archOpening(g, { x: 2, z: zz, y0: G(2, zz), y1: 2, face: "west" });
    }
  }

  // Connectors: west x15 and east x27, z 20,22,24 (north) and 71,73,75 (south), both rows
  for (const zs of [[20, 22, 24], [71, 73, 75]]) {
    bays(g, "west", 15, zs.map((p) => [p, BOTH]));
    bays(g, "east", 27, zs.map((p) => [p, BOTH]));
  }

  // Central block west wall x10: z 28..40 and the House 55..67, both rows; the West Front six (lit, three-high)
  bays(g, "west", 10, [
    ...seq(28, 40, 2).map((p) => [p, BOTH]),
    ...seq(28, 40, 2).map((p) => [MZ(p), BOTH]),
    ...[42, 44, 46, 49, 51, 53].map((p) => [p, TALL3, true]),
  ]);
  // Central block east wall x29: z 27..35 and 60..68, both rows
  bays(g, "east", 29, [
    ...seq(27, 35, 2).map((p) => [p, BOTH]),
    ...seq(27, 35, 2).map((p) => [MZ(p), BOTH]),
  ]);
  // Central block ends: north wall z26 and south wall z69, x 11, 13, 29 tall only
  bays(g, "north", 26, [11, 13, 29].map((x) => [x, TALL]));
  bays(g, "south", 69, [11, 13, 29].map((x) => [x, TALL]));

  // West Front arcade x0: arches at z 42,44,46, 47, 48, 49,51,53; opening y1..2, head at y3
  for (const zz of [42, 44, 46, 47, 48, 49, 51, 53]) archOpening(g, { x: 0, z: zz, y0: 1, y1: 2, face: "west" });

  // Bronze doors (dark_oak, transom above): Senate east z10, House east z85, West Front x10 z47..48, East Portico x29
  bronzeDoor(g, { x: 33, z: 10, face: "east", w: 1 });
  bronzeDoor(g, { x: 33, z: 85, face: "east", w: 1 });
  bronzeDoor(g, { x: 10, z: 47, face: "west", w: 2 });
  bronzeDoor(g, { x: 29, z: 47, face: "east", w: 2 });
}
