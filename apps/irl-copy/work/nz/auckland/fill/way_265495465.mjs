// H47 Apartments: a 1970s reinforced-concrete apartment tower on Maungawhau's flank, 13 storeys of 4 blocks on a stone
// plinth. A white concrete frame with piers, dark tinted glass in ribbon bands and pale spandrels, roof decks with
// parapets, and a stepped crown: the outer ring stops at 28 (a planted terrace), the next band at 44, the core rises to
// the lidar's roof. Roof plant sits on the core, and the low east wings stop at 2 to 3 storeys. Floors and columns are
// solid; the interior between floors is air, so the glass has an air gap behind it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_265495465.cells.json`, "utf8"));
const X = 61, Y = 70, Z = 43;

const CONC = "white_concrete", SPAN = "light_gray_concrete", BASE = "polished_andesite", STONE = "stone_bricks";
const PANE = "gray_stained_glass_pane", GLOW = "glowstone", ROOF = "smooth_stone", PLANTER = "oak_leaves";
const DOOR = "dark_oak_door";
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const SHELL = new Set([CONC, SPAN, BASE, STONE, PANE, ROOF, DOOR]);   // what a pane's arm joins in its wall plane

// the footprint: lidar ground (g) and roof (r) per cell, both above y 0
const fp = Array.from({ length: Z }, () => Array(X).fill(null));
for (const [x, z, g, r] of cells) fp[z][x] = { g, r };
const inFp = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && fp[z][x] !== null;

// steps in from the outline (1 on the edge): the setbacks follow it
const dist = Array.from({ length: Z }, () => Array(X).fill(0));
const queue = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++)
  if (inFp(x, z) && N4.some(([dx, dz]) => !inFp(x + dx, z + dz))) { dist[z][x] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of N4) if (inFp(x + dx, z + dz) && !dist[z + dz][x + dx]) { dist[z + dz][x + dx] = dist[z][x] + 1; queue.push([x + dx, z + dz]); }
}

// the lidar roof smoothed by a 3x3 median, then to whole storeys (4 blocks); the outer rings are capped for the setbacks
const med = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) if (inFp(x + dx, z + dz)) v.push(fp[z + dz][x + dx].r);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const TOP = Array.from({ length: Z }, () => Array(X).fill(0));   // a cell's top: the roof deck is its top block
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x]) continue;
  const d = dist[z][x];
  const cap = d <= 2 ? 28 : d <= 5 ? 44 : Infinity;
  TOP[z][x] = Math.max(fp[z][x].g + 4, Math.min(cap, 4 * Math.floor((med(x, z) + 2) / 4), 56));
}
const top = (x, z) => TOP[z][x];

const m = new Map();     // "x,y,z" -> { b, s }
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, b, s = null) => m.set(key(x, y, z), { b, s });
const at = (x, y, z) => m.get(key(x, y, z));

// the sides of a cell at height y that face outside the building: off the outline, or beside a lower top
const outs = (x, y, z) => N4.filter(([dx, dz]) => !inFp(x + dx, z + dz) || y >= top(x + dx, z + dz));

// the entrance: the longest run of north-facing outline cells (lowest ground under the run's centre)
let run = null;
for (let z = 0; z < Z; z++) {
  let start = -1;
  for (let x = 0; x <= X; x++) {
    const on = x < X && inFp(x, z) && dist[z][x] === 1 && !inFp(x, z - 1);
    if (on && start < 0) start = x;
    if (!on && start >= 0) { if (!run || x - start > run.len) run = { z, x0: start, len: x - start }; start = -1; }
  }
}
const zE = run.z, xE = run.x0 + (run.len >> 1), yb = fp[zE][xE].g;

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x]) continue;
  const { g } = fp[z][x], t = top(x, z);
  for (let y = 0; y < g; y++) put(x, y, z, STONE);                          // foundation under the lidar ground
  for (let y = g; y < t; y++) {
    const ex = outs(x, y, z).length > 0;
    if (y === t - 1) { put(x, y, z, ROOF); continue; }                       // roof deck of the tier
    if (y === g && ex) { put(x, y, z, BASE); continue; }                     // base course
    if (y % 4 === 0) { put(x, y, z, CONC); continue; }                       // floor slab, every storey
    if (!ex) { if (x % 4 === 2 && z % 4 === 2) put(x, y, z, CONC); continue; }   // structural column; the rest is air
    const pier = (x + z) % 3 === 0, ground = y < 4;
    if (y % 4 === 3) put(x, y, z, SPAN);                                     // spandrel under each band
    else if (pier) put(x, y, z, ground ? STONE : CONC);
    else put(x, y, z, PANE);
  }
  if (outs(x, t, z).length) put(x, t, z, CONC);                             // parapet, or the edge of a setback
}

