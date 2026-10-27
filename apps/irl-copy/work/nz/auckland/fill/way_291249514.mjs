// Way 291249514: a 41 x 55 block 1970s-80s concrete office block on a volcanic (basalt) base, Auckland CBD edge.
// Footprint cells stand from their ground g up to a roof top T, tiered from the lidar roof (median over the
// 4-neighbours, quantised to whole 4-block storeys). Floor slabs at every storey line, a window grid on the shell,
// hollow storeys with a concrete column grid, shopfronts and an entrance canopy at street level.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_291249514.cells.json`, "utf8"));   // [x, z, ground, roof] per cell
const SIZE = [41, 33, 55];
const STOREY = 4;
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const FACING = { "1,0": "east", "-1,0": "west", "0,1": "south", "0,-1": "north" };
const k2 = (x, z) => `${x},${z}`;
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[s.length >> 1]; };

// per footprint cell: ground g and the top T of its column (flat tiers, at least one storey above its ground, at most 20)
const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(k2(x, z), { g, r });
const fp = new Map();
for (const [key, { g, r }] of raw) {
  const [x, z] = key.split(",").map(Number);
  const near = [r];
  for (const [dx, dz] of N4) { const n = raw.get(k2(x + dx, z + dz)); if (n) near.push(n.r); }
  const q = STOREY * Math.round(med(near) / STOREY);
  const T = Math.min(20, Math.max(q, STOREY * Math.ceil((g + STOREY) / STOREY)));
  fp.set(key, { x, z, g, T });
}
const cellAt = (x, z) => fp.get(k2(x, z));
// a neighbour's column is open to the air at height y: outside the footprint, or above its own top
const open = (x, z, y) => { const c = cellAt(x, z); return !c || y >= c.T; };
const exposures = (x, z, y) => N4.filter(([dx, dz]) => open(x + dx, z + dz, y));

const blocks = new Map();
const put = (x, y, z, block, state) => blocks.set(`${x},${y},${z}`, { x, y, z, block, state });
const has = (x, y, z) => blocks.has(`${x},${y},${z}`);
const GLASS = "light_blue_stained_glass_pane";

for (const c of fp.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");                     // foundation under the lidar ground
  for (let y = g; y < T; y++) {
    const ex = exposures(x, z, y), shell = ex.length > 0;
    if (y === T - 1) { put(x, y, z, shell ? "smooth_quartz" : "gray_concrete"); continue; }   // roof / cornice
    if (y >= STOREY && y % STOREY === 0) { put(x, y, z, "white_concrete"); continue; }        // floor slab per storey
    if (!shell) {                                                                              // hollow storey
      if (y % STOREY !== 0 && x % 6 === 0 && z % 6 === 0) put(x, y, z, "white_concrete");     // structural column grid
      continue;
    }
    const [dx] = ex[0];
    const cornerCell = ex.some(([ax]) => ax) && ex.some(([, az]) => az);
    const along = dx !== 0 ? z : x;                                                            // position along the wall
    if (y === g && y < STOREY) { put(x, y, z, "polished_blackstone_bricks"); continue; }      // basalt base course
    if (y % STOREY === 3) { put(x, y, z, "light_gray_concrete"); continue; }                   // spandrel
    if (cornerCell || along % 3 === 0) { put(x, y, z, "white_concrete"); continue; }           // mullion / pier
    const state = dx !== 0
      ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
      : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
    put(x, y, z, GLASS, state);
  }
  // parapet on the street edge of each tier
  if (N4.some(([dx, dz]) => !cellAt(x + dx, z + dz))) put(x, T, z, "white_concrete");
}

// warm light: some windows show a glowstone just inside the glass, standing on the storey's floor slab
for (const c of fp.values()) {
  const { x, z, g, T } = c;
  for (let y = g + 1; y < T - 1; y++) {
    if (y % STOREY !== 1) continue;
    const ex = exposures(x, z, y);
    if (!ex.length || ex.length > 1 || ((x * 7 + z * 13 + y * 3) % 9) !== 0) continue;
    const [dx, dz] = ex[0];
    const ix = x - dx, iz = z - dz;
    if (cellAt(ix, iz) && !has(ix, y, iz)) put(ix, y, iz, "glowstone");
  }
}

// entrance: a street-side ground-floor window cell, nearest the middle of its face; a glazed door and a canopy on posts
const centreU = 20;
const cands = [];
for (const c of fp.values()) {
  const { x, z, g } = c;
  if (g > 1) continue;
  const ex = exposures(x, z, g);
  if (ex.length !== 1) continue;
  const [dx, dz] = ex[0];
  if (cellAt(x + dx, z + dz)) continue;                                  // must face the street, not another cell
  const along = dx !== 0 ? z : x;
  if (along % 3 === 0) continue;                                         // not a pier
  const pref = dz === -1 ? 0 : dz === 1 ? 1 : 2;
  cands.push({ x, z, g, dx, dz, score: [pref, Math.abs(along - centreU)] });
}
cands.sort((a, b) => a.score[0] - b.score[0] || a.score[1] - b.score[1]);
const e = cands[0];
if (!e) throw new Error("no entrance cell");
{
  const { x, z, g, dx, dz } = e;
  const face = FACING[`${dx},${dz}`];
  const doorState = (half) => ({ facing: face, half, hinge: "left", open: "false", powered: "false" });
  put(x, g, z, "iron_door", doorState("lower"));
  put(x, g + 1, z, "iron_door", doorState("upper"));
  const lat = dx !== 0 ? [0, 1] : [1, 0];
  for (const k of [-1, 0, 1]) {
    put(x + dx + lat[0] * k, STOREY, z + dz + lat[1] * k, "smooth_quartz");
    put(x + 2 * dx + lat[0] * k, STOREY, z + 2 * dz + lat[1] * k, "smooth_quartz");
  }
  for (const k of [-1, 1]) for (let y = 0; y < STOREY; y++)
    put(x + 2 * dx + lat[0] * k, y, z + 2 * dz + lat[1] * k, "white_concrete");
}

// roof: a service core on the top tier (lanterns on the parapet read as stray posts from the street, so none)
// the 4 x 4 core must sit inside the top tier (T = 20) with a ring of top-tier cells around it, nearest the middle
let best = null;
for (let x0 = 0; x0 <= SIZE[0] - 4; x0++) for (let z0 = 0; z0 <= SIZE[2] - 4; z0++) {
  let ok = true;
  for (let x = x0 - 1; x <= x0 + 4 && ok; x++) for (let z = z0 - 1; z <= z0 + 4 && ok; z++) {
    const c = cellAt(x, z); if (!c || c.T < 20) ok = false;
  }
  if (!ok) continue;
  const d = Math.hypot(x0 + 1.5 - 20, z0 + 1.5 - 27);
  if (!best || d < best.d) best = { x0, z0, d };
}
if (best) for (let x = best.x0; x < best.x0 + 4; x++) for (let z = best.z0; z < best.z0 + 4; z++)
  for (let y = 20; y < 24; y++) put(x, y, z, y === 23 ? "smooth_quartz" : "white_concrete");

const g = new Voxels(SIZE);
for (const { x, y, z, block, state } of blocks.values()) g.set(x, y, z, block, state);
const out = g.save(`${DIR}/way_291249514.nbt`);
console.log(`way_291249514: ${out.blocks} blocks, ${out.palette} palette entries; entrance at ${e.x},${e.z} facing ${FACING[`${e.dx},${e.dz}`]}; core ${best ? `${best.x0},${best.z0}` : "none"}`);
