import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459514.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw538459514.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 19, H = 23, D = 12;
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// footprint lookup: key "x,z" -> ground
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => G.has(`${x},${z}`);
const isRing = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Rooftop of the lidar record: about 11 blocks above lowest ground, with at least
// two 5-block storeys plus a parapet; capped so rooftop plant still fits in H.
const roofFor = (ground) => Math.min(Math.max(11, ground + 10), 19);

const glowCells = []; // [x, y, z] interior cells to light behind windows

// Pass 1: foundations, interior floor slabs and roof slabs
for (const [key, ground] of G) {
  const [x, z] = key.split(",").map(Number);
  const T = roofFor(ground);

  for (let y = 0; y < ground; y++) put(x, y, z, "polished_andesite");

  if (!isRing(x, z)) {
    for (let fy = ground; fy < T; fy += 5) put(x, fy, z, "light_gray_concrete");
    put(x, T, z, "light_gray_concrete");
    if ((x + z) % 5 === 0) {
      put(x, T + 1, z, "light_gray_concrete");
      put(x, T + 2, z, "light_gray_concrete");
    }
  }
}

// Pass 2: exterior ring walls with base course, storey belts, window grids, shopfront, cornice, parapet
for (const [key, ground] of G) {
  const [x, z] = key.split(",").map(Number);
  if (!isRing(x, z)) continue;
  const T = roofFor(ground);

  let face, i, inward;
  if (!has(x, z - 1)) { face = "front"; i = x; inward = [x, z + 1]; }
  else if (!has(x, z + 1)) { face = "back"; i = x; inward = [x, z - 1]; }
  else if (!has(x - 1, z)) { face = "left"; i = z; inward = [x + 1, z]; }
  else { face = "right"; i = z; inward = [x - 1, z]; }

  const bay = i % 3;
  const isMullion = bay === 0;
  const isEntrance = face === "front" && x === 9;
  const isCanopyZone = face === "front" && x >= 7 && x <= 11;

  for (let y = ground; y <= T + 1; y++) {
    const rel = y - ground;
    const k = Math.floor(rel / 5);
    const r = rel % 5;

    if (y === T + 1) { put(x, y, z, "stone_brick_wall"); continue; }
    if (y === ground) { put(x, y, z, "stone_bricks"); continue; }
    if (y === T) { put(x, y, z, "smooth_stone"); continue; }

    if (k === 0) {
      // Ground storey: shopfront
      if (r === 1 || r === 2) {
        if (isEntrance) {
          const half = r === 1 ? "lower" : "upper";
          put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
        } else if (isMullion) {
          put(x, y, z, "white_concrete");
        } else {
          put(x, y, z, "light_blue_stained_glass");
        }
      } else if (r === 3) {
        if (isCanopyZone && face === "front") put(x, y, z, "smooth_stone");
        else if (isMullion) put(x, y, z, "white_concrete");
        else put(x, y, z, "light_blue_stained_glass");
      } else if (r === 4) {
        put(x, y, z, "polished_andesite");
      }
      continue;
    }

    // Upper storeys
    if (r === 0) { put(x, y, z, "light_gray_concrete"); continue; } // storey belt
    if (r === 4) { put(x, y, z, "white_concrete"); continue; }      // spandrel
    if (isMullion) { put(x, y, z, "gray_concrete"); continue; }      // mullion
    put(x, y, z, "light_blue_stained_glass");

    // Warm light one block inside selected windows, mid-height
    if (r === 2 && i % 6 === 1 && inward && !isRing(inward[0], inward[1]) && has(inward[0], inward[1])) {
      glowCells.push([inward[0], y, inward[1]]);
    }
  }
}

// Pass 3: warm lights behind glass
for (const [x, y, z] of glowCells) put(x, y, z, "glowstone");

g.save(OUT);