// planters on the terraces and the roofs (not on the parapet line)
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!fp[z][x] || dist[z][x] < 2 || outs(x, top(x, z), z).length || (x * 3 + z * 5) % 11 !== 0) continue;
  put(x, top(x, z), z, PLANTER, { distance: "7", persistent: "true", waterlogged: "false" });
}

// roof plant: a stone box on the core's flat roof, its walls stepped in from the core's edge
const core = [];
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) if (fp[z][x] && top(x, z) === 56 && dist[z][x] >= 8) core.push([x, z]);
if (core.length) {
  const cx = Math.round(core.reduce((s, [x]) => s + x, 0) / core.length), cz = Math.round(core.reduce((s, [, z]) => s + z, 0) / core.length);
  for (let z = cz - 3; z <= cz + 3; z++) for (let x = cx - 5; x <= cx + 5; x++) {
    if (!inFp(x, z) || top(x, z) !== 56 || dist[z][x] < 8) continue;
    const rim = Math.abs(x - cx) === 5 || Math.abs(z - cz) === 3;
    for (let y = 56; y < 58; y++) if (rim) put(x, y, z, STONE);
    put(x, 58, z, ROOF);
  }
}

// the lobby: stone pillars and plinth either side, lit glass, a door on the centre, a lintel and a canopy over
for (let dx = -2; dx <= 2; dx++) {
  const x = xE + dx;
  if (!inFp(x, zE)) continue;
  for (let y = 0; y < yb; y++) put(x, y, zE, STONE);
  if (Math.abs(dx) === 2) { for (let y = yb; y <= yb + 2; y++) put(x, y, zE, STONE); }
  else if (dx === 0) { put(x, yb + 2, zE, SPAN); }
  else { put(x, yb, zE, STONE); put(x, yb + 1, zE, PANE); put(x, yb + 2, zE, PANE); }
  put(x, yb + 3, zE, ROOF);                                                  // canopy over the bay
}
put(xE, yb, zE, DOOR, { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
put(xE, yb + 1, zE, DOOR, { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });

// pane arms join the wall (frame, piers, other panes in their plane); glow goes in after, so it does not join
for (const [k, v] of [...m]) {
  if (v.b !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  const arm = (dx, dz) => { const n = at(x + dx, y, z + dz); return !!n && SHELL.has(n.b); };
  const s = { east: arm(1, 0), west: arm(-1, 0), north: arm(0, -1), south: arm(0, 1), waterlogged: false };
  v.s = Object.fromEntries(Object.entries(s).map(([a, b]) => [a, String(b)]));
}

// warm light behind some windows, one block in from the glass on the room side (only in air, on a slab or a column)
for (const [k, v] of [...m]) {
  if (v.b !== PANE) continue;
  const [x, y, z] = k.split(",").map(Number);
  if (y % 4 === 0 || y % 4 === 3 || (x * 13 + z * 7 + y * 5) % 9 !== 0) continue;
  const out = outs(x, y, z);
  if (out.length !== 1) continue;
  const ix = x - out[0][0], iz = z - out[0][1];
  if (inFp(ix, iz) && !at(ix, y, iz)) put(ix, y, iz, GLOW);
}
// the lobby lights, inside the glass
for (const dx of [-1, 1]) if (!at(xE + dx, yb + 1, zE + 1)) put(xE + dx, yb + 1, zE + 1, GLOW);

const g = new Voxels([X, Y, Z]);
let panes = 0, lights = 0;
for (const [k, v] of m) {
  const [x, y, z] = k.split(",").map(Number);
  if (v.b === PANE) panes++;
  if (v.b === GLOW) lights++;
  g.set(x, y, z, v.b, v.s);
}
const out = `${FILL}/way_265495465.nbt`;
const info = g.save(out);
console.log(JSON.stringify({ written: out, ...info, panes, lights, entrance: [xE, zE], bay: yb, maxTop: Math.max(...TOP.flat()) }));
