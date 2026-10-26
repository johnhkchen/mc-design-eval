import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86574";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 33, H = 32, D = 35;
const STOREY = 4;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const rec = new Map();
for (const [x, z, gr, roof] of cells) rec.set(key(x, z), { gy: gr, roof });

// Depth from outside: 1 = facade ring, 2 = inner ring (air behind glass), >=3 = solid core.
const depth = new Map();
const queue = [];
for (const [k] of rec) {
  const [x, z] = k.split(",").map(Number);
  const edge = !rec.has(key(x - 1, z)) || !rec.has(key(x + 1, z)) ||
               !rec.has(key(x, z - 1)) || !rec.has(key(x, z + 1));
  if (edge) { depth.set(k, 1); queue.push([x, z]); }
}
for (let i = 0; i < queue.length; i++) {
  const [x, z] = queue[i];
  const d = depth.get(key(x, z));
  for (const [dx, dz] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
    const nk = key(x + dx, z + dz);
    if (rec.has(nk) && !depth.has(nk)) { depth.set(nk, d + 1); queue.push([x + dx, z + dz]); }
  }
}

// Front entrance: outward-north edge cell nearest the middle of the footprint.
let doorKey = null, best = Infinity;
for (const [k] of rec) {
  const [x, z] = k.split(",").map(Number);
  if (!rec.has(key(x, z - 1)) && depth.get(k) === 1) {
    const dist = Math.abs(x - 16);
    if (dist < best) { best = dist; doorKey = k; }
  }
}
const [doorX, doorZ] = doorKey ? doorKey.split(",").map(Number) : [-1, -1];

const set = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props); else g.set(x, y, z, id);
};

for (const [k, { gy: rawGy, roof }] of rec) {
  const [x, z] = k.split(",").map(Number);
  const d = depth.get(k) ?? 3;
  const gy = Math.min(rawGy, H - 8);

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gy; y++) set(x, y, z, "stone_bricks");

  // Storeys quantised from lidar roof height, in clean 4-block tiers.
  const n = Math.max(1, Math.round((roof - gy) / STOREY));
  const t = Math.min(gy + STOREY * n, H - 5);

  if (d === 1) {
    const missN = !rec.has(key(x, z - 1));
    const missS = !rec.has(key(x, z + 1));
    const missW = !rec.has(key(x - 1, z));
    const missE = !rec.has(key(x + 1, z));
    const exposedZ = missN || missS;
    const exposedX = missW || missE;
    const corner = exposedZ && exposedX;
    const mullion = !corner && ((exposedZ && x % 3 === 0) || (exposedX && z % 3 === 0));
    const isDoorCell = k === doorKey;
    const facing = missN ? "north" : missS ? "south" : missW ? "west" : "east";

    for (let y = gy; y < t; y++) {
      const rel = (y - gy) % STOREY;
      const storey = Math.floor((y - gy) / STOREY);
      if (y === t - 1) { set(x, y, z, corner ? "chiseled_stone_bricks" : "smooth_stone"); continue; }
      if (rel === 0) {
        set(x, y, z, storey === 0 ? "polished_granite" : "white_concrete");
        continue;
      }
      if (storey === 0 && isDoorCell && (y === gy + 1 || y === gy + 2)) {
        const half = y === gy + 1 ? "lower" : "upper";
        set(x, y, z, "dark_oak_door", { facing, half, hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (storey === 0 && isDoorCell && y === gy + 3) { set(x, y, z, "polished_granite"); continue; }
      if (corner || mullion) { set(x, y, z, "light_gray_concrete"); continue; }
      const lit = ((x * 7 + y * 5 + z * 3) % 23 === 0) && rel === 2;
      set(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
    }

    // Entrance: lanterns flank the door on a granite plinth.
    if (storey0Door(k, doorKey)) {
      const dx = facing === "west" || facing === "east" ? 0 : 1;
      const dz = facing === "north" || facing === "south" ? 0 : 1;
      for (const s of [-2, 2]) {
        set(x + s * dx, gy, z + s * dz, "polished_granite");
        set(x + s * dx, gy + 1, z + s * dz, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }

    // Cornice slab sitting on the top course, giving a clean parapet line.
    if (t < H - 1) set(x, t, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else if (d === 2) {
    // Inner ring: floor slabs at each storey line, air behind the glass.
    for (let y = gy; y < t; y++) {
      const rel = (y - gy) % STOREY;
      if (y === t - 1 || rel === 0) set(x, y, z, "light_gray_concrete");
    }
  } else {
    // Solid core.
    for (let y = gy; y < t; y++) set(x, y, z, "light_gray_concrete");
    // Rooftop mechanical blocks: 3x3 plant rooms every 11 blocks, two high.
    if (x % 11 >= 5 && x % 11 <= 7 && z % 11 >= 5 && z % 11 <= 7) {
      set(x, t, z, "stone_bricks");
      set(x, t + 1, z, (x % 11 === 6 && z % 11 === 6) ? "stone_brick_slab" : "smooth_stone");
    }
  }
}

function storey0Door(k, dk) {
  return k === dk;
}

g.save(`${DIR}/${ID}.nbt`);
