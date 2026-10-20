import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397508";
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const W = 26, H = 23, D = 27;
const g = new Voxels([W, H, D]);

// Footprint: "x,z" -> ground
const foot = new Map();
for (const [x, z, gr] of list) foot.set(`${x},${z}`, gr);

const has = (x, z) => foot.has(`${x},${z}`);
const gnd = (x, z) => foot.get(`${x},${z}`);

// Lowest ground under the building and the roof level (about 11 above it)
let minG = Infinity;
for (const gr of foot.values()) minG = Math.min(minG, gr);
const R = Math.min(minG + 11, H - 4);

// Outward directions for edge cells
const DIRS = {
  north: [0, -1, [0, 1]],
  south: [0, 1, [0, -1]],
  west: [-1, 0, [1, 0]],
  east: [1, 0, [-1, 0]],
};

function outward(x, z) {
  for (const name of ["north", "south", "west", "east"]) {
    const [dx, dz] = DIRS[name];
    if (!has(x + dx, z + dz)) return name;
  }
  return null;
}

function put(x, y, z, id, props) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// Centroid and entrance choice (edge cell closest to centroid)
let cx = 0, cz = 0;
for (const [x, z] of foot.keys().map(k => k.split(",").map(Number))) { cx += x; cz += z; }
cx /= foot.size; cz /= foot.size;

let entrance = null;
let bestD = Infinity;
for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  if (!out) continue;
  // Prefer the street-facing sides (south/east), then nearest to centroid
  const pref = (out === "south" || out === "east") ? 0 : 6;
  const d = Math.hypot(x - cx, z - cz) + pref;
  if (d < bestD) { bestD = d; entrance = { x, z, out }; }
}

// Along-wall index for piers
const alongIdx = (x, z, out) => (out === "north" || out === "south") ? x : z;

// --- Foundations, floors, walls, roof deck ---
for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);
  const out = outward(x, z);
  const edge = out !== null;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Ground floor slab / base course
  if (edge) put(x, gr, z, "stone_bricks");
  else put(x, gr, z, "smooth_stone");

  for (let y = gr + 1; y <= R; y++) {
    const k = y - gr;

    if (!edge) {
      // Interior: floor slabs at each storey line, roof deck at R-1
      if (y === R - 1) put(x, y, z, "gray_concrete");
      else if (k % 5 === 0 && y < R - 1) put(x, y, z, "smooth_stone");
      continue;
    }

    // Edge (facade) cells
    if (y === R) {
      put(x, y, z, "white_concrete"); // parapet
      continue;
    }
    if (y === R - 1) {
      put(x, y, z, "light_gray_concrete"); // cornice course
      continue;
    }

    const pos = k % 5;
    const ground = k < 5;

    if (pos === 0) {
      put(x, y, z, ground ? "stone_bricks" : "light_gray_concrete");
      continue;
    }
    if (pos === 4) {
      put(x, y, z, ground ? "smooth_stone" : "white_concrete");
      continue;
    }

    // pos 1..3: openings
    const isEntrance = entrance && entrance.x === x && entrance.z === z;
    if (isEntrance && ground) {
      if (pos === 1) {
        put(x, y, z, "oak_door", { facing: out, half: "lower", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      if (pos === 2) {
        put(x, y, z, "oak_door", { facing: out, half: "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      // pos 3: transom
      put(x, y, z, "light_blue_stained_glass");
      continue;
    }

    const idx = alongIdx(x, z, out);
    if (idx % 3 === 0) {
      put(x, y, z, "white_concrete"); // pier
      continue;
    }

    put(x, y, z, "light_blue_stained_glass");

    // Warm light just behind some upper-storey windows
    if (!ground && pos === 2 && idx % 6 === 1) {
      const [ix, iz] = DIRS[out][2];
      const tx = x + ix, tz = z + iz;
      if (has(tx, tz) && !outward(tx, tz)) {
        put(tx, y, tz, "glowstone");
      }
    } else if (ground && pos === 2 && idx % 6 === 4) {
      const [ix, iz] = DIRS[out][2];
      const tx = x + ix, tz = z + iz;
      if (has(tx, tz) && !outward(tx, tz)) {
        put(tx, y, tz, "shroomlight");
      }
    }
  }
}

// --- Rooftop equipment: two-block plant boxes on the roof deck ---
for (const [key, gr] of foot) {
  const [x, z] = key.split(",").map(Number);
  if (outward(x, z)) continue;
  if ((x % 7 === 3 || x % 7 === 4) && (z % 7 === 3 || z % 7 === 4)) {
    if (R + 1 < H) {
      put(x, R, z, "smooth_stone");
      put(x, R + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
