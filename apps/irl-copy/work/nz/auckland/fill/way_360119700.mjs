// Way 360119700, Auckland (the Eden Terrace side of Maungawhau): a 1960s-70s reinforced-concrete office block. Four storeys
// of 4 blocks on a basalt-brick plinth, light-grey concrete walls with white piers and a blue glass ribbon (window bays of
// two panes, a pier every third block), white spandrel bands at each floor line and a white cornice. The lidar roof is
// median-smoothed and snapped to four tiers: wings at 10, a mid tier at 14, the body at 18, and a three-block lift and
// stair core at 21 stepping in from the body. The shell is one block thick; interiors are air with a floor slab per storey.
// The front (the longest face) has a dark-oak shopfront with a door and a canopy; glowstone sits behind some panes.
// Roof plant boxes stand on the body's flat roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_360119700.cells.json", "utf8"));
const SX = 43, SY = 33, SZ = 53;
const grid = (v) => Array.from({ length: SX }, () => Array(SZ).fill(v));
const G = grid(-1), R0 = grid(0);                              // ground (foundation height), lidar roof height; -1 = not footprint
for (const [x, z, g, r] of cells) { G[x][z] = g; R0[x][z] = r; }
const inside = (x, z) => x >= 0 && z >= 0 && x < SX && z < SZ && G[x][z] >= 0;

// 3x3 median of the lidar roof, then one of four tiers (flat, clean setbacks)
const median = (x, z) => {
  const v = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) if (inside(x + dx, z + dz)) v.push(R0[x + dx][z + dz]);
  v.sort((a, b) => a - b); return v[v.length >> 1];
};
const tier = (r) => (r >= 19 ? 21 : r >= 17 ? 18 : r >= 12 ? 14 : 10);
const T = grid(0);                                             // top of each column (blocks at y < T)
for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) if (inside(x, z)) T[x][z] = tier(median(x, z));

// storey grid: slab rows at 2 (base course and ground floor), 6, 10, 14, 18; windows in the two rows above each slab,
// a spandrel row under the next slab; a column's top row (T - 1) is its cap
const SLABS = [2, 6, 10, 14, 18];
const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
const nb = (x, z, d) => [x + d.dx, z + d.dz];
// the faces of cell (x, z) that are open to air at row y: off the footprint, or above a lower neighbour's top
const openFaces = (x, z, y) => DIRS.filter((d) => { const [nx, nz] = nb(x, z, d); return !inside(nx, nz) || y >= T[nx][nz]; });

// the front: the face with the most open cells at the ground-floor window row
const faceCount = Object.fromEntries(DIRS.map((d) => [d.name, 0]));
for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) if (inside(x, z) && G[x][z] <= 3) {
  for (const d of openFaces(x, z, 3)) faceCount[d.name]++;
}
const front = DIRS.reduce((a, b) => (faceCount[b.name] > faceCount[a.name] ? b : a));

// the door: the middle of the front's ground-floor run (single-face cells only, so not a corner)
const frontCells = [];
for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) if (inside(x, z) && G[x][z] <= 3) {
  const f = openFaces(x, z, 3);
  if (f.length === 1 && f[0].name === front.name) frontCells.push(front.dx ? z : x);
}
frontCells.sort((a, b) => a - b);
const doorAlong = frontCells[frontCells.length >> 1];

// build the block map: key -> { block, state, face }
const B = new Map();
const key = (x, y, z) => (x * SY + y) * SZ + z;
const put = (x, y, z, block, state, face) => B.set(key(x, y, z), { block, state, face });
const at = (x, y, z) => B.get(key(x, y, z));

