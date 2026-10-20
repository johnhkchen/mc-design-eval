import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "TPE106-0180-1F";
const W = 7, H = 19, D = 29;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const has = (x, z) => ground.has(`${x},${z}`);

const minG = Math.min(...cells.map((c) => c[2]));
const minX = Math.min(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));

// Lidar record: roof about 7 blocks above the lowest ground.
const T0 = Math.min(minG + 6, H - 2);

const vox = new Voxels([W, H, D]);
const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) vox.set(x, y, z, id, props);
  else vox.set(x, y, z, id);
};

const westCells = cells.filter(([x, z]) => !has(x - 1, z));
let doorKey = null;
if (westCells.length) {
  const meanZ = westCells.reduce((s, c) => s + c[1], 0) / westCells.length;
  const best = westCells.reduce((b, c) =>
    Math.abs(c[1] - meanZ) < Math.abs(b[1] - meanZ) ? c : b);
  doorKey = `${best[0]},${best[1]}`;
}

for (const [x, z, g] of cells) {
  // Per-cell roof: the common line, but never less than three blocks above this cell's ground,
  // so a high cell carries its own roof instead of a foundation poking through.
  const T = Math.min(Math.max(T0, g + 3), H - 2);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g && y < H; y++) put(x, y, z, "stone_bricks");

  const missing = {
    w: !has(x - 1, z),
    e: !has(x + 1, z),
    s: !has(x, z - 1),
    n: !has(x, z + 1),
  };
  const sides = Object.keys(missing).filter((k) => missing[k]);
  const edge = sides.length > 0;
  const corner = sides.length >= 2;
  const side = sides[0];
  const inward = side === "w" ? [1, 0] : side === "e" ? [-1, 0]
    : side === "s" ? [0, 1] : side === "n" ? [0, -1] : null;
  const idx = side === "w" || side === "e" ? z - minZ : x - minX;

  for (let y = g; y <= T; y++) {
    const rel = y - g;

    if (y === T) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (!edge) {
      if (rel === 0 || rel === 5) put(x, y, z, "smooth_stone");
      continue;
    }

    if (rel === 0) {
      put(x, y, z, "polished_granite");
    } else if (rel >= 1 && rel <= 3) {
      const isDoor = doorKey === `${x},${z}` && rel <= 2;
      if (isDoor) {
        const props = (half) => ({ facing: "west", half, hinge: "left", open: "false", powered: "false" });
        put(x, y, z, "oak_door", props(rel === 1 ? "lower" : "upper"));
      } else if (corner || idx % 3 === 0) {
        put(x, y, z, "light_gray_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass");
      }
      if (!isDoor && rel === 2 && !corner && idx % 4 === 2 && inward) {
        const ix = x + inward[0], iz = z + inward[1];
        if (has(ix, iz)) put(ix, y, iz, "glowstone");
      }
    } else if (rel === 4) {
      put(x, y, z, "white_concrete");
    } else if (rel === 5) {
      put(x, y, z, "light_gray_concrete");
    } else {
      put(x, y, z, "white_concrete");
    }
  }

  // Ground-storey floor slab across the whole footprint.
  put(x, g, z, "smooth_stone");

  // Parapet coping on the edge; sparse roof plant inside.
  if (edge && T + 1 < H) {
    put(x, T + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else if (!edge && T + 1 < H && (x * 3 + z * 5) % 17 === 0) {
    put(x, T + 1, z, "light_gray_concrete");
  }
}

vox.save(`${DIR}/${ID}.nbt`);
