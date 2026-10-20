import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw453477005";
const W = 46, D = 29, H = 76;
const T = 64; // roof level above the lowest ground (lidar)

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint lookup -------------------------------------------------------
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);

// Chebyshev depth inside the footprint: 1 on the outer ring, growing inward.
const depthMap = new Map();
function depthAt(x, z) {
  const k = `${x},${z}`;
  if (depthMap.has(k)) return depthMap.get(k);
  if (!has(x, z)) return 0;
  let d = 1;
  outer: for (let r = 1; r < 80; r++) {
    for (let dx = -r; dx <= r; dx++) {
      for (let dz = -r; dz <= r; dz++) {
        if (Math.max(Math.abs(dx), Math.abs(dz)) !== r) continue;
        if (!has(x + dx, z + dz)) { d = r; break outer; }
      }
    }
  }
  depthMap.set(k, d);
  return d;
}
for (const [x, z] of [...ground.keys()].map((k) => k.split(",").map(Number))) depthAt(x, z);

// ---- storey / tier model -----------------------------------------------------
// Podium: 3 storeys full footprint (thr 1). Tower: 5 storeys inset 5 (thr 5).
// Crown tower: storeys inset 9 up to the roof (thr 9).
function tierAt(y, gr) {
  if (y < gr || y >= T) return null;
  if (y < gr + 15) return { thr: 1, base: gr + 5 * Math.floor((y - gr) / 5), bound: gr };
  if (y < gr + 40) return { thr: 5, base: gr + 15 + 5 * Math.floor((y - gr - 15) / 5), bound: gr + 15 };
  return { thr: 9, base: gr + 40 + 5 * Math.floor((y - gr - 40) / 5), bound: gr + 40 };
}

// Facade coordinate along the face (x on the long faces, z on the short ones).
const faceU = (x, z) => ((z === 0 || z === D - 1) ? x : z);

// Inward step from a facade cell (toward deeper footprint).
function inward(x, z) {
  const d = depthAt(x, z);
  let sx = 0, sz = 0;
  if (depthAt(x + 1, z) > d) sx = 1; else if (depthAt(x - 1, z) > d) sx = -1;
  if (depthAt(x, z + 1) > d) sz = 1; else if (depthAt(x, z - 1) > d) sz = -1;
  return [sx, sz];
}

// ---- build -----------------------------------------------------------------
let maxDepthCell = null;
for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr && y < H; y++) g.set(x, y, z, "stone_bricks");

  const d = depthAt(x, z);
  if (!maxDepthCell || d > maxDepthCell.d) maxDepthCell = { x, z, d, gr };

  // Storeys.
  for (let y = gr; y < T; y++) {
    const t = tierAt(y, gr);
    if (!t || d < t.thr) continue;
    const facade = d === t.thr;
    const yy = y - t.base;
    const u = faceU(x, z);

    if (y === T - 1) {
      // Roof parapet on the outer ring, roof deck inside.
      g.set(x, y, z, facade ? "smooth_quartz" : "smooth_stone");
      continue;
    }
    if (yy === 0) {
      // Floor slab / storey line, on every tier cell so nothing floats.
      g.set(x, y, z, facade ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (yy === 4) {
      if (facade) g.set(x, y, z, "white_concrete"); // spandrel
      continue;
    }
    // yy 1..3: glazing band.
    if (!facade) continue; // air gap behind the glass
    const isGroundPodium = t.thr === 1 && t.base === gr;
    if (isGroundPodium) {
      // Shopfront with a recessed entrance on the south (z = 0) face.
      if (z === 0 && x >= 20 && x <= 25) {
        g.set(x, y, z, "glass");
      } else if (u % 4 === 0) {
        g.set(x, y, z, "polished_granite");
      } else {
        g.set(x, y, z, "light_blue_stained_glass");
      }
    } else {
      if (u % 3 === 0) {
        g.set(x, y, z, "light_gray_concrete"); // mullion
      } else {
        g.set(x, y, z, "light_blue_stained_glass_pane");
        // Warm light behind some panes.
        if (yy === 2 && ((u * 7 + t.base * 3) % 13 === 0)) {
          const [sx, sz] = inward(x, z);
          if (depthAt(x + sx, z + sz) > d) g.set(x + sx, y, z + sz, "shroomlight");
        }
      }
    }
  }

  // Setback caps: cells left outside the next tier get a roof slab at the boundary.
  for (const b of [gr + 15, gr + 40]) {
    if (b >= T) continue;
    const above = tierAt(b, gr);
    if (!above) continue;
    const prevThr = above.thr === 5 ? 1 : 5;
    if (d >= prevThr && d < above.thr) {
      g.set(x, b, z, "smooth_stone");
      g.set(x, b + 1, z, d === prevThr ? "smooth_quartz" : "air"); // low parapet on the setback edge
      if (d !== prevThr) g.set(x, b + 1, z, "air");
    }
  }
}

// ---- crown: mechanical penthouse and mast ----------------------------------
for (const [x, z, gr] of cells) {
  const d = depthAt(x, z);
  const t = tierAt(T - 1, gr);
  if (!t || t.thr !== 9 || d < 13) continue;
  const facade = d === 13;
  for (let y = T; y <= T + 2; y++) {
    if (facade) g.set(x, y, z, "light_gray_concrete");
  }
  g.set(x, T + 3, z, "smooth_stone");
}
if (maxDepthCell) {
  const t = tierAt(T - 1, maxDepthCell.gr);
  if (t && t.thr === 9) {
    for (let y = T + 4; y <= T + 7; y++) g.set(maxDepthCell.x, y, maxDepthCell.z, "lightning_rod");
  }
}

g.save(`${DIR}/${ID}.nbt`);
