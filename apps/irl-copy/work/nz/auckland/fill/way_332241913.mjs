// Auckland way 332241913, seen from Maungawhau: a 1920s-30s plastered commercial block. Three storeys (4 blocks each)
// on the lidar's high ridge (roof 12, parapet to 13), two-storey wings on the low side (roof 8-10). The lidar's
// roof field is smoothed into those two flat tiers. Stone base and quoins, white plaster piers, light bands at each
// storey line, glass panes set in recessed alcoves with an air gap behind (warm glowstone and shroomlight in some),
// a shopfront ground floor, a central door with a canopy and lanterns, a parapet on every roof edge, and a plant room.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_332241913.cells.json`, "utf8"));

const X = 28, Y = 25, Z = 22;
const WALL = "white_concrete", BAND = "light_gray_concrete", STONE = "stone_bricks", ROOF = "gray_concrete";
const DIRS = { E: [1, 0], W: [-1, 0], N: [0, -1], S: [0, 1] };

// Footprint, lidar roof (r) and ground (g) per column.
const foot = new Uint8Array(X * Z), lidarR = new Int16Array(X * Z);
for (const [x, z, , r] of cells) { foot[z * X + x] = 1; lidarR[z * X + x] = r; }
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && foot[z * X + x] === 1;

// Smoothed tiers: the mean roof of the 3x3 neighbourhood decides 12 (three storeys) or 8 (two storeys).
const topH = new Int16Array(X * Z);
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  let sum = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFoot(x + dx, z + dz)) { sum += lidarR[(z + dz) * X + x + dx]; n++; }
  topH[z * X + x] = sum / n >= 10.5 ? 12 : 8;
}
const H = (x, z) => topH[z * X + x];

// The massing: every footprint column solid from y 0 up to its tier (the foundation is the same solid, from the ground).
const solid = (x, y, z) => inFoot(x, z) && y >= 0 && y < H(x, z);

// The grid: null is air. Solid cells default to plaster, the base row to stone.
const I = (x, y, z) => (z * Y + y) * X + x;
const grid = new Array(X * Y * Z).fill(null);
const put = (x, y, z, block, state) => { if (x >= 0 && y >= 0 && z >= 0 && x < X && y < Y && z < Z) grid[I(x, y, z)] = block ? { block, state } : null; };
const get = (x, y, z) => (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) ? null : grid[I(x, y, z)];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) for (let y = 0; y < H(x, z); y++) if (inFoot(x, z)) put(x, y, z, y === 0 ? STONE : WALL);

// Facade rows: y 0 is the base course, then each storey is 4 rows: a band, two window rows, a band (lintel or sill).
const row = (y) => (y === 0 ? "base" : y % 4 === 0 || y % 4 === 3 ? "band" : "window");
const exposed = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !solid(x + dx, y, z + dz)).map(([d]) => d);

const windows = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  for (let y = 0; y < H(x, z); y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) continue;
    if (y === 0 || ex.length > 1) { put(x, y, z, STONE); continue; }      // base course, and quoins at the corners
    const d = ex[0], ew = d === "E" || d === "W", u = ew ? z : x;
    const r = row(y);
    if (r === "band") { put(x, y, z, BAND); continue; }
    const pier = u % 3 === 0;
    put(x, y, z, pier && y < 4 ? STONE : WALL);
    if (!pier) windows.push({ x, y, z, d, ew });
  }
}

// The facade's window bays. Each bay is a recessed alcove: the outer block is air, a glass pane sits one block in, and
// the block behind the glass is air (or a warm light in some). Only bays with solid behind the glass get one.
const hash = (x, y, z) => (x * 31 + y * 17 + z * 13) % 17;
const doorBay = { x: null, z: null };

