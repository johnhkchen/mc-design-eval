// 64 West 48th Street, 1926: a Midtown commercial and office block, 19 storeys on a setback massing, 23 x 27 cells.
// The street front is the high-z end (48th Street, the south face); z 0 is the rear. Lidar roofs are median-smoothed over
// 3x3 (holes and noise filled from neighbours) and snapped to whole 3-block storeys. Cells with no lidar return anywhere
// near them get one shopfront storey, so the footprint never has an open hole.
// Materials: polished granite plinth and shopfront piers, buff smooth sandstone spandrels, white calcite piers, light blue
// tinted glass in the window bays, chiseled stone cornice, smooth sandstone parapets, grey concrete roof decks.
// Interior is air behind the glazing with a floor slab per storey (no rooms); a few windows carry glowstone behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1034501.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 23, D = 27, H = 70, STOREY = 3;

const roofAt = new Map(cells.map(([x, z, , roof]) => [`${x},${z}`, roof]));
const inFoot = (x, z) => roofAt.has(`${x},${z}`);
const median = (a) => { a = a.filter((v) => v > 0).sort((p, q) => p - q); return a.length ? a[a.length >> 1] : 0; };
const TOP = new Map();                                  // "x,z" -> roof top above y 0, a whole number of storeys
for (const key of roofAt.keys()) {
  const [x, z] = key.split(",").map(Number), nb = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const r = roofAt.get(`${x + dx},${z + dz}`); if (r !== undefined) nb.push(r); }
  TOP.set(key, Math.max(1, Math.round(median(nb) / STOREY)) * STOREY);
}
const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;
const solid = (x, y, z) => inFoot(x, z) && y >= 0 && y < top(x, z);
// The sides of a block whose neighbour at the same height is air (or outside the footprint).
const DIRS = [[0, 1], [0, -1], [1, 0], [-1, 0]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const PLINTH = "polished_granite", PIER = "calcite", SPANDREL = "smooth_sandstone", GLASS = "light_blue_stained_glass";
const CORNICE = "chiseled_stone_bricks", PARAPET = "smooth_sandstone", ROOF = "gray_concrete", FLOOR = "smooth_stone";

const g = new Voxels([W, H, D]);

// Facade of an exposed block: a plinth and shopfront at street level, then a storey line of sandstone over two rows of
// glass in bays between 1-wide calcite piers. Corners and every third block along a face are piers.
function facade(x, y, z, exp) {
  const s = Math.floor(y / STOREY), row = y % STOREY;
  const corner = exp.some(([dx]) => dx !== 0) && exp.some(([, dz]) => dz !== 0);
  const along = exp.some(([, dz]) => dz !== 0) ? x : z;
  const pier = corner || along % 3 === 0;
  if (s === 0) return { block: y === 0 || pier ? PLINTH : GLASS };
  if (row === 0) return { block: SPANDREL };
  return { block: pier ? PIER : GLASS };
}

// Each column: solid to its roof, facade on exposed blocks, slabs and air inside, a cornice and parapet on the roof edge.
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number))) {
  const T = top(x, z);
  for (let y = 0; y < T; y++) {
    const exp = exposed(x, y, z);
    if (y === T - 1) { g.set(x, y, z, exp.length ? CORNICE : ROOF); continue; }
    if (!exp.length) { if (y % STOREY === 0) g.set(x, y, z, FLOOR); continue; }      // interior: slab per storey, air between
    const { block } = facade(x, y, z, exp);
    g.set(x, y, z, block);
  }
  // parapet on the exposed edge of each roof
  if (T < H && exposed(x, T - 1, z).length) g.set(x, T, z, PARAPET);
}

// Street entrance: a centred iron door in the south (high-z) shopfront, lanterns hung from the transom either side.
const DOOR_X = 11, DOOR_Z = D - 1;
g.set(DOOR_X, 1, DOOR_Z, "iron_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(DOOR_X, 2, DOOR_Z, "iron_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const lx of [DOOR_X - 2, DOOR_X + 2]) g.set(lx, 2, DOOR_Z, "lantern", { hanging: "true" });

// Warm light: glowstone on the first window row, just inside the glass, in some bays.
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number))) {
  const T = top(x, z);
  for (let y = 4; y < T - 2; y += STOREY) {                  // window row 1 of each storey above the shopfront
    const exp = exposed(x, y, z);
    if (!exp.length || y % STOREY !== 1) continue;
    const [dx, dz] = exp[0];
    if (exp.length !== 1 || !((x * 7 + z * 3 + y) % 9 === 0)) continue;
    const ix = x - dx, iz = z - dz;
    if (inFoot(ix, iz) && !solid(ix, y, iz) && exposed(ix, y, iz).length === 0) g.set(ix, y, iz, "glowstone");
  }
}

// Roof equipment: small cooling-tower boxes on the interior of the taller roofs.
for (const [x, z] of [...roofAt.keys()].map((k) => k.split(",").map(Number))) {
  const T = top(x, z);
  if (T < 45 || x % 5 !== 2 || z % 5 !== 2 || exposed(x, T - 1, z).length) continue;
  g.set(x, T, z, "polished_andesite"); g.set(x, T + 1, z, "polished_andesite");
}

g.save(`${DIR}/NYC1034501.nbt`);
