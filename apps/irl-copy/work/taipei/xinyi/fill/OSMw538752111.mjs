import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538752111";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 17, H = 23, D = 25;
const g = new Voxels([W, H, D]);

// Record: low-rise, roof ~11 blocks above lowest ground -> two storeys plus parapet.
// Era: 1970s-80s Taipei commercial block. Reinforced concrete, white render,
// stone-brick base, light-grey pilasters, glazed shopfront, aluminium-look frames.
const ROOF = 11;     // parapet cap top (absolute y)
const DECK = 10;     // roof slab under parapet
const SLAB2 = 5;     // storey line between storeys

const WALL = "white_concrete";
const TRIM = "light_gray_concrete";
const BASE = "stone_bricks";
const FOUND = "stone_bricks";
const FLOOR = "smooth_stone";
const GLASS = "glass";
const CAP = "stone_brick_slab";

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const DIRS = [[1, 0, "east"], [-1, 0, "west"], [0, 1, "south"], [0, -1, "north"]];

// Front facade: the footprint's minimum-z edge, door near the middle.
let minZ = Infinity, maxX = -Infinity, minX = Infinity;
for (const [x, z] of G.keys().map(k => k.split(",").map(Number))) {
  minZ = Math.min(minZ, z); maxX = Math.max(maxX, x); minX = Math.min(minX, x);
}
const doorX = Math.round((minX + maxX) / 2);

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);
  g.set(x, gr, z, FLOOR);                 // ground floor slab
  g.set(x, SLAB2, z, TRIM);               // storey line (slab under storey 2)
  g.set(x, DECK, z, TRIM);                // roof deck

  const edgeDirs = DIRS.filter(([dx, dz]) => !has(x + dx, z + dz));
  if (edgeDirs.length === 0) continue;

  const isEdge = edgeDirs.length > 0;
  const windowCell = (x + z) % 3 !== 0;   // bays: pilasters every third cell
  const onFront = z === minZ;

  // Base course at ground + 1 on the perimeter
  if (gr + 1 <= 4) g.set(x, gr + 1, z, BASE);

  // Ground floor (storey 1): shopfront glazing with a fascia band above
  for (let y = gr + 2; y <= 3; y++) {
    if (onFront && x === doorX) {
      if (y === gr + 2) g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      else g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    } else {
      g.set(x, y, z, windowCell ? GLASS : TRIM);
    }
  }
  if (gr + 4 <= 4) g.set(x, 4, z, TRIM);  // fascia band

  // Storey 2: sill, glazing, lintel
  g.set(x, 6, z, windowCell ? TRIM : WALL);
  for (let y = 7; y <= 8; y++) g.set(x, y, z, windowCell ? GLASS : WALL);
  g.set(x, 9, z, TRIM);

  // Parapet and cap on the perimeter
  g.set(x, 10, z, WALL);
  g.set(x, 11, z, CAP, { type: "bottom", waterlogged: "false" });

  // Warm light behind some storey-2 windows
  if (windowCell && (x + z) % 6 === 1) {
    const inward = DIRS.find(([dx, dz]) => has(x - dx, z - dz) && (has(x + dx, z + dz) === false));
    if (inward) {
      const ix = x - inward[0], iz = z - inward[1];
      g.set(ix, 7, iz, "glowstone");
    }
  }
  // A few warm lights on the ground floor
  if (windowCell && (x + z) % 9 === 4 && gr + 2 <= 3) {
    const inward = DIRS.find(([dx, dz]) => has(x - dx, z - dz));
    if (inward) g.set(x - inward[0], gr + 2, z - inward[1], "shroomlight");
  }
}

// Roof equipment: water tank on the deck and a small stair-and-plant housing.
for (let x = 5; x <= 7; x++) for (let z = 16; z <= 18; z++) {
  if (!has(x, z)) continue;
  for (let y = ROOF; y <= ROOF + 2; y++) g.set(x, y, z, "iron_block");
}
for (let x = 11; x <= 13; x++) for (let z = 4; z <= 6; z++) {
  if (!has(x, z)) continue;
  for (let y = ROOF; y <= ROOF + 1; y++) g.set(x, y, z, WALL);
  g.set(x, ROOF + 2, z, TRIM);
}
// Air-conditioning units on the deck
for (const [x, z] of [[2, 3], [3, 3], [2, 21], [3, 21]]) {
  if (has(x, z)) g.set(x, ROOF, z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