for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) {
  if (!inside(x, z)) continue;
  const g = G[x][z], top = T[x][z];
  for (let y = 0; y < g; y++) put(x, y, z, y < 2 ? "stone_bricks" : "stone");   // foundation: solid from 0 up to the ground
  for (let y = g; y < top; y++) {
    const open = openFaces(x, z, y);
    const shell = open.length > 0;
    if (y === top - 1) { put(x, y, z, shell ? "white_concrete" : "smooth_stone"); continue; }   // cap: cornice or roof
    if (SLABS.includes(y)) {                                  // a floor slab per storey (the base course on the outside)
      put(x, y, z, shell ? (y === 2 ? "stone_bricks" : "white_concrete") : "light_gray_concrete");
      continue;
    }
    if (!shell) continue;                                     // interior: air
    const F = Math.max(...SLABS.filter((s) => s <= y));
    const k = y - F;                                          // 1, 2 windows; 3 spandrel
    if (k === 3) { put(x, y, z, "light_gray_concrete"); continue; }
    if (open.length > 1) { put(x, y, z, "white_concrete"); continue; }   // corner quoin
    const d = open[0];
    const along = d.dx ? z : x;
    const isFront = d.name === front.name && F === 2;
    if (isFront && along === doorAlong) {                     // the entrance: door in the middle of the shopfront
      put(x, y, z, "dark_oak_door", { facing: d.name, half: y === F + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" }, d);
      continue;
    }
    if (isFront) { put(x, y, z, "light_blue_stained_glass_pane", null, d); continue; }   // shopfront glass, no piers
    if (along % 3 === 0) { put(x, y, z, "white_concrete"); continue; }   // pier
    put(x, y, z, "light_blue_stained_glass_pane", null, d);
  }
}

// the shopfront's canopy over the front's ground floor, and a lantern inside the entrance
for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) {
  if (!inside(x, z) || G[x][z] > 3) continue;
  if (openFaces(x, z, 5).some((d) => d.name === front.name)) put(x, 5, z, "dark_oak_planks");
  if (openFaces(x, z, 3).some((d) => d.name === front.name) && (front.dx ? z : x) === doorAlong) {
    const inward = front.dx ? [x - front.dx, z] : [x, z - front.dz];
    const [ix, iz] = inward;
    if (inside(ix, iz) && G[ix][iz] <= 3) put(ix, 3, iz, "lantern", { hanging: "false" });
  }
}

// glowstone behind some panes: the cell inside a window is air (interior), so a warm light sits there
for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) {
  if (!inside(x, z)) continue;
  for (let y = G[x][z]; y < T[x][z]; y++) {
    const e = at(x, y, z);
    if (!e || e.block !== "light_blue_stained_glass_pane") continue;
    if ((x * 31 + z * 17 + y * 13) % 9 !== 0) continue;
    const d = e.face, ix = x - d.dx, iz = z - d.dz;
    if (!inside(ix, iz) || at(ix, y, iz)) continue;           // only into an empty interior cell
    if (openFaces(ix, iz, y).length === 0) put(ix, y, iz, "glowstone");
  }
}

// roof plant on the body's flat roof: iron boxes on the cap, not on the wings or core
for (let x = 0; x < SX; x++) for (let z = 0; z < SZ; z++) {
  if (!inside(x, z) || T[x][z] !== 18) continue;
  if (x % 9 === 4 && z % 9 === 4 && !at(x, 18, z)) put(x, 18, z, "iron_block");
}

// the panes connect in the wall's plane: a neighbour that holds a block (any kind) joins them
const solid = (x, y, z) => { const e = at(x, y, z); return !!e; };
for (const [k, e] of B) {
  if (e.block !== "light_blue_stained_glass_pane") continue;
  const z = k % SZ, y = Math.floor(k / SZ) % SY, x = Math.floor(k / SZ / SY);
  // a face on an x-wall joins its z neighbours (north, south); a face on a z-wall joins its x neighbours (east, west)
  const joins = e.face.dx ? { north: [0, -1], south: [0, 1] } : { west: [-1, 0], east: [1, 0] };
  const state = { north: "false", south: "false", east: "false", west: "false" };
  for (const [dir, [dx, dz]] of Object.entries(joins)) state[dir] = solid(x + dx, y, z + dz) ? "true" : "false";
  e.state = state;
}

const g = new Voxels([SX, SY, SZ]);
for (const [k, e] of B) {
  const z = k % SZ, y = Math.floor(k / SZ) % SY, x = Math.floor(k / SZ / SY);
  g.set(x, y, z, e.block, e.state);
}
const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_360119700.nbt";
const r = g.save(out);
console.log(`saved ${out}: ${r.blocks} blocks, palette ${r.palette}, front ${front.name}, door at along ${doorAlong}`);
