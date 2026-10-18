// Rotunda columns and entablature: the 16 granite giant columns (corinthianCol) on the shaft cells of plan.md, the 8
// giant arch archivolts with keystones and inner pilasters (archivolt), the column break-outs of the entablature
// (architrave y30, frieze y31..32, cornice course y33), and the cornice with its ledge caps at y34 (cornice).
// The ring part owns the piers, the entablature band itself and the plinth; everything here only builds into air.
import { corinthianCol, archivolt, cornice } from "../vocab.mjs";

const C = 31.5;

// Shaft min cells (x, z) of the 16 columns, the same list plan.md gives and ring.mjs uses.
const SHAFTS = [[23, 3], [39, 3], [23, 59], [39, 59], [3, 23], [3, 39], [59, 23], [59, 39],
  [45, 5], [57, 17], [17, 5], [5, 17], [57, 45], [45, 57], [5, 45], [17, 57]];

// Octagon tests about the rotunda centre (plan.md): outer flat 27 (corners 38), attic outline 25 (corners 35.5).
const inOct = (dx, dz, r, corner) => Math.abs(dx) <= r && Math.abs(dz) <= r && Math.abs(dx) + Math.abs(dz) <= corner;
const inOuter = (x, z) => inOct(x - C, z - C, 27, 38);
const inAttic = (x, z) => inOct(x - C, z - C, 25, 35.5);

// The 4x4 break-out over each column (shaft ±1), the part of it that stands outside the ring.
const inBreakOut = (x, z) => SHAFTS.some(([sx, sz]) => x >= sx - 1 && x <= sx + 2 && z >= sz - 1 && z <= sz + 2);

const ARCH_FACES = ["n", "s", "e", "w", "ne", "nw", "se", "sw"];

// Min corners of the eight attic statue piers' 2x2 strips (dome.mjs). The ledge slab stays out of them, so the pier's
// own y34 cell (cut_sandstone) is placed there and the pier stands on the ledge's level, not on a slab.
const PIER_MIN = [[20, 5], [42, 5], [20, 57], [42, 57], [5, 20], [5, 42], [57, 20], [57, 42]];
const inPier = (x, z) => PIER_MIN.some(([px, pz]) => x >= px && x <= px + 1 && z >= pz && z <= pz + 1);

export function build(g) {
  // 1. The sixteen granite columns: base y1..2, shaft y3..27, capital y28, abacus y29. Their capitals' outer row
  //    meets the ring at z 5 (or the matching cell on other faces) and is refused there: the ring is locked.
  let cols = 0, colRefused = 0;
  for (const [sx, sz] of SHAFTS) {
    const r = corinthianCol(g, sx + 0.5, sz + 0.5, "granite");
    cols += r.placed ?? r; colRefused += r.refused ?? 0;
  }

  // 2. Break-outs of the entablature over each column: architrave y30 (cut), frieze y31..32 and cornice course y33
  //    (smooth), only on the cells outside the ring (inside is the ring's own entablature band).
  let outs = 0;
  for (const [sx, sz] of SHAFTS) for (let x = sx - 1; x <= sx + 2; x++) for (let z = sz - 1; z <= sz + 2; z++) {
    if (inOuter(x, z) || !g.isAir(x, 30, z)) continue;
    g.set(x, 30, z, "cut_sandstone");
    for (let y = 31; y <= 33; y++) g.set(x, y, z, "smooth_sandstone");
    outs++;
  }

  // 3. Giant arch rings: outer archivolt on the outer face (s 27), inner archivolt and pilasters on the inner (s 21).
  let arch = 0, archRefused = 0;
  for (const f of ARCH_FACES) for (const [side, s] of [["out", 27], ["in", 21]]) {
    const r = archivolt(g, [C, C], f, side, s);
    arch += r.placed; archRefused += r.refused;
  }

  // 4. Cornice round the outer edge at y33: upside-down stairs one proud of the octagon and the break-outs, and bottom
  //    slabs on the ledge at y34 over the ring top (outside the attic outline).
  const shape = (x, z) => inOuter(x, z) || inBreakOut(x, z);
  const corn = cornice(g, [0, 33, 0, 63, 33, 63], {
    shape,
    infill: false,
    ledge: (x, z) => shape(x, z) && !inAttic(x, z) && !inPier(x, z),
  });

  console.log(`columns: columns ${cols} (refused ${colRefused}), break-outs ${outs}, archivolts ${arch} (refused ${archRefused}), cornice ${corn}`);
}
