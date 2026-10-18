// Peristyle bay (plot 1) and peristyle end (plot 2): the paired Corinthian columns (peristyleCol), architrave, frieze
// with chiseled tablets, the walkway soffit with its cross-beams, the cornice on both rows, and plot 2's closing pier
// (plinth, body, corner quoins, cornice return). The planter boxes and figures (parts/planters.mjs) need their deck
// cells bare, and the pier's niches are left as air here for that part to fit out.
import { peristyleCol, SANDSTONE, SMOOTH_SANDSTONE, SMOOTH_SANDSTONE_SLAB, CUT_SANDSTONE, CHISELED_SANDSTONE } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

const ROWS = [4, 12];                                   // shaft z of the front and back rows

// plot 1: bay; plot 2: end. px = the first shaft x of the pair (the pair spans px..px+5); box = planter box x span
const BAY = { x0: 64, x1: 79, px: 69, box: [67, 76], figs: [[66, 3], [77, 3], [66, 14], [77, 14]] };
const END = { x0: 80, x1: 88, px: 82, box: [80, 89], figs: [[80, 3], [80, 14], [90, 3], [90, 14]] };

// the niches of the closing pier (plan.md Plot 2): carved 2 deep, head 1 row higher at the centre
function pierCarved(x, y, z) {
  const northNiche = x >= 91 && x <= 93 && z >= 2 && z <= 3 && (y <= 11 || (y === 12 && x === 92));
  const eastNiche = x >= 93 && x <= 94 && z >= 7 && z <= 9 && (y <= 11 || (y === 12 && z === 8));
  return northNiche || eastNiche;
}

// the cornice course on row y 24 over x0..x1: upside-down stairs on the two street edges, infill between
function cornice(g, x0, x1) {
  for (let x = x0; x <= x1; x++) {
    g.set(x, 24, 2, ...B.stairs(SMOOTH_SANDSTONE, "south", "top"));
    g.set(x, 24, 15, ...B.stairs(SMOOTH_SANDSTONE, "north", "top"));
    for (let z = 3; z <= 14; z++) g.set(x, 24, z, SMOOTH_SANDSTONE);
  }
}

// bottom slabs on the exposed deck at y 25, skipping the planter box, the figure pedestals and (plot 2) the pier parapet
function deck(g, plot, x0, x1, skip) {
  const [bx0, bx1] = plot.box;
  for (let x = x0; x <= x1; x++) for (let z = 2; z <= 15; z++) {
    if (x >= bx0 && x <= bx1 && z >= 4 && z <= 13) continue;
    if (plot.figs.some(([fx, fz]) => fx === x && fz === z)) continue;
    if (skip && skip(x, z)) continue;
    g.set(x, 25, z, ...B.slab(SMOOTH_SANDSTONE, "bottom"));
  }
}

// a colonnade stretch: pedestals, shafts and capitals per pair, architrave, frieze with tablets, walkway soffit
function colonnade(g, plot) {
  const { x0, x1, px } = plot;
  for (const z of ROWS) {
    peristyleCol(g, px, z);
    peristyleCol(g, px + 4, z);
  }
  const tablet = (x, z) => (z === 3 || z === 14) && ((x >= px && x <= px + 1) || (x >= px + 4 && x <= px + 5));
  const beam = (x) => x >= px && x <= px + 5;
  for (let x = x0; x <= x1; x++) {
    for (const z of [3, 4, 5, 6, 11, 12, 13, 14]) g.set(x, 21, z, CUT_SANDSTONE);                 // architrave
    for (let z = 3; z <= 14; z++) for (const y of [22, 23]) g.set(x, y, z, tablet(x, z) ? CHISELED_SANDSTONE : SMOOTH_SANDSTONE);
    for (let z = 7; z <= 10; z++) g.set(x, 21, z, beam(x) ? CUT_SANDSTONE : SMOOTH_SANDSTONE);   // soffit + cross-beams
  }
}

// the closing pier of plot 2: plinth out to x 95, body x 89..94 to y 23, quoins at the NE and SE corners
function pier(g) {
  for (let x = 89; x <= 95; x++) for (let z = 2; z <= 15; z++) for (const y of [1, 2]) g.set(x, y, z, SANDSTONE);
  for (let x = 89; x <= 94; x++) for (let z = 2; z <= 15; z++) for (let y = 3; y <= 23; y++) {
    if (pierCarved(x, y, z)) continue;
    const quoinCol = x === 94 && (z <= 3 || z >= 14);
    if (quoinCol) {
      const long = (y - 3) % 2 === 0;
      const edgeZ = z <= 3 ? 2 : 15;
      const innerZ = z <= 3 ? 3 : 14;
      if (z === edgeZ || (long && z === innerZ)) g.set(x, y, z, CUT_SANDSTONE);
      else g.set(x, y, z, SMOOTH_SANDSTONE);
      continue;
    }
    g.set(x, y, z, SMOOTH_SANDSTONE);
  }
  // the cornice returns round the east edge at x 95 (its back is the pier face at x 94)
  for (let z = 2; z <= 15; z++) g.set(95, 24, z, ...B.stairs(SMOOTH_SANDSTONE, "west", "top"));
}

export function build(g) {
  // plot 1: the bay, a full colonnade stretch with its cornice and deck
  colonnade(g, BAY);
  cornice(g, BAY.x0, BAY.x1);
  deck(g, BAY, BAY.x0, BAY.x1);

  // plot 2: the end. Columns and frieze stop at x 88; the pier takes x 89..94 and its cornice runs on to x 94, return at 95
  colonnade(g, END);
  pier(g);
  cornice(g, END.x0, 94);
  deck(g, END, END.x0, 94, (x, z) => x >= 91 && z >= 3 && z <= 14);
}
