// 148 West 49th Street, 1920 mixed residential and commercial midblock building: a four-storey brick front with
// stone storey lines and a cornice, a shopfront and entrance at street level, and a two-storey and a one-storey rear wing.
// Footprint 6 x 27 (x = street frontage, z = depth, low z = north = the street side). Solid brick mass (no rooms), with
// an air gap behind each glass pane and warm glowstone behind a few of them.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1022698.cells.json`, "utf8"));
const X = 6, Z = 27, H = 26;

// Roof tiers, read from the lidar medians and flattened: the body (z 0-14) sits on 11 with a 1-block parapet to 12
// (its 14s on the east edge are noise); the rear wing settles on 6 (z 15-21) and 4 (z 22-26).
const tall = (z) => z <= 14;
const roofAt = (x, z) => (tall(z) ? 12 : z <= 21 ? 6 : 4);
const perimeter = (x, z) => x === 0 || x === X - 1 || z === 0 || z === Z - 1 || (z === 14 && tall(z));

const footprint = new Map(cells.map(([x, z, ground]) => [`${x},${z}`, ground]));
if (footprint.size !== X * Z) throw new Error(`footprint has ${footprint.size} cells, want ${X * Z}`);

const g = new Voxels([X, H, Z]);
// Walls and storey lines stay under the roof; the parapet (y 12, on the body's edge) is the only block above it.
const put = (x, y, z, block, state) => {
  if (y >= roofAt(x, z) && !(tall(z) && y === 12 && perimeter(x, z))) throw new Error(`block above roof at ${x},${y},${z}`);
  g.set(x, y, z, block, state);
};

// Glass in a wall that runs along x (front, rear). Panes connect east and west.
const pane = { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
const door = (facing, half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
const glass = (x, y, z, { lit = false, behind } = {}) => {
  put(x, y, z, "glass_pane", pane);
  put(x, y, z + behind, lit ? "glowstone" : "air");
};

// 1. Solid mass on the footprint: brick walls, a tar roof on each top, a stone cornice and parapet on the body.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  const roof = roofAt(x, z);
  for (let y = 0; y < roof; y++) put(x, y, z, "bricks");
  put(x, roof - 1, z, "gray_concrete");
  if (tall(z) && perimeter(x, z)) { put(x, 11, z, "stone_bricks"); put(x, 12, z, "stone_bricks"); }
  if (!tall(z) && z >= 22 && perimeter(x, z)) put(x, 3, z, "stone_bricks");
}

// 2. Storey lines on the outside faces: stone bands at street level, 3, 6 and 9 blocks up.
for (let z = 0; z < Z; z++) for (let x = 0; x < X; x++) {
  if (!perimeter(x, z)) continue;
  for (const y of [0, 3, 6, 9]) if (y < roofAt(x, z)) put(x, y, z, "stone_bricks");
}

// 3. Front (z 0, street): dark fascia over the shopfront, storey windows with stone mullions, shopfront, door.
for (let x = 0; x < X; x++) put(x, 3, 0, "dark_oak_planks");
for (const y of [4, 5, 7, 8, 10]) for (const x of [1, 4]) put(x, y, 0, "stone_bricks");
for (const y of [1, 2]) put(1, y, 0, "dark_oak_door", door("south", y === 1 ? "lower" : "upper"));
for (const [x, y] of [[2, 4], [3, 4], [2, 5], [3, 5], [2, 7], [3, 7], [2, 8], [3, 8], [2, 10], [3, 10]]) glass(x, y, 0, { behind: 1, lit: (x === 3 && y === 4) || (x === 2 && y === 7) || (x === 3 && y === 10) });
for (const [x, y] of [[2, 1], [3, 1], [4, 1], [2, 2], [3, 2], [4, 2]]) glass(x, y, 0, { behind: 1, lit: x === 4 && y === 1 });

// 4. Rear of the body (z 14, above the wing): three storeys of windows over the wing roof.
for (let x = 0; x < X; x++) for (const y of [6, 9]) put(x, y, 14, "stone_bricks");
for (const y of [7, 8, 10]) for (const x of [1, 4]) put(x, y, 14, "stone_bricks");
for (const [x, y] of [[2, 7], [3, 7], [2, 8], [3, 8], [2, 10], [3, 10]]) glass(x, y, 14, { behind: -1, lit: x === 3 && y === 8 });

// 5. Rear wing (z 26): a service door and two shop-scale windows on the ground storey.
for (const y of [1, 2]) put(4, y, 26, "dark_oak_door", door("north", y === 1 ? "lower" : "upper"));
for (const y of [1, 2]) put(1, y, 26, "stone_bricks");
for (const [x, y] of [[2, 1], [3, 1], [2, 2], [3, 2]]) glass(x, y, 26, { behind: -1, lit: x === 2 && y === 1 });

// 6. Side walls are party walls: plain brick between the stone storey lines. A stone bulkhead (stair and lift housing)
// stands on the body's tar roof, inside the parapet.
for (const z of [5, 6]) for (const x of [2, 3]) for (const y of [12, 13]) g.set(x, y, z, "stone_bricks");

// The front and rear doors open onto air (glass() already clears the windows' gaps).
g.set(1, 1, 1, "air"); g.set(1, 2, 1, "air"); g.set(4, 1, 25, "air"); g.set(4, 2, 25, "air");

const { blocks, palette } = g.save(`${DIR}/NYC1022698.nbt`);
console.log(`NYC1022698: ${blocks} blocks, ${palette} palette entries`);
