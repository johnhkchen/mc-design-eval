// Way 1343431895, Mt Eden view: a 1980s office block on a concrete podium, an 11-storey glazed tower on its
// western edge, lower wings and roof terraces. Massing = the lidar roof rounded up to whole 4-block storeys on each
// cell's own ground line (so downhill cells show more storeys). The facade is a one-cell ring: piers, spandrels,
// glass panes, doors on the street, lamps behind some windows. Interior is floor slabs and air, no rooms.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const SRC = `${FILL}/way_1343431895.cells.json`;
const OUT = `${FILL}/way_1343431895.nbt`;
const SIZE = [92, 56, 98];
const STOREY = 4;

const cells = JSON.parse(readFileSync(SRC, "utf8"));
// lidar noise: a 5x5 median of the roof heights over the footprint strips out one- and two-cell spikes
let roofAt = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
for (let pass = 0; pass < 2; pass++) {
  const next = new Map();
  for (const [key, r0] of roofAt) {
    const [x, z] = key.split(",").map(Number), near = [];
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
      const r = roofAt.get(`${x + dx},${z + dz}`); if (r !== undefined) near.push(r);
    }
    near.sort((a, b) => a - b);
    next.set(key, near[Math.floor(near.length / 2)]);
  }
  roofAt = next;
}
// a tall cell with fewer than three tall neighbours is a sliver, not a tower: it takes its neighbours' lower roof
const tall = (r) => r >= 25;
const sliver = new Map();
for (const [key, r] of roofAt) {
  if (!tall(r)) continue;
  const [x, z] = key.split(",").map(Number);
  let talls = 0, lows = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    if (!dx && !dz) continue;
    const nr = roofAt.get(`${x + dx},${z + dz}`); if (nr === undefined) continue;
    if (tall(nr)) talls++; else lows.push(nr);
  }
  if (talls < 3) sliver.set(key, lows.length ? lows.reduce((a, b) => a + b) / lows.length : 17);
}
for (const [key, r] of sliver) roofAt.set(key, r);
const byXZ = new Map();
for (const [x, z, g] of cells) {
  const r = roofAt.get(`${x},${z}`);
  const n = Math.max(0, Math.ceil((r - g) / STOREY));     // whole storeys from this cell's ground up to the smoothed roof
  byXZ.set(`${x},${z}`, { x, z, g, n, top: g + n * STOREY });
}
const cellAt = (x, z) => byXZ.get(`${x},${z}`);
const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];
const FULL = new Set(["white_concrete", "light_gray_concrete", "gray_concrete", "polished_granite", "smooth_stone",
  "smooth_quartz", "stone_bricks", "iron_block", "glowstone", "moss_block"]);
const bare = (b) => b.replace("minecraft:", "");
const isPane = (b) => bare(b).endsWith("_stained_glass_pane");

// the faces of a cell that look out at layer y: off the footprint, or beside a neighbour with no storey at y
function faces(c, y) {
  const out = [];
  for (const [dx, dz, name] of DIRS) {
    const nb = cellAt(c.x + dx, c.z + dz);
    if (!nb) out.push({ dx, dz, name, outside: true });
    else if (y >= nb.top) out.push({ dx, dz, name, outside: false });
  }
  return out;
}

const g = new Voxels(SIZE);
const panes = [];      // [x, y, z, block] to connect once every neighbour is placed
const windows = [];    // facade glass at floor level, for the lamps behind it
const count = { door: 0, lamp: 0, pane: 0, penthouse: 0, hvac: 0, planter: 0, parapet: 0 };

// entrances: a few ground-floor street cells that are not piers, one door per entrance
for (const c of byXZ.values()) {
  c.door = null;
  if (c.n === 0 || (c.x * 5 + c.z * 7) % 29 !== 0 || (c.x + c.z) % 3 === 0) continue;
  const ex = faces(c, c.g + 1);
  const out = ex.find((f) => f.outside);
  if (out && ex.length === 1) c.door = out.name;
}

