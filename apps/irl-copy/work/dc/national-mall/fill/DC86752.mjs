// 1301 Vermont Ave NW: a 1920s brick elevator apartment block on the Logan Circle side of the Mall's grid.
// Lidar roof tiers become the massing (11 wing, 12 body, a 14 core crown); a 1-cell shell with air behind the
// glass, a calcite stringcourse per storey, a dark-oak entrance on the south face, lit windows, a bulkhead on the crown.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86752.cells.json`, "utf8"));
const SIZE = [14, 26, 13];
const N4 = [[1, 0], [-1, 0], [0, 1], [0, -1]];   // +x east, -x west, +z south, -z north
const SLAB = [4, 8, 12];                          // storey floor slabs, shared by every cell so nothing floats

// tiers: a cell's top surface (first empty row). The lidar's 13-14 cells are the crown only where they are
// surrounded by tall cells; everywhere else they step down to the 12-block body.
const lidar = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const tallAt = (x, z) => (lidar.get(`${x},${z}`) ?? 0) >= 13;
const top = new Map();
for (const [x, z, , r] of cells) {
  const core = r >= 13 && N4.every(([dx, dz]) => tallAt(x + dx, z + dz));
  top.set(`${x},${z}`, core ? 14 : r >= 12 ? 12 : 11);
}
const T = (x, z) => top.get(`${x},${z}`) ?? -1;   // outside the footprint counts as empty at every row
// the sides of a cell that open to air at row y: outside the footprint, or beside a lower tier
const open = (x, z, y) => N4.filter(([dx, dz]) => T(x + dx, z + dz) <= y);

const PANE = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const has = (x, y, z) => plan.has(`${x},${y},${z}`);

// the role of a wall row in a storey: base course, ground glass + lintel, sill/glass/lintel bays, top band
function roleOf(y, t) {
  if (y === 1) return "base";
  if (y <= 3) return y === 2 ? "glass" : "lintel";
  if (y <= 7) return y === 5 ? "sill" : y === 6 ? "glass" : "lintel";
  const top = Math.min(t - 2, 11);
  if (top - 9 + 1 >= 3) return y === 9 ? "sill" : y === top ? "lintel" : "glass";
  return "glass";
}

// an exposed wall cell: piers every third cell along the face, window bays between. A chamfer cell open on two
// sides takes its north/south face first, so the diagonal street front keeps its bays instead of going blank stone.
function wall(x, y, z, sides, t) {
  const [, dz] = sides.find(([, b]) => b !== 0) ?? sides[0];
  const along = dz !== 0 ? x : z;
  const role = roleOf(y, t);
  if (role === "base") return put(x, y, z, "stone_bricks");
  if (along % 3 === 0) return put(x, y, z, "bricks");
  if (role === "glass") return put(x, y, z, "glass_pane", PANE);
  return put(x, y, z, "calcite");
}

for (const [x, z] of [...top.keys()].map((k) => k.split(",").map(Number))) {
  const t = T(x, z);
  for (let y = 0; y < t; y++) {
    const sides = open(x, z, y);
    const outer = sides.length > 0;
    if (y === 0) put(x, y, z, "stone_bricks");                              // plinth / foundation
    else if (y === t - 1) put(x, y, z, outer ? "calcite" : "stone");        // cornice ring, tar roof inside
    else if (SLAB.includes(y)) put(x, y, z, outer ? "calcite" : "smooth_stone");
    else if (outer) wall(x, y, z, sides, t);
  }
}

// main entrance on the south face: a door on the plinth, a dark-oak hood over it
const DOOR = { facing: "south", hinge: "left", open: "false", powered: "false" };
put(9, 1, 12, "dark_oak_door", { ...DOOR, half: "lower" });
put(9, 2, 12, "dark_oak_door", { ...DOOR, half: "upper" });
for (const x of [8, 9, 10]) put(x, 3, 12, "dark_oak_slab", { type: "bottom", waterlogged: "false" });

// warm light in some window bays: a lantern standing on the floor inside (ground, 2nd), a glowstone on the 3rd
const LANTERN = { hanging: "false", waterlogged: "false" };
const LIGHT_ROW = { 2: 1, 6: 5, 9: 9 };
for (const [k, v] of [...plan]) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const L = LIGHT_ROW[y];
  if (L === undefined || (x * 5 + z * 3) % 4 !== 0) continue;
  const sides = open(x, z, y);
  if (sides.length !== 1) continue;
  const [dx, dz] = sides[0];
  const ix = x - dx, iz = z - dz;
  if (!top.has(`${ix},${iz}`) || open(ix, iz, L).length || T(ix, iz) <= L || has(ix, L, iz)) continue;
  if (y === 9) put(ix, L, iz, "glowstone");
  else put(ix, L, iz, "lantern", LANTERN);
}

// roof: two rooftop AC units on the 12 body, a stair/elevator bulkhead on the crown
const roofBody = [...top.keys()].map((k) => k.split(",").map(Number))
  .filter(([x, z]) => T(x, z) === 12 && [...Array(10).keys()].every((y) => open(x, z, y + 1).length === 0));
for (const i of [Math.floor(roofBody.length / 3), Math.floor((2 * roofBody.length) / 3)]) {
  const [x, z] = roofBody[i] ?? [];
  if (x !== undefined) put(x, 12, z, "iron_block");
}
for (const [x, z] of [[6, 7], [7, 8]]) {
  put(x, 14, z, "bricks");
  put(x, 15, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// glass panes connect to the walls and panes beside them in their own plane
for (const [k, v] of plan) {
  if (v.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const c = (dx, dz) => (has(x + dx, y, z + dz) ? "true" : "false");
  v.state = { east: c(1, 0), west: c(-1, 0), south: c(0, 1), north: c(0, -1), waterlogged: "false" };
}

const g = new Voxels(SIZE);
for (const [k, v] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, v.block, v.state);
}
const out = g.save(`${DIR}/DC86752.nbt`);
console.log(`DC86752.nbt: ${out.blocks} blocks, palette ${out.palette}`);
