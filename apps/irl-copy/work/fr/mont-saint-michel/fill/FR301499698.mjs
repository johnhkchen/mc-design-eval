import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499698";
const W = 10, H = 30, D = 9;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const fp = new Map();
for (const [x, z, g, r] of cells) {
  fp.set(key(x, z), { x, z, g: Math.max(0, Math.round(g)), r: Math.round(r) });
}
const has = (x, z) => fp.has(key(x, z));

// Footprint extents for corner quoins
const all = [...fp.values()];
const minX = Math.min(...all.map(c => c.x)), maxX = Math.max(...all.map(c => c.x));
const minZ = Math.min(...all.map(c => c.z)), maxZ = Math.max(...all.map(c => c.z));

// Massing: storeys from the median lidar roof height (about 5 blocks per storey, 3 blocks of roof on top)
const roofs = all.map(c => c.r).sort((a, b) => a - b);
const med = roofs[Math.floor(roofs.length / 2)] ?? 18;
const storeys = Math.min(6, Math.max(2, Math.round((med - 3) / 5)));
const wallTop = storeys * 5;

const dirs = { north: [0, -1], south: [0, 1], east: [1, 0], west: [-1, 0] };
const openFaces = c => Object.entries(dirs).filter(([, [dx, dz]]) => !has(c.x + dx, c.z + dz)).map(([n]) => n);
const isBoundary = c => openFaces(c).length > 0;

// Distance from the footprint edge (BFS) for a stepped hip roof
const dist = new Map();
const queue = [];
for (const c of all) {
  if (isBoundary(c)) { dist.set(key(c.x, c.z), 1); queue.push(c); }
}
while (queue.length) {
  const c = queue.shift();
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of Object.values(dirs)) {
    const n = fp.get(key(c.x + dx, c.z + dz));
    if (n && !dist.has(key(n.x, n.z))) { dist.set(key(n.x, n.z), d + 1); queue.push(n); }
  }
}
const roofLevel = c => wallTop + Math.min(dist.get(key(c.x, c.z)) ?? 3, 3);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

const WALL = "stone_bricks";
const BAND = "polished_andesite";
const QUOIN = "chiseled_stone_bricks";
const FOUND = "cobblestone";
const FLOOR = "spruce_planks";
const ROOF = "deepslate_tiles";
const ROOF_ST = "deepslate_tile_stairs";
const TRIM = "stone_brick_slab";

// 1. Foundations, walls, floors, ceiling, roof
for (const c of all) {
  const boundary = isBoundary(c);
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, FOUND);
  for (let y = c.g; y <= wallTop; y++) {
    if (boundary) {
      if (y === wallTop) put(c.x, y, c.z, TRIM, { type: "top", waterlogged: "false" });
      else put(c.x, y, c.z, WALL);
    } else if (y === c.g || y === wallTop || (y % 5 === 0 && y > 0)) {
      put(c.x, y, c.z, FLOOR);
    }
  }
  const L = roofLevel(c);
  for (let y = wallTop + 1; y < L; y++) put(c.x, y, c.z, ROOF);
  let lowerFacing = null;
  for (const [name, [dx, dz]] of Object.entries(dirs)) {
    const n = fp.get(key(c.x + dx, c.z + dz));
    if (n && roofLevel(n) < L && !lowerFacing) lowerFacing = name;
  }
  if (lowerFacing) {
    put(c.x, L, c.z, ROOF_ST, { facing: lowerFacing, half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    put(c.x, L, c.z, ROOF);
  }
}

// 2. Facade: quoins at the corners, recessed windows with surrounds, string courses, door
const southCells = all.filter(c => !has(c.x, c.z + 1));
let doorCell = null;
if (southCells.length) {
  const xs = southCells.map(c => c.x);
  const mid = (Math.min(...xs) + Math.max(...xs)) / 2;
  doorCell = southCells.reduce((a, b) => (Math.abs(b.x - mid) < Math.abs(a.x - mid) ? b : a));
}

for (const c of all) {
  if (!isBoundary(c)) continue;
  for (const name of openFaces(c)) {
    const [dx, dz] = dirs[name];
    const alongX = dz !== 0;                       // north/south faces: along = x
    const along = alongX ? c.x : c.z;
    const lo = alongX ? minX : minZ;
    const hi = alongX ? maxX : maxZ;
    const isCorner = along === lo || along === hi;
    for (let y = c.g + 1; y < wallTop; y++) {
      const r = y % 5;
      const s = Math.floor(y / 5);
      if (r === 0) { put(c.x, y, c.z, BAND); continue; }
      const winCell = !isCorner && along % 2 === 1 && r >= 1 && r <= 3;
      if (winCell) {
        const props = alongX
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(c.x, y, c.z, "glass_pane", props);
        const ix = c.x - dx, iz = c.z - dz;
        const inner = fp.get(key(ix, iz));
        if (inner && !isBoundary(inner) && r === 2 && (along + s) % 3 === 0) {
          put(ix, y, iz, "glowstone");
        }
      } else if (isCorner) {
        put(c.x, y, c.z, QUOIN);
      } else {
        put(c.x, y, c.z, WALL);
      }
    }
  }
}

// Entrance: door, stone surround and lintel, warm light behind
if (doorCell) {
  const { x, z, g: gr } = doorCell;
  const dprops = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
  put(x, gr + 1, z, "oak_door", dprops("lower"));
  put(x, gr + 2, z, "oak_door", dprops("upper"));
  // jambs in quoin stone either side of the door
  put(x - 1, gr + 1, z, QUOIN); put(x - 1, gr + 2, z, QUOIN);
  put(x + 1, gr + 1, z, QUOIN); put(x + 1, gr + 2, z, QUOIN);
  // lintel over the door, spanning the surround
  for (const dxl of [-1, 0, 1]) {
    put(x + dxl, gr + 3, z, BAND);
  }
  // lantern-lit space behind the door
  const inner = fp.get(key(x, z - 1));
  if (inner && !isBoundary(inner)) put(x, gr + 2, z - 1, "glowstone");
}

// 3. Chimney on the highest roof cell with a full block top
let best = null;
for (const c of all) {
  const L = roofLevel(c);
  const hasStair = Object.values(dirs).some(([dx, dz]) => {
    const n = fp.get(key(c.x + dx, c.z + dz));
    return n && roofLevel(n) < L;
  });
  if (!hasStair && (!best || L > roofLevel(best))) best = c;
}
if (best) {
  const L = roofLevel(best);
  for (let y = L + 1; y <= L + 3; y++) put(best.x, y, best.z, "stone_bricks");
  put(best.x, L + 4, best.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
