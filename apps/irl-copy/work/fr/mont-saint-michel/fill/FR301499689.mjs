import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Lidar roof ~21 implies ~4 storeys of 4 blocks with a stepped slate mansard above.

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499689.cells.json", "utf8"));
const W = 19, H = 33, D = 14;
const g = new Voxels([W, H, D]);

const BODY = "calcite";
const TRIM = "stone_bricks";
const key = (x, z) => x + "," + z;
const cellSet = new Set(cells.map(c => key(c[0], c[1])));
const info = new Map(cells.map(c => [key(c[0], c[1]), { x: c[0], z: c[1], gr: c[2], rf: c[3] }]));

const rfs = cells.map(c => c[3]).sort((a, b) => a - b);
const Rb = rfs[Math.floor(rfs.length / 2)];
const Wt = Rb - 4;
const base = Math.min(...cells.map(c => c[2]));

// Edge distance (1 = facade ring) via multi-source BFS.
const dist = new Map();
const queue = [];
const nbrs = (x, z) => [[x, z - 1], [x, z + 1], [x - 1, z], [x + 1, z]];
for (const [k, c] of info) {
  if (nbrs(c.x, c.z).some(([nx, nz]) => !cellSet.has(key(nx, nz)))) { dist.set(k, 1); queue.push(k); }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i], c = info.get(k);
  for (const [nx, nz] of nbrs(c.x, c.z)) {
    const nk = key(nx, nz);
    if (cellSet.has(nk) && !dist.has(nk)) { dist.set(nk, dist.get(k) + 1); queue.push(nk); }
  }
}

const storeyOf = y => Math.floor((y - base) / 4);
const rowOf = y => (y - base) % 4;

// Entrance: north-facing non-corner facade cell nearest the middle of the north face.
let doorKey = null;
{
  let best = null;
  for (const [k, c] of info) {
    const { x, z } = c;
    const nMiss = !cellSet.has(key(x, z - 1));
    const sMiss = !cellSet.has(key(x, z + 1));
    const wMiss = !cellSet.has(key(x - 1, z));
    const eMiss = !cellSet.has(key(x + 1, z));
    if (!nMiss || sMiss || wMiss || eMiss) continue;
    if (!cellSet.has(key(x - 1, z)) || !cellSet.has(key(x + 1, z))) continue;
    if (x % 4 === 0) continue; // avoid pilaster columns
    const score = Math.abs(x - (W - 1) / 2) + c.gr * 0.01;
    if (!best || score < best.score) best = { k, score };
  }
  if (best) doorKey = best.k;
}

for (const [k, c] of info) {
  const { x, z, gr } = c;
  const miss = {
    N: !cellSet.has(key(x, z - 1)), S: !cellSet.has(key(x, z + 1)),
    W: !cellSet.has(key(x - 1, z)), E: !cellSet.has(key(x + 1, z)),
  };
  const facade = miss.N || miss.S || miss.W || miss.E;
  const corner = (miss.N || miss.S) && (miss.W || miss.E);
  const zFace = miss.N || miss.S;
  const idx = zFace ? x : z;
  let inX = x, inZ = z;
  if (miss.N) inZ = z + 1; else if (miss.S) inZ = z - 1; else if (miss.W) inX = x + 1; else if (miss.E) inX = x - 1;
  const inKey = key(inX, inZ);
  const hasInward = cellSet.has(inKey);

  // Foundation.
  for (let y = 0; y < gr; y++) g.set(x, y, z, TRIM);
  // Solid body.
  for (let y = gr; y <= Wt; y++) g.set(x, y, z, BODY);

  if (!facade) continue;

  const isPilaster = corner || idx % 4 === 0;
  const isDoor = k === doorKey;

  for (let y = gr; y <= Wt; y++) {
    if (y === Wt) {
      g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }
    if (y < base) continue;
    const s = storeyOf(y), r = rowOf(y);
    if (isPilaster) { g.set(x, y, z, TRIM); continue; }
    // Window band rows.
    let wrow;
    if (s === 0) wrow = (r === 1 || r === 2);
    else wrow = (r >= 1);
    if (wrow) {
      const pane = zFace
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", pane);
    } else if (s === 0 && r === 3) {
      g.set(x, y, z, "red_terracotta"); // shop awning band
    } else if (s === 0 && r === 0) {
      g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); // plinth/sill
    } else if (s > 0 && r === 0) {
      g.set(x, y, z, TRIM); // storey line
    } else {
      g.set(x, y, z, BODY);
    }
    if (isDoor) {
      // handled below
    }
  }

  // Air behind windows, warm lights in some.
  if (!isPilaster && hasInward) {
    for (let y = gr; y <= Wt - 1; y++) {
      if (y < base) continue;
      const s = storeyOf(y), r = rowOf(y);
      const wrow = s === 0 ? (r === 1 || r === 2) : (r >= 1);
      if (!wrow) continue;
      g.set(inX, y, inZ, "air");
    }
    const lit = ((idx >> 2) + storeyOf(gr + 4) + Math.floor(z / 3)) % 3 === 0;
    if (lit) {
      const yl = base + 4 * 1 + 2;
      if (yl > gr && yl <= Wt - 1) g.set(inX, yl, inZ, "shroomlight");
    }
    if (storeyOf(base) === 0 && ((idx >> 2) % 2 === 0)) {
      const yg = base + 1;
      if (yg >= gr && yg <= Wt) g.set(inX, yg, inZ, "glowstone");
    }
  }
}

// Doorway with canopy.
if (doorKey) {
  const c = info.get(doorKey);
  const { x, z, gr } = c;
  const dOpen = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(x, gr + 1, z, "dark_oak_door", { ...dOpen, half: "lower" });
  g.set(x, gr + 2, z, "dark_oak_door", { ...dOpen, half: "upper" });
  g.set(x, gr + 3, z, "red_terracotta");
  g.set(x - 1, gr + 3, z, "red_terracotta");
  g.set(x + 1, gr + 3, z, "red_terracotta");
  if (cellSet.has(key(x, z + 1))) {
    g.set(x, gr + 1, z + 1, "air");
    g.set(x, gr + 2, z + 1, "air");
  }
}

// Stepped slate mansard: layer k at Wt+k covers cells with edge distance >= k.
for (let k = 1; k <= 4; k++) {
  for (const [kk, c] of info) {
    const d = dist.get(kk) || 1;
    if (d >= k) g.set(c.x, Wt + k, c.z, "deepslate_tiles");
  }
}

// Chimney stacks on the flat top.
for (const [kk, c] of info) {
  const d = dist.get(kk) || 1;
  if (d >= 5 && c.x % 6 === 2 && c.z % 5 === 2) {
    for (let y = Rb + 1; y <= Rb + 2; y++) g.set(c.x, y, c.z, "bricks");
    g.set(c.x, Rb + 3, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill/FR301499689.nbt");
