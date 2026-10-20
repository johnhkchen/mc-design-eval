import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 30 Henry Street, Brooklyn Heights. 2013 multi-family walk-up: brick facade,
// stone base, cornice and corners, stepped to about six storeys.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3335923";
const W = 14, H = 25, D = 17;
const MAX_TOP = 22; // parapet sits at 23, inside the 25-high grid

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

// Raw per-cell readings.
const raws = new Map();
for (const [x, z, gr, ro] of list) {
  const g = Math.min(20, Math.max(0, Math.round(gr)));
  const r = Math.round(ro);
  raws.set(`${x},${z}`, { x, z, g, nRaw: Math.max(1, Math.floor((r - g) / 2)), r });
}
const rawAt = (x, z) => raws.get(`${x},${z}`);

// 3x3 neighbourhood mean over footprint cells only.
const nbMean = (x, z, key) => {
  let s = 0, n = 0;
  for (let dz = -1; dz <= 1; dz++)
    for (let dx = -1; dx <= 1; dx++) {
      const c = rawAt(x + dx, z + dz);
      if (c) { s += c[key]; n++; }
    }
  return s / n;
};

// Smoothed ground and storey count.
const cellsArr = [...raws.values()];
const storeyVals = cellsArr.map((c) => c.nRaw).sort((a, b) => a - b);
const nMed = storeyVals[Math.floor(storeyVals.length / 2)];

const cells = new Map();
for (const c of cellsArr) {
  const g = Math.round(nbMean(c.x, c.z, "g"));
  const sm = nbMean(c.x, c.z, "nRaw");
  // One main tier at the median height, plus a single storey setback where the lidar is clearly taller.
  let n = nMed;
  if (sm >= nMed + 1.5) n = nMed + 1;
  if (sm <= nMed - 1.5) n = nMed - 1;
  n = Math.max(1, n);
  let top = Math.min(g + 2 * n, MAX_TOP);
  if (top < g + 2) top = g + 2;
  cells.set(`${c.x},${c.z}`, { x: c.x, z: c.z, g, top });
}

const has = (x, z) => cells.has(`${x},${z}`);
const cell = (x, z) => cells.get(`${x},${z}`);
const occ = (x, z, y) => {
  const c = cell(x, z);
  return !!c && y >= c.g && y < c.top;
};

// Exposed faces at height y: side toward a neighbour that does not occupy y.
const FACES = [[0, -1], [0, 1], [-1, 0], [1, 0]]; // N(z-), S(z+), W(x-), E(x+)
const exposures = (x, z, y) => FACES.filter(([dx, dz]) => !occ(x + dx, z + dz, y));

let minX = Infinity, maxX = -Infinity, maxZ = -Infinity;
for (const c of cells.values()) {
  minX = Math.min(minX, c.x);
  maxX = Math.max(maxX, c.x);
  maxZ = Math.max(maxZ, c.z);
}
const maxTop = Math.max(...[...cells.values()].map((c) => c.top));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const glassFor = (dx) =>
  dx === 0
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// 1. Foundations: solid from y0 up to each cell's ground.
for (const c of cells.values()) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");
}

// 2. Storeys.
const doorX = Math.round((minX + maxX) / 2);
let doorCell = null;
for (const c of cells.values()) {
  if (c.z !== maxZ) continue;
  if (!doorCell || Math.abs(c.x - doorX) < Math.abs(doorCell.x - doorX)) doorCell = c;
}

for (const c of cells.values()) {
  for (let y = c.g; y < c.top; y++) {
    const E = exposures(c.x, c.z, y);
    const rel = y - c.g;

    if (E.length === 0) {
      // Interior: floor slab at each storey line, air between.
      if (rel % 2 === 0) put(c.x, y, c.z, "smooth_stone");
      continue;
    }

    if (E.length >= 2) {
      // Corner: stone quoin, full height.
      put(c.x, y, c.z, "stone_bricks");
      continue;
    }

    const [dx] = E[0];
    const t = dx === 0 ? c.x : c.z;
    const tMin = dx === 0 ? minX : 0;
    const tMax = dx === 0 ? maxX : maxZ;

    if (rel === 0) {
      // Stone base course.
      put(c.x, y, c.z, "stone_bricks");
    } else if (rel % 2 === 0) {
      // Brick storey line.
      put(c.x, y, c.z, "bricks");
    } else {
      // Window row: brick piers at every third bay and at the ends, glass otherwise.
      const pier = t % 3 === 0 || t === tMin || t === tMax;
      if (pier) put(c.x, y, c.z, "bricks");
      else put(c.x, y, c.z, "glass_pane", glassFor(dx));
    }
  }
}

// 3. Roof cap, stone cornice and a solid stone parapet.
for (const c of cells.values()) {
  const perimeter = exposures(c.x, c.z, c.top).length > 0;
  put(c.x, c.top, c.z, perimeter ? "stone_bricks" : "smooth_stone");
  if (perimeter && c.top + 1 < H) put(c.x, c.top + 1, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// 4. Entrance: dark oak door, centred on the street (south) face, with a stone step inside.
if (doorCell) {
  const { x, z, g: gy } = doorCell;
  put(x, gy, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(x, gy + 1, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  if (has(x, z - 1)) put(x, gy, z - 1, "stone_brick_stairs", { facing: "south", half: "bottom", shape: "straight", waterlogged: "false" });
}

// 5. Warm lights behind some windows.
for (const c of cells.values()) {
  for (let y = c.g + 1; y < c.top; y += 2) {
    const E = exposures(c.x, c.z, y);
    if (E.length !== 1) continue;
    const [dx, dz] = E[0];
    const t = dx === 0 ? c.x : c.z;
    const k = (y - c.g - 1) / 2;
    if (t % 3 === 0) continue;
    if ((t + c.z + k) % 4 !== 0) continue;
    const ix = c.x - dx, iz = c.z - dz;
    if (!has(ix, iz) || !occ(ix, iz, y)) continue;
    if (exposures(ix, iz, y).length > 0) continue;
    put(ix, y, iz, "shroomlight");
  }
}

// 6. Roof equipment: a small penthouse on a few interior cells at the highest tier.
for (const c of cells.values()) {
  if (c.top !== maxTop) continue;
  if (c.x % 4 !== 2 || c.z % 4 !== 2) continue;
  if (exposures(c.x, c.z, c.top).length > 0) continue;
  if (c.top + 2 >= H) continue;
  put(c.x, c.top + 1, c.z, "stone_bricks");
  put(c.x, c.top + 2, c.z, "bricks");
}

g.save(`${DIR}/${ID}.nbt`);
