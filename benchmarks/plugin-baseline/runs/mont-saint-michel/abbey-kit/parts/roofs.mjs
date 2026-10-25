// Part P2 "Slate roofs": every roof per plan.md ROOFS. Gables use the vocab's slate_stair_roof (its pitch set so the
// ridge lands on the plan's ridge course), lean-tos are written cell by cell, the cloister's ring roof by its distance
// to the outer ring, and the chapel and turret cones use chapel_cap. Everything writes only into air, stays on the
// footprint and below y 151, so the shell (earlier part) is never touched.
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { onFootprint } from "../vocab/base.mjs";
import { slate_stair_roof, chapel_cap } from "../vocab.mjs";
import { STACKS } from "./grounds.mjs";

const SLATE = "deepslate_tile";
const inPlot = (x, y, z) => y >= 0 && y <= 151 && onFootprint(x, z);

// The chimney stacks' 3 x 3 columns (plan.md RESERVED): the roof keeps them clear so the stack's own masonry runs
// up through the roof and the roof stops against it.
const inStack = (x, z) => STACKS.some(([sx, sz]) => x >= sx && x <= sx + 2 && z >= sz && z <= sz + 2);

// The grid as the roof helpers see it: a write lands only on footprint air at or below y 151, outside a stack column.
function gate(g) {
  return {
    set: (x, y, z, b, s) => { if (inPlot(x, y, z) && !inStack(x, z) && g.isAir(x, y, z)) (s === undefined ? g.set(x, y, z, b) : g.set(x, y, z, b, s)); },
    isAir: (x, y, z) => g.isAir(x, y, z),
    inBounds: (x, y, z) => g.inBounds(x, y, z),
  };
}

// Gable roof on box [x0, eave, z0, x1, ridge, z1]: the pitch [rise, run] is chosen so the ridge course lands on `ridge`.
function gable(g, [x0, eave, z0, x1, ridge, z1], axis) {
  const across = axis === "x" ? z1 - z0 + 1 : x1 - x0 + 1;
  const emax = Math.floor((across - 1) / 2);
  slate_stair_roof(gate(g), [x0, eave, z0, x1, ridge, z1], axis, [ridge - eave, emax]);
}

// Lean-to over a rect: the low edge at y `lo` on the edge line `low` (a z for a north/south run, an x for east/west),
// rising to `hi` on the far edge; the slope faces the high side. Writes stairs on the rise, a cobbled fill under them.
function lean(g, cells, lo, hi) {
  const w = gate(g);
  for (const [x, z, t, n, facing] of cells) {
    const k = lo + Math.floor((t * (hi - lo)) / Math.max(1, n - 1));
    w.set(x, k, z, ...B.stairs(SLATE, facing, "bottom"));
    for (let y = lo; y < k; y++) w.set(x, y, z, "cobbled_deepslate");
  }
}

// The cloister's ring roof (x 62..78, z 13..27; the garth stays open): high on the outer ring (y 50), low over the
// arcades (y 46). d = the cell's distance in from the outer ring, so d 0 is the outer edge, d 1 the arcade.
function cloisterRoof(g) {
  const w = gate(g);
  for (let x = 62; x <= 78; x++) for (let z = 13; z <= 27; z++) {
    const d = Math.min(x - 62, 78 - x, z - 13, 27 - z);
    if (d > 1) continue;
    const facing = x - 62 === d ? "west" : 78 - x === d ? "east" : z - 13 === d ? "north" : "south";
    w.set(x, d === 0 ? 50 : 46, z, ...B.stairs(SLATE, facing, "bottom"));
  }
}

