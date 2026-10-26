import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77279.cells.json`, "utf8"));

// Footprint 24 x 12, world height 29
const W = 24, H = 29, D = 12;
const g = new Voxels([W, H, D]);

// Lowest ground under the footprint is y 0
const base = Math.min(...cells.map(c => c[2]));
const raw = new Map();
for (const [x, z, gr, rf] of cells) {
  raw.set(`${x},${z}`, { gl: Math.round(gr - base), rl: Math.round(rf - base) });
}
const has = (x, z) => raw.has(`${x},${z}`);
const isExt = (x, z) => !(has(x + 1, z) && has(x - 1, z) && has(x, z + 1) && has(x, z - 1));
const isInterior = (x, z) => has(x, z) && !isExt(x, z);

function S(x, y, z, id, p) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Structural column grid inside the shell (supports the floor slabs)
const isColumn = (x, z) => [4, 8, 12, 16, 20].includes(x) && [4, 8].includes(z);

// Massing: smooth lidar roof noise over each cell and its neighbours,
// then snap to 3-block storeys with a 2-block parapet and coping.
const info = new Map();
for (const [key, c] of raw) {
  const [x, z] = key.split(",").map(Number);
  const nb = [[x, z], [x + 1, z], [x - 1, z], [x, z + 1], [x, z - 1]].filter(([a, b]) => has(a, b));
  const rs = nb.reduce((s, [a, b]) => s + raw.get(`${a},${b}`).rl, 0) / nb.length;
  const n = Math.max(1, Math.round((rs - c.gl - 2) / 3));
  const Tc = Math.min(H - 1, c.gl + 3 * n + 2);
  info.set(key, { gl: c.gl, n, Tc });
}

// Pass 1: foundations, floor slabs, structural columns
for (const [key, c] of info) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.gl; y++) S(x, y, z, "stone_bricks");
  if (isExt(x, z)) continue;
  if (isColumn(x, z)) {
    for (let y = c.gl; y < c.Tc; y++) S(x, y, z, "quartz_pillar", { axis: "y" });
  } else {
    for (let k = 0; k <= c.n; k++) S(x, c.gl + 3 * k, z, "smooth_stone");
  }
}

// Pass 2: exterior shell with window grids, piers, base course, parapet
for (const [key, c] of info) {
  const [x, z] = key.split(",").map(Number);
  if (!isExt(x, z)) continue;

  const zFace = z === 0 || z === D - 1;
  const i = zFace ? x : z;
  const pier = i % 3 === 0;

  for (let y = c.gl; y < c.Tc; y++) {
    const rel = y - c.gl;
    const k = Math.floor(rel / 3);
    const r = rel % 3;
    let id, p;
    if (rel === 0) {
      id = "polished_granite";                              // base course
    } else if (rel < 3 * c.n) {
      if (pier) id = "quartz_block";                        // piers
      else if (k === 0 || r === 1) id = "light_blue_stained_glass";
      else id = "white_concrete";                           // spandrels
    } else if (rel < 3 * c.n + 2) {
      id = "quartz_block";                                  // parapet
    } else {
      id = "stone_brick_slab"; p = { type: "bottom", waterlogged: "false" };
    }
    S(x, y, z, id, p);
  }

  // Warm light behind some windows: glowstone on the storey slab, inside the air gap,
  // only where the interior cell actually exists
  for (let k = 0; k < c.n; k++) {
    if (pier || k % 2 === 1 || i % 6 !== 1) continue;
    let ix, iz;
    if (zFace) {
      ix = x; iz = z === 0 ? 1 : D - 2;
    } else {
      ix = x === 0 ? 1 : W - 2; iz = z;
    }
    if (!isInterior(ix, iz)) continue;
    S(ix, c.gl + 3 * k + 1, iz, "glowstone");
  }
}

// Entrance on the z=0 face: pier surround, double doors, lintel
{
  const c = info.get("11,0");
  if (c && isExt(11, 0)) {
    const gl = c.gl;
    for (const px of [10, 13]) {
      for (let y = gl; y < c.Tc - 2; y++) S(px, y, 0, "quartz_block");
    }
    S(11, gl, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    S(11, gl + 1, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    S(12, gl, 0, "dark_oak_door", { facing: "south", half: "lower", hinge: "right", open: "false", powered: "false" });
    S(12, gl + 1, 0, "dark_oak_door", { facing: "south", half: "upper", hinge: "right", open: "false", powered: "false" });
    S(11, gl + 2, 0, "stone_bricks");
    S(12, gl + 2, 0, "stone_bricks");
    S(11, gl + 3, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    S(12, gl + 3, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Roof plant on the interior roof slab, away from the parapet and columns
for (const [key, c] of info) {
  const [x, z] = key.split(",").map(Number);
  if (!isInterior(x, z) || isColumn(x, z)) continue;
  if (x >= 9 && x <= 13 && z >= 5 && z <= 6) {
    S(x, c.gl + 3 * c.n + 1, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/DC77279.nbt`);
