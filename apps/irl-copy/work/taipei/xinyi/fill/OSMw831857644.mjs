import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name, 20 x 19 footprint, roof ~11 blocks above lowest ground.
// Reading: a two-storey, early-1990s Taipei commercial block of cream tiled
// concrete with a glazed shopfront, one centred entrance and a plain parapet.
// Lower storey is a shopfront, upper storey a banded window grid, and a
// roof plant row sits behind the parapet.

const cells = JSON.parse(
  readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857644.cells.json", "utf8")
);

const W = 20, H = 23, D = 19;
const g = new Voxels([W, H, D]);

const key = (x, z) => x + "," + z;
const ground = new Map();
let base = Infinity;
let sx = 0, sz = 0;
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), gr);
  base = Math.min(base, gr);
  sx += x; sz += z;
}
const cx = sx / cells.length;
const cz = sz / cells.length;

const inBounds = (x, y, z) => x >= 0 && x < W && y >= 0 && y < H && z >= 0 && z < D;
const put = (x, y, z, id, props) => {
  if (!inBounds(x, y, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => !NB.every(([dx, dz]) => ground.has(key(x + dx, z + dz)));

// Entrance: edge cell on the minimum-z (street) side, nearest the centroid in x.
let entrance = null;
{
  let bestZ = Infinity, bestDx = Infinity;
  for (const [x, z] of ground.keys().map ? [] : []) { /* placeholder for lint */ }
  for (const [x, z] of cells) {
    if (!isEdge(x, z)) continue;
    const dx = Math.abs(x - cx);
    if (z < bestZ || (z === bestZ && dx < bestDx)) {
      bestZ = z; bestDx = dx; entrance = [x, z];
    }
  }
}

// Inward neighbour of an edge cell (toward the footprint centre).
const inward = (x, z) => {
  const ax = Math.abs(cx - x), az = Math.abs(cz - z);
  const cand = ax >= az
    ? [x + (cx > x ? 1 : -1), z]
    : [x, z + (cz > z ? 1 : -1)];
  return cand;
};

for (const [x, z, gc] of cells) {
  const edge = isEdge(x, z);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  // Floor / storey-line levels inside this column.
  const S = new Set([gc]);
  if (base + 5 >= gc) S.add(base + 5);
  if (base + 10 >= gc) S.add(base + 10);

  const top = base + 10; // last body layer; roof deck and parapet live here

  for (let y = gc; y <= top; y++) {
    if (y === gc) {
      // Ground slab / base course.
      put(x, y, z, edge ? "polished_granite" : "smooth_stone");
      continue;
    }
    if (y === top) {
      // Roof: parapet on the edge, roof deck inside.
      put(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
      continue;
    }
    if (S.has(y)) {
      // Storey floor slab / belt course.
      put(x, y, z, edge ? "white_concrete" : "smooth_stone");
      continue;
    }
    if (!edge) continue; // interior air behind the glass

    const lower = y < base + 5;
    const pier = (x + z) % 3 === 0;

    if (lower) {
      // Ground-floor shopfront with fascia header.
      if (y === base + 4) {
        put(x, y, z, "white_concrete");
      } else if (entrance && x === entrance[0] && z === entrance[1]) {
        // Entrance: glazed door opening with a canopy-style header above.
        put(x, y, z, "glass_pane");
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
      }
    } else {
      // Upper storey: spandrels top and bottom, glass band in the middle.
      if (y === base + 6 || y === base + 9) {
        put(x, y, z, "light_gray_concrete");
      } else if (pier) {
        put(x, y, z, "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane");
        // Warm light behind some upper windows.
        if ((x * 31 + z * 17 + y * 7) % 13 === 0) {
          const [ix, iz] = inward(x, z);
          if (ground.has(key(ix, iz)) && ground.get(key(ix, iz)) <= base + 6) {
            put(ix, base + 7, iz, "glowstone");
          }
        }
      }
    }
  }

  // Entrance lantern hung just inside the door.
  if (entrance && x === entrance[0] && z === entrance[1]) {
    const [ix, iz] = inward(x, z);
    if (ground.has(key(ix, iz))) {
      put(ix, base + 3, iz, "lantern", { hanging: "true", waterlogged: "false" });
    }
  }

  // Roof plant: AC units on a regular grid of interior roof cells.
  if (!edge && x % 5 === 2 && z % 4 === 1) {
    put(x, top + 1, z, "iron_block");
  }
}

// Single roof mast near the centroid, if that cell is on the roof.
{
  let best = null, bestD = Infinity;
  for (const [x, z] of cells) {
    if (isEdge(x, z)) continue;
    const d = Math.abs(x - cx) + Math.abs(z - cz);
    if (d < bestD) { bestD = d; best = [x, z]; }
  }
  if (best) put(best[0], base + 11, best[1], "end_rod");
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw831857644.nbt");
