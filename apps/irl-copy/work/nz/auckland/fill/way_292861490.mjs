// Mt Eden view, Auckland CBD edge: a 1960s-70s reinforced-concrete office block, seven storeys (28 blocks) with a
// stepped 33-block tower on the west corner. Walls are white concrete with light-grey frames, blue-glass window bays
// with stone string courses at each floor, and a stone plinth on the lowest ground. Interiors are air with a floor
// slab per storey; a few windows have glowstone just behind the glass.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_292861490.cells.json`, "utf8"));

const W = 25, D = 23, H = 46;
const raw = new Map(cells.map(([x, z, g, r]) => [`${x},${z}`, { g, r }]));
const inside = (x, z) => raw.has(`${x},${z}`);
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N, S, W, E

// Lidar roof noise to three clean tiers: a 3x3 median, then 33 (tower), 32 (setback), 28 (main block).
function roofTier(x, z) {
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inside(x + dx, z + dz)) vals.push(raw.get(`${x + dx},${z + dz}`).r);
  vals.sort((a, b) => a - b);
  const m = vals[vals.length >> 1];
  return m >= 33 ? 33 : m >= 30 ? 32 : 28;
}

const plan = new Map();
for (const [x, z, g] of cells) {
  const outs = DIRS.filter(([dx, dz]) => !inside(x + dx, z + dz));
  plan.set(`${x},${z}`, { x, z, g, T: roofTier(x, z), outs, shell: outs.length > 0 });
}
const at = (x, z) => plan.get(`${x},${z}`);

// Shell (outer skin, one block thick). Rows by storey: string course at 4k, window band at 4k+1..2, header at 4k+3.
function shellBlock(c, y) {
  const { x, z, g, T, outs } = c;
  if (y === T) return "smooth_stone";                      // parapet on the roof edge
  if (y === T - 1) return "light_gray_concrete";           // cornice
  if (y === g) return "polished_andesite";                 // base course on the lowest ground
  if (y % 4 === 0) return "smooth_quartz";                 // string course at each floor line
  if (y % 4 === 3) return "white_concrete";                // header under the floor slab
  const [dx, dz] = outs[0];
  const coord = dz !== 0 ? x : z;
  if (outs.length > 1 || coord % 3 === 0) return "light_gray_concrete";   // corner and mullion piers
  return "light_blue_stained_glass";                        // full-block glass, so a bay reads as a window at a distance
}

// Interior: air, with a floor slab at each storey line, the ground floor and the roof.
function interiorBlock(c, y) {
  const { g, T } = c;
  if (y === g || y === T - 1 || (y % 4 === 0 && y > 0)) return "light_gray_concrete";
  return null;
}

const out = new Voxels([W, H, D]);
const put = (x, y, z, spec) => {
  if (!spec) return;
  const [block, state] = Array.isArray(spec) ? spec : [spec];
  out.set(x, y, z, block, state);
};

for (const c of plan.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");        // foundation under every cell
  for (let y = c.g; y <= c.T; y++) {
    if (y === c.T && !c.shell) continue;
    put(c.x, y, c.z, c.shell ? shellBlock(c, y) : interiorBlock(c, y));
  }
}

// Warm light behind some window bays: glowstone in the air gap just inside the glass.
for (const c of plan.values()) {
  if (!c.shell) continue;
  for (let y = c.g + 1; y < c.T - 1; y++) {
    if (y % 4 !== 1 && y % 4 !== 2) continue;
    const [dx, dz] = c.outs[0] ?? [0, 0];
    if (c.outs.length !== 1) continue;
    const coord = dz !== 0 ? c.x : c.z;
    if (coord % 3 === 0) continue;
    if (((c.x * 3 + c.z * 5 + y * 7) % 4) !== 0) continue;
    const p = at(c.x - dx, c.z - dz);
    if (!p || p.shell) continue;
    put(p.x, y, p.z, "glowstone");
  }
}

// Main entrance on the north face (the lowest ground): double doors, a stone lintel above.
const entrance = at(14, 0);
const doorState = (half) => ({ facing: "north", half, hinge: "left", open: "false", powered: "false" });
put(entrance.x, 0, entrance.z, ["dark_oak_door", doorState("lower")]);
put(entrance.x, 1, entrance.z, ["dark_oak_door", doorState("upper")]);
put(entrance.x, 2, entrance.z, "smooth_stone");

// Roof plant: a lift core on the tower top, and a pair of air-handling units on the main roof.
for (const [x, z] of [[3, 6], [4, 6], [3, 7], [4, 7]]) {
  const c = at(x, z);
  if (!c || c.T !== 33) continue;
  put(x, 33, z, "light_gray_concrete");
  put(x, 34, z, "light_gray_concrete");
  put(x, 35, z, "smooth_stone");
}
for (const [x, z] of [[19, 6], [20, 6], [19, 7], [20, 7]]) {
  const c = at(x, z);
  if (!c || c.T !== 28) continue;
  put(x, 28, z, "light_gray_concrete");
}

const stats = out.save(`${DIR}/way_292861490.nbt`);
console.log(`way_292861490: ${cells.length} footprint cells, ${stats.blocks} blocks, ${stats.palette} palette entries`);
