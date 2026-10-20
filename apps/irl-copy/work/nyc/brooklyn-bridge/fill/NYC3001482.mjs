import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001482";
const W = 22, H = 45, D = 44;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells || raw.footprint || raw.features || []);

const clamp = (v, lo, hi) => Math.max(lo, Math.min(hi, v));
const key = (x, z) => x + "," + z;

// ---- footprint: [x, z, ground, roof] per cell ----
const cells = new Map();
for (const c of list) {
  let x, z, g, r;
  if (Array.isArray(c)) [x, z, g, r] = c;
  else { x = c.x; z = c.z; g = c.ground ?? c.g; r = c.roof ?? c.r; }
  x = clamp(Math.round(x), 0, W - 1);
  z = clamp(Math.round(z), 0, D - 1);
  const G = clamp(Math.round(g), 0, 40);
  const R = clamp(Math.round(r), G + 4, 40);
  cells.set(key(x, z), { x, z, G, R });
}

let minX = Infinity, maxX = -Infinity;
for (const c of cells.values()) {
  minX = Math.min(minX, c.x); maxX = Math.max(maxX, c.x);
}
const midX = (minX + maxX) / 2;

const DIRS = [
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 0, dz: -1, name: "north" },
];

// A side is exposed at height y if the neighbour is outside the footprint
// or its body has already ended below y.
function exposedDirs(c, y) {
  const out = [];
  for (const d of DIRS) {
    const n = cells.get(key(c.x + d.dx, c.z + d.dz));
    if (!n || y >= n.R) out.push(d);
  }
  return out;
}

// Entrance: north-facing perimeter cell nearest the middle of the footprint.
let entranceKey = null;
{
  let best = Infinity;
  for (const c of cells.values()) {
    if (!cells.get(key(c.x, c.z - 1))) {
      const dist = Math.abs(c.x - midX);
      if (dist < best) { best = dist; entranceKey = key(c.x, c.z); }
    }
  }
}
const entrance = entranceKey ? cells.get(entranceKey) : null;

const g = new Voxels([W, H, D]);

// ---- pass 1: foundations, body, floors, roof, facades ----
for (const c of cells.values()) {
  for (let y = 0; y < c.G; y++) g.set(c.x, y, c.z, "stone_bricks");

  const h = c.R - c.G;
  for (let k = 0; k < h; k++) {
    const y = c.G + k;
    const top = k === h - 1;
    const exp = exposedDirs(c, y);
    const isWall = exp.length > 0;

    if (!isWall) {
      if (top) g.set(c.x, y, c.z, "stone");
      else if (k % 2 === 0) g.set(c.x, y, c.z, "smooth_stone");
      continue;
    }

    const d = exp[0];
    const alongIdx = d.dx !== 0 ? c.z : c.x;

    if (top) { g.set(c.x, y, c.z, "stone_bricks"); continue; }     // cornice / parapet
    if (k < 2) { g.set(c.x, y, c.z, "smooth_stone"); continue; }   // base course
    if (k % 2 === 0) { g.set(c.x, y, c.z, "bricks"); continue; }   // storey line

    // window row: glass with limestone mullions every third bay
    if (alongIdx % 3 === 0) g.set(c.x, y, c.z, "calcite");
    else g.set(c.x, y, c.z, "light_blue_stained_glass");
  }
}

// ---- pass 2: entrance on the north face: pilasters, door, canopy course ----
if (entrance) {
  const ex = entrance.x, ez = entrance.z;
  const h = entrance.R - entrance.G;
  // limestone pilasters flanking the door, two storeys tall
  for (const dx of [-1, 1]) {
    const p = cells.get(key(ex + dx, ez));
    if (p && !cells.get(key(ex + dx, ez - 1))) {
      for (let k = 0; k < 4 && k < p.R - p.G - 1; k++) {
        g.set(p.x, p.G + k, p.z, "calcite");
      }
    }
  }
  // door, lower and upper halves
  for (let k = 0; k < 2 && k < h - 1; k++) {
    g.set(ex, entrance.G + k, ez, "dark_oak_door", {
      facing: "north",
      half: k === 0 ? "lower" : "upper",
      hinge: "left",
      open: "false",
      powered: "false",
    });
  }
  // canopy course over the door, sitting on the spandrel row
  if (2 < h - 1) {
    for (let dx = -1; dx <= 1; dx++) {
      const p = cells.get(key(ex + dx, ez));
      if (p && !cells.get(key(ex + dx, ez - 1)) && p.G + 2 < p.R - 1) {
        g.set(p.x, p.G + 2, p.z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      }
    }
  }
}

// ---- pass 3: warm light behind some windows ----
for (const c of cells.values()) {
  const h = c.R - c.G;
  for (let k = 3; k < h - 1; k += 2) {
    const y = c.G + k;
    const exp = exposedDirs(c, y);
    if (exp.length === 0) continue;
    const d = exp[0];
    const alongIdx = d.dx !== 0 ? c.z : c.x;
    if (alongIdx % 3 === 0) continue;
    if (((alongIdx + k) % 4) !== 1) continue;
    const ix = c.x - d.dx, iz = c.z - d.dz;
    const inner = cells.get(key(ix, iz));
    if (!inner) continue;
    if (y < inner.G || y >= inner.R - 1) continue;
    if (exposedDirs(inner, y).length > 0) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

g.save(`${DIR}/${ID}.nbt`);
