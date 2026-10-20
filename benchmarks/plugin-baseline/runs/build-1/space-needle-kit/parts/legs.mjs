// Legs and ties (P1): foot pads, six legs y1..205 with steps, pair and radial ties. (Ground is laid by build.mjs.)
import { footPad, legBox, legCentre, legStep, pairTie, radialTie, LEG_TOP_Y, LEG_TIE_Y, LEG_RADIAL_TIE_Y } from "../vocab.mjs";

const LEGS = ["Sa", "Sb", "NEa", "NEb", "NWa", "NWb"];

// The 2x2 cells of a leg's box at height y.
function boxCells(leg, y) {
  const { x0, z0 } = legCentre(leg, y, { axis: [32, 32] });
  return [[x0, z0], [x0 + 1, z0], [x0, z0 + 1], [x0 + 1, z0 + 1]];
}

export function build(g) {
  for (const leg of LEGS) footPad(g, leg, { axis: [32, 32], y: 1 });
  for (let y = 1; y <= LEG_TOP_Y; y++) {
    for (const leg of LEGS) {
      legBox(g, leg, y, { over: ["smooth_quartz"] });
      legStep(g, leg, y);
    }
  }
  // Tie levels: a leg cell that steps over a tie level has nothing under it but the tie slab, which leaves half a block
  // of air under the leg. Give each such cell a full smooth_quartz at the tie level before the ties go in (air-only).
  for (const t of [...LEG_TIE_Y, ...LEG_RADIAL_TIE_Y]) {
    for (const leg of LEGS) {
      const below = boxCells(leg, t);
      for (const [x, z] of boxCells(leg, t + 1)) {
        if (!below.some(([bx, bz]) => bx === x && bz === z)) g.set(x, t, z, "smooth_quartz");
      }
    }
  }
  for (const y of LEG_TIE_Y) pairTie(g, y);
  // A sea lantern at the middle of every pair tie (lights the legs, and no tie is a dark ledge).
  for (const y of LEG_TIE_Y) for (const p of ["S", "NE", "NW"]) {
    const a = legCentre(`${p}a`, y, { axis: [32, 32] }), b = legCentre(`${p}b`, y, { axis: [32, 32] });
    const x = Math.floor((a.cx + b.cx) / 2), z = Math.floor((a.cz + b.cz) / 2);
    if (/smooth_quartz_slab/.test(g.blockAt(x, y, z))) g.set(x, y, z, "sea_lantern", {});
  }
  for (const y of LEG_RADIAL_TIE_Y) for (const p of ["S", "NE", "NW"]) radialTie(g, p, y);
}
