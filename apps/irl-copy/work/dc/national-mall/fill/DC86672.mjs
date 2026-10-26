import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86672";
const W = 39, H = 32, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Raw records
const raw = new Map();
let minG = Infinity;
for (const [x, z, g0, r0] of cells) {
  const g = Math.round(g0);
  raw.set(`${x},${z}`, { x, z, g, r0: Math.round(r0) });
  minG = Math.min(minG, g);
}

// Smooth roof heights over the 3x3 neighbourhood, then quantize to 3-block storeys
const map = new Map();
for (const [key, c] of raw) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(`${c.x + dx},${c.z + dz}`);
    if (o) { sum += o.r0; n++; }
  }
  const avg = sum / n;
  let r = minG + 3 * Math.round((avg - minG) / 3);
  r = Math.max(r, c.g + 3);
  r = Math.min(r, H - 4);
  map.set(key, { g: c.g, r });
}
const get = (x, z) => map.get(`${x},${z}`);

// Exposed faces: missing neighbour, or a neighbour with a lower roof (setback step)
function exposedDirs(x, z, c) {
  const out = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const n = get(x + dx, z + dz);
    if (!n || n.r < c.r) out.push([dx, dz]);
  }
  return out;
}
// True outer edge only (no footprint neighbour at all)
function outerDirs(x, z) {
  const out = [];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    if (!get(x + dx, z + dz)) out.push([dx, dz]);
  }
  return out;
}

const g = new Voxels([W, H, D]);

// Entrance on the north (z-min) outer face, near the middle of the frontage
const northFace = [];
for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const od = outerDirs(x, z);
  const hasX = od.some(d => d[0] !== 0);
  const hasZ = od.some(d => d[1] === -1);
  if (hasZ && !hasX) northFace.push({ x, z, c });
}
let entrance = null;
if (northFace.length) {
  const xs = northFace.map(p => p.x).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  northFace.sort((a, b) => Math.abs(a.x - mid) - Math.abs(b.x - mid));
  entrance = northFace[0];
}

// Build columns
for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposedDirs(x, z, c);
  const isExt = ex.length > 0;
  const outer = outerDirs(x, z).length > 0;
  const xFace = ex.some(d => d[0] !== 0);
  const zFace = ex.some(d => d[1] !== 0);
  const corner = xFace && zFace;
  const along = xFace ? z : x;

  // Foundation
  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone_bricks");

  for (let y = c.g; y < c.r; y++) {
    const rel = y - c.g;
    const k = rel % 3;
    const s = Math.floor(rel / 3);

    if (isExt) {
      if (y === c.r - 1) {
        g.set(x, y, z, "smooth_stone");                       // cornice course
      } else if (corner) {
        g.set(x, y, z, "white_concrete");                     // corner pier
      } else if (k === 0) {
        g.set(x, y, z, s === 0 ? "stone_bricks" : "light_gray_concrete");
      } else if (along % 3 === 0) {
        g.set(x, y, z, "white_concrete");                     // mullion
      } else {
        const lit = ((x * 7 + y * 13 + z * 3) % 17) === 0;
        g.set(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
      }
    } else {
      if (y === c.r - 1) {
        g.set(x, y, z, "light_gray_concrete");                // roof membrane
      } else if (k === 0) {
        g.set(x, y, z, "smooth_stone");                       // interior floor slab
      }
    }
  }

  // Parapet only on the true outer edge of the roof
  if (outer) g.set(x, c.r, z, "light_gray_concrete");

  // Sparse roof plant: one 2-high unit per 9x9 grid, interior cells only
  if (!isExt && x % 9 === 4 && z % 9 === 4 && c.r + 2 < H) {
    g.set(x, c.r, z, "light_gray_concrete");
    g.set(x, c.r + 1, z, "light_gray_concrete");
  }
}

// Entrance: stone surround, lintel, lamps and a dark oak double door
if (entrance) {
  const { x, z, c } = entrance;
  const base = c.g;
  const facing = "north";
  // Door opening
  g.set(x, base + 1, z, "dark_oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, base + 2, z, "dark_oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  // Piers and lintel
  for (const dx of [-1, 1]) {
    const n = get(x + dx, z);
    if (n && n.r > base) {
      g.set(x + dx, base + 1, z, "white_concrete");
      g.set(x + dx, base + 2, z, "white_concrete");
      g.set(x + dx, base + 3, z, "stone_bricks");
      g.set(x + dx, base + 1, z - 1, "lantern", { facing: "north", hanging: "false", waterlogged: "false" });
    }
  }
  for (let dx = -1; dx <= 1; dx++) {
    g.set(x + dx, base + 3, z, "stone_bricks");
    g.set(x + dx, base + 4, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
