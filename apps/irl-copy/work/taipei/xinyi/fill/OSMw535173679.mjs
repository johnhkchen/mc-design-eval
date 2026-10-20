import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw535173679";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Low-rise Xinyi-style commercial/office block, two storeys, ~11 blocks to parapet.
const W = 14, H = 23, D = 22;
const g = new Voxels([W, H, D]);

const TOP = 10;      // top of wall / roof deck
const ROOF = 11;     // parapet course
const LINE = 5;      // storey line between floors

const cellMap = new Map();
for (const [x, z, gr] of cells) cellMap.set(`${x},${z}`, gr);
const has = (x, z) => cellMap.has(`${x},${z}`);

// Entrance: southern-most open edge (no neighbour at +z), nearest the footprint centre in x.
let cx = 0, n = 0;
for (const [x] of cells) { cx += x; n++; }
cx = n ? cx / n : W / 2;
let doorCell = null;
for (const [x, z, gr] of cells) {
  if (has(x, z + 1)) continue;
  if (!doorCell || Math.abs(x - cx) < Math.abs(doorCell.x - cx)) {
    doorCell = { x, z, gr };
  }
}

// Rooftop plant: a few AC boxes on interior roof cells.
const plant = new Set();
for (const [x, z, gr] of cells) {
  if (gr > TOP) continue;
  const perim = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
  if (!perim && x % 5 === 2 && z % 6 === 3) plant.add(`${x},${z}`);
}

for (const [x, z, gnd] of cells) {
  const gr = Math.max(0, Math.min(gnd, TOP));

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gnd && y < H; y++) g.set(x, y, z, "stone_bricks");
  if (gnd > TOP) continue;

  const nN = has(x, z - 1), nS = has(x, z + 1), nW = has(x - 1, z), nE = has(x + 1, z);
  const perim = !nN || !nS || !nW || !nE;
  const corner = (!nW || !nE) && (!nN || !nS);

  if (!perim) {
    // Interior: floor slabs and roof deck only; air behind everything else.
    g.set(x, gnd, z, "smooth_stone");
    if (LINE > gnd) g.set(x, LINE, z, "smooth_stone");
    g.set(x, TOP, z, "smooth_stone");
    if (plant.has(`${x},${z}`)) {
      g.set(x, ROOF, z, "iron_block");
    }
    continue;
  }

  const winCol = !corner && ((x + z) % 3 !== 0);
  const lit = ((x * 3 + z * 5) % 7 === 0);

  for (let y = gnd; y <= TOP; y++) {
    let mat = "white_concrete";
    if (corner) mat = "gray_concrete";
    if (y === gnd) mat = "stone_bricks";
    if (y === LINE || y === TOP) mat = "gray_concrete";

    const groundWin = winCol && y > gnd && y <= Math.min(gnd + 3, LINE - 1);
    const upperWin = winCol && y >= 6 && y <= 8;
    if (groundWin || upperWin) {
      mat = "light_blue_stained_glass";
      if (upperWin && y === 7 && lit) mat = "glowstone";
    }
    g.set(x, y, z, mat);
  }

  // Interior floor under the perimeter wall ring.
  g.set(x, gnd, z, corner ? "gray_concrete" : "stone_bricks");
  if (LINE > gnd) {
    // Floor-2 line already set by wall loop; nothing extra.
  }

  // Parapet with cornice slab.
  g.set(x, ROOF, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// Entrance door and canopy on the southern facade.
if (doorCell) {
  const { x, z, gr } = doorCell;
  const base = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(x, gr + 1, z, "dark_oak_door", { ...base, half: "lower" });
  g.set(x, gr + 2, z, "dark_oak_door", { ...base, half: "upper" });
  g.set(x, gr + 3, z, "gray_concrete");
  for (let y = gr + 1; y <= gr + 2; y++) {
    // Clear any glass/glowstone beside the door at ground level.
    if (has(x - 1, z)) g.set(x - 1, y, z, "white_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
