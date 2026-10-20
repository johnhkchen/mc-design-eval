// Plot 1 arch and cables (plan.md: skewbacks, arch ribs per the intrados table, spandrel posts, cross struts with a
// lantern on each, main cable at z 71 and its dive into the south anchorage). Everything here is built into air only:
// the deck truss, the deck floor and the cable housings are earlier parts' cells, and a rib that meets them merges into
// them (the cell is skipped, never written over). Nothing is written below y 16 at x 11..30, z 17..53 (Fort Point).
import { archRib, spandrelPost, cableDive, CUT_SANDSTONE, SMOOTH_SANDSTONE, RED_TERRACOTTA, RED_CONCRETE, LANTERN } from "../vocab.mjs";

// The rib's intrados (lowest rib cell) y by z, from plan.md's arch table. z 33..44 is the crown: one row at y 29 only.
const INTRADOS = {
  15: 14, 16: 15, 17: 16, 18: 18, 19: 19, 20: 20, 21: 21, 22: 22, 23: 23, 24: 24, 25: 24, 26: 25, 27: 26, 28: 26,
  29: 27, 30: 27, 31: 28, 32: 28,
  45: 28, 46: 28, 47: 27, 48: 27, 49: 26, 50: 26, 51: 25, 52: 24, 53: 24, 54: 23, 55: 22, 56: 21, 57: 20, 58: 19,
  59: 18, 60: 16, 61: 15, 62: 14,
};
const CROWN = [33, 44];
const RIBS = [[8, 9], [21, 22]];

// Spandrel posts: the plan's z rows, each from the rib top + 1 up to y 29 (no post where the rib already reaches 29).
const POST_Z = [18, 22, 26, 30, 46, 50, 54, 58];

// Main cable: [z, y] of the cable's centre at x 8 and 22, from the exposed run at z 71 down into the housing.
const CABLE = [[71, 36], [72, 34], [73, 31], [74, 29], [75, 26], [76, 24], [77, 21], [78, 19], [79, 16], [80, 14]];

// Skewbacks: concrete springing blocks, cut_sandstone bottom two courses, smooth_sandstone above, y 1..13.
const SKEW = [[11, 14], [63, 66]];

// Write one block into air only: an occupied cell (an earlier part's, or the deck/housing this rib meets) is left alone.
function put(g, x, y, z, block, state) {
  if (!g.isAir(x, y, z)) return false;
  g.set(x, y, z, block, state);
  return true;
}

function skewbacks(g) {
  for (const [z0, z1] of SKEW) for (const [xa, xb] of RIBS) for (let x = xa; x <= xb; x++) for (let z = z0; z <= z1; z++) {
    for (let y = 1; y <= 13; y++) put(g, x, y, z, y <= 2 ? CUT_SANDSTONE : SMOOTH_SANDSTONE);
  }
}

// The crown, one row: the rib's intrados at y 29 for z 33..44 (the truss chord takes the rest).
function crown(g) {
  for (let z = CROWN[0]; z <= CROWN[1]; z++) for (const [xa, xb] of RIBS) for (let x = xa; x <= xb; x++) put(g, x, 29, z, "red_concrete");
}

// Cross struts: red_terracotta across x 10..20 at the rib top (intrados + 2), at each spandrel z; a standing lantern
// on the middle of each strut (x 15).
function struts(g) {
  for (const z of POST_Z) {
    const top = INTRADOS[z] + 2;
    for (let x = 10; x <= 20; x++) put(g, x, top, z, RED_TERRACOTTA);
    put(g, 15, top + 1, z, LANTERN, { hanging: "false" });
  }
}

export function build(g) {
  skewbacks(g);
  archRib(g, INTRADOS, { ribs: RIBS });
  crown(g);
  // a post only where the rib top sits below the deck truss's y 29 (at z 30 and 46 the rib already meets the truss)
  for (const z of POST_Z) if (INTRADOS[z] + 3 <= 29) spandrelPost(g, z, INTRADOS[z] + 3, 29, { pairs: RIBS });
  struts(g);
  // no carve: the cable cells inside the housings are the housing part's (it buries the cable); this only writes air
  cableDive(g, CABLE, [8, 22]);
}
