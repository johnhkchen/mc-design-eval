// DC60267: a four-storey Federal-style office block (limestone walls, granite base, chiseled string courses, a
// stepped roof: wings at 11, the ring at 12, a core at 13). The shell is a one-block wall with an air gap behind
// every window and a floor slab per storey; no interiors. Heights are the lidar roof (cells' fourth number) with
// three fixes: a hole in the core (6,3), and two cells that break the tiers ((6,5), (2,4)).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${OUT}/DC60267.cells.json`, "utf8"));

const X = 13, Z = 9, Y = 25;
const cell = Array.from({ length: X }, () => Array(Z).fill(null));
for (const [x, z, ground, roof] of cells) cell[x][z] = { ground, roof };

// tiers: the lidar roof, rounded to 11 / 12 / 13 with the three fixes above
const FIX = { "6,3": 13, "6,5": 12, "2,4": 12 };
const top = (x, z) => { const f = FIX[`${x},${z}`]; return f ?? cell[x][z].roof; };
const H = (x, z) => (cell[x]?.[z] ? top(x, z) : 0);
const inV = (x, y, z) => y >= 0 && y < H(x, z) && x >= 0 && x < X && z >= 0 && z < Z;

// storeys: string courses at y % 3 == 0, windows at the other rows, cornice on the top row
const isBand = (y) => y % 3 === 0;
const WALL = "calcite", BASE = "polished_granite", BAND = "chiseled_stone_bricks", SLAB = "smooth_stone";
const GLASS = "glass_pane", PARAPET = "stone_brick_wall";

const g = new Voxels([X, Y, Z]);
const parapets = new Set();
let lights = 0;

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!cell[x][z]) continue;
  const h = H(x, z);
  for (let y = 0; y < h; y++) {
    const east = !inV(x + 1, y, z), west = !inV(x - 1, y, z);
    const north = !inV(x, y, z - 1), south = !inV(x, y, z + 1);
    const horiz = east || west || north || south;
    const roofTop = !inV(x, y + 1, z);
    // the foundation and the base course: the bottom row, solid all round
    if (y === 0) { g.set(x, y, z, BASE); continue; }
    if (roofTop) {
      // the top surface: a cornice on the edge, roofing inside
      g.set(x, y, z, horiz ? BAND : SLAB);
      if (horiz) parapets.add(`${x},${y + 1},${z}`);
      continue;
    }
    if (!horiz) {
      // interior: a floor slab per storey, air between (no interiors; the air is behind the glass)
      if (isBand(y)) g.set(x, y, z, SLAB);
      continue;
    }
    // exterior wall: the face it sits on sets the bay grid (piers every third cell)
    const onZ = north || south;
    const i = onZ ? x : z;
    if (isBand(y)) { g.set(x, y, z, BAND); continue; }
    if (i % 3 === 0) { g.set(x, y, z, WALL); continue; }
    g.set(x, y, z, GLASS, { east: String(onZ), west: String(onZ), north: String(!onZ), south: String(!onZ), waterlogged: "false" });
    // a warm light behind some windows, on the lowest window row of the ground and the second storey
    if ((y === 1 || y === 7) && i % 6 === 2) {
      const bx = east ? x - 1 : west ? x + 1 : x;
      const bz = north ? z + 1 : south ? z - 1 : z;
      if (inV(bx, y, bz) && !(isBand(y)) && (bx !== x || bz !== z)) { g.set(bx, y, bz, "glowstone"); lights++; }
    }
  }
}

// the entrance: a pair of doors in the bay on the north face (z = 0), under the string course
const door = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
g.set(6, 1, 0, "iron_door", door("lower"));
g.set(6, 2, 0, "iron_door", door("upper"));

// the parapet: stone-brick walls round every tier edge, connected to their neighbours
for (const k of parapets) {
  const [x, y, z] = k.split(",").map(Number);
  const side = (dx, dz) => (parapets.has(`${x + dx},${y},${z + dz}`) ? "low" : "none");
  g.set(x, y, z, PARAPET, { up: "true", north: side(0, -1), south: side(0, 1), east: side(1, 0), west: side(-1, 0), waterlogged: "false" });
}

// roof equipment: two air-handling boxes on the core's roof, clear of its edge
g.set(7, 13, 4, "copper_block");
g.set(9, 13, 4, "copper_block");

const info = g.save(`${OUT}/DC60267.nbt`);
console.log(JSON.stringify({ ...info, lights, parapets: parapets.size }));
