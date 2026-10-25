import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499491";
const W = 23, H = 29, D = 31;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, ground, roof] of cells) map.set(key(x, z), { g: ground, r: roof });
const has = (x, z) => map.has(key(x, z));

const put = (x, y, z, b, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// One flat roof tier for the whole block (median of lidar roof heights),
// so the massing reads as a clean cornice line instead of a sawtooth.
// Only cells whose ground is much higher get clamped down to stay above their foundation.
const roofs = [...map.values()].map(c => c.r).sort((a, b) => a - b);
const TIER = Math.max(8, Math.min(H - 3, roofs[Math.floor(roofs.length / 2)]));
const topOf = (k) => {
  const c = map.get(k);
  return Math.max(c.g + 6, Math.min(H - 3, TIER));
};

const expo = (x, z) => ({
  xm: !has(x - 1, z), xp: !has(x + 1, z),
  zm: !has(x, z - 1), zp: !has(x, z + 1),
});

// Entrance: on the z-min face, nearest the middle of the width.
let door = null;
{
  const cands = cells.filter(([x, z]) => expo(x, z).zm);
  const pool = cands.length ? cands : cells.filter(([x, z]) => expo(x, z).xm || expo(x, z).xp);
  const mid = (W - 1) / 2;
  pool.sort((a, b) => Math.abs(a[0] - mid) - Math.abs(b[0] - mid));
  if (pool.length) door = key(pool[0][0], pool[0][1]);
}

for (const [x, z] of cells) {
  const k = key(x, z);
  const gr = map.get(k).g;
  const top = topOf(k);
  const e = expo(x, z);
  const shell = e.xm || e.xp || e.zm || e.zp;
  const exCount = (e.xm ? 1 : 0) + (e.xp ? 1 : 0) + (e.zm ? 1 : 0) + (e.zp ? 1 : 0);
  const corner = (e.xm || e.xp) && (e.zm || e.zp);
  const windowable = shell && !corner && exCount === 1 && (x + z) % 3 === 1;
  const isDoor = k === door;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "granite");

  // Interior storey slabs (shell cells get their course below).
  if (!shell) {
    for (let k5 = 0; k5 <= 3; k5++) {
      const fy = gr + 5 * k5;
      if (fy < top) put(x, fy, z, "smooth_stone");
    }
  }

  // Shell walls: plinth, shopfront, storey bands, cornice.
  if (shell) {
    for (let y = gr; y < top; y++) {
      const rel = y - gr;
      const b = rel % 5;
      let blk = "granite";
      let props;
      if (rel === 0) {
        blk = "polished_granite";
      } else if (rel < 5) {
        // Ground floor: glazed shopfront with a dark fascia.
        if (corner) blk = "polished_granite";
        else if (rel === 4) blk = "dark_oak_planks";
        else blk = "glass";
        if (isDoor) {
          if (rel === 1 || rel === 2) {
            blk = "oak_door";
            props = { facing: "south", half: rel === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" };
          } else if (rel === 3) {
            // Hood over the entrance: a slab of dark stone, not glass.
            blk = "stone_brick_slab";
            props = { type: "top", waterlogged: "false" };
          }
        }
      } else {
        if (b === 0) blk = "polished_granite";
        else if (b === 4) blk = "granite";
        else if (windowable) blk = "glass_pane";
        else blk = "granite";
      }
      if (y === top - 1) blk = "polished_granite"; // cornice course
      put(x, y, z, blk, props);
    }

    // Entrance surround: flanking pillars and a lintel course beside the door.
    if (isDoor) {
      for (let y = gr + 1; y <= gr + 3; y++) put(x, y, z, "polished_granite");
      put(x, gr + 1, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 2, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
      put(x, gr + 3, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    }

    // Warm light behind some upper-storey windows.
    if (windowable && ((x + z) % 6 === 1)) {
      let ix = x, iz = z;
      if (e.xm) ix = x + 1; else if (e.xp) ix = x - 1;
      else if (e.zm) iz = z + 1; else if (e.zp) iz = z - 1;
      if (has(ix, iz)) {
        for (let k5 = 1; k5 <= 3; k5++) {
          const wy = gr + 5 * k5 + 2;
          if (wy < top - 1) put(ix, wy, iz, "glowstone");
        }
      }
    }
  }

  // Roof deck on every footprint cell, parapet on the perimeter.
  put(x, top, z, "deepslate_tiles");
  if (shell) put(x, top + 1, z, "granite_wall");

  // Chimney stacks on interior cells.
  if (!shell && (x * 3 + z * 5) % 37 === 0 && top + 3 < H) {
    put(x, top + 1, z, "bricks");
    put(x, top + 2, z, "bricks");
  }
}

g.save(`${DIR}/${ID}.nbt`);
