// A 1970s-80s Auckland office block on a diagonal strip footprint: volcanic andesite plinth, a shopfront ground
// floor, cyan tinted glazing in precast-concrete piers and spandrels, a tower on a four-storey podium with setbacks.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_439261515.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_439261515.nbt";
const cells = JSON.parse(readFileSync(CELLS, "utf8"));   // [x, z, ground, roof] per footprint cell

const X = 122, Y = 46, Z = 61;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;

const cell = new Map();
for (const [x, z, ground, roof] of cells) cell.set(key(x, z), { x, z, g: ground, r: roof });
const at = (x, z) => cell.get(key(x, z));

// 1. lidar noise out: the roof is the mean over the footprint cells within two cells of it (a spike of one cell
// is a sliver of a tier, not a tower of its own)
for (const c of cell.values()) {
  let sum = 0, cnt = 0;
  for (let dx = -2; dx <= 2; dx++) for (let dz = -2; dz <= 2; dz++) { const n = at(c.x + dx, c.z + dz); if (n) { sum += n.r; cnt++; } }
  c.rs = sum / cnt;
}

// 2. distance in from the outline: 0 = the facade ring, 1 = the first room in, and so on
const queue = [];
for (const c of cell.values()) {
  const edge = NB.some(([dx, dz]) => !at(c.x + dx, c.z + dz));
  c.d = edge ? 0 : -1;
  if (edge) queue.push(c);
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of NB) {
    const n = at(c.x + dx, c.z + dz);
    if (n && n.d < 0) { n.d = c.d + 1; queue.push(n); }
  }
}

// 3. storeys: 4 blocks each, counted up from the cell's own ground to its smoothed roof; the tower's facade ring
// stops at four storeys (the podium) and the next ring in at six (the first setback)
for (const c of cell.values()) {
  let n = Math.max(1, Math.round((c.rs - c.g) / 4));
  if (c.d === 0 && n > 4) n = 4;
  else if (c.d === 1 && n > 6) n = 6;
  c.n = n;
  c.top = c.g + 4 * n;
}

// 4. the massing: placements keyed by position, applied at the end so later passes can overwrite earlier ones
const P = new Map();
const put = (x, y, z, block, state) => P.set(`${x},${y},${z}`, [x, y, z, block, state]);
const PANE = { north: "true", south: "true", east: "true", west: "true", waterlogged: "false" };
const SHOP = "light_blue_stained_glass_pane", GLASS = "cyan_stained_glass_pane";
const PIER = "light_gray_concrete", SPANDREL = "gray_concrete";
const pockets = [];

for (const c of cell.values()) {
  const { x, z, g, n, top, d } = c;
  for (let y = 0; y < g; y++) put(x, y, z, "polished_andesite");            // volcanic plinth on the slope
  for (let k = 0; k < n; k++) {
    const y0 = g + 4 * k, ground = k === 0;
    for (let j = 0; j < 4; j++) {
      const y = y0 + j;
      if (d !== 0) {                                                        // solid core: every storey stands on the one below
        put(x, y, z, y === top - 1 ? "gray_concrete" : PIER);               // roof membrane on the top row
        continue;
      }
      if (j === 0) put(x, y, z, ground ? "polished_andesite" : "white_concrete");   // base course, then storey lines
      else if (j === 3) put(x, y, z, ground ? "stone_bricks" : PIER);     // shop fascia / spandrel
      else if ((x + z) % 3 === 0) put(x, y, z, PIER);                      // mullion
      else put(x, y, z, ground ? SHOP : GLASS, PANE);                       // glazing
    }
  }
  if (d === 0) put(x, top, z, "smooth_stone");                              // cornice / parapet
}

// 5. an air gap behind every glazed bay (or a lit lamp, one bay in nine) and the entrances
for (const c of cell.values()) {
  if (c.d !== 0) continue;
  for (let k = 0; k < c.n; k++) for (let j = 1; j <= 2; j++) {
    const y = c.g + 4 * k + j;
    if ((c.x + c.z) % 3 === 0) continue;
    for (const [dx, dz] of NB) {
      const n = at(c.x + dx, c.z + dz);
      if (n && n.d === 1) pockets.push([n.x, y, n.z, k, j]);
    }
  }
}
for (const [x, y, z, , j] of pockets) {
  const lamp = j === 1 && (x * 31 + z * 17 + y * 7) % 9 === 0;
  if (lamp) put(x, y, z, "glowstone"); else put(x, y, z, "air");
}

const ground0 = [...cell.values()].filter((c) => c.d === 0 && c.n >= 1).sort((a, b) => a.x - b.x || a.z - b.z);
const doorAt = [0.2, 0.55, 0.85].map((f) => ground0[Math.floor(ground0.length * f)]);
for (const c of doorAt) {
  const dx = { facing: "south", hinge: "left", open: "false", powered: "false" };
  put(c.x, c.g + 1, c.z, "oak_door", { ...dx, half: "lower" });
  put(c.x, c.g + 2, c.z, "oak_door", { ...dx, half: "upper" });
  for (const [ox, oz] of [[0, 0], ...NB]) {                                 // a timber canopy band over the door and its neighbours
    const n = at(c.x + ox, c.z + oz);
    if (n && n.d === 0) put(n.x, n.g + 3, n.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 6. roof kit: plant units on the interior roofs, and a mast on the tallest
let tallest = null;
for (const c of cell.values()) {
  if (c.d >= 1 && (!tallest || c.top > tallest.top)) tallest = c;
  if (c.d >= 1 && (c.x * 5 + c.z * 3) % 17 === 0) put(c.x, c.top, c.z, "iron_block");
}
if (tallest) for (let y = tallest.top; y < tallest.top + 4; y++) put(tallest.x, y, tallest.z, "iron_bars");

// 7. write it
const g = new Voxels([X, Y, Z]);
for (const [x, y, z, block, state] of P.values()) {
  if (x < 0 || y < 0 || z < 0 || x >= X || y >= Y || z >= Z) throw new Error(`out of the box at ${x},${y},${z}`);
  g.set(x, y, z, block, state);
}

// a check: nothing hangs. A solid block stands on something solid below it, or it is the lintel over an air gap
// (a window reveal: its own storey ceiling, carried by the solid on either side of the gap)
const solid = (x, y, z) => g.get(x, y, z) !== null;
let hanging = 0, lintels = 0, maxTop = 0;
for (const [x, y, z, block] of P.values()) {
  if (block === "air") continue;
  if (y > maxTop) maxTop = y;
  if (y === 0 || solid(x, y - 1, z)) continue;
  const side = [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => solid(x + dx, y, z + dz) && solid(x + dx, y - 1, z + dz));
  if (side) lintels++; else hanging++;
}
const saved = g.save(OUT);
console.log(JSON.stringify({ cells: cell.size, hanging, lintels, highest: maxTop, ...saved }));
