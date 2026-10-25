import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const ID = "FR301499676";
const W = 14, H = 27, D = 10;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);
const map = new Map();
for (const c of list) {
  const [x, z, gr, rf] = c;
  map.set(`${x},${z}`, { gr, rf });
}
const has = (x, z) => map.has(`${x},${z}`);
const get = (x, z) => map.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p); else g.set(x, y, z, b);
};

// ---- massing -------------------------------------------------------------
const keys = [...map.keys()].map(k => k.split(",").map(Number));
const xs = keys.map(k => k[0]), zs = keys.map(k => k[1]);
const x0 = Math.min(...xs), x1 = Math.max(...xs);
const z0 = Math.min(...zs), z1 = Math.max(...zs);

const B = Math.min(...[...map.values()].map(v => v.gr));           // lowest ground
const rfs = [...map.values()].map(v => v.rf).sort((a, b) => a - b);
const med = rfs[Math.floor(rfs.length / 2)];
let Rm = Math.min(Math.max(med, B + 12), B + 18);
Rm = Math.min(Rm, H - 4);
const S = Math.max(4, Math.floor((Rm - B) / 3));                    // storey height (~5)

// per-cell roof tier from lidar, quantised to whole storeys (1..3)
const TOP = new Map();
for (const [key, c] of map) {
  const n = Math.min(3, Math.max(1, Math.round((c.rf - B) / S)));
  const t = Math.min(H - 4, Math.max(B + S * n, c.gr + S));
  TOP.set(key, t);
}
const T = (x, z) => TOP.get(`${x},${z}`);

const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// a side is exposed at height y if the neighbour is missing or its body is below y
const exposedSides = (x, z, y) => {
  const out = [];
  for (const d of ["N", "S", "W", "E"]) {
    const [dx, dz] = DIRS[d];
    const nx = x + dx, nz = z + dz;
    if (!has(nx, nz) || y >= T(nx, nz)) out.push(d);
  }
  return out;
};

const doorX = Math.round((x0 + x1) / 2);
const hasDoor = has(doorX, z0);

// ---- per cell -------------------------------------------------------------
for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = c.gr;
  const top = T(x, z);

  // foundation up to local ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - B;
    const k = Math.floor(rel / S);
    const r = rel - k * S;
    const sides = exposedSides(x, z, y);

    if (sides.length === 0) {
      // interior: air gap, with floor slabs at storey lines
      if (k >= 1 && r === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // shell
    if (y === top - 1) { put(x, y, z, "polished_andesite"); continue; }   // cornice
    if (sides.length >= 2) { put(x, y, z, "polished_andesite"); continue; } // corner pilaster
    if (y === B) { put(x, y, z, "stone_bricks"); continue; }              // plinth
    if (r === 0) { put(x, y, z, "polished_andesite"); continue; }         // storey line
    if (r === S - 1) { put(x, y, z, "smooth_stone"); continue; }          // spandrel

    // window / shopfront band
    const face = sides[0];
    const idx = (face === "N" || face === "S") ? x - x0 : z - z0;
    const mullion = idx % 3 === 0;

    // entrance on the north (street) face
    if (k === 0 && face === "N" && hasDoor && x === doorX && z === z0 && (r === 1 || r === 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north", half: r === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (mullion) {
      put(x, y, z, k === 0 ? "dark_oak_planks" : "stone_bricks");
    } else if (k === 0) {
      put(x, y, z, "glass");
    } else if (face === "N" || face === "S") {
      put(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
    } else {
      put(x, y, z, "glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
    }

    // warm light behind some glazing (inside the building, not in a wall)
    const lit = ((x * 7 + z * 13 + k * 5 + r) % 5) === 0;
    if (lit && !mullion) {
      const [dx, dz] = DIRS[face];
      const nx = x - dx, nz = z - dz;   // inward
      if (has(nx, nz) && exposedSides(nx, nz, y).length === 0 && y >= get(nx, nz).gr && y < T(nx, nz)) {
        put(nx, y, nz, "glowstone");
      }
    }
  }

  // flat roof on top of this cell's walls
  put(x, top, z, "stone");

  // parapet on the outer edge
  const outer = !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
  if (outer) put(x, top + 1, z, "stone_bricks");
}

// ---- roof equipment on the tallest tier ---------------------------------
const Tmax = Math.max(...[...TOP.values()]);
for (let x = x0 + 4; x <= x0 + 7; x++) {
  for (let z = z0 + 3; z <= z0 + 5; z++) {
    if (!has(x, z) || T(x, z) !== Tmax) continue;
    put(x, Tmax + 1, z, "light_gray_concrete");
    if (x >= x0 + 5 && x <= x0 + 6) put(x, Tmax + 2, z, "light_gray_concrete");
  }
}
if (has(x0 + 5, z0 + 4) && T(x0 + 5, z0 + 4) === Tmax) {
  put(x0 + 5, Tmax + 3, z0 + 4, "lantern", { hanging: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
