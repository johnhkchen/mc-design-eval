// NMAI shell (plan.md PARTS 5): the four stacked elliptical strata tiers with their tier-top rings, the east cantilever
// lobes over the porch, the ribbon slits, the Potomac dome, the east entrance doors and the porch lanterns. Writes only
// into air: an earlier part's cell is never touched. The upper tiers are open over the Potomac atrium.
import { carve, B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  tier, tier_ring, ribbon, potomac_dome, door_pair, hang_lantern, strata_material, inEllipse,
  NMAI_TIERS, NMAI_LOBES, NMAI_DOME,
} from "../vocab.mjs";

const E = (t) => ({ cx: t.cx, cz: t.cz, rx: t.rx, rz: t.rz });
const arr = (e) => [e.cx, e.cz, e.rx, e.rz];                              // tier_ring takes [cx, cz, rx, rz]
const ATRIUM = { cx: 110, cz: 10, rx: 5, rz: 5 };                        // the Potomac atrium under the dome (plan FLOORS)
const inE = (e, x, z) => inEllipse(x, z, e.cx, e.cz, e.rx, e.rz);

// the cells of lobe L that no skipped ellipse already holds
function cellsOf(L, skip) {
  const cells = [];
  for (let z = L.cz - L.rz; z <= L.cz + L.rz; z++)
    for (let x = L.cx - L.rx; x <= L.cx + L.rx; x++)
      if (inEllipse(x, z, L.cx, L.cz, L.rx, L.rz) && !skip.some((e) => inE(e, x, z))) cells.push([x, z]);
  return cells;
}

export function build(g) {
  const [t1, t2, t3, t4] = NMAI_TIERS;
  const [l1, l2] = NMAI_LOBES;

  // the four tiers: T1 is the ground storey (solid floor at y1); T2..T4 leave the atrium open
  tier(g, t1.cx, t1.cz, t1.rx, t1.rz, t1.y0, t1.y1);
  for (const t of [t2, t3, t4]) tier(g, t.cx, t.cz, t.rx, t.rz, t.y0, t.y1, { open: ATRIUM });

  // tier-top rings: the exposed ring of each tier, closed by a slab over the course above
  tier_ring(g, arr(t2), arr(t3), 9, "smooth_sandstone");
  tier_ring(g, arr(t3), arr(t4), 12, "smooth_sandstone");
  tier_ring(g, arr(t4), [ATRIUM.cx, ATRIUM.cz, 5.5, 5.5], 14, "cut_sandstone"); // inner 5.5: the dome base stairs sit on the drum edge

  // east lobes: solid cantilevers outside the tiers they sit on, strata courses, slab tops
  const t2E = E(t2), t3E = E(t3);
  const lobe1 = cellsOf(l1, [t2E]);
  const lobe2 = cellsOf(l2, [t2E, t3E]);
  const lobe2Keys = new Set(lobe2.map(([x, z]) => `${x},${z}`));
  for (let y = l1.y0; y <= l1.y1; y++)
    for (const [x, z] of lobe1) g.set(x, y, z, strata_material(y, x, z));
  for (let y = l2.y0; y <= l2.y1; y++)
    for (const [x, z] of lobe2) g.set(x, y, z, strata_material(y, x, z));
  for (const [x, z] of lobe1)
    if (!lobe2Keys.has(`${x},${z}`)) g.set(x, l1.y1 + 1, z, ...B.slab("smooth_sandstone", "bottom"));
  for (const [x, z] of lobe2) g.set(x, l2.y1 + 1, z, ...B.slab("smooth_sandstone", "bottom"));

  // ribbon slits on the south and west arcs: T2 at y6, T3 at y10
  const southWest = (x, z) => z >= 14 || x <= 101;
  ribbon(g, E(t2), t2.y0 + 1, southWest, { every: 4, over: true });
  ribbon(g, E(t3), t3.y0 + 1, southWest, { every: 4, over: true });

  // east entrance: two dark oak door pairs in the outer cell of T1's east wall (carved first), facing east
  carve(g, [125, 2, 8], [125, 3, 11]);
  door_pair(g, 125, 2, 8, "east", "dark_oak_door");
  door_pair(g, 125, 2, 10, "east", "dark_oak_door");

  // porch lanterns hung from the lobe soffit
  for (const [x, z] of [[128, 8], [128, 12], [130, 10]]) hang_lantern(g, x, 4, z);

  // the Potomac dome on the T4 drum course
  potomac_dome(g, [NMAI_DOME.cx, NMAI_DOME.cy, NMAI_DOME.cz], NMAI_DOME.r);
}
