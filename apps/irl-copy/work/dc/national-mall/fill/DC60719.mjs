// DC60719: a Federal-era Neoclassical office block, 18 x 13 footprint, 7 blocks to the roof (lidar), two storeys of
// limestone walls over a granite plinth, with a string course, a smooth-stone cornice and a central entrance.
// The lidar reads 7 only along the z=0 row and 0 elsewhere (no return), so the whole footprint takes the 7-block roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60719.cells.json", "utf8"));
const D = 13, TOP = 7;                       // roof top at y = 7 (blocks at y 0..6)
const onFoot = new Set(cells.map(([x, z]) => `${x},${z}`));

const g = new Voxels([18, 19, 13]);

// facade rhythm: piers and window bays; faces along x and faces along z differ
const LONG_WIN = new Set([2, 3, 5, 6, 8, 9, 11, 12, 14, 15]);   // symmetric about x = 8; 8-9 is the entrance on the south face (z = 12)
const SHORT_WIN = new Set([2, 3, 5, 6, 7, 9, 10]);               // symmetric about z = 6
const GROUND = [1, 2], UPPER = [4, 5];                           // storey rows of glass
const pane = (ew, ns) => ({ east: ew, west: ew, north: ns, south: ns, waterlogged: "false" });

const on = (x, z) => onFoot.has(`${x},${z}`);

// the warm lights go in the air gap just inside a pane
const LIGHTS = [
  [3, 2, D - 2, "shroomlight"], [14, 2, D - 2, "shroomlight"],   // south face, ground storey
  [6, 5, D - 2, "glowstone"], [11, 5, D - 2, "glowstone"],        // south face, upper storey
  [2, 2, 1, "shroomlight"], [5, 5, 1, "glowstone"],               // the north wing
];

for (const [x, z] of cells) {
  // exposed sides: a neighbour off the footprint (the lidar footprint is an L with a notch, not a rectangle)
  const N = !on(x, z - 1), S = !on(x, z + 1), W = !on(x - 1, z), E = !on(x + 1, z);
  const ring = N || S || W || E;
  const corner = (N || S) && (W || E);
  for (let y = 0; y < TOP; y++) {
    // floor slabs: granite foundation/plinth at y0, string course and floor at y3, roof surface at y6 (interior)
    if (y === 0) { g.set(x, y, z, "polished_granite"); continue; }
    if (y === 3) { g.set(x, y, z, "smooth_stone"); continue; }
    if (y === 6) { g.set(x, y, z, ring ? "smooth_stone" : "stone"); continue; }
    if (!ring) continue;                                          // interior air gap behind the walls
    const storey = GROUND.includes(y) || UPPER.includes(y);
    if (!storey) { g.set(x, y, z, "smooth_stone"); continue; }    // string course on the walls
    if (corner) { g.set(x, y, z, "calcite"); continue; }
    // a face along x (north or south) takes the long-face rhythm; a face along z the short-face rhythm
    const alongX = N || S;
    const win = alongX ? LONG_WIN.has(x) : SHORT_WIN.has(z);
    if (!win) { g.set(x, y, z, "calcite"); continue; }
    // the entrance is the central bay on the south face: double dark oak doors, on the ground storey
    if (S && (x === 8 || x === 9) && GROUND.includes(y)) {
      const half = y === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: x === 8 ? "left" : "right", open: "false", powered: "false" });
      continue;
    }
    g.set(x, y, z, "glass_pane", pane(alongX, !alongX));          // a pane on a long face joins east-west
  }
}

// the lights only where the cell is on the footprint and not a pane's own cell
for (const [x, y, z, block] of LIGHTS) if (on(x, z)) g.set(x, y, z, block);

const r = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC60719.nbt");
console.log(`DC60719.nbt: ${r.blocks} blocks, ${r.palette} palette entries`);
