import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3346567";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 22, H = 40, D = 60;
const g = new Voxels([W, H, D]);

const STOREY = 3;
const key = (x, z) => `${x},${z}`;
const DIRS = [
  [0, -1, "north"],
  [0, 1, "south"],
  [-1, 0, "west"],
  [1, 0, "east"],
];

// --- footprint model -------------------------------------------------------
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.min(H - 8, Math.round(gr)));
  map.set(key(x, z), { x, z, gr: ground, rf: Math.round(rf) });
}

// smooth lidar roof: median over a 7x7 window, then snap to whole storeys
for (const c of map.values()) {
  const vals = [];
  for (let dx = -3; dx <= 3; dx++) {
    for (let dz = -3; dz <= 3; dz++) {
      const n = map.get(key(c.x + dx, c.z + dz));
      if (n) vals.push(n.rf);
    }
  }
  vals.sort((a, b) => a - b);
  const med = vals[Math.floor(vals.length / 2)];
  let top = c.gr + STOREY * Math.max(1, Math.round((med - c.gr) / STOREY));
  top = Math.max(c.gr + STOREY, Math.min(H - 5, top));
  c.top = top;
}

// depth from outside edge: 1 = facade, 2 = next ring, ...
const depth = new Map();
const queue = [];
for (const c of map.values()) {
  const edge = DIRS.some(([dx, dz]) => !map.has(key(c.x + dx, c.z + dz)));
  if (edge) { depth.set(key(c.x, c.z), 1); queue.push(c); }
}
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  const d = depth.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) {
    const k = key(c.x + dx, c.z + dz);
    if (map.has(k) && !depth.has(k)) {
      depth.set(k, d + 1);
      queue.push(map.get(k));
    }
  }
}

// perimeter steps down one storey under the taller core
for (const c of map.values()) {
  const d = depth.get(key(c.x, c.z)) ?? 1;
  if (d <= 2 && c.top - c.gr >= 12) c.top -= STOREY;
}

// --- entrance: the lowest-z (street) face, centred -------------------------
let streetZ = Infinity;
for (const c of map.values()) if (!map.has(key(c.x, c.z - 1))) streetZ = Math.min(streetZ, c.z);
const streetCells = [...map.values()].filter((c) => c.z === streetZ);
const entranceX = streetCells.length
  ? streetCells.map((c) => c.x).sort((a, b) => a - b)[Math.floor(streetCells.length / 2)]
  : -1;

// --- helpers ---------------------------------------------------------------
const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const outward = (c) => {
  for (const [dx, dz, name] of DIRS) {
    if (!map.has(key(c.x + dx, c.z + dz))) return name;
  }
  return null;
};

// --- build each cell -------------------------------------------------------
for (const c of map.values()) {
  const { x, z, gr, top } = c;
  const d = depth.get(key(x, z)) ?? 1;
  const edge = d === 1;
  const out = outward(c);
  const alongAxisX = out === "north" || out === "south";
  const along = alongAxisX ? x : z;
  const across = alongAxisX ? z : x;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - gr;
    const k = Math.floor(rel / STOREY);
    const within = rel % STOREY;
    const isTop = y === top - 1;

    if (!edge) {
      // interior: floor slabs and roof only, air between
      if (isTop || within === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // facade
    if (isTop) { put(x, y, z, "stone_bricks"); continue; }     // cornice
    if (within === 0) {
      // spandrel band, a little darker at the base course
      put(x, y, z, k === 0 ? "stone_bricks" : "stone_bricks");
      continue;
    }

    // pilasters every fourth bay, brick piers between windows
    const pilaster = along % 4 === 0;
    const bay = along % 2 === 0;
    if (!bay || pilaster) {
      put(x, y, z, pilaster ? "stone_bricks" : "bricks");
      continue;
    }

    // main entrance on the street face
    const isEntrance = out === "north" && k === 0 && x === entranceX;
    if (isEntrance && (within === 1 || within === 2)) {
      const half = within === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: out, half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (k === 0) {
      // ground-floor shopfront glazing
      put(x, y, z, "glass");
    } else {
      // residential windows, a few lit warm from behind
      const lit = within === 1 && (along * 5 + k * 3 + across) % 7 === 0;
      put(x, y, z, lit ? "glowstone" : "light_blue_stained_glass");
    }
  }

  // parapet course above facade cells
  if (edge && top < H) put(x, top, z, "stone_bricks");

  // mechanical penthouses on settled core roofs
  if (!edge && d >= 3 && x % 6 === 2 && z % 9 === 4 && top + 3 < H) {
    put(x, top, z, "light_gray_concrete");
    put(x, top + 1, z, "light_gray_concrete");
    put(x, top + 2, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
