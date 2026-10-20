import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const W = 19, H = 24, D = 11;

const raw = JSON.parse(readFileSync(`${DIR}/NYC3000028.cells.json`, "utf8"));
const rows = (Array.isArray(raw) ? raw : (raw.cells ?? []))
  .map(c => (Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof]));

const minGround = Math.min(...rows.map(r => r[2]));
const cellsRaw = [];
for (const [x, z, gr, rf] of rows) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gy = Math.round(gr - minGround);
  const ry = Math.round(rf - minGround);
  cellsRaw.push({ x, z, gy, ry });
}

// One smoothed roof level for the whole block: median lidar roof, even storeys
const sortedRy = cellsRaw.map(c => c.ry).sort((a, b) => a - b);
const medRy = sortedRy[Math.floor(sortedRy.length / 2)] ?? 12;
const storeys = Math.min(7, Math.max(4, Math.round((medRy - Math.min(...cellsRaw.map(c => c.gy))) / 2)));
const roofLevel = Math.min(H - 6, Math.max(...cellsRaw.map(c => c.gy)) + 2 * storeys);

const cell = new Map();
for (const c of cellsRaw) {
  const top = Math.max(c.gy + 4, roofLevel);
  cell.set(`${c.x},${c.z}`, { gy: c.gy, top: Math.min(H - 6, top) });
}

const inFP = (x, z) => cell.has(`${x},${z}`);
const DIRS = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
];
const exposedFaces = (x, z) => DIRS.filter(d => !inFP(x + d.dx, z + d.dz));

const g = new Voxels([W, H, D]);

// Pass 1: foundation, brick body, roof surface, brick parapet
for (const [key, { gy, top }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const exp = exposedFaces(x, z).length > 0;
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");
  for (let y = gy; y <= top - 2; y++) g.set(x, y, z, "bricks");
  g.set(x, top - 1, z, exp ? "stone_bricks" : "smooth_stone");
  if (exp) g.set(x, top, z, "bricks");
}

// Pass 2: facades on exposed faces
const windows = [];
for (const [key, { gy, top }] of cell) {
  const [x, z] = key.split(",").map(Number);
  for (const d of exposedFaces(x, z)) {
    const along = d.dz !== 0 ? x : z;
    const L = d.dz !== 0 ? W : D;
    const isEnd = along === 0 || along === L - 1;
    const pier = isEnd || along % 3 === 0;
    for (let y = gy; y <= top - 2; y++) {
      const rel = y - gy;
      if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }      // base course
      if (rel % 2 === 0) { g.set(x, y, z, "bricks"); continue; }        // floor line in brick
      if (rel === 1) {
        // shopfront: glass bays between stone piers
        if (!isEnd && along % 3 !== 0) {
          g.set(x, y, z, "glass_pane");
          windows.push([x, y, z, d]);
        } else {
          g.set(x, y, z, "stone_bricks");
        }
      } else {
        if (pier) {
          g.set(x, y, z, "bricks");
        } else {
          const lit = ((along * 5 + rel + x + z) % 4 === 0);
          g.set(x, y, z, lit ? "glowstone" : "glass_pane");
          windows.push([x, y, z, d]);
        }
      }
    }
    // stone cornice course under the parapet
    g.set(x, top - 1, z, "stone_bricks");
    g.set(x, top - 2, z, "stone_bricks");
  }
}

// Air gap behind glass
for (const [x, y, z, d] of windows) {
  const ix = x - d.dx, iz = z - d.dz;
  if (inFP(ix, iz)) g.set(ix, y, iz, "air");
}

// Entrance on the first exposed street face, centred
const mid = Math.floor(W / 2);
const midZ = Math.floor(D / 2);
let doorDone = false;
for (const d of DIRS) {
  if (doorDone) break;
  for (const [key, { gy, top }] of cell) {
    if (doorDone) break;
    const [x, z] = key.split(",").map(Number);
    const along = d.dz !== 0 ? x : z;
    const target = d.dz !== 0 ? mid : midZ;
    if (along !== target) continue;
    if (inFP(x + d.dx, z + d.dz)) continue;
    if (top < gy + 4) continue;
    g.set(x, gy + 1, z, "dark_oak_door", { facing: d.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gy + 2, z, "dark_oak_door", { facing: d.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
    const ix = x - d.dx, iz = z - d.dz;
    if (inFP(ix, iz)) {
      g.set(ix, gy + 1, iz, "air");
      g.set(ix, gy + 2, iz, "air");
    }
    doorDone = true;
  }
}

// Roof equipment: two brick stacks and a mechanical housing
const roofSpots = [[5, 4, 2], [13, 6, 1]];
for (const [rx, rz, h] of roofSpots) {
  const c = cell.get(`${rx},${rz}`);
  if (!c) continue;
  if (exposedFaces(rx, rz).length) continue;
  const { top } = c;
  if (top + h + 1 >= H) continue;
  for (let k = 0; k < h; k++) g.set(rx, top + k, rz, "bricks");
  g.set(rx, top + h, rz, "stone_bricks");
}

g.save(`${DIR}/NYC3000028.nbt`);
