// Plot 2 and plot 3 main and side-span cables with slabs, bands and suspenders (plan.md, plots 2 and 3). Each plot holds
// ONLY its two cables (local x 0 and x 14) and their suspender ropes; the cable heights are the catenaries of plan.md.
// Cell placement is cableCell (body block + half-step slab) and suspender (red_stained_glass_pane column), both from
// vocab.mjs; plot x values are PLOT_X.* + local x.
import { cableCell, suspender, PLOT_X, MAIN_CABLE, SIDE_CABLE, SIDE_SUSPENDER_Z, SIDE_SUSPENDER_BOTTOM } from "../vocab.mjs";

/** Local x of the two cable lines in plots 2 and 3. */
const CABLE_X = [0, 14];

/** Main-span cable height: y(z) = a + k (z + zc)^2 (plan.md plot 2). */
export function mainHeight(z) {
  const { a, k, zc } = MAIN_CABLE;
  return a + k * (z + zc) ** 2;
}

/** Side-span cable height: u = z + 0.5, y = a - b u + c u^2 for z 0..171; level at levelY from z 172 (plan.md plot 3). */
export function sideHeight(z) {
  const { a, b, c, curveZ, levelY } = SIDE_CABLE;
  if (z > curveZ[1]) return levelY;
  const u = z + 0.5;
  return a - b * u + c * u * u;
}

/** Body and slab cells for both cables of one plot, z0..z1 along the cable's height function. */
function cables(g, plotX, z0, z1, heightOf) {
  const refused = [];
  for (let z = z0; z <= z1; z++) {
    for (const dx of CABLE_X) {
      const r = cableCell(g, plotX + dx, z, heightOf(z));
      refused.push(...r.refused);
    }
  }
  return refused;
}

/**
 * Suspender ropes: each rope runs from yBottom(z) up to just under the cable body (floor(height) - 1). A rope is skipped
 * where its top is below its bottom (the cable is at the deck level there).
 */
function ropes(g, plotX, zList, heightOf, yBottomOf) {
  const refused = [];
  for (const z of zList) {
    const yBottom = yBottomOf(z);
    const yTop = Math.floor(heightOf(z)) - 1;
    if (yTop < yBottom) continue;
    for (const dx of CABLE_X) {
      const r = suspender(g, plotX + dx, z, yBottom, yTop);
      refused.push(...(r?.refused ?? []));
    }
  }
  return refused;
}

/** Plot 2: main-span cables z 0..248; ropes every 4 blocks from y 40 up to the cable. */
function mainSpan(g) {
  const plotX = PLOT_X.mainCable;
  const [z0, z1] = MAIN_CABLE.z;
  const refused = cables(g, plotX, z0, z1, mainHeight);
  const zList = [];
  for (let z = z0; z <= z1; z += 4) zList.push(z);
  refused.push(...ropes(g, plotX, zList, mainHeight, () => 40));
  return refused;
}

/** Plot 3: side-span cables z 0..231 (level at y 36 from z 172); ropes z 12..168 stepping down with the deck rail. */
function sideSpan(g) {
  const plotX = PLOT_X.sideCable;
  const [z0, z1] = SIDE_CABLE.z;
  const refused = cables(g, plotX, z0, z1, sideHeight);
  const [sz0, sz1] = SIDE_SUSPENDER_Z;
  const zList = [];
  for (let z = sz0; z <= sz1; z += 4) zList.push(z);
  const bottomOf = (z) => {
    const band = SIDE_SUSPENDER_BOTTOM.find(([lo, hi]) => z >= lo && z <= hi);
    return band ? band[2] : 36;
  };
  refused.push(...ropes(g, plotX, zList, sideHeight, bottomOf));
  return refused;
}

export function build(g) {
  const refused = [...mainSpan(g), ...sideSpan(g)];
  if (refused.length) console.log(`cables: ${refused.length} refused writes`, refused.slice(0, 5));
}
