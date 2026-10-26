// 2001 S St NW: a 1960s-70s precast-and-glass office block on a 12 x 13 footprint. Massing from the lidar roof, tiered:
// wings roof 10, a mid ring roof 12 (lidar 12), a core roof 13. Storeys are 2 blocks (about 4.8 m at 0.42/m): a stone
// base course, then a spandrel row (precast, the floor line) over a window row of glass with precast piers every 3rd bay.
// Solid mass with carved air behind each glass pane (one block deep, floor and ceiling are the spandrel rows); some
// panes have a glowstone behind them. Street face is the +z (south) side, with a lobby entrance and a flush canopy.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59816.cells.json", "utf8"));
const W = 12, D = 13;

// lidar roof -> clean tiers (10 wings, 12 ring, 13 core); the stray 3 and the 11s fold into the wing tier.
// The footprint is not a full rectangle (x 11 is open except at z 8-9): cells outside it have top 0 and stay empty.
const tier = (r) => (r >= 13 ? 13 : r >= 12 ? 12 : 10);
const T = Array.from({ length: W }, () => Array(D).fill(0));
for (const [x, z, , r] of cells) T[x][z] = tier(r);   // the ground is not needed: the column is solid from y 0 up to its top, so the foundation is the same column

const top = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? 0 : T[x][z]);
const solid = (x, y, z) => y >= 0 && y < top(x, z);          // foundation (y < ground) and building share one column
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];                // +x, -x, +z, -z
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));

const put = new Map(), air = new Set(), glass = [];
const key = (x, y, z) => `${x},${y},${z}`;
const set = (x, y, z, block, state) => put.set(key(x, y, z), { x, y, z, block, state });

// pass 1: the shell and the mass
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  for (let y = 0; y < T[x][z]; y++) {
    const isTop = y === T[x][z] - 1, ex = exposed(x, y, z);
    if (!ex.length && !isTop) { set(x, y, z, "light_gray_concrete"); continue; }   // hidden mass
    if (!ex.length) { set(x, y, z, "gray_concrete"); continue; }                  // roof deck
    if (isTop) { set(x, y, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); continue; }   // cornice
    if (y === 0) { set(x, y, z, "stone_bricks"); continue; }                     // base course
    if (y % 2 === 0) { set(x, y, z, "smooth_quartz"); continue; }                // spandrel: storey line
    const [dx, dz] = ex[0], idx = dx ? z : x, last = dx ? D - 1 : W - 1;
    const pier = ex.length > 1 || idx % 3 === 0 || idx === last;                 // precast pier every third bay
    if (pier) { set(x, y, z, "smooth_quartz"); continue; }
    set(x, y, z, "light_blue_stained_glass");
    glass.push({ x, y, z, inward: [x - dx, y, z - dz] });
  }
}

// pass 2: an air gap one block deep behind every pane (glowstone behind some)
for (const { x, y, z, inward: [ix, iy, iz] } of glass) {
  if (!solid(ix, iy, iz)) continue;
  air.add(key(ix, iy, iz)); put.delete(key(ix, iy, iz));
  if ((x * 7 + y * 13 + z * 3) % 11 === 0) set(ix, iy, iz, "glowstone");
}

// pass 3: the entrance: iron doors in the lobby bay, a flush canopy on top, lanterns under it, the lobby behind
for (const x of [5, 6]) {
  air.add(key(x, 1, 11)); air.add(key(x, 2, 11)); put.delete(key(x, 1, 11)); put.delete(key(x, 2, 11));
  const hinge = x === 5 ? "left" : "right";
  set(x, 1, 12, "iron_door", { facing: "south", half: "lower", hinge, open: "false", powered: "false" });
  set(x, 2, 12, "iron_door", { facing: "south", half: "upper", hinge, open: "false", powered: "false" });
}
set(5, 1, 11, "glowstone");
for (let x = 4; x <= 7; x++) set(x, 3, 12, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
for (const x of [4, 7]) set(x, 2, 12, "lantern", { hanging: "true", waterlogged: "false" });

// pass 4: roof plant on the ring roof (a pair of plant boxes)
for (const [x0, z0] of [[4, 3], [8, 5]]) for (let dx = 0; dx < 2; dx++) for (let dz = 0; dz < 2; dz++) set(x0 + dx, 12, z0 + dz, "light_gray_concrete");

// write it
const v = new Voxels([W, 25, D]);
for (const { x, y, z, block, state } of put.values()) v.set(x, y, z, block, state);
const info = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC59816.nbt");
console.log(`DC59816: ${info.blocks} blocks, ${info.palette} palette entries, ${air.size} air cells behind glass and in the lobby`);
