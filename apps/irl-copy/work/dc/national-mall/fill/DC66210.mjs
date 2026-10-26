// DC66210: a 1930s Federal-style office block on the Mall. Limestone (calcite) walls with smooth-stone belt courses, a
// stone-brick plinth, chiselled quoins, a 3-storey body (lidar 10), a 13-block tower on its east-west core, a 2x4 copper
// penthouse on the tower, and a 3-high pavilion at the south-east corner. Walls are solid from y 0 up to each column's
// top, so nothing floats; floor slabs sit at each storey line with an air gap behind the glass.
import { readFileSync } from "node:fs"; import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC66210.cells.json`, "utf8"));   // [x, z, ground, roof] per footprint cell

const W = 13, D = 15, H = 25;
const lidar = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const inF = (x, z) => x >= 0 && z >= 0 && x < W && z < D && lidar.has(`${x},${z}`);

// Massing tiers smoothed from the lidar roof: low pavilion (<= 4) 3 high, tower core (>= 12) 13 high, a 2x4 penthouse 15 high, else the body at 10.
const tall = (x, z) => inF(x, z) && lidar.get(`${x},${z}`) >= 12;
const penthouse = (x, z) => tall(x, z) && x >= 3 && x <= 4 && z >= 7 && z <= 10;
const top = (x, z) => !inF(x, z) ? 0 : penthouse(x, z) ? 15 : tall(x, z) ? 13 : lidar.get(`${x},${z}`) <= 4 ? 3 : 10;
const solid = (x, y, z) => inF(x, z) && y >= 0 && y < top(x, z);

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const exposed = (x, y, z) => DIRS.filter(([dx, dz]) => !solid(x + dx, y, z + dz));
const onEdge = (x, z) => DIRS.some(([dx, dz]) => !inF(x + dx, z + dz));

const BELTS = [3, 6, 9];                  // storey lines: smooth-stone bands on the exterior
const FLOORS = [3, 6, 9, 12];             // floor slabs (interior); the roof deck is the top layer of each column
const windowRows = (t) => t === 10 ? [1, 2, 4, 5, 7, 8] : t === 13 ? [10, 11] : t === 15 ? [13] : t === 3 ? [1] : [];

const g = new Voxels([W, H, D]);
const windows = [];
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!inF(x, z)) continue;
  const t = top(x, z);
  g.set(x, 0, z, "stone_bricks");                                          // plinth
  for (let y = 1; y < t; y++) {
    const out = exposed(x, y, z);
    if (y === t - 1) { g.set(x, y, z, t >= 13 ? "oxidized_cut_copper" : "smooth_stone"); continue; }   // roof
    if (!out.length) { if (FLOORS.includes(y)) g.set(x, y, z, "smooth_stone"); continue; }          // floor slab
    const corner = out.some(([dx]) => dx) && out.some(([, dz]) => dz);
    if (corner) g.set(x, y, z, "chiseled_stone_bricks");
    else if (BELTS.includes(y)) g.set(x, y, z, "smooth_stone");
    else if (windowRows(t).includes(y) && out.length === 1) {
      const [dx, dz] = out[0];
      if ((dx ? z : x) % 3 === 0) windows.push({ x, y, z, dx, dz }); else g.set(x, y, z, "calcite");
    } else g.set(x, y, z, "calcite");
  }
}

// Parapet on the body's outer edge; copper plant boxes on the roof.
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++)
  if (inF(x, z) && top(x, z) === 10 && onEdge(x, z)) g.set(x, 10, z, "calcite");
g.set(2, 10, 2, "oxidized_cut_copper"); g.set(3, 10, 2, "oxidized_cut_copper");

// Entrance on the south face: dark oak door between chiselled pilasters, under the belt course.
for (const y of [1, 2]) { g.set(5, y, 13, "chiseled_stone_bricks"); g.set(7, y, 13, "chiseled_stone_bricks"); }
const door = { facing: "north", hinge: "left", open: "false", powered: "false" };
g.set(6, 1, 13, "dark_oak_door", { ...door, half: "lower" });
g.set(6, 2, 13, "dark_oak_door", { ...door, half: "upper" });

// Glass panes joined to their neighbours in the wall plane; some lower panes lit from the room behind.
let panes = 0, lamps = 0;
for (const { x, y, z, dx, dz } of windows) {
  if (x === 6 && z === 13 && y <= 2) continue;
  const st = Object.fromEntries([["east", [1, 0]], ["west", [-1, 0]], ["south", [0, 1]], ["north", [0, -1]]]
    .map(([k, [ax, az]]) => [k, solid(x + ax, y, z + az) ? "true" : "false"]));
  g.set(x, y, z, "light_blue_stained_glass_pane", st); panes++;
  const [ix, iz] = [x - dx, z - dz];
  if ([1, 4, 7, 10, 13].includes(y) && (x + 2 * z + y) % 4 === 0 && inF(ix, iz) && y < top(ix, iz)) {
    g.set(ix, y, iz, (x + z) % 2 ? "shroomlight" : "glowstone"); lamps++;
  }
}

const out = g.save(`${DIR}/DC66210.nbt`);
console.log(`DC66210.nbt: ${out.blocks} blocks, ${out.palette} palette entries, ${panes} panes, ${lamps} lamps`);
