import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const cells = JSON.parse(readFileSync(`${DIR}/FR301499605.cells.json`, "utf8"));

const W = 15, D = 39, H = 24;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const cellMap = new Map();
for (const c of cells) cellMap.set(key(c[0], c[1]), { x: c[0], z: c[1], gr: c[2], r: c[3] });
const has = (x, z) => cellMap.has(key(x, z));

function put(x, y, z, b, p) {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
}

const DIRS = [[0, -1], [0, 1], [-1, 0], [1, 0]];
const info = new Map();

// Pass 1: foundation, floors, walls, cornice, roof
for (const c of cells) {
  const x = c[0], z = c[1], gr = c[2], r = c[3];
  const ex = !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
  const eave = gr + 9;                                   // two storeys of wall (~4.5 m each)
  const rise = Math.max(3, Math.min(6, r - eave));       // pitched roof rise, clamped to read as slate
  const d = Math.min(x, W - 1 - x);                       // distance to nearest long side
  // one-block steps toward the ridge, flat ridge across the middle
  const top = Math.min(22, eave + Math.min(rise, d + 1));
  info.set(key(x, z), { x, z, gr, eave, top, ex });

  // foundation up to the ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (ex) {
    put(x, gr, z, "polished_granite");                   // base course
    for (let y = gr + 1; y < eave; y++) {
      if (y === gr + 4 || y === eave - 1) put(x, y, z, "polished_granite"); // storey belt + cornice
      else put(x, y, z, "stone_bricks");
    }
  } else {
    put(x, gr, z, "smooth_stone");                       // ground floor
    put(x, gr + 4, z, "stone_bricks");                   // upper floor slab
  }

  // roof: solid slate body with stairs at the surface
  for (let y = eave; y < top; y++) put(x, y, z, "deepslate_tiles");
  if (x === 7) {
    put(x, top, z, "deepslate_tile_slab", { type: "top", waterlogged: "false" });
  } else {
    const facing = x < 7 ? "east" : "west";              // high side faces the ridge
    put(x, top, z, "deepslate_tile_stairs", { facing, half: "bottom", shape: "straight", waterlogged: "false" });
  }
}

// Pass 2: windows, lights, entrance
const doorCands = [];
for (const c of cells) {
  const x = c[0], z = c[1];
  const I = info.get(key(x, z));
  if (!I.ex) continue;
  const missing = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (missing.length === 0 || missing.length >= 2) continue; // skip corners
  const [dx, dz] = missing[0];
  I.out = [dx, dz];
  if (dz === -1) doorCands.push({ x, z, dist: Math.abs(x - 7) });
}

doorCands.sort((a, b) => a.dist - b.dist);
const door = doorCands[0] || null;

for (const c of cells) {
  const x = c[0], z = c[1];
  const I = info.get(key(x, z));
  if (!I.ex || !I.out) continue;
  const [dx, dz] = I.out;
  const t = dz !== 0 ? x : z;
  const gr = I.gr;
  if (door && x === door.x && z === door.z) continue;

  if (t % 3 === 1) {
    // two storeys of glazing, each with a sill and a surround
    for (const y of [gr + 2, gr + 3, gr + 6, gr + 7]) put(x, y, z, "glass");
    put(x, gr + 1, z, "chiseled_stone_bricks");
    put(x, gr + 5, z, "chiseled_stone_bricks");
    put(x, gr + 4, z, "chiseled_stone_bricks");

    // warm light in the room behind some windows
    if (t % 6 === 1) {
      const ix = x - dx, iz = z - dz;
      const inner = info.get(key(ix, iz));
      if (inner && !inner.ex) put(ix, gr + 2, iz, "shroomlight");
    }
  }
}

// entrance on the street (north) face, with a stone surround and a lantern
if (door) {
  const gr = info.get(key(door.x, door.z)).gr;
  put(door.x, gr + 1, door.z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(door.x, gr + 2, door.z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  put(door.x, gr + 3, door.z, "polished_granite");
  for (const sx of [-1, 1]) {
    const nx = door.x + sx;
    const J = info.get(key(nx, door.z));
    if (J && J.ex) put(nx, gr + 3, door.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Pass 3: a single chimney stack on the roof
for (const c of cells) {
  const x = c[0], z = c[1];
  if (x !== 10 || z % 8 !== 4) continue;
  const I = info.get(key(x, z));
  for (let y = I.top + 1; y <= Math.min(23, I.top + 2); y++) put(x, y, z, "stone_bricks");
  put(x, Math.min(23, I.top + 3), z, "chiseled_stone_bricks");
}

g.save(`${DIR}/FR301499605.nbt`);
