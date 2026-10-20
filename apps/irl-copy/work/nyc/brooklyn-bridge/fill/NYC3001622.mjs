import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001622";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 10 x 23 x 6 footprint volume (x 0..9, z 0..5)
const W = 10, H = 23, D = 6;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const ground = Math.max(0, Math.round(gr));
  minG = Math.min(minG, ground);
  map.set(key(x, z), { x, z, gr: ground });
}
if (!isFinite(minG)) minG = 0;

// Flat roof: lowest ground + 11 blocks (record), on an even course so storeys stack in 2s
const ROOF = Math.min(H - 1, 2 * Math.round((minG + 11) / 2));
for (const c of map.values()) {
  c.T = Math.max(ROOF, c.gr + 6);
}
const has = (x, z) => map.has(key(x, z));
const get = (x, z) => map.get(key(x, z));

const DIRS = [
  { dx: 0, dz: -1 }, // north (street side, low z)
  { dx: 0, dz: 1 },
  { dx: -1, dz: 0 },
  { dx: 1, dz: 0 },
];
const exposed = (c) => DIRS.filter(d => !has(c.x + d.dx, c.z + d.dz));

// Window on odd rows of a face, away from the facade ends
function faceWindow(c, d) {
  const i = d.dz !== 0 ? c.x : c.z;
  const n = d.dz !== 0 ? W : D;
  return i % 2 === 1 && i > 0 && i < n - 1;
}

// Entrance on the street (north) face, nearest the middle
let door = null;
{
  let best = Infinity;
  for (const c of map.values()) {
    if (has(c.x, c.z - 1)) continue;
    const dist = Math.abs(c.x - 4.5);
    if (dist < best) { best = dist; door = c; }
  }
}

// 1. Foundation: solid from y 0 up to each cell's ground
for (const c of map.values()) {
  for (let y = 0; y < c.gr; y++) g.set(c.x, y, c.z, "stone_bricks");
}

// 2. Interior cells: floor slabs per storey, roof deck level with the cornice
for (const c of map.values()) {
  if (exposed(c).length > 0) continue;
  for (let y = c.gr; y <= c.T - 2; y++) {
    if (y === c.T - 2) g.set(c.x, y, c.z, "smooth_stone");
    else if ((y - c.gr) % 2 === 0) g.set(c.x, y, c.z, "spruce_planks");
  }
}

// 3. Exterior shell
const glassProps = (d) => {
  const alongX = d.dz !== 0;
  return {
    east: alongX ? "true" : "false",
    west: alongX ? "true" : "false",
    north: alongX ? "false" : "true",
    south: alongX ? "false" : "true",
    waterlogged: "false",
  };
};

for (const c of map.values()) {
  const ex = exposed(c);
  if (ex.length === 0) continue;

  for (let y = c.gr; y < c.T; y++) {
    const h = y - c.gr;

    // Cornice course and low parapet cap
    if (y === c.T - 2) { g.set(c.x, y, c.z, "smooth_stone"); continue; }
    if (y === c.T - 1) { g.set(c.x, y, c.z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; }

    // Street entrance: door on the north face, ground storey
    if (door && c === door && h <= 1 && ex.some(d => d.dz === -1)) {
      g.set(c.x, y, c.z, "oak_door", {
        facing: "north",
        half: h === 0 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Storey windows on odd rows
    const winFace = h % 2 === 1 ? ex.find(d => faceWindow(c, d)) : undefined;
    if (winFace) {
      g.set(c.x, y, c.z, "glass_pane", glassProps(winFace));
      continue;
    }

    // Brownstone base course, then brick
    g.set(c.x, y, c.z, h === 0 ? "brown_terracotta" : "bricks");
  }

  // Warm light just inside some windows, on the interior floor
  for (const d of ex) {
    if (!faceWindow(c, d)) continue;
    const i = d.dz !== 0 ? c.x : c.z;
    if (i % 4 !== 1) continue;
    const inner = get(c.x - d.dx, c.z - d.dz);
    if (!inner || inner.gr !== c.gr) continue;
    if (c.gr + 1 <= inner.T - 3) g.set(inner.x, c.gr + 1, inner.z, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
