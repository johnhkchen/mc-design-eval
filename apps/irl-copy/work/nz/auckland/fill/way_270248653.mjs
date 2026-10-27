// Ascent Apartments (way 270248653): a 1990s-2000s apartment block of cream concrete piers, pale glass and a dark basalt
// plinth (the Auckland volcanic stone the older walls are built of). The lidar roof is mode-filtered onto the 4-block
// storey grid: the main slab at 40, a core at 48 that steps back one storey on its outer two rings, lower wings where the
// lidar is low, and at least three storeys above the base course. Every column is solid from its ground to its roof, so
// nothing floats. Foundation from y 0 to each cell's ground, a basalt base course on the storey line, then a storey per 4
// blocks: a smooth-quartz string course, two rows of glass between cream piers, a smooth-quartz head course. The outer
// edge has a parapet; the roof is grey membrane with plant boxes on the core. Interiors are air with a floor slab per
// storey and a glowstone or shroomlight behind some panes. The entrance faces north, the street side: an iron door under
// a quartz hood with a hanging lantern, and a glazed lobby across the bays either side.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270248653.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_270248653.nbt";
const W = 83, D = 79, H = 60;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const grid = (v) => Array.from({ length: W }, () => Array(D).fill(v));
const GROUND = grid(-1), RAW = grid(0);
for (const [x, z, g, r] of cells) { GROUND[x][z] = g; RAW[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < W && z < D && GROUND[x][z] >= 0;
const cellList = [];
for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) if (inside(x, z)) cellList.push([x, z]);

// ---- massing: lidar roof snapped to the storey grid, 3x3 mode so a noisy cell takes its neighbours' tier
const TIER = grid(0), ROOF = grid(0);
for (const [x, z] of cellList) TIER[x][z] = Math.round(RAW[x][z] / 4) * 4;
for (const [x, z] of cellList) {
  const tally = new Map();
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) {
    const v = TIER[x + dx][z + dz]; tally.set(v, (tally.get(v) || 0) + 1);
  }
  let best = TIER[x][z];
  for (const [v, n] of tally) if (n > tally.get(best)) best = v;
  ROOF[x][z] = best;
}
// the base course's storey line (the first 4-block line at or above the ground), and at least three storeys above it
const base = (x, z) => Math.ceil(GROUND[x][z] / 4) * 4;
// rings in from the outside: the core's outer two rings step back one storey
const ring = grid(Infinity), queue = [];
for (const [x, z] of cellList) if (DIRS.some(([dx, dz]) => !inside(x + dx, z + dz))) { ring[x][z] = 1; queue.push([x, z]); }
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  for (const [dx, dz] of DIRS) {
    const nx = x + dx, nz = z + dz;
    if (inside(nx, nz) && ring[nx][nz] === Infinity) { ring[nx][nz] = ring[x][z] + 1; queue.push([nx, nz]); }
  }
}
for (const [x, z] of cellList) {
  ROOF[x][z] = Math.min(48, Math.max(ROOF[x][z], base(x, z) + 4));
  if (ROOF[x][z] >= 44 && ring[x][z] <= 2) ROOF[x][z] -= 4;
}
const top = (x, z) => (inside(x, z) ? ROOF[x][z] : 0);
// a face is exposed where the neighbour is outside or lower: its rows above the neighbour's roof are facade
const faces = (x, z) => DIRS.filter(([dx, dz]) => top(x + dx, z + dz) < ROOF[x][z]);

// ---- the entrance: the north (street) face, the cell with the widest open run of north face and the lowest ground
const northOpen = (x, z) => inside(x, z) && !inside(x, z - 1);
let ent = null;
for (const [x, z] of cellList) if (northOpen(x, z)) {
  let width = 0;
  for (let i = -3; i <= 3; i++) if (northOpen(x + i, z)) width++;
  const score = width * 2 - GROUND[x][z];
  if (!ent || score > ent.score) ent = { x, z, score, G: GROUND[x][z], L: base(x, z) };
}

// ---- the block model: a map of cells, written to the volume at the end
const B = new Map();
const k = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  B.set(k(x, y, z), { block, state });
};
const del = (x, y, z) => B.delete(k(x, y, z));
const has = (x, y, z) => B.has(k(x, y, z));

