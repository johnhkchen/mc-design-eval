// A 1930s two-storey brick commercial block over shopfronts, with a raised central parapet (the lidar's 10-block core)
// and a lower wing on the east. The envelope is one block thick; the rooms behind are air, with a floor slab per storey.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317542.cells.json", "utf8"));
const [X, Y, Z] = [21, 23, 28];
const k = (x, z) => `${x},${z}`;
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const FACING = { north: "north", south: "south", west: "west", east: "east" };

// footprint cell: ground (y of the floor, 0 or 1), top (the parapet's top, flat tiers from the lidar roof's 3x3 median)
const fp = new Map();
for (const [x, z, ground, roof] of cells) fp.set(k(x, z), { ground, roof });
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  const vals = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = fp.get(k(x + dx, z + dz)); if (n) vals.push(n.roof); }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  c.top = med >= 9.5 ? 10 : med >= 8.5 ? 9 : 8;
}
const cellAt = (x, z) => fp.get(k(x, z));

// the directions a column's air touches at height y: outside the footprint, or a neighbour whose top is below y
const exposed = (x, z, y) => Object.entries(DIRS).filter(([, [dx, dz]]) => { const n = cellAt(x + dx, z + dz); return !n || y >= n.top; }).map(([d]) => d);

// the street front is the side with the most envelope in the window band
const frontCount = {};
for (const [key, c] of fp) {
  const [x, z] = key.split(",").map(Number);
  if (exposed(x, z, c.ground + 5).length === 0) continue;
  for (const d of exposed(x, z, c.ground + 5)) frontCount[d] = (frontCount[d] || 0) + 1;
}
const front = Object.entries(frontCount).sort((a, b) => b[1] - a[1])[0][0];

const placed = new Map();
const put = (x, y, z, block, state) => {
  if (y < 0 || y >= Y || x < 0 || x >= X || z < 0 || z >= Z) throw new Error(`out of the box at ${x},${y},${z}`);
  placed.set(`${x},${y},${z}`, { block, state });
};
const at = (x, y, z) => placed.get(`${x},${y},${z}`);
const isInterior = (x, y, z) => { const c = cellAt(x, z); return c && y >= c.ground && y < c.top - 1 && exposed(x, z, y).length === 0; };
// a bay of three along a face: a stone pier, then two columns of glazing
const pier = (u) => ((u % 3) + 3) % 3 === 0;

for (const [key, c] of [...fp].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
  const [x, z] = key.split(",").map(Number);
  const { ground: g, top } = c, cap = top - 1;
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");                  // foundation under the ground cell
  // the cap: a cornice on the envelope, a tar-sealed roof over the rooms
  put(x, cap, z, exposed(x, z, cap).length ? "smooth_stone" : "gray_concrete");
  for (let y = g; y < cap; y++) {
    const h = y - g, ex = exposed(x, z, y);
    if (ex.length === 0) {                                                    // rooms: air, with a floor slab per storey
      if (h === 0 || h === 4 || h === 8) put(x, y, z, "stone");
      continue;
    }
    const d = ex.includes(front) ? front : ex[0];
    const u = d === "north" || d === "south" ? x : z;
    const bay = pier(u);
    let block;
    if (h === 0) block = "stone_bricks";                                      // plinth course
    else if (h <= 2) block = bay ? "stone_bricks" : d === front ? "glass" : "glass_pane";   // shopfront / ground windows
    else if (h === 3) block = bay ? "stone_bricks" : "bricks";               // spandrel between the storeys
    else if (h === 4) block = "smooth_stone";                                 // storey line
    else if (h <= 6) block = bay ? "stone_bricks" : "glass_pane";             // upper windows
    else if (h === 7) block = bay ? "smooth_stone" : "bricks";
    else block = "bricks";
    put(x, y, z, block, block === "glass_pane" ? { waterlogged: "false" } : undefined);
  }
}

