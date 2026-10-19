// 151 West 46th Street, 1928: a commercial and office block of the Midtown setback years. Buff terracotta piers and
// stone spandrels over a red brick body, a granite base and shopfronts on the 46th Street front (low z), an entrance
// recess with a canopy and hanging lanterns. Lidar roofs, flattened into storey tiers (3 blocks a storey): the street
// front 6 (2 storeys) with a 9 and 15 shoulder behind it; terraces at 21, 27, 36 and 42 stepping up the depth; the tower
// body at 51 (17 storeys) with a small machine bulkhead. Solid mass with a 1-block air gap behind each window, a
// glowstone behind some of them, and a floor slab (the spandrel row) per storey, so every tier stands on the one below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022663.cells.json`, "utf8"));
const X = 13, Z = 27, Y = 56;
const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];   // N (low z, the 46th Street front), S, W, E

// Lidar roof -> clean tier. Lidar 0-2 is a notch or noise: it takes the median of its neighbours below.
const tierOf = (r) => (r <= 2 ? null : r <= 7 ? 6 : r <= 14 ? 9 : r <= 20 ? 15 : r <= 25 ? 21 : r <= 32 ? 27 : r <= 38 ? 36 : r <= 45 ? 42 : 51);
const H = Array.from({ length: Z }, () => Array(X).fill(null));
const G = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, g, r] of cells) { H[z][x] = tierOf(r); G[z][x] = g; }
if (cells.length !== X * Z) throw new Error(`footprint has ${cells.length} cells, want ${X * Z}`);
H[0][4] = 6; H[0][5] = 6;                           // the entrance bay: a 2-storey front, not a notch
const at = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? null : H[z][x]);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (H[z][x] !== null) continue;
  const n = DIRS.map(([dx, dz]) => at(x + dx, z + dz)).filter((v) => v !== null).sort((a, b) => a - b);
  if (!n.length) throw new Error(`no tier to take at ${x},${z}`);
  H[z][x] = n[Math.floor(n.length / 2)];
}
const h = (x, z) => (x < 0 || z < 0 || x >= X || z >= Z ? 0 : H[z][x]);

const v = new Voxels([X, Y, Z]);

// 1. Solid mass from y 0 to each tier, the foundation (stone bricks) below each cell's ground.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 0; y < H[z][x]; y++)
  v.set(x, y, z, y < G[z][x] ? "stone_bricks" : "stone");

// 2. The skin: each exposed face gets its role. Gaps behind windows are carved in pass 2 so that no later cell fills them.
const gaps = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = G[z][x]; y < H[z][x]; y++) {
  const ex = DIRS.filter(([dx, dz]) => y >= h(x + dx, z + dz));
  if (y === H[z][x] - 1) { v.set(x, y, z, ex.length ? "stone_bricks" : "smooth_stone"); continue; }   // cornice or roof
  if (!ex.length) continue;
  if (y === 0) { v.set(x, y, z, "polished_granite"); continue; }                                         // base course
  if (ex.length > 1) { v.set(x, y, z, "white_terracotta"); continue; }                                   // quoin
  const [dx, dz] = ex[0];
  const i = dx !== 0 ? z : x, r = y % 3, ground = y < 3;
  if (r === 0) { v.set(x, y, z, "smooth_stone"); continue; }                                            // storey spandrel
  if (i % 3 === 0) { v.set(x, y, z, ground ? "polished_granite" : "white_terracotta"); continue; }      // pier
  const inx = x - dx, inz = z - dz;
  if (h(inx, inz) > y) {                                                                                // window
    if (ground) v.set(x, y, z, "glass");
    else v.set(x, y, z, "glass_pane", dz !== 0
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    gaps.push({ x: inx, y, z: inz });
  } else v.set(x, y, z, "bricks");
}

// 3. The air gap behind each window, and a glowstone in some of them, one block in from the glass at the sill row.
for (const { x, y, z } of gaps) {
  v.set(x, y, z, "air");
  if (y % 3 === 1 && (x * 7 + y * 13 + z * 5) % 6 === 0) v.set(x, y, z, "glowstone");
}

// 4. The entrance on the street front: a door in the bay at x 4 with a shop glass beside it, a recess one block deep,
// hanging lanterns under a canopy that projects over the recess.
v.set(4, 0, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
v.set(4, 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
v.set(4, 2, 0, "dark_oak_planks");
v.set(5, 2, 0, "glass");
for (const x of [4, 5]) for (const y of [0, 1, 2]) v.set(x, y, 1, "air");
v.set(4, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
v.set(5, 2, 1, "lantern", { hanging: "true", waterlogged: "false" });
for (let x = 3; x <= 6; x++) for (let z = 0; z <= 1; z++) v.set(x, 4, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// 5. Roof plant on the tower body: a 4 x 4 bulkhead, three blocks high, with a stone cornice.
for (let z = 10; z <= 13; z++) for (let x = 5; x <= 8; x++) {
  for (let y = 51; y <= 52; y++) v.set(x, y, z, "bricks");
  v.set(x, 53, z, "stone_bricks");
}

// Check: nothing hangs. A block above y 0 needs a block under it or beside it (lanterns hang from the block above).
let hanging = 0;
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 1; y < Y; y++) {
  if (!v.get(x, y, z) || v.get(x, y, z).block === "minecraft:lantern") continue;
  const under = v.get(x, y - 1, z);
  const side = DIRS.some(([dx, dz]) => v.get(x + dx, y, z + dz));
  if (!under && !side) hanging++;
}
if (hanging) console.warn(`${hanging} blocks hang with nothing under or beside them`);

const out = v.save(`${DIR}/NYC1022663.nbt`);
console.log(`NYC1022663.nbt: ${out.blocks} blocks, ${out.palette} palette entries, size ${X} x ${Y} x ${Z}`);
