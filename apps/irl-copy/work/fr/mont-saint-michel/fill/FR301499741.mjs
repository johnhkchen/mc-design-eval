import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// FR301499741: commercial, stone/render townhouse block on the Grande Rue side of the rock.
// Lidar roof ~24 blocks above lowest ground -> five storeys of 5 blocks, flat slate roof behind a stone parapet.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499741";
const W = 19, H = 36, D = 25;
const STOREY = 5;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cell = new Map();
for (const [x, z, gr, rf] of raw) cell.set(`${x},${z}`, { g: gr, r: rf });
const has = (x, z) => cell.has(`${x},${z}`);
const perimeter = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);

// Smooth lidar: mean height above ground over the 3x3 neighbourhood, then quantise to storeys.
const storeysOf = (x, z) => {
  let sum = 0, cnt = 0;
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const c = cell.get(`${x + dx},${z + dz}`);
    if (c) { sum += c.r - c.g; cnt++; }
  }
  const avg = sum / cnt;
  let n = Math.min(5, Math.max(1, Math.round(avg / STOREY)));
  // Setback: outer edge drops one tier below the top storey so the mass steps in at the roof.
  if (perimeter(x, z) && n >= 3) n -= 1;
  return n;
};
const topOf = (x, z, c) => c.g + storeysOf(x, z) * STOREY;

// Street face is the z = minimum edge; door sits at the middle of its front cells.
const frontXs = [];
for (const key of cell.keys()) {
  const [x, z] = key.split(",").map(Number);
  if (z === 0) frontXs.push(x);
}
frontXs.sort((a, b) => a - b);
const doorX = frontXs.length ? frontXs[Math.floor(frontXs.length / 2)] : Math.floor(W / 2);

const g = new Voxels([W, H, D]);

for (const [key, c] of cell) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.g;
  const top = topOf(x, z, c);
  const pm = perimeter(x, z);
  const exZ0 = !has(x, z - 1), exZ1 = !has(x, z + 1);
  const exX0 = !has(x - 1, z), exX1 = !has(x + 1, z);

  // Foundation from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const k = Math.floor(rel / STOREY);
    const o = rel % STOREY;

    if (!pm) {
      if (o === 0) g.set(x, y, z, "smooth_stone"); // interior floor slab, no interiors
      continue;
    }

    if (o === 0) {
      g.set(x, y, z, k === 0 ? "polished_granite" : "stone_bricks");
      continue;
    }
    if (o === 4) {
      g.set(x, y, z, k === 0 ? "polished_andesite" : "smooth_stone"); // storey line / lintel band
      continue;
    }

    // Window band, o = 1..3
    const zFace = exZ0 || exZ1;
    const idx = zFace ? x : z;
    const front = exZ0 && k === 0;

    if (front) {
      // Shopfront: glass with stone piers every 4 blocks, door opening at the centre.
      if (Math.abs(x - doorX) <= 1 && o <= 2) {
        g.set(x, y, z, "stone_bricks");
      } else if (idx % 4 === 0) {
        g.set(x, y, z, "stone_bricks");
      } else {
        g.set(x, y, z, "glass");
      }
    } else if (idx % 3 === 1) {
      const props = zFace
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      g.set(x, y, z, "glass_pane", props);
      // warm light behind some windows, placed on the interior side of the glass
      const lit = ((x * 7 + z * 13 + k * 5) % 4 === 0);
      if (lit && o === 2) {
        let dx = 0, dz = 0;
        if (exZ0) dz = 1; else if (exZ1) dz = -1; else if (exX0) dx = 1; else if (exX1) dx = -1;
        const ix = x + dx, iz = z + dz;
        if (has(ix, iz) && !perimeter(ix, iz)) g.set(ix, y, iz, "glowstone");
      }
    } else {
      // Pier between windows: stone with a recessed panel of andesite on the middle course.
      g.set(x, y, z, o === 2 ? "polished_andesite" : "stone_bricks");
    }
  }

  // Roof surface at top-1: slate inside, stone parapet at the edge, one extra parapet course on top.
  if (top - 1 >= gr) {
    g.set(x, top - 1, z, pm ? "stone_bricks" : "deepslate_tiles");
  }
  if (pm && top < H) {
    g.set(x, top, z, "stone_brick_wall"); // parapet cap, stands on the parapet course below
  }
}

// Entrance: double door set in the shopfront, with a lantern pair and a stone canopy lip above.
const doorCell = cell.get(`${doorX},0`);
if (doorCell) {
  const gr = doorCell.g;
  const dprops = { facing: "north", hinge: "left", open: "false", powered: "false" };
  g.set(doorX, gr, 0, "dark_oak_door", { ...dprops, half: "lower" });
  g.set(doorX, gr + 1, 0, "dark_oak_door", { ...dprops, half: "upper" });
  for (const dx of [-1, 1]) {
    if (has(doorX + dx, 0)) {
      g.set(doorX + dx, gr + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }
  if (has(doorX, 0)) g.set(doorX, gr + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
