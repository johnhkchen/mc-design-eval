import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499696";
const W = 23, H = 32, D = 9;
const STOREY = 5;          // blocks per storey
const ATTIC = 15;          // 3 storeys above base, attic/setback band above

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = raw.map(c => Array.isArray(c)
  ? { x: c[0], z: c[1], g: c[2], r: c[3] }
  : { x: c.x, z: c.z, g: c.ground ?? c.g, r: c.roof ?? c.r });

const key = (x, z) => `${x},${z}`;
const map = new Map(cells.map(c => [key(c.x, c.z), c]));
const has = (x, z) => map.has(key(x, z));

// Lowest ground under the footprint is y 0.
const y0 = Math.min(...cells.map(c => c.g));
for (const c of cells) c.gr = Math.max(0, Math.round(c.g - y0));

// Smooth the lidar roof into one flat tier (median), at least above the attic band.
const rs = cells.map(c => c.r).sort((a, b) => a - b);
const R = Math.max(ATTIC + 4, Math.round(rs[Math.floor(rs.length / 2)]));

// Distance from the outside edge (1 = perimeter wall ring, 2 = attic ring, ...).
const dist = new Map();
const queue = [];
for (const c of cells) {
  const edge = !has(c.x - 1, c.z) || !has(c.x + 1, c.z) || !has(c.x, c.z - 1) || !has(c.x, c.z + 1);
  if (edge) { dist.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nx = c.x + dx, nz = c.z + dz;
    if (has(nx, nz) && !dist.has(key(nx, nz))) {
      dist.set(key(nx, nz), d + 1);
      queue.push(map.get(key(nx, nz)));
    }
  }
}
const D_OF = (x, z) => dist.get(key(x, z)) ?? 99;

const g = new Voxels([W, H, D]);

// Inward neighbour of a perimeter cell (the footprint cell opposite the missing side).
function inward(x, z) {
  if (!has(x, z - 1) && has(x, z + 1)) return [x, z + 1];
  if (!has(x, z + 1) && has(x, z - 1)) return [x, z - 1];
  if (!has(x - 1, z) && has(x + 1, z)) return [x + 1, z];
  if (!has(x + 1, z) && has(x - 1, z)) return [x - 1, z];
  return null;
}

for (const c of cells) {
  const { x, z } = c;
  const d = D_OF(x, z);
  const perim = d === 1;
  // Face index for bay alignment: long faces (z-normal) run along x, short faces along z.
  const onZFace = !has(x, z - 1) || !has(x, z + 1);
  const t = onZFace ? x : z;

  for (let y = 0; y < R; y++) {
    // Foundation under the ground line.
    if (y < c.gr) { g.set(x, y, z, "stone_bricks"); continue; }
    // Roof membrane / cornice course.
    if (y === R - 1) {
      g.set(x, y, z, perim ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    // Base course.
    if (y === 0) { g.set(x, y, z, "stone_bricks"); continue; }
    // Floor slabs at every storey line: a projecting string course on the outer ring, slab deck inside.
    if (y % STOREY === 0 && y <= ATTIC) {
      if (perim) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "white_concrete");
      continue;
    }

    if (perim) {
      const rel = y % STOREY;
      const bayWindow = t % 3 !== 0;
      if (rel === 1) {
        if (bayWindow) g.set(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
        else g.set(x, y, z, "polished_andesite");
      } else if (rel === 2 || rel === 3) {
        if (bayWindow) {
          g.set(x, y, z, "light_blue_stained_glass");
          // Sparse warm light behind a few windows, in the air gap inside.
          const inw = inward(x, z);
          if (rel === 2 && y < ATTIC && inw && D_OF(inw[0], inw[1]) >= 2 && (x * 5 + z * 3 + y) % 7 === 0) {
            g.set(inw[0], y, inw[1], "lantern", { hanging: "false", waterlogged: "false" });
          }
        } else {
          g.set(x, y, z, "polished_andesite");
        }
      } else {
        // Lintel row and wall.
        g.set(x, y, z, "smooth_stone");
      }
    } else if (d === 2 && y > ATTIC) {
      // Attic setback ring: lighter stone with a few glazed bays.
      const rel = y % STOREY;
      if ((rel === 2 || rel === 3) && (x + z) % 2 === 0) g.set(x, y, z, "light_blue_stained_glass");
      else g.set(x, y, z, "smooth_stone");
    }
    // Interior cells above the foundation stay as air behind the glass.
  }

  // Parapet on the outer ring.
  if (perim) g.set(x, R, z, "stone_bricks");
}

// Entrance: centre of the south (+z) street face, with a small canopy.
const southFace = cells.filter(c => D_OF(c.x, c.z) === 1 && !has(c.x, c.z + 1));
if (southFace.length) {
  const mid = southFace.reduce((s, c) => s + c.x, 0) / southFace.length;
  const door = southFace.reduce((best, c) =>
    Math.abs(c.x - mid) < Math.abs(best.x - mid) ? c : best);
  const dx = door.x, dz = door.z;
  g.set(dx, 1, dz, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(dx, 2, dz, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const ox of [-1, 0, 1]) {
    if (has(dx + ox, dz) && !has(dx + ox, dz + 1)) {
      g.set(dx + ox, 3, dz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
  // Warm lantern beside the door, on the wall at the sill row.
  if (has(dx - 1, dz) && !has(dx - 1, dz + 1)) g.set(dx - 1, 2, dz, "lantern", { hanging: "false", waterlogged: "false" });
}

// Roof plant: a small 3x2 mechanical unit near the middle of the roof, set back from the parapet.
const interior = cells.filter(c => D_OF(c.x, c.z) >= 3);
const pool = interior.length ? interior : cells.filter(c => D_OF(c.x, c.z) >= 2);
if (pool.length) {
  const cx = pool.reduce((s, c) => s + c.x, 0) / pool.length;
  const cz = pool.reduce((s, c) => s + c.z, 0) / pool.length;
  const near = pool
    .map(c => ({ c, k: Math.abs(c.x - cx) + Math.abs(c.z - cz) }))
    .sort((a, b) => a.k - b.k)
    .slice(0, 6)
    .map(o => o.c);
  for (const c of near) {
    g.set(c.x, R, c.z, "iron_block");
    g.set(c.x, R + 1, c.z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
