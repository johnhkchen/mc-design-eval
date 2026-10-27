// Scene Two, Auckland (way 355401752): a late-20th-century glass-and-concrete office block in the CBD manner. The lidar
// puts the core (roof 56-59 blocks above its lowest ground) at the south-west of the footprint, stepping down through
// 8- and 4-block tiers to a three-storey wing on the east and north. Roofs are 3x3 median-smoothed and snapped to
// whole 4-block storeys (at least one). Each column stands on a basalt foundation down to its own ground, so every
// setback sits on the tier below. Facade: a white floor band at each storey line, blue glass with white piers on a
// 4-block bay, a light-grey spandrel, a basalt base course, a smooth-stone parapet; a glazed entrance on the north
// face under a dark stone lintel, glowstone behind some panes, and a plant room on the core. Interiors are air behind
// the glass with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_355401752.cells.json", "utf8"));
const W = 73, D = 68, H = 72, STOREY = 4, PLINTH = 4;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const GROUND = grid(-1), ROOF = grid(0);                     // -1 = not footprint
for (const [x, z, g, r] of cells) { GROUND[x][z] = g; ROOF[x][z] = r; }
const foot = (x, z) => x >= 0 && z >= 0 && x < W && z < D && GROUND[x][z] >= 0;

// Massing: the top of each footprint cell, exclusive y, a whole number of storeys.
const TOP = grid(0);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!foot(x, z)) continue;
  const vals = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (foot(x + dx, z + dz)) vals.push(ROOF[x + dx][z + dz]);
  vals.sort((a, b) => a - b);
  TOP[x][z] = Math.min(15, Math.max(1, Math.round(vals[vals.length >> 1] / STOREY))) * STOREY;
}

const body = (x, y, z) => foot(x, z) && y >= GROUND[x][z] && y < TOP[x][z];
// the outward horizontal direction of a body cell (null inside the massing)
const outward = (x, y, z) => DIRS.find(([dx, dz]) => !body(x + dx, y, z + dz)) ?? null;
const bayPier = (x, z, dir) => (dir[0] ? z : x) % STOREY === 0;

const vox = new Voxels([W, H, D]);
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!foot(x, z)) continue;
  const g = GROUND[x][z], t = TOP[x][z];
  for (let y = 0; y < g; y++) vox.set(x, y, z, "polished_andesite");      // foundation down to this cell's ground
  for (let y = g; y < t; y++) {
    const dir = outward(x, y, z);
    let block = null;
    if (y < PLINTH) block = "polished_andesite";                          // basalt base course
    else if (y === t - 1) block = dir ? "smooth_stone" : "gray_concrete"; // parapet / roof membrane
    else if (y % STOREY === 0) block = dir ? "smooth_quartz" : "light_gray_concrete"; // floor band / slab
    else if (y % STOREY === 3) block = dir ? "light_gray_concrete" : null; // spandrel
    else if (dir) block = bayPier(x, z, dir) ? "smooth_quartz" : "light_blue_stained_glass";
    if (block) vox.set(x, y, z, block);
  }
}

// Warm glow behind some panes: an interior cell on the floor slab, directly behind a glass pane.
let glow = 0;
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!foot(x, z)) continue;
  for (let y = PLINTH; y < TOP[x][z]; y++) {
    const dir = outward(x, y, z);
    if (!dir || y % STOREY === 0 || y % STOREY === 3 || bayPier(x, z, dir)) continue;
    if ((x * 31 + z * 17 + y * 7) % 11 !== 0) continue;
    const [ix, iz] = [x - dir[0], z - dir[1]];
    if (body(ix, y, iz) && !outward(ix, y, iz) && y % STOREY === 1) { vox.set(ix, y, iz, "glowstone"); glow++; }
  }
}

// Entrance: the north face, the middle of the run of cells that have a second floor above the ground slab.
const north = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) {
  if (!foot(x, z) || TOP[x][z] < 12 || !body(x, 5, z)) continue;
  const dir = outward(x, 5, z);
  if (dir && dir[0] === 0 && dir[1] === -1) north.push([x, z]);
}
if (north.length) {
  const [x0, z0] = north[north.length >> 1];
  const door = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
  vox.set(x0, 5, z0, "iron_door", door("lower"));
  vox.set(x0, 6, z0, "iron_door", door("upper"));
  for (const dx of [-2, -1, 1, 2]) if (body(x0 + dx, 7, z0)) vox.set(x0 + dx, 7, z0, "stone_bricks");          // lintel
  for (const dx of [-1, 1]) {
    if (!body(x0 + dx, 5, z0)) continue;
    vox.set(x0 + dx, 5, z0, "light_blue_stained_glass");                                                        // shop glass
    vox.set(x0 + dx, 6, z0, "light_blue_stained_glass");
    if (body(x0 + dx, 7, z0 + 1) && body(x0 + dx, 8, z0 + 1))
      vox.set(x0 + dx, 7, z0 + 1, "lantern", { hanging: "true", waterlogged: "false" });                       // hangs under the slab
  }
}

// Plant room on the core: the largest 9 x 7 patch of 60-high roof nearest the core's middle.
const CORE = 60;
let best = null;
const cx = [], cz = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (foot(x, z) && TOP[x][z] === CORE) { cx.push(x); cz.push(z); }
const mx = cx.reduce((a, b) => a + b, 0) / cx.length, mz = cz.reduce((a, b) => a + b, 0) / cz.length;
for (let x = 4; x < W - 4; x++) for (let z = 3; z < D - 3; z++) {
  let ok = true;
  for (let dx = -4; dx <= 4 && ok; dx++) for (let dz = -3; dz <= 3 && ok; dz++) ok = foot(x + dx, z + dz) && TOP[x + dx][z + dz] === CORE;
  if (!ok) continue;
  const d = (x - mx) ** 2 + (z - mz) ** 2;
  if (!best || d < best.d) best = { x, z, d };
}
if (best) {
  const { x, z } = best;
  for (let dx = -4; dx <= 4; dx++) for (let dz = -3; dz <= 3; dz++) {
    const px = x + dx, pz = z + dz, edge = Math.abs(dx) === 4 || Math.abs(dz) === 3;
    for (let y = CORE; y <= CORE + 2; y++) {
      if (y === CORE + 1 && edge && (px + pz) % 2 === 0) vox.set(px, y, pz, "iron_bars");   // louvres
      else vox.set(px, y, pz, "light_gray_concrete");
    }
    vox.set(px, CORE + 3, pz, "smooth_quartz");                                         // plant-room cap
  }
  for (const [dx, dz] of [[-4, -3], [4, -3], [-4, 3], [4, 3]]) vox.set(x + dx, CORE + 4, z + dz, "lantern", { hanging: "false", waterlogged: "false" });
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_355401752.nbt";
const r = vox.save(out);
const tiers = {};
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (foot(x, z)) tiers[TOP[x][z]] = (tiers[TOP[x][z]] || 0) + 1;
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}, glow ${glow}, plant room ${best ? "yes" : "no"}`);
console.log("tops (blocks: cells)", JSON.stringify(tiers));
