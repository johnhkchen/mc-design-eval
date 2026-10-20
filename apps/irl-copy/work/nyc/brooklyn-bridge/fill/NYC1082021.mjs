import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1082021";

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : raw.cells;

const W = 17, H = 31, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const has = (x, z) => cellSet.has(key(x, z));
const cellSet = new Set(list.map(([x, z]) => key(x, z)));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

// Building-wide massing: one main storey count from the median lidar roof,
// with lower wings only where the lidar roof is clearly lower.
const median = (a) => {
  const s = [...a].sort((p, q) => p - q);
  return s[Math.floor(s.length / 2)];
};
const medGround = Math.round(median(list.map(c => c[2])));
const medRoof = median(list.map(c => c[3]));
const mainN = Math.max(4, Math.min(6, Math.round((medRoof - medGround - 1) / 3)));

const meta = new Map();
for (const [x, z, gr, rf] of list) {
  const ground = Math.max(0, Math.round(gr));
  let n = mainN;
  if (rf < medRoof - 4) n = Math.max(2, mainN - 1); // lower wing
  while (ground + 3 * n + 1 > 29 && n > 2) n--;
  meta.set(key(x, z), { ground, n, T: ground + 3 * n + 1 });
}

// Entrance on the north (low z) face, near the centre.
const DOOR_X = Math.floor(W / 2);
let doorZ = null;
for (const [x, z] of list) {
  if (x === DOOR_X && !has(x, z - 1)) doorZ = z;
}
if (doorZ === null) {
  for (const [x, z] of list) if (x === DOOR_X && (doorZ === null || z < doorZ)) doorZ = z;
}

function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "N", along: x, inward: [0, 1], axisX: true };
  if (!has(x, z + 1)) return { face: "S", along: x, inward: [0, -1], axisX: true };
  if (!has(x - 1, z)) return { face: "W", along: z, inward: [1, 0], axisX: false };
  return { face: "E", along: z, inward: [-1, 0], axisX: false };
}

const PANE_X = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const PANE_Z = { east: "false", west: "false", north: "true", south: "true", waterlogged: "false" };

// Pass 1: foundations, façades, floors, roofs, entrance.
for (const [x, z] of list) {
  const { ground, n, T } = meta.get(key(x, z));
  const edge = isEdge(x, z);
  const f = edge ? faceOf(x, z) : null;

  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  for (let y = ground; y < T; y++) {
    const rel = y - ground;
    const k = Math.floor(rel / 3);
    const off = rel % 3;

    if (!edge) {
      if (rel === 3 * n || (off === 0 && rel < 3 * n)) g.set(x, y, z, "stone_bricks");
      continue;
    }

    if (rel === 3 * n) { g.set(x, y, z, "stone_bricks"); continue; } // cornice course
    if (off === 0) { g.set(x, y, z, "stone_bricks"); continue; }     // floor line

    const isDoor = x === DOOR_X && z === doorZ && k === 0;
    if (isDoor) {
      g.set(x, y, z, "oak_door", {
        facing: "north", half: off === 1 ? "lower" : "upper",
        hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    if (f.along % 3 === 0) g.set(x, y, z, "bricks");
    else g.set(x, y, z, "glass_pane", f.axisX ? PANE_X : PANE_Z);
  }

  // Flat slab cap on the parapet, not crenellated walls.
  if (edge && T < H) g.set(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Pass 2: warm light behind a sparse set of windows.
for (const [x, z] of list) {
  if (!isEdge(x, z)) continue;
  const { ground, n } = meta.get(key(x, z));
  const f = faceOf(x, z);
  if (f.along % 3 === 0) continue;
  for (let k = 0; k < n; k++) {
    if ((f.along + 2 * k) % 4 !== 0) continue;
    const rel = 3 * k + 1;
    const ix = x + f.inward[0], iz = z + f.inward[1];
    if (!has(ix, iz) || isEdge(ix, iz)) continue;
    const im = meta.get(key(ix, iz));
    const y = ground + rel;
    if (y < im.ground || y >= im.T - 1) continue;
    g.set(ix, y, iz, "glowstone");
  }
}

// Pass 3: a few rooftop stacks on interior cells.
for (const [x, z] of list) {
  if (isEdge(x, z)) continue;
  if (x % 6 !== 2 || z % 6 !== 2) continue;
  const { T } = meta.get(key(x, z));
  if (T + 1 < H) {
    g.set(x, T, z, "stone_bricks");
    g.set(x, T + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
