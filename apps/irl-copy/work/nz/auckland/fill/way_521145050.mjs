// Way 521145050: a three-storey Edwardian brick shop-and-flat block (c.1910-1920s) on the Mt Eden / Newton edge.
// Red brick walls, a stone plinth and string courses, a timber shopfront with a door on the north (street) face,
// a parapet coping, and a lower two-storey wing on the west where the lidar roof drops to 11. Shell only: a
// floor slab per storey and an air gap behind every window; no interiors.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_521145050.cells.json", "utf8"));
const g = new Voxels([7, 26, 7]);

const cell = new Map(cells.map(([x, z, ground, roof]) => [`${x},${z}`, { ground, roof }]));
const has = (x, z) => cell.has(`${x},${z}`);
// which of the four sides of a cell face outside the footprint (0 = N z-1, 1 = S z+1, 2 = W x-1, 3 = E x+1)
const sides = (x, z) => [!has(x, z - 1), !has(x, z + 1), !has(x - 1, z), !has(x + 1, z)];
const isWall = (x, z) => sides(x, z).some(Boolean);
const isFront = (x, z) => sides(x, z)[0];                       // the north (street) face
const corner = (x, z) => sides(x, z).filter(Boolean).length >= 2;
// a window on a plain (single-face) wall cell, alternating with brick piers
const windowCell = (x, z) => isWall(x, z) && !corner(x, z) && (x + z) % 2 === 1;
const DOOR = [4, 0];

// the plan: every block by "x,y,z", so pane connections can be read off the finished wall
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(`${x},${y},${z}`, { block, state });
const at = (x, y, z) => plan.get(`${x},${y},${z}`)?.block ?? null;

for (const [key, { ground, roof }] of cell) {
  const [x, z] = key.split(",").map(Number);
  const top = roof - 1;                                        // last occupied row; the roof surface is top + 1
  const wall = isWall(x, z);
  for (let y = 0; y <= top; y++) {
    if (y < ground) { put(x, y, z, "stone_bricks"); continue; }     // foundation under the downhill ground
    if (!wall) {                                                   // interior: floor slab per storey, air between
      if (y === ground || y === 4 || y === 8 || y === top) put(x, y, z, "stone");
      continue;
    }
    if (y === ground) { put(x, y, z, "smooth_stone"); continue; }  // plinth course
    if (y === top) { put(x, y, z, "smooth_stone"); continue; }     // parapet coping, or wing cap
    if (y === 4 || y === 8) { put(x, y, z, "smooth_stone"); continue; }  // storey string courses
    if (y <= 3) {                                                  // ground storey: shopfront on the street face
      if (isFront(x, z) && y === 3) { put(x, y, z, "dark_oak_planks"); continue; }
      if (isFront(x, z) && x === DOOR[0] && z === DOOR[1]) {
        put(x, y, z, "oak_door", { facing: "south", half: y === ground + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
        continue;
      }
      // the shop window runs the whole street face, corners included; side walls take a window on alternate cells
      if (y > ground && y < 3 && (isFront(x, z) || (windowCell(x, z)))) { put(x, y, z, "glass_pane"); continue; }
      put(x, y, z, "bricks"); continue;
    }
    if (y === 5 || y === 6 || y === 9 || y === 10) {               // window rows (glass behind a 1-block wall)
      if (windowCell(x, z) && y < top) { put(x, y, z, "glass_pane"); continue; }
      put(x, y, z, "bricks"); continue;
    }
    put(x, y, z, "bricks");                                        // spandrels and lintels
  }
  // roof equipment on the core roof, and warm light behind the glass of some interior cells
  if (!wall) {
    if ((x + z) % 3 === 0) put(x, top + 1, z, "light_gray_concrete");
    if (x === 4 && z === 2) put(x, top + 1, z, "lightning_rod");
    if ((x * 3 + z * 5) % 4 === 0) { put(x, 6, z, "glowstone"); put(x, 10, z, "glowstone"); }
  }
}

// panes connect to the block beside them along the wall they sit in, as in vanilla
for (const [k, b] of plan) {
  if (b.block !== "glass_pane") continue;
  const [x, y, z] = k.split(",").map(Number);
  const [n, s, w, e] = sides(x, z);
  const onNorthSouth = n || s, onWestEast = w || e;       // a pane on a north/south face runs east-west, and the reverse
  const joins = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
  b.state = {
    north: onWestEast ? joins(0, -1) : "false",
    south: onWestEast ? joins(0, 1) : "false",
    east: onNorthSouth ? joins(1, 0) : "false",
    west: onNorthSouth ? joins(-1, 0) : "false",
    waterlogged: "false",
  };
}

for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}

g.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_521145050.nbt");
