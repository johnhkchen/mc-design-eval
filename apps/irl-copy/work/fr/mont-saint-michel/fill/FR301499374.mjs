import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499374.cells.json`, "utf8"));

const W = 18, H = 27, D = 31;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr, r] of cells) {
  map.set(key(x, z), { x, z, gr, r });
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}
const has = (x, z) => map.has(key(x, z));

// Smooth roof heights along each z row (lidar noise -> flat tiers)
const rowSum = new Map(), rowCnt = new Map();
for (const c of map.values()) {
  rowSum.set(c.z, (rowSum.get(c.z) || 0) + c.r);
  rowCnt.set(c.z, (rowCnt.get(c.z) || 0) + 1);
}

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p); else g.set(x, y, z, id);
};

const cxEdge = (minX + maxX + 1) / 2; // 9 for width 18
const half = (maxX - minX + 1) / 2;   // 9

// Shared height rule so every pass agrees on eave and ridge
const eaveOf = (c) => {
  const rowAvg = rowSum.get(c.z) / rowCnt.get(c.z);
  const R = Math.round(0.5 * c.r + 0.5 * rowAvg);
  return { R, E: Math.min(H - 12, Math.max(R - 9, c.gr + 7)) };
};

// Pass 1: foundations, floors, walls, cornice, roof
for (const c of map.values()) {
  const { x, z, gr } = c;
  const { E } = eaveOf(c);

  // Foundation up to ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exN = !has(x, z - 1), exS = !has(x, z + 1), exW = !has(x - 1, z), exE = !has(x + 1, z);
  const exterior = exN || exS || exW || exE;
  put(x, gr, z, exterior ? "stone_bricks" : "smooth_stone");

  if (exterior) {
    // Base course, slightly proud look via stone_brick_slab on top of plinth
    put(x, gr + 1, z, "stone_bricks");
    // Corner quoins: stone bricks on the corner columns, render elsewhere
    const corner = (x === minX || x === maxX) && (z === minZ || z === maxZ);
    for (let y = gr + 2; y < E; y++) {
      const quoin = corner || ((x === minX || x === maxX) && (z === minZ || z === maxZ));
      put(x, y, z, quoin ? "stone_bricks" : "calcite");
    }
    // Cornice course at the eave
    put(x, E, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }

  // Loft floor slab inside
  if (!exterior) put(x, gr + 5, z, "spruce_planks");

  // Roof: deepslate tiles, stepped stairs on the slopes
  const d = Math.abs(x + 0.5 - cxEdge);
  const top = Math.min(H - 1, E + 1 + Math.floor(half - d));
  const westHalf = x + 0.5 < cxEdge;
  for (let y = E + 1; y <= top; y++) {
    if (y < top || d < 1) {
      put(x, y, z, "deepslate_tiles");
    } else {
      put(x, y, z, "deepslate_tile_stairs", {
        facing: westHalf ? "west" : "east",
        half: "bottom",
        shape: "straight",
        waterlogged: "false",
      });
    }
  }
}

// Pass 2: openings, window frames, sills, lintels, lights
for (const c of map.values()) {
  const { x, z, gr } = c;
  const { E } = eaveOf(c);
  const faceW = !has(x - 1, z), faceE = !has(x + 1, z);
  const faceN = !has(x, z - 1), faceS = !has(x, z + 1);
  if (!(faceW || faceE || faceN || faceS)) continue;

  // Large barn gate on east face, with stone-framed jambs and a lintel
  if (faceE && z >= 12 && z <= 16) {
    for (let y = gr + 1; y <= gr + 5; y++) {
      put(x, y, z, z === 14 ? "stripped_spruce_log" : "dark_oak_planks");
    }
    put(x, gr + 6, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }
  // Service door on south face, framed
  if (faceS && x >= 7 && x <= 10) {
    for (let y = gr + 1; y <= gr + 3; y++) {
      put(x, y, z, x === 8 || x === 9 ? "dark_oak_planks" : "stripped_spruce_log");
    }
    put(x, gr + 4, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    continue;
  }

  const canWin = E > gr + 5;
  if ((faceW || faceE) && (z - minZ) % 4 === 2 && canWin) {
    // Stone sill below, glass pane, stone lintel above
    put(x, gr + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    for (const y of [gr + 3, gr + 4]) {
      put(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    }
    put(x, gr + 5, z, "stone_bricks");
    if ((z - minZ) % 8 === 2) {
      const ix = faceW ? x + 1 : x - 1;
      if (has(ix, z)) put(ix, gr + 3, z, "glowstone");
    }
  }
  if ((faceN || faceS) && (x - minX) % 4 === 1 && canWin) {
    put(x, gr + 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    for (const y of [gr + 3, gr + 4]) {
      put(x, y, z, "glass_pane", { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" });
    }
    put(x, gr + 5, z, "stone_bricks");
    if ((x - minX) % 8 === 1) {
      const iz = faceN ? z + 1 : z - 1;
      if (has(x, iz)) put(x, gr + 3, iz, "glowstone");
    }
  }
}

g.save(`${DIR}/FR301499374.nbt`);
