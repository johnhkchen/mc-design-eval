// 1630 Vermont Ave NW: a religious building of the early 1900s (Romanesque Revival), red brick with stone trim, a
// tower on the tallest tier. Massing comes from the lidar roof heights, quantised to tiers that sit on 3-block storeys.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69474.cells.json", "utf8"));
const X = 21, Z = 32, Y = 22;
const g = new Voxels([X, Y, Z]);

// lidar roof -> clean tiers: 3-4 -> 4, 5-6 -> 6, 7-8 -> 8, 9-10 -> 10 (the tower)
const tier = (r) => (r <= 4 ? 4 : r <= 6 ? 6 : r <= 8 ? 8 : 10);
const roof = Array.from({ length: Z }, () => Array(X).fill(0));
const ground = Array.from({ length: Z }, () => Array(X).fill(0));
for (const [x, z, gr, r] of cells) { roof[z][x] = tier(r); ground[z][x] = gr; }
const foot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z && roof[z][x] > 0;
const DIRS = [
  { name: "north", dx: 0, dz: -1 }, { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 }, { name: "east", dx: 1, dz: 0 },
];
// the faces of a cell that show outside at height y: the footprint's edge, or a neighbour whose roof is below y
const faces = (x, z, y) => DIRS.filter((d) => {
  const nx = x + d.dx, nz = z + d.dz;
  return !foot(nx, nz) || roof[nz][nx] <= y;
});
const isWall = (x, z, y) => faces(x, z, y).length > 0;
const pane = (d) => (d.name === "north" || d.name === "south")
  ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
  : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// the entrance: one door on the north edge, on the first storey, with a stone lintel over it
const DOOR = { x: 4, z: 0 };

for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const R = roof[z][x]; if (!R) continue;
  // foundation: solid from y 0 up to the cell's ground (zero here, so nothing is added)
  for (let y = 0; y < ground[z][x]; y++) g.set(x, y, z, "stone_bricks");
  for (let y = ground[z][x]; y < R; y++) {
    const fs = faces(x, z, y);
    const rel = y % 3;
    if (x === DOOR.x && z === DOOR.z && y <= 1) {
      g.set(x, y, z, "dark_oak_door", { facing: "north", half: y ? "upper" : "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (x === DOOR.x && z === DOOR.z && y === 2) { g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" }); continue; }
    if (y === R - 1) {
      // the top: a parapet of stone on the outside edge, dark tile roof inside
      g.set(x, y, z, fs.length ? "stone_bricks" : "deepslate_tiles");
      continue;
    }
    if (!fs.length) {
      // inside: a floor slab at each storey line, air between (no interiors)
      if (rel === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }
    if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }      // belt course at each storey line (and the base)
    if (fs.length >= 2) { g.set(x, y, z, "stone_bricks"); continue; } // corner quoins
    const d = fs[0];
    const p = d.name === "north" || d.name === "south" ? x : z;
    if (p % 3 === 1) g.set(x, y, z, "glass_pane", pane(d));          // window bays on every third cell
    else g.set(x, y, z, "bricks");
  }
}

// warm light: glowstone just inside some window bays, and lanterns on the tower's parapet corners
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const R = roof[z][x]; if (!R) continue;
  for (let y = 1; y < R - 1; y++) {
    const fs = faces(x, z, y);
    if (fs.length !== 1 || y % 3 === 0) continue;
    const d = fs[0], p = d.name === "north" || d.name === "south" ? x : z;
    if (p % 3 !== 1 || (x === DOOR.x && z === DOOR.z)) continue;
    if ((x * 5 + z * 3 + y * 7) % 4 !== 0) continue;
    const ix = x - d.dx, iz = z - d.dz;
    if (foot(ix, iz) && roof[iz][ix] > y && !isWall(ix, iz, y)) g.set(ix, y, iz, "glowstone");
  }
  if (R === 10 && faces(x, z, R - 1).length >= 2 && (x + z) % 4 === 0) g.set(x, R, z, "lantern");
}

const { blocks, palette } = g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC69474.nbt");
console.log(`DC69474: ${blocks} blocks, ${palette} palette entries`);
