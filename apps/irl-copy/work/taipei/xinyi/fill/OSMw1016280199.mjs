import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Xinyi-style office block, c.1990s: pale concrete piers, light-blue
// tinted glass bands, dark granite shopfront, quartz cornice, roof plant box.
// 5 storeys of 5 blocks, roof cap at lowest ground + 25, parapet to +27.

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016280199.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw1016280199.nbt";
const W = 24, H = 38, D = 16;

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), gr);
const minG = Math.min(...ground.values());
const has = (x, z) => ground.has(key(x, z));
const ROOF = minG + 25;          // top of roof cap (absolute y)

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const miss = (x, z) => ({
  W: !has(x - 1, z), E: !has(x + 1, z), N: !has(x, z - 1), S: !has(x, z + 1),
});

const glowPending = [];

// 1) foundations, floor slabs, facade columns
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
  put(x, gr, z, "smooth_stone");

  const m = miss(x, z);
  const nMiss = (m.W + m.E + m.N + m.S);
  const isEdge = nMiss > 0;
  const corner = nMiss >= 2;
  const pos = (m.W || m.E) ? z : x;
  const pier = corner || pos % 3 === 0;

  for (let y = gr + 1; y <= ROOF; y++) {
    const rel = y - minG;
    const k = Math.floor(rel / 5);
    const w = rel % 5;

    if (rel === 25) { put(x, y, z, "light_gray_concrete"); continue; }

    if (!isEdge) {
      if (w === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    if (k === 0 && w === 0) { put(x, y, z, "polished_granite"); continue; }
    if (k === 4 && w === 4) { put(x, y, z, "quartz_block"); continue; }  // cornice course
    if (w === 0) { put(x, y, z, "light_gray_concrete"); continue; }     // storey line
    if (w === 4) { put(x, y, z, "white_concrete"); continue; }          // head piers
    if (pier) {
      put(x, y, z, k === 0 ? "polished_granite" : "white_concrete");
      continue;
    }
    // window band, w = 1..3
    put(x, y, z, k === 0 ? "cyan_stained_glass" : "light_blue_stained_glass");

    if (k >= 1 && w === 2 && pos % 4 === 1) {
      let ix = null, iz = null;
      if (m.W && !m.E && !m.N && !m.S) { ix = x + 1; iz = z; }
      else if (m.E && !m.W && !m.N && !m.S) { ix = x - 1; iz = z; }
      else if (m.N && !m.S && !m.W && !m.E) { ix = x; iz = z + 1; }
      else if (m.S && !m.N && !m.W && !m.E) { ix = x; iz = z - 1; }
      if (ix !== null && has(ix, iz)) glowPending.push([ix, y, iz]);
    }
  }
}

// 2) parapet on the perimeter
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const m = miss(x, z);
  if (m.W || m.E || m.N || m.S) {
    put(x, ROOF + 1, z, "white_concrete");
    put(x, ROOF + 2, z, "quartz_slab", { type: "bottom", waterlogged: "false" });
  }
}

// 3) warm lights behind glass
for (const [x, y, z] of glowPending) put(x, y, z, "glowstone");

// 4) roof plant box with louvred band and antenna
const px0 = 7, px1 = 13, pz0 = 5, pz1 = 10;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    const ring = x === px0 || x === px1 || z === pz0 || z === pz1;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (!ring) continue;
      if (y === ROOF + 2 && (x + z) % 2 === 0) put(x, y, z, "iron_bars");
      else put(x, y, z, "light_gray_concrete");
    }
    put(x, ROOF + 4, z, "gray_concrete");
  }
}
put(10, ROOF + 5, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
put(10, ROOF + 6, 7, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });

// 5) entrance: south-facing edge cell nearest the middle of the south face
const southCells = cells.filter(([x, z]) => !has(x, z + 1));
if (southCells.length) {
  const xs = southCells.map(c => c[0]).sort((a, b) => a - b);
  const mid = xs[Math.floor(xs.length / 2)];
  const [dx, dz, dg] = southCells.reduce((best, c) =>
    Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best);
  const doorProps = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false", waterlogged: "false" });
  put(dx, dg, dz, "oak_door", doorProps("lower"));
  put(dx, dg + 1, dz, "oak_door", doorProps("upper"));
}

g.save(OUT);
