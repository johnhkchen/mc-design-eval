import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343672";
const W = 43, H = 23, D = 114;
const ROOF = 11;

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const ground = new Map();
const key = (x, z) => x * 1000 + z;
for (const c of list) {
  const [x, z, gr] = c;
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(key(x, z), gr);
}
const has = (x, z) => ground.has(key(x, z));
const gr = (x, z) => ground.get(key(x, z));
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const nearEdge = (x, z) =>
  [[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dz]) => has(x + dx, z + dz) && isEdge(x + dx, z + dz));

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Entrance: west-facing, non-corner cell nearest the middle of that face
const westCells = [];
for (const k of ground.keys()) {
  const x = Math.floor(k / 1000), z = k % 1000;
  if (!has(x - 1, z) && has(x, z - 1) && has(x, z + 1)) westCells.push([x, z]);
}
let entrance = null;
if (westCells.length) {
  const zs = westCells.map(c => c[1]);
  const mid = (Math.min(...zs) + Math.max(...zs)) / 2;
  entrance = westCells.reduce((best, c) =>
    !best || Math.abs(c[1] - mid) < Math.abs(best[1] - mid) ? c : best, null);
}

for (const [k, g0] of ground) {
  const x = Math.floor(k / 1000), z = k % 1000;
  const mx = !has(x - 1, z) || !has(x + 1, z);
  const mz = !has(x, z - 1) || !has(x, z + 1);
  const edge = mx || mz;
  const corner = mx && mz;
  const along = (mx && !mz) ? z : x;
  const upperPillar = corner || along % 3 === 0;
  const groundPillar = corner || along % 4 === 0;
  const interior = !edge;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  // Base course / floor at ground level
  put(x, g0, z, edge ? "smooth_stone" : "light_gray_concrete");

  // Ground storey: shopfront glass in white-concrete frame, transom at y 4
  if (edge) {
    for (let y = g0 + 1; y <= 4; y++) {
      if (y === 4) put(x, y, z, "white_concrete");
      else if (groundPillar) put(x, y, z, "white_concrete");
      else put(x, y, z, "light_blue_stained_glass");
    }
  } else if (nearEdge(x, z) && (x * 3 + z * 5) % 9 === 0) {
    put(x, g0 + 1, z, "glowstone");
  }

  // Storey line / floor slab between storeys
  if (5 > g0) put(x, 5, z, edge ? "smooth_stone" : "light_gray_concrete");

  // Upper storey: spandrels at 6 and 9, windows 7-8 between white mullions
  if (6 > g0) {
    if (edge) {
      put(x, 6, z, "white_concrete");
      put(x, 9, z, "white_concrete");
      for (const y of [7, 8]) {
        put(x, y, z, upperPillar ? "white_concrete" : "light_blue_stained_glass");
      }
    } else if (nearEdge(x, z) && (x * 7 + z * 3) % 11 === 0) {
      put(x, 6, z, "glowstone");
    }
  }

  // Roof slab and parapet cornice
  if (10 > g0) put(x, 10, z, edge ? "white_concrete" : "light_gray_concrete");
  if (edge) {
    put(x, ROOF, z, "smooth_stone");
  } else if (ROOF > g0 && (x * 5 + z * 3) % 13 === 0 && !nearEdge(x, z)) {
    // roof plant boxes
    put(x, ROOF, z, "light_gray_concrete");
  }
}

// Entrance door on the west face, two blocks tall, under the transom
if (entrance) {
  const [ex, ez] = entrance;
  const g0 = gr(ex, ez);
  put(ex, g0 + 1, ez, "iron_door", { facing: "west", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(ex, g0 + 2, ez, "iron_door", { facing: "west", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(ex, g0 + 3, ez, "smooth_stone");
}

g.save(`${DIR}/${ID}.nbt`);
