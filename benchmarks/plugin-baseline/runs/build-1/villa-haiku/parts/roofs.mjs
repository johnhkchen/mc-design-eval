// roofs: the eighteen shed roof bands (plan.md ROOFS) over the walls, the fauces pediment (E02) at the street front.
// Every band is a shed roof with palette RoofTile (vocab.mjs ROOF_MATERIAL), low = the court side. The compluvium void
// (x15..20, z12..17, y6..9) stays open: no band covers it (RC and RD stop at x14 and x21, RA/RB stop at z11/z18).
// Nothing else is placed above y5 here. The fauces pediment (E02) is the shell's: its gable cells (16..19, 6, 0) and
// (17..18, 7, 0) are set there, and runParts refuses any write into a cell an earlier part built.
// The bands stop at the shell's walls too (the raised high sides): those cells are the shell's, so the roof meets them.
//
// Why a scratch grid: roof() reads the walls with blockAt(raw coords) but writes through set(), and the SiteGrid
// shifts z in set() only, so on the site grid the roof reads its walls 4 cells off and its eaves and ridge cells
// at x=-1, z=-1 or y=10 grow or shift the grid under the other parts. So each band runs on a plain scratch grid
// with a margin, holding a copy of the plan's blocks; only the cells the band changed are written back, inside the
// plan box (x0..35, y0..9, z0..47). Roof cells above y9 (the ridge over the plan's height) are not written.
import { Grid, roof } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { ROOF_MATERIAL, ROOF_TILE, SITE } from "../vocab.mjs";

const PAD = 2;                                              // scratch margin around the plan box (overhang, verge)
const TOP = 14;                                             // scratch height: the plan's 10 courses plus the roof's rise
const ST = SITE.street;                                     // plan z -4 is file z 0 (the scratch frame adds PAD)
const key = (x, y, z) => `${x},${y},${z}`;

// roofBand (vocab.mjs) on the scratch grid; overhang 0 keeps the eave cells off the plan's outer edge and the void.
// earlier: the cells the earlier parts built (air included); the band never writes into them.
function band(g, rects, low, earlier) {
  const sw = SITE.w + 2 * PAD, sd = SITE.d + ST + 2 * PAD;
  const scratch = new Grid([sw, TOP, sd]);
  const before = new Map();
  for (let x = 0; x < SITE.w; x++) for (let y = 0; y < SITE.h; y++) for (let z = -ST; z < SITE.d; z++) {
    const c = g.get(x, y, z);
    if (!c) continue;
    scratch.set(x + PAD, y, z + ST + PAD, c.block, c.state, c.nbt);
    before.set(key(x + PAD, y, z + ST + PAD), c.block);
  }
  const frame = (r) => [r[0] + PAD, r[1] + ST + PAD, r[2] + PAD, r[3] + ST + PAD];   // plan rect -> scratch rect
  const shifted = rects.map((r) => (typeof r[0] === "number" ? frame(r) : r.map(frame)));
  roof(scratch, shifted, "shed", { y: 6, low, material: ROOF_MATERIAL, soffit: ROOF_TILE, overhang: 0, edges: false, grow: false });
  for (const c of scratch) {
    const [sx, sy, sz] = c.pos;
    if (before.get(key(sx, sy, sz)) === c.block) continue;   // unchanged (the shell's own walls and floors)
    const x = sx - PAD, y = sy, z = sz - PAD - ST;           // back to plan coordinates
    if (x < 0 || x >= SITE.w || y < 0 || y >= SITE.h || z < -ST || z >= SITE.d) continue;
    if (c.block === "minecraft:air") continue;
    if (earlier.has(key(x, y, z))) continue;                 // the shell's wall under a raised high side: the roof stops at it
    g.set(x, y, z, c.block, c.state, c.nbt);
  }
}

// ROOFS: [id, rects (a rect or a union of rects, [x0, z0, x1, z1]), low side]
const ROOFS = [
  ["RA", [[0, 0, 35, 8], [9, 8, 26, 11]], "south"],
  ["RB", [[9, 18, 26, 21]], "north"],
  ["RC", [[9, 12, 14, 17]], "east"],
  ["RD", [[21, 12, 26, 17]], "west"],
  ["RE", [[0, 9, 8, 20]], "east"],
  ["RF", [[27, 9, 35, 20]], "west"],
  ["RG", [[0, 22, 12, 25]], "south"],
  ["RH", [[13, 22, 22, 25]], "south"],
  ["RI", [[23, 22, 35, 25]], "south"],
  ["RJ-N", [[8, 26, 27, 29]], "south"],
  ["RJ-S", [[8, 38, 27, 41]], "north"],
  ["RJ-W", [[8, 27, 11, 40]], "east"],
  ["RJ-E", [[24, 27, 27, 40]], "west"],
  ["RK-W", [[0, 28, 7, 39]], "east"],
  ["RK-E", [[28, 28, 35, 39]], "west"],
  ["RL-T", [[11, 42, 24, 46]], "north"],
  ["RL-SW", [[0, 42, 10, 46]], "north"],
  ["RL-SE", [[25, 42, 35, 46]], "north"],
];

export function build(g) {
  const earlier = new Set();                                // taken before any band writes, so the bands' own roof cells stay writable
  for (let x = 0; x < SITE.w; x++) for (let y = 0; y < SITE.h; y++) for (let z = -ST; z < SITE.d; z++) {
    if (g.get(x, y, z)) earlier.add(key(x, y, z));
  }
  for (const [, rects, low] of ROOFS) band(g, rects, low, earlier);
  return g;
}
