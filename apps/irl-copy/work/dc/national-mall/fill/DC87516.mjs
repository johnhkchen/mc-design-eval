import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const raw = JSON.parse(readFileSync(`${DIR}/DC87516.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const W = 47, H = 30, D = 136;
const g = new Voxels([W, H, D]);

// Early-20th-century Stripped Classical office block: limestone-clad over granite base
const FOUND = "stone_bricks";
const BASE = "polished_granite";
const LIMESTONE = "calcite";
const TRIM = "smooth_stone";
const PILASTER = "smooth_quartz";
const GLASS = "glass_pane";
const PARAPET = "stone_brick_wall";
const ATTIC = "stone_bricks";
const MASS = "stone_bricks";
const LIGHT = "glowstone";

const STOREY = 4;
const BAY = 6; // pilaster every 6 blocks, two windows per bay

const map = new Map();
for (const [x, z, g0, r0] of list) map.set(`${x},${z}`, { x, z, g: g0, r: r0 });
const has = (x, z) => map.has(`${x},${z}`);
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from exterior edge (1 = perimeter cell)
const dist = new Map();
const queue = [];
for (const c of map.values()) {
  const edge = DIRS.some(([dx, dz]) => !has(c.x + dx, c.z + dz));
  if (edge) { dist.set(`${c.x},${c.z}`, 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(`${c.x},${c.z}`);
  for (const [dx, dz] of DIRS) {
    const nx = c.x + dx, nz = c.z + dz, k = `${nx},${nz}`;
    if (has(nx, nz) && !dist.has(k)) { dist.set(k, d + 1); queue.push(map.get(k)); }
  }
}

// Smooth lidar roof over 3x3 neighbourhood, quantise to storey lines
for (const c of map.values()) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = map.get(`${c.x + dx},${c.z + dz}`);
    if (o) { s += o.r; n++; }
  }
  const avg = s / n;
  c.G = c.g;
  const storeys = Math.max(2, Math.round((avg - c.G) / STOREY));
  c.R = Math.min(c.G + storeys * STOREY, 26);
}
let maxR = 0;
for (const c of map.values()) maxR = Math.max(maxR, c.R);

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// Facade block at storey-relative height rel. along = position along the face.
function facadeBlock(rel, along, topRel) {
  const bayPos = along % BAY;              // 0 = pilaster
  const isPilaster = bayPos === 0;
  const isWindow = bayPos === 2 || bayPos === 3; // two windows per bay
  if (rel === 0) return BASE;
  if (rel < STOREY) {
    // Ground floor: shopfront glass between pilasters, stone lintel band
    if (rel === 3) return TRIM;
    if (isPilaster) return PILASTER;
    return isWindow || bayPos === 1 || bayPos === 4 || bayPos === 5 ? GLASS : LIMESTONE;
  }
  const m = rel % STOREY;
  const attic = rel >= topRel - STOREY + 1;   // top storey = attic with its own material
  if (m === 0) return TRIM;                    // storey string course
  if (isPilaster) return attic ? ATTIC : PILASTER;
  if (m === 3) return attic ? ATTIC : LIMESTONE; // spandrel
  if (attic) return isWindow ? GLASS : ATTIC;
  return isWindow ? GLASS : LIMESTONE;
}

for (const c of map.values()) {
  const { x, z, G, R } = c;
  const k = `${x},${z}`;
  const perim = dist.get(k) === 1;
  const west = !has(x - 1, z), east = !has(x + 1, z);
  const north = !has(x, z - 1), south = !has(x, z + 1);
  const exposedX = west || east;
  const along = exposedX ? z : x;
  const topRel = R - G;

  let inX = 0, inZ = 0;
  if (west) inX = 1; else if (east) inX = -1; else if (north) inZ = 1; else if (south) inZ = -1;

  // Foundation
  for (let y = 0; y < G; y++) put(x, y, z, FOUND);

  if (!perim) {
    // Interior: floor slabs at each storey line and roof slab; air between (no interiors)
    for (let y = G; y <= R; y++) {
      if ((y - G) % STOREY === 0) put(x, y, z, TRIM);
    }
    // Roof plant on the interior of the tallest mass
    const d = dist.get(k);
    if (d >= 4 && R === maxR && ((x * 5 + z * 11) % 37) < 4) {
      for (let y = R + 1; y <= R + 2; y++) put(x, y, z, MASS);
      put(x, R + 3 <= H - 1 ? R + 3 : R + 2, z, TRIM);
    }
    continue;
  }

  // Perimeter walls
  for (let y = G; y <= R - 1; y++) {
    const rel = y - G;
    const bayPos = along % BAY;

    // Entrance: centred on the west (street) face, recessed doorway with lit transom
    const isEntrance = west && Math.abs(z - 68) <= 1 && (rel === 1 || rel === 2);
    if (isEntrance) {
      const half = rel === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", {
        facing: "west", half, hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (west && Math.abs(z - 68) <= 3 && rel === 3) {
      // Stone surround over the entrance
      put(x, y, z, PILASTER);
      continue;
    }

    const b = facadeBlock(rel, along, topRel);
    put(x, y, z, b);

    // Warm light behind some windows on the lower storeys and attic
    const isGlass = b === GLASS;
    if (isGlass && rel >= 5 && rel % STOREY === 1 && bayPos === 2 && along % 12 === 2) {
      if (has(x + inX, z + inZ)) put(x + inX, y, z + inZ, LIGHT);
    }
  }

  // Cornice: projecting stone band, then balustrade parapet
  put(x, R, z, TRIM);
  if (along % BAY === 0) put(x, R + 1, z, PILASTER); // pilaster caps
  else put(x, R + 1, z, PARAPET);
}

g.save(`${DIR}/DC87516.nbt`);
