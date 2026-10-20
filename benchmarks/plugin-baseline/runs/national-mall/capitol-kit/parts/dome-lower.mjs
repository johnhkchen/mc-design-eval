// P3 Dome lower: the square base, the colonnaded peristyle (d16 columns, lit calcite drum d12), the entablature disc and
// its balustrade ring at y21..22, and the attic (d14 ring y22..24 with a window course, cornice disc y25). Dome axis from
// plan.md SITE: x 20, z 48. Writes go into air only; the shell above (P4) starts on the y25 disc.
import { domeBase, peristyle, disc, ringPost, attic } from "../vocab.mjs";

const CX = 20, CZ = 48;
const SMOOTH_STONE = "smooth_stone";

// The plan's round course: kept cells of the d disc, the cell centre within d/2 of the axis.
const kept = (d) => {
  const cells = [];
  for (let x = CX - d / 2; x < CX + d / 2; x++) for (let z = CZ - d / 2; z < CZ + d / 2; z++) {
    if ((x + 0.5 - CX) ** 2 + (z + 0.5 - CZ) ** 2 <= (d / 2) ** 2) cells.push([x, z]);
  }
  return cells;
};

export function build(g) {
  // 1. Square base: smooth_quartz y12..13, top-slab cornice at y14 (the peristyle's floor ring is its top).
  domeBase(g, { cx: CX, cz: CZ, size: 18, y0: 12, cornice: "top" });

  // 2. Peristyle: 24 quartz_pillar columns on the d16 ring y15..20, the calcite drum d12 with lit windows y16..19,
  //    standing lanterns on the floor ring between columns.
  peristyle(g, { cx: CX, cz: CZ, colD: 16, drumD: 12, y0: 15, y1: 20, winY0: 16, winY1: 19 });

  // 3. The drum's interior is solid smooth_stone (no hollow under the disc), so no dark pocket spawns mobs.
  //    Only air is written: the glowstone cells that light the windows stay as they are.
  const drum = new Set(kept(12).map(([x, z]) => `${x},${z}`));
  for (const [x, z] of kept(12)) {
    const inner = [[1, 0], [-1, 0], [0, 1], [0, -1]].every(([dx, dz]) => drum.has(`${x + dx},${z + dz}`));
    if (!inner) continue;
    for (let y = 15; y <= 20; y++) if (g.isAir(x, y, z)) g.set(x, y, z, SMOOTH_STONE);
  }

  // 4a. Hidden floodlights: glowstone in the entablature's soffit over the void between columns and drum (cells under the
  //     attic, so unseen from above), lighting the colonnade and drum warmly at dusk.
  const k = (x, z) => `${x},${z}`, d12 = new Set(kept(12).map(([x, z]) => k(x, z)));
  for (const [x, z] of kept(14)) if (!d12.has(k(x, z))) g.set(x, 21, z, "glowstone");

  // 4. Entablature: a full d16 disc at y21 (the peristyle's roof), with the balustrade ring on its outer cells at y22.
  disc(g, { cx: CX, cz: CZ, d: 16, y: 21, block: "smooth_quartz" });
  ringPost(g, { cx: CX, cz: CZ, d: 16, y0: 22, y1: 22, block: "diorite_wall" });

  // 5. Attic: d14 ring y22..24 with a window in every third ring cell at y23, solid core, cornice disc y25.
  attic(g, { cx: CX, cz: CZ, d: 14, y0: 22, y1: 24, cornice: 25 });
}
