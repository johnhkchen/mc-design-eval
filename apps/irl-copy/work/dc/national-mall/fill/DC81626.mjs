// DC81626: 499 South Capitol Street SW, a Commercial-Office-Large. The lidar reads a 41 x 13 slab of four storeys (12 blocks
// to the cornice) with a 14-block core rising two blocks above the wings, so it reads as a 1970s stone-faced office: smooth
// stone spandrels and white concrete mullions on a three-block bay rhythm, blue-tinted glass above a clear shopfront, a stone
// base course, a stone hood over a dark oak entrance on the north face, and condenser boxes on the wings and a plant room on the core.
//
// Floors sit on absolute rows (3, 6, 9 and 11), so the wings and the core line up where the ground steps. Each column fills
// from y 0 to its ground as foundation. A side is exterior at a height when it has no neighbour there, or the neighbour's top
// is below that height. Interior cells are air except one solid floor per storey, with a lamp standing on the floor behind some windows.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC81626.cells.json`, "utf8"));
const vox = new Voxels([41, 26, 13]);

const key = (x, z) => `${x},${z}`;
const FACES = [["N", 0, -1], ["S", 0, 1], ["W", -1, 0], ["E", 1, 0]];
const FLOORS = [3, 6, 9, 11];    // floor slabs: the shop ceiling, storeys 2 and 3, and the wing deck (the core's floor)
const SHOP = 3;                  // rows below this are the clear shopfront

// Lidar roof: the 3x3 median kills single-cell noise, then three flat tiers: the 3-block plinth on the west tip,
// the 12-block wings, and the 14-block core.
const roofAt = new Map(cells.map(([x, z, , roof]) => [key(x, z), roof]));
const tierOf = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (roofAt.has(key(x + dx, z + dz))) v.push(roofAt.get(key(x + dx, z + dz)));
  v.sort((a, b) => a - b);
  const s = v[v.length >> 1];
  return s <= 3 ? 3 : s <= 13 ? 12 : 14;
};
const cols = new Map(cells.map(([x, z, ground]) => [key(x, z), { x, z, ground, T: 0 }]));
for (const c of cols.values()) c.T = tierOf(c.x, c.z);
const colAt = (x, z) => cols.get(key(x, z));

const isFloor = (c, y) => y === c.ground || FLOORS.includes(y);
// The exterior sides of a column at height y.
const sidesAt = (c, y) => FACES.filter(([, dx, dz]) => { const n = colAt(c.x + dx, c.z + dz); return !n || n.T <= y; });
const pane = (ns) => (ns ? { east: "true", west: "true", north: "false", south: "false" } : { east: "false", west: "false", north: "true", south: "true" });

function place(c, y) {
  if (y >= c.T) return;
  if (y < c.ground) return vox.set(c.x, y, c.z, "stone");                                   // foundation
  const sides = sidesAt(c, y);
  if (y === c.T - 1) return vox.set(c.x, y, c.z, sides.length ? "smooth_stone" : "light_gray_concrete");   // coping, roof deck
  if (!sides.length) { if (isFloor(c, y)) vox.set(c.x, y, c.z, "smooth_stone"); return; }  // interior: floor slabs only
  if (y === c.ground) return vox.set(c.x, y, c.z, "stone_bricks");                           // base course
  if (FLOORS.includes(y)) return vox.set(c.x, y, c.z, "smooth_stone");                       // spandrel
  const ns = sides.some(([f]) => f === "N" || f === "S");
  const ew = sides.some(([f]) => f === "W" || f === "E");
  const pier = (ns && ew) || (ns ? c.x % 3 === 0 : c.z % 3 === 0);
  if (pier) return vox.set(c.x, y, c.z, "white_concrete");
  if (y < SHOP) return vox.set(c.x, y, c.z, "glass_pane", pane(ns));
  vox.set(c.x, y, c.z, "light_blue_stained_glass_pane", pane(ns));
}

for (const c of cols.values()) for (let y = 0; y < 26; y++) place(c, y);

// Entrance: dark oak door on the north face under a stone hood, with lanterns hanging either side.
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
vox.set(25, 2, 0, "dark_oak_door", { ...DOOR, half: "lower" });
vox.set(25, 3, 0, "dark_oak_door", { ...DOOR, half: "upper" });
for (let x = 23; x <= 27; x++) vox.set(x, 4, 0, "smooth_stone");
for (const x of [23, 27]) vox.set(x, 3, 0, "lantern", { hanging: "true", waterlogged: "false" });

// Roof plant: two condenser boxes on the north wing (iron, so they read as equipment rather than black holes), a plant room on the core.
for (const x0 of [13, 30]) for (let x = x0; x < x0 + 2; x++) for (let z = 0; z < 2; z++) for (let y = 12; y <= 13; y++) vox.set(x, y, z, "iron_block");
for (let x = 22; x <= 28; x++) for (let z = 4; z <= 7; z++) {
  if (x === 22 || x === 28 || z === 4 || z === 7) for (let y = 14; y <= 14; y++) vox.set(x, y, z, "white_concrete");
  vox.set(x, 15, z, "smooth_stone");
}

// Warm lights: a lamp standing on the floor just inside a glass bay on the first row of a storey.
for (const c of cols.values()) for (let y = 1; y < c.T - 1; y++) {
  const sides = sidesAt(c, y);
  if (!sides.length || !isFloor(c, y - 1)) continue;
  const b = vox.get(c.x, y, c.z);
  if (!b || !b.block.includes("glass")) continue;
  const [, dx, dz] = sides[0];
  const room = colAt(c.x - dx, c.z - dz);
  if (!room || y >= room.T || !isFloor(room, y - 1) || sidesAt(room, y).length) continue;
  const h = Math.abs(((room.x * 73856093) ^ (y * 19349663) ^ (room.z * 83492791)) >>> 0);
  if (h % 4) continue;
  if (h % 3 === 0) vox.set(room.x, y, room.z, "shroomlight");
  else if (h % 3 === 1) vox.set(room.x, y, room.z, "glowstone");
  else vox.set(room.x, y, room.z, "lantern", { hanging: "false", waterlogged: "false" });
}

console.log(vox.save(`${DIR}/DC81626.nbt`));