// the street door: the front bay nearest the middle of the front, with a surround, a dark-oak door and a lantern inside
const [dx, dz] = DIRS[front];
const frontCells = [...placed.entries()].filter(([key, v]) => {
  const [x, y, z] = key.split(",").map(Number); const c = cellAt(x, z);
  return c && y === c.ground && v.block === "stone_bricks" && exposed(x, z, y).includes(front);
}).map(([key]) => key.split(",").map(Number));
const uOf = ([x, , z]) => (front === "north" || front === "south" ? x : z);
const mid = frontCells.reduce((s, p) => s + uOf(p), 0) / frontCells.length;
const bays = frontCells.filter((p) => !pier(uOf(p)));
const [dxw, , dzw] = bays.reduce((best, p) => (Math.abs(uOf(p) - mid) < Math.abs(uOf(best) - mid) ? p : best), bays[0]);
const doorState = (half) => ({ facing: FACING[front], half, hinge: "left", open: "false", powered: "false", waterlogged: "false" });
put(dxw, cellAt(dxw, dzw).ground, dzw, "dark_oak_door", doorState("lower"));
put(dxw, cellAt(dxw, dzw).ground + 1, dzw, "dark_oak_door", doorState("upper"));
put(dxw, cellAt(dxw, dzw).ground + 2, dzw, "stone_bricks");            // door head, above the doorway
// the lantern hangs from the storey slab, inside behind the door
const ix = dxw - dx, iz = dzw - dz, ig = cellAt(ix, iz).ground;
put(ix, ig + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });

// warm lights: a glowstone on the first-floor slab behind some of the upper windows
for (const [key, v] of [...placed.entries()]) {
  const [x, y, z] = key.split(",").map(Number); const c = cellAt(x, z);
  if (!c || v.block !== "glass_pane" || y !== c.ground + 5) continue;
  const ex = exposed(x, z, y); if (!ex.length) continue;
  const u = ex.includes(front) ? (front === "north" || front === "south" ? x : z) : (ex[0] === "north" || ex[0] === "south" ? x : z);
  if (((u % 6) + 6) % 6 !== 2) continue;
  const inward = DIRS[ex[0]];
  const wx = x - inward[0], wz = z - inward[1];
  if (isInterior(wx, y, wz)) put(wx, y, wz, "glowstone");
}

// roof plant: two units on the flat roof of the wings, and a stair housing on the raised core
const cores = [...fp].filter(([, c]) => c.top === 10).map(([key]) => key.split(",").map(Number));
const coreCenter = cores.reduce((a, [x, z]) => [a[0] + x / cores.length, a[1] + z / cores.length], [0, 0]);
let housing = null;
for (const [x, z] of cores.sort((a, b) => Math.hypot(a[0] - coreCenter[0], a[1] - coreCenter[1]) - Math.hypot(b[0] - coreCenter[0], b[1] - coreCenter[1]))) {
  let ok = true;
  for (let dz2 = -1; dz2 <= 1 && ok; dz2++) for (let dx2 = -1; dx2 <= 1 && ok; dx2++) {
    const c = cellAt(x + dx2, z + dz2);
    if (!c || c.top !== 10 || exposed(x + dx2, z + dz2, 9).length) ok = false;
  }
  if (ok) { housing = [x, z]; break; }
}
if (housing) {
  const [hx, hz] = housing;
  for (let dz2 = -1; dz2 <= 1; dz2++) for (let dx2 = -1; dx2 <= 1; dx2++) {
    put(hx + dx2, 10, hz + dz2, "bricks"); put(hx + dx2, 11, hz + dz2, "bricks");
    put(hx + dx2, 12, hz + dz2, "smooth_stone");
  }
}
let units = 0;
for (const [key, c] of [...fp].sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true }))) {
  if (units >= 2) break;
  const [x, z] = key.split(",").map(Number);
  if (c.top !== 9 || housing && Math.abs(x - housing[0]) <= 2 && Math.abs(z - housing[1]) <= 2) continue;
  const cells4 = [[x, z], [x + 1, z], [x, z + 1], [x + 1, z + 1]];
  if (!cells4.every(([a, b]) => cellAt(a, b)?.top === 9 && !exposed(a, b, 8).length)) continue;
  for (const [a, b] of cells4) put(a, 9, b, "iron_block");
  units++;
}

// panes connect to what they touch along the wall, as vanilla does
for (const [key, v] of placed) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = key.split(",").map(Number);
  const solid = (a, b) => { const n = placed.get(`${a},${y},${b}`); return n && !["glowstone", "lantern"].includes(n.block); };
  const link = (a, b) => (solid(a, b) ? "true" : "false");
  v.state = { north: link(x, z - 1), south: link(x, z + 1), west: link(x - 1, z), east: link(x + 1, z), waterlogged: "false" };
}

const g = new Voxels([X, Y, Z]);
for (const [key, { block, state }] of placed) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317542.nbt";
const info = g.save(out);
console.log(`front ${front}, door at ${dxw},${dzw}, housing ${housing}, roof units ${units}`, info);
