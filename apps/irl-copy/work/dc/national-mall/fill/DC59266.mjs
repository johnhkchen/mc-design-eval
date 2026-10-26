// DC59266: a 3-storey Federal-style office block (red brick on a buff limestone base, string courses and a cornice),
// set on the lidar footprint. Massing: a 9-high core, an 8-high central pavilion and setback ring, 7-high wings,
// 6-high low wings on the west and east ends. Solid shell, floor slabs at y 0/3/6, air between them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC59266.cells.json`, "utf8"));   // [x, z, ground, roof]

const key = (x, y, z) => `${x},${y},${z}`;
const DIRS = [
  { name: "north", dx: 0, dz: -1 },
  { name: "south", dx: 0, dz: 1 },
  { name: "west", dx: -1, dz: 0 },
  { name: "east", dx: 1, dz: 0 },
];

// smoothed storey height per footprint cell (top surface = H, solid y 0..H-1)
function tierOf(x, z, lidar) {
  if (lidar <= 1) return 1;                                   // a sliver at the corner: plinth only
  if (x >= 3 && x <= 6 && z >= 2 && z <= 6) return 9;         // the core
  if (z <= 1 && x >= 5 && x <= 7) return 8;                   // central pavilion, front
  if (x >= 7 && x <= 8 && z >= 3 && z <= 5) return 8;         // setback ring around the core
  if (x === 10 || x <= 1) return 6;                           // low wings at the ends
  return 7;
}

const H = new Map(); const L = new Map();
for (const [x, z, , r] of cells) { H.set(`${x},${z}`, tierOf(x, z, r)); L.set(`${x},${z}`, r); }
const height = (x, z) => H.get(`${x},${z}`) ?? 0;

// S: every cell of the massing solid; carved: interior cells (six solid neighbours) that are not a floor slab
const S = new Set();
for (const [x, z] of cells.map(([x, z]) => [x, z])) for (let y = 0; y < height(x, z); y++) S.add(key(x, y, z));
const isFloor = (y) => y === 0 || y === 3 || y === 6;
const carved = new Set();
for (const k of S) {
  const [x, y, z] = k.split(",").map(Number);
  if (isFloor(y)) continue;
  const six = [[1, 0, 0], [-1, 0, 0], [0, 1, 0], [0, -1, 0], [0, 0, 1], [0, 0, -1]];
  if (six.every(([a, b, c]) => S.has(key(x + a, y + b, z + c)))) carved.add(k);
}
const T = new Set([...S].filter((k) => !carved.has(k)));  // the shell and the floor slabs

const exposedSides = (x, y, z) => DIRS.filter((d) => !S.has(key(x + d.dx, y, z + d.dz)));
const winRow = (y) => y === 1 || y === 2 || y === 4 || y === 5 || y === 7;

const g = new Voxels([12, 21, 9]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

for (const k of T) {
  const [x, y, z] = k.split(",").map(Number);
  const sides = exposedSides(x, y, z);
  const top = !S.has(key(x, y + 1, z));
  if (y === 0 || top) { put(x, y, z, "smooth_sandstone"); continue; }     // plinth and cornice / parapet
  if (isFloor(y)) {                                                        // floor slab: string course on the shell
    put(x, y, z, sides.length ? "smooth_sandstone" : "stone_bricks"); continue;
  }
  if (sides.length >= 2) { put(x, y, z, "smooth_sandstone"); continue; }    // quoin at the corners
  if (sides.length === 0) { put(x, y, z, "stone_bricks"); continue; }
  const d = sides[0];
  const along = d.dz === 0 ? x : z;                                         // position along the face
  if (winRow(y) && along % 3 !== 0) {                                       // two panes between brick piers
    const wallAlongX = d.dz !== 0;
    put(x, y, z, "glass_pane", wallAlongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" });
  } else {
    put(x, y, z, "bricks");
  }
}

// entrance on the front (z 0): door under the pavilion, smooth-stone pilasters either side
for (const x of [5, 6, 7]) for (const y of [1, 2]) {
  if (!T.has(key(x, y, 0))) continue;
  if (x === 6) {
    const half = y === 1 ? "lower" : "upper";
    put(x, y, 0, "dark_oak_door", { facing: "south", half, hinge: "left", open: "false", powered: "false" });
  } else {
    put(x, y, 0, "smooth_sandstone");
  }
}

// warm light behind a few panes only, on the bottom row of each storey (the air behind the pane is empty)
for (const k of T) {
  const [x, y, z] = k.split(",").map(Number);
  if (y !== 1 && y !== 4 && y !== 7) continue;
  const sides = exposedSides(x, y, z);
  if (sides.length !== 1 || (x * 2 + z + y) % 11 !== 0) continue;
  const d = sides[0];
  const inward = key(x - d.dx, y, z - d.dz);
  if (!T.has(inward)) put(x - d.dx, y, z - d.dz, "glowstone");
}

// lanterns on the corners of the roofs
for (const k of T) {
  const [x, y, z] = k.split(",").map(Number);
  const top = !S.has(key(x, y + 1, z));
  if (!top || (x + z) % 2 !== 0) continue;
  const corner = exposedSides(x, y, z).length >= 2;
  if (corner && (height(x, z) === 7 || height(x, z) === 9)) put(x, y + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
}

// roof penthouse on the core: a 3 x 3 brick box, glass on each face, stone roof, rests on the core's cornice
for (let x = 4; x <= 6; x++) for (let z = 3; z <= 5; z++) {
  const edge = x === 4 || x === 6 || z === 3 || z === 5;
  put(x, 10, z, "smooth_sandstone");
  if (!edge) continue;
  const mid = (x === 5 && z !== 4) || (z === 4 && x !== 5);
  put(x, 9, z, mid ? "glass_pane" : "bricks", mid
    ? (x === 5 ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
               : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" })
    : undefined);
}

const info = g.save(`${DIR}/DC59266.nbt`);
console.log(JSON.stringify({ cells: cells.length, solid: T.size, ...info }));
