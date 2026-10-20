import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 中太大廈: 1990s-2000s Taipei commercial/office tower, ~12 storeys of 5 blocks.
// Pale tiled/concrete shell, blue-tinted glazing in mullioned bands, 3-storey podium,
// two setbacks, shopfront base with a recessed entrance, parapet, penthouse and mast.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw294785356";
const W = 43, H = 71, D = 24;
const NST = 12;              // storeys
const STOREY = 5;            // blocks per storey
const F = (k) => STOREY * k; // global floor line for storey k
const ROOF = F(NST);         // 60: roof slab level

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);

const K = (x, z) => `${x},${z}`;
const inFp = (x, z) => ground.has(K(x, z));
const DIRS4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// Distance from footprint edge (4-neighbour BFS), used for setbacks.
const dist = new Map();
const queue = [];
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (DIRS4.some(([dx, dz]) => !inFp(x + dx, z + dz))) {
    dist.set(key, 1);
    queue.push([x, z]);
  }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = dist.get(K(x, z));
  for (const [dx, dz] of DIRS4) {
    const nx = x + dx, nz = z + dz, nk = K(nx, nz);
    if (inFp(nx, nz) && !dist.has(nk)) {
      dist.set(nk, d + 1);
      queue.push([nx, nz]);
    }
  }
}
const dOf = (x, z) => dist.get(K(x, z)) ?? 0;

// Tiers: [fromStorey, toStorey, minimum edge distance]
const TIERS = [[0, 2, 1], [3, 7, 4], [8, 11, 7]];
const sets = [];
for (let k = 0; k < NST; k++) {
  const t = TIERS.find(([a, b]) => k >= a && k <= b);
  const s = new Set();
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (dOf(x, z) >= t[2]) s.add(key);
  }
  if (s.size === 0) sets[k - 1]?.forEach((v) => s.add(v));
  sets.push(s);
}
const inS = (k, x, z) => (k < 0 ? inFp(x, z) : sets[k].has(K(x, z)));
const perim = (k, x, z) => DIRS4.some(([dx, dz]) => !inS(k, x + dx, z + dz));

// Envelope bounds
let zmin = Infinity;
for (const key of ground.keys()) zmin = Math.min(zmin, Number(key.split(",")[1]));
const ENT0 = Math.floor(W * 0.45), ENT1 = ENT0 + 4;

const g = new Voxels([W, H, D]);
const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const GLASS_A = "light_blue_stained_glass";
const GLASS_B = "cyan_stained_glass";
const SPANDREL = "white_concrete";
const MULLION = "smooth_quartz";
const PIER = "smooth_stone";
const SLAB = "light_gray_concrete";
const PARAPET = "smooth_stone";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const k0 = Math.ceil(gr / STOREY);

  // Foundation: solid from y 0 up to the first floor line on this column.
  for (let y = 0; y < Math.min(F(k0), H); y++) put(x, y, z, FOUND);

  for (let k = k0; k <= NST; k++) {
    const y0 = F(k);

    // Floor / roof slab
    if (k === k0 || (k > 0 && inS(k - 1, x, z))) put(x, y0, z, SLAB);

    if (k === NST) {
      if (inS(NST - 1, x, z) && perim(NST - 1, x, z)) put(x, ROOF + 1, z, PARAPET);
      continue;
    }

    if (!inS(k, x, z)) {
      // Setback terrace on the tier below
      if (k > k0 && inS(k - 1, x, z)) {
        if (perim(k - 1, x, z)) put(x, y0 + 1, z, PARAPET);
        else if ((x + z) % 5 === 0) put(x, y0 + 1, z, "oak_leaves", { persistent: "true" });
      }
      continue;
    }

    // Storey walls on this tier's edge
    if (!perim(k, x, z)) continue;

    const ground1 = k === k0;
    const outZ = !inS(k, x, z - 1) || !inS(k, x, z + 1);
    const outX = !inS(k, x - 1, z) || !inS(k, x + 1, z);
    const corner = outZ && outX;
    const mull = (outZ && x % 4 === 0) || (outX && z % 4 === 0);
    const ent = ground1 && outZ && z === zmin && x >= ENT0 && x <= ENT1;
    const flank = ground1 && outZ && z === zmin && (x === ENT0 - 1 || x === ENT1 + 1);
    const inward = DIRS4.map(([dx, dz]) => [x + dx, z + dz]).find(([ix, iz]) => inS(k, ix, iz));
    const glass = (x + z + k) % 3 === 0 ? GLASS_B : GLASS_A;

    if (ground1) {
      // Shopfront storey
      if (ent) {
        // Recessed doorway: opening under a glazed transom and lintel
        put(x, y0 + 1, z, "air");
        put(x, y0 + 2, z, "air");
        put(x, y0 + 3, z, GLASS_A);
        put(x, y0 + 4, z, SPANDREL);
        // Warm lantern just inside the doorway
        if (inward && (x === ENT0 + 2)) put(inward[0], y0 + 1, inward[1], "lantern", { hanging: "false" });
      } else if (flank) {
        // Door flanking pillars rising the full shopfront height
        put(x, y0 + 1, z, PIER);
        put(x, y0 + 2, z, PIER);
        put(x, y0 + 3, z, PIER);
        put(x, y0 + 4, z, SPANDREL);
      } else {
        put(x, y0 + 1, z, BASE);
        const f = corner ? PIER : mull ? MULLION : glass;
        put(x, y0 + 2, z, f);
        put(x, y0 + 3, z, f);
        put(x, y0 + 4, z, SPANDREL);
      }
    } else {
      // Upper storeys: spandrel / glazing band / spandrel, with corner piers
      const face = corner ? PIER : SPANDREL;
      put(x, y0 + 1, z, face);
      const f = corner ? PIER : mull ? MULLION : glass;
      put(x, y0 + 2, z, f);
      put(x, y0 + 3, z, f);
      put(x, y0 + 4, z, face);

      // Warm light behind some glazing
      if (!mull && !corner && inward && (x * 7 + z * 3 + k * 5) % 13 === 0) {
        put(inward[0], y0 + 2, inward[1], "shroomlight");
      }
    }
  }
}

// Penthouse on the top tier, with glazing band and cap
const pent = [...sets[NST - 1]]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => dOf(x, z) >= 9);
const pentSet = new Set(pent.map(([x, z]) => K(x, z)));
const inP = (x, z) => pentSet.has(K(x, z));
for (const [x, z] of pent) {
  const edge = DIRS4.some(([dx, dz]) => !inP(x + dx, z + dz));
  if (edge) {
    put(x, ROOF + 1, z, SPANDREL);
    put(x, ROOF + 2, z, GLASS_A);
    put(x, ROOF + 3, z, SPANDREL);
  }
  put(x, ROOF + 4, z, SLAB);
}

// Mast on the roof centre (nearest penthouse cell to the centroid, else top tier)
const pool = pent.length ? pent : [...sets[NST - 1]].map((k) => k.split(",").map(Number));
if (pool.length) {
  const cx = pool.reduce((s, [x]) => s + x, 0) / pool.length;
  const cz = pool.reduce((s, [, z]) => s + z, 0) / pool.length;
  const [mx, mz] = pool.reduce((best, c) =>
    Math.hypot(c[0] - cx, c[1] - cz) < Math.hypot(best[0] - cx, best[1] - cz) ? c : best);
  for (let y = ROOF + 5; y <= ROOF + 8; y++) put(mx, y, mz, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
