// 1722 19th St NW: a 3-storey brick apartment block on a calcite base and cornice, with a penthouse
// stair/lift core on the roof. The footprint is an H: a central bar (z 3..7) across the full width with
// two wings (x 0..3, x 13..17) and two open forecourts (x 4..12) on the north and south faces.
// Lidar roof: 11 blocks everywhere except a 2 x 5 block at x 13..14, z 3..7, which reads 12 (the core).
// Stray 12s at x 0, z 2..3 are noise and are smoothed to 11.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC80765.cells.json`, "utf8"));

const has = new Set(cells.map(([x, z]) => `${x},${z}`));
const inFp = (x, z) => has.has(`${x},${z}`);
const ROOF = 11;                                   // body roof (lidar 11): solid layers y 0..10, the top surface at 11
const core = (x, z) => x >= 13 && x <= 14 && z >= 3 && z <= 7;   // lidar 12: a single block above the body
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };  // outward normals (N is z-1, the street-side of the wings)
const facades = (x, z) => Object.keys(DIRS).filter((k) => !inFp(x + DIRS[k][0], z + DIRS[k][1]));

const g = new Voxels([18, 24, 11]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// Window band: a 5-block bay along each face, brick pier, glass, white sash, glass, brick pier; quoins at corners.
function faceBlock(x, z, f) {
  if (f.length >= 2) return ["calcite"];
  const face = f[0];
  const alongX = face === "N" || face === "S";
  const u = alongX ? x : z;
  const m = u % 5;
  if (m === 0 || m === 4) return ["bricks"];
  if (m === 2) return ["white_concrete"];
  return ["glass_pane", alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
}

// Entrances in the central bar's north and south faces: calcite pilasters either side of a door.
const doors = [
  { x: 8, z: 3, facing: "north" },
  { x: 8, z: 7, facing: "south" },
];
const isDoorPortal = (x, z) => doors.some((d) => Math.abs(d.x - x) === 1 && d.z === z);

for (const [x, z] of cells) {
  const f = facades(x, z), ext = f.length > 0;
  // base course, storey floors and the roof slab run across the whole footprint; the ext walls go on the perimeter
  put(x, 0, z, ext ? "calcite" : "stone_bricks");
  // string courses (y3 lintel, y7 sill) and the cornice (y10) in calcite; the y4 spandrel is brick
  put(x, 3, z, ext ? "calcite" : "stone");
  put(x, 4, z, ext ? "bricks" : "stone");
  put(x, 7, z, ext ? "calcite" : "stone");
  put(x, 10, z, ext ? "calcite" : "stone");
  // window bands: y1-2 ground, y5-6 storey 2, y8-9 storey 3
  for (const y of [1, 2, 5, 6, 8, 9]) {
    if (!ext) continue;
    const [blk, st] = faceBlock(x, z, f);
    put(x, y, z, blk, st);
  }
  // penthouse core: the top block, glass on its end walls
  if (core(x, z)) {
    const endWall = z === 3 || z === 7;
    put(x, 11, z, endWall ? "glass_pane" : "bricks", endWall
      ? { north: z === 3 ? "true" : "false", south: z === 7 ? "true" : "false", east: "true", west: "true", waterlogged: "false" }
      : undefined);
  }
}

// Doors: lower and upper halves, with calcite pilasters beside each.
for (const d of doors) {
  put(d.x, 1, d.z, "dark_oak_door", { facing: d.facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  put(d.x, 2, d.z, "dark_oak_door", { facing: d.facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  for (const y of [1, 2]) for (const dx of [-1, 1]) put(d.x + dx, y, d.z, "calcite");
}

// Warm light in some windows: a glowstone two cells back, behind a one-cell air gap, in the interior only.
for (const [x, z] of cells) {
  const f = facades(x, z);
  if (f.length !== 1 || isDoorPortal(x, z)) continue;
  const [dx, dz] = DIRS[f[0]];
  const bx = x - 2 * dx, bz = z - 2 * dz;   // inward: the opposite of the outward normal
  if (!inFp(bx, bz) || facades(bx, bz).length) continue;
  for (const y of [1, 5, 8]) {
    if (((x * 3 + z * 5 + y) % 7) !== 0) continue;
    const [blk] = faceBlock(x, z, f);
    if (blk === "glass_pane") put(bx, y, bz, "glowstone");
  }
}

// Roof plant: two air-conditioning units on the roof, inside the footprint.
put(2, 11, 5, "light_gray_concrete"); put(2, 11, 6, "light_gray_concrete");

g.save(`${DIR}/DC80765.nbt`);
console.log("built", g.count(), "blocks, palette", g.palette.length);
