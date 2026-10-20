import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690457";
const W = 25, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Bounds-checked setter; props optional.
const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Footprint lookup and per-cell ground levels (y 0 = lowest ground under the footprint).
const key = (x, z) => `${x},${z}`;
const groundOf = new Map();
let minG = Infinity;
for (const [x, z, gr] of cells) {
  const r = Math.round(gr);
  groundOf.set(key(x, z), r);
  if (r < minG) minG = r;
}
const has = (x, z) => groundOf.has(key(x, z));

const info = (x, z) => {
  const N = !has(x, z - 1), S = !has(x, z + 1), W_ = !has(x - 1, z), E = !has(x + 1, z);
  const perim = N || S || W_ || E;
  const corner = (N || S) && (W_ || E);
  const gy = Math.min(Math.round(groundOf.get(key(x, z))) - minG, 10);
  return { N, S, W: W_, E, perim, corner, gy };
};

// Materials
const WALL = "white_concrete";
const PIER = "light_gray_concrete";
const BASE = "polished_granite";
const SLAB = "smooth_stone";
const GLASS_SHOP = "glass";
const GLASS_UP = "light_blue_stained_glass";
const FOUND = "stone_bricks";

// Pre-compute door position: centre of the south-facing, non-corner cells.
const southX = [];
for (const [x, z] of cells) {
  const i = info(x, z);
  if (i.S && !i.corner) southX.push(x);
}
southX.sort((a, b) => a - b);
const doorX = southX.length ? southX[Math.floor(southX.length / 2)] : null;

// Pass 1: structure, facades, roof.
for (const [x, z] of cells) {
  const i = info(x, z);
  const { gy, perim, corner, N, S, W: Wx, E } = i;

  // Foundation under the cell, so nothing floats on a slope.
  for (let y = 0; y < gy; y++) put(x, y, z, FOUND);
  // Ground floor slab.
  put(x, gy, z, SLAB);

  // Floor slab at storey 2 and roof slab on every cell.
  put(x, gy + 5, z, SLAB);
  put(x, gy + 10, z, SLAB);

  if (!perim) {
    // Interior: air gap, plus roof plant on a regular grid.
    if (x % 4 === 1 && z % 4 === 1) put(x, gy + 11, z, "iron_block");
    continue;
  }

  // Perimeter: belt course, cornice, parapet and cap.
  put(x, gy + 5, z, PIER);
  put(x, gy + 9, z, PIER);
  put(x, gy + 11, z, WALL);
  put(x, gy + 12, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });

  if (corner) {
    // Corner pillars run the full height of the building.
    for (let y = gy + 1; y <= gy + 11; y++) {
      if (y === gy + 5 || y === gy + 9) continue;
      put(x, y, z, PIER);
    }
    continue;
  }

  const ns = N || S;
  const t = ns ? x : z; // position along the facade for the window rhythm
  const win = t % 3 !== 0;

  const isDoor = S && doorX !== null && x === doorX;

  if (isDoor) {
    // Entrance: double-height door under a stone lintel, glass above.
    const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
    put(x, gy + 1, z, "dark_oak_door", { ...base, half: "lower" });
    put(x, gy + 2, z, "dark_oak_door", { ...base, half: "upper" });
    put(x, gy + 3, z, FOUND);
    put(x, gy + 4, z, GLASS_SHOP);
  } else {
    // Ground storey: granite base course, shopfront glass between piers.
    put(x, gy + 1, z, BASE);
    for (let y = gy + 2; y <= gy + 4; y++) {
      put(x, y, z, win ? GLASS_SHOP : PIER);
    }
  }

  // Upper storey: window band between wall spandrels.
  for (let y = gy + 6; y <= gy + 8; y++) {
    put(x, y, z, win ? GLASS_UP : WALL);
  }
}

// Pass 2: warm lights behind selected windows (air gap behind the glass).
for (const [x, z] of cells) {
  const i = info(x, z);
  if (!i.perim || i.corner) continue;

  const ns = i.N || i.S;
  const t = ns ? x : z;
  if (t % 3 === 0) continue; // pier, not a window

  // Inward neighbour behind this window.
  let ix = x, iz = z;
  if (i.W) ix = x + 1;
  else if (i.E) ix = x - 1;
  if (i.N) iz = z + 1;
  else if (i.S) iz = z - 1;
  if (!has(ix, iz)) continue;
  const inner = info(ix, iz);
  if (inner.perim) continue;

  const isDoorCell = i.S && doorX !== null && x === doorX;
  if (isDoorCell) continue;

  // Upper storey: glowstone on the floor slab behind the glass.
  if (t % 6 === 4) {
    put(ix, inner.gy + 6, iz, "glowstone");
  }
  // Ground storey: lantern standing on the ground floor slab.
  if (t % 6 === 2) {
    put(ix, inner.gy + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
