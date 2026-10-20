import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no entry for OSMw1174690434. Read as a two-storey, flat-roofed
// concrete commercial block with a stone base, glazed shopfront, and a
// parapet, typical of Xinyi low-rise frontage from the 1970s-80s.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1174690434";

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 19, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// Levels (absolute y, with y 0 = lowest ground):
//  ground storey  gy .. 4   (lintel band at 4)
//  floor line     5
//  upper storey   6 .. 9    (sill 6, lintel 9)
//  roof slab      10        (cornice on edges)
//  parapet        11
const GROUND_TOP = 4;
const FLOOR_LINE = 5;
const UPPER_TOP = 9;
const ROOF = 10;
const PARAPET = 11;

const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

// Front face is the z = 0 row; entrance sits on the middle bay.
const DOOR_X = 9;

for (const [x, z, gy] of cells) {
  const xm = has(x - 1, z), xp = has(x + 1, z);
  const zm = has(x, z - 1), zp = has(x, z + 1);
  const edge = !(xm && xp && zm && zp);
  const corner = (!xm || !xp) && (!zm || !zp);
  const pier = (x + z) % 3 === 0;
  const isDoorCol = z === 0 && x === DOOR_X;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gy; y++) g.set(x, y, z, "stone_bricks");

  // Ground floor slab / base course.
  if (edge) g.set(x, gy, z, "polished_andesite");
  else g.set(x, gy, z, "smooth_stone");

  // Ground storey walls (commercial shopfront).
  for (let y = gy + 1; y <= GROUND_TOP; y++) {
    if (!edge) continue; // interior: air gap
    if (y === GROUND_TOP) {
      g.set(x, y, z, "light_gray_concrete"); // fascia band
    } else if (corner) {
      g.set(x, y, z, "light_gray_concrete");
    } else if (isDoorCol && (y === gy + 1 || y === gy + 2)) {
      g.set(x, y, z, "oak_door", {
        facing: "north",
        half: y === gy + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
    } else if (isDoorCol && y === gy + 3) {
      g.set(x, y, z, "light_gray_concrete"); // lintel over entrance
    } else if (pier) {
      g.set(x, y, z, "white_concrete");
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Storey line at the floor level, every cell (slab across the plan).
  if (FLOOR_LINE > gy) g.set(x, FLOOR_LINE, z, "smooth_stone");

  // Upper storey walls.
  for (let y = FLOOR_LINE + 1; y <= UPPER_TOP; y++) {
    if (!edge) continue; // interior: air gap
    if (corner) {
      g.set(x, y, z, "light_gray_concrete");
    } else if (y === 6 || y === 9) {
      g.set(x, y, z, "light_gray_concrete"); // sill and lintel bands
    } else if (pier) {
      g.set(x, y, z, "white_concrete");
    } else if (y === 7 && (x * 3 + z) % 7 === 0) {
      g.set(x, y, z, "glowstone"); // warm light behind glass
    } else {
      g.set(x, y, z, "light_blue_stained_glass");
    }
  }

  // Roof slab and cornice.
  if (edge) g.set(x, ROOF, z, corner ? "light_gray_concrete" : "smooth_stone");
  else g.set(x, ROOF, z, "light_gray_concrete");

  // Parapet.
  if (edge) g.set(x, PARAPET, z, corner ? "light_gray_concrete" : "white_concrete");
}

// Roof equipment: AC units, a small plant block, and a lightning rod.
const units = [
  [6, 8], [7, 8], [8, 8],
  [6, 9], [7, 9], [8, 9],
  [12, 14], [13, 14],
  [12, 15], [13, 15],
];
for (const [x, z] of units) {
  if (has(x, z)) g.set(x, PARAPET, z, "iron_block");
}
if (has(9, 12)) {
  g.set(9, PARAPET, 12, "light_gray_concrete");
  g.set(9, PARAPET + 1, 12, "lightning_rod");
  g.set(9, PARAPET + 2, 12, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
