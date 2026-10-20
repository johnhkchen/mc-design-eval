// P6 Lighting and terrace edges (plan.md FLOORS, elements 23-24): the upper west terrace balustrade with its post lamps,
// the north and south terrace lamp lines on their plinths, hanging lanterns in the wing loggias, the West Front loggia
// and the East Portico, and the standing warm base light at the wing podium corners. Writes go into air only.
import { balustrade, lanternRow, baseGlow, G, MIRROR_Z } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// A standing lantern on a full-block post (never on a slab): refused over air.
function standLantern(g, x, y, z) {
  if (!g.isAir(x, y, z)) return 0;
  if (g.isAir(x, y - 1, z)) return 0;
  g.set(x, y, z, ...B.lantern(false));
  return 1;
}

// A hanging lantern under one cell of the entablature (lanternRow checks the block above).
function hang(g, x, y, z) {
  lanternRow(g, { line: { x0: x, x1: x, z0: z, z1: z }, y, hanging: true });
}

// Upper West Front terrace: the balustrade stands on the terrace's slab (y5), so its wall is at y6; posts at 41, 47, 53, 54.
// Lamps stand on the end and centre posts, at y7.
function westTerrace(g) {
  balustrade(g, { line: { axis: "x", at: 0, from: 41, to: 54 }, y: 6 });
  for (const z of [41, 47, 54]) standLantern(g, 0, 7, z);
}

// North and south terrace edges: the plinth is bricks at G and G+1 (shell). The balustrade stands on the plinth at G+2
// along the outer line, posts at x 10, 16, 22, 25 and the lamp on each post at G+3.
function terraceLampLine(g, outerZ) {
  for (let x = 10; x <= 25; x++) {
    const g0 = G(x, outerZ);
    const posts = x === 10 || x === 25 || (x - 10) % 6 === 0;
    if (!g.isAir(x, g0 + 2, outerZ)) continue;
    if (posts) g.set(x, g0 + 2, outerZ, "smooth_quartz");
    else g.set(x, g0 + 2, outerZ, ...B.wall("diorite"));
  }
  for (const x of [10, 16, 22, 25]) standLantern(g, x, G(x, outerZ) + 3, outerZ);
}

export function build(g) {
  // Terraces (west, north, south): elements 23-24.
  westTerrace(g);
  terraceLampLine(g, 0);
  terraceLampLine(g, MIRROR_Z);

  // Loggias: hanging lanterns under the entablature (y11), every second bay (bays sit on even z).
  lanternRow(g, { line: { x0: 4, x1: 4, z0: 4, z1: 16 }, y: 10, every: 4, hanging: true });        // Senate west loggia
  lanternRow(g, { line: { x0: 4, x1: 4, z0: 79, z1: 91 }, y: 10, every: 4, hanging: true });       // House west loggia
  // West Front loggia (column x8, open x9): bays 42, 46 and the mirror pair 49, 53.
  for (const z of [42, 46, 49, 53]) hang(g, 9, 10, z);
  // East Portico (x31 is open between the two rows of columns): bays 42, 46 and the mirror pair 49, 53.
  for (const z of [42, 46, 49, 53]) hang(g, 31, 10, z);

  // Base glow: standing lanterns on the wing podium ledges (y5) at the corners of the podium strips and the east podium.
  baseGlow(g, [
    [2, 5, 4], [2, 5, 16], [2, 5, 79], [2, 5, 91],
    [34, 5, 3], [34, 5, 17], [34, 5, 78], [34, 5, 92],
  ]);
}
