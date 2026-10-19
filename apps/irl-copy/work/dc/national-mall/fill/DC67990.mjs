// 555 4th St NW: a 1970s federal-era commercial office block at Judiciary Square. Precast concrete piers and bands over
// tinted blue glass, a granite base and shopfront, a recessed lobby on the north face, and a stepped roof: a 19-block
// tower over a 16-block main block with 13-block wings. The lidar roof is median-smoothed over 3x3 and snapped to those
// clean tiers. Storey lines sit on even rows, so the bands run level across the whole block; each column is solid from
// its ground up to its top, so every tier stands on what is below it. Interiors are an air gap behind the glass and a
// floor slab per storey. Nothing is built outside the footprint.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67990.cells.json", "utf8"));
const X = 19, Z = 32, H = 31;
const grid = () => Array.from({ length: Z }, () => Array(X).fill(-1));
const gnd = grid(), roofRaw = grid();
for (const [x, z, g, r] of cells) { gnd[z][x] = g; roofRaw[z][x] = r; }
const fp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && gnd[z][x] >= 0;

// Clean tiers: a 3x3 median removes the lidar noise, then each value snaps to the nearest setback level.
const tier = (r) => (r >= 18 ? 19 : r >= 17 ? 17 : r >= 14 ? 16 : r >= 13 ? 13 : 12);
const median = (a) => a.sort((p, q) => p - q)[a.length >> 1];
const top = grid();
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp(x, z)) continue;
  const near = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (fp(x + dx, z + dz)) near.push(roofRaw[z + dz][x + dx]);
  top[z][x] = Math.max(gnd[z][x] + 1, tier(median(near)));
}

// The lobby recess: x 8..10, the two outer rows of the north face, ground and first row. Carved out of the volume.
const recess = (x, y, z) => x >= 8 && x <= 10 && z <= 1 && y <= 1;
const vol = (x, y, z) => fp(x, z) && y >= 0 && y < top[z][x] && !recess(x, y, z);
const solidNames = /^(white_concrete|light_gray_concrete|polished_granite|smooth_quartz|smooth_stone|gray_concrete|cyan_stained_glass)$/;

// B: "x,y,z" -> [block, state]. Built in passes so the glass knows its frame and the lights know the glass.
const B = new Map();
const k = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => B.set(k(x, y, z), [block, state]);
const at = (x, y, z) => B.get(k(x, y, z));

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp(x, z)) continue;
  const G = gnd[z][x], T = top[z][x];
  for (let y = 0; y < T; y++) {
    if (recess(x, y, z)) continue;
    if (y < G) { put(x, y, z, "polished_granite"); continue; }                  // foundation: nothing floats on a slope
    const f = { n: !vol(x, y, z - 1), s: !vol(x, y, z + 1), w: !vol(x - 1, y, z), e: !vol(x + 1, y, z) };
    const facade = f.n || f.s || f.w || f.e;
    if (y === T - 1) { put(x, y, z, facade ? "smooth_quartz" : "gray_concrete"); continue; }   // parapet cap / roof membrane
    if (!facade) {
      if (y % 2 === 0 || y === T - 2) put(x, y, z, "smooth_stone");          // floor slab per storey, and the top ceiling
      continue;                                                              // otherwise the air gap behind the glass
    }
    if (y === G) { put(x, y, z, "polished_granite"); continue; }             // granite base course
    if (y === G + 1 && y < 2) {                                              // shopfront: granite piers, tinted glass
      put(x, y, z, x % 3 === 0 || z % 3 === 0 ? "polished_granite" : "cyan_stained_glass");
      continue;
    }
    if (y % 2 === 0) { put(x, y, z, "light_gray_concrete"); continue; }      // spandrel band, level across the block
    const corner = (f.n || f.s) && (f.w || f.e);
    const pier = corner || ((f.n || f.s) ? x % 3 === 0 : z % 3 === 0);
    if (pier) { put(x, y, z, "white_concrete"); continue; }
    put(x, y, z, "light_blue_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
    B.get(k(x, y, z)).facade = f;
  }
}

// Warm lights: glowstone one block inside some of the windows, in the air gap behind the glass.
for (const [key, v] of [...B]) {
  if (v[0] !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const f = v.facade;
  if ((x + 2 * z + y) % 5 !== 0) continue;
  const [ix, iz] = f.n ? [x, z + 1] : f.s ? [x, z - 1] : f.w ? [x + 1, z] : [x - 1, z];
  if (!at(ix, y, iz) && fp(ix, iz) && y < top[iz][ix] && !recess(ix, y, iz)) put(ix, y, iz, "glowstone");
}

// Pane arms: a pane joins a neighbouring pane or a pier in the plane of its wall, never into the room.
for (const [key, v] of [...B]) {
  if (v[0] !== "light_blue_stained_glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const alongX = v.facade.n || v.facade.s;
  const joins = (dx, dz) => { const o = at(x + dx, y, z + dz); return !!o && (o[0] === "light_blue_stained_glass_pane" || solidNames.test(o[0])); };
  const state = alongX
    ? { north: "false", south: "false", east: joins(1, 0) ? "true" : "false", west: joins(-1, 0) ? "true" : "false", waterlogged: "false" }
    : { north: joins(0, -1) ? "true" : "false", south: joins(0, 1) ? "true" : "false", east: "false", west: "false", waterlogged: "false" };
  put(x, y, z, "light_blue_stained_glass_pane", state);
}

// Lobby on the north face: a recess, a canopy over it resting on the floor slab, double doors, lanterns under the canopy.
for (let x = 7; x <= 11; x++) for (let z = 0; z <= 1; z++) put(x, 2, z, "smooth_quartz");
for (const x of [8, 9]) {
  const hinge = x === 8 ? "left" : "right";
  for (const half of ["lower", "upper"]) put(x, half === "lower" ? 0 : 1, 1, "iron_door", { facing: "north", half, hinge, open: "false", powered: "false" });
}
for (const x of [8, 10]) put(x, 1, 0, "lantern", { hanging: "true", waterlogged: "false" });

// Roof: a mechanical penthouse on the tower's top tier, a plant box on the main roof, and a few chimneys.
for (let z = 13; z <= 17; z++) for (let x = 7; x <= 11; x++) {
  if (!fp(x, z) || top[z][x] !== 19) continue;
  const edge = x === 7 || x === 11 || z === 13 || z === 17;
  put(x, 19, z, edge ? "smooth_stone" : "light_gray_concrete");
  put(x, 20, z, edge ? "smooth_quartz" : "iron_bars", edge ? undefined : { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
}
for (let z = 9; z <= 14; z++) for (let x = 5; x <= 12; x++) {
  if (!fp(x, z) || top[z][x] !== 16) continue;
  if (z === 9 || z === 14 || x === 5 || x === 12) { put(x, 16, z, "smooth_stone"); put(x, 17, z, "light_gray_concrete"); }
  else put(x, 16, z, "gray_concrete");
}
for (const [x, z] of [[3, 4], [15, 24], [4, 27]]) if (fp(x, z) && top[z][x] === 13) put(x, 13, z, "brick_block");

const g = new Voxels([X, H, Z]);
for (const [key, [block, state]] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const res = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC67990.nbt");
console.log(JSON.stringify({ built: res, tiers: [...new Set(top.flat().filter((t) => t >= 0))] }));
