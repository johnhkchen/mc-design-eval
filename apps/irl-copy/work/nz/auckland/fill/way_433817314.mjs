// Auckland Bioengineering House (OSM way 433817314): a 1990s-2000s university tower on a plinth. Concrete frame, a
// glass curtain wall with mullions, a stepped crown on lidar's 68-73 block core and lower wings at 28-40. The footprint's
// cells are columns: foundation solid to each cell's ground, then a hollow shell (exterior walls, floor slabs, air
// inside). Storey lines are global (every 4 blocks) so the window rows line up across the massing.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${DIR}/way_433817314.cells.json`, "utf8"));   // [x, z, ground, roof] per cell
const W = 43, D = 49, H = 86;
const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];
const TOWER = 62;                       // lidar roof at or above this is the tower core
const M = {
  foundation: "stone_bricks",
  plinth: "smooth_stone",
  band: "light_gray_concrete",          // floor lines, head bands, cornice, slabs
  mullion: "white_concrete",            // piers between window bays
  glass: "light_blue_stained_glass_pane",
  storefront: "glass_pane",             // clear glass on the ground storey
  roof: "gray_concrete",
  parapet: "light_gray_concrete",
  light: "glowstone",
  plant: "iron_block",
  canopy: "polished_andesite",
  pier: "white_concrete",
};

const k = (x, z) => `${x},${z}`;
const C = new Map();
for (const [x, z, g, r] of cells) C.set(k(x, z), { x, z, g, r });
const at = (x, z) => C.get(k(x, z));
const outDirs = (c) => DIRS.filter(([dx, dz]) => !at(c.x + dx, c.z + dz));
const onEdge = (c) => outDirs(c).length > 0;

// Tower distance from its edge: the non-tower cells and the footprint edge are sources (BFS over the grid).
const queue = [];
for (const c of C.values()) {
  if (c.r < TOWER || onEdge(c)) { c.d = 0; queue.push(c); } else c.d = Infinity;
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [dx, dz] of DIRS) { const n = at(c.x + dx, c.z + dz); if (n && n.d > c.d + 1) { n.d = c.d + 1; queue.push(n); } }
}

// Smoothed tiers: a tower core at 72 with a two-cell ring stepping down to 68; a 48 podium over the mid-height lidar
// cells; wings snapped to a storey multiple. Every top is at least one storey above its own ground.
// Lidar noise on the wings: the roof height is the median of the cell and its footprint neighbours before snapping.
const median = (c) => {
  const v = [c.r];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) { const n = at(c.x + dx, c.z + dz); if (n && (dx || dz)) v.push(n.r); }
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const topOf = (c) => {
  let t;
  if (c.r >= TOWER) t = c.d <= 1 ? 68 : 72;
  else if (c.r >= 44) t = 48;
  else t = 4 * Math.round(median(c) / 4);
  return Math.max(t, c.g + 4);
};
for (const c of C.values()) c.top = topOf(c);

// A side is open air at height y when the neighbour is outside the footprint or its column ends below y.
const open = (n, y) => !n || y >= n.top;
const exposed = (c, y) => DIRS.some(([dx, dz]) => open(at(c.x + dx, c.z + dz), y));
const isFloor = (c, y) => y === c.g || (y % 4 === 0 && y - c.g >= 3 && y < c.top - 1);
const isMullion = (c) => (c.x + c.z) % 3 === 0;
const isPier = (c) => !onEdge(c) && c.x % 6 === 3 && c.z % 6 === 3;

const facade = (c, y) => {
  const rel = y - c.g;
  if (rel === 0) return M.plinth;
  const band = rel < 4 ? rel === 3 : (y % 4 === 0 || y % 4 === 3);
  if (band) return M.band;
  if (isMullion(c)) return M.mullion;
  return rel < 4 ? M.storefront : M.glass;
};

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, s) => g.set(x, y, z, b, s);

