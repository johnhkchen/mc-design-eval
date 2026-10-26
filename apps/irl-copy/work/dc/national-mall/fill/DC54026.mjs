// 1775 Massachusetts Ave NW: a 1920s-style commercial office block in pale stone. Four storeys on a shared
// podium (the ground shopfront, two office floors, a cornice) with a two-storey tower set back on the south-west
// shoulder, a low lobby at the far corner and a rooftop plant box. Built from the lidar roof heights per cell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54026.cells.json", "utf8"));   // [x, z, ground, roof] per footprint cell, x 0..9, z 0..17
const W = 10, D = 18, H = 25;
const roof = Array.from({ length: D }, () => Array(W).fill(0));    // roof[z][x]; 0 = outside the footprint
for (const [x, z, , r] of cells) roof[z][x] = r;
// lidar noise: a stray 12 on the tower's north shoulder snaps down to the podium, and the tower's west column is one straight edge
roof[8][4] = 11;
for (const z of [10, 11, 12, 13]) roof[z][2] = 13;

const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && roof[z][x] > 0;
const top = (x, z) => (inFp(x, z) ? roof[z][x] : 0);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// the faces of a cell at height y that can be seen: outside the footprint, or beside a column that stops below y
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => !inFp(x + dx, z + dz) || top(x + dx, z + dz) <= y);
const STRING = new Set([4, 7, 10]);                                  // string courses / floor lines
const DOOR = { x: 7, z: 0 };

const g = new Voxels([W, H, D]);
const windows = [];                                                  // glass cells, for the warm lights
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const R = top(x, z); if (!R) continue;
  g.set(x, 0, z, "polished_granite");                                // plinth
  for (let y = 1; y < R; y++) {
    const ex = exposed(x, z, y);
    if (y === R - 1) { g.set(x, y, z, "smooth_quartz"); continue; }   // roof deck / parapet
    if (!ex.length) { if (STRING.has(y)) g.set(x, y, z, "chiseled_quartz_block"); continue; }   // interior: floor slabs only
    if (STRING.has(y)) { g.set(x, y, z, "chiseled_quartz_block"); continue; }
    if (x === DOOR.x && z === DOOR.z && (y === 1 || y === 2)) {
      const half = y === 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    const pier = ex.length >= 2 || (x + z) % 3 === 0;                // corners and every third cell along a face
    if (y <= 2) {                                                     // shopfront
      if (pier) g.set(x, y, z, "quartz_pillar", { axis: "y" });
      else { g.set(x, y, z, "glass"); windows.push({ x, y, z, ground: true }); }
    } else if (y === 3) {                                             // sign band over the shops
      g.set(x, y, z, pier ? "smooth_quartz" : "dark_oak_planks");
    } else {                                                          // office floors and the tower
      if (pier) g.set(x, y, z, "smooth_quartz");
      else { g.set(x, y, z, "light_blue_stained_glass"); windows.push({ x, y, z, ground: false }); }
    }
  }
  // coping on the exposed top edge of each tier
  if (exposed(x, z, R).length) g.set(x, R, z, "smooth_quartz_slab", { type: "bottom" });
}

// warm light in some windows: a lantern on the shop floor, a glowstone on the office floors, set in the air behind the glass
windows.forEach(({ x, y, z, ground }) => {
  if ((x * 7 + z * 5 + y * 3) % 4 !== 0 || (!ground && y !== 5 && y !== 8)) return;
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (!inFp(nx, nz) || top(nx, nz) <= y || exposed(nx, nz, y).length) continue;
    g.set(nx, y, nz, ground ? "lantern" : "glowstone", ground ? { hanging: "false" } : undefined);
    return;
  }
});

// rooftop plant box on the podium, clear of the tower
for (const x of [6, 7]) for (const z of [1, 2]) for (const y of [11, 12]) g.set(x, y, z, "light_gray_concrete");

const out = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC54026.nbt");
console.log(`DC54026: ${out.blocks} blocks, ${out.palette} palette entries`);
