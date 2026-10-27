// Way 326706215: a 1930s-50s brick commercial block on the Mt Eden slope. Four-storey brick over a basalt base,
// white concrete string courses and cornice, glazed shopfronts on the downhill ground storey, a recessed entrance,
// a stepped massing (wings at 18, a setback core tower at 22) from the lidar roof, a roof terrace and plant on top.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_326706215.cells.json`, "utf8"));   // [x, z, ground, roof]
const g = new Voxels([45, 33, 41]);

const WING = 18, TOP = 22, SETBACK = 3;          // lidar roof 17..21 snapped to two flat tiers
const SIDES = [[0, 1, "south"], [0, -1, "north"], [1, 0, "east"], [-1, 0, "west"]];
const key = (x, z) => `${x},${z}`;
const plan = new Map();
for (const [x, z, ground, roof] of cells) plan.set(key(x, z), { x, z, g: ground, lidar: roof });
const cell = (x, z) => plan.get(key(x, z));

// 1. Massing: 5x5 mean of the lidar roof, core = mean >= 20; the tower's top is set back SETBACK cells from its edge
for (const c of plan.values()) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = cell(c.x + dx, c.z + dz); if (o) { s += o.lidar; n++; } }
  c.core = s / n >= 20;
}
const dist = new Map(), queue = [];
for (const c of plan.values()) {
  const edge = SIDES.some(([dx, dz]) => !cell(c.x + dx, c.z + dz));
  if (!c.core || edge) { dist.set(c, 0); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of SIDES) { const n = cell(c.x + dx, c.z + dz); if (n && !dist.has(n)) { dist.set(n, dist.get(c) + 1); queue.push(n); } }
}
for (const c of plan.values()) {
  c.R = c.core && (dist.get(c) ?? 0) >= SETBACK ? TOP : WING;   // solid up to R-1; R is the roof surface
  c.S0 = c.g <= 3 ? 6 : 10;                                    // top of the street storey; upper floor lines every 4 from S0
  c.wall = SIDES.some(([dx, dz]) => { const n = cell(c.x + dx, c.z + dz); return !n || n.R < c.R; });
}

// the faces of a wall cell that are open to air at height y: outside the footprint, or above a lower neighbour's roof
const faces = (c, y) => {
  const out = [], step = [];
  for (const [dx, dz, name] of SIDES) {
    const n = cell(c.x + dx, c.z + dz);
    if (!n) out.push([dx, dz, name]);
    else if (n.R < c.R && y >= n.R) step.push([dx, dz, name]);
  }
  return out[0] ?? step[0] ?? null;
};

// 2. Columns: solid from 0 to the ground, a hollow shell above with floor slabs; the wall ring carries the facade
const blk = new Map();
const put = (x, y, z, name, state) => blk.set(`${x},${y},${z}`, { name, state });
const has = (x, y, z) => blk.has(`${x},${y},${z}`);
const key3 = (x, y, z) => `${x},${y},${z}`;
const glass = new Map();     // cell key -> the face it looks out of
const lights = [];
for (const c of plan.values()) {
  const { x, z, g: G, R, S0 } = c;
  for (let y = 0; y < R; y++) {
    if (y === 0 || y < G) { put(x, y, z, "polished_andesite"); continue; }
    const slab = y >= S0 && (y - S0) % 4 === 0;                      // a storey line: floor slab, or string course on the wall
    if (!c.wall) { if (slab || y === R - 1) put(x, y, z, "smooth_stone"); continue; }   // interior: floors and roof only
    if (y === R - 1) { put(x, y, z, "white_concrete"); continue; }    // cornice
    const face = faces(c, y);
    const t = face && face[1] !== 0 ? x : z;                         // position along the face
    const win = face !== null && t % 3 !== 0;                        // two windows, then a pier
    if (y < S0) {                                                     // street storey: shopfront
      if (y === G) put(x, y, z, "polished_andesite");                 // base course
      else if (y === S0 - 1) put(x, y, z, "white_concrete");          // fascia
      else if (win) { put(x, y, z, "glass_pane"); glass.set(key3(x, y, z), face); }
      else put(x, y, z, "white_concrete");                            // shopfront pier, apart from the basalt foundation
    } else {
      const o = (y - S0) % 4;                                         // 0 string, 1-2 windows, 3 brick lintel
      if (o === 0) put(x, y, z, "white_concrete");
      else if (o === 3 || !win) put(x, y, z, "bricks");
      else { put(x, y, z, "glass_pane"); glass.set(key3(x, y, z), face); }
      if (win && o === 1 && (x + 2 * z + y) % 7 === 0) lights.push({ x, y, z, face, kind: "glowstone" });
    }
  }
  // the parapet tops the open edge of the footprint
  if (SIDES.some(([dx, dz]) => !cell(x + dx, z + dz))) put(x, R, z, "bricks");
}
// warm light in the room behind some windows: glowstone up in the storeys, lanterns standing on the street floor
for (const l of lights) {
  const ix = l.x - l.face[0], iz = l.z - l.face[1], n = cell(ix, iz);
  if (!n || n.wall || l.y >= n.R - 1 || l.y <= n.g || has(ix, l.y, iz)) continue;
  if (has(ix, l.y - 1, iz)) put(ix, l.y, iz, l.kind);
}
for (const [k, face] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  if (y >= 6 || (x * 3 + z * 5) % 4 !== 0) continue;
  const ix = x - face[0], iz = z - face[1], n = cell(ix, iz);
  if (n && !n.wall && y < n.R - 1 && y > n.g && has(ix, y - 1, iz) && !has(ix, y, iz)) put(ix, y, iz, "lantern", { hanging: "false", waterlogged: "false" });
}

