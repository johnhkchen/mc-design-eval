// Part 5, East roofs and atrium (plan.md PARTS 5): the tower decks at y 19 inside their coping rings, the lanterns hung
// from the atrium's spine, and a froglight in each tower. The body needs no deck: planarWall (the shell) makes it solid
// marble to its calcite coping. The atrium's glass space frame and its floor lights are not laid here: the shell carves
// the atrium void as air through y 14, and runParts locks that air, so those writes would be refused.
import { hangLamp } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// The flat-topped towers, rows [z, x0, x1] (plan TOWERS). The prow's tip cell (108, 33) has no interior.
const TOWERS = [
  [[0, 105, 105], [1, 105, 108], [2, 105, 111], ...[3, 4, 5, 6, 7, 8].map((z) => [z, 105, 112]), [9, 108, 112], [10, 111, 112]],
  [[20, 111, 112], [21, 108, 112], ...[22, 23, 24, 25, 26, 27].map((z) => [z, 105, 112]), [28, 105, 111], [29, 105, 108], [30, 105, 105]],
  [[13, 143, 144], [14, 143, 147], [15, 143, 150], ...[16, 17, 18, 19].map((z) => [z, 143, 153]), [20, 144, 153], [21, 147, 153], [22, 150, 153], [23, 153, 153]],
  [[28, 116, 123], [29, 116, 123], [30, 116, 123], [31, 113, 120], [32, 110, 117], [33, 108, 115]],
  [...Array.from({ length: 8 }, (_, i) => [24 + i, 145, 153])],
];

// The tower footprint's cells, and the interior ones (all four neighbours inside the footprint), as towerPrism sees them.
function footprint(rows) {
  const cells = new Set();
  for (const [z, x0, x1] of rows) for (let x = x0; x <= x1; x++) cells.add(`${x},${z}`);
  return cells;
}
function interior(cells) {
  return [...cells].map((k) => k.split(",").map(Number))
    .filter(([x, z]) => [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => cells.has(`${x + dx},${z + dz}`)));
}

export function build(g) {
  // Tower decks: a bottom slab at y 19 on each interior cell, inside the calcite coping ring (the shell's perimeter).
  for (const rows of TOWERS) {
    const cells = footprint(rows);
    for (const [x, z] of interior(cells)) g.set(x, 19, z, ...B.slab("smooth_stone", "bottom"));
  }

  // Lanterns hang from the spine ribs (z 16, under the space frame at y 14) to glow at dusk. With no frame over the
  // court (see the header) hangLamp finds no block above and places nothing.
  for (const x of [118, 122, 126, 130]) hangLamp(g, x, 13, 16);

  // One froglight in each tower, in the interior cell nearest its middle. The shell's solid body fills y 0..14 under the
  // towers, so the light sits at y 15, the first open cell, on the calcite course the shell leaves at y 14.
  for (const rows of TOWERS) {
    const inner = interior(footprint(rows));
    if (!inner.length) continue;
    const cx = inner.reduce((s, [x]) => s + x, 0) / inner.length, cz = inner.reduce((s, [, z]) => s + z, 0) / inner.length;
    const [x, z] = inner.reduce((best, c) => (Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best));
    g.set(x, 15, z, "pearlescent_froglight");
  }
}
