// P4 stone dressings: triglyphs, cornices, balustrades, base-window sills and keystones, upper sills, the pavilion's
// attic panels. Every element is placed through the vocabulary's air-only helpers, so an earlier part's cell is refused,
// never overwritten. The north frame runs over the whole front (z = d); the dome's four faces use plot 0's own frames.
import { PLOTS, faceFrame, triglyphs, cornice, balustrade, baseWindowDressing, upperSills, atticPanel, fset } from "../vocab.mjs";

const box = (p) => [p.x0, p.z0, p.x1, p.z1];
const NF = faceFrame("north", box(PLOTS.portico));   // z = d for every north-facing plot
const EF = faceFrame("east", box(PLOTS.pavilion));   // x = 175 - d on the corner pavilion's east face
const D = PLOTS.dome;
const DOME = {
  n: faceFrame("north", box(D)), s: faceFrame("south", box(D)),
  e: faceFrame("east", box(D)), w: faceFrame("west", box(D)),
};
const DOME_WINDOWS = [7, 15, 23, 31, 39, 47, 55];      // window u-starts on every face of the dome pavilion

export function build(g) {
  // ---- plot 0: the dome pavilion, four identical faces --------------------------------------------------------
  for (const F of [DOME.n, DOME.s, DOME.e, DOME.w]) triglyphs(g, F, 2, 61, 2);
  // the cornice ring at d 1 (x/z 1 and 62); the north and south runs take the corners
  cornice(g, DOME.n, 1, 62, 1, 36);
  cornice(g, DOME.s, 1, 62, 1, 36);
  cornice(g, DOME.w, 2, 61, 1, 36);
  cornice(g, DOME.e, 2, 61, 1, 36);
  // the roofline balustrade at d 2 (x/z 2 and 61), y 37
  balustrade(g, DOME.n, 2, 61, 2, 37);
  balustrade(g, DOME.s, 2, 61, 2, 37);
  balustrade(g, DOME.w, 3, 60, 2, 37);
  balustrade(g, DOME.e, 3, 60, 2, 37);
  for (const F of [DOME.n, DOME.s, DOME.e, DOME.w]) {
    for (const u0 of DOME_WINDOWS) {
      baseWindowDressing(g, F, u0, 2);
      upperSills(g, F, u0, 6, 10, 22);
    }
  }

  // ---- plot 1: the east portico (forward plane z 0/1 for the central block, wing plane z 1 for the end strips) ----
  triglyphs(g, NF, 64, 66, 2);
  triglyphs(g, NF, 125, 127, 2);
  triglyphs(g, NF, 67, 124, 1, { skipFrom: 75, skipTo: 116 });
  cornice(g, NF, 64, 66, 1, 36);
  cornice(g, NF, 125, 127, 1, 36);
  cornice(g, NF, 67, 124, 0, 36);
  balustrade(g, NF, 64, 66, 3, 40);
  balustrade(g, NF, 125, 127, 3, 40);
  balustrade(g, NF, 67, 72, 2, 40);
  balustrade(g, NF, 119, 124, 2, 40);
  // base windows under the end bays, centred on the upper windows
  baseWindowDressing(g, NF, 79, 1);
  baseWindowDressing(g, NF, 111, 1);
  // upper windows; the three central great windows are one tall opening, so only their terrace sill
  upperSills(g, NF, 79, 5, 10, 22);
  upperSills(g, NF, 111, 5, 10, 22);
  for (const u of [87, 88, 95, 96, 103, 104]) fset(g, NF, u, 4, 10, "polished_diorite_slab", { type: "bottom" });
  // the joint columns at x 64 and x 127 (wing plane): x 64 is a single glass column
  fset(g, NF, 64, 1, 2, "polished_diorite_slab", { type: "bottom" });
  fset(g, NF, 64, 2, 8, "chiseled_quartz_block");
  fset(g, NF, 64, 5, 10, "polished_diorite_slab", { type: "bottom" });
  baseWindowDressing(g, NF, 127, 2);
  upperSills(g, NF, 127, 6, 10, 22);

  // ---- plot 2: the wing bay (wing plane z 1 cornice, z 3 balustrade) -----------------------------------------
  triglyphs(g, NF, 128, 143, 2);
  cornice(g, NF, 128, 143, 1, 36);
  balustrade(g, NF, 128, 143, 3, 40);
  baseWindowDressing(g, NF, 135, 2);
  upperSills(g, NF, 135, 6, 10, 22);
  // the joint window at 143..144 (its other half is plot 3's west strip)
  baseWindowDressing(g, NF, 143, 2);
  upperSills(g, NF, 143, 6, 10, 22);

  // ---- plot 3: the corner pavilion -------------------------------------------------------------------------------
  // west strip at the wing plane (joins the last wing bay)
  cornice(g, NF, 144, 146, 1, 36);
  triglyphs(g, NF, 144, 146, 2);
  balustrade(g, NF, 144, 146, 3, 40);
  // north face: forward plane z 1, cornice z 0 (outer corner at x 175 belongs to this run)
  triglyphs(g, NF, 147, 174, 1);
  cornice(g, NF, 147, 175, 0, 36);
  balustrade(g, NF, 147, 173, 2, 43);
  for (const u0 of [152, 160, 168]) {
    baseWindowDressing(g, NF, u0, 1);
    upperSills(g, NF, u0, 5, 10, 22);
  }
  atticPanel(g, NF, 157, 164, 2, 38, 41);
  // east face: cornice x 175 (d 0), entablature x 169..174 (d 1), balustrade x 173 (d 2)
  triglyphs(g, EF, 1, 29, 1);
  cornice(g, EF, 1, 30, 0, 36);
  balustrade(g, EF, 3, 29, 2, 43);
  for (const u0 of [6, 15, 24]) {
    baseWindowDressing(g, EF, u0, 1);
    upperSills(g, EF, u0, 5, 10, 22);
  }
  atticPanel(g, EF, 12, 19, 2, 38, 41);
}
