// Olmsted terrace (plan.md part 3): both marble tiers, balustrades, stair flights, fountains, grotto niche.
// The mapped ground climbs past the plan's tier tops (H 10..11 east of x 170 on rows 40..80), so each column's marble
// mass runs from the ground H up to its tier top, and where the ground already stands higher the marble lies on the
// ground's own top block: the terrace follows the land. Tier 2 (x171..182, z30..94) rises to 11 on top of Tier 1.
import { readFileSync } from "node:fs";
import { pilaster, terraceFlight, balustradeRun, fountainBasin, grottoNiche } from "../vocab.mjs";

const ROWS = readFileSync(new URL("./heights.txt", import.meta.url), "utf8").trim().split("\n");
const heightAt = (x, z) => parseInt(ROWS[z][x], 36);
const COPING = ["smooth_quartz_slab", { type: "top", waterlogged: "false" }];   // a marble coping slab, top half

const T1 = { x0: 159, x1: 182, z0: 14, z1: 110, top: 9 };
const T2 = { x0: 171, x1: 182, z0: 30, z1: 94, top: 11 };
// the rows where the central and side flights meet the terrace face: the body stops at x 159 / x 171
const GAPS_T1 = [[33, 39], [52, 58], [65, 71], [85, 91]];
const GAPS_T2 = [[34, 38], [52, 58], [65, 71], [86, 90]];
const NICHE = { z0: 60, z1: 63, y0: 7, y1: 8 };             // grotto niche in the face (x 159), a recess by omission
const inRanges = (z, list) => list.some(([a, b]) => z >= a && z <= b);
const inT2 = (x, z) => x >= T2.x0 && x <= T2.x1 && z >= T2.z0 && z <= T2.z1;

// the pier cells of a straight balustrade: every 8 from `from`, at `to`, and either side of each gap
function piers(from, to, gaps) {
  const out = [];
  for (let t = from; t <= to; t++) {
    if (inRanges(t, gaps)) continue;
    if ((t - from) % 8 === 0 || t === to || gaps.some(([a, b]) => t === a - 1 || t === b + 1)) out.push(t);
  }
  return out;
}

// The marble mass of one column: smooth_quartz from the cell above the ground top H up to `top` (the ground part owns H).
// `skip(y)` leaves a cell to a helper that places its own block there (the niche, the flight cheeks, the stair gaps).
function mass(g, x, z, top, skip = () => false) {
  const h = heightAt(x, z);
  for (let y = h + 1; y <= top; y++) {
    if (skip(y)) continue;
    g.set(x, y, z, "smooth_quartz");
  }
}

export function build(g) {
  // Tier 1 and Tier 2 masses, column by column
  for (let x = T1.x0; x <= T1.x1; x++) for (let z = T1.z0; z <= T1.z1; z++) {
    const top = inT2(x, z) ? T2.top : T1.top;
    const gap = inRanges(z, GAPS_T1);
    mass(g, x, z, top, (y) => {
      if (x === 159 && gap && y <= 8) return true;                                   // stair opening: no body at the face
      if (x === 159 && z >= NICHE.z0 - 1 && z <= NICHE.z1 + 1 && y >= NICHE.y0 && y <= NICHE.y1) return true;
      if (x === 159 && z >= NICHE.z0 && z <= NICHE.z1 && y === 9) return true;      // the niche's lintel
      if (x === 160 && z >= NICHE.z0 && z <= NICHE.z1 && y >= NICHE.y0 && y <= NICHE.y1) return true; // the niche back wall
      return false;
    });
  }

  // the Tier 2 face: a coping slab at 11 projecting west over Tier 1, with the body under it at 10
  for (let z = T2.z0; z <= T2.z1; z++) {
    if (inRanges(z, GAPS_T2)) continue;
    if (heightAt(170, z) < 10) g.set(170, 10, z, "smooth_quartz");   // where the lawn is already at 10, the coping sits on it
    g.set(170, 11, z, ...COPING);
  }

  // the Tier 1 plinth (1 proud, at x 158) and cornice (at 9), except beside the flights and the fountain
  for (let z = T1.z0; z <= T1.z1; z++) {
    const beside = inRanges(z, GAPS_T1.map(([a, b]) => [a - 1, b + 1])) || (z >= 59 && z <= 64);
    if (beside) continue;
    const h = heightAt(158, z);
    g.set(158, h + 1, z, "polished_diorite");
    g.set(158, 9, z, ...COPING);
  }

  // pilasters on the face, every 6 cells, clear of the stair gaps and the niche
  for (let z = 14; z <= 110; z += 6) {
    if (inRanges(z, GAPS_T1) || (z >= NICHE.z0 - 1 && z <= NICHE.z1 + 1)) continue;
    pilaster(g, 159, z, 7, 8);
  }

  // balustrades: Tier 1 on the face and the return walls (y 10), Tier 2 on its face and return walls (y 12)
  balustradeRun(g, { axis: "z", at: 159, from: 14, to: 110 }, 10, GAPS_T1);
  balustradeRun(g, { axis: "x", at: 14, from: 160, to: 182 }, 10);
  balustradeRun(g, { axis: "x", at: 110, from: 160, to: 182 }, 10);
  balustradeRun(g, { axis: "z", at: 171, from: 30, to: 94 }, 12, GAPS_T2);
  balustradeRun(g, { axis: "x", at: 30, from: 172, to: 182 }, 12);
  balustradeRun(g, { axis: "x", at: 94, from: 172, to: 182 }, 12);

  // urns on the pier tops: balustradeRun has placed the pier itself, so the urn is set on top of it
  for (const z of piers(14, 110, GAPS_T1)) if (g.isAir(159, 11, z)) g.set(159, 11, z, "decorated_pot");
  for (const z of piers(30, 94, GAPS_T2)) if (g.isAir(171, 13, z)) g.set(171, 13, z, "decorated_pot");

  // monumental double staircases: lawn to Tier 1 (central and side), Tier 1 to Tier 2 (central and side)
  const flights = [
    [156, 158, 52, 58, 7, 3], [156, 158, 65, 71, 7, 3],
    [156, 158, 33, 35, 7, 3], [156, 158, 37, 39, 7, 3],
    [156, 158, 85, 87, 7, 3], [156, 158, 89, 91, 7, 3],
    [169, 170, 52, 58, 10, 2], [169, 170, 65, 71, 10, 2],
    [169, 170, 34, 38, 10, 2], [169, 170, 86, 90, 10, 2],
  ];
  for (const [x0, x1, z0, z1, y0, steps] of flights) terraceFlight(g, { x0, x1, z0, z1, y0, steps, facing: "east" });

  // fountains: the grotto basin at the face's centre, and the upper fountain on Tier 1
  for (let x = 156; x <= 158; x++) for (let z = 60; z <= 63; z++) {       // on the lawn: no floor, the ground owns H
    const rim = x === 156 || x === 158 || z === 60 || z === 63;
    g.set(x, 7, z, rim ? "smooth_quartz" : "water");
  }
  for (const [x, z] of [[156, 60], [158, 60], [156, 63], [158, 63]]) g.set(x, 8, z, "decorated_pot");
  fountainBasin(g, 165, 60, 168, 63, 10, true, { over: true });

  // the grotto: pillars, lintel and back wall around the open niche
  grottoNiche(g, 159, NICHE.z0, NICHE.z1, NICHE.y0, NICHE.y1);
}
