import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098123.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw540098123.nbt";

const W = 21, H = 23, D = 22;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

// Materials: 1980s-90s Taipei mid-rise commercial: white tiled body, light grey bands,
// tinted glass, granite base, stone-brick parapet.
const M = {
  stone: "stone",
  base: "polished_granite",
  body: "white_concrete",
  band: "light_gray_concrete",
  glass: "light_blue_stained_glass",
  floor: "smooth_stone",
  roof: "stone_bricks",
  plant: "gray_concrete",
  glow: "glowstone",
};

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.max(0, Math.min(H - 1, Math.round(gr))));
let minG = Infinity;
for (const v of ground.values()) minG = Math.min(minG, v);

const put = (x, y, z, b) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  g.set(x, y, z, b);
};
const has = (x, z) => ground.has(key(x, z));

// Storey heights relative to lowest ground (rel):
// 0 base, 1-3 shopfront glazing, 4 lintel band, 5 spandrel, 6-8 upper windows,
// 9 spandrel, 10 cornice band, 11 parapet cap (roof about 11 above lowest ground).
const TOP_REL = 11;

// Facade normal for an edge cell: first exposed side in W, E, N, S order.
function facade(x, z) {
  if (!has(x - 1, z)) return { dx: -1, dz: 0, u: z };
  if (!has(x + 1, z)) return { dx: 1, dz: 0, u: z };
  if (!has(x, z - 1)) return { dx: 0, dz: -1, u: x };
  if (!has(x, z + 1)) return { dx: 0, dz: 1, u: x };
  return null;
}

for (const [x, z, gr0] of cells) {
  const gd = ground.get(key(x, z));
  const edge = !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));

  // Foundation: solid from y 0 up to the cell's own ground.
  for (let y = 0; y < gd; y++) put(x, y, z, M.stone);

  if (edge) {
    const f = facade(x, z);
    const u = f ? f.u : 0;
    const isPier = u % 3 === 0;
    for (let y = gd; y <= minG + TOP_REL; y++) {
      const rel = y - minG;
      let b;
      if (rel === 0) b = M.base;
      else if (rel >= 1 && rel <= 3) b = isPier ? M.body : M.glass;
      else if (rel === 4) b = M.band;
      else if (rel === 5 || rel === 9) b = M.band;
      else if (rel >= 6 && rel <= 8) b = isPier ? M.body : M.glass;
      else if (rel === 10) b = M.band;
      else if (rel === 11) b = M.roof;
      else continue;
      put(x, y, z, b);
    }
    // Warm light: glowstone behind a few upper windows, in the interior air gap.
    if (f && u % 6 === 1) {
      const ix = x - f.dx, iz = z - f.dz;
      if (has(ix, iz) && ground.get(key(ix, iz)) <= minG + 7) {
        const ig = ground.get(key(ix, iz));
        const edgeIn = !(has(ix - 1, iz) && has(ix + 1, iz) && has(ix, iz - 1) && has(ix, iz + 1));
        if (!edgeIn) put(ix, minG + 7, iz, M.glow);
      }
    }
  } else {
    // Interior: floor slabs per storey only (no interior spaces).
    for (const rel of [0, 5, 10]) {
      const y = minG + rel;
      if (y >= gd) put(x, y, z, rel === 10 ? M.roof : rel === 5 ? M.band : M.floor);
    }
    // Rooftop plant boxes on a sparse grid.
    if ((x + z) % 7 === 0 && minG + 11 < H) {
      put(x, minG + 11, z, M.plant);
    }
  }
}

g.save(OUT);
