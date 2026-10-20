import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3398447.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3398447.nbt";

const W = 26, H = 27, D = 63;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(x + "," + z, { g: gr, r: roof });
const has = (x, z) => map.has(x + "," + z);

const g = new Voxels([W, H, D]);

function put(x, y, z, b, p) {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

// Median roof height, used to cap lidar spikes
const roofs = [...map.values()].map(v => Math.round(v.r)).sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const cap = medRoof + 3;

// Smooth roof over a 3x3 neighbourhood of footprint cells
function smoothRoof(x, z) {
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const v = map.get((x + dx) + "," + (z + dz));
      if (v) { sum += Math.round(v.r); n++; }
    }
  return sum / n;
}

const info = new Map();
for (const [key, { g: gr0 }] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = Math.max(0, Math.round(gr0));
  const rs = Math.min(cap, smoothRoof(x, z));
  let T = gr + 2 * Math.round((rs - gr) / 2);
  T = Math.min(H - 4, Math.max(gr + 6, T));
  const missingX = !has(x - 1, z) || !has(x + 1, z);
  const missingZ = !has(x, z - 1) || !has(x, z + 1);
  const perimeter = missingX || missingZ;
  const corner = missingX && missingZ;
  info.set(key, { x, z, gr, T, perimeter, corner, a: missingX ? z : x });
}

// Build the shell
for (const [, c] of info) {
  const { x, z, gr, T, perimeter, corner, a } = c;

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < T; y++) {
    const rel = y - gr;

    if (y === T - 1) {
      put(x, y, z, perimeter ? "stone_bricks" : "gray_concrete");
      continue;
    }

    if (!perimeter) {
      if (rel === 3 || (rel >= 4 && rel % 2 === 0)) put(x, y, z, "smooth_stone");
      continue;
    }

    // Corner columns run full height for a clear vertical read
    if (corner) {
      put(x, y, z, rel % 2 === 0 ? "polished_andesite" : "stone_bricks");
      continue;
    }

    if (rel < 3) {
      if (a % 3 === 0) put(x, y, z, "stone_bricks");
      else put(x, y, z, "light_blue_stained_glass");
      continue;
    }
    if (rel === 3) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (rel % 2 === 0) {
      put(x, y, z, "smooth_stone");
    } else {
      if (a % 3 === 0) {
        put(x, y, z, "bricks");
      } else {
        const warm = (x * 31 + z * 17 + rel * 7) % 11 === 0;
        put(x, y, z, warm ? "glowstone" : "light_blue_stained_glass");
      }
    }
  }
}

// One mechanical penthouse block on the roof, centred on the footprint
const cx = Math.round(W / 2), cz = Math.round(D / 2);
for (const [, c] of info) {
  const { x, z, T, perimeter } = c;
  if (perimeter) continue;
  if (Math.abs(x - cx) <= 3 && Math.abs(z - cz) <= 6 && T + 2 < H) {
    put(x, T, z, "light_gray_concrete");
    put(x, T + 1, z, "iron_block");
  }
}

// Street entrance on the low-z frontage, nearest the centre, with stone lintel
let best = null;
for (const [, c] of info) {
  if (!c.perimeter || c.corner || has(c.x, c.z - 1)) continue;
  const d = Math.abs(c.x - cx);
  if (!best || d < best.d) best = { d, c };
}
if (best) {
  const { x, z, gr } = best.c;
  // flanking piers and lintel frame the door
  put(x - 1, gr, z, "polished_andesite");
  put(x + 1, gr, z, "polished_andesite");
  put(x - 1, gr + 1, z, "polished_andesite");
  put(x + 1, gr + 1, z, "polished_andesite");
  put(x, gr + 2, z, "stone_bricks");
  put(x - 1, gr + 2, z, "stone_bricks");
  put(x + 1, gr + 2, z, "stone_bricks");
  g.set(x, gr, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(OUT);
