import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw661755097";
const W = 13, H = 43, D = 19;
const ROOF = 30;      // roof deck index, 30 blocks above lowest ground
const PARAPET = 31;   // parapet course, roof top about 31 above lowest ground

// Cells: [x, z, ground]. Ground made relative to the lowest ground under the footprint.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map(c => c[2]));
const key = (x, z) => `${x},${z}`;
const cells = raw.map(([x, z, g]) => ({ x, z, g: g - minG, exp: [], d: 99, door: false }));
const map = new Map(cells.map(c => [key(c.x, c.z), c]));
const has = (x, z) => map.has(key(x, z));

const DIRS = [[0, -1, "north"], [0, 1, "south"], [1, 0, "east"], [-1, 0, "west"]];

// Exposed faces (neighbour outside the footprint)
for (const c of cells) {
  c.exp = DIRS.filter(([dx, dz]) => !has(c.x + dx, c.z + dz));
}

// Depth from outside (1 = perimeter, 2 = one cell in, ...)
const depth = new Map();
const queue = [];
for (const c of cells) {
  if (c.exp.length) { depth.set(key(c.x, c.z), 1); queue.push(c); }
}
while (queue.length) {
  const c = queue.shift();
  const d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const n = map.get(key(c.x + dx, c.z + dz));
    if (n && !depth.has(key(n.x, n.z))) {
      depth.set(key(n.x, n.z), d + 1);
      queue.push(n);
    }
  }
}
for (const c of cells) c.d = depth.get(key(c.x, c.z)) ?? 99;

// Entrance: outward-north (min z) perimeter cell, median x
let doorCell = null;
{
  const cand = cells.filter(c => c.d === 1 && c.exp.some(([dx, dz]) => dz === -1));
  const pool = cand.length ? cand : cells.filter(c => c.d === 1 && c.exp.length);
  if (pool.length) {
    const minZ = Math.min(...pool.map(c => c.z));
    const row = pool.filter(c => c.z === minZ).sort((a, b) => a.x - b.x);
    doorCell = row[Math.floor(row.length / 2)];
    doorCell.door = true;
    doorCell.doorDir = doorCell.exp.some(([, dz]) => dz === -1)
      ? "north"
      : doorCell.exp[0][2];
  }
}

// Mullion test for a perimeter cell
function isMullion(c) {
  const zFace = c.exp.some(([, dz]) => dz !== 0);
  const xFace = c.exp.some(([dx]) => dx !== 0);
  if (zFace && xFace) return true;               // corner
  if (zFace && c.x % 3 === 0) return true;       // north/south face bays
  if (xFace && c.z % 3 === 0) return true;       // east/west face bays
  return false;
}

// Is this perimeter cell at height y a glass window?
function isGlass(c, y) {
  if (c.d !== 1 || !c.exp.length || c.door) return false;
  if (y <= c.g || y > ROOF - 1) return false;
  const r = y % 5;
  if (r < 1 || r > 3) return false;
  return !isMullion(c);
}

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => (p ? g.set(x, y, z, b, p) : g.set(x, y, z, b));

// 1. Foundations and interior floor slabs
for (const c of cells) {
  for (let y = 0; y < c.g; y++) put(c.x, y, c.z, "stone_bricks");
  if (c.d >= 2) {
    if (c.g <= ROOF) put(c.x, c.g, c.z, "smooth_quartz");           // ground floor slab
    for (let y = c.g + 1; y < ROOF; y++) {
      if (y % 5 === 0) put(c.x, y, c.z, "smooth_quartz");           // storey slabs
    }
  }
}

// 2. Perimeter shell: granite base, quartz walls, glass bays, bands, spandrels
for (const c of cells) {
  if (c.d !== 1) continue;
  for (let y = c.g; y < ROOF; y++) {
    const k = Math.floor(y / 5);
    const r = y % 5;
    let b;
    if (y === c.g) {
      b = "polished_granite";
    } else if (r === 0) {
      b = k === 0 ? "polished_granite" : "smooth_quartz";
    } else if (r === 4) {
      b = k === 0 ? "polished_granite" : "white_concrete";
    } else {
      if (isGlass(c, y)) b = "light_blue_stained_glass";
      else b = k === 0 ? "polished_granite" : (isMullion(c) ? "quartz_pillar" : "quartz_block");
    }
    put(c.x, y, c.z, b);
  }
}

// 3. Entrance: double door, granite lintel above
if (doorCell) {
  const f = doorCell.doorDir;
  put(doorCell.x, doorCell.g + 1, doorCell.z, "dark_oak_door",
    { facing: f, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(doorCell.x, doorCell.g + 2, doorCell.z, "dark_oak_door",
    { facing: f, half: "upper", hinge: "left", open: "false", powered: "false" });
  put(doorCell.x, doorCell.g + 3, doorCell.z, "polished_granite");
}

// 4. Roof deck, parapet, rooftop plant
for (const c of cells) {
  if (c.g <= ROOF) put(c.x, ROOF, c.z, "gray_concrete");
  if (c.d === 1) put(c.x, PARAPET, c.z, "smooth_quartz");
  if (c.d >= 3 && c.x >= 3 && c.x <= 9) {
    put(c.x, PARAPET + 1, c.z, "light_gray_concrete");
    put(c.x, PARAPET + 2, c.z, "light_gray_concrete");
    put(c.x, PARAPET + 3, c.z, "gray_concrete");
  }
}

// 5. Warm lights in the air gap behind some windows (glowstone at depth 2)
for (const c of cells) {
  if (c.d !== 2) continue;
  for (let y = c.g + 1; y < ROOF; y++) {
    if (y % 5 !== 2) continue;
    if ((c.x * 7 + c.z * 3 + y) % 3 !== 0) continue;
    const behindGlass = DIRS.some(([dx, dz]) => {
      const p = map.get(key(c.x + dx, c.z + dz));
      return p && isGlass(p, y);
    });
    if (behindGlass) put(c.x, y, c.z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
