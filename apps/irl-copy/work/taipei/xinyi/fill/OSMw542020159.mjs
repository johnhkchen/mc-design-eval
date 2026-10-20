import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020159";
const W = 8, H = 23, D = 21;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Exposed sides and perimeter tests for each footprint cell
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const xFace = (x, z) => !has(x - 1, z) || !has(x + 1, z);
const zFace = (x, z) => !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => xFace(x, z) && zFace(x, z);

// Entrance: on the north-exposed (street) face, nearest the middle of the frontage
const doorCands = cells
  .filter(([x, z]) => !has(x, z - 1) && !isCorner(x, z))
  .sort((a, b) => Math.abs(a[0] - 3.5) - Math.abs(b[0] - 3.5));
const door = doorCands.length ? [doorCands[0][0], doorCands[0][1]] : null;

for (const [x, z, gr] of cells) {
  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const B = gr;
  const perim = isPerim(x, z);

  if (!perim) {
    // Interior: floor slabs and roof deck only, air between
    put(x, B, z, "smooth_stone");
    put(x, B + 5, z, "smooth_stone");
    put(x, B + 10, z, "smooth_stone");
    continue;
  }

  const corner = isCorner(x, z);
  const isDoor = door && door[0] === x && door[1] === z;

  // Base course and plinth
  put(x, B, z, "polished_andesite");
  put(x, B + 1, z, "polished_andesite");

  // Shopfront storey (B+1 .. B+4)
  if (isDoor) {
    const dp = { facing: "north", hinge: "left", open: "false", powered: "false" };
    put(x, B + 1, z, "dark_oak_door", { ...dp, half: "lower" });
    put(x, B + 2, z, "dark_oak_door", { ...dp, half: "upper" });
    put(x, B + 3, z, "glass_pane");
    put(x, B + 4, z, "smooth_stone");
  } else {
    put(x, B + 2, z, corner ? "quartz_block" : "glass_pane");
    if (!corner && (x + 2 * z) % 5 === 0) put(x, B + 3, z, "glowstone");
    else put(x, B + 3, z, corner ? "quartz_block" : "glass_pane");
    put(x, B + 4, z, "smooth_stone"); // fascia band
  }

  // Storey line
  put(x, B + 5, z, "quartz_block");

  // Upper storey (B+6 .. B+9): spandrels and windows
  put(x, B + 6, z, corner ? "quartz_block" : "white_concrete");
  const win = !corner && (zFace(x, z) ? x % 2 === 0 : z % 2 === 0);
  for (const y of [B + 7, B + 8]) {
    if (corner) put(x, y, z, "quartz_block");
    else if (win) {
      if (y === B + 7 && (x * 5 + z * 3) % 9 === 0) put(x, y, z, "glowstone");
      else put(x, y, z, "glass_pane");
    } else put(x, y, z, "white_concrete");
  }
  put(x, B + 9, z, corner ? "quartz_block" : "white_concrete");

  // Roof edge cornice and parapet
  put(x, B + 10, z, "smooth_stone");
  put(x, B + 11, z, corner ? "quartz_block" : "white_concrete");
}

// Roof equipment: a plant box on the interior roof deck
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if (x >= 2 && x <= 5 && z >= 6 && z <= 8) {
    put(x, gr + 11, z, "light_gray_concrete");
  }
}
// Two vent stacks on top of the plant box
for (const [x, z, gr] of cells) {
  if (isPerim(x, z)) continue;
  if ((x === 3 || x === 4) && z === 7) put(x, gr + 12, z, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
