import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 2135 Bancroft Pl NW: Adams Morgan Victorian rowhouse, red brick on a stone base, projecting front bay
// (x 2-4, z 0-1), flat roof behind a stone cornice. Storeys are 2 blocks: window rows at odd y, stone belt
// courses at even y. The footprint is shelled (1-block exterior walls, air interior), so each window has an
// air gap behind its glass, and every floor is a full stone course.
const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68919.cells.json", "utf8"));
const W = 6, D = 7;
const at = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => at.has(`${x},${z}`);
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const outward = (x, z) => NB.filter(([dx, dz]) => !has(x + dx, z + dz));
const boundary = (x, z) => outward(x, z).length > 0;

// window panes: the bay front and sides, the main front (x 1), the side walls (z 3 and 5), the back (x 2 and 4)
const pane = (x, z) =>
  (z === 0 && (x === 2 || x === 4)) || (z === 1 && (x === 2 || x === 4)) ||
  (z === 2 && x === 1) || (x === 0 && (z === 3 || z === 5)) || (x === 5 && (z === 3 || z === 5)) ||
  (z === 6 && (x === 2 || x === 4));
// warm light behind some panes (in the air gap)
const lit = new Set(["1,1,3", "1,3,3", "2,1,5", "4,3,5", "3,1,1"]);
const PANE_MAJOR = (x, z) => outward(x, z).some(([, dz]) => dz !== 0);

const g = new Voxels([W, 19, D]);
for (const [x, z, ground, roof] of cells) {
  const edge = boundary(x, z);
  for (let y = 0; y < roof; y++) {
    if (y < ground || y === 0) { g.set(x, y, z, "stone_bricks"); continue; }     // foundation and base course
    if (y === roof - 1) { g.set(x, y, z, "smooth_stone"); continue; }             // cornice / roof edge (flat roof)
    if (y % 2 === 0) { g.set(x, y, z, "smooth_stone"); continue; }                // storey floor and belt course
    if (!edge) {                                                                   // interior: air gap, a glowing light sometimes
      if (lit.has(`${x},${y},${z}`)) g.set(x, y, z, "glowstone");
      continue;
    }
    if (outward(x, z).length === 2 && z >= 2) { g.set(x, y, z, "stone_bricks"); continue; }  // quoins: stone corners of the main body
    if (pane(x, z)) {
      const zFacing = PANE_MAJOR(x, z);
      g.set(x, y, z, "glass_pane", zFacing
        ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
        : { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" });
    } else {
      g.set(x, y, z, "bricks");
    }
  }
}

// entrance: dark oak door in the bay front, facing out (north), on the base course
for (const [y, half] of [[1, "lower"], [2, "upper"]])
  g.set(3, y, 0, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC68919.nbt");
console.log("built", g.count(), "blocks");
