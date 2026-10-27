import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Church of the Holy Sepulchre (way/326340880), Auckland. Lidar footprint: [x, z, ground, roof] per cell, 1.2 blocks/m.
// Decided from the record: a volcanic-stone parish church of the late-19th/early-20th century: dark basalt-type walls
// (stone bricks, cracked and mossy), pale dressings (smooth stone for string courses, cornice and quoins), a steep dark
// slate roof (deepslate tiles), and a west tower on the north front that rises to a copper-capped spire.
// Massing: the lidar roof is median-smoothed in 3x3 and quantised to five flat tiers (8 wings, 12 aisles, 19 nave,
// 25 tower body, 33 spire). Every column is solid from y 0 to its tier, so each block stands on the one below.
const HERE = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${HERE}/way_326340880.cells.json`, "utf8"));

const X = 49, Y = 46, Z = 25;
const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));

const tierOf = (r) => (r >= 29 ? 33 : r < 10 ? 8 : r < 16 ? 12 : r < 22 ? 19 : 25);
function tierAt(x, z) {
  const raw = cell.get(`${x},${z}`).roof;
  if (raw >= 29) return 33;                       // the spire is kept raw, not median-smoothed away
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const c = cell.get(`${x + dx},${z + dz}`); if (c) v.push(c.roof); }
  v.sort((a, b) => a - b);
  return tierOf(v[v.length >> 1]);
}
const T = new Map();
for (const k of cell.keys()) { const [x, z] = k.split(",").map(Number); T.set(k, tierAt(x, z)); }

// Solid massing: each footprint column from y 0 up to its tier (y 0 is the plinth/foundation everywhere)
const id = (x, y, z) => (z * Y + y) * X + x;
const solid = new Uint8Array(X * Y * Z);
for (const [k, t] of T) { const [x, z] = k.split(",").map(Number); for (let y = 0; y < t; y++) solid[id(x, y, z)] = 1; }
const isS = (x, y, z) => x >= 0 && y >= 0 && z >= 0 && x < X && y < Y && z < Z && solid[id(x, y, z)] === 1;

// Depth from the outside, in 3-D: 1 = skin, 2 = second wall layer, 3+ = interior (carved to air but for floor slabs)
const D6 = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
const dist = new Int16Array(X * Y * Z).fill(-1);
let frontier = [];
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  if (!isS(x, y, z)) continue;
  if (D6.some(([dx, dy, dz]) => !isS(x + dx, y + dy, z + dz))) { dist[id(x, y, z)] = 1; frontier.push([x, y, z]); }
}
for (let d = 1; frontier.length; d++) {
  const next = [];
  for (const [x, y, z] of frontier) for (const [dx, dy, dz] of D6) {
    const a = x + dx, b = y + dy, c = z + dz;
    if (isS(a, b, c) && dist[id(a, b, c)] < 0) { dist[id(a, b, c)] = d + 1; next.push([a, b, c]); }
  }
  frontier = next;
}
const dAt = (x, y, z) => (isS(x, y, z) ? dist[id(x, y, z)] : 0);

// Horizontal faces a skin cell shows to the open air
const H4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => H4.filter(([dx, dz]) => !isS(x + dx, y, z + dz));

// Deterministic variety in the volcanic stone, so the walls read as rubble-coursed, not a flat fill
const hash = (x, y, z) => {
  let h = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 2147483647)) >>> 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177) >>> 0;
  return (h ^ (h >>> 16)) >>> 0;
};
const wallBlock = (x, y, z) => {
  const h = hash(x, y, z) % 100;
  return h < 84 ? "stone_bricks" : h < 94 ? "cracked_stone_bricks" : "mossy_stone_bricks";
};

const put = new Map();                       // "x,y,z" -> [block, state] (air is simply not put)
const key = (x, y, z) => `${x},${y},${z}`;
const windows = [];                          // [x, y, z, outward dx, dz] for each glass pane on a skin face
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  if (!isS(x, y, z)) continue;
  const d = dist[id(x, y, z)], t = T.get(`${x},${z}`);
  if (y >= 2 && d >= 3) { if (y % 4 === 1) put.set(key(x, y, z), ["oak_planks"]); continue; }   // interior: air, floor slab per storey
  if (y === 0) { put.set(key(x, y, z), ["polished_andesite"]); continue; }                       // plinth course
  if (d === 1 && y === t - 1) { put.set(key(x, y, z), [t === 33 ? "oxidized_copper" : "deepslate_tiles"]); continue; }   // roof and spire cap
  const ex = exposed(x, y, z);
  let b = wallBlock(x, y, z);
  if (d === 1 && ex.length >= 2) b = "smooth_stone";                                             // quoins at corners
  else if (d === 1 && ex.length === 1) {
    const [dx, dz] = ex[0];
    const along = dz !== 0 ? x : z;                                                              // position along that face
    const winRow = y % 4 === 2 || y % 4 === 3;
    if (y % 4 === 1 || y === t - 2) b = "smooth_stone";                                          // string course and cornice
    else if (t < 29 && winRow && y < t - 2 && along % 3 === 1 && dAt(x - dx, y, z - dz) === 2) {
      b = "glass"; windows.push([x, y, z, dx, dz]);                                              // window; air behind it
    } else if (t < 29 && winRow && y < t - 2) b = "chiseled_stone_bricks";                       // pilasters between the windows
  }
  put.set(key(x, y, z), [b]);
}

// Behind each pane: an air gap (or a warm light). Only where the wall behind is a real second layer.
for (const [x, y, z, dx, dz] of windows) {
  const bx = x - dx, bz = z - dz, h = hash(x, y, z) % 4;
  const t = T.get(`${bx},${bz}`) ?? 0;
  if (h === 0) put.set(key(bx, y, bz), ["glowstone"]);
  else if (h === 1 && t === 25) put.set(key(bx, y, bz), ["shroomlight"]);
  else put.delete(key(bx, y, bz));
}

// Entrance: a door in the north face of the west tower, with dressed jambs and a lintel; a vestibule behind it
const door = (half) => ["dark_oak_door", { half, facing: "north", hinge: "left", open: "false", powered: "false" }];
put.set(key(5, 1, 0), door("lower"));
put.set(key(5, 2, 0), door("upper"));
for (const [x, y, z] of [[4, 1, 0], [4, 2, 0], [4, 3, 0], [5, 3, 0]]) put.set(key(x, y, z), ["smooth_stone"]);
put.delete(key(5, 1, 1));
put.delete(key(5, 2, 1));

// Roof equipment: a lightning rod on the spire's copper cap
put.set(key(5, 33, 0), ["lightning_rod", { facing: "up", powered: "false" }]);

const g = new Voxels([X, Y, Z]);
for (const [k, [block, state]] of put) { const [x, y, z] = k.split(",").map(Number); g.set(x, y, z, block, state); }
const out = `${HERE}/way_326340880.nbt`;
const stats = g.save(out);
console.log(`way_326340880: ${stats.blocks} blocks, palette ${stats.palette} -> ${out}`);
