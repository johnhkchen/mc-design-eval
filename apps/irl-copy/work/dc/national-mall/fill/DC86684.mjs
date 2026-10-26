// Hotel-Large, 15th St NW: a six-storey stone-faced hotel (calcite piers, granite base, quartz strings) on a
// stepped massing read from the lidar roof: a 19-block core over a 17-block shoulder ring, single-storey wings east and north.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86684.cells.json`, "utf8"));
const W = 22, D = 11, H = 31;

// Per footprint cell: the ground (y below it is foundation) and the massing top. The lidar roof is smoothed into three
// flat tiers: 19 (core), 17 (shoulder, 16-18 in the lidar), 4 (single-storey wings, 4-5).
const gr = [], top = [];
for (let z = 0; z < D; z++) { gr.push(Array(W).fill(-1)); top.push(Array(W).fill(0)); }
for (const [x, z, g, roof] of cells) {
  gr[z][x] = g;
  top[z][x] = roof >= 19 ? 19 : roof >= 16 ? 17 : 4;
}

const inFoot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && gr[z][x] >= 0;
const exists = (x, y, z) => inFoot(x, z) && y < top[z][x];
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// shell: the outer skin (any side open to air); ring: the one-cell air gap behind the glass; core: solid massing
const shell = (x, y, z) => exists(x, y, z) && NB.some(([dx, dz]) => !exists(x + dx, y, z + dz));
const ring = (x, y, z) => exists(x, y, z) && !shell(x, y, z) && NB.some(([dx, dz]) => shell(x + dx, y, z + dz));

// string courses at the floor lines of the storeys (the ground-floor lintel at 3, then every 3 rows)
const STRINGS = new Set([3, 4, 7, 10, 13, 16]);

const pane = (missX) => ["glass_pane", missX
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }];

function facade(x, y, z) {
  const t = top[z][x], g = gr[z][x];
  const missX = !exists(x - 1, y, z) || !exists(x + 1, y, z);
  const missZ = !exists(x, y, z - 1) || !exists(x, y, z + 1);
  // a pier every third bay along the face; corners are piers
  const pier = (missX && missZ) || (missX ? z : x) % 3 === 1;
  if (y === t - 1) return ["smooth_quartz"];                       // cornice / parapet cap
  if (y <= g) return ["polished_granite"];                         // base course
  if (y <= 2) return pier ? ["polished_granite"] : pane(missX);    // shopfront
  if (STRINGS.has(y)) return ["smooth_quartz"];                    // storey string course
  return pier ? ["calcite"] : pane(missX);                         // window bays, calcite piers
}

const v = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFoot(x, z)) continue;
  const g = gr[z][x], t = top[z][x];
  for (let y = 0; y < t; y++) {
    if (y < g) { v.set(x, y, z, "polished_granite"); continue; }   // foundation under the sloping ground
    if (shell(x, y, z)) { const [b, s] = facade(x, y, z); v.set(x, y, z, b, s); continue; }
    if (ring(x, y, z)) {                                             // floors and roof over the air gap
      if (y === g || STRINGS.has(y) || y === t - 1) v.set(x, y, z, "stone_bricks");
      continue;
    }
    v.set(x, y, z, "stone_bricks");                                  // solid core: carries the floors
  }
}

// warm lanterns standing on the floor behind some windows of the south front
for (const [b, x] of [[4, 5], [7, 13], [10, 5], [13, 13]]) if (ring(x, b + 1, 9)) v.set(x, b + 1, 9, "lantern", { hanging: "false", waterlogged: "false" });

// roof equipment on the core roof
for (const [x, z] of [[6, 4], [7, 4], [6, 5], [7, 5], [13, 4], [14, 4], [13, 5], [14, 5]]) {
  if (top[z][x] === 19 && !shell(x, 18, z)) v.set(x, 19, z, "light_gray_concrete");
}

// entrance on the south front: granite piers, a pair of doors, a canopy band over them
const Z = D - 1;
for (const y of [1, 2]) {
  v.set(9, y, Z, "polished_granite"); v.set(12, y, Z, "polished_granite");
  v.set(10, y, Z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
  v.set(11, y, Z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "right", open: "false", powered: "false" });
}
for (let x = 9; x <= 12; x++) v.set(x, 3, Z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

console.log(v.save(`${DIR}/DC86684.nbt`));
