// Group M: a 1980s-90s concrete-frame office block on Auckland's CBD ridge, about 15 storeys. Its lidar roof falls in three
// tiers (57 wings, 61 main, 69 core), smoothed to flat levels. The shell is a granite plinth and base course, then 4-block
// storeys: a floor slab, two window bands of glass bays with concrete piers, and a deck. The air between is the gap behind
// the glass. A parapet caps the walls, a glazed entrance sits in the south-most wall, and roof plant and a lightning rod sit on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_154089898.cells.json`, "utf8"));
const W = 38, D = 36, H = 82;

// the lidar roof per footprint cell, smoothed by a 3x3 median and then snapped to three flat tiers
const lidar = Array.from({ length: D }, () => Array(W).fill(null));
for (const [x, z, , r] of cells) lidar[z][x] = r;
const inFp = (x, z) => x >= 0 && z >= 0 && x < W && z < D && lidar[z][x] !== null;
const median = (v) => { v.sort((a, b) => a - b); return v[v.length >> 1]; };
const R = Array.from({ length: D }, () => Array(W).fill(0));      // each column's top (0 = off the footprint)
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inFp(x, z)) continue;
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(lidar[z + dz][x + dx]);
  const m = median(v);
  R[z][x] = m >= 65 ? 69 : m >= 60 ? 61 : 57;
}
const top = (x, z) => (x >= 0 && z >= 0 && x < W && z < D ? R[z][x] : 0);
const SIDES = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a facade cell: a side neighbour has no block at this height (outside the footprint, or a lower tier)
const wall = (x, z, y) => SIDES.some(([dx, dz]) => top(x + dx, z + dz) <= y);

const g = new Voxels([W, H, D]);
const GLASS = "light_blue_stained_glass", CONCRETE = "light_gray_concrete", PIER = "gray_concrete";

// pass 1: the solid massing and the skin
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const T = R[z][x]; if (!T) continue;
  for (let y = 0; y < T; y++) {
    const phase = (y - 1) % 4;   // 0 floor slab, 1-2 window band, 3 deck (the support for the storey above)
    let b = null;
    if (y === 0) b = "polished_granite";                                // plinth
    else if (y === 1) b = wall(x, z, y) ? "polished_granite" : CONCRETE; // base course
    else if (y === T - 1) b = "gray_concrete";                          // the roof
    else if (phase === 0 || phase === 3) b = CONCRETE;                  // floor slab and deck, solid across the plan
    else if (wall(x, z, y)) b = (x + z) % 4 === 0 ? PIER : GLASS;       // bays of glass between concrete piers
    if (b) g.set(x, y, z, b);
  }
  // parapet on the outer edge of the roof
  if (SIDES.some(([dx, dz]) => top(x + dx, z + dz) < T)) g.set(x, T, z, CONCRETE);
}

// pass 2: warm light in some windows, in the air gap behind the glass
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  const T = R[z][x]; if (!T) continue;
  for (let y = 2; y < T - 1; y++) {
    const phase = (y - 1) % 4;
    if (phase !== 1 && phase !== 2) continue;
    if (wall(x, z, y) || (x * 7 + z * 11 + y) % 5 !== 0) continue;
    const behindGlass = SIDES.some(([dx, dz]) => g.get(x + dx, y, z + dz)?.block === GLASS);
    if (behindGlass) g.set(x, y, z, "glowstone");
  }
}

// the entrance: the southern-most wall cell near the middle, a door under a canopy, a lamp just inside
const doors = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (R[z][x] && wall(x, z, 2) && top(x, z + 1) === 0) doors.push({ x, z });
}
doors.sort((a, b) => b.z - a.z || Math.abs(a.x - 20) - Math.abs(b.x - 20));
const door = doors[0];
if (door) {
  const face = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(door.x, 2, door.z, "oak_door", { ...face, half: "lower" });
  g.set(door.x, 3, door.z, "oak_door", { ...face, half: "upper" });
  for (const dx of [-1, 0, 1]) if (top(door.x + dx, door.z) > 0) g.set(door.x + dx, 4, door.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  g.set(door.x, 2, door.z - 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof plant: a louvred box on the main roof, clear of the core
for (let z = 22; z <= 25; z++) for (let x = 8; x <= 11; x++) {
  if (top(x, z) !== 61) continue;
  g.set(x, 61, z, CONCRETE);
  g.set(x, 62, z, "iron_bars", { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" });
}

// a lightning rod on the core's roof
g.set(23, 69, 20, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

const out = `${DIR}/way_154089898.nbt`;
const info = g.save(out);
console.log(`way_154089898: ${info.blocks} blocks, ${info.palette} palette entries -> ${out}`);
