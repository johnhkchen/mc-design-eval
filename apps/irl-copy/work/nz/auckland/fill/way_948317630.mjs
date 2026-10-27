// Mt Eden / Eden Terrace, 11 x 11 footprint, three floors on the core and a two-storey ring around it.
// Read from the cells file: ground is flat at y 0, roof heights 10-12 (lidar). The 12-high core is a 1930s-style
// commercial block (cream plaster piers, stone plinth and string courses, green glazed Deco cornice, glass
// shopfront), and the 10-high ring is its lower wing. Facades are shells two cells thick: the outer cell is the
// skin (piers, trim, glass), the cell behind a window is air (or a glowstone lamp), and the interior is open air
// with a floor plate every 4 blocks. No interiors; every plate and roof stands on the course below.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const F = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_948317630";
const cells = JSON.parse(readFileSync(`${F}.cells.json`, "utf8"));

const W = 11, D = 11, TOP = 25;
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const key = (x, z) => `${x},${z}`;
const cell = new Map();
for (const [x, z, g, r] of cells) cell.set(key(x, z), { x, z, g, r });
const has = (x, z) => cell.has(key(x, z));
const exposed = (c) => Object.entries(DIRS).filter(([, [dx, dz]]) => !has(c.x + dx, c.z + dz)).map(([n]) => n);

// Flat tiers from the lidar: the interior roof is 12 (core), the edge ring and corners 10-11 (wing).
const H = (c) => (c.r >= 12 ? 12 : 10);

// Shell depth: 0 = outer skin, 1 = the cell behind it, 2+ = open interior.
const depth = new Map();
const queue = [];
for (const c of cell.values()) if (exposed(c).length) { depth.set(key(c.x, c.z), 0); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of Object.values(DIRS)) {
    const n = cell.get(key(c.x + dx, c.z + dz));
    if (n && !depth.has(key(n.x, n.z))) { depth.set(key(n.x, n.z), d + 1); queue.push(n); }
  }
}
const d0 = (c) => depth.get(key(c.x, c.z));

// The street front: the outward face with the most skin, and its door at a window column near the middle.
const count = { north: 0, south: 0, west: 0, east: 0 };
for (const c of cell.values()) if (d0(c) === 0) for (const n of exposed(c)) count[n]++;
const front = Object.keys(count).sort((a, b) => count[b] - count[a])[0];
const alongFront = (c) => (front === "north" || front === "south" ? c.x : c.z);
const isCorner = (c) => exposed(c).length >= 2;
const isPier = (c) => isCorner(c) || alongFront(c) % 3 === 0;
const frontRun = [...cell.values()].filter((c) => d0(c) === 0 && exposed(c).includes(front) && !isCorner(c));
const doorCands = frontRun.filter((c) => !isPier(c)).sort((a, b) => alongFront(a) - alongFront(b));
const doorCell = doorCands[Math.floor(doorCands.length / 2)];
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;
const doorFacing = front;
const canopyKeys = new Set(
  frontRun.filter((c) => Math.abs(alongFront(c) - alongFront(doorCell)) <= 1).map((c) => key(c.x, c.z)),
);

const g = new Voxels([W, TOP, D]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Pass 1: the skin (depth 0) decides which cells are windows, so the cell behind each one can open.
const windows = new Set(); // "x,y,z" of cells whose inner neighbour is air or a lamp
for (const c of cell.values()) {
  if (d0(c) !== 0) continue;
  const h = H(c);
  for (let y = 0; y < h; y++) {
    const r = y % 4;
    if (y === 0 || y === 4 || y === 8 || y === h - 1 || r === 0) continue;
    if (r >= 2 && !isPier(c)) windows.add(`${c.x},${y},${c.z}`);
  }
}
if (doorCell) { windows.add(`${doorCell.x},1,${doorCell.z}`); windows.add(`${doorCell.x},2,${doorCell.z}`); }

// A warm lamp behind roughly a quarter of the windows, placed by a fixed hash so the render is reproducible.
const lampAt = (x, y, z) => (x * 3 + y * 5 + z * 7) % 4 === 0;
const behindWindow = (x, y, z) =>
  Object.values(DIRS).some(([dx, dz]) => windows.has(`${x + dx},${y},${z + dz}`));

for (const c of cell.values()) {
  const dd = d0(c), h = H(c), { x, z } = c;
  for (let y = 0; y < h; y++) {
    const r = y % 4;
    const top = y === h - 1;
    if (y === 0) { put(x, y, z, dd === 0 ? "polished_andesite" : "smooth_stone"); continue; } // base course + ground floor plate
    if (y === 4 || y === 8) { put(x, y, z, dd === 0 ? "smooth_quartz" : "smooth_stone"); continue; } // floor plates = storey lines
    if (top) { put(x, y, z, dd === 0 ? "cyan_glazed_terracotta" : "smooth_stone"); continue; } // Deco cornice / roof membrane
    if (dd >= 2) continue; // open interior
    if (dd === 1) {
      if (behindWindow(x, y, z)) { if (lampAt(x, y, z)) put(x, y, z, "glowstone"); continue; } // air gap behind glass
      put(x, y, z, "white_terracotta"); continue;
    }
    // skin
    const key3 = `${x},${y},${z}`;
    if (doorKey === key(x, z) && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: doorFacing, half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }
    if (doorKey && canopyKeys.has(key(x, z)) && y === 3) { put(x, y, z, "cyan_glazed_terracotta"); continue; }
    if (r === 1) { put(x, y, z, y === 1 ? "polished_andesite" : "smooth_quartz"); continue; } // sill / plinth course
    if (isPier(c)) { put(x, y, z, isCorner(c) ? "smooth_quartz" : "white_terracotta"); continue; }
    if (windows.has(key3)) { put(x, y, z, "glass"); continue; }
  }
}

// Roof plant on the core: a small two-high box of light concrete, set on the roof membrane.
for (const c of cell.values()) {
  if (H(c) !== 12 || d0(c) < 2) continue;
  if (c.x >= 4 && c.x <= 5 && c.z >= 5 && c.z <= 6) { put(c.x, 12, c.z, "light_gray_concrete"); put(c.x, 13, c.z, "light_gray_concrete"); }
}

g.save(`${F}.nbt`);
