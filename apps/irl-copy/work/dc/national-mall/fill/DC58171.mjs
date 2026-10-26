import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC58171 - 1221 M St NW, Washington DC 20005
// Residential-Apartment-Elevator: a c.1910s-20s Classical Revival apartment block. Red brick on a stone
// base, pale stone string courses at every storey, quoins at the corners, glass bays on a 3-block pier
// rhythm, a flat deck with a stone cornice, a penthouse over the tower, and a porch entrance with a canopy
// on the south front. Lidar roofs (11-15 above y0) are rounded to whole 3-block storeys: 4 or 5 storeys.
// Scale note: a real storey (about 3.2 m) is only about 1.3 blocks at 0.42 blocks/m, so a 3-block storey is
// the readable unit and the storey count is compressed.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC58171";
const W = 44, H = 27, D = 16;
const STOREY = 3;

const BASE = "stone_bricks";
const BRICK = "bricks";
const STONE = "smooth_quartz";
const FLOOR = "smooth_stone";
const ROOF = "deepslate_tiles";
const GLASS = "glass_pane";
const LAMP = "glowstone";
const SOLID = new Set([BASE, BRICK, STONE, FLOOR, ROOF, "polished_granite"]);

const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const cells = new Map();
for (const [x, z, g, r] of raw) cells.set(`${x},${z}`, { x, z, g, r });
const has = (x, z) => cells.has(`${x},${z}`);
const exterior = (x, z) => !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
const isPorch = (x, z) => x >= 24 && x <= 25 && z >= 14;

// every block placed, keyed by cell, so panes can read their neighbours before the volume is written
const P = new Map();
const put = (x, y, z, block, state) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  P.set(`${x},${y},${z}`, { block, state });
};

for (const c of cells.values()) {
  const { x, z } = c;
  if (c.r < 4) continue; // low garden walls and the porch, below
  const ext = { N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z) };
  const outside = ext.N || ext.S || ext.W || ext.E;
  const N = Math.round(c.r / STOREY), top = STOREY * N;

  // base course, then a floor slab at every storey line; the top slab is the roof deck
  put(x, 0, z, BASE);
  for (let k = 1; k <= N; k++) {
    if (k === N) put(x, top, z, ROOF);
    else put(x, STOREY * k, z, outside ? STONE : FLOOR);
  }
  if (!outside) continue; // interior: floors only, air between them

  // the facade: the outer cell is the wall; piers every third bay, glass between, quoins at corners
  const along = ext.N || ext.S ? x : z;
  const corner = (ext.N || ext.S) && (ext.E || ext.W);
  // the cell inward of the glass, where a warm light can sit behind the pane
  const inward = ext.N ? [x, z + 1] : ext.S ? [x, z - 1] : ext.W ? [x + 1, z] : [x - 1, z];
  for (let k = 0; k < N; k++) {
    for (const y of [STOREY * k + 1, STOREY * k + 2]) {
      if (corner) put(x, y, z, STONE);
      else if (along % 3 === 0) put(x, y, z, k === 0 ? BASE : BRICK);
      else {
        put(x, y, z, GLASS);
        const [ix, iz] = inward;
        if (y === STOREY * k + 1 && ((x * 7 + z * 3 + k * 5) % 9 === 0) && has(ix, iz) && !exterior(ix, iz)) put(ix, y, iz, LAMP);
      }
    }
  }
  put(x, top + 1, z, STONE); // cornice on the parapet line
}

// low garden walls along the west wing's east edge (x 6): a two-block stone wall with a cap
for (const c of cells.values()) {
  if (c.r >= 4 || isPorch(c.x, c.z)) continue;
  put(c.x, 0, c.z, BASE); put(c.x, 1, c.z, BASE); put(c.x, 2, c.z, STONE);
}

// the south porch: a stone floor, a canopy on four posts (one a door, one a column), a lantern under it
for (const [x, z] of [[24, 14], [25, 14], [24, 15], [25, 15]]) { put(x, 0, z, BASE); put(x, 3, z, STONE); }
put(25, 1, 15, "polished_granite"); put(25, 2, 15, "polished_granite");
const door = { facing: "south", hinge: "left", open: "false", powered: "false" };
put(24, 1, 15, "oak_door", { ...door, half: "lower" });
put(24, 2, 15, "oak_door", { ...door, half: "upper" });
put(24, 2, 14, "lantern", { hanging: "true", waterlogged: "false" });

// a penthouse (stair and lift) over the tower's middle, on the 15-block deck
for (let x = 25; x <= 27; x++) for (let z = 7; z <= 8; z++) {
  put(x, 16, z, BRICK); put(x, 17, z, BRICK); put(x, 18, z, STONE);
}

// glass panes connect to any solid neighbour in the wall's plane, so each bay reads as one run of glass
const solidAt = (x, y, z) => {
  const p = P.get(`${x},${y},${z}`);
  return !!p && (SOLID.has(p.block) || p.block === GLASS);
};
const g = new Voxels([W, H, D]);
for (const [key, { block, state }] of P) {
  const [x, y, z] = key.split(",").map(Number);
  if (block === GLASS) {
    g.set(x, y, z, block, {
      east: solidAt(x + 1, y, z), west: solidAt(x - 1, y, z),
      north: solidAt(x, y, z - 1), south: solidAt(x, y, z + 1), waterlogged: false,
    });
  } else g.set(x, y, z, block, state);
}

const res = g.save(`${DIR}/${ID}.nbt`);
console.log(res);
