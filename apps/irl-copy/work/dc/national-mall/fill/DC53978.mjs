import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC53978";
const W = 17, H = 29, D = 15;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// ---- footprint map -------------------------------------------------------
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, roof] of cells) {
  map.set(key(x, z), { x, z, g: Math.round(gr), r: Math.round(roof) });
}
const has = (x, z) => map.has(key(x, z));
const minX = Math.min(...[...map.values()].map(c => c.x));
const minZ = Math.min(...[...map.values()].map(c => c.z));
const maxX = Math.max(...[...map.values()].map(c => c.x));
const maxZ = Math.max(...[...map.values()].map(c => c.z));

// ---- storeys: 3 blocks each (1 band course + 2 window rows) --------------
for (const c of map.values()) {
  c.n = clamp(Math.round((c.r - c.g) / 3), 1, 9);
}
const smoothed = new Map();
for (const c of map.values()) {
  const vals = [c.n];
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const o = map.get(key(c.x + dx, c.z + dz));
    if (o) vals.push(o.n);
  }
  smoothed.set(key(c.x, c.z), Math.max(1, Math.round(vals.reduce((a, b) => a + b, 0) / vals.length)));
}
for (const c of map.values()) {
  c.n = smoothed.get(key(c.x, c.z));
  while (c.g + 3 * c.n + 4 >= H && c.n > 1) c.n--;
}

// ---- exposure helpers ----------------------------------------------------
const miss = c => ({
  W: !has(c.x - 1, c.z), E: !has(c.x + 1, c.z),
  N: !has(c.x, c.z - 1), S: !has(c.x, c.z + 1),
});
const isEdge = m => m.W || m.E || m.N || m.S;
const isCorner = m => (m.W || m.E) && (m.N || m.S);

// ---- entrance: north (low-z) face, centred --------------------------------
const doorCandidates = (side) => [...map.values()]
  .filter(c => { const m = miss(c); return m[side] && !isCorner(m); })
  .sort((a, b) => a.x - b.x || a.z - b.z);
let doorSide = "N";
let cands = doorCandidates("N");
if (cands.length === 0) { doorSide = "S"; cands = doorCandidates("S"); }
const doorCell = cands.length ? cands[Math.floor(cands.length / 2)] : null;
const doorKey = doorCell ? key(doorCell.x, doorCell.z) : null;

// ---- penthouse: centred bulkhead on the tallest interior tier -------------
const cxMid = (minX + maxX) / 2, czMid = (minZ + maxZ) / 2;
const tallest = Math.max(...[...map.values()].map(c => c.g + 3 * c.n));
const penthouseCells = new Set();
for (const c of map.values()) {
  const m = miss(c);
  if (isEdge(m)) continue;
  if (c.g + 3 * c.n !== tallest) continue;
  if (Math.abs(c.x - cxMid) <= 2 && Math.abs(c.z - czMid) <= 2) penthouseCells.add(key(c.x, c.z));
}

// ---- build ---------------------------------------------------------------
const litAt = (x, y, z) => ((x * 31 + z * 17 + y * 7) % 7) === 0;

for (const c of map.values()) {
  const { x, z, g: gr, n } = c;
  const cap = gr + 3 * n;
  const m = miss(c);
  const edge = isEdge(m);
  const corner = isCorner(m);
  const faceEW = m.W || m.E;
  const along = faceEW ? z - minZ : x - minX;

  // foundation up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, edge ? "stone_bricks" : "smooth_stone");

  for (let y = gr + 1; y < cap; y++) {
    const k = y - gr;
    if (!edge) {
      if (k % 3 === 0) put(x, y, z, "smooth_stone");
      continue;
    }
    if (k % 3 === 0) { put(x, y, z, "calcite"); continue; }          // storey band
    if (k === 1) { put(x, y, z, "stone_bricks"); continue; }          // base course
    if (k === cap - gr - 1) { put(x, y, z, "stone_bricks"); continue; } // cornice under parapet
    if (corner || along % 3 === 0) { put(x, y, z, "bricks"); continue; } // piers
    if (litAt(x, y, z)) {
      put(x, y, z, "glowstone");
    } else if (faceEW) {
      put(x, y, z, "gray_stained_glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    } else {
      put(x, y, z, "gray_stained_glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    }
  }

  // parapet / roof deck
  put(x, cap, z, edge ? "stone_bricks" : "deepslate_tiles");

  // penthouse bulkhead: walls of stone brick with a slab cap
  if (penthouseCells.has(key(x, z))) {
    for (let y = cap; y < cap + 2; y++) put(x, y, z, "stone_bricks");
    put(x, cap + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// ---- entrance: door, stone surround, flanking lanterns -------------------
if (doorCell) {
  const { x, z, g: gr } = doorCell;
  const facing = doorSide === "N" ? "north" : "south";
  const dprops = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  // surround: stone pilasters beside the door, lintel above
  const sideX = [x - 1, x + 1];
  for (const sx of sideX) {
    if (has(sx, z)) {
      put(sx, gr + 1, z, "stone_bricks");
      put(sx, gr + 2, z, "stone_bricks");
    }
  }
  put(x, gr + 1, z, "dark_oak_door", dprops("lower"));
  put(x, gr + 2, z, "dark_oak_door", dprops("upper"));
  put(x, gr + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  // lanterns on the piers either side of the door
  for (const sx of sideX) {
    if (has(sx, z)) put(sx, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
