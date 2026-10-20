import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source record. Decision from the lidar roof height (~21 blocks):
// a 1980s-90s Taipei commercial/residential mid-rise, four storeys of 5 blocks,
// cream tiled quartz walls with grey concrete floor lines, a stone plinth,
// ground-floor shopfronts with a central entrance on the +z facade, a
// cornice and parapet, and a rooftop water tank and stair house.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1067738222";
const W = 18, H = 33, D = 25;
const ROOF = 21;          // parapet top, relative to lowest ground
const CORNICE_Y = 20;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const minG = Math.min(...raw.map((c) => c[2]));

const ground = new Map();
for (const [x, z, gr] of raw) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground.set(`${x},${z}`, Math.round(gr - minG));
  }
}

const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Outward facade normal and tangential coordinate for each edge cell
const edgeInfo = new Map();
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  let nx = 0, nz = 0, t = 0;
  if (!has(x - 1, z)) { nx = -1; t = z; }
  else if (!has(x + 1, z)) { nx = 1; t = z; }
  else if (!has(x, z - 1)) { nz = -1; t = x; }
  else { nz = 1; t = x; }
  edgeInfo.set(key, { x, z, nx, nz, t, gr });
}

// Main entrance on the +z facade (fallback: first available facade)
let entry = { nx: 0, nz: 1 };
let entryCells = [...edgeInfo.values()].filter((e) => e.nx === 0 && e.nz === 1);
if (entryCells.length === 0) {
  const first = [...edgeInfo.values()][0];
  entry = { nx: first.nx, nz: first.nz };
  entryCells = [...edgeInfo.values()].filter((e) => e.nx === entry.nx && e.nz === entry.nz);
}
const tc = entryCells.length
  ? Math.round(entryCells.reduce((s, e) => s + e.t, 0) / entryCells.length)
  : 0;

const facingOf = (nx, nz) => ({
  "-1,0": "west", "1,0": "east", "0,-1": "north", "0,1": "south",
})[`${nx},${nz}`];

// 1. Foundation, interior floors
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  if (!isEdge(x, z)) {
    put(x, gr, z, "gray_concrete");
    for (const s of [1, 2, 3, 4]) {
      const fy = 5 * s;
      if (fy >= gr && fy <= CORNICE_Y) put(x, fy, z, "gray_concrete");
    }
  }
}

// 2. Facades, entrance, cornice, parapet, warm lights
for (const e of edgeInfo.values()) {
  const { x, z, nx, nz, t, gr } = e;
  const isEntry = nx === entry.nx && nz === entry.nz && Math.abs(t - tc) <= 1;

  for (let y = gr; y <= ROOF; y++) {
    if (y === CORNICE_Y) { put(x, y, z, "gray_concrete"); continue; }
    if (y === ROOF) { put(x, y, z, "smooth_quartz"); continue; }

    if (isEntry && y >= gr && y <= gr + 3) {
      if (y === gr) { put(x, y, z, "stone_bricks"); continue; }
      if (y === gr + 1 || y === gr + 2) {
        const half = y === gr + 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", {
          facing: facingOf(nx, nz),
          half,
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      put(x, y, z, "smooth_quartz"); // lintel
      continue;
    }

    const s = Math.min(3, Math.floor(y / 5));
    const r = y - 5 * s;
    const bay = t % 3 !== 0;

    if (y === gr && y < 5) { put(x, y, z, "stone_bricks"); continue; }
    if (r === 0) { put(x, y, z, "gray_concrete"); continue; }
    if (r === 4) { put(x, y, z, "smooth_quartz"); continue; }

    if (bay) {
      put(x, y, z, "light_blue_stained_glass");
      if (r === 2 && (t + s) % 4 === 1) {
        const ix = x - nx, iz = z - nz;
        if (has(ix, iz) && !isEdge(ix, iz) && y >= gAt(ix, iz)) {
          put(ix, y, iz, "glowstone");
        }
      }
    } else {
      put(x, y, z, "smooth_quartz");
    }
  }
}

// 3. Rooftop equipment on interior roof cells
const fits = (x0, z0, w, d, taken) => {
  for (let x = x0; x < x0 + w; x++) {
    for (let z = z0; z < z0 + d; z++) {
      if (!has(x, z) || isEdge(x, z) || gAt(x, z) > CORNICE_Y) return false;
      if (taken.has(`${x},${z}`)) return false;
    }
  }
  return true;
};
const markRect = (x0, z0, w, d, set) => {
  for (let x = x0; x < x0 + w; x++)
    for (let z = z0; z < z0 + d; z++) set.add(`${x},${z}`);
};

const taken = new Set();

// Water tank: 4x4 ring of white concrete, grey lid
let tank = null;
search: for (let x0 = 1; x0 < W; x0++) {
  for (let z0 = 1; z0 < D; z0++) {
    if (fits(x0, z0, 4, 4, taken)) { tank = { x0, z0 }; break search; }
  }
}
if (tank) {
  const { x0, z0 } = tank;
  markRect(x0, z0, 4, 4, taken);
  for (let y = ROOF; y <= ROOF + 2; y++) {
    for (let x = x0; x < x0 + 4; x++) {
      for (let z = z0; z < z0 + 4; z++) {
        const edge = x === x0 || x === x0 + 3 || z === z0 || z === z0 + 3;
        if (edge) put(x, y, z, "white_concrete");
      }
    }
  }
  for (let x = x0; x < x0 + 4; x++)
    for (let z = z0; z < z0 + 4; z++) put(x, ROOF + 3, z, "gray_concrete");
}

// Stair/lift house: 3x3 smooth quartz block, grey roof
let stair = null;
search2: for (let x0 = 1; x0 < W; x0++) {
  for (let z0 = 1; z0 < D; z0++) {
    if (fits(x0, z0, 3, 3, taken)) { stair = { x0, z0 }; break search2; }
  }
}
if (stair) {
  const { x0, z0 } = stair;
  markRect(x0, z0, 3, 3, taken);
  for (let y = ROOF; y <= ROOF + 3; y++) {
    for (let x = x0; x < x0 + 3; x++) {
      for (let z = z0; z < z0 + 3; z++) {
        const edge = x === x0 || x === x0 + 2 || z === z0 || z === z0 + 2;
        if (edge) put(x, y, z, "smooth_quartz");
      }
    }
  }
  for (let x = x0; x < x0 + 3; x++)
    for (let z = z0; z < z0 + 3; z++) put(x, ROOF + 4, z, "gray_concrete");
}

g.save(`${DIR}/${ID}.nbt`);