export function build(g) {
  // Nave: steep gable, ridge along x at z 64, eaves 63, ridge 73.
  gable(g, [15, 63, 57, 47, 73, 71], "x");
  // Nave aisles: lean-tos from the clerestory wall (y 57) down to the aisle eave (y 54), north and south.
  const aisleN = [], aisleS = [];
  for (let x = 15; x <= 47; x++) {
    for (let z = 52; z <= 57; z++) aisleN.push([x, z, z - 52, 6, "south"]);
    for (let z = 71; z <= 76; z++) aisleS.push([x, z, 76 - z, 6, "north"]);
  }
  lean(g, aisleN, 54, 57);
  lean(g, aisleS, 54, 57);
  // Transepts: gables on the crossing, ridge along z at x 55, eaves 63, ridge 73.
  gable(g, [48, 63, 48, 62, 73, 56], "z");
  gable(g, [48, 63, 72, 62, 73, 86], "z");
  // Choir: very steep Flamboyant gable, ridge along x at z 64, eaves 73, ridge 86.
  gable(g, [63, 73, 58, 88, 86, 70], "x");
  // Merveille east block: gable ridge along x at z 17, eaves 50, ridge 61.
  gable(g, [85, 50, 6, 107, 61, 28], "x");
  // North choir range (Chartrier): gable ridge along x, eaves 48, ridge 55.
  gable(g, [63, 48, 34, 86, 55, 41], "x");
  // Promenoir / Aquilon range: gable ridge along x, eaves 47, ridge 54.
  gable(g, [24, 47, 12, 55, 54, 23], "x");
  // North-west substructure range: gable ridge along z, eaves 45, ridge 52.
  gable(g, [6, 45, 15, 23, 52, 38], "z");
  // Belle Chaise: gable ridge along x at z 56, eaves 38, ridge 45.
  gable(g, [102, 38, 51, 116, 45, 62], "x");
  // Chatelet body: gable ridge along x at z 41, eaves 33, ridge 39.
  gable(g, [117, 33, 39, 128, 39, 47], "x");
  // East range (Tour Perrine): gable ridge along z at x 122, eaves 38, ridge 44.
  gable(g, [117, 38, 54, 128, 44, 74], "z");
  // South-east range: gable ridge along x at z 70, eaves 36, ridge 42.
  gable(g, [101, 36, 63, 116, 42, 77], "x");
  // Logis (west): gable ridge along x at z 85, eaves 56, ridge 65.
  gable(g, [18, 56, 79, 47, 65, 92], "x");
  // Logis abbatial (upper, west): gable ridge along x at z 92, eaves 54, ridge 63.
  gable(g, [57, 54, 87, 71, 63, 98], "x");
  // Logis abbatial (upper, east): gable ridge along x at z 95, eaves 47, ridge 55.
  gable(g, [72, 47, 87, 86, 55, 104], "x");
  // Logis du Roi (lower, east): gable ridge along z at x 95, eaves 46, ridge 54; the big gable faces south.
  gable(g, [87, 46, 87, 104, 54, 104], "z");
  // Bailliverie: gable ridge along x at z 112, eaves 47, ridge 54.
  gable(g, [48, 47, 108, 68, 54, 116], "x");
  // South-west pavilion: gable ridge along x at z 106, eaves 49, ridge 55.
  gable(g, [9, 49, 102, 26, 55, 110], "x");
  // Cloister ring roof and its surrounding lean.
  cloisterRoof(g);
  // Chapel caps: a 3 x 3 pyramid over each chapel's walls, top course to y 61 (height is relative to the eave).
  const caps = [[79, 47], [86, 47], [68, 80], [75, 80], [82, 80], [89, 80], [98, 57], [98, 64], [98, 71]];
  for (const [cx, cz] of caps) chapel_cap(gate(g), cx, 58, cz, 1, 4);
  // NE turret cone: a small cap over the 3-wide turret at (109, 20), eaves 52, top to 57.
  chapel_cap(gate(g), 109, 52, 20, 1, 6);
  // SW stair tower pyramid at (23, 96), eaves 53, top to 56.
  chapel_cap(gate(g), 23, 53, 96, 2, 4);
}
