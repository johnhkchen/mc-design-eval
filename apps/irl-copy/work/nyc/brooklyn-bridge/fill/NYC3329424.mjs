import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329424.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3329424.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 29, H = 53, D = 21;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, s) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (s) g.set(x, y, z, b, s);
  else g.set(x, y, z, b);
};

const key = (x, z) => x + "," + z;
const foot = new Map();
for (const [x, z, gy, ry] of cells) {
  foot.set(key(x, z), { gy: Math.max(0, gy), ry: Math.min(ry, H - 5) });
}
const has = (x, z) => foot.has(key(x, z));

// Distance to nearest missing cell along cardinals: 1 = outer shell, 2 = second ring, 3+ = core
function edgeDist(x, z) {
  for (let k = 1; k <= 4; k++) {
    if (!has(x + k, z) || !has(x - k, z) || !has(x, z + k) || !has(x, z - k)) return k;
  }
  return 5;
}

// Pick the entrance: front (low-z) shell cell nearest the centre line
let doorX = null;
for (const k of foot.keys()) {
  const [x, z] = k.split(",").map(Number);
  if (!has(x, z - 1) && (doorX === null || Math.abs(x - 14) < Math.abs(doorX - 14))) doorX = x;
}

for (const [k, { gy, ry }] of foot) {
  const [x, z] = k.split(",").map(Number);
  const d = edgeDist(x, z);
  const shell = d === 1;
  // stepped massing: outer ring low, middle ring mid, core full height
  const top = d === 1 ? ry - 6 : d === 2 ? ry - 4 : ry - 2;

  for (let y = 0; y < gy; y++) put(x, y, z, "stone_bricks");

  const fx = !has(x - 1, z) || !has(x + 1, z);
  const fz = !has(x, z - 1) || !has(x, z + 1);
  const u = fx ? z : x;
  const corner = fx && fz;
  const isDoorCell = shell && !has(x, z - 1) && x === doorX;

  for (let y = gy; y <= top; y++) {
    const rel = y - gy;

    if (rel === 0) {
      put(x, y, z, shell ? "polished_granite" : "stone_bricks");
      continue;
    }
    if (y === top) {
      put(x, y, z, "stone_bricks");
      continue;
    }
    if (!shell) {
      if (rel === 3 || (rel >= 4 && rel % 2 === 0)) put(x, y, z, "stone_bricks");
      continue;
    }

    // shell facade
    if (rel === 3 || (rel >= 4 && rel % 2 === 0)) {
      put(x, y, z, "stone_bricks"); // string course / floor line
      continue;
    }
    if (rel === 1 || rel === 2) {
      if (isDoorCell) {
        const half = rel === 1 ? "lower" : "upper";
        put(x, y, z, "oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      } else if (corner || u % 3 === 0) {
        put(x, y, z, "polished_granite");
      } else {
        put(x, y, z, "glass");
      }
      continue;
    }
    // upper window rows (odd rel >= 5)
    if (corner || u % 3 === 0) {
      // quoins alternate with pier brick
      put(x, y, z, (corner && rel % 4 === 1) ? "polished_granite" : "bricks");
    } else if (rel >= 9 && (u + rel) % 23 === 2) {
      put(x, y, z, "glowstone"); // rare warm window
    } else {
      put(x, y, z, "glass");
    }
  }

  // cornice course and parapet on the outer shell
  if (shell) {
    put(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    put(x, top + 2, z, "stone_brick_wall");
  }

  // masonry penthouse on the core, with a clean roof
  if (d >= 3 && x >= 10 && x <= 18 && z >= 6 && z <= 14) {
    const edge = x === 10 || x === 18 || z === 6 || z === 14;
    for (let y = top + 1; y <= top + 3; y++) {
      if (edge) put(x, y, z, (y === top + 2 && (x + z) % 2 === 0) ? "glass" : "bricks");
      else put(x, y, z, "bricks");
    }
    put(x, top + 4, z, "stone_bricks");
  }
}

g.save(OUT);
