import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3335876.cells.json", "utf8"));

const W = 21, H = 31, D = 32;
const g = new Voxels([W, H, D]);
const MAXR = 25;

const key = (x, z) => x + "," + z;
const raw = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  raw.set(key(x, z), { x, z, gr, rf });
}

// smooth lidar ground and roof over a 3x3 neighbourhood to remove noise
const map = new Map();
for (const c of raw.values()) {
  let sg = 0, sr = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(key(c.x + dx, c.z + dz));
    if (o) { sg += o.gr; sr += o.rf; n++; }
  }
  const gc = Math.max(0, Math.round(sg / n));
  // flat tiers of 2 blocks, at least 4 blocks above ground
  const r = Math.min(MAXR, Math.max(gc + 4, 2 * Math.round((sr / n) / 2)));
  map.set(key(c.x, c.z), { x: c.x, z: c.z, g: gc, r });
}

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const FACING = { "0,-1": "north", "0,1": "south", "-1,0": "west", "1,0": "east" };

function edgeFace(x, z) {
  const c = map.get(key(x, z));
  for (const [dx, dz] of DIRS) {
    const n = map.get(key(x + dx, z + dz));
    if (!n || n.r < c.r - 2) return [dx, dz];
  }
  return null;
}

const faceOf = new Map();
for (const c of map.values()) faceOf.set(key(c.x, c.z), edgeFace(c.x, c.z));
const isEdge = (x, z) => !!faceOf.get(key(x, z));

// main entrance on the north (-z) edge, centred
const northXs = [];
for (const c of map.values()) {
  const f = faceOf.get(key(c.x, c.z));
  if (f && f[0] === 0 && f[1] === -1) northXs.push(c.x);
}
let doorX = null;
if (northXs.length) doorX = Math.round((Math.min(...northXs) + Math.max(...northXs)) / 2);

const lights = [];

function setSafe(x, y, z, block, props) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
}

// 1. foundations, interior fill, roof slabs
for (const c of map.values()) {
  const { x, z, g: gc, r } = c;
  for (let y = 0; y < gc; y++) setSafe(x, y, z, "stone_bricks");
  if (!isEdge(x, z)) {
    for (let y = gc; y <= r - 2; y++) setSafe(x, y, z, "bricks");
    setSafe(x, r - 1, z, "smooth_stone");
  }
}

// 2. facades
for (const c of map.values()) {
  const { x, z, g: gc, r } = c;
  const face = faceOf.get(key(x, z));
  if (!face) continue;
  const [fdx, fdz] = face;
  const t = fdx !== 0 ? z : x;
  const cm = ((t % 3) + 3) % 3;
  const isNorth = fdx === 0 && fdz === -1;

  for (let y = gc; y < r; y++) {
    const rel = y - gc;

    // projecting cornice: top two courses in stone with a slab cap
    if (y === r - 1) { setSafe(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    if (y === r - 2) { setSafe(x, y, z, "stone_bricks"); continue; }
    if (rel === 0) { setSafe(x, y, z, "stone_bricks"); continue; }

    if (isNorth && x === doorX && (rel === 1 || rel === 2)) {
      const half = rel === 1 ? "lower" : "upper";
      setSafe(x, y, z, "oak_door", {
        facing: FACING["0,-1"], half, hinge: "left", open: "false", powered: "false"
      });
      continue;
    }
    if (isNorth && doorX !== null && rel === 1 && Math.abs(x - doorX) === 2) {
      setSafe(x, y, z, "lantern", { hanging: "false" });
      continue;
    }

    if (rel <= 2) {
      if (cm === 0) setSafe(x, y, z, "stone_bricks");
      else setSafe(x, y, z, "glass_pane");
      continue;
    }

    const r2 = (rel - 3) % 2;
    if (r2 === 1) { setSafe(x, y, z, "smooth_stone"); continue; }
    if (cm === 0) { setSafe(x, y, z, "bricks"); continue; }
    setSafe(x, y, z, "glass_pane");
    if (((t * 3 + y * 5 + z) % 7) === 0) lights.push({ x: x - fdx, y, z: z - fdz });
  }
}

// 3. lit windows behind the glass
for (const { x, y, z } of lights) {
  const n = map.get(key(x, z));
  if (!n || isEdge(x, z)) continue;
  if (y >= n.g && y <= n.r - 2) setSafe(x, y, z, "glowstone");
}

// 4. rooftop bulkhead on the central cells
let maxR = 0;
for (const c of map.values()) maxR = Math.max(maxR, c.r);
const xs = [...map.values()].map(c => c.x), zs = [...map.values()].map(c => c.z);
const cx = Math.round((Math.min(...xs) + Math.max(...xs)) / 2);
const cz = Math.round((Math.min(...zs) + Math.max(...zs)) / 2);
for (const c of map.values()) {
  if (c.r !== maxR || isEdge(c.x, c.z)) continue;
  if (Math.abs(c.x - cx) <= 2 && Math.abs(c.z - cz) <= 2) {
    setSafe(c.x, maxR, c.z, "bricks");
    setSafe(c.x, maxR + 1, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3335876.nbt");