// 3. Entrance: a recessed bay on the south face, the lowest street-level cell nearest the middle
const bay = [...plan.values()]
  .filter(c => !cell(c.x, c.z + 1) && cell(c.x - 1, c.z) && cell(c.x + 1, c.z) && !cell(c.x - 1, c.z + 1) && !cell(c.x + 1, c.z + 1))
  .sort((a, b) => a.g - b.g || Math.abs(a.x - 22) - Math.abs(b.x - 22))[0];
if (bay) {
  const { x: ex, z: ez, g: eg } = bay, yB = eg + 1;
  for (const tx of [ex - 1, ex, ex + 1]) for (let y = yB; y <= yB + 2; y++) put(tx, y, ez, tx === ex ? "polished_andesite" : "white_concrete");
  put(ex, yB, ez, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, yB + 1, ez, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  const inner = cell(ex, ez - 1);
  if (inner && !inner.wall) {
    put(ex, yB + 2, ez - 1, "polished_andesite");
    put(ex, yB + 1, ez - 1, "lantern", { hanging: "true", waterlogged: "false" });
  }
}

// 4. Roof: two plant units on the wing roof, a plant house with a cap on the tower roof
const wingRoof = [...plan.values()].filter(c => c.R === WING && !c.wall && (dist.get(c) ?? 0) >= 2)
  .sort((a, b) => a.z - b.z || a.x - b.x);
const used = new Set(), units = [];
for (const c of wingRoof) {
  if (units.length >= 2) break;
  const block = [[0, 0], [1, 0], [0, 1], [1, 1]].map(([dx, dz]) => `${c.x + dx},${c.z + dz}`);
  const ok = block.every(k => { const [x, z] = k.split(",").map(Number); const n = cell(x, z); return n && n.R === WING && !n.wall && !used.has(k); });
  if (!ok || c.x % 5 !== 0) continue;
  block.forEach(k => used.add(k));
  for (const k of block) { const [x, z] = k.split(",").map(Number); put(x, WING, z, "light_gray_concrete"); put(x, WING + 1, z, "light_gray_concrete"); }
  units.push(c);
}
const topCells = [...plan.values()].filter(c => c.R === TOP && !c.wall);
const tx = topCells.map(c => c.x), tz = topCells.map(c => c.z);
const cx = Math.round(tx.reduce((a, b) => a + b, 0) / tx.length), cz = Math.round(tz.reduce((a, b) => a + b, 0) / tz.length);
for (let dx = -2; dx <= 1; dx++) for (let dz = -2; dz <= 1; dz++) {
  const n = cell(cx + dx, cz + dz);
  if (!n || n.R !== TOP || n.wall) continue;
  put(cx + dx, TOP, cz + dz, "bricks"); put(cx + dx, TOP + 1, cz + dz, "bricks");
}
for (let dx = -2; dx <= 1; dx++) for (let dz = -2; dz <= 1; dz++) {
  if (blk.has(`${cx + dx},${TOP},${cz + dz}`)) put(cx + dx, TOP + 2, cz + dz, "white_concrete");
}

// 5. Glass panes connect along their own wall, to whatever is beside them
for (const [k, face] of glass) {
  const [x, y, z] = k.split(",").map(Number);
  const along = face[1] !== 0 ? [[1, 0, "east"], [-1, 0, "west"]] : [[0, 1, "south"], [0, -1, "north"]];
  const state = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
  for (const [dx, dz, name] of along) state[name] = blk.has(`${x + dx},${y},${z + dz}`) ? "true" : "false";
  put(x, y, z, "glass_pane", state);
}

for (const [k, v] of blk) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.name, v.state);
}
const stats = g.save(`${DIR}/way_326706215.nbt`);
console.log(`cells ${plan.size}, wall ${[...plan.values()].filter(c => c.wall).length}, tower ${topCells.length} cols, wing units ${units.length}, entrance at x${bay?.x} z${bay?.z}`, stats);
