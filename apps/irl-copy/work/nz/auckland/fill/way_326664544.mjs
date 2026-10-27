// Mt Eden / Newton-edge commercial block, c.1930s: a four-storey stripped-classical office block in
// cream render over a brick-and-stone base, stepped back at the top storey, with a three-storey
// wing on the north-east. Lidar roof 16 blocks over the main mass, 13-14 over the wing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326664544.cells.json`, "utf8"));

const W = 31, H = 28, D = 39;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

// footprint: key -> { g: ground under the cell, r: lidar roof height above y0 }
const col = new Map();
for (const [x, z, g, r] of cells) col.set(key(x, z), { g, r });

// inset = steps inward from the footprint edge (0 = edge cell)
const inset = new Map();
const queue = [];
for (const k of col.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (DIRS.some(([dx, dz]) => !col.has(key(x + dx, z + dz)))) { inset.set(k, 0); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i], d = inset.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const k = key(x + dx, z + dz);
    if (col.has(k) && !inset.has(k)) { inset.set(k, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// massing: lidar roof 15-16 is the main mass, stepping back to a 12-block podium at the outer
// two cells (the top storey is set in); lidar 13-14 is the lower wing at 14 (3 storeys + attic band)
const top = new Map();
for (const [k, { r }] of col) {
  top.set(k, r >= 15 ? (inset.get(k) >= 2 ? 16 : 12) : 14);
}
const T = (x, z) => top.get(key(x, z));
const env = (x, y, z) => col.has(key(x, z)) && y >= 0 && y < T(x, z);
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !env(x + dx, y, z + dz));

const v = new Voxels([W, H, D]);
const lights = [];

for (const [k, { g }] of col) {
  const [x, z] = k.split(",").map(Number);
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    if (y < g) { v.set(x, y, z, "stone"); continue; }                 // foundation up to the lidar ground
    const f = Math.max(g, 4 * Math.floor(y / 4));                     // this storey's floor line
    const r = y - f;                                                   // row within the storey
    const bandEnd = Math.min(t - 1, 4 * Math.floor(y / 4) + 3);
    const bandH = bandEnd - f + 1;
    const ground = f === g;                                            // the storey that meets the street
    const ex = exposed(x, y, z);

    if (y === t - 1) { v.set(x, y, z, ex.length ? "stone_bricks" : "smooth_stone"); continue; }  // cornice / roof
    if (!ex.length) { if (y === f) v.set(x, y, z, "smooth_stone"); continue; }                 // interior floor slab

    // shell
    const alongZ = ex.some(([dx]) => dx !== 0);                        // wall runs along z (faces +-x)
    const i = alongZ ? z : x;                                          // bay index along the wall (stepped edges: every cell is a bay)
    const pier = i % 3 === 0;
    const plinth = ground ? "stone_bricks" : "smooth_quartz";
    if (bandH < 3 || r === 0) { v.set(x, y, z, plinth); continue; }     // base course / short attic band
    if (r === 3) { v.set(x, y, z, "stone_bricks"); continue; }          // string course over each storey
    // r = 1..2: the window band
    if (pier) v.set(x, y, z, ground ? "bricks" : "smooth_quartz");
    else v.set(x, y, z, "glass");                                      // full glass in quartz frames: reads from the air
    if (!pier && r === 1 && (i + f) % 3 === 1) lights.push({ x, y, z, ex: ex[0], ground });
  }
}

// entrance: a street-side (+z) bay on the lowest ground storey, placed near the median x of the candidates
const cand = [];
for (const [k, { g }] of col) {
  const [x, z] = k.split(",").map(Number);
  if (!col.has(key(x, z + 1)) && col.has(key(x + 1, z)) && col.has(key(x - 1, z)) && (g === 0 || g === 4)) cand.push({ x, z, g });
}
const xs = cand.map((c) => c.x).sort((a, b) => a - b);
const medX = xs[Math.floor(xs.length / 2)];
const door = cand.sort((a, b) => Math.abs(a.x - medX) - Math.abs(b.x - medX))[0];
if (door) {
  const { x, z, g } = door;
  v.set(x, g + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  v.set(x, g + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  // a standing lantern just inside the door, on the entrance-hall floor
  v.set(x, g + 1, z - 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// warm light behind glass: a glowstone or shroomlight in the cell just inside a lit window
let lit = 0;
for (const { x, y, z, ex, ground } of lights) {
  const [dx, dz] = ex;
  const ix = x - dx, iz = z - dz;
  if (!env(ix, y, iz) || exposed(ix, y, iz).length || v.get(ix, y, iz)) continue;
  v.set(ix, y, iz, ground ? "shroomlight" : "glowstone");
  lit++;
}

// roof plant room: a 3x3 box on the main mass's top, standing on the roof slab
const hi = [...top].filter(([k, t]) => t === 16 && inset.get(k) >= 4).map(([k]) => k.split(",").map(Number));
if (hi.length) {
  const cx = hi.reduce((s, [x]) => s + x, 0) / hi.length, cz = hi.reduce((s, [, z]) => s + z, 0) / hi.length;
  const [px, pz] = hi.sort((a, b) => Math.hypot(a[0] - cx, a[1] - cz) - Math.hypot(b[0] - cx, b[1] - cz))[0];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (!env(px + dx, 16, pz + dz)) continue;
    v.set(px + dx, 16, pz + dz, "bricks");
    v.set(px + dx, 17, pz + dz, "stone_bricks");
  }
}

// support check: every solid block above y 0 has a block under it or beside it on its own level
let floating = 0;
for (let y = 1; y < H; y++) for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!v.get(x, y, z) || v.get(x, y - 1, z)) continue;
  if (DIRS.some(([dx, dz]) => v.get(x + dx, y, z + dz))) continue;
  floating++;
}

let solid = 0;
v.forEachCell(() => solid++);
console.log(`cells ${cells.length}, blocks ${solid}, lit windows ${lit}, entrance ${door ? `(${door.x},${door.z})` : "none"}, floating ${floating}`);
const hist = new Map();
v.forEachCell((i, p) => hist.set(v.palette[p].block, (hist.get(v.palette[p].block) || 0) + 1));
console.log([...hist].sort((a, b) => b[1] - a[1]).map(([b, n]) => `${b} ${n}`).join("\n"));

v.save(`${DIR}/way_326664544.nbt`);
