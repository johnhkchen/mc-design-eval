import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE94-0645-31F.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/TPE94-0645-31F.nbt";

const W = 228, D = 125, H = 216;
const ROOF = 205;          // top slab line (multiple of 5); lidar roof ~204
const T1 = 120;            // first setback (inset 12)
const T2 = 170;            // second setback (inset 24)
const PLINTH = 5;          // granite plinth height above y 0

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// ---- footprint and ground ----
const ground = new Int16Array(W * D).fill(-1);
const idx = (x, z) => x * D + z;
for (const [x, z, gr] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) {
    ground[idx(x, z)] = Math.max(0, Math.min(ROOF - 5, Math.round(gr)));
  }
}
const inFp = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground[idx(x, z)] >= 0;

// ---- Chebyshev distance from the footprint edge (for setbacks) ----
const dist = new Int16Array(W * D);
const queue = [];
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    let edge = false;
    for (let dx = -1; dx <= 1 && !edge; dx++)
      for (let dz = -1; dz <= 1 && !edge; dz++)
        if (!inFp(x + dx, z + dz)) edge = true;
    if (edge) { dist[idx(x, z)] = 1; queue.push([x, z]); }
  }
}
for (let h = 0; h < queue.length; h++) {
  const [x, z] = queue[h];
  const d = dist[idx(x, z)];
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const nx = x + dx, nz = z + dz;
      if (inFp(nx, nz) && dist[idx(nx, nz)] === 0) {
        dist[idx(nx, nz)] = d + 1;
        queue.push([nx, nz]);
      }
    }
}
for (let x = 0; x < W; x++)
  for (let z = 0; z < D; z++)
    if (inFp(x, z) && dist[idx(x, z)] === 0) dist[idx(x, z)] = 1;

// ---- occupancy by height: full footprint, then two setback tiers ----
const insetAt = (y) => (y >= T2 ? 24 : y >= T1 ? 12 : 0);
const occ = (x, z, y) =>
  inFp(x, z) && y >= ground[idx(x, z)] && y <= ROOF && dist[idx(x, z)] > insetAt(y);

const edgeAt = (x, z, y) =>
  !occ(x - 1, z, y) || !occ(x + 1, z, y) || !occ(x, z - 1, y) || !occ(x, z + 1, y);

const lit = (x, y, z) => ((x * 31 + z * 17 + y * 7) % 43) === 0;

// ---- main build ----
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const gr = ground[idx(x, z)];

    // foundation and granite plinth
    for (let y = 0; y < Math.max(gr, PLINTH); y++) {
      g.set(x, y, z, y < gr ? "stone_bricks" : "polished_granite");
    }

    for (let y = gr; y <= ROOF; y++) {
      const o = y % 5;
      const here = occ(x, z, y);

      // setback roofs are capped solid across the whole footprint
      if (y === T1 || y === T2) {
        g.set(x, y, z, "light_gray_concrete");
        continue;
      }

      // tier top on the ring below a setback: roof slab (safety net)
      if (!here) {
        if (y > 0 && occ(x, z, y - 1) && y - 1 >= gr) {
          g.set(x, y, z, "light_gray_concrete");
        }
        continue;
      }

      // storey floor slab (air gap is left between slabs)
      if (o === 0) {
        g.set(x, y, z, "light_gray_concrete");
        continue;
      }

      // facade only on edge cells
      if (!edgeAt(x, z, y)) continue;

      // spandrel bands alternate white and light gray storey by storey
      if (o === 4) {
        const storeyIdx = Math.floor(y / 5);
        g.set(x, y, z, storeyIdx % 2 === 0 ? "white_concrete" : "light_gray_concrete");
        continue;
      }

      const storeyBase = y - o;
      const gx = x % 40;

      // ground floor entrances: framed openings with warm lights above
      if (storeyBase === PLINTH) {
        if (gx >= 12 && gx <= 18) {
          g.set(x, y, z, o === 3 ? "glowstone" : "glass");
          continue;
        }
        if (gx === 11 || gx === 19) {
          // entrance pillars
          g.set(x, y, z, "stone_bricks");
          continue;
        }
      }

      const glass = y >= T2 ? "light_blue_stained_glass"
        : y >= T1 ? "cyan_stained_glass"
        : "light_blue_stained_glass";

      // vertical pilasters every 12 blocks break up the wall
      if (x % 12 === 0 || z % 12 === 0) {
        g.set(x, y, z, "light_gray_concrete");
      } else if ((x + z) % 4 === 0) {
        g.set(x, y, z, "white_concrete"); // mullion frame
      } else if (o === 2 && lit(x, y, z)) {
        g.set(x, y, z, "glowstone");      // warm light behind glass
      } else {
        g.set(x, y, z, glass);
      }
    }
  }
}

// ---- parapets on the top tier ----
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    if (occ(x, z, ROOF) && edgeAt(x, z, ROOF)) {
      g.set(x, ROOF + 1, z, "smooth_stone");
    }
  }
}

// ---- roof equipment on the setback terraces ----
for (let x = 0; x < W; x++) {
  for (let z = 0; z < D; z++) {
    if (!inFp(x, z)) continue;
    const d = dist[idx(x, z)];
    if (d > 24) continue;
    const base = d <= 12 ? T1 : T2;
    if (d === 12 || d === 24) continue; // leave the setback edges clear
    if (d > 12 && base === T1) continue;
    if (x % 20 === 5 && z % 12 === 5) {
      g.set(x, base + 1, z, "light_gray_concrete");
      g.set(x, base + 2, z, "light_gray_concrete");
      if (base === T1) g.set(x, base + 3, z, "cyan_stained_glass");
    }
  }
}

// ---- central mast on the top roof ----
const cx = Math.floor(W / 2), cz = Math.floor(D / 2);
for (let x = cx - 2; x <= cx + 2; x++) {
  for (let z = cz - 2; z <= cz + 2; z++) {
    if (!inFp(x, z) || !occ(x, z, ROOF)) continue;
    const core = Math.abs(x - cx) <= 1 && Math.abs(z - cz) <= 1;
    if (!core) continue;
    for (let y = ROOF + 2; y <= ROOF + 7; y++) {
      g.set(x, y, z, "light_gray_concrete");
    }
    g.set(x, ROOF + 8, z, "cyan_stained_glass");
  }
}
if (inFp(cx, cz)) g.set(cx, ROOF + 9, cz, "lightning_rod");

g.save(OUT);
