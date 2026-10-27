// Downtown Car Park, Auckland: a 1970s-80s reinforced-concrete multi-storey car park on a shopfront base. Its lidar roof
// is smoothed over a 5 x 5 window and snapped to 4-block storey lines (tiers 4..36), so the massing steps down to the
// edges like the real deck levels. Each deck is a floor slab on a 6-block column grid; the faces are open car bays
// (air) between pale concrete piers, a spandrel band at every floor edge and a ventilation screen of iron bars under
// it. The ground storey is a glass shopfront with a door on the south side, and a stair-and-lift overrun sits on
// the top deck. Lanterns light some bays.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23909639.cells.json", "utf8"));
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23909639.nbt";
const W = 111, D = 125, H = 50;
const BASE = "stone_bricks", PIER = "white_concrete", SLAB = "light_gray_concrete", FLOOR = "gray_concrete";
const SCREEN = "iron_bars", GLASS = "light_blue_stained_glass_pane", PARAPET = "smooth_stone", DOOR = "dark_oak_door";
const SOLID = new Set([BASE, PIER, SLAB, FLOOR, PARAPET]);
const PANE = new Set([GLASS, SCREEN]);
const BAY = 6;                                                        // pier and column grid, in blocks
const K = (x, z) => `${x},${z}`;
// [side, dx, dz, run]: run is the axis the face runs along (piers sit on the BAY grid along it)
const DIRS = [["north", 0, -1, "x"], ["south", 0, 1, "x"], ["east", 1, 0, "z"], ["west", -1, 0, "z"]];

const fp = new Map();
for (const [x, z, g, R] of cells) fp.set(K(x, z), { x, z, g, R });
const at = (x, z) => fp.get(K(x, z));

// Storey-snapped roof: the lidar's 5 x 5 mean, rounded to a 4-block storey, never above the 36 tier
for (const c of fp.values()) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = at(c.x + dx, c.z + dz); if (o) { s += o.R; n++; } }
  c.T = Math.min(36, Math.max(4, Math.round(s / n / 4) * 4));
}
const maxT = Math.max(...[...fp.values()].map((c) => c.T));

// The faces of a cell at height y that look onto open air: off the footprint, or beside a cell whose top is at or below y
const sides = (c, y) => DIRS.filter(([, dx, dz]) => { const o = at(c.x + dx, c.z + dz); return !o || y >= o.T; });

// The volume, written cell by cell, then saved in one pass
const G = new Array(W * H * D).fill(null);
const idx = (x, y, z) => (y * D + z) * W + x;
const put = (x, y, z, b, s = null) => { if (x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D) G[idx(x, y, z)] = { b, s }; };
const at3 = (x, y, z) => (x >= 0 && y >= 0 && z >= 0 && x < W && y < H && z < D ? G[idx(x, y, z)] : null);

// The face of a wall cell at height y: ground shopfront, then per storey a spandrel at the floor edge, open bays with
// a lantern in some of them, and a screen of iron bars under the next spandrel. Piers stand where two faces meet or
// on the BAY grid.
function facade(c, y, open) {
  const k = Math.floor(y / 4), r = y % 4;
  const along = open[0][3] === "x" ? c.x : c.z;
  const pier = open.length > 1 || along % BAY === 0;
  if (k === 0) return y === 3 ? [SLAB] : pier ? [PIER] : [GLASS];   // shopfront, lintel at 3
  if (r === 0) return [SLAB];                                       // floor edge
  if (pier) return [PIER];
  if (r === 3) return [SCREEN];
  if (r === 1 && along % 12 === 3 && k % 2 === 1) return ["lantern", { hanging: "false", waterlogged: "false" }];
  return null;                                                      // open car bay
}

for (const c of fp.values()) {
  const { x, z, g, T } = c;
  for (let y = 0; y < g; y++) put(x, y, z, BASE);                   // foundation: solid up to this cell's ground
  const column = x % BAY === 0 && z % BAY === 0;
  for (let y = g; y < T; y++) {
    const open = sides(c, y);
    if (y === T - 1) { put(x, y, z, SLAB); continue; }              // top deck, a full roof
    if (!open.length) {                                             // interior: columns on the grid, deck slabs, air between
      if (column) put(x, y, z, PIER);
      else if (y % 4 === 0 && y > 0) put(x, y, z, FLOOR);
      continue;
    }
    const f = facade(c, y, open);
    if (f) put(x, y, z, f[0], f[1] ?? null);
  }
  if (sides(c, T).length) put(x, T, z, PARAPET);                    // coping on the open edge of the roof
}

// Ground entrance on the south face: a double-high door in the shopfront, at the middle of the face
const south = [...fp.values()].filter((c) => c.g <= 1 && !at(c.x, c.z + 1) && c.x % BAY !== 0);
const mid = south.reduce((a, c) => a + c.x, 0) / south.length;
const entry = south.reduce((best, c) => (Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best));
const doorState = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
put(entry.x, entry.g, entry.z, DOOR, doorState("lower"));
put(entry.x, entry.g + 1, entry.z, DOOR, doorState("upper"));

// Stair-and-lift overrun on the tallest deck, centred on the tallest tier
const top = [...fp.values()].filter((c) => c.T === maxT);
const cx = Math.round(top.reduce((a, c) => a + c.x, 0) / top.length), cz = Math.round(top.reduce((a, c) => a + c.z, 0) / top.length);
for (const c of top) {
  if (Math.abs(c.x - cx) > 1 || Math.abs(c.z - cz) > 1) continue;
  for (let y = c.T; y < c.T + 3; y++) put(c.x, y, c.z, SLAB);
  put(c.x, c.T + 3, c.z, PARAPET);
}

// Panes and bars join their neighbours: a side is connected where the next cell is a pane or a solid block
for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const cell = at3(x, y, z);
  if (!cell || !PANE.has(cell.b)) continue;
  const join = (dx, dz) => { const o = at3(x + dx, y, z + dz); return o && (PANE.has(o.b) || SOLID.has(o.b)) ? "true" : "false"; };
  cell.s = { north: join(0, -1), south: join(0, 1), east: join(1, 0), west: join(-1, 0), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
  const cell = at3(x, y, z);
  if (cell) g.set(x, y, z, cell.b, cell.s ?? undefined);
}
const stats = g.save(OUT);
console.log(`way_23909639: ${stats.blocks} blocks, ${stats.palette} palette entries, tiers ${[...new Set([...fp.values()].map((c) => c.T))].sort((a, b) => a - b).join("/")}, roof max ${maxT}`);