// The door: on the building's southernmost ground-floor south face (the widest one at the bottom of the footprint),
// in the window bay nearest that face's middle.
const south = windows.filter((w) => w.d === "S" && w.y === 1);
if (south.length) {
  const zMax = Math.max(...south.map((w) => w.z));
  const face = south.filter((w) => w.z === zMax);
  const mid = face.reduce((a, w) => a + w.x, 0) / face.length;
  const pick = face.reduce((a, w) => (Math.abs(w.x - mid) < Math.abs(a.x - mid) ? w : a));
  doorBay.x = pick.x; doorBay.z = pick.z;
}

for (const w of windows) {
  if (w.d === "S" && w.y <= 2 && w.x === doorBay.x && w.z === doorBay.z) continue;   // the door takes this bay
  const [dx, dz] = DIRS[w.d];
  const b1 = { x: w.x - dx, y: w.y, z: w.z - dz }, b2 = { x: w.x - 2 * dx, y: w.y, z: w.z - 2 * dz };
  if (!solid(b1.x, b1.y, b1.z)) continue;
  // the glass pane with its arms along the facade, an air gap behind it (warm light in a few)
  const arms = w.ew ? { north: "true", south: "true" } : { east: "true", west: "true" };
  const state = { north: "false", south: "false", east: "false", west: "false", ...arms, waterlogged: "false" };
  put(w.x, w.y, w.z, null);
  put(b1.x, b1.y, b1.z, "glass_pane", state);
  if (solid(b2.x, b2.y, b2.z)) {
    const h = hash(w.x, w.y, w.z);
    put(b2.x, b2.y, b2.z, h === 0 ? "glowstone" : h === 5 ? "shroomlight" : null);
  }
}

// The entrance: a dark oak door on the south face, a dark hood board over it (a canopy cannot project past the footprint),
// and lanterns in the bays beside it.
if (doorBay.x !== null) {
  const { x, z } = doorBay;
  const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  put(x, 1, z, "dark_oak_door", door("lower"));
  put(x, 2, z, "dark_oak_door", door("upper"));
  put(x, 3, z, "dark_oak_planks");
  for (const lx of [x - 1, x + 1]) {
    if (get(lx, 2, z) === null && solid(lx, 3, z)) put(lx, 2, z, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// The roof: a flat membrane on each tier, a parapet on every edge (where the column's neighbour falls below the roof).
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!inFoot(x, z)) continue;
  const top = H(x, z);
  const edge = Object.values(DIRS).some(([dx, dz]) => !solid(x + dx, top - 1, z + dz));
  put(x, top, z, edge ? WALL : ROOF);
}

// A plant room on the high roof: the largest 6 x 4 rectangle of tier-12 roof one block inside the edge, nearest the middle.
let best = null;
for (let z0 = 1; z0 + 4 < Z; z0++) for (let x0 = 1; x0 + 6 < X; x0++) {
  let ok = true;
  for (let z = z0 - 1; z <= z0 + 4 && ok; z++) for (let x = x0 - 1; x <= x0 + 6 && ok; x++) if (!inFoot(x, z) || H(x, z) !== 12) ok = false;
  if (!ok) continue;
  const score = Math.abs(x0 + 3 - X / 2) + Math.abs(z0 + 2 - Z / 2);
  if (!best || score < best.score) best = { x0, z0, score };
}
if (best) {
  const { x0, z0 } = best;
  for (let z = z0; z < z0 + 4; z++) for (let x = x0; x < x0 + 6; x++) {
    for (let y = 12; y <= 14; y++) put(x, y, z, BAND);
    put(x, 15, z, STONE);
  }
  // louvres on the south side of the plant room
  for (let x = x0; x < x0 + 6; x += 2) put(x, 13, z0 + 3, "iron_bars", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
}

// Emit the grid.
const g = new Voxels([X, Y, Z]);
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) {
  const c = grid[I(x, y, z)];
  if (c) g.set(x, y, z, c.block, c.state);
}
const out = `${dir}/way_332241913.nbt`;
const stats = g.save(out);
console.log(JSON.stringify({ file: out, ...stats, windows: windows.length, door: doorBay.x !== null, plantRoom: best !== null }));
