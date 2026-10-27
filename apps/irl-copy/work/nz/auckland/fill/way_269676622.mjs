// Way 269676622, Eden Terrace side of the CBD: a 1970s concrete-and-glass office block. The lidar says four storeys on
// a stone plinth with a stepped roof (18 blocks at the core, 16 and 12 on the wings, 8 at the low east end), so the
// massing takes the median roof of each cell, snaps it to a tier, and stacks storeys of 4 blocks on a plinth at y 0..3.
// Each footprint cell is solid from y 0 to its tier; the storeys are air behind the shell, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269676622.cells.json", "utf8"));
const g = new Voxels([25, 31, 19]);

const key = (x, z) => `${x},${z}`;
const ground = new Map(), lidar = new Map();
for (const [x, z, gr, r] of cells) { ground.set(key(x, z), gr); lidar.set(key(x, z), r); }
const inF = (x, z) => ground.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Lidar noise out: the median roof of each cell and its footprint neighbours, snapped to a storey tier (8, 12, 16, 18)
const median = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
const tierOf = (r) => (r >= 17 ? 18 : r >= 14 ? 16 : r >= 10 ? 12 : 8);
const top = new Map();
for (const [x, z, , r] of cells) {
  const vals = [r];
  for (const [dx, dz] of NB) if (inF(x + dx, z + dz)) vals.push(lidar.get(key(x + dx, z + dz)));
  top.set(key(x, z), tierOf(median(vals)));
}
const T = (x, z) => top.get(key(x, z));

// A cell at height y is shell (wall, glazing, parapet) where a side faces outside the footprint or a lower tier
const shell = (x, z, y) => NB.some(([dx, dz]) => !inF(x + dx, z + dz) || T(x + dx, z + dz) <= y);
// Piers (quoins at corners) every third cell along a wall: the frames of the window grid
const pier = (x, z) => NB.filter(([dx, dz]) => !inF(x + dx, z + dz)).length >= 2 || (x + z) % 3 === 0;

// What stands at x, y, z (null = air). Solid below the cell's ground; plinth to y 4; storeys of 4 from there.
function blockAt(x, z, y) {
  const gr = ground.get(key(x, z)), t = T(x, z), sh = shell(x, z, y);
  if (y < gr) return ["polished_andesite", null];
  if (y >= t) {
    // coping on the shell, one block above the parapet
    return y === t && shell(x, z, t - 1) ? ["stone_brick_slab", { type: "bottom", waterlogged: "false" }] : null;
  }
  if (y < 4) {
    if (!sh) return ["polished_andesite", null];
    if (y === 3) return ["smooth_stone", null];
    // downhill cells (ground 0) show their extra storey: basement windows in the plinth
    if (gr === 0 && (y === 1 || y === 2)) return pier(x, z) ? ["smooth_quartz", null] : ["gray_stained_glass", null];
    return ["stone_bricks", null];
  }
  if (y === t - 1) return sh ? ["smooth_quartz", null] : ["gray_concrete", null];      // parapet on the shell, roof membrane inside
  if (y % 4 === 0) return sh ? ["light_gray_concrete", null] : ["smooth_stone", null]; // storey line: sill and cornice, or floor slab
  if (y % 4 === 3) return sh ? ["white_concrete", null] : null;                       // spandrel between the windows
  // y % 4 is 1 or 2: the window band
  if (sh) return pier(x, z) ? ["smooth_quartz", null] : [y < 8 ? "cyan_stained_glass" : "light_blue_stained_glass", null];
  // inside, behind the glass: a few warm lights on the storey floors
  const near = NB.some(([dx, dz]) => { const nx = x + dx, nz = z + dz; return inF(nx, nz) && shell(nx, nz, y); });
  if (near && (y === 5 || y === 9 || y === 13) && (x * 2 + z) % 6 === 0 && !(x === 2 && z === 8)) return ["lantern", { hanging: "false" }];
  if (near && y === 10 && (x + 3 * z) % 7 === 0) return ["shroomlight", null];
  return null;
}

for (const [x, z, gr] of cells) {
  const t = T(x, z);
  for (let y = 0; y <= Math.min(t, 30); y++) {
    const b = blockAt(x, z, y);
    if (b) g.set(x, y, z, b[0], b[1] ?? undefined);
  }
  // rooftop plant on the core roof (tier 18): a plant box with a lift overrun
  if (t === 18 && x >= 8 && x <= 11 && z >= 8 && z <= 10) g.set(x, 18, z, "light_gray_concrete"), g.set(x, 19, z, "light_gray_concrete");
  if (t === 18 && x >= 9 && x <= 10 && z === 9) g.set(x, 20, z, "smooth_quartz"), g.set(x, 21, z, "iron_bars");
}

// Entrance on the west face (the uphill side): two stair steps up from the grade, dark oak doors, a canopy over them
const stair = { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" };
g.set(1, 3, 8, "stone_brick_stairs", stair);
g.set(1, 4, 8, "stone_brick_stairs", stair);
g.set(1, 5, 8, "dark_oak_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
g.set(1, 6, 8, "dark_oak_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
for (const z of [8, 9, 10]) g.set(1, 7, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

const info = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_269676622.nbt");
console.log("way_269676622:", info);
