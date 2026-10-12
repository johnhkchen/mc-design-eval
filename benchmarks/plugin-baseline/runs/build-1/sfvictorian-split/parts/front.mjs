// P2 plinth, bay, porch, stoop (plan.md PARTS 2; elements 3, 4 (floor/ceiling/walls), 7, 11 (y13 band), 21).
// Rusticated garage plinth with the garage door and garage room left as air, the angled three-storey bay (siding,
// corner boards, plum spandrel at y9, fish-scale band at y13, bay floors and a gravel lid), the porch floor, ceiling
// and side wall, and the stoop. Porch columns (P5) and the water table at z7 (P1 wall) are not built here.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import {
  SITE, BODY, TRIM, PILLAR, GOLD, GOLD_ALT, STONE, STONE_FAMILY, ANDESITE, CHISELED,
  spandrel, bayWall, stoop,
} from "../vocab.mjs";

const span = (a, b) => {
  const out = [];
  for (let i = Math.min(a, b); i <= Math.max(a, b); i++) out.push(i);
  return out;
};

// the bay's wall cells, one [x, z] pair per angle: face corners (3,4),(6,4); diagonal corners (2,5),(7,5),(1,6),(8,6)
const CORNERS = [[3, 4], [6, 4], [2, 5], [7, 5], [1, 6], [8, 6]];
const BAY_FLOORS = [[4, "oak_planks"], [9, "spruce_planks"], [13, "birch_planks"]];   // parlour, bedroom, top bay

/** garage door opening (x3..6 y1..3 z4) and the garage room behind it (x2..7 y1..3 z5..6): both left as air. */
const garageAir = (x, y, z) => y >= 1 && y <= 3 && ((z === 4 && x >= 3 && x <= 6) || (z >= 5 && z <= 6 && x >= 2 && x <= 7));

/** plinth(): rusticated stone box x1..8 z4..6 y0..3, odd y and odd x andesite, string course y3 chiseled. */
function plinth(g) {
  const { x0, x1, y0, y1, z0, z1, stringY } = SITE.plinth;
  for (const y of span(y0, y1)) for (const x of span(x0, x1)) for (const z of span(z0, z1)) {
    if (garageAir(x, y, z)) continue;
    const block = y === stringY ? CHISELED : y % 2 === 1 && x % 2 === 1 ? ANDESITE : STONE;
    g.set(x, y, z, block);
  }
  // ledge slabs on the exposed plinth-top corners at y4
  for (const [x, z] of [[1, 4], [2, 4], [1, 5], [7, 4], [8, 4], [8, 5]]) g.set(x, 4, z, ...B.slab(STONE_FAMILY, "bottom"));
}

/** bayCorners(): cream quartz pillars at every bay angle, y4..16; on the diagonals they stop at the window heads. */
function bayCorners(g) {
  const { windowYs } = SITE.bay;
  const inWindow = (y) => windowYs.some(([a, b]) => y >= a && y <= b);
  for (const [x, z] of CORNERS) for (const y of span(4, 16)) {
    if (z !== 4 && inWindow(y)) continue;     // diagonal window cells stay air for the glazing part
    g.set(x, y, z, ...B.pillar(PILLAR, "y"));
  }
}

/** bayFloors(): the bay's floor slabs at y4, y9, y13 over the interior cells (z5 x3..6, z6 x2..7), and the y17 lid. */
function bayFloors(g) {
  const interior = [...span(3, 6).map((x) => [x, 5]), ...span(2, 7).map((x) => [x, 6])];
  for (const [y, block] of BAY_FLOORS) for (const [x, z] of interior) g.set(x, y, z, block);
  const lid = [...span(3, 6).map((x) => [x, 4]), ...span(2, 7).map((x) => [x, 5]), ...span(1, 8).map((x) => [x, 6])];
  for (const [x, z] of lid) g.set(x, 17, z, "gravel");
}

/** bayBands(): plum spandrel at y9 on every bay face cell, and a one-row fish-scale band at y13 (gold, alternating). */
function bayBands(g) {
  const { spandrelY, fishScaleY } = SITE.bay;
  spandrel(g, 3, 6, spandrelY, 4);
  spandrel(g, 2, 2, spandrelY, 5);
  spandrel(g, 7, 7, spandrelY, 5);
  spandrel(g, 1, 1, spandrelY, 6);
  spandrel(g, 8, 8, spandrelY, 6);
  // one row only: the storey-3 window heads (y14..15) sit directly above, so the band does not take the second row
  const row = [[3, 4], [4, 4], [5, 4], [6, 4], [2, 5], [7, 5], [1, 6], [8, 6]];
  for (const [x, z] of row) {
    const alt = (x - 1) % 2 === 0;
    g.set(x, fishScaleY, z, alt ? GOLD_ALT : GOLD);
  }
}

/**
 * porch(): stone floor y4 x10..14 z7..9, BODY side wall x9 z8..9 with a cream wainscot at y5. The y9 ceiling is the
 * storey-2 floor slab, which the shell already laid, so it is not written here.
 */
function porch(g) {
  const { x0, x1, z0, z1, floorY, wainscotXs, wainscotZs } = SITE.porch;
  for (const x of span(x0, x1)) for (const z of span(z0, z1)) g.set(x, floorY, z, STONE);
  for (const y of span(SITE.porch.voidY0, SITE.porch.voidY1)) for (const z of wainscotZs) g.set(wainscotXs[0], y, z, BODY);
  for (const z of wainscotZs) g.set(wainscotXs[0], 5, z, ...B.slab(TRIM, "bottom"));
}

export function build(g) {
  plinth(g);
  bayWall(g, SITE.bay.y0, SITE.bay.y1);
  bayCorners(g);
  bayFloors(g);
  bayBands(g);
  porch(g);
  stoop(g);
}
