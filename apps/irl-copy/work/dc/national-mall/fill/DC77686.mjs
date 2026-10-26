// 1121 5th St NW: a 1900s red-brick industrial warehouse, two-storey wings with a stepped tower at the south-east.
// Lidar roof heights, smoothed into flat tiers: main 4 blocks (2 storeys of 2), west bay 5, podium 6 (x 10-11),
// tower core 7 (x 12) and crown 8 (x 13-14). Every column fills contiguously from y 0 (ground is 0 everywhere),
// so each tier stands on the one below. The walls are a shell: interior air, floor slabs where there is headroom.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC77686.cells.json`, "utf8"));
const W = 15, D = 8, H = 20;

const ground = new Map(cells.map(([x, z, g]) => [`${x},${z}`, g]));
const onFoot = (x, z) => x >= 0 && x < W && z >= 0 && z < D && ground.has(`${x},${z}`);

// the smoothed roof: top of each footprint cell, in blocks above y 0
function roofTop(x, z) {
  if (z >= 6) {
    if (x >= 13) return 8;
    if (x === 12) return 7;
    if (x >= 10 && x <= 11) return 6;
    if (x <= 1) return 5;
  }
  return 4;
}
const top = (x, z) => (onFoot(x, z) ? roofTop(x, z) : 0);

// a side is exposed where the neighbour is off the footprint or stands no higher than this row
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isWall = (x, z, y) => NB.some(([dx, dz]) => top(x + dx, z + dz) <= y);
const zFace = (x, z, y) => [[0, 1], [0, -1]].some(([, dz]) => top(x, z + dz) <= y);

// the wall: a plinth, then storeys of 2 rows: stone storey lines on even rows, glazed bays and brick piers on odd rows
function wallBlock(x, z, y) {
  if (y === 0) return ["polished_granite"];
  if (y % 2 === 0) return ["stone_bricks"];
  const zf = zFace(x, z, y);
  const a = zf ? x : z, L = zf ? W : D;
  if (a === 0 || a === L - 1 || a % 3 === 0) return ["bricks"];
  const pane = zf
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return ["glass_pane", pane];
}

const g = new Voxels([W, H, D]);
for (let z = 0; z < D; z++) for (let x = 0; x < W; x++) {
  if (!onFoot(x, z)) continue;
  const r = roofTop(x, z), gr = ground.get(`${x},${z}`);
  for (let y = 0; y < gr; y++) g.set(x, y, z, "smooth_stone");                  // foundation (ground is 0 here)
  for (let y = gr; y < r; y++) {
    const wall = isWall(x, z, y);
    if (wall) { const [b, s] = wallBlock(x, z, y); g.set(x, y, z, b, s); }
    else if (y === r - 1) g.set(x, y, z, "stone");                               // roof covering
    else if (y === 0 || (y % 2 === 0 && y >= 4 && y <= r - 4)) g.set(x, y, z, "smooth_stone"); // storey floors
  }
  if (isWall(x, z, r - 1)) g.set(x, r, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // cornice coping
}

// warm light behind the ground-floor glass (on the floor slab, so nothing hangs)
for (const [x, z] of [[4, 1], [10, 1], [1, 6], [13, 6]]) g.set(x, 1, z, "glowstone");

// entrances: a dark oak door on the street (north) face under a stone canopy, an iron loading door on the south face
g.set(7, 0, 0, "dark_oak_door", { facing: "north", hinge: "left", half: "lower", open: "false", powered: "false" });
g.set(7, 1, 0, "dark_oak_door", { facing: "north", hinge: "left", half: "upper", open: "false", powered: "false" });
for (const x of [6, 7, 8]) g.set(x, 2, 0, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
g.set(2, 0, 7, "iron_door", { facing: "south", hinge: "left", half: "lower", open: "false", powered: "false" });
g.set(2, 1, 7, "iron_door", { facing: "south", hinge: "left", half: "upper", open: "false", powered: "false" });

// roof plant: a 2 x 2 air-handling housing on the main roof, stone walls with a slab lid
for (const [x, z] of [[3, 2], [4, 2], [3, 3], [4, 3]]) {
  g.set(x, 4, z, "stone_bricks");
  g.set(x, 5, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

console.log(g.save(`${DIR}/DC77686.nbt`));
