// A 1970s-80s concrete office block over ground-floor shops (Newton / Eden Terrace fringe): a light-grey concrete frame,
// white string courses, dark-framed tinted glazing set one block back, a dark andesite plinth, and a stepped roof on the
// lidar's storey tiers. Solid core, so every storey and tier stands on what is below it.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020927.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_293020927.nbt";
const W = 33, D = 24, H = 51;
const TIER_MIN = 24, TIER_MAX = 40;                       // 6 to 10 storeys of 4 blocks

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const key2 = (x, z) => `${x},${z}`;
const F = new Map();
for (const [x, z, g, r] of cells) F.set(key2(x, z), { x, z, g, r });
const at = (x, z) => F.get(key2(x, z));
const NB = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const cellsList = [...F.values()];

// Tiers: the lidar roof rounded to whole 4-block storeys, then one majority pass over each cell and its footprint neighbours
for (const c of cellsList) c.t0 = 4 * Math.round(c.r / 4);
for (const c of cellsList) {
  const cnt = new Map();
  for (const n of [c, ...NB.map(([dx, dz]) => at(c.x + dx, c.z + dz)).filter(Boolean)]) cnt.set(n.t0, (cnt.get(n.t0) || 0) + 1);
  let best = c.t0, bestN = cnt.get(c.t0);
  for (const [t, n] of cnt) if (n > bestN) { best = t; bestN = n; }
  c.t = Math.min(TIER_MAX, Math.max(TIER_MIN, best));
}

// Shell depth: d = 1 on the outer ring, growing inward; the outward face of a ring cell is its first missing neighbour
let frontier = [];
for (const c of cellsList) {
  const out = NB.find(([dx, dz]) => !at(c.x + dx, c.z + dz));
  if (out) { c.d = 1; c.o = out; frontier.push(c); }
}
while (frontier.length) {
  const next = [];
  for (const c of frontier) for (const [dx, dz] of NB) { const n = at(c.x + dx, c.z + dz); if (n && !n.d) { n.d = c.d + 1; next.push(n); } }
  frontier = next;
}
for (const c of cellsList) c.d ??= 99;

const M = new Map();                                      // "x,y,z" -> [block, state]; "air" clears a cell
const put = (x, y, z, b, s = null) => M.set(`${x},${y},${z}`, [b, s]);
const LIGHT = "light_gray_concrete", GLASS = "light_blue_stained_glass", FRAME = "gray_concrete";
const WINDOW = "@window", FASCIA = "gray_concrete";

// 1. Solid core and the outer skin, column by column up to each cell's tier
for (const c of cellsList) {
  for (let y = 0; y < c.t; y++) {
    let b = LIGHT, s = null;
    if (y === c.t - 1) b = c.d === 1 ? "stone_bricks" : "smooth_stone";            // parapet on the outer ring, roof surface inside
    else if (c.d === 1) {
      const k = Math.floor(y / 4), m = y % 4, along = c.o[0] === 0 ? c.x : c.z;   // N/S faces run along x, E/W along z
      if (y < c.g || y === 0) b = "polished_andesite";                             // plinth
      else if (m === 3) b = k === 0 ? FASCIA : "white_concrete";                  // string course / shop fascia
      else if (m === 1 || m === 2) b = along % 3 === 0 ? FRAME : WINDOW;          // glazing bay, every third a frame
    }
    put(c.x, y, c.z, b, s);
  }
}

// 2. Windows: outer cell air (recess), glass one back, an air gap behind it, a warm lamp in some gaps
for (const c of cellsList) {
  if (c.d !== 1) continue;
  const [ox, oz] = c.o;
  const inner = at(c.x - ox, c.z - oz), gap = at(c.x - 2 * ox, c.z - 2 * oz);
  const hasWindow = inner && inner.d >= 2;
  for (let y = 0; y < c.t - 1; y++) {
    if (M.get(`${c.x},${y},${c.z}`)?.[0] !== WINDOW) continue;
    const k = Math.floor(y / 4);
    if (!hasWindow || y < c.g) { put(c.x, y, c.z, LIGHT); continue; }
    const lit = k === 0 ? (c.x + c.z) % 2 === 0 : (c.x * 31 + c.z * 17 + k * 11) % 7 === 0;
    put(c.x, y, c.z, "air");
    if (y >= inner.g && y < inner.t) put(inner.x, y, inner.z, GLASS);
    if (gap && y >= gap.g && y < gap.t) put(gap.x, y, gap.z, lit ? "glowstone" : "air");
  }
}

