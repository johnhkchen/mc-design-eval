// Part 4, Facades and fittings: glass bays, timber posts, canopies and shop doors on the T1, T2, T3 and T3N west faces;
// H balconies on the housing; M1 quartz windows and cornice; M2 stall awning. Site coordinates (plot 0 local x + 81).
// Writes only into air (the lit strips and openings shell0 left), so an earlier part's solid is never touched.
import { onFootprint, PLOT0, glassBay, shopDoor, canopyBay, balconyBay, quartzWindow, cornice, awningStall } from "../vocab.mjs";

const X = PLOT0[0];
const fp = (lx, z) => onFootprint(0, lx, z);
// a bay of 5 cells from z0 is written only where every cell is on the footprint at the pane column (lx + 1)
const bayOn = (lx, z0, zB) => { for (let z = z0; z < z0 + 5 && z <= zB; z++) if (!fp(lx + 1, z)) return false; return true; };

// west-face glass tiers: a face segment is [lx, z0, z1]; bays start at z0 and run 5 long, every 3rd is a metal panel
function glassTier(g, { segs, F, kick = false, canopy = true, bracket = false, skipPanel = [] }) {
  let n = 0;
  for (const [lx, zA, zB] of segs) {
    for (let z0 = zA, i = 0; z0 <= zB; z0 += 5, i++) {
      if (!bayOn(lx, z0, zB)) continue;
      const panel = i % 3 === 2 && !skipPanel.includes(z0);
      glassBay(g, { x: X + lx, z0, F, kick, panel });
      n++;
    }
    if (canopy) canopyBay(g, { x: X + lx, z0: zA, z1: zB, F, bracket });
  }
  return n;
}

export function build(g) {
  // T1 lower shop tier, storefront floor deck 6 (glass y7..11). Doors at z151, 181, 211.
  glassTier(g, {
    segs: [[21, 126, 244], [28, 91, 125], [35, 77, 90]],
    F: 6, skipPanel: [],
  });
  for (const z of [151, 181, 211]) shopDoor(g, { x: X + 21, z, y: 7, facing: "west" });

  // T2 gallery tier, floor deck 13: the long glass gallery with a gray kick row at F+1. Doors at z141, 196.
  glassTier(g, { segs: [[42, 63, 230]], F: 13, kick: true });
  for (const z of [141, 196]) shopDoor(g, { x: X + 42, z, y: 14, facing: "west" });

  // T3 plaza tier, floor deck 20: shopfronts on its west face. Doors at z161, 201.
  glassTier(g, { segs: [[70, 140, 230]], F: 20, bracket: true });
  for (const z of [161, 201]) shopDoor(g, { x: X + 70, z, y: 21, facing: "west" });

  // T3N north hall under the plaza, floor deck 22: one glass storey y23..27 on its west face (x 77)
  // no canopy: the beam at F+6 = 28 is the plaza deck itself
  glassTier(g, { segs: [[77, 98, 139]], F: 22, canopy: false });

  // H housing balconies on the T2 face (x 42): balcony floors at 20, 27, 34 (balconyBay, 7-deep bays)
  for (const F of [20, 27, 34]) for (let k = 0; k < 9; k++) {
    const z0 = 70 + 7 * k;
    if (!fp(40, z0 + 1) || !fp(41, z0 + 1)) continue;
    balconyBay(g, { z0, F, x: X + 42 });
  }

  // M1 old market building, west face (x 98): 2x3 quartz windows every 4 at y41 and y47, z 0..27
  for (let z = 0; z + 1 <= 27; z += 4) {
    if (!fp(98, z) || !fp(98, z + 1)) continue;
    for (const y of [41, 47]) quartzWindow(g, { face: "west", at: X + 98, pos: z, y });
  }
  // the M1 cornice at y52 over the box of the old building
  cornice(g, { box: { x0: X + 98, x1: X + 118, z0: 0, z1: 69 }, y: 52 });

  // M2 Pike Place stall shed: posts every 4, striped awning at y36, lanterns
  awningStall(g, { x0: X + 119, x1: X + 125, z0: 70, z1: 97, floor: 31 });
}
