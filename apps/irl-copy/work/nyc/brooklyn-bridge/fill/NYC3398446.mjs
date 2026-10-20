import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3398446";
const W = 27, H = 37, D = 87;

// ---- read footprint cells: [x, z, ground, roof] ----
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? Object.values(raw));
const key = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of list) {
  const [x0, z0, gr, roof] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  const x = Math.round(x0), z = Math.round(z0);
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  cellMap.set(key(x, z), { g: Math.max(0, Math.round(gr)), r: Math.round(roof) });
}
const S = new Set(cellMap.keys());
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];

// base course: highest ground under the footprint
let B = 0;
for (const v of cellMap.values()) B = Math.max(B, v.g);
const P = B + 8; // podium roof (about 4 storeys)

// ---- distance from footprint edge (drives the stepped massing) ----
const dist = new Map();
const queue = [];
for (const k of S) {
  const [x, z] = k.split(",").map(Number);
  if (N4.some(([dx, dz]) => !S.has(key(x + dx, z + dz)))) {
    dist.set(k, 1);
    queue.push(k);
  }
}
for (let i = 0; i < queue.length; i++) {
  const k = queue[i];
  const [x, z] = k.split(",").map(Number);
  for (const [dx, dz] of N4) {
    const nk = key(x + dx, z + dz);
    if (S.has(nk) && !dist.has(nk)) {
      dist.set(nk, dist.get(k) + 1);
      queue.push(nk);
    }
  }
}

// ---- smoothed roof per cell, quantised to 2-block storeys ----
const nMax = Math.floor((33 - B) / 2);
const topOf = new Map();
for (const k of S) {
  const [x, z] = k.split(",").map(Number);
  let sum = 0, cnt = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const v = cellMap.get(key(x + dx, z + dz));
    if (v) { sum += v.r; cnt++; }
  }
  let n = Math.round((sum / cnt - B) / 2);
  n = Math.max(2, Math.min(nMax, n));
  topOf.set(k, B + 2 * n);
}

// ---- three nested tiers: podium (edge 1-2), mid tower (3-5), top tower (6+) ----
// Each column is solid from 0 to its own colTop, so every tier stands on the one below.
const colTop = new Map();
for (const k of S) {
  const T = topOf.get(k);
  const d = dist.get(k) ?? 99;
  const base = d >= 6 ? T : d >= 3 ? Math.max(P, T - 6) : P;
  colTop.set(k, Math.min(base, T));
}

// ---- helpers ----
const blocks = new Map();
const put = (x, y, z, id, props) => blocks.set(`${x},${y},${z}`, { x, y, z, id, props });

// a wall cell at height y is exposed if a neighbour is outside the footprint or stops below y
const exposedDir = (x, z, y) => N4.map(([dx, dz]) => {
  const nk = key(x + dx, z + dz);
  return (!S.has(nk) || colTop.get(nk) <= y) ? [dx, dz] : null;
}).filter(Boolean);
const exposed = (x, z, y) => exposedDir(x, z, y).length > 0;

// ---- build columns ----
for (const k of S) {
  const [x, z] = k.split(",").map(Number);
  const ct = colTop.get(k);

  // foundation from y 0 to ground, plinth to base course
  for (let y = 0; y < B; y++) put(x, y, z, "stone_bricks");

  for (let y = B; y < ct; y++) {
    const rel = y - B;
    const modern = y >= P; // mid and top tiers read as glass and concrete

    // roof slab on top of each column
    if (y === ct - 1) {
      put(x, y, z, "smooth_stone");
      continue;
    }

    if (rel % 2 === 0) {
      // floor line / spandrel
      if (!exposed(x, z, y)) {
        put(x, y, z, "smooth_stone");
      } else if (rel % 6 === 0) {
        put(x, y, z, "smooth_stone");
      } else {
        put(x, y, z, modern ? "gray_concrete" : "bricks");
      }
    } else if (exposed(x, z, y)) {
      // window row: pier or glass, bay chosen along the exposed face
      const dirs = exposedDir(x, z, y);
      const onZFace = dirs.some(([, dz]) => dz !== 0);
      const bay = onZFace ? x : z;
      if (bay % 3 === 0) put(x, y, z, modern ? "white_concrete" : "stone_bricks");
      else put(x, y, z, "light_blue_stained_glass");
    }
    // interior stays air behind the glass
  }

  // parapet on exposed top edge
  if (exposed(x, z, ct - 1)) put(x, ct, z, "stone_bricks");
}

// ---- one clear rooftop penthouse on the top tower ----
for (const k of S) {
  const [x, z] = k.split(",").map(Number);
  const T = topOf.get(k);
  if (colTop.get(k) !== T || (dist.get(k) ?? 99) < 6) continue;
  if (x < 9 || x > 15 || z < 38 || z > 48) continue;
  if (exposed(x, z, T - 1)) continue;
  put(x, T, z, "light_gray_concrete");
  put(x, T + 1, z, (x + z) % 2 ? "light_gray_concrete" : "smooth_stone");
}

// ---- warm lights behind some windows ----
for (const k of S) {
  const [x, z] = k.split(",").map(Number);
  const ct = colTop.get(k);
  for (let y = B + 1; y < ct - 1; y += 2) {
    if (!exposed(x, z, y)) continue;
    const rel = y - B;
    if ((x * 7 + z * 3 + rel) % 11 !== 0) continue;
    for (const [dx, dz] of N4) {
      const nk = key(x + dx, z + dz);
      if (!S.has(nk) || colTop.get(nk) <= y) continue;
      if (exposed(x + dx, z + dz, y)) continue;
      put(x + dx, y, z + dz, "glowstone");
      break;
    }
  }
}

// ---- main entrance on the minimum-z face near the centre ----
let door = null;
for (const k of S) {
  const [x, z] = k.split(",").map(Number);
  if (!exposedDir(x, z, B).some(([, dz]) => dz === -1)) continue;
  const score = Math.abs(x - Math.floor(W / 2));
  if (!door || z < door.z || (z === door.z && score < door.score)) door = { x, z, score };
}
if (door) {
  const lower = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
  const upper = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
  put(door.x, B, door.z, "dark_oak_door", lower);
  put(door.x, B + 1, door.z, "dark_oak_door", upper);
}

// ---- write voxels ----
const g = new Voxels([W, H, D]);
for (const b of blocks.values()) {
  if (b.x < 0 || b.x >= W || b.y < 0 || b.y >= H || b.z < 0 || b.z >= D) continue;
  if (b.props) g.set(b.x, b.y, b.z, b.id, b.props);
  else g.set(b.x, b.y, b.z, b.id);
}
g.save(`${DIR}/${ID}.nbt`);
