import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw827011421";
const W = 22, H = 38, D = 19;
const STOREY = 5;     // blocks per storey
const ROOF = 25;      // roof slab level
const PARAPET = 26;   // parapet course on the roof edge
const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));

// Footprint: [x, z, ground] per cell. Fall back to a flat rectangle if the file is missing.
let raw = [];
try {
  raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
} catch {
  raw = [];
}
const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, clamp(Math.round(gr), 0, 30));
}
if (ground.size === 0) {
  for (let x = 0; x < W; x++) for (let z = 0; z < D; z++) ground.set(`${x},${z}`, 0);
}

const has = (x, z) => ground.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) =>
  (!has(x - 1, z) && !has(x, z - 1)) || (!has(x + 1, z) && !has(x, z - 1)) ||
  (!has(x - 1, z) && !has(x, z + 1)) || (!has(x + 1, z) && !has(x, z + 1));

const g = new Voxels([W, H, D]);

// Main body: concrete-framed office block with ribbon glazing, 5 storeys on a granite base.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const pier = (x + z) % 3 === 0;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Body from the cell's ground up to the roof slab.
  for (let y = gr; y <= ROOF; y++) {
    const s = Math.floor(y / STOREY);
    const r = y % STOREY;

    if (r === 0 || y === gr) {
      // Floor slab / storey line. Lowest course on the facade is the granite base.
      if (edge && y === 0) g.set(x, y, z, "polished_granite");
      else g.set(x, y, z, "smooth_quartz");
      continue;
    }

    if (!edge) continue; // interior stays open air: no interiors

    if (corner || r === 4) {
      // Corner columns and spandrel bands.
      g.set(x, y, z, "white_concrete");
    } else if (pier) {
      // Mullions between window bays.
      g.set(x, y, z, "white_concrete");
    } else if (s === 0) {
      // Ground-floor shopfront glass.
      g.set(x, y, z, "light_blue_stained_glass");
    } else if (r === 2 && (x * 5 + z * 3 + s * 7) % 9 === 0) {
      // Warm light behind some upper-floor windows.
      g.set(x, y, z, "glowstone");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }
}

// Street entrance on the z = 0 face: glazed door bay with a flat canopy.
for (let x = 9; x <= 12; x++) {
  if (!has(x, 0)) continue;
  for (let y = 1; y <= 3; y++) {
    if (y < ground.get(`${x},0`)) continue;
    if (x === 9 || x === 12) g.set(x, y, 0, "smooth_quartz");
    else g.set(x, y, 0, "glass");
  }
}
for (let x = 8; x <= 13; x++) {
  for (let z = 0; z <= 1; z++) {
    if (!has(x, z)) continue;
    if (4 < ground.get(`${x},${z}`)) continue;
    g.set(x, 4, z, "smooth_stone");
  }
}

// Roof parapet on the perimeter.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  if (gr > PARAPET) continue;
  g.set(x, PARAPET, z, "white_concrete");
}

// Roof plant: a penthouse core with glazed sides, a cap, and a lightning rod.
const coreX0 = 7, coreX1 = 14, coreZ0 = 6, coreZ1 = 12;
let coreOk = true;
for (let x = coreX0; x <= coreX1; x++)
  for (let z = coreZ0; z <= coreZ1; z++)
    if (!has(x, z)) coreOk = false;

if (coreOk) {
  for (let x = coreX0; x <= coreX1; x++) {
    for (let z = coreZ0; z <= coreZ1; z++) {
      const boundary = x === coreX0 || x === coreX1 || z === coreZ0 || z === coreZ1;
      for (let y = PARAPET; y <= 29; y++) {
        if (boundary) {
          const isPier = (x + z) % 3 === 0 || x === coreX0 || x === coreX1 && z === coreZ0;
          if (y === PARAPET || y === 29 || isPier) g.set(x, y, z, "light_gray_concrete");
          else g.set(x, y, z, "light_blue_stained_glass");
        }
      }
      g.set(x, 30, z, "smooth_quartz");
    }
  }
  g.set(10, 31, 9, "lightning_rod");
  g.set(11, 31, 9, "lightning_rod");
}

// Mechanical boxes on the roof.
const boxes = [[3, 3], [16, 13]];
for (const [bx, bz] of boxes) {
  for (let x = bx; x <= bx + 1; x++) {
    for (let z = bz; z <= bz + 1; z++) {
      if (!has(x, z)) continue;
      g.set(x, PARAPET, z, "gray_concrete");
      g.set(x, PARAPET + 1, z, "gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