// 3. Entrance: the longest run of outer cells sharing one outward face; the middle cell is the door, with a canopy
const groups = new Map();
for (const c of cellsList) {
  if (c.d !== 1 || !c.o) continue;
  const line = c.o[0] === 0 ? c.z : c.x, along = c.o[0] === 0 ? c.x : c.z;
  const gk = `${c.o[2]}:${line}`;
  if (!groups.has(gk)) groups.set(gk, []);
  groups.get(gk).push({ c, along });
}
let run = [];
for (const g of groups.values()) {
  g.sort((a, b) => a.along - b.along);
  let cur = [];
  for (const e of g) {
    if (cur.length && e.along !== cur[cur.length - 1].along + 1) { if (cur.length > run.length) run = cur; cur = []; }
    cur.push(e);
  }
  if (cur.length > run.length) run = cur;
}
const door = run[Math.floor(run.length / 2)].c;
const doorY = Math.max(door.g, 1), [dox, doz] = door.o;
const doorFacing = door.o[2];
for (const e of [run[Math.floor(run.length / 2) - 1], run[Math.floor(run.length / 2) + 1]].filter(Boolean)) {
  put(e.c.x, 3, e.c.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });                      // canopy
  put(e.c.x, 2, e.c.z, "lantern", { hanging: "true", waterlogged: "false" });                           // lanterns under it
}
put(door.x, 3, door.z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
const inner = at(door.x - dox, door.z - doz);
for (let y = doorY; y <= doorY + 1; y++) if (inner) put(inner.x, y, inner.z, "air");
const doorState = (half) => ({ facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
put(door.x, doorY, door.z, "dark_oak_door", doorState("lower"));
put(door.x, doorY + 1, door.z, "dark_oak_door", doorState("upper"));

// 4. Roof: a plant box on the highest tier with lanterns on its corners, and a mast with a red aviation lamp on the tallest roof
const cx = W / 2, cz = D / 2;
let box = null, boxScore = -Infinity;
for (const c of cellsList) {
  if (c.t < 32) continue;
  for (const [bw, bd] of [[3, 2], [2, 3]]) {
    const cs = [];
    for (let dx = 0; dx < bw; dx++) for (let dz = 0; dz < bd; dz++) cs.push(at(c.x + dx, c.z + dz));
    if (cs.some((n) => !n || n.d < 3 || n.t !== c.t)) continue;
    const score = c.t * 1000 - Math.hypot(c.x + bw / 2 - cx, c.z + bd / 2 - cz);
    if (score > boxScore) { boxScore = score; box = { x0: c.x, z0: c.z, bw, bd, t: c.t }; }
  }
}
if (box) {
  for (let dx = 0; dx < box.bw; dx++) for (let dz = 0; dz < box.bd; dz++)
    for (let y = box.t; y < box.t + 2; y++) put(box.x0 + dx, y, box.z0 + dz, LIGHT);
  for (const [dx, dz] of [[0, 0], [box.bw - 1, 0], [0, box.bd - 1], [box.bw - 1, box.bd - 1]])
    put(box.x0 + dx, box.t + 2, box.z0 + dz, "lantern", { hanging: "false", waterlogged: "false" });
}
const top = Math.max(...cellsList.map((c) => c.t));
let mast = null, mastScore = -Infinity;
for (const c of cellsList) {
  if (c.t !== top || c.d < 3) continue;
  if (box && c.x >= box.x0 - 1 && c.x <= box.x0 + box.bw && c.z >= box.z0 - 1 && c.z <= box.z0 + box.bd) continue;
  const score = -Math.hypot(c.x - cx, c.z - cz);
  if (score > mastScore) { mastScore = score; mast = c; }
}
if (mast) {
  for (let y = top; y < top + 8; y++) put(mast.x, y, mast.z, "iron_bars");
  put(mast.x, top + 8, mast.z, "redstone_lamp", { lit: "true" });
}

// Apply: nothing outside the footprint is ever written; the save streams only the filled cells
const g = new Voxels([W, H, D]);
for (const [k, [b, s]] of M) {
  const [x, y, z] = k.split(",").map(Number);
  if (!F.has(key2(x, z))) continue;
  g.set(x, y, z, b, s ?? undefined);
}
const res = g.save(OUT);
console.log(`way_293020927: ${res.blocks} blocks, ${res.palette} palette entries, tiers ${[...new Set(cellsList.map((c) => c.t))].join("/")}, door ${door.x},${door.z}`);
