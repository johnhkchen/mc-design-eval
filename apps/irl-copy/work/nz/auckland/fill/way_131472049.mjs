// Cordis, Auckland (way/131472049): a late-20th-century hotel-office block on a stepped massing. Each footprint cell
// stands from its own ground up to a median-smoothed, storey-quantized lidar top; the tall core steps down at its edges
// (a 44 ring, a 56 ring, the 68 core); the exposed cells are the facade (base course, glazed storeys with white piers,
// a cornice and parapet), the rest carry only floor slabs and a roof; a plant room sits on the tallest tier.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_131472049.cells.json`, "utf8"));
const OUT = `${DIR}/way_131472049.nbt`;

const W = 195, D = 113, MAXH = 80;
const STOREY = 4;          // blocks per storey
const SMOOTH = 3;          // lidar roof median over a 7 x 7 window: no speckle
const TOP_MAX = 68;        // lidar tops run to 67; 68 is the core's cornice line
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]];

const grid = new Array(W * D).fill(null);
const at = (x, z) => (x < 0 || z < 0 || x >= W || z >= D ? null : grid[z * W + x]);
const list = cells.map(([x, z, g, roof]) => {
  const c = { x, z, g, roof, top: 0, tier: 0, d: 0, facade: false, exN: false, exS: false, exE: false, exW: false };
  grid[z * W + x] = c;
  return c;
});

// 1. Flat tiers: median roof over the window, snapped to whole storeys, at least one storey above its own ground.
for (const c of list) {
  const v = [];
  for (let dz = -SMOOTH; dz <= SMOOTH; dz++) for (let dx = -SMOOTH; dx <= SMOOTH; dx++) {
    const n = at(c.x + dx, c.z + dz); if (n) v.push(n.roof);
  }
  v.sort((a, b) => a - b);
  c.tier = Math.round(v[v.length >> 1] / STOREY) * STOREY;
  c.top = Math.min(TOP_MAX, Math.max(c.tier, c.g + STOREY));
}

// 2. Distance from the outside edge (1 on the rim), so the tower's outer rings can step in.
const queue = [];
for (const c of list) {
  if (DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { c.d = 1; queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of DIRS) {
    const n = at(c.x + dx, c.z + dz);
    if (n && !n.d) { n.d = c.d + 1; queue.push(n); }
  }
}

// 3. Setbacks: the tall core steps in as it rises: outer 2 cells to 44, next 3 to 56, the core keeps its full height.
for (const c of list) {
  if (c.top < 56) continue;
  const cap = c.d <= 2 ? 44 : c.d <= 5 ? 56 : c.top;
  c.top = Math.max(c.g + STOREY, Math.min(c.top, cap));
}

// 4. Exposure: a face is facade where the neighbour is missing or lower (a setback or a wing's outer face).
for (const c of list) {
  const exposed = (dx, dz) => { const n = at(c.x + dx, c.z + dz); return !n || n.top < c.top; };
  c.exN = exposed(0, -1); c.exS = exposed(0, 1); c.exE = exposed(1, 0); c.exW = exposed(-1, 0);
  c.facade = c.exN || c.exS || c.exE || c.exW;
}

const v = new Voxels([W, MAXH, D]);

// The entrance: the north-facing wall cell nearest the middle of the block, ground floor, one door two blocks tall.
const northOnly = list.filter((c) => c.exN && !c.exE && !c.exW && !c.exS);
const cxMid = (W - 1) / 2;
const door = northOnly.reduce((best, c) => (!best || Math.abs(c.x - cxMid) < Math.abs(best.x - cxMid) ? c : best), null);

// Some bays glow behind the glass: about one bay in eleven, fixed by position so a replay gives the same building.
const glowsBay = (bay, k, axis) => (bay * 37 + k * 13 + axis * 5) % 11 === 0;

// 5. Columns: foundation to each cell's ground, then the facade or the floor slabs and roof.
for (const c of list) {
  const { x, z, g, top } = c;
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");

  const axis = c.exN || c.exS ? 0 : 1;             // a north or south face runs along x; an east or west face along z
  const along = axis === 0 ? x : z;
  const corner = (c.exN || c.exS) && (c.exE || c.exW);
  for (let y = g; y < top; y++) {
    const rel = y - g, k = Math.floor(rel / STOREY), r = rel % STOREY;
    let b = null;
    if (y === top - 1) b = c.facade ? "smooth_stone" : "stone";                   // parapet cap or roof membrane
    else if (!c.facade) b = r === 0 ? "light_gray_concrete" : null;                // floor slab only: an open interior
    else if (y === top - 2) b = "light_gray_concrete";                             // cornice course
    else if (r === 0) b = k === 0 ? "stone_bricks" : "light_gray_concrete";        // base course, then floor lines
    else if (r === 3) b = "light_gray_concrete";                                   // spandrel above the glass
    else if (corner || along % 4 === 0) b = "white_concrete";                      // piers and corner posts
    else if (glowsBay(Math.floor(along / 4), k, axis)) b = "glowstone";            // a lit room behind the glass
    else b = "light_blue_stained_glass";
    if (b) v.set(x, y, z, b);
  }
}

if (door) {
  const st = { facing: "north", hinge: "left", open: "false", powered: "false" };
  v.set(door.x, door.g, door.z, "dark_oak_door", { ...st, half: "lower" });
  v.set(door.x, door.g + 1, door.z, "dark_oak_door", { ...st, half: "upper" });
}

// 6. Plant room on the tallest tier: a solid box of light concrete with louvres, capped in stone, on the roof cells only.
const tmax = Math.max(...list.map((c) => c.top));
const crown = list.filter((c) => c.top === tmax && c.d >= 6);
const pcx = Math.round(crown.reduce((s, c) => s + c.x, 0) / crown.length);
const pcz = Math.round(crown.reduce((s, c) => s + c.z, 0) / crown.length);
const room = new Set(list.filter((c) => c.top === tmax && Math.abs(c.x - pcx) <= 7 && Math.abs(c.z - pcz) <= 5)
  .map((c) => `${c.x},${c.z}`));
for (const key of room) {
  const [x, z] = key.split(",").map(Number);
  const edge = [[0, -1], [0, 1], [1, 0], [-1, 0]].some(([dx, dz]) => !room.has(`${x + dx},${z + dz}`));
  for (let y = tmax; y < tmax + 3; y++) v.set(x, y, z, "light_gray_concrete");
  if (edge) v.set(x, tmax + 1, z, "iron_bars");
  v.set(x, tmax + 3, z, "smooth_stone");
}

const info = v.save(OUT);
const tiers = {};
for (const c of list) tiers[c.top] = (tiers[c.top] || 0) + 1;
console.log(JSON.stringify({ cells: list.length, blocks: info.blocks, palette: info.palette, door: door && [door.x, door.z], plantRoom: room.size, tiers }));
