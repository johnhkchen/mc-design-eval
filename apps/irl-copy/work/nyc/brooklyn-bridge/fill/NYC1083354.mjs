import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const id = "NYC1083354";
const W = 46, H = 25, D = 17;

// ---- read footprint cells: [x, z, ground, roof] ----
let raw = JSON.parse(readFileSync(`${dir}/${id}.cells.json`, "utf8"));
if (!Array.isArray(raw)) raw = raw.cells ?? Object.values(raw);

const cellMap = new Map();
for (const c of raw) {
  const [x, z, gr, rf] = c;
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(`${x},${z}`, { g: Math.max(0, Math.round(gr)), r: rf });
}
const has = (x, z) => cellMap.has(`${x},${z}`);

// smooth lidar roof heights over a 3x3 neighbourhood into flat tiers
const roofSm = new Map();
for (const [key] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const k = `${x + dx},${z + dz}`;
    if (cellMap.has(k)) { sum += cellMap.get(k).r; n++; }
  }
  roofSm.set(key, Math.round(sum / n));
}

const exposed = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const isPerim = (x, z) => {
  const e = exposed(x, z);
  return e.N || e.S || e.W || e.E;
};

// ---- entrance: middle of the street-facing (north, low z) exposed run ----
let northXs = [];
for (const [key] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  if (exposed(x, z).N) northXs.push(x);
}
if (northXs.length === 0) {
  // fallback: any exposed cell on the south side
  for (const [key] of cellMap) {
    const [x, z] = key.split(",").map(Number);
    if (exposed(x, z).S) northXs.push(x);
  }
}
northXs.sort((a, b) => a - b);
const doorX = northXs.length ? northXs[Math.floor(northXs.length / 2)] : 23;
const doorFaceN = northXs.length > 0; // door faces north (low z)
const doorKey = `${doorX},${doorFaceN ? 0 : D - 1}`;

const g = new Voxels([W, H, D]);

// Materials
const FOUND = "stone_bricks";
const WALL = "bricks";
const BASE = "polished_granite";
const SPAN = "light_gray_concrete";
const CORNICE = "stone_bricks";
const SLAB = "light_gray_concrete";
const PARAPET = "stone_brick_wall";
const ROOFBOX = "light_gray_concrete";

const paneFor = (e) => {
  if (e.N || e.S) return { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
  return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
};

// ---- build ----
for (const [key, { g: gr }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const r = Math.min(H - 1, Math.max(gr + 4, roofSm.get(key)));
  const e = exposed(x, z);
  const perim = e.N || e.S || e.W || e.E;
  const alongX = e.N || e.S;
  const u = alongX ? x : z;
  const isEntry = key === doorKey;

  // foundation up to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  for (let y = gr; y < r; y++) {
    const h = y - gr;

    if (y === r - 1) {
      // top: cornice on the shell, roof slab inside
      g.set(x, y, z, perim ? CORNICE : SLAB);
      continue;
    }

    if (!perim) {
      // interior: air, with floor slabs at ground and each storey line
      if (h === 0 || (h >= 3 && (h - 3) % 2 === 0)) g.set(x, y, z, SLAB);
      continue;
    }

    // perimeter shell
    if (isEntry && (h === 0 || h === 1)) {
      const half = h === 0 ? "lower" : "upper";
      g.set(x, y, z, "iron_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isEntry && h === 2) {
      // lantern above the door, on the wall row
      g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" });
      continue;
    }
    if (h === 0) { g.set(x, y, z, BASE); continue; }
    if (h >= 3 && (h - 3) % 2 === 0) { g.set(x, y, z, SPAN); continue; }

    // window row: glass panes between brick piers
    if (u % 3 === 0) g.set(x, y, z, WALL);
    else g.set(x, y, z, "glass_pane", paneFor(e));
  }

  // parapet on the roof edge
  if (perim && r <= H - 1) {
    g.set(x, r, z, PARAPET, { up: "true", north: "low", south: "low", east: "low", west: "low", waterlogged: "false" });
  }
}

// warm light behind some windows (inside air gap), sparse
for (const [key, { g: gr }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  const e = exposed(x, z);
  if (!(e.N || e.S || e.W || e.E)) continue;
  const r = Math.min(H - 1, Math.max(gr + 4, roofSm.get(key)));
  const alongX = e.N || e.S;
  const u = alongX ? x : z;
  let ix = x, iz = z;
  if (e.N) iz = z + 1;
  else if (e.S) iz = z - 1;
  else if (e.W) ix = x + 1;
  else ix = x - 1;
  if (!has(ix, iz) || isPerim(ix, iz)) continue;
  for (let y = gr + 1; y < r - 1; y++) {
    const h = y - gr;
    if (h === 0 || (h >= 3 && (h - 3) % 2 === 0)) continue; // slab rows
    if (h <= 2 && key === doorKey) continue;                 // entrance
    if (u % 3 === 0) continue;                               // pier
    if ((x * 5 + z * 3 + y) % 13 === 0) g.set(ix, y, iz, "glowstone");
  }
}

// rooftop mechanical penthouse block in the middle of the roof
for (const [key, { g: gr }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  if (isPerim(x, z)) continue;
  if (x < 12 || x > 15 || z < 5 || z > 10) continue;
  const r = Math.min(H - 1, Math.max(gr + 4, roofSm.get(key)));
  for (let y = r; y <= r + 1 && y <= H - 1; y++) g.set(x, y, z, ROOFBOX);
}

// roof bulkhead / elevator core toward the east end
for (const [key, { g: gr }] of cellMap) {
  const [x, z] = key.split(",").map(Number);
  if (isPerim(x, z)) continue;
  if (x < 32 || x > 35 || z < 4 || z > 6) continue;
  const r = Math.min(H - 1, Math.max(gr + 4, roofSm.get(key)));
  if (r + 2 <= H - 1) {
    for (let y = r; y <= r + 2; y++) g.set(x, y, z, ROOFBOX);
  }
}

g.save(`${dir}/${id}.nbt`);
