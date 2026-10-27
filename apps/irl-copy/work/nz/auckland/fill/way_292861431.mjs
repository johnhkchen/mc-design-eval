// Southern Cross Building: a concrete-frame office block of the 1960s-70s (decided from the record: ~15 storeys of
// about 4 blocks, a podium of lower wings, a stepped tower, tinted glazing bands between white concrete piers).
// Massing follows the lidar roof per cell (3x3 median, then the nearest storey line 3 + 4k), so every column is
// solid from the ground to its roof: nothing floats. Facades are one envelope layer; the interior is air between
// floor slabs. Walls are built from a per-voxel rule, so the articulation is structure, not paint on a box.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const NAME = "way_292861431";
const cells = JSON.parse(readFileSync(`${DIR}/${NAME}.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 42, D = 48, H = 76;
const BASE = 3;       // the ground floor's slab; the base course runs up to here
const STOREY = 4;     // a storey: its slab, then 3 rows of window
const COURT = 4;      // a lidar roof this low is open ground (the court), no column above its ground

const grid = (v) => Array.from({ length: D }, () => Array(W).fill(v));
const GROUND = grid(0), ROOF = grid(null);
for (const [x, z, g, r] of cells) { GROUND[z][x] = g; ROOF[z][x] = r; }

const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && ROOF[z][x] !== null;
const court = (x, z) => inFp(x, z) && ROOF[z][x] <= COURT;
const built = (x, z) => inFp(x, z) && !court(x, z);
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Column tops: the 5x5 median of the built cells' lidar roof (a 3x3 left thin spikes on the lidar's edge strips),
// snapped to the nearest storey line (3 + 4k).
// A second median over the snapped tiers, so a strip two cells wide on the lidar's edge takes its neighbours' tier.
const median5 = (src) => {
  const out = grid(-1);
  for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
    if (!built(x, z)) continue;
    const vals = [];
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (built(x + dx, z + dz)) vals.push(src[z + dz][x + dx]);
    vals.sort((a, b) => a - b);
    out[z][x] = vals[vals.length >> 1];
  }
  return out;
};
const snapped = median5(ROOF);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (built(x, z)) snapped[z][x] = BASE + STOREY * Math.max(1, Math.round((snapped[z][x] - BASE) / STOREY));
const TOP = median5(snapped);

// Occupied: the ground under a cell, then its column up to its roof (a court has only the ground).
const occ = (x, y, z) => inFp(x, z) && (y < GROUND[z][x] || (built(x, z) && y <= TOP[z][x]));
// A roof edge: beside the outside, or beside a lower roof (a parapet stands there).
const edge = (x, z) => SIDES.some(([dx, dz]) => !inFp(x + dx, z + dz) || TOP[z + dz][x + dx] < TOP[z][x]);
// The faces of a voxel that look out to air.
const exposed = (x, y, z) => SIDES.filter(([dx, dz]) => !occ(x + dx, y, z + dz));

// The entrance: on the east face at ground level (the lidar's 3-block ground, so no steps), the middle of the run.
const eastAtGround = (x, z) => built(x, z) && GROUND[z][x] === BASE && !occ(x + 1, BASE, z);
const cand = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) if (eastAtGround(x, z)) cand.push([x, z]);
cand.sort((a, b) => a[1] - b[1]);
const [ex, ez] = cand[cand.length >> 1];
const ENTRY = new Set([`${ex},${ez}`]);
if (eastAtGround(ex, ez + 1)) ENTRY.add(`${ex},${ez + 1}`);
else if (eastAtGround(ex, ez - 1)) ENTRY.add(`${ex},${ez - 1}`);

// The block at a voxel: [name, state?] or null (air).
function blockAt(x, y, z) {
  const g = GROUND[z][x];
  if (y < g) return court(x, z) && y === g - 1 ? ["smooth_stone"] : ["stone"];   // ground and foundation; a court is paved
  if (!built(x, z)) return null;
  const t = TOP[z][x];
  if (y === t + 1) return edge(x, z) ? ["white_concrete"] : null;                // parapet on the roof edge
  if (y > t) return null;
  if (y < BASE) return ["stone_bricks"];                                          // base course
  const out = exposed(x, y, z);
  if (y === t) {
    if (out.length) return ["light_gray_concrete"];                               // cornice on the roof edge
    return t < 31 && (x * 5 + z * 3) % 11 === 0 ? ["moss_block"] : ["smooth_stone"];  // podium roofs with planting
  }
  const row = (y - BASE) % STOREY;
  if (row === 0) return ["light_gray_concrete"];                                  // floor slab, through the building
  if (!out.length) return null;                                                   // interior air behind the glass
  if (out.length > 1) return ["white_concrete"];                                  // corner pier
  const [dx, dz] = out[0];
  const u = dx ? z : x;                                                           // position along the facade
  const ground = y - row === BASE;
  if (ground && dx === 1 && ENTRY.has(`${x},${z}`)) {                             // double door under the storey slab
    const state = { facing: "east", hinge: "left", open: "false", powered: "false" };
    if (row === 1) return ["dark_oak_door", { ...state, half: "lower" }];
    if (row === 2) return ["dark_oak_door", { ...state, half: "upper" }];
  }
  if (row === 3 && ground) return ["white_concrete"];                             // shopfront lintel
  if (u % 4 === 0) return ["white_concrete"];                                     // pier between the bays
  return ["light_blue_stained_glass"];
}

const maxTop = Math.max(...TOP.flat());
const v = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  for (let y = 0; y <= maxTop + 4; y++) {
    const b = blockAt(x, y, z);
    if (b) v.set(x, y, z, b[0], b[1]);
  }
}

// Warm lights behind some windows: one voxel inside the glass, where the air is.
let lamps = 0;
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!built(x, z)) continue;
  for (let y = BASE + 2; y <= TOP[z][x] - 1; y += 1) {
    if ((y - BASE) % STOREY !== 2 || (x + 2 * z + y) % 9 !== 0) continue;
    const out = exposed(x, y, z);
    if (out.length !== 1) continue;
    const [dx, dz] = out[0];
    const ix = x - dx, iz = z - dz;
    if (!built(ix, iz) || occ(ix, y, iz) === false || exposed(ix, y, iz).length || blockAt(ix, y, iz)) continue;
    v.set(ix, y, iz, (x + z) % 2 ? "glowstone" : "shroomlight");
    lamps++;
  }
}

// Plant room on the tallest roof: a louvred box set back from the edges, with a concrete cap.
const plantOk = (x, z) => built(x, z) && TOP[z][x] === maxTop;
const plant = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  let inside = true;
  for (let dz = -3; dz <= 3 && inside; dz++) for (let dx = -3; dx <= 3; dx++) if (!plantOk(x + dx, z + dz)) { inside = false; break; }
  if (inside) plant.push([x, z]);
}
const inPlant = new Set(plant.map(([x, z]) => `${x},${z}`));
for (const [x, z] of plant) {
  const ring = SIDES.some(([dx, dz]) => !inPlant.has(`${x + dx},${z + dz}`));
  for (let y = maxTop + 1; y <= maxTop + 3; y++) {
    if (ring) v.set(x, y, z, "light_gray_concrete");
    else if (y < maxTop + 3) { if ((x + z + y) % 2 === 0) v.set(x, y, z, "iron_bars"); else v.set(x, y, z, "air"); }
    else v.set(x, y, z, "light_gray_concrete");
  }
}

const stats = v.save(`${DIR}/${NAME}.nbt`);
console.log(JSON.stringify({
  footprint: cells.length, courtCells: cells.filter(([x, z]) => court(x, z)).length,
  roofTop: maxTop, storeys: Math.round((maxTop - BASE) / STOREY), entrance: [...ENTRY], lamps,
  plantCells: plant.length, ...stats,
}));
