// Pembridge: a 1960s concrete-framed office block (four storeys on a two-storey podium), white concrete
// frame and piers, blue glass between, a stone base course and a ground-floor entrance on the low (north) side.
// The footprint's lidar roof heights are smoothed with a 3x3 median and snapped to three flat tiers (2, 3 and
// 4 storeys above a common floor datum at y 3), so the tower stands on the shoulders, with the wings lower.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153706613.cells.json", "utf8"));

const D = 3;                       // common floor datum (the highest ground under the footprint): storeys start here
const TIERS = [11, 15, 19];        // roof tops: 2, 3 and 4 storeys of 4 blocks above the datum
const STOREY = 4;

const key = (x, z) => `${x},${z}`;
const R = new Map();
for (const [x, z, , r] of cells) R.set(key(x, z), r);
const inF = (x, z) => R.has(key(x, z));
const nbrs = (x, z) => [[x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]];

// roof top per footprint cell: 3x3 median of the lidar roof heights, snapped to the nearest tier (ties go up)
const TOP = new Map();
for (const [x, z, , r] of cells) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inF(x + dx, z + dz)) vals.push(R.get(key(x + dx, z + dz)));
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  let best = TIERS[0];
  for (const t of TIERS) if (Math.abs(t - m) < Math.abs(best - m) || (Math.abs(t - m) === Math.abs(best - m) && t > best)) best = t;
  TOP.set(key(x, z), best);
}
const T = (x, z) => TOP.get(key(x, z)) ?? -1;

// a neighbour is open at height y when it has no column there (outside the footprint, or its roof is at or below y)
const open = (x, z, y) => !inF(x, z) || T(x, z) <= y;
const exposedRow = (x, z, y) => nbrs(x, z).some(([a, b]) => open(a, b, y));
// the roof edge: a neighbour outside the footprint or lower than this cell
const exposedTop = (x, z) => nbrs(x, z).some(([a, b]) => !inF(a, b) || T(a, b) < T(x, z));

const DOOR = [13, 0];              // the low north edge of the footprint, the entrance
const v = new Voxels([33, 31, 28]);
const glassCells = [];

for (const [x, z] of cells.map(([cx, cz]) => [cx, cz])) {
  const t = T(x, z);
  // foundation: solid from y 0 up to the datum (a cell's ground is at most 3, so every column stands on the ground)
  for (let y = 0; y < D; y++) v.set(x, y, z, "stone_bricks");
  for (let y = D; y <= t; y++) {
    const rel = y - D;
    if (y === t) { v.set(x, y, z, "smooth_stone"); continue; }                  // roof slab
    if (rel % STOREY === 0) {                                                   // floor slab, base course or string course on the face
      const exp = exposedRow(x, z, y);
      v.set(x, y, z, exp ? (y === D ? "stone_bricks" : "white_concrete") : "smooth_stone");
      continue;
    }
    if (!exposedRow(x, z, y)) continue;                                         // interior air between floor slabs
    if (rel % STOREY === STOREY - 1) { v.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel
    // pier (frame) every third bay along its own wall: index by z on an east or west face, by x otherwise
    const onXFace = open(x + 1, z, y) || open(x - 1, z, y);
    const bay = onXFace ? z : x;
    if (bay % 3 === 0) { v.set(x, y, z, "white_concrete"); continue; }
    v.set(x, y, z, "light_blue_stained_glass");
    glassCells.push([x, y, z]);
  }
  if (exposedTop(x, z)) v.set(x, t + 1, z, "white_concrete");                   // parapet on the roof edge
  // roof plant on the tower, set back from its edges
  if (t === TIERS[2] && !exposedTop(x, z) && x % 6 === 3 && z % 6 === 2) {
    v.set(x, t + 1, z, "light_gray_concrete");
    v.set(x, t + 2, z, "light_gray_concrete");
  }
}

// warm lights behind some glass: the air cell inside a window, when that cell is interior air
for (const [x, y, z] of glassCells) {
  if (x === DOOR[0] && z === DOOR[1]) continue;
  if ((x * 7 + y * 3 + z * 5) % 4 !== 0) continue;
  const inner = nbrs(x, z).find(([a, b]) => inF(a, b) && !exposedRow(a, b, y) && y < T(a, b));
  if (inner) v.set(inner[0], y, inner[1], "glowstone");
}

// the entrance: a step up from the ground on the north edge, a pair of doors, a lantern under the canopy beam
const [dx, dz] = DOOR;
v.set(dx, 2, dz, "stone_brick_stairs", { facing: "north", half: "bottom", shape: "straight", waterlogged: "false" });
v.set(dx, 3, dz, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(dx, 4, dz, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
v.set(dx, 5, dz, "lantern", { hanging: "true", waterlogged: "false" });

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_153706613.nbt";
const info = v.save(out);
console.log(JSON.stringify({ cells: cells.length, ...info }));
