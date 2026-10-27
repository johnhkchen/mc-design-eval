// way 434287227: a four-storey Edwardian brick commercial block on a K Road-style corner (Auckland, 1910s).
// Red brick walls on a stone plinth, a dark-oak shopfront on the ground storey, white stringcourses at each
// floor line, sash-style glass panes between brick piers, a stepped massing (1, 2, 3 and 4 storeys) from the
// lidar roof heights, a parapet on every roof edge, a rooftop terrace with AC plant on the podium, and warm
// glowstone behind some upper-storey panes.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${dir}/way_434287227.cells.json`, "utf8"));
const X = 7, Y = 28, Z = 6;

// Lidar roof heights snapped to 4-block storeys: 3-4 -> 1 storey, 6-9 -> 2, 12 -> 3, 15 -> 4 (tower)
const tier = (r) => Math.max(4, 4 * Math.round(r / 4));
const roof = Array.from({ length: X }, () => Array(Z).fill(0));
const ground = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, g, r] of cells) { roof[x][z] = tier(r); ground[x][z] = g; }

const R = (x, z) => (x >= 0 && x < X && z >= 0 && z < Z ? roof[x][z] : 0);
const inFp = (x, z) => R(x, z) > 0;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// a wall face is exposed at height y when there is no footprint cell beside it, or the neighbour is lower than y
const exposed = (x, z, y) => DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz) || R(x + dx, z + dz) <= y);

// the model: M[x][y][z] = { b, s } or null (air)
const M = Array.from({ length: X }, () => Array.from({ length: Y }, () => Array(Z).fill(null)));
const put = (x, y, z, b, s) => { M[x][y][z] = { b, s }; };

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const r = R(x, z), g = ground[x][z];
  if (!r) continue;
  // foundation from y 0 up to this cell's ground (all cells sit on ground 0 here, so this is empty)
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");
  for (let y = g; y < r; y++) {
    const ex = exposed(x, z, y), k = y % 4, shopStorey = y < 4;
    const checker = (x + z) % 2 === 1;                       // panes on odd cells, brick piers between
    if (y === 0) put(x, y, z, ex ? "stone_bricks" : "smooth_stone");          // base course / floor
    else if (y === r - 1) put(x, y, z, ex ? "stone_bricks" : "smooth_stone"); // cornice / roof cover
    else if (k === 0) put(x, y, z, ex ? "white_concrete" : "smooth_stone");   // storey line / floor slab
    else if (!ex) continue;                                                    // interior air
    else if (shopStorey) {
      if (k === 1) put(x, y, z, "stone_bricks");                               // shopfront plinth
      else if (k === 2) put(x, y, z, checker ? "glass_pane" : "dark_oak_planks", {});
      else put(x, y, z, "dark_oak_planks");                                    // shop fascia
    } else {
      if (k === 3) put(x, y, z, "bricks");                                     // lintel band
      else put(x, y, z, checker ? "glass_pane" : "bricks");                    // sash panes between piers
    }
  }
}

// parapet on every roof edge: a stone brick wall course on the cornice (half-slabs read as loose cubes on one-cell edges)
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const r = R(x, z);
  if (!r) continue;
  if (DIRS.some(([dx, dz]) => !inFp(x + dx, z + dz) || R(x + dx, z + dz) < r))
    put(x, r, z, "stone_brick_wall", { up: "true", waterlogged: "false" });
}

// entrance on the north face of the tower base: a dark-oak door with a canopy slab over it
const dh = { facing: "north", hinge: "left", open: "false", powered: "false" };
put(3, 1, 1, "dark_oak_door", { ...dh, half: "lower" });
put(3, 2, 1, "dark_oak_door", { ...dh, half: "upper" });
for (const x of [2, 3, 4]) put(x, 3, 1, "dark_oak_slab", { type: "top", waterlogged: "false" });

// rooftop: a lightning rod on the turret, two AC units on the podium terrace
put(1, R(1, 0), 0, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
put(2, 4, 3, "iron_block");
put(4, 4, 4, "iron_block");

// glass panes connect to any neighbouring block in the model, so the window bays read as set-in glazing
const at = (x, y, z) => (x >= 0 && x < X && y >= 0 && y < Y && z >= 0 && z < Z ? M[x][y][z] : null);
for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) {
  const c = M[x][y][z];
  if (!c || c.b !== "glass_pane") continue;
  const link = (n) => (n && n.b !== "air" ? "true" : "false");
  c.s = {
    north: link(at(x, y, z - 1)), south: link(at(x, y, z + 1)),
    east: link(at(x + 1, y, z)), west: link(at(x - 1, y, z)), waterlogged: "false",
  };
}

// parapet walls join their neighbours along the roof edge
for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) {
  const c = M[x][y][z];
  if (!c || c.b !== "stone_brick_wall") continue;
  const arm = (n) => (n ? "low" : "none");
  c.s = {
    north: arm(at(x, y, z - 1)), south: arm(at(x, y, z + 1)),
    east: arm(at(x + 1, y, z)), west: arm(at(x - 1, y, z)), up: "true", waterlogged: "false",
  };
}

// warm light: glowstone on the storey floor just inside some upper-storey panes
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const r = R(x, z);
  for (let y = 5; y < r; y += 4) {                    // upper storeys, the first pane row (k = 1)
    const c = at(x, y, z);
    if (!c || c.b !== "glass_pane" || (x * 3 + z * 5 + y) % 4 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      if (inFp(nx, nz) && y < R(nx, nz) && M[nx][y][nz] === null) { put(nx, y, nz, "glowstone"); break; }
    }
  }
}

const g = new Voxels([X, Y, Z]);
let placed = 0;
for (let x = 0; x < X; x++) for (let y = 0; y < Y; y++) for (let z = 0; z < Z; z++) {
  const c = M[x][y][z];
  if (c) { g.set(x, y, z, c.b, c.s); placed++; }
}
const out = g.save(`${dir}/way_434287227.nbt`);
console.log(`way_434287227: ${placed} blocks, ${out.palette} palette entries`);