function place(c, y) {
  if (y < c.g) {                                           // foundation: solid from 0 up to the cell's ground
    if (c.n === 0 && y === c.g - 1) return g.set(c.x, y, c.z, "smooth_stone");   // a paved plaza, no storeys
    return g.set(c.x, y, c.z, "stone_bricks");
  }
  const ex = faces(c, y);
  if (y === c.top - 1) return g.set(c.x, y, c.z, ex.length ? "smooth_quartz" : "gray_concrete");   // cornice / roof membrane
  const k = Math.floor((y - c.g) / STOREY), o = (y - c.g) % STOREY;
  if (!ex.length) { if (o === 0) g.set(c.x, y, c.z, "light_gray_concrete"); return; }           // floor slab or air
  if (o === 0) return g.set(c.x, y, c.z, k === 0 ? "polished_granite" : "light_gray_concrete"); // base course / sill
  if (o === 3) return g.set(c.x, y, c.z, k === 0 ? "smooth_stone" : "light_gray_concrete");     // fascia / head
  if (ex.length >= 2 || (c.x + c.z) % 3 === 0) return g.set(c.x, y, c.z, "white_concrete");     // pier, corners too
  const outward = ex.find((f) => f.outside);
  if (k === 0 && c.door && outward && outward.name === c.door) {
    count.door++;
    return g.set(c.x, y, c.z, "iron_door", {
      facing: c.door, half: o === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
    });
  }
  const glass = c.top >= 29 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane";   // tower glazing is darker
  g.set(c.x, y, c.z, glass);
  panes.push([c.x, y, c.z, glass]); count.pane++;
  if (o === 1) {
    const f = ex[0];
    windows.push({ x: c.x, y, z: c.z, k, dx: f.dx, dz: f.dz });
  }
}

for (const c of byXZ.values()) {
  for (let y = 0; y < c.top; y++) place(c, y);
  if (c.n === 0) continue;
  // roof: parapet crenels on the outside edge, plant on the roof, a penthouse on the tower
  const roof = faces(c, c.top - 1);
  if (roof.some((f) => f.outside) && (c.x + c.z) % 2 === 0) { g.set(c.x, c.top, c.z, "white_concrete"); count.parapet++; }
  if (roof.length) continue;
  if (c.n >= 10 && c.x % 6 === 2 && c.z % 6 === 2) {
    for (let y = c.top; y < c.top + 3; y++) g.set(c.x, y, c.z, "light_gray_concrete");
    count.penthouse++;
  } else if (c.n <= 4 && (c.x * 3 + c.z * 7) % 19 === 0) {
    g.set(c.x, c.top, c.z, "iron_block"); count.hvac++;
  } else if (c.n <= 4 && (c.x + c.z * 2) % 13 === 0) {
    g.set(c.x, c.top, c.z, "moss_block"); count.planter++;
  }
}

// lit windows: a lamp on the floor just inside some glass (glowstone on the shopfront, lanterns above)
for (const w of windows) {
  if ((w.x * 3 + w.z * 5 + w.k) % 4 !== 0) continue;
  const ic = cellAt(w.x - w.dx, w.z - w.dz);
  if (!ic || ic.g > w.y || ic.top <= w.y || faces(ic, w.y).length) continue;
  if (g.get(ic.x, w.y, ic.z) || !g.get(ic.x, w.y - 1, ic.z)) continue;
  if (w.k === 0) g.set(ic.x, w.y, ic.z, "glowstone");
  else g.set(ic.x, w.y, ic.z, "lantern", { hanging: "false", waterlogged: "false" });
  count.lamp++;
}

// glass panes join their neighbours in the wall plane (panes, piers, spandrels), as the game draws them
for (const [x, y, z, block] of panes) {
  const state = { waterlogged: "false" };
  for (const [dx, dz, name] of DIRS) {
    const nb = g.get(x + dx, y, z + dz);
    state[name] = nb && (isPane(nb.block) || FULL.has(bare(nb.block))) ? "true" : "false";
  }
  g.set(x, y, z, block, state);
}

// nothing floats: every block must be reachable from the ground through blocks
const [X, Y, Z] = SIZE;
const seen = new Uint8Array(X * Y * Z), idx = (x, y, z) => (z * Y + y) * X + x;
const stack = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (g.val(x, 0, z)) { seen[idx(x, 0, z)] = 1; stack.push([x, 0, z]); }
while (stack.length) {
  const [x, y, z] = stack.pop();
  for (const [dx, dy, dz] of [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]]) {
    const a = x + dx, b = y + dy, c = z + dz;
    if (a < 0 || b < 0 || c < 0 || a >= X || b >= Y || c >= Z || seen[idx(a, b, c)] || !g.val(a, b, c)) continue;
    seen[idx(a, b, c)] = 1; stack.push([a, b, c]);
  }
}
let floating = 0;
for (let z = 0; z < Z; z++) for (let y = 0; y < Y; y++) for (let x = 0; x < X; x++) if (g.val(x, y, z) && !seen[idx(x, y, z)]) floating++;

const res = g.save(OUT);
console.log(JSON.stringify({ footprint: byXZ.size, blocks: res.blocks, palette: res.palette, floating, count }));
