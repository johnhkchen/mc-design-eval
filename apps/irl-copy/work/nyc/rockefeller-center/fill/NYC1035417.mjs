// NYC1035417: 17 East 47 Street, Mercantile Library, built 1932, Public Facilities & Institutions. Seven by 26 blocks
// on the north side of 47th Street: the street front is the south face (z 25), the lot runs north to a lower rear.
// Read as a 1930s Art Deco institutional block: a limestone-faced front of vertical calcite piers between paired
// windows with stone spandrels, a granite base and a storefront with two doors under a granite lintel; eight storeys
// (24 blocks) with a stepped tower of nine (27 blocks) set back at the centre of the lot, a crowning penthouse with a
// gold cap and a lantern, and a two-storey rear wing (lidar 3 to 8 blocks) that drops to one storey at the north end.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const W = 7, L = 26, H = 39;
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035417.cells.json`, "utf8"));   // [x, z, ground, roof]

// Lidar roof per cell: median of the non-zero roofs in the 3 x 3 neighbourhood (drops the gaps, keeps the edges),
// then snapped to four tiers: one-storey rear (3), two-storey rear (6), the main block's neighbours (21, the
// setback row at the north end), the eight-storey block (24) and the nine-storey tower (27). Every ground is 0.
const raw = Array.from({ length: L }, () => new Array(W).fill(0));
for (const [x, z, , r] of cells) raw[z][x] = r;
const median = (v) => v.sort((a, b) => a - b)[Math.floor(v.length / 2)];
const near = (x, z) => {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const xx = x + dx, zz = z + dz;
    if (xx >= 0 && xx < W && zz >= 0 && zz < L && raw[zz][xx] > 0) v.push(raw[zz][xx]);
  }
  return v.length ? median(v) : 24;
};
const snap = (r) => (r <= 4 ? 3 : r <= 10 ? 6 : r <= 22 ? 21 : r <= 25 ? 24 : 27);
const T = Array.from({ length: L }, (_, z) => Array.from({ length: W }, (_, x) => snap(near(x, z))));
const topOf = (x, z) => (x < 0 || z < 0 || x >= W || z >= L ? -1 : T[z][x]);   // outside the lot is air at every height

// Sides of a cell with air beside it at height y (a neighbour that does not reach y).
const exposed = (x, z, y) => {
  const d = [];
  if (topOf(x, z - 1) <= y) d.push("N");
  if (topOf(x, z + 1) <= y) d.push("S");
  if (topOf(x - 1, z) <= y) d.push("W");
  if (topOf(x + 1, z) <= y) d.push("E");
  return d;
};

// Glass panes join along the wall they sit in: a wall that runs along x joins east and west.
const GLASS_Z = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_X = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const glass = (d) => ["glass_pane", d.includes("N") || d.includes("S") ? GLASS_Z : GLASS_X];
const DOOR = (x, half) => ({ facing: "south", half, hinge: x === 2 ? "left" : "right", open: "false", powered: "false" });

// The street front (z 25): calcite piers at x 0, 3, 6 and paired windows between; a granite lintel over the storefront.
function front(x, y, k, rel) {
  if (k === 0) {                                              // ground storey: granite jambs, glass, the double door
    if (x === 0 || x === W - 1) return ["polished_granite"];
    if (x === 2 || x === 3) return ["dark_oak_door", DOOR(x, y === 1 ? "lower" : "upper")];
    return ["glass_pane", GLASS_Z];
  }
  if (y === 3 && x >= 1 && x <= 5) return rel === 0 ? ["polished_granite"] : null;   // lintel over the storefront
  if (x === 0 || x === W - 1 || x === 3) return ["calcite"];   // piers, the quoins and the centre pier
  if (rel === 0) return ["stone_bricks"];                     // spandrel under each window
  return ["glass_pane", GLASS_Z];
}

// The side walls: party-wall brick with a stone line at each floor and a calcite pilaster every fourth block; a pair of
// windows at the front end.
function side(x, y, z, k, rel) {
  if (rel === 0) return ["stone_bricks"];
  if (z % 4 === 0) return ["calcite"];
  if (k >= 1 && (z === 22 || z === 23)) return ["glass_pane", GLASS_X];
  return ["bricks"];
}

// Rear and setback faces: brick with a window on alternate blocks.
function back(x, y, z, rel) {
  if (rel === 0) return ["stone_bricks"];
  return x % 2 === 1 ? ["glass_pane", GLASS_Z] : ["bricks"];
}

// One block of exterior wall, by which side of the lot faces air.
function facade(x, y, z, t, dirs) {
  const k = Math.floor(y / 3), rel = y % 3;
  if (y === 0) return ["polished_granite"];                  // granite base course
  if (y === t - 1) return ["stone_bricks"];                  // cornice, under the parapet
  if (dirs.includes("S")) return front(x, y, k, rel);
  if (dirs.includes("W") || dirs.includes("E")) return side(x, y, z, k, rel);
  return back(x, y, z, rel);
}

const g = new Voxels([W, H, L]);
for (let z = 0; z < L; z++) for (let x = 0; x < W; x++) {
  const t = T[z][x];
  for (let y = 0; y < t; y++) {
    const dirs = exposed(x, z, y);
    if (dirs.length) {
      const b = facade(x, y, z, t, dirs);
      if (b) g.set(x, y, z, b[0], b[1]);
    } else if (y === t - 1) {
      g.set(x, y, z, "smooth_stone");                        // roof deck under the open sky
    } else if (y === 0 || y % 3 === 0) {
      g.set(x, y, z, "smooth_stone");                        // foundation and a floor slab per storey
    }                                                        // otherwise air: the room behind the wall
  }
  // Parapet on the edge of each roof: a neighbour that stands lower than this block (or lies outside the lot).
  const lower = [topOf(x, z - 1), topOf(x, z + 1), topOf(x - 1, z), topOf(x + 1, z)].some((n) => n < t);
  if (lower) g.set(x, t, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });   // a flat coping, not battlements
}

// Warm light behind some panes of the street front: only into air, and only on a storey's window rows.
for (const k of [0, 1, 2, 3, 4, 5, 6, 7]) for (const x of [1, 4, 5]) for (const rel of [1, 2]) {
  const y = 3 * k + rel;
  if (y < T[25][x] && (x + k) % 3 === 0 && g.get(x, y, 24) === null) g.set(x, y, 24, "glowstone");
}
// Lanterns behind the rear windows of the two-storey wing.
for (const z of [1]) for (const x of [1, 3, 5]) if (g.get(x, 4, z) === null) g.set(x, 4, z, "lantern", { hanging: "true" });

// Roof equipment on the eight-storey roof: a water tank on a stone plinth at the back, two blocks from the edge.
for (const [x, z] of [[1, 12], [2, 12], [1, 13], [2, 13]]) if (T[z][x] !== 24) throw new Error(`tank cell ${x},${z} is not on the 24 roof`);
for (const [x, z] of [[1, 12], [2, 12], [1, 13], [2, 13]]) g.set(x, 24, z, "stone_bricks");
for (const y of [25, 26, 27]) for (const [x, z] of [[1, 12], [2, 12], [1, 13], [2, 13]]) g.set(x, y, z, "spruce_planks");
for (const [x, z] of [[1, 12], [2, 12], [1, 13], [2, 13]]) g.set(x, 28, z, "spruce_slab", { type: "bottom", waterlogged: "false" });

// The tower's crown: a calcite penthouse on the nine-storey roof with a gold cap and a lantern on top.
for (let z = 12; z <= 15; z++) for (const x of [4, 5]) if (T[z][x] !== 27) throw new Error(`penthouse cell ${x},${z} is not on the 27 roof`);
for (let z = 12; z <= 15; z++) for (const x of [4, 5]) {
  g.set(x, 27, z, "calcite");
  g.set(x, 28, z, "calcite");
}
for (let z = 12; z <= 15; z++) for (const x of [4, 5]) g.set(x, 29, z, "polished_andesite");
for (const [x, z] of [[4, 13], [5, 13], [4, 14], [5, 14]]) g.set(x, 29, z, "gold_block");
g.set(4, 30, 13, "lantern", { hanging: "false" });
g.set(5, 30, 14, "lantern", { hanging: "false" });

const info = g.save(`${DIR}/NYC1035417.nbt`);
console.log(JSON.stringify({ ...info, cells: g.count() }));
