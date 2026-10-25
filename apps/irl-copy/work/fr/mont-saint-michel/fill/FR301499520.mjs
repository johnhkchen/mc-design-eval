import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499520";
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const arr = Array.isArray(raw) ? raw : raw.cells;

const W = 20, HH = 22, D = 54;
const g = new Voxels([W, HH, D]);

// Materials: 1850 annex, render walls, stone base and cornice, slate roof
const WALL = "smooth_sandstone";
const BASE = "stone_bricks";
const FILL = "deepslate_bricks";
const SLATE_STAIR = "deepslate_tile_stairs";
const SILL = "smooth_sandstone_slab";
const CHIMNEY = "bricks";
const STOREY = 5;

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= HH || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const med = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };

// Footprint map
const cm = new Map();
for (const [x, z, gr, rf] of arr) cm.set(`${x},${z}`, { x, z, gr, rf });
const has = (x, z) => cm.has(`${x},${z}`);
const cellList = [...cm.values()];
const Wd = Math.max(...cellList.map(c => c.x)) + 1;
const Dd = Math.max(...cellList.map(c => c.z)) + 1;
const minZ = Math.min(...cellList.map(c => c.z));
const maxZ = Math.max(...cellList.map(c => c.z));
const kmax = Math.floor((Wd - 1) / 2);

// Roof height above the annex ground for the 1-storey massing (from lidar medians)
const medGr = med(cellList.map(c => c.gr));
const medRf = med(cellList.map(c => c.rf));
const H = clamp(Math.round(medRf - (medGr + STOREY)), 3, 9);

// ---- Massing: foundation, walls, gable roof with stair courses ----
const ground = new Map();
for (const c of cellList) {
  const { x, z } = c;
  const g0 = clamp(c.gr, 0, HH - 8);
  ground.set(`${x},${z}`, g0);

  for (let y = 0; y < g0; y++) put(x, y, z, BASE);      // foundation
  put(x, g0, z, BASE);                                   // base course
  const e = g0 + STOREY;                                 // eave of the single storey
  // storey line just above the base, then render walls
  put(x, g0 + 2, z, BASE);
  for (let y = g0 + 1; y <= e - 2; y++) if (y !== g0 + 2) put(x, y, z, WALL);
  // continuous stone cornice band across the whole wall top
  put(x, e - 1, z, BASE);

  // Roof: gable running along z, pitch rising to ridge H above eave
  const k = Math.min(x, Wd - 1 - x);
  const s = Math.max(1, Math.round(H * (k + 1) / (kmax + 1)));
  const gableEnd = !has(x, z - 1) || !has(x, z + 1);
  for (let y = e; y <= e + s - 2; y++) put(x, y, z, gableEnd ? WALL : FILL);
  const facing = x < Wd / 2 ? "west" : "east";
  put(x, e + s - 1, z, SLATE_STAIR, { facing, half: "bottom", shape: "straight", waterlogged: "false" });
}

// ---- Entrance on the north (z-min) face, nearest the middle ----
const doorCands = cellList.filter(c => c.z === minZ).sort((a, b) => Math.abs(a.x - Wd / 2) - Math.abs(b.x - Wd / 2));
const door = doorCands[0];
const used = new Set();
if (door) {
  const g0 = ground.get(`${door.x},${door.z}`);
  put(door.x, g0, door.z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, g0 + 1, door.z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  used.add(`${door.x},${door.z}`);
}

// ---- Windows: glass panes with sills; some lit by a lantern in an air gap behind ----
const paneX = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneZ = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

function windowAt(c, axis, dir, lit) {
  const g0 = ground.get(`${c.x},${c.z}`);
  const pane = axis === "x" ? paneX : paneZ;
  for (const y of [g0 + 2, g0 + 3]) {
    if (y === g0 + 2) continue; // keep the storey line row intact on this cell
    put(c.x, y, c.z, "glass_pane", pane);
  }
  put(c.x, g0 + 1, c.z, SILL, { type: "bottom", waterlogged: "false" });
  used.add(`${c.x},${c.z}`);
  if (lit) {
    const ix = axis === "x" ? c.x + dir : c.x;
    const iz = axis === "z" ? c.z + dir : c.z;
    if (has(ix, iz)) {
      put(ix, g0 + 2, iz, "air");
      put(ix, g0 + 3, iz, "air");
      put(ix, g0 + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
}

for (const c of cellList) {
  const key = `${c.x},${c.z}`;
  if (used.has(key)) continue;
  if (!has(c.x - 1, c.z) && c.z % 4 === 2) { windowAt(c, "x", 1, c.z % 8 === 2); continue; }
  if (!has(c.x + 1, c.z) && c.z % 4 === 2) { windowAt(c, "x", -1, c.z % 8 === 2); continue; }
  if (c.z === minZ && c.x % 4 === 2) { windowAt(c, "z", 1, c.x % 8 === 6); continue; }
  if (c.z === maxZ && c.x % 4 === 2) { windowAt(c, "z", -1, c.x % 8 === 6); continue; }
}

// ---- Roof equipment: a brick chimney on the ridge, near mid-length ----
const midZ = Math.floor((Dd - 1) / 2);
const ridgeCands = cellList.filter(c => c.x === Math.floor(Wd / 2) - 1 || c.x === Math.floor(Wd / 2))
  .sort((a, b) => Math.abs(a.z - midZ) - Math.abs(b.z - midZ));
if (ridgeCands.length) {
  const r = ridgeCands[0];
  const g0 = ground.get(`${r.x},${r.z}`);
  const e = g0 + STOREY;
  put(r.x, e + H, r.z, CHIMNEY);
  put(r.x, e + H + 1, r.z, CHIMNEY);
}

g.save(`${DIR}/${ID}.nbt`);