const PANE_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const PANE_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
// a glass pane on a face: one in twelve is a darker glazing, so the grid is not one tint
const glass = (x, y, z, dz) => ({
  block: (x * 5 + y * 3 + z * 7) % 9 === 0 ? "gray_stained_glass_pane" : "light_blue_stained_glass_pane",
  state: dz !== 0 ? PANE_NS : PANE_EW,
});
// a facade block on a storey row: string course and head in quartz, then glass between cream piers on a 3-cell bay
const lobby = (x, y, z) => ent && z === ent.z && Math.abs(x - ent.x) <= 2 && (y === ent.L + 1 || y === ent.L + 2);
const facade = (x, y, z, fs) => {
  const [dx, dz] = fs[0];
  const ym = y % 4;
  if (lobby(x, y, z)) return glass(x, y, z, -1);
  if (ym === 0 || ym === 3) return { block: "smooth_quartz" };
  const corner = fs.some(([a]) => a !== 0) && fs.some(([, b]) => b !== 0);
  const u = dz !== 0 ? x : z;            // along the face: x on north and south faces, z on east and west
  if (corner || u % 3 === 0) return { block: "white_concrete" };
  return glass(x, y, z, dz);
};

// ---- columns: foundation, base course, interior floor slabs and roof, then the facade where a face is exposed
const lamps = [];
for (const [x, z] of cellList) {
  const g = GROUND[x][z], l = base(x, z), r = ROOF[x][z];
  const fs = faces(x, z);
  const from = fs.length ? Math.max(l + 1, Math.min(...fs.map(([dx, dz]) => top(x + dx, z + dz)))) : Infinity;
  for (let y = 0; y < r; y++) {
    if (y <= l) put(x, y, z, "polished_basalt");
    else if (y >= from) {
      const b = facade(x, y, z, fs);
      put(x, y, z, b.block, b.state);
      if (b.block.endsWith("_pane") && (y % 4 === 1 || y % 4 === 2) && !lobby(x, y, z) && (x * 11 + y * 7 + z * 13) % 6 === 0) {
        const [dx, dz] = fs[0];
        lamps.push({ x: x - dx, y, z: z - dz, warm: (x + y) % 4 === 0 });
      }
    } else if (y % 4 === 0 || y === r - 1) put(x, y, z, y === r - 1 ? "gray_concrete" : "smooth_quartz");
  }
  // parapet on the outer edge, on the column's roof row
  if (fs.some(([dx, dz]) => !inside(x + dx, z + dz)) && r < H) put(x, r, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  // roof equipment: 2 x 2 plant boxes, two high, on the interior of the tall tiers
  if (!fs.length && r >= 44 && x % 6 >= 2 && x % 6 <= 3 && z % 6 >= 2 && z % 6 <= 3 && r + 1 < H) {
    put(x, r, z, "light_gray_concrete"); put(x, r + 1, z, "light_gray_concrete");
  }
}

// ---- the entrance on the north face, a glazed lobby either side
const { x: ex, z: ez, G: eg } = ent;
put(ex, eg, ez, "iron_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
put(ex, eg + 1, ez, "iron_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
if (inside(ex, ez + 1)) {                 // a vestibule behind the door; a ground-level door keeps its floor
  del(ex, eg, ez + 1); del(ex, eg + 1, ez + 1);
  if (eg === 0) put(ex, 0, ez + 1, "smooth_quartz");
}
for (const i of [-1, 0, 1]) {             // a quartz hood on the lintel, one block out, with a lantern hung under it
  put(ex + i, eg + 2, ez, "smooth_quartz");
  put(ex + i, eg + 2, ez - 1, "smooth_quartz");
}
put(ex, eg + 1, ez - 1, "lantern", { hanging: "true", waterlogged: "false" });

// ---- warm light behind some panes: glowstone, or shroomlight on the quarter of them that lie on a row's diagonal
for (const L of lamps) {
  if (inside(L.x, L.z) && !has(L.x, L.y, L.z)) put(L.x, L.y, L.z, L.warm ? "shroomlight" : "glowstone");
}

const g = new Voxels([W, H, D]);
for (const [key, b] of B) {
  const [x, y, z] = key.split(",").map(Number);
  g.set(x, y, z, b.block, b.state);
}
const info = g.save(OUT);
const maxRoof = Math.max(...cellList.map(([x, z]) => ROOF[x][z]));
console.log(JSON.stringify({ cells: cellList.length, maxRoof, entrance: { x: ex, z: ez, ground: eg }, ...info }));
