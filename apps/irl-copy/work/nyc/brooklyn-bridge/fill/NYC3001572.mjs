import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 50 Hicks Street, Brooklyn Heights (1879): a four-storey brownstone-based brick
// rowhouse with stone cornice and parapet, on a stone foundation.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001572";
const W = 10, H = 22, D = 6;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = Array.isArray(raw) ? raw : (raw.cells ?? []);

const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const key = (x, z) => `${x},${z}`;

// Per-cell ground from lidar; the roof is one smoothed level for the whole building
const cmap = new Map();
for (const c of cells) {
  const x = Math.round(c[0]), z = Math.round(c[1]);
  const g = clamp(Math.round(Number(c[2]) || 0), 0, H - 10);
  cmap.set(key(x, z), { g });
}
const grounds = [...cmap.values()].map(v => v.g);
const base = Math.min(...grounds);                       // lowest ground under the building
const roofs = cells
  .map(c => Number(c[3]))
  .filter(Number.isFinite)
  .sort((a, b) => a - b);
const medRoof = roofs.length ? roofs[Math.floor(roofs.length / 2)] : base + 10;
const top = clamp(Math.round(medRoof), base + 8, H - 2); // exclusive top of the shell

const has = (x, z) => cmap.has(key(x, z));
function faces(x, z) {
  return {
    N: !has(x, z - 1),   // street side, z = 0
    S: !has(x, z + 1),
    W: !has(x - 1, z),
    E: !has(x + 1, z),
  };
}
const isBoundary = (x, z) => { const f = faces(x, z); return f.N || f.S || f.W || f.E; };

function isWindow(x, z, face, y) {
  const rel = y - base;
  if (rel < 0 || rel % 2 !== 1 || y >= top - 2) return false;
  const u = (face === "N" || face === "S") ? x : z;
  return u % 2 === 1;
}

const g = new Voxels([W, H, D]);
const glassProps = (face) =>
  (face === "N" || face === "S")
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, shell, floors, roof
for (const [k, { g: gr }] of cmap) {
  const [x, z] = k.split(",").map(Number);

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const exposed = isBoundary(x, z);
  const fc = faces(x, z);

  for (let y = gr; y < top; y++) {
    const rel = y - base;
    const k2 = Math.floor(rel / 2);

    if (!exposed) {
      if (y === top - 1) g.set(x, y, z, "smooth_stone");          // flat roof deck
      else if (rel % 2 === 0 && y < top - 2) g.set(x, y, z, "smooth_stone"); // floor slab
      continue;                                                      // air gap otherwise
    }

    // Entrance: door in the street face at x=4, first storey
    if (fc.N && z === 0 && x === 4 && (y === gr || y === gr + 1)) {
      const half = y === gr ? "lower" : "upper";
      g.set(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    let win = null;
    for (const face of ["N", "S", "W", "E"]) {
      if (fc[face] && isWindow(x, z, face, y)) { win = face; break; }
    }
    if (win) {
      g.set(x, y, z, "glass_pane", glassProps(win));
      continue;
    }

    let block;
    if (y === top - 1) block = "stone_bricks";                      // parapet coping
    else if (y === top - 2) block = "smooth_stone";                 // cornice
    else if (k2 === 0 && rel < 2) block = "brown_terracotta";       // brownstone ground storey
    else if (rel % 2 === 0) block = "smooth_stone";                 // string course
    else block = "bricks";
    g.set(x, y, z, block);
  }
}

// Pass 2: a few chimneys on the roof deck (interior cells, supported by the deck)
for (const [cx, cz] of [[2, 2], [7, 3]]) {
  if (!has(cx, cz) || isBoundary(cx, cz)) continue;
  for (let y = top; y < top + 2; y++) g.set(cx, y, cz, "bricks");
  g.set(cx, top + 2, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 3: sparse warm lights set in the air gap just behind some windows
const inward = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] };
for (const [k, { g: gr }] of cmap) {
  const [x, z] = k.split(",").map(Number);
  if (!isBoundary(x, z)) continue;
  const fc = faces(x, z);
  for (let y = gr; y < top - 2; y++) {
    for (const face of ["N", "S", "W", "E"]) {
      if (!fc[face] || !isWindow(x, z, face, y)) continue;
      if ((x * 5 + z * 3 + y) % 7 !== 0) continue;
      const [dx, dz] = inward[face];
      const ix = x + dx, iz = z + dz;
      if (!has(ix, iz) || isBoundary(ix, iz)) continue;
      const ic = cmap.get(key(ix, iz));
      if (y < ic.g || y >= top - 1) continue;
      g.set(ix, y, iz, "shroomlight");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
