import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001554.cells.json`, "utf8"));

const W = 10, H = 24, D = 5;
const vx = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const raw = new Map();
let base = Infinity;
for (const [x, z, gr, r] of cells) {
  const gg = Math.max(0, Math.round(gr));
  base = Math.min(base, gg);
  raw.set(key(x, z), { g: gg, r: Math.round(r) });
}
if (!isFinite(base)) base = 0;

const has = (x, z) => raw.has(key(x, z));
const ext = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Smooth the lidar roof over each cell and its neighbours, then snap to 3-block storey tiers.
const info = new Map();
for (const [k, v] of raw) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const q = raw.get(key(x + dx, z + dz));
    if (q) { sum += q.r; n++; }
  }
  const avg = sum / n;
  const tier = Math.round(avg / 3) * 3;
  const top = Math.min(Math.max(v.g + 3, tier, base + 6), H - 5);
  info.set(k, { g: v.g, top });
}

const DOOR = (half, hinge) => ({ facing: "north", half, hinge, open: "false", powered: "false" });

for (const [k, { g: gg, top }] of info) {
  const [x, z] = k.split(",").map(Number);
  const exterior = ext(x, z);
  const front = !has(x, z - 1);
  const back = !has(x, z + 1);
  const wl = !has(x - 1, z);
  const wr = !has(x + 1, z);

  // Foundation down to ground (fills the downhill side).
  for (let y = 0; y < gg; y++) vx.set(x, y, z, "stone_bricks");

  for (let y = gg; y < top; y++) {
    const off = y - base;             // absolute storey grid
    const k3 = ((off % 3) + 3) % 3;   // 0 = floor line, 1-2 = window rows
    const roofRow = y === top - 1;

    // Entrance on the street front, two blocks tall, at the cell's first two rows.
    if (front && x === 4 && (y === gg || y === gg + 1)) {
      vx.set(x, y, z, "oak_door", DOOR(y === gg ? "lower" : "upper", "left"));
      continue;
    }

    if (roofRow) {
      vx.set(x, y, z, exterior ? "stone_bricks" : "smooth_stone");
      continue;
    }

    if (k3 === 0) {
      // Floor slabs inside, belt courses on the outside.
      vx.set(x, y, z, "smooth_stone");
      continue;
    }

    if (!exterior) continue; // room air behind the glass

    const groundFloor = off < 3;
    const wallMat = front && groundFloor ? "brown_terracotta" : "bricks";

    let win = false;
    if (front || back) win = [1, 3, 6, 8].includes(x);
    if (wl || wr) win = z === 2;

    if (win) {
      vx.set(x, y, z, "glass_pane");
      // Warm glow behind some panes, in the room just inside.
      if (k3 === 1 && (x + Math.floor(off / 3)) % 2 === 0) {
        let tx = x, tz = z;
        if (front) tz = z + 1;
        else if (back) tz = z - 1;
        else if (wl) tx = x + 1;
        else if (wr) tx = x - 1;
        if (has(tx, tz) && !ext(tx, tz)) vx.set(tx, y, tz, "glowstone");
      }
    } else {
      vx.set(x, y, z, wallMat);
    }
  }
}

// Cornice shadow line just under the parapet on the street front.
for (const [k, { top }] of info) {
  const [x, z] = k.split(",").map(Number);
  if (ext(x, z) && !has(x, z - 1) && top - 2 >= 0) {
    vx.set(x, top - 2, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
  }
}

// Brick chimney stacks on the flat roof.
for (const [cx, cz] of [[2, 1], [7, 3]]) {
  if (!info.has(key(cx, cz))) continue;
  const { top } = info.get(key(cx, cz));
  for (let y = top; y <= top + 2 && y < H; y++) vx.set(cx, y, cz, "bricks");
  if (top + 3 < H) vx.set(cx, top + 3, cz, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

vx.save(`${DIR}/NYC3001554.nbt`);
