// Hôtel Roger de Gaillon (FR245184531): a stone Paris hôtel on the Île de la Cité, three storeys of
// calcite walls on a stone base, smooth-stone floor lines, a deepslate roof cap, and a hollow shell
// (floor slabs per storey, air behind the glass). Built on the footprint cells only; each cell's
// ground fills from y 0, its roof height (the lidar's, above y 0) sets its top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184531.cells.json", "utf8"));
const g = new Voxels([11, 35, 21]);

const FLOORS = [2, 7, 12];                           // storey floor slabs (y of the slab's top face is +1)
const key = (x, z) => `${x},${z}`;
const cell = new Map(cells.map(([x, z, ground, roof]) => [key(x, z), { ground, roof }]));
const inFp = (x, z) => cell.has(key(x, z));
const edgeX = (x, z) => !inFp(x - 1, z) || !inFp(x + 1, z);      // exterior face along z (faces east or west)
const edgeZ = (x, z) => !inFp(x, z - 1) || !inFp(x, z + 1);      // exterior face along x (faces north or south)
const perim = (x, z) => edgeX(x, z) || edgeZ(x, z);
const corner = (x, z) => edgeX(x, z) && edgeZ(x, z);

const DOOR = [5, 20];                                 // the south front, on the stone axis
for (const [x, z, ground, roof] of cells) {
  // the lidar's roof (16-19 above y 0) smoothed into two flat tiers: the hôtel's main roof at y 18, its west
  // and east wing ends (x 0-2 at the north and south ends) one tier lower at y 15
  const top = x <= 2 && (z <= 3 || z >= 18) ? 15 : 18;
  // foundation: solid from 0 up to the cell's ground; then a stone base course levelling the walls at y 2
  for (let y = 0; y <= Math.max(ground, 1); y++) g.set(x, y, z, "stone_bricks");
  // interior hollow (no interior), floors per storey, roof cap
  for (const f of FLOORS) g.set(x, f, z, "smooth_stone");
  g.set(x, top, z, "deepslate_tiles");
  if (!perim(x, z)) continue;
  // exterior walls: quoins at corners, calcite between; a cornice band under the roof
  g.set(x, top - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  for (let y = 2; y <= top - 2; y++) {
    if (FLOORS.includes(y)) continue;
    const storeyRow = FLOORS.some((f) => y >= f + 1 && y <= f + 3);
    const block = corner(x, z) ? "stone_bricks" : "calcite";
    if (storeyRow && !corner(x, z) && (x + z) % 3 === 1) {
      // a window: glass in a calcite frame, some lit by warm light
      const lit = (x * 7 + z * 3 + y) % 13 === 0;
      g.set(x, y, z, lit ? "shroomlight" : "glass");
    } else {
      g.set(x, y, z, block);
    }
  }
  // the lintel course over each storey's windows
  for (const f of FLOORS) if (f + 4 <= top - 2) g.set(x, f + 4, z, "smooth_stone");
}

// chimneys on two interior roof cells (stand on the roof cap)
for (const [x, z] of [[6, 9], [8, 15]]) {
  for (let y = 19; y <= 21; y++) g.set(x, y, z, "bricks");
  g.set(x, 22, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// entrance on the south front: stone surround, dark oak double door below a stone lintel
const [dx, dz] = DOOR;
for (const y of [2, 3, 4]) { g.set(dx - 1, y, dz, "stone_bricks"); g.set(dx + 1, y, dz, "stone_bricks"); }
g.set(dx, 4, dz, "stone_bricks");
g.set(dx, 2, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(dx, 3, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/notre-dame/fill/FR245184531.nbt");
console.log(r);
