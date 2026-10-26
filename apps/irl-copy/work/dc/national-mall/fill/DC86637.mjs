import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86637";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 39, H = 37, D = 19;
const STOREY = 3;
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const key = (x, z) => x + "," + z;
const cellMap = new Map();
for (const [x, z, gr, rf] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(key(x, z), {
    ground: Math.max(0, Math.round(gr)),
    roof: Math.round(rf),
  });
}
const inF = (x, z) => cellMap.has(key(x, z));
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isBoundary = (x, z) => NB.some(([dx, dz]) => !inF(x + dx, z + dz));
const innerNeighbour = (x, z) => {
  for (const [dx, dz] of NB) {
    const nx = x + dx, nz = z + dz;
    if (inF(nx, nz) && !isBoundary(nx, nz)) return [nx, nz];
  }
  return null;
};

// ---- smooth lidar roof heights: neighbourhood median, then whole storeys ----
// Removes single-cell spikes and produces clean stepped tiers.
const smoothRoof = new Map();
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const vals = [];
  for (let dx = -2; dx <= 2; dx++) {
    for (let dz = -2; dz <= 2; dz++) {
      const n = cellMap.get(key(x + dx, z + dz));
      if (n) vals.push(n.roof - n.ground);
    }
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  const storeys = Math.max(1, Math.min(8, Math.round(med / STOREY)));
  smoothRoof.set(k, c.ground + storeys * STOREY);
}

// ---- entrance: middle of the outer row on the minimum-z side ----------------
let minZ = Infinity;
for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isBoundary(x, z) && z < minZ) minZ = z;
}
const frontXs = [];
for (const k of cellMap.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (isBoundary(x, z) && z === minZ) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const entranceX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : -1;
const entranceZ = minZ;

// Tallest tier, used for the single penthouse
let maxTop = 0;
for (const v of smoothRoof.values()) maxTop = Math.max(maxTop, v);

// ---- massing and articulation -----------------------------------------------
for (const [k, c] of cellMap) {
  const [x, z] = k.split(",").map(Number);
  const ground = c.ground;
  const top = Math.min(smoothRoof.get(k), H - 4);
  const bnd = isBoundary(x, z);

  // foundation fill from y0 to the cell's ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  // storeys
  for (let y = ground; y < top; y++) {
    const rel = y - ground;
    const k2 = Math.floor(rel / STOREY);
    const r3 = rel % STOREY;
    const ground1 = k2 === 0;

    if (!bnd) {
      if (r3 === 0) g.set(x, y, z, "light_gray_concrete");
      continue;
    }

    if (r3 === 0) {
      // floor slab line; a projecting string course on each storey
      g.set(x, y, z, ground1 ? "polished_granite" : "stone");
      continue;
    }

    const pier = (x % 3 === 0) || (z % 3 === 0);
    if (pier) {
      g.set(x, y, z, ground1 ? "polished_granite" : "white_concrete");
      continue;
    }

    const tinted = (x + z + k2) % 4 === 0;
    g.set(x, y, z, tinted ? "light_blue_stained_glass" : "gray_stained_glass");

    if (r3 === 1 && (x + z + k2) % 5 === 0) {
      const inner = innerNeighbour(x, z);
      if (inner) g.set(inner[0], y, inner[1], "glowstone");
    }
  }

  // roof slab over interior cells
  if (!bnd) g.set(x, top - 1, z, "smooth_stone");

  // cornice: projecting cap band, then a parapet course above it
  if (bnd) {
    g.set(x, top, z, "stone_bricks");
    g.set(x, top + 1, z, "light_gray_concrete");
  }
}

// ---- one stepped penthouse on the tallest tier (replaces scattered cubes) --
const phCells = [];
for (const [k, top] of smoothRoof) {
  if (top >= maxTop) {
    const [x, z] = k.split(",").map(Number);
    phCells.push([x, z]);
  }
}
if (phCells.length) {
  const xs = phCells.map(p => p[0]), zs = phCells.map(p => p[1]);
  const cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  const cz = (Math.min(...zs) + Math.max(...zs)) / 2;
  for (const [x, z] of phCells) {
    if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 2 && !isBoundary(x, z)) {
      g.set(x, maxTop, z, "light_gray_concrete");
      g.set(x, maxTop + 1, z, "light_gray_concrete");
      if (Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1) {
        g.set(x, maxTop + 2, z, "light_gray_concrete");
      }
    }
  }
}

// ---- entrance: double door with a header and stone surround -----------------
if (entranceX >= 0 && cellMap.has(key(entranceX, entranceZ))) {
  const c = cellMap.get(key(entranceX, entranceZ));
  const gy = c.ground;
  const doorProps = (half) => ({
    facing: "north",
    half,
    hinge: "left",
    open: "false",
    powered: "false",
  });
  g.set(entranceX, gy, entranceZ, "dark_oak_door", doorProps("lower"));
  g.set(entranceX, gy + 1, entranceZ, "dark_oak_door", doorProps("upper"));
  g.set(entranceX, gy + 2, entranceZ, "light_gray_concrete");
  g.set(entranceX, gy + 3, entranceZ, "polished_granite");
}

g.save(`${DIR}/${ID}.nbt`);