for (const c of C.values()) {
  const { x, z, g: gr, top: T } = c;
  const edge = onEdge(c);
  for (let y = 0; y < T; y++) {
    if (y < gr) { put(x, y, z, M.foundation); continue; }
    if (y === T - 1) { put(x, y, z, edge ? M.band : M.roof); continue; }
    if (exposed(c, y)) { put(x, y, z, facade(c, y)); continue; }
    if (isFloor(c, y)) { put(x, y, z, M.band); continue; }
    if (isPier(c) && y < T - 1) put(x, y, z, M.pier);
  }
  if (edge) for (let y = T; y < T + 2; y++) put(x, y, z, M.parapet);
}

// Roof plant: a few 2x2 air-handling blocks on the tower core, two high, standing on the roof deck.
for (const c of C.values()) {
  if (onEdge(c) || c.top < 72) continue;
  if (c.x % 8 >= 3 && c.x % 8 <= 4 && c.z % 8 >= 3 && c.z % 8 <= 4) { put(c.x, c.top, c.z, M.plant); put(c.x, c.top + 1, c.z, M.plant); }
}

// Entrance: the first single-sided edge cell with the lowest ground. Door faces into the building, canopy over it.
const entry = [...C.values()].filter((c) => outDirs(c).length === 1)
  .sort((a, b) => a.g - b.g || a.z - b.z || a.x - b.x)[0];
const [ox, oz] = outDirs(entry)[0];
const [ix, iz] = [-ox, -oz];                            // inward
const facing = DIRS.find(([dx, dz]) => dx === ix && dz === iz)[2];
const [tx, tz] = [oz, ox];                              // along the wall
const DOOR = { facing, hinge: "left", open: "false", powered: "false" };
put(entry.x, entry.g, entry.z, "dark_oak_door", { ...DOOR, half: "lower" });
put(entry.x, entry.g + 1, entry.z, "dark_oak_door", { ...DOOR, half: "upper" });
for (const s of [-1, 0, 1]) {
  put(entry.x + tx * s, entry.g + 3, entry.z + tz * s, M.canopy);
  put(entry.x + tx * s + ix, entry.g + 3, entry.z + tz * s + iz, M.canopy);
}
for (const s of [-1, 1]) {
  const lx = entry.x + tx * s + ix, lz = entry.z + tz * s + iz;
  if (at(lx, lz)) put(lx, entry.g + 1, lz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Warm light: some glass has a glowstone just inside it, standing on a floor slab.
for (const c of C.values()) {
  for (let y = c.g + 4; y < c.top - 1; y++) {
    if (y % 4 !== 1 || !exposed(c, y) || isMullion(c)) continue;
    const inward = DIRS.map(([dx, dz]) => at(c.x + dx, c.z + dz)).find((n) => n && n.top > y && !exposed(n, y));
    const outward = outDirs(c).length > 0;
    if (!inward || !outward || isPier(inward) || (c.x + c.z + y) % 5 !== 0) continue;
    if (!isFloor(inward, y - 1)) continue;
    put(inward.x, y, inward.z, M.light);
  }
}

// Glass panes connect to their neighbours in the wall plane (vanilla's north/south/east/west state).
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) for (let y = 0; y < H; y++) {
  const cell = g.get(x, y, z);
  if (!cell || !cell.block.endsWith("glass_pane")) continue;
  const conn = {};
  for (const [dx, dz, name] of DIRS) conn[name] = g.get(x + dx, y, z + dz) ? "true" : "false";
  g.set(x, y, z, cell.block, { ...conn, waterlogged: "false" });
}

const stats = g.save(`${DIR}/way_433817314.nbt`);
const tops = [...C.values()].map((c) => c.top);
console.log(JSON.stringify({ cells: C.size, maxTop: Math.max(...tops), minTop: Math.min(...tops), entry: [entry.x, entry.g, entry.z, facing], ...stats }));
