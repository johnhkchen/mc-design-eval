import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538617874";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 7, H = 23, D = 12;
const g = new Voxels([W, H, D]);

// Two-storey concrete shophouse-style block: stone plinth, shopfront on the
// ground storey, glazed upper storey with white concrete frames, a flat roof
// with a parapet and a small rooftop tank.
const ROOF = 11;     // roof deck (lidar: roof about 11 above lowest ground)
const PARAPET = 12;  // parapet course above the roof deck
const FLOOR = 5;     // storey line / floor slab between storeys
const BAND = 8;      // transom band in the upper storey

const occ = new Set(cells.map(([x, z]) => `${x},${z}`));
const has = (x, z) => occ.has(`${x},${z}`);

const edge = (x, z) =>
  !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);

const corner = (x, z) =>
  (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));

// Entrance on the south face (highest z), nearest to the middle of the frontage.
let doorCell = null;
for (const [x, z] of cells) {
  if (!has(x, z + 1)) {
    if (!doorCell || Math.abs(x - 3) < Math.abs(doorCell[0] - 3)) doorCell = [x, z];
  }
}

// Rooftop tank: an interior roof cell near the middle.
let tankCell = null;
for (const [x, z] of cells) {
  if (!edge(x, z) && x >= 2 && x <= 4) {
    if (!tankCell || Math.abs(z - 6) < Math.abs(tankCell[1] - 6)) tankCell = [x, z];
  }
}

for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gg = Math.max(0, Math.min(Math.round(gr), 10));
  const isEdge = edge(x, z);
  const isCorner = corner(x, z);
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gg; y++) g.set(x, y, z, "stone_bricks");

  // Floor slab / storey line and roof deck, every cell.
  g.set(x, FLOOR, z, "smooth_stone");
  g.set(x, ROOF, z, "smooth_stone");

  if (isEdge) {
    // Base course on the plinth.
    g.set(x, gg, z, "stone_bricks");

    // Ground storey: shopfront glazing with white concrete piers.
    for (let y = gg + 1; y <= FLOOR - 1; y++) {
      if (isCorner) {
        g.set(x, y, z, "white_concrete");
      } else if (isDoor) {
        if (y <= gg + 2) g.set(x, y, z, "dark_oak_planks");
        else g.set(x, y, z, "glass_pane");
      } else if ((x + z) % 2 === 0) {
        g.set(x, y, z, "glass_pane");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }

    // Upper storey: glazed bays in white concrete frames, transom band.
    for (let y = FLOOR + 1; y <= ROOF - 1; y++) {
      if (isCorner || y === BAND) {
        g.set(x, y, z, "white_concrete");
      } else if ((x + z) % 2 === 0) {
        g.set(x, y, z, "glass_pane");
      } else {
        g.set(x, y, z, "white_concrete");
      }
    }

    // Parapet course.
    g.set(x, PARAPET, z, "white_concrete");
  } else {
    // Interior: air gap, with a warm glowstone just behind some glass
    // sitting on the floor slab.
    if ((x * 3 + z * 5) % 4 === 0) g.set(x, FLOOR + 1, z, "glowstone");
  }
}

// Rooftop water tank on a single column.
if (tankCell) {
  const [tx, tz] = tankCell;
  for (let y = PARAPET; y <= PARAPET + 2; y++) g.set(tx, y, tz, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
